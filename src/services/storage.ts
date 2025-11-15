import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, Donor, Project, Donation } from '../types';

const STORAGE_KEYS = {
  DONORS: '@charity_app_donors',
  PROJECTS: '@charity_app_projects',
  DONATIONS: '@charity_app_donations',
};

// Initialize with empty data
const initialData: AppData = {
  donors: [],
  projects: [],
  donations: [],
};

export const storageService = {
  // Load all data
  async loadAllData(): Promise<AppData> {
    try {
      const [donorsJson, projectsJson, donationsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DONORS),
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.DONATIONS),
      ]);

      return {
        donors: donorsJson ? JSON.parse(donorsJson) : [],
        projects: projectsJson ? JSON.parse(projectsJson) : [],
        donations: donationsJson ? JSON.parse(donationsJson) : [],
      };
    } catch (error) {
      console.error('Error loading data:', error);
      return initialData;
    }
  },

  // Save donors
  async saveDonors(donors: Donor[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
    } catch (error) {
      console.error('Error saving donors:', error);
      throw error;
    }
  },

  // Save projects
  async saveProjects(projects: Project[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
      throw error;
    }
  },

  // Save donations
  async saveDonations(donations: Donation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DONATIONS, JSON.stringify(donations));
    } catch (error) {
      console.error('Error saving donations:', error);
      throw error;
    }
  },

  // Save all data
  async saveAllData(data: AppData): Promise<void> {
    try {
      await Promise.all([
        this.saveDonors(data.donors),
        this.saveProjects(data.projects),
        this.saveDonations(data.donations),
      ]);
    } catch (error) {
      console.error('Error saving all data:', error);
      throw error;
    }
  },

  // Export data for backup
  async exportData(): Promise<string> {
    const data = await this.loadAllData();
    return JSON.stringify(data, null, 2);
  },

  // Import data from backup
  async importData(jsonString: string): Promise<void> {
    try {
      const data: AppData = JSON.parse(jsonString);
      await this.saveAllData(data);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.DONORS),
        AsyncStorage.removeItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.removeItem(STORAGE_KEYS.DONATIONS),
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },
};
