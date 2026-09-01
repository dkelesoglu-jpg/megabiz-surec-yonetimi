import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardNew from './components/DashboardNew';
import Organization from './components/Organization';
import Instructions from './components/Instructions';
import Tasks from './components/Tasks';
import KPIPerformance from './components/KPIPerformance';
import Documents from './components/Documents';
import Reports from './components/Reports';
import LeaveRequest from './components/LeaveRequest';
import LeaveApprovals from './components/LeaveApprovals';

export type Module = 'dashboard' | 'organization' | 'instructions' | 'tasks' | 'kpi' | 'documents' | 'reports' | 'leave-request' | 'leave-approvals';

function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardNew />;
      case 'organization':
        return <Organization />;
      case 'instructions':
        return <Instructions />;
      case 'tasks':
        return <Tasks />;
      case 'kpi':
        return <KPIPerformance />;
      case 'documents':
        return <Documents />;
      case 'reports':
        return <Reports />;
      case 'leave-request':
        return <LeaveRequest />;
      case 'leave-approvals':
        return <LeaveApprovals />;
      default:
        return <DashboardNew />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}

export default App;
