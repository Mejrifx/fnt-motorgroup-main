import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type StockItem } from '../../lib/supabase';
import {
  Search, X, CheckCircle, Clock, Key, FileText,
  Wrench, ChevronDown, RefreshCw, Filter, Save,
  Plus, Car as CarIcon, Stethoscope,
} from 'lucide-react';

type StockStatus = 'Ready' | 'In Prep' | 'Needs Work';
type Priority    = 'None' | 'Low' | 'High';
type MOTFilter   = 'all' | 'expired' | 'expiring_soon';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMOTStatus(d: string | null | undefined): 'expired' | 'expiring_soon' | 'valid' | 'unknown' {
  if (!d) return 'unknown';
  const diff = Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0)   return 'expired';
  if (diff <= 60) return 'expiring_soon';
  return 'valid';
}

function formatMOTDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function motDaysLabel(d: string | null | undefined) {
  if (!d) return '';
  const diff = Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  return `${diff}d left`;
}

function formatReg(reg: string | null | undefined) {
  if (!reg) return '—';
  const r = reg.replace(/\s/g, '').toUpperCase();
  // UK format: AB12 CDE
  if (r.length === 7) return `${r.slice(0, 4)} ${r.slice(4)}`;
  return r;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: StockStatus | null | undefined }> = ({ status }) => {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;
  const s: Record<StockStatus, string> = {
    'Ready':      'bg-emerald-100 text-emerald-700 border-emerald-200',
    'In Prep':    'bg-amber-100  text-amber-700  border-amber-200',
    'Needs Work': 'bg-red-100    text-red-700    border-red-200',
  };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s[status]}`}>{status}</span>;
};

const PriorityDot: React.FC<{ priority: Priority | null | undefined }> = ({ priority }) => {
  if (!priority || priority === 'None') return <span className="text-gray-300 text-xs">—</span>;
  const s = priority === 'High'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s}`}>{priority}</span>;
};

const MOTCell: React.FC<{ motExpiry: string | null | undefined }> = ({ motExpiry }) => {
  const s = getMOTStatus(motExpiry);
  const c = { expired: 'text-red-600', expiring_soon: 'text-amber-600', valid: 'text-emerald-600', unknown: 'text-gray-400' }[s];
  return (
    <div>
      <div className={`text-sm font-medium ${c}`}>{formatMOTDate(motExpiry)}</div>
      {motExpiry && <div className={`text-xs ${c} opacity-75`}>{motDaysLabel(motExpiry)}</div>}
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-gray-700">{label}</span>
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

// ─── Empty state for add new car ──────────────────────────────────────────────

const emptyItem = (): Partial<StockItem> => ({
  car_model: '', make: '', model: '', registration: '',
  mot_expiry: '', mot_carry_out: false, v5_present: false,
  num_keys: 2, service_history: '', stock_status: 'Ready',
  work_needed: '', priority: 'Low', has_video: false, has_diagnostic_report: false, notes: '',
});

// ─── Main Component ────────────────────────────────────────────────────────────

const StockManagement: React.FC = () => {
  const [items, setItems]               = useState<StockItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [selected, setSelected]         = useState<StockItem | null>(null);
  const [isAdding, setIsAdding]         = useState(false);
  const [editData, setEditData]         = useState<Partial<StockItem>>({});

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [motFilter, setMotFilter]       = useState<'all' | MOTFilter>('all');

  useEffect(() => { fetchItems(); }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_inventory')
        .select('*')
        .order('make', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error('Error fetching stock inventory:', e);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (item: StockItem) => {
    setSelected(item);
    setIsAdding(false);
    setEditData({ ...item });
  };

  const openAdd = () => {
    setSelected(null);
    setIsAdding(true);
    setEditData(emptyItem());
  };

  const closeDrawer = () => { setSelected(null); setIsAdding(false); };

  const patch = (p: Partial<StockItem>) => setEditData(prev => ({ ...prev, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...editData,
        car_model:       editData.car_model || `${editData.make} ${editData.model}`.trim(),
        registration:    editData.registration    ? editData.registration.replace(/\s/g, '').toUpperCase() : null,
        mot_expiry:      editData.mot_expiry      || null,
        service_history: editData.service_history || null,
        work_needed:     editData.work_needed     || null,
        notes:           editData.notes           || null,
        updated_at:      new Date().toISOString(),
      };

      if (isAdding) {
        const { data, error } = await supabase.from('stock_inventory').insert([payload]).select().single();
        if (error) throw error;
        setItems(prev => [...prev, data].sort((a, b) => a.make.localeCompare(b.make)));
      } else if (selected) {
        const { error } = await supabase.from('stock_inventory').update(payload).eq('id', selected.id);
        if (error) throw error;
        setItems(prev => prev.map(i => i.id === selected.id ? { ...i, ...payload } as StockItem : i));
      }
      closeDrawer();
    } catch (e) {
      console.error('Error saving stock item:', e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this vehicle from stock inventory?')) return;
    const { error } = await supabase.from('stock_inventory').delete().eq('id', id);
    if (error) { alert('Failed to delete.'); return; }
    setItems(prev => prev.filter(i => i.id !== id));
    closeDrawer();
  };

  // ─── Stats & filtered list ─────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:      items.length,
    ready:      items.filter(i => i.stock_status === 'Ready').length,
    inPrep:     items.filter(i => i.stock_status === 'In Prep').length,
    needsWork:  items.filter(i => i.stock_status === 'Needs Work').length,
    motExpired: items.filter(i => getMOTStatus(i.mot_expiry) === 'expired').length,
    noV5:       items.filter(i => i.v5_present === false).length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const statusOrder: Record<string, number> = { 'Needs Work': 0, 'In Prep': 1, 'Ready': 2 };
    const priorityOrder: Record<string, number> = { 'High': 0, 'Low': 1, 'None': 2 };
    const motOrder: Record<string, number> = { expired: 0, expiring_soon: 1, valid: 2, unknown: 3 };
    const list = items.filter(item => {
      const matchSearch = !q
        || item.car_model.toLowerCase().includes(q)
        || item.make.toLowerCase().includes(q)
        || item.model.toLowerCase().includes(q)
        || (item.registration || '').toLowerCase().includes(q)
        || (item.work_needed  || '').toLowerCase().includes(q);
      const matchStatus   = statusFilter   === 'all' || item.stock_status === statusFilter;
      const matchPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const mot = getMOTStatus(item.mot_expiry);
      const matchMOT = motFilter === 'all'
        || (motFilter === 'expired'       && mot === 'expired')
        || (motFilter === 'expiring_soon' && mot === 'expiring_soon');
      return matchSearch && matchStatus && matchPriority && matchMOT;
    });
    return list.sort((a, b) => {
      const statusA = statusOrder[a.stock_status ?? ''] ?? 3;
      const statusB = statusOrder[b.stock_status ?? ''] ?? 3;
      if (statusA !== statusB) return statusA - statusB;
      const priorityA = priorityOrder[a.priority ?? ''] ?? 3;
      const priorityB = priorityOrder[b.priority ?? ''] ?? 3;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const motA = motOrder[getMOTStatus(a.mot_expiry)];
      const motB = motOrder[getMOTStatus(b.mot_expiry)];
      return motA - motB;
    });
  }, [items, search, statusFilter, priorityFilter, motFilter]);

  const activeFilters = [statusFilter !== 'all', priorityFilter !== 'all', motFilter !== 'all'].filter(Boolean).length;
  const drawerOpen = !!selected || isAdding;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: stats.total,      color: 'gray' },
          { label: 'Ready',       value: stats.ready,      color: 'emerald' },
          { label: 'In Prep',     value: stats.inPrep,     color: 'amber' },
          { label: 'Needs Work',  value: stats.needsWork,  color: 'red' },
          { label: 'MOT Expired', value: stats.motExpired, color: 'red' },
          { label: 'No V5',       value: stats.noV5,       color: 'orange' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by reg, make, model or work needed…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill label="Status"   value={statusFilter}   options={['all','Ready','In Prep','Needs Work']} onChange={v => setStatusFilter(v as any)} />
            <FilterPill label="Priority" value={priorityFilter} options={['all','None','Low','High']}         onChange={v => setPriorityFilter(v as any)} />
            <FilterPill label="MOT" value={motFilter}
              options={['all','expired','expiring_soon']}
              labels={{ all:'All MOT', expired:'Expired', expiring_soon:'Expiring Soon' }}
              onChange={v => setMotFilter(v as any)}
            />
            {activeFilters > 0 && (
              <button onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setMotFilter('all'); }}
                className="flex items-center gap-1 text-xs text-fnt-red font-medium hover:underline">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <button onClick={fetchItems} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 bg-fnt-red hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition">
              <Plus className="w-3.5 h-3.5" /> Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading stock…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <CarIcon className="w-8 h-8" />
            <p className="text-sm font-medium">No vehicles match your filters</p>
            {(search || activeFilters > 0) && (
              <button onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); setMotFilter('all'); }}
                className="text-xs text-fnt-red hover:underline">Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  {['Vehicle', 'Reg', 'MOT', 'V5', 'Keys', 'Status', 'Priority', 'Work Needed', ''].map(h => (
                    <th key={h} className={`px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider ${h === 'V5' || h === 'Keys' || h === '' ? 'text-center' : 'text-left'} ${h === 'Priority' ? 'hidden lg:table-cell' : ''} ${h === 'Work Needed' ? 'hidden xl:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => (
                  <tr key={item.id} onClick={() => openEdit(item)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{item.car_model}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold tracking-widest bg-gray-100 text-gray-800 px-2 py-1 rounded-md">
                        {formatReg(item.registration)}
                      </span>
                    </td>
                    <td className="px-4 py-3"><MOTCell motExpiry={item.mot_expiry} /></td>
                    <td className="px-4 py-3 text-center">
                      {item.v5_present === true
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                        : item.v5_present === false
                          ? <X className="w-4 h-4 text-red-400 mx-auto" />
                          : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.num_keys != null
                        ? <div className="flex items-center justify-center gap-1"><Key className="w-3 h-3 text-gray-400" /><span className="font-medium text-gray-700">{item.num_keys}</span></div>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.stock_status} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><PriorityDot priority={item.priority} /></td>
                    <td className="px-4 py-3 hidden xl:table-cell max-w-[200px]">
                      {item.work_needed
                        ? <span className="text-xs text-gray-600 line-clamp-2">{item.work_needed}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-300 group-hover:text-fnt-red transition-colors text-sm">›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-400">Showing {filtered.length} of {items.length} vehicles</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Drawer */}
      {drawerOpen && (
        <EditDrawer
          item={selected}
          isAdding={isAdding}
          data={editData}
          saving={saving}
          onChange={patch}
          onSave={save}
          onDelete={selected ? () => deleteItem(selected.id) : undefined}
          onClose={closeDrawer}
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

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
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
  label: string; value: string; options: string[];
  labels?: Record<string, string>; onChange: (v: string) => void;
}> = ({ label, value, options, labels, onChange }) => {
  const active = value !== 'all';
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer focus:outline-none ${
          active ? 'bg-fnt-red text-white border-fnt-red' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
        }`}>
        {options.map(o => (
          <option key={o} value={o}>{labels ? (labels[o] || o) : (o === 'all' ? `All ${label}` : o)}</option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${active ? 'text-white' : 'text-gray-400'}`} />
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400">{icon}</span>
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── EditDrawer ───────────────────────────────────────────────────────────────

const EditDrawer: React.FC<{
  item: StockItem | null;
  isAdding: boolean;
  data: Partial<StockItem>;
  saving: boolean;
  onChange: (p: Partial<StockItem>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
}> = ({ item, isAdding, data, saving, onChange, onSave, onDelete, onClose }) => {
  const motStatus = getMOTStatus(data.mot_expiry as string);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isAdding ? 'Add New Vehicle' : (data.car_model || `${data.make} ${data.model}`)}
            </h2>
            {!isAdding && data.registration && (
              <span className="font-mono text-xs font-bold tracking-widest bg-gray-100 text-gray-800 px-2 py-0.5 rounded mt-1 inline-block">
                {formatReg(data.registration as string)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Vehicle Info */}
          <Section title="Vehicle" icon={<CarIcon className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Make</label>
                <input className="field-input" value={data.make as string || ''} onChange={e => onChange({ make: e.target.value, car_model: `${e.target.value} ${data.model || ''}`.trim() })} placeholder="e.g. Jaguar" />
              </div>
              <div>
                <label className="field-label">Model</label>
                <input className="field-input" value={data.model as string || ''} onChange={e => onChange({ model: e.target.value, car_model: `${data.make || ''} ${e.target.value}`.trim() })} placeholder="e.g. F-Pace" />
              </div>
            </div>
            <div className="mt-3">
              <label className="field-label">Registration Plate</label>
              <input className="field-input font-mono tracking-widest uppercase" value={data.registration as string || ''} onChange={e => onChange({ registration: e.target.value.toUpperCase() })} placeholder="e.g. KY68 ZCV" />
            </div>
          </Section>

          {/* Status & Priority */}
          <Section title="Status & Priority" icon={<Filter className="w-4 h-4" />}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Stock Status</label>
                <select className="field-input" value={data.stock_status as string || ''} onChange={e => onChange({ stock_status: e.target.value as StockStatus })}>
                  <option value="">— Select —</option>
                  <option>Ready</option><option>In Prep</option><option>Needs Work</option>
                </select>
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select className="field-input" value={data.priority as string || ''} onChange={e => onChange({ priority: e.target.value as Priority })}>
                  <option value="">— Select —</option>
                  <option>None</option><option>Low</option><option>High</option>
                </select>
              </div>
            </div>
          </Section>

          {/* MOT */}
          <Section title="MOT" icon={<Clock className="w-4 h-4" />}>
            <div>
              <label className="field-label">MOT Expiry Date</label>
              <input type="date" className="field-input" value={data.mot_expiry as string || ''} onChange={e => onChange({ mot_expiry: e.target.value })} />
              {data.mot_expiry && (
                <p className={`text-xs mt-1 font-medium ${motStatus === 'expired' ? 'text-red-500' : motStatus === 'expiring_soon' ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {motStatus === 'expired' ? `⚠ Expired — ${motDaysLabel(data.mot_expiry as string)}` :
                   motStatus === 'expiring_soon' ? `⚡ Expiring soon — ${motDaysLabel(data.mot_expiry as string)}` :
                   `✓ Valid — ${motDaysLabel(data.mot_expiry as string)}`}
                </p>
              )}
            </div>
            <div className="mt-3">
              <Toggle label="MOT needs to be carried out" checked={!!data.mot_carry_out} onChange={v => onChange({ mot_carry_out: v })} />
            </div>
          </Section>

          {/* Documentation */}
          <Section title="Documentation" icon={<FileText className="w-4 h-4" />}>
            <Toggle label="V5 in possession" checked={!!data.v5_present} onChange={v => onChange({ v5_present: v })} />
            <div className="mt-3">
              <label className="field-label">Number of Keys</label>
              <div className="flex gap-2 mt-1">
                {[1, 2].map(n => (
                  <button key={n} type="button" onClick={() => onChange({ num_keys: n })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition ${data.num_keys === n ? 'bg-fnt-black text-white border-fnt-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                    <Key className="w-3.5 h-3.5" /> {n} {n === 1 ? 'Key' : 'Keys'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <label className="field-label">Service History</label>
              <input className="field-input" value={data.service_history as string || ''} onChange={e => onChange({ service_history: e.target.value })} placeholder="e.g. 5 Services (3 Main Dealer)" />
            </div>
          </Section>

          {/* Work Required */}
          <Section title="Work Required" icon={<Wrench className="w-4 h-4" />}>
            <textarea className="field-input resize-none" rows={3} value={data.work_needed as string || ''} onChange={e => onChange({ work_needed: e.target.value })} placeholder="Describe any work that needs to be done…" />
          </Section>

          {/* Additional */}
          <Section title="Additional" icon={<Stethoscope className="w-4 h-4" />}>
            <Toggle label="Video available"              checked={!!data.has_video}             onChange={v => onChange({ has_video: v })} />
            <Toggle label="Diagnostic report available"  checked={!!data.has_diagnostic_report} onChange={v => onChange({ has_diagnostic_report: v })} />
            <div className="mt-3">
              <label className="field-label">Notes</label>
              <textarea className="field-input resize-none" rows={2} value={data.notes as string || ''} onChange={e => onChange({ notes: e.target.value })} placeholder="Any additional notes…" />
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
          {onDelete && (
            <button onClick={onDelete} className="px-4 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition">
              Delete
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-fnt-red text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> {isAdding ? 'Add Vehicle' : 'Save Changes'}</>}
          </button>
        </div>
      </div>
    </>
  );
};

// Need Save icon
function Save(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export default StockManagement;
