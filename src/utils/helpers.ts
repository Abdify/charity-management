import { Donation, Donor, Project, DonorWithStats, ProjectWithStats } from '../types';
import { bn, TranslationKey } from '../translations/bn';

// Translation helper
export const t = (key: TranslationKey): string => {
  return bn[key] || key;
};

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Format currency in Bangladeshi Taka
export const formatCurrency = (amount: number): string => {
  // Format number with Bengali locale
  const formatted = new Intl.NumberFormat('bn-BD').format(amount);
  return `৳${formatted}`;
};

// Format date in Bengali
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  return `${day} ${months[month]}, ${year}`;
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
