export const TEST_ADMIN = {
  name: 'Test Admin',
  email: 'testadmin@societysync.test',
  password: 'TestAdmin@123',
  role: 'admin',
};

export const TEST_MEMBER = {
  name: 'Test Member',
  email: 'testmember@societysync.test',
  password: 'TestMember@123',
  role: 'member',
};

export const DEMO_ADMIN = {
  name: 'Admin',
  email: 'admin@society.com',
  password: 'admin123',
  role: 'admin',
};

export const DEMO_MEMBER = {
  name: 'Member',
  email: 'member1@society.com',
  password: 'member123',
  role: 'member',
};

export const TEST_SOCIETY = {
  name: 'Test Society Heights',
  address: '123 Test Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

export const TEST_PAYMENT = {
  amount: 5000,
  method: 'UPI',
  description: 'Monthly maintenance - Test',
};

export const TEST_EXPENSE = {
  title: 'Test Maintenance Expense',
  amount: 2500,
  category: 'maintenance',
  description: 'Elevator repair test',
};

export const TEST_FUND = {
  name: 'Test Emergency Fund',
  targetAmount: 50000,
  perFlatAmount: 1000,
  description: 'Emergency repairs fund',
};

export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  blocks: '/blocks',
  payments: '/payments',
  expenses: '/expenses',
  reports: '/reports',
  notifications: '/notifications',
  settings: '/settings',
  setup: '/setup',
  requests: '/requests',
  paymentVerification: '/payment-verification',
  funds: '/funds',
  adminManagement: '/admin-management',
  activityLog: '/activity-log',
  demoLeads: '/demo-leads',
  privacyPolicy: '/privacy-policy',
  join: '/join',
  pendingApproval: '/pending-approval',
};

export const ADMIN_ONLY_ROUTES = [
  ROUTES.requests,
  ROUTES.paymentVerification,
  ROUTES.adminManagement,
  ROUTES.activityLog,
  ROUTES.demoLeads,
];

export const EXPENSE_CATEGORIES = [
  'electricity', 'lift', 'security', 'cleaning',
  'plumbing', 'gardening', 'repairs', 'water', 'misc',
];

export const PAYMENT_METHODS = ['upi', 'bank_transfer', 'cash', 'cheque', 'online'];
