import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, FileText, Eye, Upload, X, Edit2 } from 'lucide-react';
import { workInstructionsService, departmentsService, positionsService, documentsService } from '../services/database.service';
import type { WorkInstruction, Department, Position } from '../lib/supabase';

export default function Instructions() {
  const [instructions, setInstructions] = useState<WorkInstruction[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wiData, deptData, posData] = await Promise.all([
        workInstructionsService.getAll(),
        departmentsService.getAll(),
        positionsService.getAll(),
      ]);
      setInstructions(wiData);
      setDepartments(deptData);
      setPositions(posData);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructions = instructions.filter(wi => {
    const matchesSearch = searchTerm === '' ||
      wi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wi.document_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || wi.department_id === filterDept;
    return matchesSearch && matchesDept;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">İş talimatları yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">İş Talimatları</h1>
          <p className="text-gray-600 mt-1">Tüm iş talimatlarını görüntüleyin ve yönetin</p>
        </div>
        <button onClick={() => { setEditingId(null); setShowModal(true); }}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          <span>Yeni Talimat</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Talimat ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tüm Departmanlar</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {instructions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Henüz iş talimatı bulunmuyor</p>
            <p className="text-sm">Yeni iş talimatı eklemek için yukarıdaki butonu kullanın.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revizyon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yayın Tarihi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInstructions.map(wi => (
                  <tr key={wi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">{wi.document_number}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="font-medium text-gray-900">{wi.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{wi.department?.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{wi.revision_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={wi.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {wi.publication_date ? new Date(wi.publication_date).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => { setEditingId(wi.id); setShowModal(true); }}
                          className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Düzenle">
                          <Edit2 size={16} />
                        </button>
                        {wi.file_url && (
                          <a href={wi.file_url} target="_blank" rel="noopener noreferrer"
                            className="p-1 hover:bg-green-50 rounded text-green-600" title="Dosyayı Aç">
                            <Eye size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <WorkInstructionModal
          instruction={editingId ? instructions.find(i => i.id === editingId) || null : null}
          departments={departments}
          positions={positions}
          onClose={() => { setShowModal(false); setEditingId(null); }}
          onSave={async (data, file) => {
            try {
              let fileUrl: string | null = null;
              if (file) {
                const fileName = `work-instructions/${Date.now()}_${file.name}`;
                await documentsService.uploadFile(file, fileName);
                fileUrl = await documentsService.getFileUrl(fileName);
              }

              if (editingId) {
                const revNum = incrementRevision(instructions.find(i => i.id === editingId)?.revision_number || 'R0');
                await workInstructionsService.update(editingId, {
                  ...data,
                  revision_number: revNum,
                  file_url: fileUrl || undefined,
                });
              } else {
                const docNum = `IT-${String(instructions.length + 1).padStart(3, '0')}`;
                await workInstructionsService.create({
                  ...data,
                  document_number: docNum,
                  file_url: fileUrl,
                });
              }
              setShowModal(false);
              setEditingId(null);
              loadData();
            } catch (err) {
              console.error('Kaydederken hata:', err);
              alert('Kaydederken bir hata oluştu.');
            }
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Taslak', cls: 'bg-gray-100 text-gray-700' },
    review: { label: 'İncelemede', cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Onaylı', cls: 'bg-green-100 text-green-700' },
    archived: { label: 'Arşiv', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || map.draft;
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

function incrementRevision(rev: string): string {
  const match = rev.match(/R(\d+)/);
  if (match) return `R${parseInt(match[1]) + 1}`;
  const vMatch = rev.match(/v(\d+)\.(\d+)/);
  if (vMatch) return `v${vMatch[1]}.${parseInt(vMatch[2]) + 1}`;
  return 'R1';
}

interface WIModalProps {
  instruction: WorkInstruction | null;
  departments: Department[];
  positions: Position[];
  onClose: () => void;
  onSave: (data: Partial<WorkInstruction>, file: File | null) => Promise<void>;
}

function WorkInstructionModal({ instruction, departments, positions, onClose, onSave }: WIModalProps) {
  const [form, setForm] = useState({
    title: instruction?.title || '',
    department_id: instruction?.department_id || departments[0]?.id || '',
    position_id: instruction?.position_id || '',
    purpose: instruction?.purpose || '',
    scope: instruction?.scope || '',
    content: instruction?.content || '',
    status: instruction?.status || 'draft' as const,
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.department_id) {
      alert('Başlık ve departman zorunludur.');
      return;
    }
    await onSave(form, file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) setFile(e.dataTransfer.files[0]);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {instruction ? 'İş Talimatı Düzenle' : 'Yeni İş Talimatı'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="İş talimatı başlığı" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departman *</label>
              <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçiniz</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pozisyon</label>
              <select value={form.position_id} onChange={e => setForm(f => ({ ...f, position_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seçiniz</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amaç</label>
            <textarea value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Bu iş talimatının amacı" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kapsam</label>
            <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Bu iş talimatının kapsamı" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4} placeholder="İş talimatı içeriği (adım adım)" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="draft">Taslak</option>
              <option value="review">İncelemede</option>
              <option value="approved">Onaylı</option>
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosya Yükle</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('wi-file-input')?.click()}
            >
              <Upload size={24} className="mx-auto text-gray-400 mb-2" />
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <FileText size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-600 font-medium">{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null); }}
                    className="text-red-500 hover:text-red-700"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Dosya yüklemek için tıklayın veya sürükleyin</p>
                  <p className="text-xs text-gray-400 mt-1">Desteklenen: PDF, Word (.docx), Excel (.xlsx)</p>
                </>
              )}
              <input id="wi-file-input" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden"
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            İptal
          </button>
          <button onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            {instruction ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}
