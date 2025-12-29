import { X, LogOut } from 'lucide-react';
import Navigation from './Navigation';
import { useAuth } from '../../hooks/useAuth';

/**
 * MobileMenu component - Overlay menu for mobile devices
 */
const MobileMenu = ({ isOpen, onClose, activeTab, onNavigate, pendingOrdersCount }) => {
  const { logout, getUserInitials, getUserDisplayName, getUserRole, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 md:hidden"
      onClick={onClose}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-lg">ZeroERP</span>
            <button onClick={onClose}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <Navigation
            activeTab={activeTab}
            onNavigate={onNavigate}
            pendingOrdersCount={pendingOrdersCount}
          />
        </div>

        {/* User Profile */}
        <div className="mt-auto p-4 border-t border-slate-100">
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
      </div>
    </div>
  );
};

export default MobileMenu;
