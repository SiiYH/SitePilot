

export type UserRole = 'engineer' | 'admin' | 'director' | 'system super admin';
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
  createdAt: string; // Changed from serverTimestamp() to string
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
  projectName?: string;
  projectSlug?: string;
  projectId?: string;
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
}

export type ProgressTrackingMode = 'task-driven' | 'milestone-driven' | 'manual' | 'task-milestone-driven';

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
  slug: string;
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

export interface Claim {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Paid' | 'Overdue';
  date: string;
  submittedBy: string; // User ID
  receiptImageUrls?: string[];
  receiptImageHint?: string;
  remark?: string;
  approvedBy?: string; // User ID of Director who approved
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
