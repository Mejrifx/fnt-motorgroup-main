-- Create invoices table
create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  invoice_number text unique not null,
  car_id uuid references cars(id),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_address text,
  sale_price numeric not null,
  deposit numeric default 0,
  balance numeric not null,
  invoice_date date not null,
  payment_terms text,
  notes text,
  simplepdf_url text, -- URL to the completed PDF in SimplePDF
  simplepdf_submission_id text, -- SimplePDF submission ID for tracking
  status text default 'draft', -- draft, sent, paid, cancelled
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table invoices enable row level security;

-- Admin-only access (must be authenticated)
create policy "Admins can view all invoices"
  on invoices for select
  using (auth.role() = 'authenticated');

create policy "Admins can insert invoices"
  on invoices for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update invoices"
  on invoices for update
  using (auth.role() = 'authenticated');

create policy "Admins can delete invoices"
  on invoices for delete
  using (auth.role() = 'authenticated');

-- Create index for faster lookups
create index if not exists invoices_invoice_number_idx on invoices(invoice_number);
create index if not exists invoices_customer_name_idx on invoices(customer_name);
create index if not exists invoices_created_at_idx on invoices(created_at desc);

-- Create updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_invoices_updated_at
  before update on invoices
  for each row
  execute function update_updated_at_column();

-- Add comment
comment on table invoices is 'Stores invoice records for vehicle sales';
