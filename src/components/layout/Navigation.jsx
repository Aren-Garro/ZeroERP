import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  CreditCard,
  Plug,
  Code
} from 'lucide-react';

const ICONS = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BarChart3,
  Settings,
  CreditCard,
  Plug,
  Code
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'inventory', label: 'Inventory', icon: 'Package' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart', showBadge: true },
  { id: 'purchasing', label: 'Purchasing', icon: 'Truck' },
  { id: 'billing', label: 'Billing', icon: 'CreditCard' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug' },
  { id: 'developers', label: 'Developers', icon: 'Code' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

/**
 * Navigation component - Sidebar navigation menu
 */
const Navigation = ({ activeTab, onNavigate, pendingOrdersCount = 0 }) => {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-5 h-5 mr-3" />
            {item.label}
            {item.showBadge && pendingOrdersCount > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
