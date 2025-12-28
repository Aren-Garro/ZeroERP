/**
 * Initial mock data for ZeroERP
 * In a production environment, this would be fetched from an API
 */

export const INITIAL_INVENTORY = [
  {
    id: 'SKU-001',
    name: 'Ceramic Pour-Over Set',
    category: 'Coffee',
    stock: { warehouse: 45, store: 12 },
    safetyStock: 20,
    cost: 15.00,
    price: 45.00,
    vendor: 'CeramicsCo'
  },
  {
    id: 'SKU-002',
    name: 'Ethiopian Yirgacheffe (12oz)',
    category: 'Coffee',
    stock: { warehouse: 120, store: 50 },
    safetyStock: 50,
    cost: 8.50,
    price: 22.00,
    vendor: 'GlobalBeans'
  },
  {
    id: 'SKU-003',
    name: 'Gooseneck Kettle (Matte Black)',
    category: 'Equipment',
    stock: { warehouse: 5, store: 2 },
    safetyStock: 10,
    cost: 35.00,
    price: 85.00,
    vendor: 'HeatSync'
  },
  {
    id: 'SKU-004',
    name: 'Paper Filters (100ct)',
    category: 'Consumables',
    stock: { warehouse: 500, store: 100 },
    safetyStock: 200,
    cost: 2.00,
    price: 8.00,
    vendor: 'PaperWorks'
  },
  {
    id: 'SKU-005',
    name: 'Barista Apron (Canvas)',
    category: 'Apparel',
    stock: { warehouse: 25, store: 5 },
    safetyStock: 15,
    cost: 12.00,
    price: 40.00,
    vendor: 'TextileBros'
  },
  {
    id: 'SKU-006',
    name: 'Cold Brew Kit',
    category: 'Bundles',
    stock: { warehouse: 15, store: 0 },
    safetyStock: 10,
    cost: 18.00,
    price: 55.00,
    vendor: 'Internal'
  },
];

export const INITIAL_ORDERS = [
  {
    id: 'ORD-7782',
    customer: 'Alice Freeman',
    customerEmail: 'alice@example.com',
    channel: 'Shopify',
    total: 135.00,
    status: 'Pending',
    paymentStatus: 'pending',
    paymentMethod: null,
    paymentIntentId: null,
    date: '2023-10-24',
    items: 3
  },
  {
    id: 'ORD-7781',
    customer: 'Mark Stone',
    customerEmail: 'mark@example.com',
    channel: 'Amazon',
    total: 22.00,
    status: 'Shipped',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    paymentIntentId: 'pi_demo_001',
    date: '2023-10-24',
    items: 1
  },
  {
    id: 'ORD-7780',
    customer: 'Cafe Lux (Wholesale)',
    customerEmail: 'orders@cafelux.com',
    channel: 'B2B Portal',
    total: 450.00,
    status: 'Shipped',
    paymentStatus: 'paid',
    paymentMethod: 'invoice',
    paymentIntentId: 'pi_demo_002',
    date: '2023-10-23',
    items: 20
  },
  {
    id: 'ORD-7779',
    customer: 'Sarah Connor',
    customerEmail: 'sarah@example.com',
    channel: 'Shopify',
    total: 85.00,
    status: 'Delivered',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    paymentIntentId: 'pi_demo_003',
    date: '2023-10-23',
    items: 1
  },
];

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'PO-9001',
    vendor: 'HeatSync',
    status: 'Ordered',
    expected: '2023-11-01',
    total: 1500.00
  },
  {
    id: 'PO-9002',
    vendor: 'GlobalBeans',
    status: 'Received',
    expected: '2023-10-20',
    total: 850.00
  },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'inventory', label: 'Inventory', icon: 'Package' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart', showBadge: true },
  { id: 'purchasing', label: 'Purchasing', icon: 'Truck' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];
