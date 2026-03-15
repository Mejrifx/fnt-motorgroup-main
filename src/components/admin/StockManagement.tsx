import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type Car } from '../../lib/supabase';
import {
  Search, X, AlertCircle, CheckCircle, Clock, Key, FileText,
  Wrench, ChevronDown, RefreshCw, AlertTriangle, Video, Stethoscope,
  Car as CarIcon, Filter, Save,
} from 'lucide-react';

type StockStatus = 'Ready' | 'In Prep' | 'Needs Work';
type Priority = 'None' | 'Normal' | 'High';
type MOTFilter = 'all' | 'expired' | 'expiring_soon';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRegistration(car: Car): string {
  if (car.registration) return car.registration.toUpperCase();
  const fromData = car.autotrader_data?.registration;
  if (fromData) return String(fromData).toUpperCase();
  return '—';
}

function getMOTStatus(motExpiry: string | null | undefined): 'expired' | 'expiring_soon' | 'valid' | 'unknown' {
  if (!motExpiry) return 'unknown';
  const expiry = new Date(motExpiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'expired';
  if (diff <= 60) return 'expiring_soon';
  return 'valid';
}

function formatMOTDate(motExpiry: string | null | undefined): string {
  if (!motExpiry) return '—';
  return new Date(motExpiry).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function motDaysLabel(motExpiry: string | null | undefined): string {
  if (!motExpiry) return '';
  const expiry = new Date(motExpiry);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return 'Today';
  return `${diff}d`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: StockStatus | null | undefined }> = ({ status }) => {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const styles: Record<StockStatus, string> = {
    'Ready':      'bg-emerald-100 text-emerald-700 border border-emerald-200',
    'In Prep':    'bg-amber-100  text-amber-700  border border-amber-200',
    'Needs Work': 'bg-red-100    text-red-700    border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: Priority | null | undefined }> = ({ priority }) => {
  if (!priority || priority === 'None') return <span className="text-gray-400 text-xs">—</span>;
  const styles: Record<string, string> = {
    'Normal': 'bg-blue-100  text-blue-700  border border-blue-200',
    'High':   'bg-red-100   text-red-700   border border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const MOTCell: React.FC<{ motExpiry: string | null | undefined }> = ({ motExpiry }) => {
  const status = getMOTStatus(motExpiry);
  const label = motDaysLabel(motExpiry);
  const colors: Record<string, string> = {
    expired:      'text-red-600',
    expiring_soon:'text-amber-600',
    valid:        'text-emerald-600',
    unknown:      'text-gray-400',
  };
  return (
    <div>
      <div className={`text-sm font-medium ${colors[status]}`}>{formatMOTDate(motExpiry)}</div>
      {label && (
        <div className={`text-xs mt-0.5 ${colors[status]} opacity-80`}>{label}</div>
      )}
    </div>
  );
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

const StockManagement: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [editData, setEditData] = useState<Partial<Car>>({});

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [motFilter, setMotFilter] = useState<'all' | MOTFilter>('all');

  useEffect(() => { fetchCars(); }, []);

  // Close edit panel on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedCar(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('make', { ascending: true });
      if (error) throw error;
      setCars(data || []);
    } catch (err) {
      console.error('Error fetching cars for stock management:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (car: Car) => {
    setSelectedCar(car);
    setEditData({
      registration:          car.registration ?? '',
      mot_expiry:            car.mot_expiry    ?? '',
      mot_carry_out:         car.mot_carry_out ?? false,
      v5_present:            car.v5_present    ?? false,
      num_keys:              car.num_keys      ?? 2,
      service_history:       car.service_history   ?? '',
      stock_status:          car.stock_status       ?? 'Ready',
      work_needed:           car.work_needed        ?? '',
      priority:              car.priority           ?? 'Normal',
      has_video:             car.has_video          ?? false,
      has_diagnostic_report: car.has_diagnostic_report ?? false,
    });
  };

  const saveEdit = async () => {
    if (!selectedCar) return;
    setSaving(true);
    try {
      const payload: Partial<Car> = {
        ...editData,
        registration:    editData.registration    || null,
        mot_expiry:      editData.mot_expiry      || null,
        service_history: editData.service_history || null,
        work_needed:     editData.work_needed     || null,
        updated_at:      new Date().toISOString(),
      };
      const { error } = await supabase
        .from('cars')
        .update(payload)
        .eq('id', selectedCar.id);
      if (error) throw error;
      setCars(prev => prev.map(c => c.id === selectedCar.id ? { ...c, ...payload } : c));
      setSelectedCar(null);
    } catch (err) {
      console.error('Error saving stock data:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Computed stats & filtered list ─────────────────────────────────────────

  const stats = useMemo(() => ({
    total:      cars.length,
    ready:      cars.filter(c => c.stock_status === 'Ready').length,
    inPrep:     cars.filter(c => c.stock_status === 'In Prep').length,
    needsWork:  cars.filter(c => c.stock_status === 'Needs Work').length,
    motExpired: cars.filter(c => getMOTStatus(c.mot_expiry) === 'expired').length,
    noV5:       cars.filter(c => c.v5_present === false).length,
  }), [cars]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cars.filter(car => {
      const reg = getRegistration(car).toLowerCase();
      const name = `${car.make} ${car.model}`.toLowerCase();
      const matchSearch = !q || name.includes(q) || reg.includes(q) || (car.work_needed || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || car.stock_status === statusFilter;
      const matchPriority = priorityFilter === 'all' || car.priority === priorityFilter;
      const mot = getMOTStatus(car.mot_expiry);
      const matchMOT = motFilter === 'all'
        || (motFilter === 'expired'       && mot === 'expired')
        || (motFilter === 'expiring_soon' && mot === 'expiring_soon');
      return matchSearch && matchStatus && matchPriority && matchMOT;
    });
  }, [cars, search, statusFilter, priorityFilter, motFilter]);

  const activeFilterCount = [
    statusFilter !== 'all',
    priorityFilter !== 'all',
    motFilter !== 'all',
  ].filter(Boolean).length;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total"        value={stats.total}      color="gray"    />
        <StatCard label="Ready"        value={stats.ready}      color="emerald" />
        <StatCard label="In Prep"      value={stats.inPrep}     color="amber"   />
        <StatCard label="Needs Work"   value={stats.needsWork}  color="red"     />
        <StatCard label="MOT Expired"  value={stats.motExpired} color="red"     icon="alert" />
        <StatCard label="No V5"        value={stats.noV5}       color="orange"  icon="doc" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reg, make, model or work needed…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter group */}
          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill
              label="Status"
              value={statusFilter}
              options={['all', 'Ready', 'In Prep', 'Needs Work']}
              onChange={v => setStatusFilter(v as any)}
            />
            <FilterPill
              label="Priority"
              value={priorityFilter}
              options={['all', 'None', 'Normal', 'High']}
              onChange={v => setPriorityFilter(v as any)}
            />
            <FilterPill
              label="MOT"
              value={motFilter}
              options={['all', 'expired', 'expiring_soon']}
              labels={{ all: 'All', expired: 'Expired', expiring_soon: 'Expiring Soon' }}
              onChange={v => setMotFilter(v as any)}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setMotFilter('all'); }}
                className="flex items-center gap-1 text-xs text-fnt-red font-medium hover:underline"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <button
              onClick={fetchCars}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading stock…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <CarIcon className="w-8 h-8" />
            <p className="text-sm font-medium">No cars match your filters</p>
            {(search || activeFilterCount > 0) && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setMotFilter('all'); }}
                className="text-xs text-fnt-red hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Reg</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">MOT</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">V5</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Keys</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Work Needed</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(car => (
                  <TableRow
                    key={car.id}
                    car={car}
                    onEdit={() => openEdit(car)}
                  />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {cars.length} vehicles
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {selectedCar && (
        <EditDrawer
          car={selectedCar}
          data={editData}
          saving={saving}
          onChange={patch => setEditData(prev => ({ ...prev, ...patch }))}
          onSave={saveEdit}
          onClose={() => setSelectedCar(null)}
        />
      )}
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  gray:    { bg: 'bg-gray-50',    text: 'text-gray-700',    border: 'border-l-gray-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-400' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-l-amber-400' },
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-l-red-400' },
  orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-l-orange-400' },
};

const StatCard: React.FC<{
  label: string; value: number; color: string; icon?: string;
}> = ({ label, value, color, icon }) => {
  const c = colorMap[color] || colorMap.gray;
  return (
    <div className={`${c.bg} rounded-xl border-l-4 ${c.border} px-4 py-3`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs font-medium text-gray-500 mt-0.5">{label}</div>
    </div>
  );
};

// ─── FilterPill ───────────────────────────────────────────────────────────────

const FilterPill: React.FC<{
  label: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  onChange: (v: string) => void;
}> = ({ label, value, options, labels, onChange }) => {
  const display = labels ? (labels[value] || value) : value;
  const isActive = value !== 'all';
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-fnt-red ${
          isActive
            ? 'bg-fnt-red text-white border-fnt-red'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}
      >
        {options.map(o => (
          <option key={o} value={o}>{labels ? (labels[o] || o) : (o === 'all' ? `All ${label}` : o)}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${isActive ? 'text-white' : 'text-gray-400'}`} />
    </div>
  );
};

// ─── TableRow ─────────────────────────────────────────────────────────────────

const TableRow: React.FC<{ car: Car; onEdit: () => void }> = ({ car, onEdit }) => {
  const reg = getRegistration(car);
  const motStatus = getMOTStatus(car.mot_expiry);
  return (
    <tr
      onClick={onEdit}
      className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
    >
      {/* Vehicle */}
      <td className="px-4 py-3">
        <div className="font-semibold text-gray-900">{car.make} {car.model}</div>
        <div className="text-xs text-gray-400">{car.year}</div>
      </td>
      {/* Reg */}
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-bold tracking-widest bg-gray-100 text-gray-800 px-2 py-1 rounded-md">
          {reg}
        </span>
      </td>
      {/* MOT */}
      <td className="px-4 py-3">
        <MOTCell motExpiry={car.mot_expiry} />
        {motStatus === 'expired' && (
          <span className="text-xs text-red-500 font-semibold">EXPIRED</span>
        )}
      </td>
      {/* V5 */}
      <td className="px-4 py-3 text-center">
        {car.v5_present === true
          ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
          : car.v5_present === false
            ? <X className="w-4 h-4 text-red-400 mx-auto" />
            : <span className="text-gray-300 text-xs">—</span>
        }
      </td>
      {/* Keys */}
      <td className="px-4 py-3 text-center">
        {car.num_keys != null ? (
          <div className="flex items-center justify-center gap-1">
            <Key className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{car.num_keys}</span>
          </div>
        ) : <span className="text-gray-300 text-xs">—</span>}
      </td>
      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={car.stock_status} />
      </td>
      {/* Priority */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <PriorityBadge priority={car.priority} />
      </td>
      {/* Work Needed */}
      <td className="px-4 py-3 hidden xl:table-cell max-w-[200px]">
        {car.work_needed ? (
          <span className="text-xs text-gray-600 line-clamp-2">{car.work_needed}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      {/* Edit arrow */}
      <td className="px-4 py-3 text-right">
        <span className="text-gray-300 group-hover:text-fnt-red transition-colors text-sm">›</span>
      </td>
    </tr>
  );
};

// ─── EditDrawer ───────────────────────────────────────────────────────────────

const EditDrawer: React.FC<{
  car: Car;
  data: Partial<Car>;
  saving: boolean;
  onChange: (patch: Partial<Car>) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ car, data, saving, onChange, onSave, onClose }) => {
  const reg = getRegistration(car);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{car.make} {car.model}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-bold tracking-widest bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                {reg}
              </span>
              <span className="text-xs text-gray-400">{car.year}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Registration */}
          <Section title="Registration" icon={<CarIcon className="w-4 h-4" />}>
            <input
              type="text"
              value={data.registration as string || ''}
              onChange={e => onChange({ registration: e.target.value.toUpperCase() })}
              placeholder="e.g. KY68 ZCV"
              className="field-input font-mono tracking-widest uppercase"
            />
          </Section>

          {/* Status & Priority */}
          <Section title="Status & Priority" icon={<Filter className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Stock Status</label>
                <select
                  value={data.stock_status as string || ''}
                  onChange={e => onChange({ stock_status: e.target.value as StockStatus })}
                  className="field-input"
                >
                  <option value="">— Select —</option>
                  <option value="Ready">Ready</option>
                  <option value="In Prep">In Prep</option>
                  <option value="Needs Work">Needs Work</option>
                </select>
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select
                  value={data.priority as string || ''}
                  onChange={e => onChange({ priority: e.target.value as Priority })}
                  className="field-input"
                >
                  <option value="">— Select —</option>
                  <option value="None">None</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </Section>

          {/* MOT & Compliance */}
          <Section title="MOT & Compliance" icon={<Clock className="w-4 h-4" />}>
            <div className="space-y-4">
              <div>
                <label className="field-label">MOT Expiry Date</label>
                <input
                  type="date"
                  value={data.mot_expiry as string || ''}
                  onChange={e => onChange({ mot_expiry: e.target.value })}
                  className="field-input"
                />
                {data.mot_expiry && (
                  <p className={`text-xs mt-1 font-medium ${
                    getMOTStatus(data.mot_expiry as string) === 'expired' ? 'text-red-500' :
                    getMOTStatus(data.mot_expiry as string) === 'expiring_soon' ? 'text-amber-500' :
                    'text-emerald-600'
                  }`}>
                    {getMOTStatus(data.mot_expiry as string) === 'expired'
                      ? `⚠ Expired ${motDaysLabel(data.mot_expiry as string)}`
                      : getMOTStatus(data.mot_expiry as string) === 'expiring_soon'
                        ? `⚡ Expiring in ${motDaysLabel(data.mot_expiry as string)}`
                        : `✓ Valid — ${motDaysLabel(data.mot_expiry as string)} remaining`
                    }
                  </p>
                )}
              </div>
              <ToggleSwitch
                label="MOT needs to be carried out"
                checked={!!data.mot_carry_out}
                onChange={v => onChange({ mot_carry_out: v })}
              />
            </div>
          </Section>

          {/* Documentation */}
          <Section title="Documentation" icon={<FileText className="w-4 h-4" />}>
            <div className="space-y-4">
              <ToggleSwitch
                label="V5 in possession"
                checked={!!data.v5_present}
                onChange={v => onChange({ v5_present: v })}
              />
              <div>
                <label className="field-label">Number of Keys</label>
                <div className="flex gap-2 mt-1">
                  {[1, 2].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange({ num_keys: n })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition ${
                        data.num_keys === n
                          ? 'bg-fnt-black text-white border-fnt-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" /> {n} {n === 1 ? 'Key' : 'Keys'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">Service History</label>
                <input
                  type="text"
                  value={data.service_history as string || ''}
                  onChange={e => onChange({ service_history: e.target.value })}
                  placeholder="e.g. 5 Services (3 Main Dealer)"
                  className="field-input"
                />
              </div>
            </div>
          </Section>

          {/* Work Required */}
          <Section title="Work Required" icon={<Wrench className="w-4 h-4" />}>
            <textarea
              value={data.work_needed as string || ''}
              onChange={e => onChange({ work_needed: e.target.value })}
              placeholder="Describe any work that needs to be done…"
              rows={3}
              className="field-input resize-none"
            />
          </Section>

          {/* Additional */}
          <Section title="Additional" icon={<Stethoscope className="w-4 h-4" />}>
            <div className="space-y-4">
              <ToggleSwitch
                label="Video available"
                checked={!!data.has_video}
                onChange={v => onChange({ has_video: v })}
              />
              <ToggleSwitch
                label="Diagnostic report available"
                checked={!!data.has_diagnostic_report}
                onChange={v => onChange({ has_diagnostic_report: v })}
              />
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-fnt-red text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400">{icon}</span>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

export default StockManagement;
