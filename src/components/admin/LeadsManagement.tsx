import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type Lead, type Car, type CommunicationLog } from '../../lib/supabase';
import {
  Search, X, Phone, Mail, MessageSquare, Calendar, DollarSign,
  User, Tag, RefreshCw, Filter, Save, Plus, ChevronDown,
  Clock, CheckCircle, AlertCircle, TrendingUp, FileText,
  PhoneCall, MessageCircleMore, Edit3, Trash2
} from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'qualified' | 'converted' | 'lost';
type Priority = 'low' | 'medium' | 'high';
type InterestLevel = 'low' | 'medium' | 'high';

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const StatusBadge: React.FC<{ status: LeadStatus | null | undefined }> = ({ status }) => {
  if (!status) return <span className="text-gray-300 text-xs">—</span>;
  const styles: Record<LeadStatus, string> = {
    'new':         'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400',
    'contacted':   'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400',
    'in_progress': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
    'qualified':   'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400',
    'converted':   'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400',
    'lost':        'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority: Priority | null | undefined }> = ({ priority }) => {
  if (!priority) return <span className="text-gray-300 text-xs">—</span>;
  const styles: Record<Priority, string> = {
    'low':    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-400',
    'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400',
    'high':   'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
      <span className={`inline-block h-4 w-4 mt-1 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const emptyLead = (): Partial<Lead> => ({
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  source: '',
  car_id: null,
  car_details: '',
  status: 'new',
  contacted: false,
  answered: false,
  message_left: false,
  priority: 'medium',
  notes: '',
  communication_history: [],
  interest_level: null,
  budget_range: '',
  timeframe: '',
  follow_up_date: null,
  next_action: '',
  converted: false,
});

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | string>('all');
  const [contactedFilter, setContactedFilter] = useState<'all' | 'contacted' | 'not_contacted'>('all');

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
    label: string;
  }>({ isOpen: false, id: null, label: '' });

  const [newCommLog, setNewCommLog] = useState({ type: 'call', notes: '' });

  useEffect(() => { 
    fetchLeads();
    fetchCars();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deleteConfirm.isOpen) {
        setDeleteConfirm({ isOpen: false, id: null, label: '' });
        return;
      }
      closeDrawer();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [deleteConfirm.isOpen]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLeads(data || []);
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, make, model, year, price, is_available')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCars(data || []);
    } catch (e) {
      console.error('Error fetching cars:', e);
    }
  };

  const openEdit = (lead: Lead) => {
    setSelected(lead);
    setIsAdding(false);
    setEditData({ ...lead });
    setNewCommLog({ type: 'call', notes: '' });
  };

  const openAdd = () => {
    setSelected(null);
    setIsAdding(true);
    setEditData(emptyLead());
    setNewCommLog({ type: 'call', notes: '' });
  };

  const closeDrawer = () => { 
    setSelected(null); 
    setIsAdding(false);
    setNewCommLog({ type: 'call', notes: '' });
  };

  const patch = (p: Partial<Lead>) => setEditData(prev => ({ ...prev, ...p }));

  const addCommunicationLog = () => {
    if (!newCommLog.notes.trim()) return;
    
    const log: CommunicationLog = {
      date: new Date().toISOString(),
      type: newCommLog.type,
      notes: newCommLog.notes,
      user: 'Admin'
    };

    const history = [...(editData.communication_history || []), log];
    patch({ communication_history: history });
    setNewCommLog({ type: 'call', notes: '' });
  };

  const removeCommunicationLog = (index: number) => {
    const history = [...(editData.communication_history || [])];
    history.splice(index, 1);
    patch({ communication_history: history });
  };

  const save = async () => {
    if (!editData.customer_name?.trim()) {
      alert('Customer name is required');
      return;
    }
    if (!editData.source?.trim()) {
      alert('Lead source is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        ...editData,
        customer_email: editData.customer_email || null,
        customer_phone: editData.customer_phone || null,
        car_id: editData.car_id || null,
        car_details: editData.car_details || null,
        contact_date: editData.contact_date || null,
        notes: editData.notes || null,
        budget_range: editData.budget_range || null,
        timeframe: editData.timeframe || null,
        follow_up_date: editData.follow_up_date || null,
        next_action: editData.next_action || null,
        converted_date: editData.converted_date || null,
        sale_value: editData.sale_value || null,
        updated_at: new Date().toISOString(),
      };

      if (isAdding) {
        const insertPayload = {
          ...payload,
          created_by: user?.id,
          assigned_to: user?.id,
        };
        const { data, error } = await supabase.from('leads').insert([insertPayload]).select().single();
        if (error) throw error;
        setLeads(prev => [data, ...prev]);
      } else if (selected) {
        const { error } = await supabase.from('leads').update(payload).eq('id', selected.id);
        if (error) throw error;
        setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, ...payload } as Lead : l));
      }
      closeDrawer();
    } catch (e) {
      console.error('Error saving lead:', e);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = () => {
    if (!selected) return;
    const label = selected.customer_name || 'this lead';
    setDeleteConfirm({ isOpen: true, id: selected.id, label });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirm.id;
    if (!id) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Delete lead:', error);
      alert('Failed to delete. Please try again.');
      return;
    }
    setLeads(prev => prev.filter(l => l.id !== id));
    setDeleteConfirm({ isOpen: false, id: null, label: '' });
    closeDrawer();
  };

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.contacted).length,
    inProgress: leads.filter(l => l.status === 'in_progress').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.converted).length,
    highPriority: leads.filter(l => l.priority === 'high').length,
  }), [leads]);

  const leadSources = useMemo(() => {
    const sources = new Set(leads.map(l => l.source).filter(Boolean));
    return Array.from(sources).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter(lead => {
      const matchSearch = !q
        || lead.customer_name.toLowerCase().includes(q)
        || (lead.customer_email || '').toLowerCase().includes(q)
        || (lead.customer_phone || '').toLowerCase().includes(q)
        || (lead.source || '').toLowerCase().includes(q)
        || (lead.car_details || '').toLowerCase().includes(q)
        || (lead.notes || '').toLowerCase().includes(q);
      
      const matchStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;
      const matchContacted = contactedFilter === 'all' 
        || (contactedFilter === 'contacted' && lead.contacted)
        || (contactedFilter === 'not_contacted' && !lead.contacted);
      
      return matchSearch && matchStatus && matchPriority && matchSource && matchContacted;
    }).sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      const statusOrder = { 'new': 0, 'contacted': 1, 'in_progress': 2, 'qualified': 3, 'converted': 4, 'lost': 5 };
      
      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [leads, search, statusFilter, priorityFilter, sourceFilter, contactedFilter]);

  const activeFilters = [
    statusFilter !== 'all', 
    priorityFilter !== 'all', 
    sourceFilter !== 'all', 
    contactedFilter !== 'all'
  ].filter(Boolean).length;
  
  const drawerOpen = !!selected || isAdding;

  const getCarDisplay = (carId: string | null) => {
    if (!carId) return null;
    const car = cars.find(c => c.id === carId);
    if (!car) return null;
    return `${car.year} ${car.make} ${car.model} - £${car.price.toLocaleString()}`;
  };

  return (
    <div className="space-y-5 transition-colors duration-200">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Leads', value: stats.total, color: 'gray' },
          { label: 'New', value: stats.new, color: 'blue' },
          { label: 'Contacted', value: stats.contacted, color: 'purple' },
          { label: 'In Progress', value: stats.inProgress, color: 'amber' },
          { label: 'Qualified', value: stats.qualified, color: 'indigo' },
          { label: 'Converted', value: stats.converted, color: 'green' },
          { label: 'High Priority', value: stats.highPriority, color: 'red' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, source, or car..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-fnt-red focus:border-transparent transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterPill 
              label="Status" 
              value={statusFilter} 
              options={['all', 'new', 'contacted', 'in_progress', 'qualified', 'converted', 'lost']} 
              onChange={v => setStatusFilter(v as any)} 
            />
            <FilterPill 
              label="Priority" 
              value={priorityFilter} 
              options={['all', 'low', 'medium', 'high']} 
              onChange={v => setPriorityFilter(v as any)} 
            />
            <FilterPill 
              label="Contacted" 
              value={contactedFilter} 
              options={['all', 'contacted', 'not_contacted']}
              labels={{ all: 'All', contacted: 'Contacted', not_contacted: 'Not Contacted' }}
              onChange={v => setContactedFilter(v as any)} 
            />
            {leadSources.length > 0 && (
              <FilterPill 
                label="Source" 
                value={sourceFilter} 
                options={['all', ...leadSources]} 
                onChange={v => setSourceFilter(v)} 
              />
            )}
            {activeFilters > 0 && (
              <button 
                onClick={() => { 
                  setStatusFilter('all'); 
                  setPriorityFilter('all'); 
                  setSourceFilter('all');
                  setContactedFilter('all');
                }}
                className="flex items-center gap-1 text-xs text-fnt-red font-medium hover:underline"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
            <button 
              onClick={fetchLeads} 
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition" 
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={openAdd}
              className="flex items-center gap-1.5 bg-fnt-red hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 gap-3">
            <User className="w-8 h-8" />
            <p className="text-sm font-medium">No leads match your filters</p>
            {(search || activeFilters > 0) && (
              <button 
                onClick={() => { 
                  setSearch(''); 
                  setStatusFilter('all'); 
                  setPriorityFilter('all'); 
                  setSourceFilter('all');
                  setContactedFilter('all');
                }}
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
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-700/70">
                  {[
                    'Customer', 
                    'Contact Info', 
                    'Car Enquiry', 
                    'Source', 
                    'Status', 
                    'Priority',
                    'Contacted',
                    'Date', 
                    ''
                  ].map(h => (
                    <th 
                      key={h} 
                      className={`px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider ${
                        h === '' ? 'text-center' : 'text-left'
                      } ${
                        h === 'Contact Info' ? 'hidden lg:table-cell' : ''
                      } ${
                        h === 'Priority' ? 'hidden xl:table-cell' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map(lead => {
                  const carDisplay = lead.car_id ? getCarDisplay(lead.car_id) : lead.car_details;
                  return (
                    <tr 
                      key={lead.id} 
                      onClick={() => openEdit(lead)}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-700/80 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{lead.customer_name}</div>
                        {lead.follow_up_date && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Follow-up: {formatDate(lead.follow_up_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-xs space-y-0.5">
                          {lead.customer_email && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{lead.customer_email}</span>
                            </div>
                          )}
                          {lead.customer_phone && (
                            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Phone className="w-3 h-3" />
                              <span>{lead.customer_phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                          {carDisplay || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <PriorityBadge priority={lead.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {lead.contacted ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                          {lead.answered && <Phone className="w-3 h-3 text-green-500" />}
                          {lead.message_left && <MessageSquare className="w-3 h-3 text-blue-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(lead.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-300 dark:text-gray-600 group-hover:text-fnt-red transition-colors text-sm">›</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
              <p className="text-xs text-gray-400 dark:text-gray-500">Showing {filtered.length} of {leads.length} leads</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Add Drawer */}
      {drawerOpen && (
        <EditDrawer
          lead={selected}
          isAdding={isAdding}
          data={editData}
          cars={cars}
          saving={saving}
          onChange={patch}
          onSave={save}
          onDelete={selected ? openDeleteConfirm : undefined}
          onClose={closeDrawer}
          newCommLog={newCommLog}
          setNewCommLog={setNewCommLog}
          addCommunicationLog={addCommunicationLog}
          removeCommunicationLog={removeCommunicationLog}
          getCarDisplay={getCarDisplay}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Lead?"
        message={`Delete lead for "${deleteConfirm.label}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, label: '' })}
      />
    </div>
  );
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  gray:    { bg: 'bg-gray-50 dark:bg-gray-800',       text: 'text-gray-700 dark:text-gray-300',       border: 'border-l-gray-300 dark:border-l-gray-500' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950',       text: 'text-blue-700 dark:text-blue-400',       border: 'border-l-blue-400' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-950',   text: 'text-purple-700 dark:text-purple-400',   border: 'border-l-purple-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950',     text: 'text-amber-700 dark:text-amber-400',     border: 'border-l-amber-400' },
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-950',   text: 'text-indigo-700 dark:text-indigo-400',   border: 'border-l-indigo-400' },
  green:   { bg: 'bg-green-50 dark:bg-green-950',     text: 'text-green-700 dark:text-green-400',     border: 'border-l-green-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-950',         text: 'text-red-700 dark:text-red-400',         border: 'border-l-red-400' },
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const c = colorMap[color] || colorMap.gray;
  return (
    <div className={`${c.bg} rounded-xl border-l-4 ${c.border} px-4 py-3`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
};

const FilterPill: React.FC<{
  label: string; 
  value: string; 
  options: string[];
  labels?: Record<string, string>; 
  onChange: (v: string) => void;
}> = ({ label, value, options, labels, onChange }) => {
  const active = value !== 'all';
  return (
    <div className="relative">
      <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer focus:outline-none ${
          active 
            ? 'bg-fnt-red text-white border-fnt-red' 
            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
        }`}
      >
        {options.map(o => (
          <option key={o} value={o}>
            {labels ? (labels[o] || o) : (o === 'all' ? `All ${label}` : o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' '))}
          </option>
        ))}
      </select>
      <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${active ? 'text-white' : 'text-gray-400'}`} />
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const EditDrawer: React.FC<{
  lead: Lead | null;
  isAdding: boolean;
  data: Partial<Lead>;
  cars: Car[];
  saving: boolean;
  onChange: (p: Partial<Lead>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  newCommLog: { type: string; notes: string };
  setNewCommLog: (v: { type: string; notes: string }) => void;
  addCommunicationLog: () => void;
  removeCommunicationLog: (index: number) => void;
  getCarDisplay: (carId: string | null) => string | null;
}> = ({ 
  lead, 
  isAdding, 
  data, 
  cars, 
  saving, 
  onChange, 
  onSave, 
  onDelete, 
  onClose, 
  newCommLog, 
  setNewCommLog, 
  addCommunicationLog,
  removeCommunicationLog,
  getCarDisplay
}) => {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-fnt-red/5 to-red-50/50 dark:from-red-950/20 dark:to-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAdding ? 'Add New Lead' : data.customer_name}
            </h2>
            {!isAdding && (
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={data.status} />
                <PriorityBadge priority={data.priority} />
                {data.converted && (
                  <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                    Converted
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Customer Information */}
          <Section title="Customer Information" icon={<User className="w-4 h-4" />}>
            <div className="space-y-3">
              <div>
                <label className="field-label">Customer Name *</label>
                <input 
                  className="field-input" 
                  value={data.customer_name || ''} 
                  onChange={e => onChange({ customer_name: e.target.value })} 
                  placeholder="John Smith" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Email</label>
                  <input 
                    type="email"
                    className="field-input" 
                    value={data.customer_email || ''} 
                    onChange={e => onChange({ customer_email: e.target.value })} 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input 
                    type="tel"
                    className="field-input" 
                    value={data.customer_phone || ''} 
                    onChange={e => onChange({ customer_phone: e.target.value })} 
                    placeholder="07XXX XXXXXX" 
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Lead Details */}
          <Section title="Lead Details" icon={<Tag className="w-4 h-4" />}>
            <div className="space-y-3">
              <div>
                <label className="field-label">Lead Source *</label>
                <input 
                  className="field-input" 
                  value={data.source || ''} 
                  onChange={e => onChange({ source: e.target.value })} 
                  placeholder="e.g., Car Gurus, Auto Trader, Facebook, Website" 
                  list="lead-sources"
                />
                <datalist id="lead-sources">
                  <option value="Car Gurus" />
                  <option value="Auto Trader" />
                  <option value="Facebook" />
                  <option value="Instagram" />
                  <option value="Website" />
                  <option value="Walk-in" />
                  <option value="Referral" />
                  <option value="Phone Call" />
                </datalist>
              </div>
              
              <div>
                <label className="field-label">Enquired Car</label>
                <select 
                  className="field-input" 
                  value={data.car_id || ''} 
                  onChange={e => onChange({ car_id: e.target.value || null })}
                >
                  <option value="">— Select a car or enter manually below —</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model} - £{car.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="field-label">Car Details (Manual)</label>
                <input 
                  className="field-input" 
                  value={data.car_details || ''} 
                  onChange={e => onChange({ car_details: e.target.value })} 
                  placeholder="e.g., 2021 BMW 3 Series"
                  disabled={!!data.car_id}
                />
                {data.car_id && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Linked to: {getCarDisplay(data.car_id)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Status</label>
                  <select 
                    className="field-input" 
                    value={data.status || 'new'} 
                    onChange={e => onChange({ status: e.target.value as LeadStatus })}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Priority</label>
                  <select 
                    className="field-input" 
                    value={data.priority || 'medium'} 
                    onChange={e => onChange({ priority: e.target.value as Priority })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          {/* Contact Status */}
          <Section title="Contact Status" icon={<PhoneCall className="w-4 h-4" />}>
            <div className="space-y-2">
              <Toggle 
                label="Contacted" 
                checked={!!data.contacted} 
                onChange={v => onChange({ 
                  contacted: v, 
                  contact_date: v ? new Date().toISOString() : null 
                })} 
              />
              <Toggle 
                label="Customer Answered" 
                checked={!!data.answered} 
                onChange={v => onChange({ answered: v })} 
              />
              <Toggle 
                label="Message/Text Left" 
                checked={!!data.message_left} 
                onChange={v => onChange({ message_left: v })} 
              />
              
              {data.contact_date && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  Last contacted: {formatDateTime(data.contact_date)}
                </div>
              )}
            </div>
          </Section>

          {/* Lead Quality */}
          <Section title="Lead Quality" icon={<TrendingUp className="w-4 h-4" />}>
            <div className="space-y-3">
              <div>
                <label className="field-label">Interest Level</label>
                <select 
                  className="field-input" 
                  value={data.interest_level || ''} 
                  onChange={e => onChange({ interest_level: e.target.value as InterestLevel || null })}
                >
                  <option value="">— Not assessed —</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Budget Range</label>
                  <input 
                    className="field-input" 
                    value={data.budget_range || ''} 
                    onChange={e => onChange({ budget_range: e.target.value })} 
                    placeholder="£20k - £30k" 
                  />
                </div>
                <div>
                  <label className="field-label">Timeframe</label>
                  <select 
                    className="field-input" 
                    value={data.timeframe || ''} 
                    onChange={e => onChange({ timeframe: e.target.value })}
                  >
                    <option value="">— Select —</option>
                    <option value="immediate">Immediate</option>
                    <option value="within_1_week">Within 1 Week</option>
                    <option value="within_1_month">Within 1 Month</option>
                    <option value="1_3_months">1-3 Months</option>
                    <option value="just_browsing">Just Browsing</option>
                  </select>
                </div>
              </div>
            </div>
          </Section>

          {/* Follow-up */}
          <Section title="Follow-up" icon={<Calendar className="w-4 h-4" />}>
            <div className="space-y-3">
              <div>
                <label className="field-label">Follow-up Date</label>
                <input 
                  type="datetime-local"
                  className="field-input" 
                  value={data.follow_up_date ? new Date(data.follow_up_date).toISOString().slice(0, 16) : ''} 
                  onChange={e => onChange({ follow_up_date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                />
              </div>
              <div>
                <label className="field-label">Next Action</label>
                <input 
                  className="field-input" 
                  value={data.next_action || ''} 
                  onChange={e => onChange({ next_action: e.target.value })} 
                  placeholder="e.g., Call back on Tuesday, Send pricing details" 
                />
              </div>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes" icon={<FileText className="w-4 h-4" />}>
            <textarea 
              className="field-input resize-none" 
              rows={4} 
              value={data.notes || ''} 
              onChange={e => onChange({ notes: e.target.value })} 
              placeholder="General notes about this lead..."
            />
          </Section>

          {/* Communication History */}
          <Section title="Communication History" icon={<MessageCircleMore className="w-4 h-4" />}>
            <div className="space-y-3">
              {/* Add New Communication Log */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <select 
                    className="field-input flex-none w-32" 
                    value={newCommLog.type} 
                    onChange={e => setNewCommLog({ ...newCommLog, type: e.target.value })}
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="text">Text/SMS</option>
                    <option value="meeting">Meeting</option>
                    <option value="note">Note</option>
                  </select>
                  <input 
                    className="field-input flex-1" 
                    value={newCommLog.notes} 
                    onChange={e => setNewCommLog({ ...newCommLog, notes: e.target.value })}
                    placeholder="Add communication note..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addCommunicationLog();
                      }
                    }}
                  />
                  <button 
                    onClick={addCommunicationLog}
                    className="px-3 py-2 bg-fnt-red text-white rounded-lg hover:bg-red-600 transition text-xs font-semibold"
                    disabled={!newCommLog.notes.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Communication Log List */}
              {data.communication_history && data.communication_history.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...data.communication_history].reverse().map((log, idx) => {
                    const actualIndex = data.communication_history!.length - 1 - idx;
                    return (
                      <div 
                        key={idx} 
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 group hover:border-gray-300 dark:hover:border-gray-500 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="inline-flex px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                                {log.type}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(log.date)}
                              </span>
                              {log.user && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  by {log.user}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{log.notes}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCommunicationLog(actualIndex);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition"
                            title="Remove log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Section>

          {/* Conversion */}
          {(data.status === 'converted' || data.converted) && (
            <Section title="Conversion Details" icon={<DollarSign className="w-4 h-4" />}>
              <div className="space-y-3">
                <Toggle 
                  label="Converted to Sale" 
                  checked={!!data.converted} 
                  onChange={v => onChange({ 
                    converted: v,
                    converted_date: v ? (data.converted_date || new Date().toISOString()) : null
                  })} 
                />
                
                {data.converted && (
                  <>
                    <div>
                      <label className="field-label">Conversion Date</label>
                      <input 
                        type="date"
                        className="field-input" 
                        value={data.converted_date ? new Date(data.converted_date).toISOString().split('T')[0] : ''} 
                        onChange={e => onChange({ converted_date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
                      />
                    </div>
                    <div>
                      <label className="field-label">Sale Value (£)</label>
                      <input 
                        type="number"
                        className="field-input" 
                        value={data.sale_value || ''} 
                        onChange={e => onChange({ sale_value: e.target.value ? parseFloat(e.target.value) : null })} 
                        placeholder="25000" 
                      />
                    </div>
                  </>
                )}
              </div>
            </Section>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex gap-3">
          {onDelete && (
            <button 
              onClick={onDelete} 
              className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950 transition"
            >
              Delete
            </button>
          )}
          <button 
            onClick={onClose} 
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button 
            onClick={onSave} 
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-fnt-red text-white text-sm font-semibold hover:bg-red-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isAdding ? 'Add Lead' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

function Save(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

export default LeadsManagement;
