import { useEffect, useState } from 'react';
import { 
  TrendingUp, TrendingDown, FileText, CheckCircle, AlertCircle,
  Target, Users, AlertTriangle, FolderCheck, RotateCcw
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../services/database.service';
import type { DashboardStats } from '../lib/supabase';

export default function DashboardNew() {
  const [stats, setStats] = useState<DashboardStats>({
    active_employees: 0,
    active_departments: 0,
    active_positions: 0,
    open_tasks: 0,
    overdue_tasks: 0,
    pending_approval_documents: 0,
    upcoming_revisions: 0,
  });
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, distData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getDepartmentDistribution(),
      ]);

      setStats(statsData);
      const formattedData = distData.map((item: any) => ({
        name: item.name || 'Bilinmeyen',
        code: item.code || '',
        value: item.value,
        color: getColorHex(item.code),
      }));
      setDepartmentData(formattedData);
    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorHex = (code: string) => {
    const colors: { [key: string]: string } = {
      UST: '#3B82F6',
      MALI: '#10B981',
      SATIS: '#EF4444',
      SATIN: '#F59E0B',
    };
    return colors[code] || '#6B7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  const performanceData = [
    { name: 'Pzt', deger: 85 },
    { name: 'Sal', deger: 78 },
    { name: 'Çar', deger: 92 },
    { name: 'Per', deger: 88 },
    { name: 'Cum', deger: 95 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Sistem özeti ve performans metrikleri</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          title="Aktif Çalışan"
          value={stats.active_employees.toString()}
          change="Canlı veri"
          isPositive={true}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Departman"
          value={stats.active_departments.toString()}
          change="Canlı veri"
          isPositive={true}
          icon={Target}
          color="green"
        />
        <StatCard
          title="Pozisyon"
          value={stats.active_positions.toString()}
          change="Canlı veri"
          isPositive={true}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Açık Görev"
          value={stats.open_tasks.toString()}
          change="Canlı veri"
          isPositive={true}
          icon={CheckCircle}
          color="orange"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Geciken Görev"
          value={stats.overdue_tasks.toString()}
          change={stats.overdue_tasks > 0 ? 'Dikkat!' : 'Yok'}
          isPositive={stats.overdue_tasks === 0}
          icon={AlertTriangle}
          color={stats.overdue_tasks > 0 ? 'red' : 'green'}
        />
        <StatCard
          title="Onay Bekleyen Doküman"
          value={stats.pending_approval_documents.toString()}
          change="İnceleme"
          isPositive={true}
          icon={FolderCheck}
          color="indigo"
        />
        <StatCard
          title="Revizyon Bekleyen"
          value={stats.upcoming_revisions.toString()}
          change="Takip"
          isPositive={true}
          icon={RotateCcw}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Haftalık Performans</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="deger" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Departman Pozisyon Dağılımı</h2>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Veritabanından veri bekleniyor...
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <AlertCircle size={24} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Supabase Bağlantısı</h3>
            <p className="text-gray-600 mt-2">
              Bu dashboard veritabanından canlı veri çekmektedir. Supabase bağlantısı yapılandırıldıktan sonra
              gerçek istatistikler görüntülenecektir.
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-500">Aktif Çalışan</p>
                <p className="text-xl font-bold text-blue-600">{stats.active_employees}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-500">Departman</p>
                <p className="text-xl font-bold text-green-600">{stats.active_departments}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-500">Açık Görev</p>
                <p className="text-xl font-bold text-orange-600">{stats.open_tasks}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-gray-500">Geciken Görev</p>
                <p className={`text-xl font-bold ${stats.overdue_tasks > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.overdue_tasks}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'amber';
}

function StatCard({ title, value, change, isPositive, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105 duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <div className="flex items-center mt-2">
            {isPositive ? (
              <TrendingUp size={16} className="text-green-600 mr-1" />
            ) : (
              <TrendingDown size={16} className="text-red-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
}
