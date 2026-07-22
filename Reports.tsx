import { TrendingUp } from 'lucide-react';

export default function KPIPerformance() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">KPI ve Performans</h1>
        <p className="text-gray-600 mt-1">Performans metrikleri ve analiz raporları</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <TrendingUp size={36} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          KPI Sistemi Hazırlanıyor
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto text-lg">
          KPI sistemi, onaylı görev tanımları ve iş talimatları sisteme aktarıldıktan sonra etkinleştirilecektir.
        </p>

        <div className="mt-10 max-w-xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Sistemin çalışması için gereken adımlar:</h3>
            <div className="space-y-4">
              {[
                { step: 1, label: 'Organizasyon Yapısı', status: 'completed', color: 'green' },
                { step: 2, label: 'Pozisyon Tanımlamaları', status: 'completed', color: 'green' },
                { step: 3, label: 'Görev Tanımları (Onaylı)', status: 'pending', color: 'yellow' },
                { step: 4, label: 'İş Talimatları (Onaylı)', status: 'pending', color: 'yellow' },
                { step: 5, label: 'KPI Tanımlama', status: 'locked', color: 'gray' },
              ].map(item => (
                <div key={item.step} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    item.color === 'green' ? 'bg-green-500' : item.color === 'yellow' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}>
                    {item.status === 'completed' ? '✓' : item.step}
                  </div>
                  <span className={`text-sm ${item.color === 'gray' ? 'text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    item.color === 'green' ? 'bg-green-100 text-green-700' :
                    item.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status === 'completed' ? 'Tamamlandı' : item.status === 'pending' ? 'Devam Ediyor' : 'Bekliyor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
