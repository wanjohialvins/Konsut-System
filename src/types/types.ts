export type InvoiceType = 'quotation' | 'proforma' | 'invoice';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  category?: string;
  priceKsh?: number;
  priceUSD?: number;
  description?: string;
  quantity?: number;
}

export interface InvoiceItem {
  id: string; // product id
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unitPrice: number; // Ksh
  lineTotal: number; // unitPrice * qty
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kraPin?: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date?: string; // ISO string
  issuedDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD (optional)
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxAmount?: number; // Added for backend compatibility (optional)
  grandTotal: number;
  currency?: string; // Added for backend compatibility (optional)
  currencyRate?: number;
  clientResponsibilities?: string;
  termsAndConditions?: string;
  notes?: string; // Keeping notes in its original position
  convertedFrom?: string; // Keeping convertedFrom in its original position

  // Specific fields
  quotationValidUntil?: string;
  proformaNumber?: string;
  invoiceNumber?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  role: UserRole | string;
  is_active: number | boolean;
  last_login?: string;
  created_at?: string;
  permissions?: string[] | string;
  name?: string; // Optional for compatibility
  displayRole?: string; // Optional for compatibility
}

export type UserRole = 'admin' | 'manager' | 'staff' | 'storekeeper' | 'accountant' | 'ceo' | 'sales' | 'viewer';

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  recoveryLogin?: (email: string) => Promise<any>;
  isLoading?: boolean;
  updateUser?: (data: Partial<User>) => void;
  refreshUser?: () => Promise<void>;
}

export type ThemeMode = 'light' | 'dark' | 'auto';
export type UiDensity = 'compact' | 'comfortable' | 'spacious';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate' | 'electric' | 'indigo' | 'emerald' | 'rose' | 'ocean' | 'sky' | 'steel';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme?: (theme: ThemeMode) => void;
  uiDensity: UiDensity;
  setUiDensity: (density: UiDensity) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}
