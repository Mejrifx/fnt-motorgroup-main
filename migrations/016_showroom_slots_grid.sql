-- ============================================================================
-- Showroom Parking v2: birds-eye grid with drag & drop
-- ============================================================================
-- Replaces the old "lanes" model (showroom_rows + showroom_cars.row_id /
-- position_in_row) with a slot-based grid that mirrors the physical layout:
--   - LEFT zone: ~10 "lanes" against the wall, each lane holds up to 2 cars
--     nose-to-tail (depth 1 = aisle/exit side, depth 2 = against the wall).
--     A depth-1 car blocks the depth-2 car behind it.
--   - RIGHT zone: a single row of independent bays — no blocking, any car
--     can be pulled out at any time.
--
-- Safe to run multiple times (idempotent). Paste into the Supabase SQL
-- editor and run once.
-- ============================================================================

create table if not exists showroom_cars (
  id uuid primary key default gen_random_uuid(),
  registration text not null,
  make text not null default '',
  model text not null default '',
  color text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists showroom_slots (
  id uuid primary key default gen_random_uuid(),
  zone text not null check (zone in ('left', 'right')),
  lane integer not null,
  depth integer not null default 1,
  display_order integer not null default 0,
  car_id uuid references showroom_cars(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone, lane, depth)
);

create index if not exists idx_showroom_slots_car_id on showroom_slots(car_id);

alter table showroom_cars enable row level security;
alter table showroom_slots enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'showroom_cars' and policyname = 'Showroom cars - full access') then
    create policy "Showroom cars - full access" on showroom_cars for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'showroom_slots' and policyname = 'Showroom slots - full access') then
    create policy "Showroom slots - full access" on showroom_slots for all using (true) with check (true);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- One-time migration from the legacy "lanes" model, if it's still present.
-- Each old showroom_rows row becomes one left-zone lane; cars keep their
-- relative order (position 1 -> aisle side, position 2 -> wall side). Any
-- row that somehow had more than 2 cars gets extra lanes so nothing is lost.
-- ----------------------------------------------------------------------------
do $$
declare
  has_row_id boolean;
  r record;
  lane_counter integer := 0;
  car_rec record;
  slot_depth integer;
begin
  select exists (
    select 1 from information_schema.columns
    where table_name = 'showroom_cars' and column_name = 'row_id'
  ) into has_row_id;

  if has_row_id and exists (select 1 from information_schema.tables where table_name = 'showroom_rows') then
    for r in select * from showroom_rows order by display_order loop
      lane_counter := lane_counter + 1;
      insert into showroom_slots (zone, lane, depth, display_order)
        values ('left', lane_counter, 1, lane_counter)
        on conflict (zone, lane, depth) do nothing;
      insert into showroom_slots (zone, lane, depth, display_order)
        values ('left', lane_counter, 2, lane_counter)
        on conflict (zone, lane, depth) do nothing;

      slot_depth := 1;
      for car_rec in
        select * from showroom_cars where row_id = r.id order by position_in_row asc
      loop
        if slot_depth <= 2 then
          update showroom_slots set car_id = car_rec.id
            where zone = 'left' and lane = lane_counter and depth = slot_depth;
          slot_depth := slot_depth + 1;
        else
          lane_counter := lane_counter + 1;
          insert into showroom_slots (zone, lane, depth, display_order, car_id)
            values ('left', lane_counter, 1, lane_counter, car_rec.id)
            on conflict (zone, lane, depth) do nothing;
          insert into showroom_slots (zone, lane, depth, display_order)
            values ('left', lane_counter, 2, lane_counter)
            on conflict (zone, lane, depth) do nothing;
        end if;
      end loop;
    end loop;

    alter table showroom_cars drop column if exists row_id;
    alter table showroom_cars drop column if exists position_in_row;
  end if;
end $$;

drop table if exists showroom_rows cascade;

-- ----------------------------------------------------------------------------
-- Seed a default grid matching the real showroom (10 wall lanes + 10 bays),
-- only if no slots exist yet (fresh install / nothing to migrate).
-- ----------------------------------------------------------------------------
do $$
declare
  i integer;
begin
  if not exists (select 1 from showroom_slots) then
    for i in 1..10 loop
      insert into showroom_slots (zone, lane, depth, display_order) values ('left', i, 1, i);
      insert into showroom_slots (zone, lane, depth, display_order) values ('left', i, 2, i);
    end loop;
    for i in 1..10 loop
      insert into showroom_slots (zone, lane, depth, display_order) values ('right', i, 1, i);
    end loop;
  end if;
end $$;
