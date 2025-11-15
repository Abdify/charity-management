import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dropbox } from 'dropbox';

const DROPBOX_ACCESS_TOKEN_KEY = '@charity_app_dropbox_token';
const BACKUP_FILENAME = '/charity_backup.json';

class DropboxService {
  private accessToken: string | null = null;
  private dbx: Dropbox | null = null;

  // Initialize Dropbox client
  private initializeClient(token?: string): Dropbox {
    const accessToken = token || this.accessToken;
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Create Dropbox instance with fetch (available globally in React Native)
    return new Dropbox({
      accessToken,
      fetch: fetch.bind(globalThis) // Bind global fetch for React Native
    });
  }

  // Load stored access token
  async loadAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(DROPBOX_ACCESS_TOKEN_KEY);
      if (token) {
        this.accessToken = token;
        this.dbx = this.initializeClient(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error loading Dropbox access token:', error);
      return null;
    }
  }

  // Save access token
  async saveAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(DROPBOX_ACCESS_TOKEN_KEY, token);
      this.accessToken = token;
      this.dbx = this.initializeClient(token);
    } catch (error) {
      console.error('Error saving Dropbox access token:', error);
      throw error;
    }
  }

  // Clear access token
  async clearAccessToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DROPBOX_ACCESS_TOKEN_KEY);
      this.accessToken = null;
      this.dbx = null;
    } catch (error) {
      console.error('Error clearing Dropbox access token:', error);
      throw error;
    }
  }

  // Check if access token is saved
  async hasAccessToken(): Promise<boolean> {
    const token = await this.loadAccessToken();
    return token !== null && token.length > 0;
  }

  // Test connection
  async testConnection(token?: string): Promise<boolean> {
    try {
      const testToken = token || this.accessToken;
      if (!testToken) {
        throw new Error('No access token provided');
      }

      const dbx = this.initializeClient(testToken);
      const response = await dbx.usersGetCurrentAccount();

      return response.status === 200;
    } catch (error: any) {
      console.error('Dropbox connection test failed:', error);
      // Check if it's an authentication error
      if (error.status === 401 || error.error?.error_summary?.includes('invalid_access_token')) {
        return false;
      }
      return false;
    }
  }

  // Upload backup to Dropbox
  async uploadBackup(data: string): Promise<void> {
    try {
      if (!this.dbx) {
        await this.loadAccessToken();
        if (!this.dbx) {
          throw new Error('Not logged in to Dropbox');
        }
      }

      // Convert string to Blob for upload
      const blob = new Blob([data], { type: 'application/json' });

      const response = await this.dbx.filesUpload({
        path: BACKUP_FILENAME,
        contents: blob,
        mode: { '.tag': 'overwrite' },
        autorename: false,
        mute: false,
      });

      console.log('Backup uploaded successfully to Dropbox:', response.result.name);
    } catch (error: any) {
      console.error('Upload backup error:', error);
      const errorMessage = error.error?.error_summary || error.message || 'Failed to upload backup to Dropbox';
      throw new Error(errorMessage);
    }
  }

  // Download backup from Dropbox
  async downloadBackup(): Promise<string> {
    try {
      if (!this.dbx) {
        await this.loadAccessToken();
        if (!this.dbx) {
          throw new Error('Not logged in to Dropbox');
        }
      }

      const response = await this.dbx.filesDownload({
        path: BACKUP_FILENAME,
      });

      // The SDK returns the file as fileBlob in the result
      const fileBlob = (response.result as any).fileBlob;

      if (!fileBlob) {
        throw new Error('No file data received from Dropbox');
      }

      // Convert Blob to text
      const data = await this.blobToText(fileBlob);
      console.log('Backup downloaded successfully from Dropbox');
      return data;
    } catch (error: any) {
      console.error('Download backup error:', error);

      // Check if file not found
      if (error.status === 409 || error.error?.error_summary?.includes('not_found')) {
        throw new Error('No backup file found on Dropbox');
      }

      const errorMessage = error.error?.error_summary || error.message || 'Failed to download backup from Dropbox';
      throw new Error(errorMessage);
    }
  }

  // Helper: Convert Blob to text
  private async blobToText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read blob'));
      };
      reader.readAsText(blob);
    });
  }

  // Check if backup exists
  async hasBackup(): Promise<boolean> {
    try {
      if (!this.dbx) {
        await this.loadAccessToken();
        if (!this.dbx) {
          return false;
        }
      }

      await this.dbx.filesGetMetadata({
        path: BACKUP_FILENAME,
      });

      return true;
    } catch (error: any) {
      // File not found is expected if no backup exists
      if (error.status === 409 || error.error?.error_summary?.includes('not_found')) {
        return false;
      }
      console.error('Error checking backup:', error);
      return false;
    }
  }

  // Get account info
  async getAccountInfo(): Promise<{ name: string; email: string } | null> {
    try {
      if (!this.dbx) {
        await this.loadAccessToken();
        if (!this.dbx) {
          return null;
        }
      }

      const response = await this.dbx.usersGetCurrentAccount();

      if (response.status === 200) {
        const data = response.result;
        return {
          name: data.name?.display_name || 'Unknown',
          email: data.email || 'Unknown',
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting account info:', error);
      return null;
    }
  }
}

export const dropboxService = new DropboxService();
