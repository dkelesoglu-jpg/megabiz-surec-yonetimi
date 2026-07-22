import { useState, useEffect } from 'react';
import { Upload, FileText, FileSpreadsheet, File, Search, X, Download, Eye } from 'lucide-react';
import { documentsService, departmentsService, positionsService } from '../services/database.service';
import type { Document, Department, Position, DocumentType, DocumentStatus } from '../lib/supabase';

const docTypeConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  job_description: { icon: FileText, color: 'blue', label: 'Görev Tanımı' },
  work_instruction: { icon: FileText, color: 'green', label: 'İş Talimatı' },
  procedure: { icon: FileSpreadsheet, color: 'purple', label: 'Prosedür' },
  form: { icon: File, color: 'orange', label: 'Form' },
  report: { icon: FileSpreadsheet, color: 'indigo', label: 'Rapor' },
  policy: { icon: FileText, color: 'red', label: 'Politika' },
};

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [docData, deptData, posData] = await Promise.all([
        documentsService.getAll(),
        departmentsService.getAll(),
        positionsService.getAll(),
      ]);
      setDocs(docData);
      setDepartments(deptData);
      setPositions(posData);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally { setLoading(false); }
  };

  const filteredDocs = docs.filter(d => {
    const matchSearch = searchTerm === '' || d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.document_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === '' || d.document_type === filterType;
    const matchDept = filterDept === '' || d.department_id === filterDept;
    return matchSearch && matchType && matchDept;
  });

  const docTypeCounts = docs.reduce((acc: Record<string, number>, d) => {
    acc[d.document_type] = (acc[d.document_type] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Doküman Yönetimi</h1>
          <p className="text-gray-600 mt-1">Tüm dokümanları görüntüleyin ve yönetin</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Upload size={20} /><span>Doküman Yükle</span>
        </button>
      </div>

      {/* Type Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(docTypeConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={key} onClick={() => setFilterType(filterType === key ? '' : key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                filterType === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:shadow-md'
              }`}>
              <Icon size={20} className={`text-${cfg.color}-600 mb-2`} />
              <p className="text-xs font-medium text-gray-900">{cfg.label}</p>
              <p className="text-xs text-gray-500">{docTypeCounts[key] || 0} doküman</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input type="text" placeholder="Doküman ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tüm Departmanlar</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {docs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Henüz doküman yok</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doküman No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tür</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revizyon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocs.map(doc => {
                  const cfg = docTypeConfig[doc.document_type] || docTypeConfig.other;
                  const Icon = cfg.icon;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{doc.document_number}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Icon size={16} className={`text-${cfg.color}-600`} />
                          <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cfg.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.department?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{doc.revision_number}</td>
                      <td className="px-4 py-3"><DocStatusBadge status={doc.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-50 rounded text-blue-600" title="Aç">
                              <Eye size={16} />
                            </a>
                          )}
                          {doc.file_url && (
                            <a href={doc.file_url} download
                              className="p-1 hover:bg-green-50 rounded text-green-600" title="İndir">
                              <Download size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <DocumentUploadModal
          departments={departments}
          positions={positions}
          onClose={() => setShowModal(false)}
          onSave={async (data, file) => {
            try {
              let fileUrl: string | null = null;
              if (file) {
                const folder = data.document_type === 'job_description' ? 'job-descriptions' :
                  data.document_type === 'work_instruction' ? 'work-instructions' :
                  data.document_type === 'procedure' ? 'procedures' :
                  data.document_type === 'form' ? 'forms' :
                  data.document_type === 'report' ? 'reports' : 'other-documents';
                const fileName = `${folder}/${Date.now()}_${file.name}`;
                await documentsService.uploadFile(file, fileName);
                fileUrl = await documentsService.getFileUrl(fileName);
              }
              const docNum = `DOC-${String(docs.length + 1).padStart(3, '0')}`;
              await documentsService.create({ ...data, document_number: docNum, file_url: fileUrl });
              setShowModal(false);
              loadData();
            } catch (err) { console.error('Hata:', err); alert('Yükleme hatası'); }
          }}
        />
      )}
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Taslak', cls: 'bg-gray-100 text-gray-700' },
    review: { label: 'İncelemede', cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Onaylı', cls: 'bg-green-100 text-green-700' },
    published: { label: 'Yayında', cls: 'bg-blue-100 text-blue-700' },
    archived: { label: 'Arşiv', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || map.draft;
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.cls}`}>{s.label}</span>;
}

interface DocModalProps {
  departments: Department[];
  positions: Position[];
  onClose: () => void;
  onSave: (data: Partial<Document>, file: File | null) => Promise<void>;
}

function DocumentUploadModal({ departments, onClose, onSave }: DocModalProps) {
  // positions parametresi ileride kullanılacak
  const [form, setForm] = useState({
    title: '', document_type: 'work_instruction' as DocumentType,
    department_id: departments[0]?.id || '', position_id: '',
    document_number: '', revision_number: 'R0', publication_date: '',
    prepared_by: '', controlled_by: '', approved_by: '',
    status: 'draft' as DocumentStatus,
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.document_type) { alert('Başlık ve doküman türü zorunludur.'); return; }
    await onSave(form, file);
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Doküman Yükle</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doküman Başlığı *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doküman Türü *</label>
              <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value as DocumentType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="job_description">Görev Tanımı</option>
                <option value="work_instruction">İş Talimatı</option>
                <option value="procedure">Prosedür</option>
                <option value="form">Form</option>
                <option value="report">Rapor</option>
                <option value="policy">Politika</option>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revizyon No</label>
              <input type="text" value={form.revision_number} onChange={e => setForm(f => ({ ...f, revision_number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DocumentStatus }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="draft">Taslak</option><option value="review">İncelemede</option>
                <option value="approved">Onaylı</option><option value="published">Yayında</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hazırlayan</label>
              <input type="text" value={form.prepared_by} onChange={e => setForm(f => ({ ...f, prepared_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kontrol Eden</label>
              <input type="text" value={form.controlled_by} onChange={e => setForm(f => ({ ...f, controlled_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Onaylayan</label>
              <input type="text" value={form.approved_by} onChange={e => setForm(f => ({ ...f, approved_by: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {/* File Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop} onClick={() => document.getElementById('doc-file')?.click()}
          >
            <Upload size={28} className="mx-auto text-gray-400 mb-3" />
            {file ? (
              <div className="flex items-center justify-center space-x-2">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">{file.name}</span>
                <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-red-500"><X size={14} /></button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">Dosya yüklemek için tıklayın veya sürükleyin</p>
                <p className="text-xs text-gray-400 mt-1">PDF, Word (.docx), Excel (.xlsx)</p>
              </>
            )}
            <input id="doc-file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden"
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Yükle ve Kaydet</button>
        </div>
      </div>
    </div>
  );
}
