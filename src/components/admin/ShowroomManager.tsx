import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Minus, Edit, Trash2, Key, X,
  AlertTriangle, CheckCircle, Copy, Info,
  ArrowRight, RefreshCw, Search, LogOut,
} from 'lucide-react';
import { supabase, type Car as StockCar, type StockItem, type ShowroomCar, type ShowroomSlot } from '../../lib/supabase';
import { useToast } from '../ui/ToastContainer';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toUpper = (s: string) => s.toUpperCase();

/** A car available to park, sourced from either the live "Cars" table or the "Stock" prep pipeline. */
interface PickerCar {
  key: string;
  registration: string;
  make: string;
  model: string;
  year: string | number | null;
  colour: string | null;
  badgeLabel: string;
  badgeClass: string;
}

const badgeClass = {
  available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  sold: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  inPrep: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  needsWork: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const buildPickerList = (stockCars: StockCar[], stockItems: StockItem[]): PickerCar[] => {
  const map = new Map<string, PickerCar>();

  for (const item of stockItems) {
    const key = (item.registration || item.id).toUpperCase();
    map.set(key, {
      key,
      registration: (item.registration ?? '').toUpperCase(),
      make: item.make,
      model: item.model,
      year: null,
      colour: null,
      badgeLabel: item.stock_status ?? 'In Prep',
      badgeClass: item.stock_status === 'Ready' ? badgeClass.ready : item.stock_status === 'Needs Work' ? badgeClass.needsWork : badgeClass.inPrep,
    });
  }

  // Live "Cars" entries take priority when the same registration exists in both places.
  for (const car of stockCars) {
    const key = (car.registration || car.id).toUpperCase();
    map.set(key, {
      key,
      registration: (car.registration ?? '').toUpperCase(),
      make: car.make,
      model: car.model,
      year: car.year,
      colour: car.colour,
      badgeLabel: car.is_available ? 'Available' : 'Sold',
      badgeClass: car.is_available ? badgeClass.available : badgeClass.sold,
    });
  }

  return Array.from(map.values()).sort((a, b) => a.make.localeCompare(b.make));
};

const isMissingTableError = (err: any): boolean => {
  if (!err) return false;
  const code = err.code;
  const message: string = err.message ?? '';
  return code === '42P01' || code === 'PGRST205' || message.includes('does not exist') || message.includes('schema cache');
};

const describeSlot = (slot: ShowroomSlot): string =>
  slot.zone === 'left'
    ? `Row ${slot.lane} · ${slot.depth === 1 ? 'Aisle side' : 'Wall side'}`
    : `Bay ${slot.lane}`;

// ─── Migration Guide ──────────────────────────────────────────────────────────

const MIGRATION_SQL = `-- Run this in your Supabase SQL editor to set up the Showroom feature.
-- Safe to run more than once (idempotent) — won't error if tables,
-- policies, or slots already exist from a previous attempt.

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

-- One-time migration from the legacy "lanes" model, if it's still present.
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

-- Seed a default grid (10 wall lanes + 10 bays), only if nothing exists yet.
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
end $$;`;

const MigrationGuide: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="admin-glass-card p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">One-time Setup Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            The Showroom feature needs two database tables. Copy and run the SQL below in your{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-fnt-red hover:underline font-medium">
              Supabase SQL Editor
            </a>.
          </p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {['Go to app.supabase.com → your project', 'Click SQL Editor in the left sidebar', 'Paste the SQL below and click Run', 'Come back here and click "I\'ve run the SQL"'].map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fnt-red text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
            {step}
          </div>
        ))}
      </div>

      <div className="relative">
        <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-auto max-h-64 leading-relaxed">
          {MIGRATION_SQL}
        </pre>
        <button
          onClick={copy}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy SQL'}
        </button>
      </div>

      <button
        onClick={onRetry}
        className="mt-6 flex items-center gap-2 px-6 py-3 btn-glass-red text-white font-semibold rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        I've run the SQL — Load Showroom
      </button>
    </div>
  );
};

// ─── Car Form Modal (add / edit) ──────────────────────────────────────────────

interface CarFormModalProps {
  initial?: ShowroomCar | null;
  pickerCars: PickerCar[];
  targetSlotLabel?: string | null;
  onSave: (data: Partial<ShowroomCar>) => void;
  onClose: () => void;
  saving: boolean;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ initial, pickerCars, targetSlotLabel, onSave, onClose, saving }) => {
  const [registration, setRegistration] = useState(initial?.registration ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState(initial?.color ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [stockSearch, setStockSearch] = useState('');
  const [showStockPicker, setShowStockPicker] = useState(!initial);

  const filteredStock = pickerCars.filter(c => {
    if (!stockSearch.trim()) return true;
    const q = stockSearch.toLowerCase();
    return (
      c.registration.toLowerCase().includes(q) ||
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
  });

  const applyStockCar = (car: PickerCar) => {
    setRegistration(car.registration.toUpperCase());
    setMake(car.make);
    setModel(car.model);
    setColor(car.colour ?? '');
    setShowStockPicker(false);
    setStockSearch('');
  };

  const clearStockSelection = () => {
    setRegistration('');
    setMake('');
    setModel('');
    setColor('');
    setShowStockPicker(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="admin-glass-card w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{initial ? 'Edit Car' : 'Add Car to Showroom'}</h2>
            {targetSlotLabel && !initial && (
              <p className="text-xs text-fnt-red font-medium mt-0.5">Will be placed in {targetSlotLabel}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!initial && (
            <div>
              {showStockPicker ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select from Stock
                    <span className="ml-1 text-xs text-gray-400 font-normal">— or scroll down to enter manually</span>
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={e => setStockSearch(e.target.value)}
                      placeholder="Search by reg, make or model…"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
                      autoFocus
                    />
                  </div>

                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {filteredStock.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        {stockSearch ? 'No cars match your search' : 'No stock cars found'}
                      </div>
                    ) : (
                      filteredStock.map(car => (
                        <button
                          key={car.key}
                          type="button"
                          onClick={() => applyStockCar(car)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-fnt-red/5 dark:hover:bg-fnt-red/10 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left transition-colors group"
                        >
                          <div className="min-w-0">
                            <span className="block font-mono font-bold text-sm text-gray-900 dark:text-white tracking-widest group-hover:text-fnt-red transition-colors">
                              {car.registration || '—'}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                              {[car.year, car.make, car.model].filter(Boolean).join(' ')}{car.colour ? ` · ${car.colour}` : ''}
                            </span>
                          </div>
                          <span className={`flex-shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${car.badgeClass}`}>
                            {car.badgeLabel}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="relative mt-4 mb-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500">or enter manually below</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                      Selected from stock: <span className="font-mono font-bold tracking-widest">{registration}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearStockSelection}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 underline flex-shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Registration Plate <span className="text-fnt-red">*</span>
            </label>
            <input
              type="text"
              value={registration}
              onChange={e => setRegistration(toUpper(e.target.value))}
              placeholder="AB12 XYZ"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-fnt-red tracking-widest"
              autoFocus={!!initial}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make</label>
              <input
                type="text"
                value={make}
                onChange={e => setMake(e.target.value)}
                placeholder="Ford"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="Focus"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colour</label>
            <input
              type="text"
              value={color}
              onChange={e => setColor(e.target.value)}
              placeholder="Silver"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. No start, flat tyre…"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
            />
          </div>

          {!initial && !targetSlotLabel && (
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              This car will go into the Unassigned tray — drag it onto any open spot afterwards.
            </p>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!registration.trim()) return;
              onSave({
                registration: registration.trim(),
                make: make.trim(),
                model: model.trim(),
                color: color.trim(),
                notes: notes.trim(),
              });
            }}
            disabled={!registration.trim() || saving}
            className="flex-1 py-2.5 btn-glass-red disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Car'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Car Detail Sheet (click a parked car) ────────────────────────────────────

interface CarDetailModalProps {
  car: ShowroomCar;
  slot: ShowroomSlot;
  blocker: ShowroomCar | null;
  onClose: () => void;
  onEdit: () => void;
  onUnassign: () => void;
  onDelete: () => void;
}

const CarDetailModal: React.FC<CarDetailModalProps> = ({ car, slot, blocker, onClose, onEdit, onUnassign, onDelete }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="admin-glass-card w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${blocker ? 'bg-amber-500' : 'bg-emerald-500'}`}>
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-widest font-mono">{car.registration}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{describeSlot(slot)}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {(car.make || car.model || car.color) && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {[car.make, car.model].filter(Boolean).join(' ')}{car.color ? ` · ${car.color}` : ''}
          </p>
        )}
        {car.notes && <p className="text-xs text-gray-400 dark:text-gray-500 italic">{car.notes}</p>}

        {blocker ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Move this car first to retrieve {car.registration}:</p>
            </div>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-widest font-mono">{blocker.registration}</p>
            {(blocker.make || blocker.model) && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{[blocker.make, blocker.model].filter(Boolean).join(' ')}{blocker.color ? ` · ${blocker.color}` : ''}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Free to move!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Nothing is blocking this car — grab the key and go.</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-5 space-y-2">
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
        >
          <Edit className="w-4 h-4" /> Edit Details
        </button>
        <button
          onClick={onUnassign}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" /> Send Back to Unassigned
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Remove From Showroom
        </button>
      </div>
    </div>
  </div>
);

// ─── Draggable Car Chip (sits inside a slot) ──────────────────────────────────

interface CarChipProps {
  car: ShowroomCar;
  slotId: string;
  blocked: boolean;
  onClick: () => void;
}

const CarChip: React.FC<CarChipProps> = ({ car, slotId, blocked, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `car-${car.id}`,
    data: { carId: car.id, sourceSlotId: slotId },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
      className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 px-1 cursor-grab active:cursor-grabbing select-none transition-colors ${
        blocked
          ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/25 dark:border-amber-700'
          : 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/25 dark:border-emerald-700'
      }`}
    >
      <span className="font-mono font-black text-[11px] sm:text-xs tracking-wider text-gray-900 dark:text-white leading-tight">
        {car.registration}
      </span>
      {(car.make || car.model) && (
        <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full leading-tight">
          {[car.make, car.model].filter(Boolean).join(' ')}
        </span>
      )}
      {blocked && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
          !
        </span>
      )}
    </div>
  );
};

// ─── Slot Cell (droppable spot in the grid) ───────────────────────────────────

interface SlotCellProps {
  slot: ShowroomSlot;
  car: ShowroomCar | null;
  blocked: boolean;
  onQuickAdd: () => void;
  onClickCar: () => void;
}

const SlotCell: React.FC<SlotCellProps> = ({ slot, car, blocked, onQuickAdd, onClickCar }) => {
  const { isOver, setNodeRef } = useDroppable({ id: `slot-${slot.id}`, data: { slotId: slot.id } });

  if (!car) {
    return (
      <button
        ref={setNodeRef}
        onClick={onQuickAdd}
        title={`Add car to ${describeSlot(slot)}`}
        className={`relative w-[4.5rem] h-14 sm:w-24 sm:h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition-all flex-shrink-0 ${
          isOver
            ? 'border-fnt-red bg-fnt-red/10 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
        }`}
      >
        <Plus className={`w-4 h-4 sm:w-5 sm:h-5 ${isOver ? 'text-fnt-red' : 'text-gray-300 dark:text-gray-600'}`} />
      </button>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative w-[4.5rem] h-14 sm:w-24 sm:h-16 rounded-xl transition-all flex-shrink-0 ${
        isOver ? 'ring-2 ring-fnt-red ring-offset-2 dark:ring-offset-gray-800 scale-105' : ''
      }`}
    >
      <CarChip car={car} slotId={slot.id} blocked={blocked} onClick={onClickCar} />
    </div>
  );
};

// ─── Unassigned pool card ──────────────────────────────────────────────────────

interface PoolCardProps {
  car: ShowroomCar;
  onClick: () => void;
  onDelete: () => void;
}

const PoolCard: React.FC<PoolCardProps> = ({ car, onClick, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `car-${car.id}`,
    data: { carId: car.id, sourceSlotId: null },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.35 : 1,
        touchAction: 'none',
      }}
      className="relative flex-shrink-0 w-32 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-2.5 cursor-grab active:cursor-grabbing select-none hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
    >
      <button
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(); }}
        title="Remove from showroom"
        className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      <p className="text-sm font-black text-gray-900 dark:text-white tracking-widest font-mono pr-4">{car.registration}</p>
      {(car.make || car.model) && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{[car.make, car.model].filter(Boolean).join(' ')}</p>}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ShowroomManager: React.FC = () => {
  const { showToast } = useToast();
  const [cars, setCars] = useState<ShowroomCar[]>([]);
  const [slots, setSlots] = useState<ShowroomSlot[]>([]);
  const [stockCars, setStockCars] = useState<StockCar[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [addTargetSlotId, setAddTargetSlotId] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<ShowroomCar | null>(null);
  const [detailCarSlotId, setDetailCarSlotId] = useState<string | null>(null);
  const [activeDragCarId, setActiveDragCarId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // ── Data Fetching ──

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [carsRes, slotsRes, stockRes, stockItemsRes] = await Promise.all([
        supabase.from('showroom_cars').select('*'),
        supabase.from('showroom_slots').select('*').order('display_order', { ascending: true }),
        supabase.from('cars').select('id,make,model,year,registration,colour,is_available').order('make', { ascending: true }),
        supabase.from('stock_inventory').select('id,make,model,registration,stock_status').order('make', { ascending: true }),
      ]);

      const tablesMissing = isMissingTableError(carsRes.error) || isMissingTableError(slotsRes.error);

      if (tablesMissing) {
        setMigrationNeeded(true);
        return;
      }

      if (carsRes.error) throw carsRes.error;
      if (slotsRes.error) throw slotsRes.error;

      setCars(carsRes.data ?? []);
      setSlots(slotsRes.data ?? []);
      setStockCars((stockRes.data ?? []) as StockCar[]);
      // stock_inventory failing to load shouldn't block the showroom — just means prep cars won't show in the picker.
      if (stockItemsRes.error) console.error('Stock inventory fetch error:', stockItemsRes.error);
      setStockItems((stockItemsRes.data ?? []) as StockItem[]);
      setMigrationNeeded(false);
    } catch (err: any) {
      if (isMissingTableError(err)) setMigrationNeeded(true);
      else console.error('Showroom fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived Data ──

  const carsById = useMemo(() => new Map(cars.map(c => [c.id, c])), [cars]);
  const pickerCars = useMemo(() => buildPickerList(stockCars, stockItems), [stockCars, stockItems]);

  const leftLaneNumbers = useMemo(() => {
    const lanes = new Map<number, number>();
    slots.filter(s => s.zone === 'left').forEach(s => lanes.set(s.lane, s.display_order));
    return Array.from(lanes.entries()).sort((a, b) => a[1] - b[1]).map(([lane]) => lane);
  }, [slots]);

  const rightBaySlots = useMemo(() =>
    slots.filter(s => s.zone === 'right').sort((a, b) => a.display_order - b.display_order),
    [slots]);

  const unassignedCars = useMemo(() => {
    const parkedIds = new Set(slots.filter(s => s.car_id).map(s => s.car_id));
    return cars.filter(c => !parkedIds.has(c.id));
  }, [cars, slots]);

  const getBlocker = useCallback((slot: ShowroomSlot): ShowroomSlot | null => {
    if (slot.zone !== 'left' || slot.depth !== 2) return null;
    return slots.find(s => s.zone === 'left' && s.lane === slot.lane && s.depth === 1) ?? null;
  }, [slots]);

  const isSlotBlocked = useCallback((slot: ShowroomSlot) => {
    const blocker = getBlocker(slot);
    return !!(blocker && blocker.car_id);
  }, [getBlocker]);

  const parkedSlots = useMemo(() => slots.filter(s => s.car_id), [slots]);
  const blockedSlots = useMemo(() => parkedSlots.filter(isSlotBlocked), [parkedSlots, isSlotBlocked]);
  const freeParkedCount = parkedSlots.length - blockedSlots.length;

  // ── Mutations (optimistic) ──

  const moveCar = useCallback(async (carId: string, sourceSlotId: string | null, targetSlotId: string) => {
    const targetSlot = slots.find(s => s.id === targetSlotId);
    if (!targetSlot || targetSlot.car_id === carId) return;
    const displacedCarId = targetSlot.car_id;

    const prevSlots = slots;
    setSlots(prev => prev.map(s => {
      if (s.id === targetSlotId) return { ...s, car_id: carId };
      if (sourceSlotId && s.id === sourceSlotId) return { ...s, car_id: displacedCarId };
      return s;
    }));

    try {
      const now = new Date().toISOString();
      const updates = [supabase.from('showroom_slots').update({ car_id: carId, updated_at: now }).eq('id', targetSlotId)];
      if (sourceSlotId) {
        updates.push(supabase.from('showroom_slots').update({ car_id: displacedCarId, updated_at: now }).eq('id', sourceSlotId));
      }
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    } catch (err) {
      console.error('Failed to move car:', err);
      showToast('Could not move car — try again', 'error');
      setSlots(prevSlots);
    }
  }, [slots, showToast]);

  const unassignCar = useCallback(async (sourceSlotId: string) => {
    const prevSlots = slots;
    setSlots(prev => prev.map(s => s.id === sourceSlotId ? { ...s, car_id: null } : s));
    try {
      const { error } = await supabase.from('showroom_slots').update({ car_id: null, updated_at: new Date().toISOString() }).eq('id', sourceSlotId);
      if (error) throw error;
    } catch (err) {
      console.error(err);
      showToast('Could not update showroom — try again', 'error');
      setSlots(prevSlots);
    }
  }, [slots, showToast]);

  // ── Drag handlers ──

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { carId: string } | undefined;
    setActiveDragCarId(data?.carId ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragCarId(null);
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as { carId: string; sourceSlotId: string | null } | undefined;
    if (!data) return;

    const overId = String(over.id);
    if (overId === 'pool') {
      if (data.sourceSlotId) unassignCar(data.sourceSlotId);
      return;
    }
    if (overId.startsWith('slot-')) {
      const targetSlotId = overId.replace('slot-', '');
      if (targetSlotId === data.sourceSlotId) return;
      moveCar(data.carId, data.sourceSlotId, targetSlotId);
    }
  };

  const { setNodeRef: setPoolRef, isOver: isOverPool } = useDroppable({ id: 'pool' });

  // ── Car CRUD ──

  const handleSaveCar = async (data: Partial<ShowroomCar>) => {
    setSaving(true);
    try {
      if (editingCar) {
        await supabase.from('showroom_cars').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingCar.id);
        setEditingCar(null);
      } else {
        const { data: inserted, error } = await supabase.from('showroom_cars').insert({
          registration: data.registration,
          make: data.make ?? '',
          model: data.model ?? '',
          color: data.color ?? '',
          notes: data.notes ?? '',
        }).select().single();
        if (error) throw error;

        if (addTargetSlotId && inserted) {
          await supabase.from('showroom_slots').update({ car_id: inserted.id, updated_at: new Date().toISOString() }).eq('id', addTargetSlotId);
        }
        setShowAddCarModal(false);
        setAddTargetSlotId(null);
      }
      await fetchData();
      showToast(editingCar ? 'Car updated' : 'Car added', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not save car', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Remove this car from the showroom entirely?')) return;
    try {
      await supabase.from('showroom_cars').delete().eq('id', carId);
      await fetchData();
      showToast('Car removed', 'success');
    } catch (err) {
      console.error(err);
      showToast('Could not remove car', 'error');
    }
  };

  // ── Lane / Bay management ──

  const addLane = async () => {
    const maxLane = leftLaneNumbers.length > 0 ? Math.max(...leftLaneNumbers) : 0;
    const newLane = maxLane + 1;
    await supabase.from('showroom_slots').insert([
      { zone: 'left', lane: newLane, depth: 1, display_order: newLane },
      { zone: 'left', lane: newLane, depth: 2, display_order: newLane },
    ]);
    await fetchData();
  };

  const removeLane = async (lane: number) => {
    const laneSlots = slots.filter(s => s.zone === 'left' && s.lane === lane);
    const occupied = laneSlots.filter(s => s.car_id).length;
    const msg = occupied > 0
      ? `This row has ${occupied} car(s) parked. Removing it will send them back to Unassigned. Continue?`
      : 'Remove this empty row?';
    if (!window.confirm(msg)) return;
    await supabase.from('showroom_slots').delete().in('id', laneSlots.map(s => s.id));
    await fetchData();
  };

  const addBay = async () => {
    const maxLane = rightBaySlots.length > 0 ? Math.max(...rightBaySlots.map(s => s.lane)) : 0;
    const newLane = maxLane + 1;
    await supabase.from('showroom_slots').insert({ zone: 'right', lane: newLane, depth: 1, display_order: newLane });
    await fetchData();
  };

  const removeBay = async (slotId: string) => {
    const slot = slots.find(s => s.id === slotId);
    const msg = slot?.car_id ? 'This bay has a car parked. Removing it will send the car back to Unassigned. Continue?' : 'Remove this empty bay?';
    if (!window.confirm(msg)) return;
    await supabase.from('showroom_slots').delete().eq('id', slotId);
    await fetchData();
  };

  // ── Detail modal derived data ──

  const detailSlot = detailCarSlotId ? slots.find(s => s.id === detailCarSlotId) ?? null : null;
  const detailCar = detailSlot?.car_id ? carsById.get(detailSlot.car_id) ?? null : null;
  const detailBlockerSlot = detailSlot ? getBlocker(detailSlot) : null;
  const detailBlockerCar = detailBlockerSlot?.car_id ? carsById.get(detailBlockerSlot.car_id) ?? null : null;

  const activeDragCar = activeDragCarId ? carsById.get(activeDragCarId) ?? null : null;

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-fnt-red mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading showroom…</p>
        </div>
      </div>
    );
  }

  if (migrationNeeded) {
    return <MigrationGuide onRetry={fetchData} />;
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* ── Header & Stats ── */}
        <div className="admin-glass-card !rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Showroom Parking</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Drag cars onto a spot to park them, or drag onto another car to swap. Tap any parked car for the key retrieval guide.
              </p>
            </div>
            <button
              onClick={() => { setAddTargetSlotId(null); setShowAddCarModal(true); }}
              className="flex items-center gap-1.5 px-4 py-2 btn-glass-red text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Car
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Cars in Showroom', value: cars.length, color: 'text-gray-900 dark:text-white' },
              { label: 'Parked', value: parkedSlots.length, color: 'text-gray-900 dark:text-white' },
              { label: 'Free to Move', value: freeParkedCount + unassignedCars.length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Blocked', value: blockedSlots.length, color: 'text-red-600 dark:text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3 text-center">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-600 dark:text-gray-400">Free to move</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-gray-600 dark:text-gray-400">Blocked (move the ! car first)</span>
            </div>
          </div>
        </div>

        {/* ── Birds-eye Plot — one shared plot: bays on the left, driveway gap, wall rows on the right ── */}
        <div className="admin-glass-card !rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Showroom Plot</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">Birds-eye view · driveway runs down the middle</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={addBay}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Bay
              </button>
              <button
                onClick={addLane}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Row
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Wall hatch strip — spans the full plot, since it's the back wall of the whole showroom */}
            <div
              className="h-2.5 bg-gray-200 dark:bg-gray-700"
              style={{ backgroundImage: 'repeating-linear-gradient(135deg, rgba(100,100,110,0.35) 0 6px, transparent 6px 12px)' }}
              title="Wall"
            />

            <div className="p-3 sm:p-4 max-h-[30rem] overflow-y-auto">
              <div className="flex flex-col lg:flex-row lg:items-stretch lg:justify-center gap-4 lg:gap-0">
                {/* WALL ROWS (left) — nose-to-tail, 2 deep */}
                <div className="w-full lg:w-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Wall Rows · Wall side → Aisle side</p>
                  <div className="space-y-2">
                    {leftLaneNumbers.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No rows yet — click "Row" to add one.</p>
                    ) : (
                      leftLaneNumbers.map((lane, idx) => {
                        const wallSlot = slots.find(s => s.zone === 'left' && s.lane === lane && s.depth === 2);
                        const aisleSlot = slots.find(s => s.zone === 'left' && s.lane === lane && s.depth === 1);
                        if (!wallSlot || !aisleSlot) return null;
                        return (
                          <div key={lane} className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0">{idx + 1}</span>
                            <SlotCell
                              slot={wallSlot}
                              car={wallSlot.car_id ? carsById.get(wallSlot.car_id) ?? null : null}
                              blocked={isSlotBlocked(wallSlot)}
                              onQuickAdd={() => { setAddTargetSlotId(wallSlot.id); setShowAddCarModal(true); }}
                              onClickCar={() => setDetailCarSlotId(wallSlot.id)}
                            />
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                            <SlotCell
                              slot={aisleSlot}
                              car={aisleSlot.car_id ? carsById.get(aisleSlot.car_id) ?? null : null}
                              blocked={isSlotBlocked(aisleSlot)}
                              onQuickAdd={() => { setAddTargetSlotId(aisleSlot.id); setShowAddCarModal(true); }}
                              onClickCar={() => setDetailCarSlotId(aisleSlot.id)}
                            />
                            <button
                              onClick={() => removeLane(lane)}
                              title="Remove this row"
                              className="ml-auto p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* DRIVEWAY */}
                <div className="hidden lg:flex flex-col items-center justify-center flex-shrink-0 w-20 mx-2 self-stretch">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 [writing-mode:vertical-rl] whitespace-nowrap bg-gray-50 dark:bg-gray-900/40 px-1.5 py-2 rounded-full border border-gray-200 dark:border-gray-700">
                    Driveway
                  </span>
                </div>
                <div className="lg:hidden flex items-center justify-center py-2 text-gray-400 dark:text-gray-500">
                  <span className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap bg-gray-50 dark:bg-gray-900/40 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">Driveway</span>
                </div>

                {/* SINGLE ROW (right) — independent bays */}
                <div className="w-full lg:w-auto flex-shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Single Row · Independent Bays</p>
                  <div className="space-y-2">
                    {rightBaySlots.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No bays yet — click "Bay" to add one.</p>
                    ) : (
                      rightBaySlots.map((slot, idx) => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0">{idx + 1}</span>
                          <SlotCell
                            slot={slot}
                            car={slot.car_id ? carsById.get(slot.car_id) ?? null : null}
                            blocked={false}
                            onQuickAdd={() => { setAddTargetSlotId(slot.id); setShowAddCarModal(true); }}
                            onClickCar={() => setDetailCarSlotId(slot.id)}
                          />
                          <button
                            onClick={() => removeBay(slot.id)}
                            title="Remove this bay"
                            className="ml-auto p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Unassigned Pool ── */}
        <div
          ref={setPoolRef}
          className={`admin-glass-card !rounded-xl overflow-hidden transition-all ${isOverPool ? 'ring-2 ring-fnt-red' : ''}`}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
            <h3 className="font-bold text-gray-900 dark:text-white">Unassigned</h3>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
              {unassignedCars.length}
            </span>
            <Info className="w-4 h-4 text-gray-400 ml-1" title="Cars added to the showroom but not yet placed on the grid — drag onto any open spot." />
          </div>
          <div className={`p-4 sm:p-5 flex flex-wrap gap-3 min-h-[5rem] ${unassignedCars.length === 0 ? 'items-center justify-center' : ''}`}>
            {unassignedCars.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Drop a car here to unassign it, or click "Add Car" above.</p>
            ) : (
              unassignedCars.map(car => (
                <PoolCard
                  key={car.id}
                  car={car}
                  onClick={() => { setEditingCar(car); }}
                  onDelete={() => handleDeleteCar(car.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Modals ── */}
        {detailCar && detailSlot && (
          <CarDetailModal
            car={detailCar}
            slot={detailSlot}
            blocker={detailBlockerCar}
            onClose={() => setDetailCarSlotId(null)}
            onEdit={() => { setEditingCar(detailCar); setDetailCarSlotId(null); }}
            onUnassign={() => { unassignCar(detailSlot.id); setDetailCarSlotId(null); }}
            onDelete={() => { setDetailCarSlotId(null); handleDeleteCar(detailCar.id); }}
          />
        )}

        {(showAddCarModal || editingCar) && (
          <CarFormModal
            initial={editingCar}
            pickerCars={pickerCars}
            targetSlotLabel={addTargetSlotId ? describeSlot(slots.find(s => s.id === addTargetSlotId)!) : null}
            onSave={handleSaveCar}
            onClose={() => { setShowAddCarModal(false); setAddTargetSlotId(null); setEditingCar(null); }}
            saving={saving}
          />
        )}
      </div>

      <DragOverlay>
        {activeDragCar ? (
          <div className="w-[4.5rem] h-14 sm:w-24 sm:h-16 rounded-xl border-2 bg-white dark:bg-gray-800 border-fnt-red shadow-2xl flex flex-col items-center justify-center gap-0.5 rotate-3 scale-110">
            <span className="font-mono font-black text-[11px] sm:text-xs tracking-wider text-gray-900 dark:text-white">{activeDragCar.registration}</span>
            {(activeDragCar.make || activeDragCar.model) && (
              <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full">
                {[activeDragCar.make, activeDragCar.model].filter(Boolean).join(' ')}
              </span>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default ShowroomManager;
