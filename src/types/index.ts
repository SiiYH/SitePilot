
export type UserRole = 'engineer' | 'admin' | 'director' | 'system super admin' | '';
export type UserStatus = 'Active' | 'Inactive';

export type UserChange = {
  status?: UserStatus;
  role?: UserRole;
  date: string;
};

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl: string;
  status: UserStatus;
  createdAt: string; 
  history: UserChange[];
  companyId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'Task' | 'Milestone';
  owner?: string; // User ID - now optional
  contributors?: string[]; // User IDs
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string;
  createdAt: string;
  completedAt?: string | null; // Added field
  projectName?: string;
  projectSlug?: string;
  projectId?: string;
  billableAmount?: number;
  billableStatus?: 'Not Billable' | 'Unbilled' | 'Billed' | 'Paid';
  invoiceDate?: string | null;
  invoiceNo?: string;
}

export interface Document {
  id: string;
  name: string;
  path: string; // Changed from url to path
  type: 'Blueprint' | 'Contract' | 'Permit' | 'Report';
  uploadedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  status: 'Achieved' | 'Upcoming' | 'Delayed';
  date: string;
  billableAmount?: number;
  billableStatus?: 'Not Billable' | 'Unbilled' | 'Billed' | 'Paid';
  invoiceDate?: string;
  invoiceNo?: string;
}

export type ProgressTrackingMode = 'task-driven' | 'milestone-driven' | 'manual' | 'mixed-mode';

export type ProgressTrackingModeChange = {
  mode: ProgressTrackingMode;
  date: string;
  changedBy: string; // User ID
};

export type ProjectStatusCategory = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface ProjectStatus {
  id: string;
  name: string;
  category: ProjectStatusCategory;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string; // Now refers to the ID of a ProjectStatus
  progress: number;
  progressTrackingMode: ProgressTrackingMode;
  progressTrackingModeHistory?: ProgressTrackingModeChange[];
  startDate: string;
  endDate: string;
  imageUrl: string;
  imageHint: string;
  assignedEngineers: string[]; // User IDs
  tasks: Task[]; // This might be deprecated in favor of the subcollection
  documents: Document[]; // This will be deprecated in favor of the subcollection
  milestones: Milestone[];
  companyId?: string;
  jobNo: string;
  orderNo?: string;
  siteName?: string;
  jobLocation?: string;
  distance?: number;
  performanceBondNo?: string;
  performanceBondAmount?: number;
  grossProfit?: number;
  marginProfit?: number;
  insuranceAmount?: number;
  currency?: string;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export type ClaimType = 'Fuel' | 'Meal' | 'Progress Claim' | 'Variation Order' | 'Final Claim' | 'Materials on Site' | 'Retention Release';

export interface Claim {
  id: string;
  projectId: string;
  companyId: string;
  title: string;
  type: ClaimType;
  description?: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Rejected';
  date: string;
  submittedBy: string; // User ID
  submittedAt: string;
  receiptImageUrls?: string[];
  receiptImageHint?: string;
  remark?: string;
  approvedBy?: string; // User ID of director who approved
  approvedAt?: string; // ISO date string
  eInvoiceNo?: string;
}

export interface CreateClaimDialogProps {
  projects: Project[];
  onClaimCreated: (claim: Claim) => void;
  userId: string;
  defaultProjectId?: string;
}

export interface AttendanceRecord {
  userId: string;
  status: 'Clocked In' | 'Clocked Out';
  location: string | null;
}

export interface CreateWorkItemDialogProps {
    project: Project;
    engineers: User[];
    onWorkItemCreated: (task: Task) => void;
}

export type License = {
  id: string;
  purchaser: string;
  maxDirectors: number;
  maxAdmins: number;
  maxEngineers: number;
  expiresAt: string | null;
  createdAt: string;
  activatedAt?: string;
  companyId?: string;
};

export interface Company {
    id: string;
    name: string;
    industryCode: string;
    industryDescription: string;
    description?: string;
    activated: boolean;
    licenseKey?: string;
    ownerId?: string;
    eInvoicing?: any;
}

export type CreateUserData = {
    name: string;
    email?: string;
    phone?: string;
    password?: string;
    role: UserRole;
    companyId: string;
};
