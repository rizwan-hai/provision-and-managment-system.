export type Role = "admin" | "manager" | "user";

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}

export type CompanyType = "construction" | "logistics" | "retail" | "services";

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  registrationNo: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  blacklisted: boolean;
  blacklistReason?: string;
  violations: Violation[];
  experience: string;
  createdAt: string;
  createdBy: string;
}

export interface Violation {
  id: string;
  date: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export type ContractTier = "tier1" | "tier2" | "tier3" | "tier4";
export type ContractStatus = "draft" | "active" | "completed" | "cancelled";

export interface Contract {
  id: string;
  contractNo: string;
  companyId: string;
  title: string;
  amount: number;
  currency: "AFN" | "USD" | "EUR";
  tier: ContractTier;
  startDate: string;
  endDate: string;
  status: ContractStatus;
  progressPercent: number;
  description: string;
  attachmentName?: string;
  attachmentType?: "excel" | "pdf";
  createdAt: string;
  createdBy: string;
}

export type Priority = "low" | "medium" | "high" | "urgent";
export type OrderStatus = "pending" | "in_progress" | "completed" | "incomplete";

export interface ProcurementOrder {
  id: string;
  orderNo: string;
  title: string;
  companyId?: string;
  category: "retail" | "contract";
  priority: Priority;
  status: OrderStatus;
  requestedDate: string;
  requiredDate: string;
  amount: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface Vendor {
  id: string;
  accountNo: string;
  vendorName: string;
  type: CompanyType;
  taxId: string;
  bankAccount: string;
  contactInfo: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface AppData {
  users: User[];
  companies: Company[];
  contracts: Contract[];
  orders: ProcurementOrder[];
  vendors: Vendor[];
  auditLogs: AuditLog[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
}

// Inventory Types
export type InventoryItemType = "sample" | "equipment" | "supply" | "asset";
export type ItemCondition = "new" | "used" | "damaged" | "returned" | "disposed";
export type ItemStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  type: InventoryItemType;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  location: string;
  supplierId?: string;
  batchNumber?: string;
  serialNumber?: string;
  receivedDate?: string;
  expiryDate?: string;
  condition: ItemCondition;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type MovementType = "stock_in" | "stock_out" | "adjustment" | "transfer";

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reference?: string;
  notes: string;
  date: string;
  performedBy: string;
}

export const TIER_LIMITS = {
  tier1: { min: 0, max: 5000, label: "۰ – ۵,۰۰۰", labelEn: "Small (0 – 5K)" },
  tier2: { min: 5000, max: 50000, label: "۵,۰۰۰ – ۵۰,۰۰۰", labelEn: "Medium (5K – 50K)" },
  tier3: { min: 50000, max: 500000, label: "۵۰,۰۰۰ – ۵۰۰,۰۰۰", labelEn: "Large (50K – 500K)" },
  tier4: { min: 500000, max: Infinity, label: "۵۰۰,۰۰۰ +", labelEn: "Enterprise (500K+)" },
} as const;

export function getTierFromAmount(amount: number): ContractTier {
  if (amount < 5000) return "tier1";
  if (amount < 50000) return "tier2";
  if (amount < 500000) return "tier3";
  return "tier4";
}
