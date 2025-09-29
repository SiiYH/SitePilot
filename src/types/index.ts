

export type UserRole = 'Engineer' | 'Admin' | 'Director' | 'Reports';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  avatarUrl: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string; // User ID
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

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  progress: number;
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
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  date: string;
  submittedBy: string; // User ID
  receiptImageUrl?: string;
  receiptImageHint?: string;
  remark?: string;
  approvedBy?: string; // User ID of Director who approved
  approvedAt?: string; // ISO date string
}

export interface AttendanceRecord {
  userId: string;
  status: 'Clocked In' | 'Clocked Out';
  location: string | null;
}
