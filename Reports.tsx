import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { positionsService, departmentsService } from '../services/database.service';
import type { Position, Department } from '../lib/supabase';

interface OrgChartProps {
  positions: Position[];
  zoom: number;
  onPositionClick: (position: Position) => void;
}

function OrgChart({ positions, zoom, onPositionClick }: OrgChartProps) {
  const renderPosition = (position: Position) => {
    const deptColor = position.department ? getDeptColor(position.department.code) : 'gray';
    const colorClasses = getColorClasses(deptColor);
    const children = positions.filter(p => p.reports_to_position_id === position.id);

    return (
      <div key={position.id} className="flex flex-col items-center">
        <div
          onClick={() => onPositionClick(position)}
          className={`relative w-64 p-4 border-2 ${colorClasses.border} ${colorClasses.bg}
            rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105 duration-200`}
        >
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-white border ${colorClasses.border}`}>
              <span className="text-lg font-bold" style={{ color: colorClasses.textColor }}>
                {position.employee?.full_name?.charAt(0) || position.title.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{position.title}</h3>
              {position.employee && (
                <p className="text-xs text-gray-600 mt-1">{position.employee.full_name}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{position.department?.name}</p>
              {children.length > 0 && (
                <div className="flex items-center space-x-1 mt-2 text-xs text-gray-600">
                  <span>{children.length} Bağlı</span>
                </div>
              )}
            </div>
          </div>
          {position.deputy_position_id && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
              Vekil
            </div>
          )}
        </div>

        {children.length > 0 && (
          <div className="mt-8">
            <div className="w-px h-8 bg-gray-300 mx-auto"></div>
            {children.length > 1 && (
              <div className="relative h-px bg-gray-300" style={{ width: `${children.length * 280}px`, marginLeft: `-${(children.length - 1) * 140}px` }}>
                {children.map((_, index) => (
                  <div key={index} className="absolute w-px h-8 bg-gray-300" style={{ left: `${(index / Math.max(children.length - 1, 1)) * 100}%` }}></div>
                ))}
              </div>
            )}
            <div className="flex justify-center gap-8 mt-8">
              {children.map(child => renderPosition(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootPosition = positions.find(p => !p.reports_to_position_id);
  if (!rootPosition) return <p className="text-gray-500 text-center py-8">Kök pozisyon bulunamadı</p>;

  return (
    <div className="min-w-max py-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.3s ease' }}>
      {renderPosition(rootPosition)}
    </div>
  );
}

function getDeptColor(code?: string): string {
  const colors: Record<string, string> = { UST: 'blue', MALI: 'green', SATIS: 'red', SATIN: 'amber' };
  return (code && colors[code]) || 'gray';
}

function getColorClasses(color: string) {
  const map: Record<string, { bg: string; border: string; textColor: string }> = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', textColor: '#3B82F6' },
    green: { bg: 'bg-green-50', border: 'border-green-200', textColor: '#10B981' },
    red: { bg: 'bg-red-50', border: 'border-red-200', textColor: '#EF4444' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', textColor: '#F59E0B' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', textColor: '#6B7280' },
  };
  return map[color] || map.gray;
}

export default function Organization() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zoom, setZoom] = useState(100);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [activeTab, setActiveTab] = useState<'chart' | 'departments' | 'positions' | 'employees'>('chart');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [posData, deptData] = await Promise.all([
        positionsService.getAll(),
        departmentsService.getAll(),
      ]);
      setPositions(posData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Organizasyon verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Organizasyon Yapısı</h1>
          <p className="text-gray-600 mt-1">Şirket organizasyon şeması ve pozisyon yönetimi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex space-x-1">
          {([
            { id: 'chart', label: 'Organizasyon Şeması' },
            { id: 'departments', label: 'Departmanlar' },
            { id: 'positions', label: 'Pozisyonlar' },
            { id: 'employees', label: 'Çalışanlar' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart View */}
      {activeTab === 'chart' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Zoom: {zoom}%</span>
              <div className="flex items-center space-x-2">
                <button onClick={() => setZoom(p => Math.max(p - 10, 50))} disabled={zoom <= 50}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <ZoomOut size={20} />
                </button>
                <button onClick={() => setZoom(100)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Maximize2 size={20} />
                </button>
                <button onClick={() => setZoom(p => Math.min(p + 10, 150))} disabled={zoom >= 150}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <ZoomIn size={20} />
                </button>
              </div>
            </div>
            <span className="text-sm text-gray-600">{positions.length} Pozisyon</span>
          </div>
          <div className="overflow-x-auto pb-8">
            <OrgChart positions={positions} zoom={zoom} onPositionClick={setSelectedPosition} />
          </div>
        </div>
      )}

      {/* Departments View */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map(dept => {
            const deptPositions = positions.filter(p => p.department_id === dept.id);
            const managerPos = deptPositions.find(p => p.id === dept.manager_position_id);
            return (
              <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500">Kod: {dept.code}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${dept.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {dept.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                {dept.description && <p className="text-sm text-gray-600 mb-4">{dept.description}</p>}
                {managerPos && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-500">Müdür: </span>
                    <span className="font-medium text-gray-900">{managerPos.title}</span>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">{deptPositions.length} Pozisyon</p>
                  <div className="space-y-1">
                    {deptPositions.map(p => (
                      <div key={p.id} className="text-sm text-gray-700 flex items-center justify-between">
                        <span>{p.title}</span>
                        {p.employee && <span className="text-xs text-gray-500">{p.employee.full_name}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Positions View */}
      {activeTab === 'positions' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pozisyon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departman</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raporlama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map(pos => (
                <tr key={pos.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedPosition(pos)}>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{pos.code}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{pos.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.department?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.employee?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {pos.reports_to_position_id ? positions.find(p => p.id === pos.reports_to_position_id)?.title || '-' : 'Üst Yönetim'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Employees View */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-posta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departman</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pozisyon</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.filter(p => p.employee).map(pos => (
                <tr key={pos.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{pos.employee?.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.employee?.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.department?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      {pos.employee?.employment_status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Position Detail Modal */}
      {selectedPosition && (
        <PositionDetail position={selectedPosition} positions={positions} onClose={() => setSelectedPosition(null)} />
      )}
    </div>
  );
}

function PositionDetail({ position, positions, onClose }: { position: Position; positions: Position[]; onClose: () => void }) {
  const [tab, setTab] = useState('info');
  const reportsTo = positions.find(p => p.id === position.reports_to_position_id);
  const deputy = positions.find(p => p.id === position.deputy_position_id);
  const subordinates = positions.filter(p => p.reports_to_position_id === position.id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{position.title}</h2>
            <p className="text-gray-600">{position.department?.name} • {position.code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><span className="text-xl">&times;</span></button>
        </div>

        <div className="flex border-b border-gray-200 px-6 overflow-x-auto">
          {['info', 'description', 'authority', 'instructions', 'processes', 'forms', 'kpi'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
              } ${t === 'kpi' ? 'opacity-50' : ''}`}>
              {t === 'info' ? 'Pozisyon Bilgileri' : t === 'description' ? 'Görev Tanımı' : t === 'authority' ? 'Yetki ve Sorumluluklar'
                : t === 'instructions' ? 'İş Talimatları' : t === 'processes' ? 'Bağlı Süreçler' : t === 'forms' ? 'Formlar' : 'KPI'}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['Pozisyon Kodu', position.code],
                  ['Pozisyon Adı', position.title],
                  ['Departman', position.department?.name || '-'],
                  ['Çalışan', position.employee?.full_name || 'Atanmadı'],
                  ['Bağlı Olduğu Yönetici', reportsTo?.title || '-'],
                  ['Vekil', deputy?.title || 'Atanmadı'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="text-base font-medium text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              {subordinates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Bağlı Pozisyonlar</h3>
                  <div className="space-y-2">
                    {subordinates.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sub.title}</p>
                          <p className="text-xs text-gray-600">{sub.employee?.full_name || 'Atanmadı'}</p>
                        </div>
                        <span className="text-xs text-gray-500">{sub.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'kpi' && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KPI Sistemi Aktif Değil</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                KPI sistemi, onaylı görev tanımları ve iş talimatları sisteme aktarıldıktan sonra etkinleştirilecektir.
              </p>
            </div>
          )}

          {['description', 'authority', 'instructions', 'processes', 'forms'].includes(tab) && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Doküman Yükleme Alanı</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                Bu bölümde görev tanımı, iş talimatı ve ilgili dokümanları yükleyebilirsiniz.
                Desteklenen formatlar: PDF, Word, Excel
              </p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors max-w-md mx-auto">
                <p className="text-sm text-gray-500 mb-2">Dosya yüklemek için tıklayın veya sürükleyin</p>
                <p className="text-xs text-gray-400">PDF, Word (.docx), Excel (.xlsx)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
