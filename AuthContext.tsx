import { 
  LayoutDashboard, 
  Network, 
  FileText, 
  CheckSquare, 
  TrendingUp, 
  FolderOpen, 
  BarChart3,
  X
} from 'lucide-react';

type Module = 'dashboard' | 'organization' | 'instructions' | 'tasks' | 'kpi' | 'documents' | 'reports';

interface SidebarProps {
  activeModule: Module;
  setActiveModule: (module: Module) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { id: 'dashboard' as Module, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'organization' as Module, label: 'Organizasyon Yapısı', icon: Network },
  { id: 'instructions' as Module, label: 'İş Talimatları', icon: FileText },
  { id: 'tasks' as Module, label: 'Görev Takibi', icon: CheckSquare },
  { id: 'kpi' as Module, label: 'KPI ve Performans', icon: TrendingUp },
  { id: 'documents' as Module, label: 'Doküman Yönetimi', icon: FolderOpen },
  { id: 'reports' as Module, label: 'Yönetim Raporları', icon: BarChart3 },
];

export default function Sidebar({ activeModule, setActiveModule, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-900 font-bold text-xl">M</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Megabiz</h1>
              <p className="text-xs text-blue-200">Süreç Yönetimi</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1 hover:bg-blue-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveModule(item.id);
                      if (window.innerWidth < 1024) {
                        setIsOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-white text-blue-900 shadow-lg' 
                        : 'text-blue-100 hover:bg-blue-700/50'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">AY</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Admin Yönetici</p>
              <p className="text-xs text-blue-200">Sistem Yöneticisi</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
