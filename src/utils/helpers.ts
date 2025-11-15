import { Donation, Donor, Project, DonorWithStats, ProjectWithStats } from '../types';

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date and time
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get donor statistics
export const getDonorStats = (
  donor: Donor,
  donations: Donation[]
): DonorWithStats => {
  const donorDonations = donations.filter((d) => d.donorId === donor.id);
  const totalDonations = donorDonations.reduce((sum, d) => sum + d.amount, 0);
  const lastDonation = donorDonations.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return {
    ...donor,
    totalDonations,
    donationCount: donorDonations.length,
    lastDonationDate: lastDonation?.date,
  };
};

// Get project statistics
export const getProjectStats = (
  project: Project,
  donations: Donation[]
): ProjectWithStats => {
  const projectDonations = donations.filter((d) => d.projectId === project.id);
  const uniqueDonors = new Set(projectDonations.map((d) => d.donorId));
  const lastDonation = projectDonations.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return {
    ...project,
    donorCount: uniqueDonors.size,
    donationCount: projectDonations.length,
    lastDonationDate: lastDonation?.date,
  };
};

// Calculate total donations for a project
export const calculateProjectTotal = (
  projectId: string,
  donations: Donation[]
): number => {
  return donations
    .filter((d) => d.projectId === projectId)
    .reduce((sum, d) => sum + d.amount, 0);
};

// Get recent donations
export const getRecentDonations = (
  donations: Donation[],
  limit: number = 10
): Donation[] => {
  return [...donations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

// Search donors
export const searchDonors = (donors: Donor[], query: string): Donor[] => {
  const lowerQuery = query.toLowerCase();
  return donors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(lowerQuery) ||
      donor.phoneNumber.includes(query) ||
      donor.location.toLowerCase().includes(lowerQuery)
  );
};

// Search projects
export const searchProjects = (projects: Project[], query: string): Project[] => {
  const lowerQuery = query.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery)
  );
};
