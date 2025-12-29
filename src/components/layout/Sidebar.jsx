import { Package, LogOut } from 'lucide-react';
import Navigation from './Navigation';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar component - Desktop sidebar with navigation
 */
const Sidebar = ({ activeTab, onNavigate, pendingOrdersCount }) => {
  const { logout, getUserInitials, getUserDisplayName, getUserRole, user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full">
      {/* Logo */}
      <div className="p-6 flex items-center border-b border-slate-100">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
          <Package className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">ZeroERP</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <Navigation
          activeTab={activeTab}
          onNavigate={onNavigate}
          pendingOrdersCount={pendingOrdersCount}
        />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={getUserDisplayName()}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
              {getUserInitials()}
            </div>
          )}
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{getUserDisplayName()}</p>
            <p className="text-[10px] text-slate-500">{getUserRole()}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
