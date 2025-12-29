import { toast } from 'sonner';
import { Sidebar, Header, MobileMenu } from './components/layout';
import { Dashboard, Inventory, Orders, Purchasing, Billing, Integrations, Developers, Placeholder } from './pages';
import { useNavigation, useInventory, useOrders, usePurchaseOrders, useBilling } from './hooks';
import { exportInventoryToCSV, exportOrdersToCSV, exportPurchaseOrdersToCSV } from './utils';
import { Toast } from './components/ui';
import { SmartReplenishment } from './components/dashboard';

/**
 * Main Application Component
 * Orchestrates all pages and manages global state
 */
function App() {
  // Navigation state
  const {
    activeTab,
    isMobileMenuOpen,
    navigate,
    openMobileMenu,
    closeMobileMenu
  } = useNavigation();

  // Inventory state
  const {
    inventory,
    searchTerm,
    isAddModalOpen,
    editingItem,
    totalStockValue,
    lowStockCount,
    lowStockItems,
    normalStockItems,
    filteredInventory,
    setSearchTerm,
    handleInventorySubmit,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
  } = useInventory();

  // Orders state
  const {
    orders,
    pendingOrdersCount,
    fulfillOrder
  } = useOrders();

  // Purchase orders state
  const {
    purchaseOrders,
    receivePO
  } = usePurchaseOrders();

  // Billing state
  const {
    customerId,
    subscriptions,
    invoices,
    paymentMethods,
    loading: billingLoading,
    error: billingError,
    checkApiHealth,
    createCustomer,
    fetchSubscriptions,
    cancelSubscription,
    resumeSubscription,
    fetchInvoices,
    fetchPaymentMethods,
    deletePaymentMethod,
    createPaymentIntent,
    openBillingPortal,
  } = useBilling();

  // Handle inventory export
  const handleInventoryExport = () => {
    exportInventoryToCSV(inventory);
    toast.success('Inventory exported successfully');
  };

  // Handle orders export
  const handleOrdersExport = () => {
    exportOrdersToCSV(orders);
    toast.success('Orders exported successfully');
  };

  // Handle purchase orders export
  const handlePurchaseOrdersExport = () => {
    exportPurchaseOrdersToCSV(purchaseOrders);
    toast.success('Purchase orders exported successfully');
  };

  // Handle order fulfillment with notification
  const handleFulfillOrder = (orderId) => {
    fulfillOrder(orderId);
    toast.success(`Order ${orderId} marked as Shipped`, {
      description: 'Inventory levels would be adjusted in a production system'
    });
  };

  // Handle PO receipt with notification
  const handleReceivePO = (poId) => {
    receivePO(poId);
    toast.success(`PO ${poId} received`, {
      description: 'Stock levels would be updated in a production system'
    });
  };

  // Handle inventory form submission with notification
  const handleInventoryFormSubmit = (data) => {
    const result = handleInventorySubmit(data);
    if (result.action === 'updated') {
      toast.success(`SKU updated successfully`, {
        description: `${data.name} has been updated`
      });
    } else {
      toast.success(`New SKU added`, {
        description: `${data.name} has been added to inventory`
      });
    }
    closeAddModal();
    closeEditModal();
  };

  // Handle auto-order from Smart Replenishment
  const handleAutoOrder = (item) => {
    const suggestedQty = Math.max(0, (item.safetyStock * 2) - (item.stock.warehouse + item.stock.store));
    toast.success(`Purchase order created for ${item.name}`, {
      description: `Quantity: ${suggestedQty} units from ${item.vendor}`
    });
    // In production, this would create an actual PO
  };

  // Handle Command Palette actions
  const handleCommandAction = (action) => {
    switch (action) {
      case 'addInventory':
        navigate('inventory');
        setTimeout(() => openAddModal(), 100);
        break;
      case 'createOrder':
        toast.info('Order creation', {
          description: 'Order creation would open here'
        });
        break;
      default:
        break;
    }
  };

  // Render active page content
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            {/* Smart Replenishment - AI-powered reorder suggestions */}
            {lowStockItems.length > 0 && (
              <div className="mb-6">
                <SmartReplenishment
                  lowStockItems={lowStockItems}
                  onAutoOrder={handleAutoOrder}
                />
              </div>
            )}
            <Dashboard
              totalStockValue={totalStockValue}
              pendingOrdersCount={pendingOrdersCount}
              lowStockCount={lowStockCount}
              lowStockItems={lowStockItems}
              normalStockItems={normalStockItems}
            />
          </>
        );

      case 'inventory':
        return (
          <Inventory
            inventory={inventory}
            filteredInventory={filteredInventory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={handleInventoryExport}
            isAddModalOpen={isAddModalOpen}
            onOpenAddModal={openAddModal}
            onCloseAddModal={closeAddModal}
            editingItem={editingItem}
            onEditItem={openEditModal}
            onCloseEditModal={closeEditModal}
            onInventorySubmit={handleInventoryFormSubmit}
          />
        );

      case 'orders':
        return (
          <Orders
            orders={orders}
            onFulfillOrder={handleFulfillOrder}
            onExport={handleOrdersExport}
          />
        );

      case 'purchasing':
        return (
          <Purchasing
            purchaseOrders={purchaseOrders}
            onReceivePO={handleReceivePO}
            onExport={handlePurchaseOrdersExport}
          />
        );

      case 'billing':
        return (
          <Billing
            customerId={customerId}
            subscriptions={subscriptions}
            invoices={invoices}
            paymentMethods={paymentMethods}
            loading={billingLoading}
            error={billingError}
            onCreateCustomer={createCustomer}
            onFetchSubscriptions={fetchSubscriptions}
            onCancelSubscription={cancelSubscription}
            onResumeSubscription={resumeSubscription}
            onFetchInvoices={fetchInvoices}
            onFetchPaymentMethods={fetchPaymentMethods}
            onDeletePaymentMethod={deletePaymentMethod}
            onCreatePaymentIntent={createPaymentIntent}
            onOpenBillingPortal={openBillingPortal}
            onCheckApiHealth={checkApiHealth}
          />
        );

      case 'integrations':
        return <Integrations />;

      case 'developers':
        return <Developers />;

      case 'reports':
        return <Placeholder title="Reports" />;

      case 'settings':
        return <Placeholder title="Settings" />;

      default:
        return <Placeholder title="Page Not Found" />;
    }
  };

  return (
    <>
      <Toast />
      <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigate={navigate}
          pendingOrdersCount={pendingOrdersCount}
        />

        {/* Mobile Menu Overlay */}
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
          activeTab={activeTab}
          onNavigate={navigate}
          pendingOrdersCount={pendingOrdersCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Header */}
          <Header
            onMenuClick={openMobileMenu}
            onNavigate={navigate}
            onAction={handleCommandAction}
          />

          {/* Scrollable Page Content */}
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
