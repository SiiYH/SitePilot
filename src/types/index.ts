
export type UserRole = 'Engineer' | 'Admin' | 'Director';
export type UserStatus = 'Active' | 'Inactive';

export type UserStatusChange = {
  status: UserStatus;
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
  history: UserStatusChange[];
}

export interface Task {
  id: string;
  title: string;
  type: 'Task' | 'Milestone';
  owner: string; // User ID
  contributors?: string[]; // User IDs
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  dueDate: string;
  projectName?: string;
  projectSlug?: string;
}

export interface Document {
  id:string;
  name: string;
  url: string;
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

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  progressTrackingMode: ProgressTrackingMode;
  progressTrackingModeHistory?: ProgressTrackingModeChange[];
  startDate: string;
  endDate: string;
  imageUrl: string;
  imageHint: string;
  assignedEngineers: string[]; // User IDs
  tasks: Task[];
  documents: Document[];
  milestones: Milestone[];
  jobNo?: string;
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
