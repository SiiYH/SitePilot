export type UserRole = 'Engineer' | 'Admin' | 'Director';

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
}

export interface Document {
  id: string;
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
  name: string;
  description: string;
  progress: number;
  deadline: string;
  imageUrl: string;
  imageHint: string;
  assignedEngineers: string[]; // User IDs
  tasks: Task[];
  documents: Document[];
  milestones: Milestone[];
}
