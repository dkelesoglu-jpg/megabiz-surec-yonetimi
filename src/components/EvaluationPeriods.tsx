import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  CalendarRange,
  Edit2,
  Archive,
  X,
  AlertCircle,
} from 'lucide-react';
import { evaluationPeriodsService, departmentsService } from '../services/database.service';
import type { EvaluationPeriod, Department, EvaluationType, EvaluationScope, PeriodStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const evaluationTypeLabels: Record<EvaluationType, string> = {
  manager: 'Yönetici Değerlendirmesi',
  self: 'Öz Değerlendirme',
  peer: 'Akran Değerlendirmesi',
  subordinate: 'Alt Çalışan Değerlendirmesi',
  mixed: 'Karma Değerlendirme',
};

const scopeLabels: Record<EvaluationScope, string> = {
  all_company: 'Tüm Şirket',
  department: 'Departman',
};

const statusLabels: Record<PeriodStatus, string> = {
  draft: 'Taslak',
  active: 'Aktif',
  completed: 'Tamamlandı',
  archived: 'Arşivlendi',
};

const statusColors: Record<PeriodStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-600',
};

interface FormState {
  name: string;
  start_date: string;
  end_date: string;
  evaluation_type: EvaluationType;
  scope: EvaluationScope;
  department_id: string;
  status: PeriodStatus;
}

const emptyForm: FormState = {
  name: '',
  start_date: '',
  end_date: '',
  evaluation_type: 'manager',
  scope: 'all_company',
  department_id: '',
  status: 'draft',
};

export default function EvaluationPeriods() {
  const { profile } = useAuth();
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sadece yönetici ve İK kullanıcıları dönem oluşturabilir/güncelleyebilir.
  // (Sunucu tarafında da RLS bu rollerle sınırlıdır.)
  const canManage = !!profile && ['system_admin', 'human_resources', 'board_chairman', 'general_manager', 'deputy_general_manager'].includes(profile.role);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [periodData, deptData] = await Promise.all([
        evaluationPeriodsService.getAll(),
        departmentsService.getAll(),
      ]);
      setPeriods(periodData);
      setDepartments(deptData);
    } catch (err: any) {
      console.error('Dönemler yüklenirken hata:', err);
      setError(err?.message || 'Dönemler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (period: EvaluationPeriod) => {
    setEditingId(period.id);
    setForm({
      name: period.name,
      start_date: period.start_date ? period.start_date.slice(0, 10) : '',
      end_date: period.end_date ? period.end_date.slice(0, 10) : '',
      evaluation_type: period.evaluation_type,
      scope: period.scope,
      department_id: period.department_id ?? '',
      status: period.status,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    // Temel doğrulama
    if (!form.name.trim()) { setError('Dönem adı zorunludur.'); return; }
    if (!form.start_date || !form.end_date) { setError('Başlangıç ve bitiş tarihleri zorunludur.'); return; }
    if (new Date(form.end_date) < new Date(form.start_date)) { setError('Bitiş tarihi başlangıç tarihinden önce olamaz.'); return; }

    const payload: any = {
      name: form.name.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      evaluation_type: form.evaluation_type,
      scope: form.scope,
      status: form.status,
      department_id: form.scope === 'department' && form.department_id ? form.department_id : null,
      created_by: profile?.employee_id ?? null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await evaluationPeriodsService.update(editingId, payload);
      } else {
        await evaluationPeriodsService.create(payload);
      }
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      // Gerçek Supabase hata detayı geliştirme konsoluna logSupabaseError ile yazılır.
      console.error('Dönem kaydedilirken hata:', err);
      setError(err?.message || 'Dönem kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (period: EvaluationPeriod) => {
    if (!window.confirm(`"${period.name}" dönemini arşivlemek istediğinize emin misiniz?`)) return;
    setError('');
    try {
      await evaluationPeriodsService.delete(period.id);
      await loadData();
    } catch (err: any) {
      console.error('Dönem arşivlenirken hata:', err);
      setError(err?.message || 'Dönem arşivlenirken bir hata oluştu.');
    }
  };

  const filteredPeriods = periods.filter(p => {
    const matchesSearch = searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('tr-TR');
    } catch {
      return date;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Değerlendirme dönemleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Değerlendirme Dönemleri</h1>
          <p className="text-gray-600 mt-1">Performans değerlendirme dönemlerini oluşturun ve yönetin</p>
        </div>
        {canManage && (
          <button onClick={openCreate}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={20} />
            <span>Yeni Dönem</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start space-x-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Dönem kaydedilirken bir hata oluştu</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-xs mt-2 text-red-500">
              Detaylı hata bilgisi (message / code / details / hint) tarayıcı konsoluna yazıldı.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Dönem ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tüm Durumlar</option>
            <option value="draft">Taslak</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="archived">Arşivlendi</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filteredPeriods.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
            <CalendarRange size={28} className="text-blue-500" />
          </div>
          <p className="text-lg font-medium mb-2">Değerlendirme dönemi bulunamadı</p>
          {canManage && <p className="text-gray-500 text-sm">Yeni bir değerlendirme dönemi oluşturmak için "Yeni Dönem" butonunu kullanın.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPeriods.map(period => (
            <div key={period.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg">{period.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[period.status]}`}>
                      {statusLabels[period.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <CalendarRange size={16} className="text-gray-400" />
                      {formatDate(period.start_date)} - {formatDate(period.end_date)}
                    </span>
                    <span className="inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{evaluationTypeLabels[period.evaluation_type]}</span>
                    <span className="inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>{scopeLabels[period.scope]}{period.scope === 'department' && period.department ? ` · ${period.department.name}` : ''}</span>
                  </div>
                </div>
                {canManage && period.status !== 'archived' && (
                  <div className="flex items-center space-x-2">
                    <button onClick={() => openEdit(period)} title="Düzenle"
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleArchive(period)} title="Arşivle"
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Archive size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Dönemi Düzenle' : 'Yeni Değerlendirme Dönemi'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dönem Adı *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Örn: 2026 Yıl Sonu Performans Değerlendirmesi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                  <input type="date" value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                  <input type="date" value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Değerlendirme Tipi</label>
                  <select value={form.evaluation_type}
                    onChange={e => setForm({ ...form, evaluation_type: e.target.value as EvaluationType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {(Object.keys(evaluationTypeLabels) as EvaluationType[]).map(type => (
                      <option key={type} value={type}>{evaluationTypeLabels[type]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <select value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as PeriodStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="draft">Taslak</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapsam</label>
                <select value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value as EvaluationScope, department_id: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all_company">Tüm Şirket</option>
                  <option value="department">Departman</option>
                </select>
              </div>

              {form.scope === 'department' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departman *</label>
                  <select value={form.department_id}
                    onChange={e => setForm({ ...form, department_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Departman seçin...</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <Plus size={18} />
                )}
                <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
