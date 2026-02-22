import {
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  User,
  Wallet,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Globe, label: 'Domains', path: '/dashboard/domains' },
    { icon: FileText, label: 'Invoices', path: '/dashboard/invoices' },
    { icon: Wallet, label: 'Wallet', path: '/dashboard/wallet' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  return (
    <aside className="w-64 bg-brand-dark border-r border-brand-gray/20 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-brand-gray/10">
        <Link to="/" className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-serif text-brand-text-primary">SaaSify</span>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive(item.path)
                  ? 'bg-brand-green text-white font-semibold'
                  : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-gray/50'
                  }`}
              >
                <item.icon size={20} className={isActive(item.path) ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-text-primary transition-colors'} />
                <span className={isActive(item.path) ? 'font-semibold' : 'font-medium'}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-brand-gray/20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 w-full transition-colors group"
        >
          <LogOut size={20} className="group-hover:stroke-2" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
