import { useEffect, useState, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Plug,
  Code,
  Plus,
  FileText
} from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, type: 'navigation', target: 'dashboard' },
  { id: 'inventory', label: 'Go to Inventory', icon: Package, type: 'navigation', target: 'inventory' },
  { id: 'orders', label: 'Go to Orders', icon: ShoppingCart, type: 'navigation', target: 'orders' },
  { id: 'purchasing', label: 'Go to Purchasing', icon: Truck, type: 'navigation', target: 'purchasing' },
  { id: 'billing', label: 'Go to Billing', icon: CreditCard, type: 'navigation', target: 'billing' },
  { id: 'integrations', label: 'Go to Integrations', icon: Plug, type: 'navigation', target: 'integrations' },
  { id: 'developers', label: 'Go to Developers', icon: Code, type: 'navigation', target: 'developers' },
  { id: 'reports', label: 'Go to Reports', icon: BarChart3, type: 'navigation', target: 'reports' },
  { id: 'settings', label: 'Go to Settings', icon: Settings, type: 'navigation', target: 'settings' },
  { id: 'new-item', label: 'Add Inventory Item', icon: Plus, type: 'action', action: 'addInventory' },
  { id: 'new-order', label: 'Create New Order', icon: FileText, type: 'action', action: 'createOrder' },
];

/**
 * CommandPalette component - Keyboard-first navigation (Cmd+K)
 * Provides quick access to navigation and actions
 */
const CommandPalette = ({ isOpen, onClose, onNavigate, onAction }) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setSearch('');
    setSelectedIndex(0);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const executeCommand = (command) => {
    if (command.type === 'navigation') {
      onNavigate(command.target);
    } else if (command.type === 'action') {
      onAction?.(command.action);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="w-full pl-12 pr-4 py-4 text-base border-b border-slate-100 focus:outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
            <span className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 text-[10px] text-slate-400 font-medium">
              ESC
            </span>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-400 text-sm">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${index === selectedIndex ? 'text-slate-300' : 'text-slate-400'}`} />
                  <span className="text-sm font-medium">{cmd.label}</span>
                  {cmd.type === 'action' && (
                    <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                      index === selectedIndex
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      Action
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-100 rounded">esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
