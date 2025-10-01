

import type { User, Project, Claim, AttendanceRecord } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Jane Smith (Admin)',
    email: 'admin@sitepilot.com',
    role: 'Admin',
    avatarUrl: 'https://picsum.photos/seed/user2/200/200',
    status: 'Active',
    createdAt: '2023-01-10T10:00:00Z',
    history: [{ status: 'Active', date: '2023-01-10T10:00:00Z' }],
  },
  {
    id: 'user-director',
    name: 'Robert Johnson (Director)',
    email: 'director@sitepilot.com',
    role: 'Director',
    avatarUrl: 'https://picsum.photos/seed/user3/200/200',
    status: 'Active',
    createdAt: '2023-01-10T10:00:00Z',
    history: [{ status: 'Active', date: '2023-01-10T10:00:00Z' }],
  },
  {
    id: 'user-engineer-1',
    name: 'John Doe (Engineer)',
    email: 'engineer@sitepilot.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/user1/200/200',
    status: 'Active',
    createdAt: '2023-01-15T11:30:00Z',
    history: [{ status: 'Active', date: '2023-01-15T11:30:00Z' }],
  },
  {
    id: 'user-engineer-2',
    name: 'Emily White (Engineer)',
    phone: '+15551234567',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/user4/200/200',
    status: 'Active',
    createdAt: '2023-02-01T09:00:00Z',
    history: [{ status: 'Active', date: '2023-02-01T09:00:00Z' }],
  },
  {
    id: 'user-engineer-3',
    name: 'Alex Ray (Engineer)',
    email: 'engineer01@gmail.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/user5/200/200',
    status: 'Active',
    createdAt: '2023-03-20T14:00:00Z',
    history: [{ status: 'Active', date: '2023-03-20T14:00:00Z' }],
  },
];

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    slug: 'apex-tower',
    name: 'Apex Tower',
    description: 'A 50-story commercial skyscraper in the city center. Features state-of-the-art facilities and sustainable design.',
    progress: 0,
    progressTrackingMode: 'task-driven',
    startDate: '2023-07-01',
    endDate: '2024-12-31',
    imageUrl: 'https://picsum.photos/seed/proj1/600/400',
    imageHint: 'modern architecture',
    assignedEngineers: ['user-engineer-1', 'user-engineer-2', 'user-engineer-3'],
    jobNo: 'JB-001',
    orderNo: 'ORD-2024-001',
    siteName: 'Apex Tower Site',
    jobLocation: 'Kuala Lumpur City Centre',
    distance: 15,
    performanceBondNo: 'PB-12345',
    performanceBondAmount: 500000,
    grossProfit: 2000000,
    marginProfit: 20,
    insuranceAmount: 100000,
    currency: 'USD',
    tasks: [
      { id: 't1-1', title: 'Foundation Pouring', type: 'Task', owner: 'user-engineer-1', status: 'Completed', dueDate: '2023-08-15' },
      { id: 't1-2', title: 'Structural Steel Erection (Floors 1-25)', type: 'Task', owner: 'user-engineer-2', status: 'Completed', dueDate: '2024-02-28' },
      { id: 't1-3', title: 'Curtain Wall Installation', type: 'Milestone', owner: 'user-engineer-1', status: 'In Progress', dueDate: '2024-09-30' },
      { id: 't1-4', title: 'MEP Systems Installation', type: 'Task', owner: 'user-engineer-2', status: 'Not Started', dueDate: '2024-10-31' },
    ],
    documents: [
      { id: 'd1-1', name: 'Architectural_Plans_Rev3.pdf', url: '#', type: 'Blueprint', uploadedAt: '2023-05-20' },
      { id: 'd1-2', name: 'Main_Construction_Contract.pdf', url: '#', type: 'Contract', uploadedAt: '2023-06-01' },
      { id: 'd1-3', name: 'Building_Permit_77A.pdf', url: '#', type: 'Permit', uploadedAt: '2023-07-10' },
    ],
    milestones: [
      { id: 'm1-1', name: 'Groundbreaking Ceremony', status: 'Achieved', date: '2023-07-01' },
      { id: 'm1-2', name: 'Topping Out', status: 'Upcoming', date: '2024-08-15' },
      { id: 'm1-3', name: 'Certificate of Occupancy', status: 'Upcoming', date: '2024-12-15' },
    ]
  },
  {
    id: 'proj-2',
    slug: 'golden-gate-bridge-retrofit',
    name: 'Golden Gate Bridge Retrofit',
    description: 'Seismic retrofitting and maintenance project for the iconic Golden Gate Bridge to ensure long-term structural integrity.',
    progress: 75,
    progressTrackingMode: 'manual',
    startDate: '2023-11-01',
    endDate: '2025-06-30',
    imageUrl: 'https://picsum.photos/seed/proj2/600/400',
    imageHint: 'bridge construction',
    assignedEngineers: ['user-engineer-1'],
    jobNo: 'JB-002',
    orderNo: 'ORD-2024-002',
    siteName: 'Golden Gate Bridge',
    jobLocation: 'San Francisco, CA',
    distance: 50,
    currency: 'USD',
    tasks: [
      { id: 't2-1', title: 'Lead Paint Removal', type: 'Task', owner: 'user-engineer-1', status: 'Completed', dueDate: '2024-01-31' },
      { id: 't2-2', title: 'Install new seismic dampers', type: 'Milestone', owner: 'user-engineer-1', status: 'In Progress', dueDate: '2024-11-30' },
      { id: 't2-3', title: 'Repave roadway', type: 'Task', owner: 'user-engineer-1', status: 'Overdue', dueDate: '2024-05-30' },
    ],
    documents: [
      { id: 'd2-1', name: 'Seismic_Analysis_Report.pdf', url: '#', type: 'Report', uploadedAt: '2023-09-01' },
      { id: 'd2-2', name: 'Structural_Blueprints_Update.pdf', url: '#', type: 'Blueprint', uploadedAt: '2023-10-05' },
    ],
    milestones: [
        { id: 'm2-1', name: 'Project Start', status: 'Achieved', date: '2023-11-01' },
        { id: 'm2-2', name: 'Damper Installation Complete', status: 'Upcoming', date: '2024-11-30' },
        { id: 'm2-3', name: 'Project Completion', status: 'Upcoming', date: '2025-06-30' },
    ]
  },
  {
    id: 'proj-3',
    slug: 'maple-creek-residences',
    name: 'Maple Creek Residences',
    description: 'Development of a new suburban community with 200 single-family homes, parks, and recreational facilities.',
    progress: 0,
    progressTrackingMode: 'milestone-driven',
    startDate: '2022-04-01',
    endDate: '2024-08-30',
    imageUrl: 'https://picsum.photos/seed/proj3/600/400',
    imageHint: 'residential building',
    assignedEngineers: ['user-engineer-2', 'user-engineer-3'],
    jobNo: 'JB-003',
    orderNo: 'ORD-2024-003',
    siteName: 'Maple Creek Community',
    jobLocation: 'Maple Creek, ON',
    distance: 25,
    currency: 'CAD',
    tasks: [
        { id: 't3-1', title: 'Landscaping and Irrigation', type: 'Task', owner: 'user-engineer-2', status: 'In Progress', dueDate: '2024-07-31' },
        { id: 't3-2', title: 'Final Home Inspections', type: 'Task', owner: 'user-engineer-2', status: 'In Progress', dueDate: '2024-08-15' },
    ],
    documents: [
      { id: 'd3-1', name: 'Master_Plan.pdf', url: '#', type: 'Blueprint', uploadedAt: '2022-01-15' },
      { id: 'd3-2', name: 'Sales_Contracts_Template.pdf', url: '#', type: 'Contract', uploadedAt: '2022-03-01' },
    ],
    milestones: [
        { id: 'm3-1', name: 'Phase 1 Sellout', status: 'Achieved', date: '2023-12-01' },
        { id: 'm3-2', name: 'Community Center Opening', status: 'Achieved', date: '2024-06-01' },
        { id: 'm3-3', name: 'Project Handover', status: 'Upcoming', date: '2024-08-30' },
    ]
  },
];

export const mockClaims: Claim[] = [
  { id: 'claim-1', projectId: 'proj-1', title: 'Progress Claim - May 2024', amount: 50000, currency: 'USD', status: 'Paid', date: '2024-05-15', submittedBy: 'user-engineer-1', approvedBy: 'user-director', approvedAt: '2024-05-16', eInvoiceNo: 'INV-2024-05-001' },
  { id: 'claim-2', projectId: 'proj-1', title: 'Progress Claim - June 2024', amount: 75000, currency: 'USD', status: 'Pending', date: '2024-06-20', submittedBy: 'user-engineer-2', eInvoiceNo: 'INV-2024-06-123' },
  { id: 'claim-3', projectId: 'proj-2', title: 'Materials Deposit', amount: 120000, currency: 'USD', status: 'Paid', date: '2024-04-30', submittedBy: 'user-engineer-1', receiptImageUrls: ['https://picsum.photos/seed/receipt1/600/800'], approvedBy: 'user-director', approvedAt: '2024-05-02' },
  { id: 'claim-4', projectId: 'proj-3', title: 'Final Finishing Works', amount: 25000, currency: 'CAD', status: 'Overdue', date: '2024-06-01', submittedBy: 'user-engineer-2', remark: 'Payment is late due to incomplete paperwork. Please follow up with the subcontractor.' },
  { id: 'claim-5', projectId: 'proj-2', title: 'Seismic Damper Delivery', amount: 85000, currency: 'USD', status: 'Pending', date: '2024-06-18', submittedBy: 'user-engineer-1', receiptImageUrls: ['https://picsum.photos/seed/receipt2/600/800'] },
];

export const mockAttendance: AttendanceRecord[] = [
    { userId: 'user-engineer-1', status: 'Clocked In', location: '3.141, 101.686' },
    { userId: 'user-engineer-2', status: 'Clocked In', location: '3.141, 101.686' },
];

    
