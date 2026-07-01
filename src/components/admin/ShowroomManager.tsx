import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Key, ChevronLeft, ChevronRight, X,
  Car, AlertTriangle, CheckCircle, Copy, MapPin, Info,
  ArrowLeft, ArrowRight, MoveHorizontal, RefreshCw, Search
} from 'lucide-react';
import { supabase, type Car as StockCar } from '../../lib/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ShowroomRow {
  id: string;
  name: string;
  display_order: number;
  description: string;
  created_at: string;
}

interface ShowroomCar {
  id: string;
  registration: string;
  make: string;
  model: string;
  color: string;
  notes: string;
  row_id: string | null;
  position_in_row: number;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toUpper = (s: string) => s.toUpperCase();

const blockingLabel = (count: number) => {
  if (count === 0) return { text: 'Free to Move', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-300 dark:border-emerald-700' };
  if (count === 1) return { text: `1 car blocking`, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-700' };
  return { text: `${count} cars blocking`, bg: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-300 dark:border-red-700' };
};

// ─── Migration Guide ──────────────────────────────────────────────────────────

const MIGRATION_SQL = `-- Run this in your Supabase SQL editor to set up the Showroom feature

create table if not exists showroom_rows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  description text not null default '',
  created_at timestamptz default now()
);

create table if not exists showroom_cars (
  id uuid primary key default gen_random_uuid(),
  registration text not null,
  make text not null default '',
  model text not null default '',
  color text not null default '',
  notes text not null default '',
  row_id uuid references showroom_rows(id) on delete set null,
  position_in_row integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table showroom_rows enable row level security;
alter table showroom_cars enable row level security;

create policy "Showroom rows - full access"
  on showroom_rows for all using (true) with check (true);

create policy "Showroom cars - full access"
  on showroom_cars for all using (true) with check (true);`;

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

      <div className="steps mb-6 space-y-3">
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

// ─── Retrieve Modal ───────────────────────────────────────────────────────────

interface RetrieveModalProps {
  car: ShowroomCar;
  sequence: ShowroomCar[];
  rowName: string;
  onClose: () => void;
}

const RetrieveModal: React.FC<RetrieveModalProps> = ({ car, sequence, rowName, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="admin-glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fnt-red flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Key Retrieval Guide</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Follow the steps below</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-5">
        {/* Target car */}
        <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">You want to retrieve</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-widest">{car.registration}</p>
          {(car.make || car.model) && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{[car.make, car.model].filter(Boolean).join(' ')}{car.color ? ` · ${car.color}` : ''}</p>}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{rowName} · Position {car.position_in_row}</p>
        </div>

        {/* Steps */}
        {sequence.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">This car is free to move!</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">No cars are blocking it. Grab the key and go.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 px-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Move <span className="font-bold text-fnt-red">{sequence.length}</span> car{sequence.length > 1 ? 's' : ''} first — in this order:
              </p>
            </div>

            <div className="space-y-3 mb-5">
              {sequence.map((blockingCar, idx) => (
                <div key={blockingCar.id} className="relative">
                  <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-black flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-gray-900 dark:text-white tracking-widest">{blockingCar.registration}</span>
                        {idx === 0 && (
                          <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium">Move first</span>
                        )}
                      </div>
                      {(blockingCar.make || blockingCar.model) && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                          {[blockingCar.make, blockingCar.model].filter(Boolean).join(' ')}
                          {blockingCar.color ? ` · ${blockingCar.color}` : ''}
                        </p>
                      )}
                      {blockingCar.notes && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{blockingCar.notes}</p>
                      )}
                    </div>
                  </div>
                  {/* Connector arrow */}
                  {idx < sequence.length - 1 && (
                    <div className="flex justify-center my-1">
                      <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Then get target */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <ChevronRight className="w-4 h-4 text-emerald-500 rotate-90" />
              <p className="text-xs text-gray-400 dark:text-gray-500">Then you can get your car</p>
            </div>
            <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border-2 border-emerald-300 dark:border-emerald-700">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white tracking-widest">{car.registration}</p>
                {(car.make || car.model) && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{[car.make, car.model].filter(Boolean).join(' ')}{car.color ? ` · ${car.color}` : ''}</p>}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={onClose}
          className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-xl transition-colors"
        >
          Back to Showroom
        </button>
      </div>
    </div>
  </div>
);

// ─── Car Card ─────────────────────────────────────────────────────────────────

interface CarCardProps {
  car: ShowroomCar;
  blockingCount: number;
  isFirst: boolean;
  isLast: boolean;
  onRetrieve: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveForward: () => void;
  onMoveBack: () => void;
}

const CarCard: React.FC<CarCardProps> = ({
  car, blockingCount, isFirst, isLast, onRetrieve, onEdit, onDelete, onMoveForward, onMoveBack
}) => {
  const label = blockingLabel(blockingCount);

  return (
    <div className={`relative flex-shrink-0 w-48 sm:w-52 rounded-xl border-2 ${label.border} bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* Position badge */}
      <div className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${label.bg}`}>
        #{car.position_in_row}
      </div>

      {/* Status dot */}
      <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${label.dot}`} />

      <div className="pt-9 px-3 pb-3">
        {/* Registration — the most important thing */}
        <p className="text-xl font-black text-gray-900 dark:text-white tracking-widest leading-tight">{car.registration}</p>

        {/* Make / Model */}
        {(car.make || car.model) ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{[car.make, car.model].filter(Boolean).join(' ')}</p>
        ) : (
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5 italic">No details</p>
        )}

        {/* Color */}
        {car.color && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{car.color}</p>}

        {/* Status label */}
        <div className="mt-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${label.bg}`}>
            {label.text}
          </span>
        </div>

        {/* Notes */}
        {car.notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic line-clamp-2">{car.notes}</p>
        )}

        {/* Actions */}
        <div className="mt-3 space-y-1.5">
          <button
            onClick={onRetrieve}
            className="w-full flex items-center justify-center gap-1.5 py-2 btn-glass-red text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            Retrieve This Car
          </button>

          <div className="flex gap-1">
            <button
              onClick={onMoveForward}
              disabled={isFirst}
              title="Move closer to exit"
              className="flex-1 flex items-center justify-center py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEdit}
              title="Edit car"
              className="flex-1 flex items-center justify-center py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Remove from showroom"
              className="flex-1 flex items-center justify-center py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveBack}
              disabled={isLast}
              title="Move further from exit"
              className="flex-1 flex items-center justify-center py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Lane Section ─────────────────────────────────────────────────────────────

interface LaneSectionProps {
  row: ShowroomRow;
  cars: ShowroomCar[];
  onRetrieve: (car: ShowroomCar) => void;
  onEditCar: (car: ShowroomCar) => void;
  onDeleteCar: (carId: string) => void;
  onMoveCar: (car: ShowroomCar, dir: 'forward' | 'backward') => void;
  onEditRow: (row: ShowroomRow) => void;
  onDeleteRow: (rowId: string) => void;
  getBlockingCount: (car: ShowroomCar) => number;
}

const LaneSection: React.FC<LaneSectionProps> = ({
  row, cars, onRetrieve, onEditCar, onDeleteCar, onMoveCar, onEditRow, onDeleteRow, getBlockingCount
}) => {
  return (
    <div className="admin-glass-card !rounded-xl mb-4 overflow-hidden">
      {/* Lane header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-fnt-red flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">{row.name}</h3>
            {row.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{row.description}</p>}
          </div>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
            {cars.length} car{cars.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEditRow(row)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg transition-colors"
            title="Edit lane"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteRow(row.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            title="Delete lane"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lane visual */}
      <div className="p-4 sm:p-5">
        {cars.length === 0 ? (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
            <p className="text-sm text-gray-400 dark:text-gray-500">Empty lane — no cars parked here</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2">
            {/* Direction indicators + car strip */}
            <div className="flex items-stretch gap-0 min-w-max">
              {/* EXIT label */}
              <div className="flex flex-col items-center justify-center gap-1 pr-3 flex-shrink-0">
                <div className="px-2 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg whitespace-nowrap flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" />
                  EXIT
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight">
                  Move<br/>here
                </p>
              </div>

              {/* Cars with connectors */}
              {cars.map((car, idx) => (
                <React.Fragment key={car.id}>
                  <CarCard
                    car={car}
                    blockingCount={getBlockingCount(car)}
                    isFirst={idx === 0}
                    isLast={idx === cars.length - 1}
                    onRetrieve={() => onRetrieve(car)}
                    onEdit={() => onEditCar(car)}
                    onDelete={() => onDeleteCar(car.id)}
                    onMoveForward={() => onMoveCar(car, 'forward')}
                    onMoveBack={() => onMoveCar(car, 'backward')}
                  />
                  {idx < cars.length - 1 && (
                    <div className="flex items-center px-2 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        <span className="text-xs text-gray-300 dark:text-gray-600 font-mono">blocks</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              {/* WALL label */}
              <div className="flex flex-col items-center justify-center gap-1 pl-3 flex-shrink-0">
                <div className="px-2 py-1.5 bg-gray-500 text-white text-xs font-bold rounded-lg whitespace-nowrap">
                  WALL
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-tight">
                  Most<br/>blocked
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lane key summary */}
        {cars.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Quick guide:</span>{' '}
              {cars[0].registration} is free · {cars.slice(1).map((c, i) => `${c.registration} needs ${i + 1} key${i + 1 > 1 ? 's' : ''} first`).join(' · ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Row Modal ────────────────────────────────────────────────────────────────

interface RowModalProps {
  initial?: ShowroomRow | null;
  allRows: ShowroomRow[];
  onSave: (name: string, description: string) => void;
  onClose: () => void;
  saving: boolean;
}

const RowModal: React.FC<RowModalProps> = ({ initial, onSave, onClose, saving }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="admin-glass-card w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{initial ? 'Edit Lane' : 'Add New Lane'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lane Name <span className="text-fnt-red">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Front Row, Back Alley, Left Side"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Right side of forecourt, 4 spaces"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
            />
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim(), description.trim())}
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 btn-glass-red disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Lane'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Car Modal ────────────────────────────────────────────────────────────────

interface CarModalProps {
  initial?: ShowroomCar | null;
  rows: ShowroomRow[];
  allCars: ShowroomCar[];
  stockCars: StockCar[];
  onSave: (data: Partial<ShowroomCar>) => void;
  onClose: () => void;
  saving: boolean;
}

const CarModal: React.FC<CarModalProps> = ({ initial, rows, allCars, stockCars, onSave, onClose, saving }) => {
  const [registration, setRegistration] = useState(initial?.registration ?? '');
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState(initial?.color ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [rowId, setRowId] = useState<string>(initial?.row_id ?? '');
  const [position, setPosition] = useState<string>(initial?.position_in_row?.toString() ?? '');
  const [stockSearch, setStockSearch] = useState('');
  const [showStockPicker, setShowStockPicker] = useState(!initial);

  // Filter stock cars by search query — reg, make, or model
  const filteredStock = stockCars.filter(c => {
    if (!stockSearch.trim()) return true;
    const q = stockSearch.toLowerCase();
    return (
      (c.registration ?? '').toLowerCase().includes(q) ||
      c.make.toLowerCase().includes(q) ||
      c.model.toLowerCase().includes(q)
    );
  });

  const applyStockCar = (car: StockCar) => {
    setRegistration((car.registration ?? '').toUpperCase());
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

  // When row changes, default to adding at the end
  const handleRowChange = (newRowId: string) => {
    setRowId(newRowId);
    if (newRowId && !initial) {
      const rowCars = allCars.filter(c => c.row_id === newRowId && c.id !== initial?.id);
      const maxPos = rowCars.length > 0 ? Math.max(...rowCars.map(c => c.position_in_row)) : 0;
      setPosition((maxPos + 1).toString());
    } else if (!newRowId) {
      setPosition('');
    }
  };

  const carsInSelectedRow = rowId ? allCars.filter(c => c.row_id === rowId && c.id !== initial?.id) : [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="admin-glass-card w-full max-w-sm max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{initial ? 'Edit Car' : 'Add Car to Showroom'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* ── Stock Picker (add mode only) ── */}
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

                  {/* Stock list */}
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-52 overflow-y-auto">
                    {filteredStock.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                        {stockSearch ? 'No cars match your search' : 'No stock cars found'}
                      </div>
                    ) : (
                      filteredStock.map(car => (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => applyStockCar(car)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-fnt-red/5 dark:hover:bg-fnt-red/10 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left transition-colors group"
                        >
                          <div className="min-w-0">
                            <span className="block font-mono font-bold text-sm text-gray-900 dark:text-white tracking-widest group-hover:text-fnt-red transition-colors">
                              {car.registration ?? '—'}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                              {car.year} {car.make} {car.model}{car.colour ? ` · ${car.colour}` : ''}
                            </span>
                          </div>
                          <span className={`flex-shrink-0 ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${car.is_available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {car.is_available ? 'Available' : 'Sold'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Divider with manual option */}
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
                /* Selected car confirmation banner */
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

          {/* ── Manual fields ── */}
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

          {/* Lane assignment */}
          <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign to Lane <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={rowId}
              onChange={e => handleRowChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
            >
              <option value="">Not assigned (floating)</option>
              {rows.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {rowId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position in Lane
                <span className="ml-1 text-xs text-gray-400 font-normal">(1 = closest to exit)</span>
              </label>
              <input
                type="number"
                value={position}
                onChange={e => setPosition(e.target.value)}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fnt-red"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {carsInSelectedRow.length === 0
                  ? 'This lane is empty — will be position 1'
                  : `Lane has ${carsInSelectedRow.length} car(s). Leave blank to add at the back.`}
              </p>
            </div>
          )}

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
                row_id: rowId || null,
                position_in_row: rowId && position ? parseInt(position) : 0,
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

// ─── Main Component ───────────────────────────────────────────────────────────

const ShowroomManager: React.FC = () => {
  const [rows, setRows] = useState<ShowroomRow[]>([]);
  const [cars, setCars] = useState<ShowroomCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockCars, setStockCars] = useState<StockCar[]>([]);

  // Modal state
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [editingRow, setEditingRow] = useState<ShowroomRow | null>(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [editingCar, setEditingCar] = useState<ShowroomCar | null>(null);
  const [retrievingCar, setRetrievingCar] = useState<ShowroomCar | null>(null);

  // ── Data Fetching ──

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rowsRes, carsRes, stockRes] = await Promise.all([
        supabase.from('showroom_rows').select('*').order('display_order', { ascending: true }),
        supabase.from('showroom_cars').select('*').order('position_in_row', { ascending: true }),
        supabase.from('cars').select('id,make,model,year,registration,colour,is_available').order('make', { ascending: true }),
      ]);

      const tablesMissing =
        (rowsRes.error && (rowsRes.error.code === '42P01' || rowsRes.error.message?.includes('does not exist'))) ||
        (carsRes.error && (carsRes.error.code === '42P01' || carsRes.error.message?.includes('does not exist')));

      if (tablesMissing) {
        setMigrationNeeded(true);
        return;
      }

      if (rowsRes.error) throw rowsRes.error;
      if (carsRes.error) throw carsRes.error;

      setRows(rowsRes.data ?? []);
      setCars(carsRes.data ?? []);
      // Stock cars: sort available first, then by make
      const stock = (stockRes.data ?? []) as StockCar[];
      setStockCars([...stock.filter(c => c.is_available), ...stock.filter(c => !c.is_available)]);
      setMigrationNeeded(false);
    } catch (err: any) {
      const isMissing = err?.code === '42P01' || err?.message?.includes('does not exist');
      if (isMissing) setMigrationNeeded(true);
      else console.error('Showroom fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived Data ──

  const getCarsInRow = useCallback((rowId: string) =>
    cars.filter(c => c.row_id === rowId).sort((a, b) => a.position_in_row - b.position_in_row),
    [cars]);

  const getUnassignedCars = useCallback(() => cars.filter(c => !c.row_id), [cars]);

  const getRetrievalSequence = useCallback((car: ShowroomCar): ShowroomCar[] => {
    if (!car.row_id) return [];
    const rowCars = getCarsInRow(car.row_id);
    const idx = rowCars.findIndex(c => c.id === car.id);
    return rowCars.slice(0, idx);
  }, [getCarsInRow]);

  const getBlockingCount = useCallback((car: ShowroomCar) => getRetrievalSequence(car).length, [getRetrievalSequence]);

  // ── Row Operations ──

  const handleSaveRow = async (name: string, description: string) => {
    setSaving(true);
    try {
      if (editingRow) {
        await supabase.from('showroom_rows').update({ name, description }).eq('id', editingRow.id);
        setEditingRow(null);
      } else {
        const maxOrder = rows.length > 0 ? Math.max(...rows.map(r => r.display_order)) : 0;
        await supabase.from('showroom_rows').insert({ name, description, display_order: maxOrder + 1 });
        setShowAddRowModal(false);
      }
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    const rowCars = getCarsInRow(rowId);
    const msg = rowCars.length > 0
      ? `This lane has ${rowCars.length} car(s). Deleting it will move them to Unassigned. Continue?`
      : 'Delete this empty lane?';
    if (!window.confirm(msg)) return;

    if (rowCars.length > 0) {
      await supabase.from('showroom_cars')
        .update({ row_id: null, position_in_row: 0, updated_at: new Date().toISOString() })
        .eq('row_id', rowId);
    }
    await supabase.from('showroom_rows').delete().eq('id', rowId);
    await fetchData();
  };

  // ── Car Operations ──

  const handleSaveCar = async (data: Partial<ShowroomCar>) => {
    setSaving(true);
    try {
      if (editingCar) {
        // If changing to a new row, need to renormalize
        const needsRenormalize = data.row_id !== editingCar.row_id;
        const oldRowId = editingCar.row_id;

        await supabase.from('showroom_cars')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingCar.id);

        // Renormalize old row if moved out
        if (needsRenormalize && oldRowId) {
          await renormalizeRow(oldRowId, editingCar.id);
        }
        setEditingCar(null);
      } else {
        // Inserting: if position is specified and there are cars in the way, shift them down
        if (data.row_id && data.position_in_row) {
          await shiftPositionsUp(data.row_id, data.position_in_row);
        }
        await supabase.from('showroom_cars').insert({
          registration: data.registration,
          make: data.make ?? '',
          model: data.model ?? '',
          color: data.color ?? '',
          notes: data.notes ?? '',
          row_id: data.row_id ?? null,
          position_in_row: data.position_in_row ?? 0,
        });
        setShowAddCarModal(false);
      }
      await fetchData();
    } finally {
      setSaving(false);
    }
  };

  // Shift cars at >= targetPos down by 1 to make room for an insertion
  const shiftPositionsUp = async (rowId: string, targetPos: number) => {
    const rowCars = getCarsInRow(rowId).filter(c => c.position_in_row >= targetPos);
    if (rowCars.length === 0) return;
    // Do shifts in reverse order to avoid conflicts
    for (const car of rowCars.reverse()) {
      await supabase.from('showroom_cars')
        .update({ position_in_row: car.position_in_row + 1, updated_at: new Date().toISOString() })
        .eq('id', car.id);
    }
  };

  // Renormalize positions in a row after a removal
  const renormalizeRow = async (rowId: string, excludeId?: string) => {
    const rowCars = getCarsInRow(rowId)
      .filter(c => c.id !== excludeId)
      .sort((a, b) => a.position_in_row - b.position_in_row);

    for (let i = 0; i < rowCars.length; i++) {
      if (rowCars[i].position_in_row !== i + 1) {
        await supabase.from('showroom_cars')
          .update({ position_in_row: i + 1, updated_at: new Date().toISOString() })
          .eq('id', rowCars[i].id);
      }
    }
  };

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Remove this car from the showroom?')) return;
    const car = cars.find(c => c.id === carId);
    await supabase.from('showroom_cars').delete().eq('id', carId);
    if (car?.row_id) await renormalizeRow(car.row_id, carId);
    await fetchData();
  };

  const handleMoveCar = async (car: ShowroomCar, direction: 'forward' | 'backward') => {
    if (!car.row_id) return;
    const rowCars = getCarsInRow(car.row_id);
    const idx = rowCars.findIndex(c => c.id === car.id);
    const swapIdx = direction === 'forward' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rowCars.length) return;

    const swapCar = rowCars[swapIdx];
    const now = new Date().toISOString();
    await Promise.all([
      supabase.from('showroom_cars').update({ position_in_row: swapCar.position_in_row, updated_at: now }).eq('id', car.id),
      supabase.from('showroom_cars').update({ position_in_row: car.position_in_row, updated_at: now }).eq('id', swapCar.id),
    ]);
    await fetchData();
  };

  // ── Stats ──

  const totalCarsInRows = cars.filter(c => c.row_id).length;
  const freeCars = cars.filter(c => c.row_id && getBlockingCount(c) === 0);
  const blockedCars = cars.filter(c => c.row_id && getBlockingCount(c) > 0);
  const unassigned = getUnassignedCars();

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
    <div className="space-y-4">
      {/* ── Header & Stats ── */}
      <div className="admin-glass-card !rounded-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Showroom Parking</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Visual layout of which cars are blocking which — tap "Retrieve" on any car for a step-by-step key guide.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAddRowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lane
            </button>
            <button
              onClick={() => setShowAddCarModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 btn-glass-red text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Car
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Cars in Showroom', value: cars.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Parking Lanes', value: rows.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Free to Move', value: freeCars.length + unassigned.length, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Blocked', value: blockedCars.length, color: 'text-red-600 dark:text-red-400' },
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
            <span className="text-gray-600 dark:text-gray-400">1 car blocking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">2+ cars blocking</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-gray-400 dark:text-gray-500">
            <ArrowLeft className="w-3 h-3" />
            <span>Use ← → arrows to reorder cars within a lane</span>
          </div>
        </div>
      </div>

      {/* ── Lanes ── */}
      {rows.length === 0 && cars.length === 0 ? (
        <div className="admin-glass-card !rounded-xl p-12 text-center">
          <Car className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Showroom is empty</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Start by adding a parking lane (e.g. "Front Row", "Back Alley"), then add your cars to each lane in the order they're parked — closest to the exit first.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowAddRowModal(true)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors">
              <MapPin className="w-4 h-4" /> Add First Lane
            </button>
            <button onClick={() => setShowAddCarModal(true)} className="flex items-center gap-2 px-5 py-2.5 btn-glass-red text-white rounded-lg text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Add First Car
            </button>
          </div>
        </div>
      ) : (
        rows.map(row => (
          <LaneSection
            key={row.id}
            row={row}
            cars={getCarsInRow(row.id)}
            onRetrieve={setRetrievingCar}
            onEditCar={setEditingCar}
            onDeleteCar={handleDeleteCar}
            onMoveCar={handleMoveCar}
            onEditRow={setEditingRow}
            onDeleteRow={handleDeleteRow}
            getBlockingCount={getBlockingCount}
          />
        ))
      )}

      {/* ── Unassigned Cars ── */}
      {unassigned.length > 0 && (
        <div className="admin-glass-card !rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Unassigned Cars</h3>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
              {unassigned.length}
            </span>
            <Info className="w-4 h-4 text-gray-400 ml-1" title="These cars are in your showroom but not placed in a lane yet." />
          </div>
          <div className="p-4 sm:p-5 flex flex-wrap gap-3">
            {unassigned.map(car => (
              <div
                key={car.id}
                className="flex-shrink-0 w-44 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-3"
              >
                <p className="text-lg font-black text-gray-900 dark:text-white tracking-widest">{car.registration}</p>
                {(car.make || car.model) && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{[car.make, car.model].filter(Boolean).join(' ')}</p>}
                {car.color && <p className="text-xs text-gray-400 dark:text-gray-500">{car.color}</p>}
                <div className="mt-2 flex gap-1">
                  <button onClick={() => setEditingCar(car)} className="flex-1 flex items-center justify-center py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 hover:text-blue-600 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCar(car.id)} className="flex-1 flex items-center justify-center py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {retrievingCar && (
        <RetrieveModal
          car={retrievingCar}
          sequence={getRetrievalSequence(retrievingCar)}
          rowName={rows.find(r => r.id === retrievingCar.row_id)?.name ?? 'Unassigned'}
          onClose={() => setRetrievingCar(null)}
        />
      )}

      {(showAddRowModal || editingRow) && (
        <RowModal
          initial={editingRow}
          allRows={rows}
          onSave={handleSaveRow}
          onClose={() => { setShowAddRowModal(false); setEditingRow(null); }}
          saving={saving}
        />
      )}

      {(showAddCarModal || editingCar) && (
        <CarModal
          initial={editingCar}
          rows={rows}
          allCars={cars}
          stockCars={stockCars}
          onSave={handleSaveCar}
          onClose={() => { setShowAddCarModal(false); setEditingCar(null); }}
          saving={saving}
        />
      )}
    </div>
  );
};

export default ShowroomManager;
