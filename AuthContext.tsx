import { useState, useEffect } from 'react';
import { Plus, Search, Clock, AlertCircle, CheckCircle, User, AlertTriangle, X } from 'lucide-react';
import { tasksService, employeesService, departmentsService } from '../services/database.service';
import type { Task, Employee, Department, TaskPriority, TaskStatus } from '../lib/supabase';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [taskData, empData, deptData] = await Promise.all([
        tasksService.getAll(),
        employeesService.getAll(),
        departmentsService.getAll(),
      ]);
      setTasks(taskData);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally { setLoading(false); }
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchTerm === '' || t.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue' || (t.due_date && new Date(t.due_date) < new Date() && !['completed', 'cancelled'].includes(t.status))).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Görev Takibi</h1>
          <p className="text-gray-600 mt-1">Tüm görevleri görüntüleyin ve yönetin</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} /><span>Yeni Görev</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Bekleyen', value: pendingCount, icon: Clock, color: 'yellow' },
          { label: 'Devam Eden', value: inProgressCount, icon: AlertCircle, color: 'blue' },
          { label: 'Tamamlanan', value: completedCount, icon: CheckCircle, color: 'green' },
          { label: 'Geciken', value: overdueCount, icon: AlertTriangle, color: 'red' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${
                color === 'yellow' ? 'bg-yellow-100' : color === 'blue' ? 'bg-blue-100' :
                color === 'green' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Icon size={20} className={
                  color === 'yellow' ? 'text-yellow-600' : color === 'blue' ? 'text-blue-600' :
                  color === 'green' ? 'text-green-600' : 'text-red-600'
                } />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Görev ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tüm Durumlar</option>
            <option value="pending">Bekleyen</option>
            <option value="in_progress">Devam Eden</option>
            <option value="completed">Tamamlanan</option>
            <option value="overdue">Geciken</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <p className="text-lg font-medium mb-2">Görev bulunamadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed', 'cancelled'].includes(task.status);
            return (
              <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                      <div className="flex items-center space-x-2 shrink-0">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                    {task.description && <p className="text-sm text-gray-600 mt-2">{task.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      {task.assigned_employee && (
                        <div className="flex items-center space-x-1"><User size={14} /><span>{task.assigned_employee.full_name}</span></div>
                      )}
                      {task.department && <span>• {task.department.name}</span>}
                      {task.due_date && (
                        <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          <Clock size={14} />
                          <span>{new Date(task.due_date).toLocaleDateString('tr-TR')}{isOverdue && ' (Gecikmiş)'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TaskModal
          employees={employees}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              await tasksService.create(data);
              setShowModal(false);
              loadData();
            } catch (err) { alert('Görev oluşturulurken hata oluştu.'); }
          }}
        />
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = { low: 'Düşük', medium: 'Orta', high: 'Yüksek', urgent: 'Acil' };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[priority] || map.medium}`}>{labels[priority] || priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', overdue: 'bg-red-100 text-red-700',
  };
  const labels: Record<string, string> = { pending: 'Bekleyen', in_progress: 'Devam Ediyor', completed: 'Tamamlandı', cancelled: 'İptal', overdue: 'Gecikmiş' };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[status] || map.pending}`}>{labels[status] || status}</span>;
}

interface TaskModalProps {
  employees: Employee[];
  departments: Department[];
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
}

function TaskModal({ employees, departments, onClose, onSave }: TaskModalProps) {
  const [form, setForm] = useState({
    title: '', description: '', assigned_employee_id: '', assigned_position_id: '',
    department_id: departments[0]?.id || '', priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus, due_date: '',
  });

  const handleSubmit = async () => {
    if (!form.title) { alert('Görev başlığı zorunludur.'); return; }
    await onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Yeni Görev Oluştur</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Görev Başlığı *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sorumlu Çalışan</label>
              <select value={form.assigned_employee_id} onChange={e => setForm(f => ({ ...f, assigned_employee_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçiniz</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departman</label>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçiniz</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Öncelik</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Düşük</option><option value="medium">Orta</option>
                <option value="high">Yüksek</option><option value="urgent">Acil</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pending">Bekleyen</option><option value="in_progress">Devam Eden</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Son Tarih</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
