import { Bell, Search } from 'lucide-react';

import useAuthStore from '../../store/authStore';

export default function DashboardHeader() {
  const { user } = useAuthStore();

  return (
    <header className="bg-brand-dark border-b border-brand-green/10 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-brand-gray/10 border border-gray-300 rounded-xl text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-1 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all font-sans"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray/10 rounded-lg transition-all">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-green rounded-full border border-white"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-brand-gray/20">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-brand-text-primary">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-brand-text-secondary">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-brand-green rounded-full flex items-center justify-center text-white font-bold border border-gray-300 shadow-sm">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
