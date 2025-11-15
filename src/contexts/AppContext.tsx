import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppData,
  Donor,
  Project,
  Donation,
  DonorStatus,
  ProjectStatus,
} from '../types';
import { storageService } from '../services/storage';
import { generateId, calculateProjectTotal } from '../utils/helpers';

interface AppContextType {
  // Data
  donors: Donor[];
  projects: Project[];
  donations: Donation[];

  // Loading state
  isLoading: boolean;

  // Donor operations
  addDonor: (donor: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDonor: (id: string, donor: Partial<Donor>) => Promise<void>;
  deleteDonor: (id: string) => Promise<void>;

  // Project operations
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Donation operations
  addDonation: (donation: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDonation: (id: string, donation: Partial<Donation>) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;

  // Backup operations
  exportBackup: () => Promise<string>;
  importBackup: (data: string) => Promise<void>;

  // Utility
  reloadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await storageService.loadAllData();
      setDonors(data.donors);
      setProjects(data.projects);
      setDonations(data.donations);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadData = async () => {
    await loadData();
  };

  // Donor operations
  const addDonor = async (donorData: Omit<Donor, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Auto-generate order: find max order and add 1
    const maxOrder = donors.length > 0
      ? Math.max(...donors.map(d => d.order || 0))
      : 0;

    const newDonor: Donor = {
      ...donorData,
      id: generateId(),
      order: donorData.order !== undefined ? donorData.order : maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDonors = [...donors, newDonor];
    setDonors(updatedDonors);
    await storageService.saveDonors(updatedDonors);
  };

  const updateDonor = async (id: string, donorData: Partial<Donor>) => {
    const updatedDonors = donors.map((donor) =>
      donor.id === id
        ? { ...donor, ...donorData, updatedAt: new Date().toISOString() }
        : donor
    );
    setDonors(updatedDonors);
    await storageService.saveDonors(updatedDonors);
  };

  const deleteDonor = async (id: string) => {
    const updatedDonors = donors.filter((donor) => donor.id !== id);
    setDonors(updatedDonors);
    await storageService.saveDonors(updatedDonors);
  };

  // Project operations
  const addProject = async (
    projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'currentAmount'>
  ) => {
    const newProject: Project = {
      ...projectData,
      id: generateId(),
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    await storageService.saveProjects(updatedProjects);
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    const updatedProjects = projects.map((project) =>
      project.id === id
        ? { ...project, ...projectData, updatedAt: new Date().toISOString() }
        : project
    );
    setProjects(updatedProjects);
    await storageService.saveProjects(updatedProjects);
  };

  const deleteProject = async (id: string) => {
    const updatedProjects = projects.filter((project) => project.id !== id);
    setProjects(updatedProjects);
    await storageService.saveProjects(updatedProjects);
  };

  // Donation operations
  const addDonation = async (
    donationData: Omit<Donation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newDonation: Donation = {
      ...donationData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedDonations = [...donations, newDonation];
    setDonations(updatedDonations);
    await storageService.saveDonations(updatedDonations);

    // Update project current amount
    const projectTotal = calculateProjectTotal(
      donationData.projectId,
      updatedDonations
    );
    await updateProject(donationData.projectId, { currentAmount: projectTotal });
  };

  const updateDonation = async (id: string, donationData: Partial<Donation>) => {
    const updatedDonations = donations.map((donation) =>
      donation.id === id
        ? { ...donation, ...donationData, updatedAt: new Date().toISOString() }
        : donation
    );
    setDonations(updatedDonations);
    await storageService.saveDonations(updatedDonations);

    // Update project current amount if amount changed
    const donation = donations.find((d) => d.id === id);
    if (donation && donationData.amount !== undefined) {
      const projectTotal = calculateProjectTotal(
        donation.projectId,
        updatedDonations
      );
      await updateProject(donation.projectId, { currentAmount: projectTotal });
    }
  };

  const deleteDonation = async (id: string) => {
    const donation = donations.find((d) => d.id === id);
    const updatedDonations = donations.filter((d) => d.id !== id);
    setDonations(updatedDonations);
    await storageService.saveDonations(updatedDonations);

    // Update project current amount
    if (donation) {
      const projectTotal = calculateProjectTotal(
        donation.projectId,
        updatedDonations
      );
      await updateProject(donation.projectId, { currentAmount: projectTotal });
    }
  };

  // Backup operations
  const exportBackup = async (): Promise<string> => {
    return await storageService.exportData();
  };

  const importBackup = async (data: string): Promise<void> => {
    await storageService.importData(data);
    await reloadData();
  };

  const value: AppContextType = {
    donors,
    projects,
    donations,
    isLoading,
    addDonor,
    updateDonor,
    deleteDonor,
    addProject,
    updateProject,
    deleteProject,
    addDonation,
    updateDonation,
    deleteDonation,
    exportBackup,
    importBackup,
    reloadData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
