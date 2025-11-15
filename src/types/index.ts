// Data models for the charity management app

export enum DonorStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export interface Donor {
  id: string;
  name: string;
  phoneNumber: string;
  location: string;
  status: DonorStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  startDate: string;
  endDate?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  projectId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced types with populated relations
export interface DonationWithDetails extends Donation {
  donor: Donor;
  project: Project;
}

export interface DonorWithStats extends Donor {
  totalDonations: number;
  donationCount: number;
  lastDonationDate?: string;
}

export interface ProjectWithStats extends Project {
  donorCount: number;
  donationCount: number;
  lastDonationDate?: string;
}

// App state types
export interface AppData {
  donors: Donor[];
  projects: Project[];
  donations: Donation[];
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  AddDonor: { donorId?: string };
  EditDonor: { donorId: string };
  DonorProfile: { donorId: string };
  AddProject: { projectId?: string };
  EditProject: { projectId: string };
  ProjectProfile: { projectId: string };
  AddDonation: undefined;
  DropboxSettings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Donors: undefined;
  Projects: undefined;
  Donations: undefined;
};
