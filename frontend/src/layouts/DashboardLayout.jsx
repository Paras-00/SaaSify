import DashboardHeader from '../components/layout/DashboardHeader';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-brand-black font-sans selection:bg-brand-green selection:text-brand-black">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-brand-black relative">
          {/* ambient background effect removed */}
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
