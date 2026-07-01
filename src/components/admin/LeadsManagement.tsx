import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type Lead, type Car, type NoteEntry } from '../../lib/supabase';
import {
  Search, X, Phone, Mail, MessageSquare, 
  User, RefreshCw, Save, Plus, 
  CheckCircle, AlertCircle, FileText, Trash2
} from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';

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
    'new':       'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400',
    'contacted': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400',
    'converted': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400',
    'lost':      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

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
  email_sent: false,
  notes: '',
  notes_history: [],
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

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string | null;
    label: string;
  }>({ isOpen: false, id: null, label: '' });

  const [newNote, setNewNote] = useState('');

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
        .select('*, notes_history')
        .order('created_at', { ascending: false });
      if (error) throw error;
      console.log('Fetched leads with notes:', data?.map(l => ({ name: l.customer_name, notes_count: l.notes_history?.length || 0 })));
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
    setNewNote('');
  };

  const openAdd = () => {
    setSelected(null);
    setIsAdding(true);
    setEditData(emptyLead());
    setNewNote('');
  };

  const closeDrawer = () => { 
    setSelected(null); 
    setIsAdding(false);
    setNewNote('');
  };

  const patch = (p: Partial<Lead>) => setEditData(prev => ({ ...prev, ...p }));

  const addNote = () => {
    if (!newNote.trim()) return;
    
    const noteEntry: NoteEntry = {
      date: new Date().toISOString(),
      note: newNote.trim(),
      user: 'Admin'
    };

    const history = [...(editData.notes_history || []), noteEntry];
    patch({ notes_history: history });
    setNewNote('');
  };

  const removeNote = (index: number) => {
    const history = [...(editData.notes_history || [])];
    history.splice(index, 1);
    patch({ notes_history: history });
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
        customer_name: editData.customer_name,
        customer_email: editData.customer_email || null,
        customer_phone: editData.customer_phone || null,
        source: editData.source,
        car_id: editData.car_id || null,
        car_details: editData.car_details || null,
        status: editData.status || 'new',
        contacted: editData.contacted || false,
        answered: editData.answered || false,
        message_left: editData.message_left || false,
        email_sent: editData.email_sent || false,
        notes: editData.notes || null,
        notes_history: editData.notes_history || [],
        updated_at: new Date().toISOString(),
      };

      console.log('Saving lead with payload:', { 
        customer_name: payload.customer_name, 
        notes_history_count: payload.notes_history.length,
        notes_history: payload.notes_history
      });

      if (isAdding) {
        const insertPayload = {
          ...payload,
          created_by: user?.id,
        };
        const { data, error } = await supabase.from('leads').insert([insertPayload]).select().single();
        if (error) throw error;
        console.log('Insert result:', { id: data.id, notes_history: data.notes_history });
        setLeads(prev => [data, ...prev]);
      } else if (selected) {
        const { data: updateData, error } = await supabase.from('leads').update(payload).eq('id', selected.id).select();
        if (error) throw error;
        console.log('Update result:', updateData);
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

  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0.0';
    
    return {
      total,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.contacted).length,
      converted,
      conversionRate,
    };
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
      
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const statusOrder = { 'new': 0, 'contacted': 1, 'converted': 2, 'lost': 3 };
      
      if (a.status !== b.status) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [leads, search, statusFilter]);

  const activeFilters = statusFilter !== 'all' ? 1 : 0;
  
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: 'orange', isPercentage: true },
          { label: 'Total Leads', value: stats.total, color: 'gray' },
          { label: 'New', value: stats.new, color: 'blue' },
          { label: 'Contacted', value: stats.contacted, color: 'purple' },
          { label: 'Converted', value: stats.converted, color: 'green' },
        ].map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Toolbar */}
      <div className="admin-glass-card px-4 py-3">
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
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)}
              className={`pl-3 pr-8 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer focus:outline-none ${
                statusFilter !== 'all' 
                  ? 'bg-fnt-red text-white border-fnt-red' 
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
              }`}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
            {statusFilter !== 'all' && (
              <button 
                onClick={() => setStatusFilter('all')}
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
              className="flex items-center gap-1.5 btn-glass-red text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="admin-glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading leads...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500 gap-3">
            <User className="w-8 h-8" />
            <p className="text-sm font-medium">No leads match your filters</p>
            {(search || statusFilter !== 'all') && (
              <button 
                onClick={() => { 
                  setSearch(''); 
                  setStatusFilter('all');
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
                    'Communication',
                    'Date', 
                    ''
                  ].map(h => (
                    <th 
                      key={h} 
                      className={`px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider ${
                        h === '' ? 'text-center' : 'text-left'
                      } ${
                        h === 'Contact Info' ? 'hidden lg:table-cell' : ''
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {lead.answered && (
                            <div className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                              <Phone className="w-3 h-3" />
                            </div>
                          )}
                          {lead.message_left && (
                            <div className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                              <MessageSquare className="w-3 h-3" />
                            </div>
                          )}
                          {lead.email_sent && (
                            <div className="flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                              <Mail className="w-3 h-3" />
                            </div>
                          )}
                          {!lead.contacted && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">Not contacted</span>
                          )}
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
          getCarDisplay={getCarDisplay}
          newNote={newNote}
          setNewNote={setNewNote}
          addNote={addNote}
          removeNote={removeNote}
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
  gray:    { bg: 'bg-gray-50 dark:bg-gray-800',     text: 'text-gray-700 dark:text-gray-300',   border: 'border-l-gray-300 dark:border-l-gray-500' },
  blue:    { bg: 'bg-blue-50 dark:bg-blue-950',     text: 'text-blue-700 dark:text-blue-400',   border: 'border-l-blue-400' },
  purple:  { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-400', border: 'border-l-purple-400' },
  green:   { bg: 'bg-green-50 dark:bg-green-950',   text: 'text-green-700 dark:text-green-400', border: 'border-l-green-400' },
  orange:  { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-400', border: 'border-l-orange-400' },
};

const StatCard: React.FC<{ label: string; value: number | string; color: string; isPercentage?: boolean }> = ({ label, value, color, isPercentage }) => {
  const c = colorMap[color] || colorMap.gray;
  return (
    <div className={`${c.bg} rounded-xl border-l-4 ${c.border} px-4 py-3 ${isPercentage ? 'col-span-2 lg:col-span-1' : ''}`}>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
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
  getCarDisplay: (carId: string | null) => string | null;
  newNote: string;
  setNewNote: (v: string) => void;
  addNote: () => void;
  removeNote: (index: number) => void;
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
  getCarDisplay,
  newNote,
  setNewNote,
  addNote,
  removeNote
}) => {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isAdding ? 'Add New Lead' : data.customer_name}
            </h2>
            {!isAdding && (
              <div className="mt-2">
                <StatusBadge status={data.status} />
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Notes Journal */}
          <Section title="Notes & Activity Log" icon={<FileText className="w-4 h-4" />}>
            <div className="space-y-3">
              {/* Add New Note */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                <label className="field-label text-xs">Add Note</label>
                <div className="flex items-start gap-2">
                  <textarea 
                    className="field-input resize-none flex-1" 
                    rows={2}
                    value={newNote} 
                    onChange={e => setNewNote(e.target.value)}
                    placeholder="What happened? What did you discuss? Next steps..."
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.metaKey) {
                        e.preventDefault();
                        addNote();
                      }
                    }}
                  />
                  <button 
                    onClick={addNote}
                    className="px-3 py-2 btn-glass-red text-white rounded-lg transition text-xs font-semibold mt-1"
                    disabled={!newNote.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Press Cmd+Enter to add note quickly
                </p>
              </div>

              {/* Notes History */}
              {data.notes_history && data.notes_history.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {[...data.notes_history].reverse().map((entry, idx) => {
                    const actualIndex = data.notes_history!.length - 1 - idx;
                    return (
                      <div 
                        key={idx} 
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 group hover:border-gray-300 dark:hover:border-gray-500 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {formatDateTime(entry.date)}
                              </span>
                              {entry.user && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  by {entry.user}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.note}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNote(actualIndex);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition"
                            title="Remove note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {(!data.notes_history || data.notes_history.length === 0) && (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No notes yet. Add your first entry above.</p>
                </div>
              )}
            </div>
          </Section>

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

          {/* Lead Source & Car */}
          <Section title="Lead Details" icon={<FileText className="w-4 h-4" />}>
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
                <label className="field-label">Which Car?</label>
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
                <label className="field-label">Car Details (if not in list above)</label>
                <input 
                  className="field-input" 
                  value={data.car_details || ''} 
                  onChange={e => onChange({ car_details: e.target.value })} 
                  placeholder="e.g., 2021 BMW 3 Series"
                  disabled={!!data.car_id}
                />
              </div>

              <div>
                <label className="field-label">Status</label>
                <select 
                  className="field-input" 
                  value={data.status || 'new'} 
                  onChange={e => onChange({ status: e.target.value as LeadStatus })}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Communication Tracking */}
          <Section title="Communication" icon={<Phone className="w-4 h-4" />}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  data.answered
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-gray-200 dark:border-gray-600'
                }">
                  <input
                    type="checkbox"
                    checked={!!data.answered}
                    onChange={e => onChange({ 
                      answered: e.target.checked, 
                      contacted: e.target.checked ? true : (data.message_left || false)
                    })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <Phone className={`w-5 h-5 ${data.answered ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${data.answered ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Called (Customer Answered)
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  data.message_left
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-600'
                }">
                  <input
                    type="checkbox"
                    checked={!!data.message_left}
                    onChange={e => onChange({ 
                      message_left: e.target.checked,
                      contacted: e.target.checked ? true : (data.answered || false)
                    })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <MessageSquare className={`w-5 h-5 ${data.message_left ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${data.message_left ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Left a Text/SMS Message
                  </span>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                  data.email_sent
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <input
                    type="checkbox"
                    checked={!!data.email_sent}
                    onChange={e => onChange({ email_sent: e.target.checked, contacted: true })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <Mail className={`w-5 h-5 ${data.email_sent ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${data.email_sent ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    Sent an Email
                  </span>
                </label>
              </div>
            </div>
          </Section>

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
            className="flex-1 py-3 rounded-xl btn-glass-red text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
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

export default LeadsManagement;
