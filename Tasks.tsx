import { BarChart3, Calendar, TrendingUp, FileText, PieChart, Download } from 'lucide-react';
import { PieChart as RePie, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { tasksService } from '../services/database.service';

export default function Reports() {
  const [taskData, setTaskData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tasks = await tasksService.getAll();

      // Task status distribution
      const statusMap: Record<string, number> = {};
      (tasks as any[]).forEach((t: any) => { statusMap[t.status] = (statusMap[t.status] || 0) + 1; });
      setTaskData([
        { name: 'Bekleyen', value: statusMap.pending || 0, color: '#6B7280' },
        { name: 'Devam Eden', value: statusMap.in_progress || 0, color: '#3B82F6' },
        { name: 'Tamamlanan', value: statusMap.completed || 0, color: '#10B981' },
        { name: 'Geciken', value: statusMap.overdue || 0, color: '#EF4444' },
      ]);
    } catch (err) { console.error('Hata:', err); }
    finally { setLoading(false); }
  };

  const docTypeData = [
    { name: 'Görev Tanımı', value: 3, color: '#3B82F6' },
    { name: 'İş Talimatı', value: 3, color: '#10B981' },
    { name: 'Prosedür', value: 0, color: '#F59E0B' },
    { name: 'Form', value: 0, color: '#EF4444' },
    { name: 'Rapor', value: 0, color: '#8B5CF6' },
    { name: 'Politika', value: 0, color: '#6B7280' },
  ];

  const reports = [
    { id: 1, title: 'Aylık Performans Raporu', description: 'Tüm departmanların aylık performans analizi', date: '2024-01-15', type: 'Performans', icon: TrendingUp, color: 'blue' },
    { id: 2, title: 'Görev Tamamlanma Raporu', description: 'Görev tamamlanma oranları ve trendleri', date: '2024-01-12', type: 'Görevler', icon: FileText, color: 'green' },
    { id: 3, title: 'Departman Verimliliği', description: 'Departman bazlı verimlilik analizi', date: '2024-01-10', type: 'Verimlilik', icon: BarChart3, color: 'purple' },
    { id: 4, title: 'Doküman Durum Raporu', description: 'Doküman onay ve revizyon durumu', date: '2024-01-08', type: 'Doküman', icon: PieChart, color: 'orange' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Yönetim Raporları</h1>
          <p className="text-gray-600 mt-1">Detaylı analiz ve raporlar</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar size={20} /><span>Tarih Seç</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={20} /><span>Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Toplam Görev', value: '-', icon: FileText, color: 'blue' },
          { title: 'Tamamlanan', value: '-', icon: TrendingUp, color: 'green' },
          { title: 'Doküman Sayısı', value: '-', icon: BarChart3, color: 'purple' },
          { title: 'Onay Bekleyen', value: '-', icon: PieChart, color: 'orange' },
        ].map(item => (
          <div key={item.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">Veritabanından çekilecek</p>
              </div>
              <div className={`p-3 rounded-xl bg-${item.color}-500`}><item.icon size={24} className="text-white" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Görev Durum Dağılımı</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RePie>
              <Pie data={taskData} cx="50%" cy="50%" labelLine={false} label={({ name, value }: any) => `${name}: ${value}`}
                outerRadius={80} fill="#8884d8" dataKey="value">
                {taskData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Doküman Tür Dağılımı</h2>
          <ResponsiveContainer width="100%" height={250}>
            <RePie>
              <Pie data={docTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, value }: any) => `${name}: ${value}`}
                outerRadius={80} fill="#8884d8" dataKey="value">
                {docTypeData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </RePie>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reports List */}
      <h2 className="text-lg font-semibold text-gray-900">Kayıtlı Raporlar</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(report => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className={`h-2 bg-gradient-to-r from-${report.color}-500 to-${report.color}-600`}></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br from-${report.color}-500 to-${report.color}-600`}>
                  <report.icon size={24} className="text-white" />
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{report.type}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString('tr-TR')}</span>
                <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <Download size={16} /><span>İndir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
