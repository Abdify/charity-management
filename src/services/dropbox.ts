import AsyncStorage from '@react-native-async-storage/async-storage';

const DROPBOX_ACCESS_TOKEN_KEY = '@charity_app_dropbox_token';
const BACKUP_FILENAME = '/charity_backup.json';
const DROPBOX_API_URL = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_URL = 'https://content.dropboxapi.com/2';

interface DropboxError {
  error_summary: string;
  error: {
    '.tag': string;
  };
}

interface DropboxAccountInfo {
  name: {
    display_name: string;
  };
  email: string;
}

class DropboxService {
  private accessToken: string | null = null;

  // Load stored access token
  async loadAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(DROPBOX_ACCESS_TOKEN_KEY);
      if (token) {
        this.accessToken = token;
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

  // Test connection with Dropbox API
  async testConnection(token?: string): Promise<boolean> {
    try {
      const testToken = token || this.accessToken;
      if (!testToken) {
        throw new Error('No access token provided');
      }

      const response = await fetch(`${DROPBOX_API_URL}/users/get_current_account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Dropbox connection test failed:', error);
      return false;
    }
  }

  // Upload backup to Dropbox
  async uploadBackup(data: string): Promise<void> {
    try {
      if (!this.accessToken) {
        await this.loadAccessToken();
      }

      if (!this.accessToken) {
        throw new Error('Not logged in to Dropbox');
      }

      const response = await fetch(`${DROPBOX_CONTENT_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: BACKUP_FILENAME,
            mode: 'overwrite',
            autorename: false,
            mute: false,
          }),
        },
        body: data,
      });

      if (!response.ok) {
        const error: DropboxError = await response.json();
        throw new Error(error.error_summary || 'Upload failed');
      }

      console.log('Backup uploaded successfully to Dropbox');
    } catch (error: any) {
      console.error('Upload backup error:', error);
      throw new Error(error.message || 'Failed to upload backup to Dropbox');
    }
  }

  // Download backup from Dropbox
  async downloadBackup(): Promise<string> {
    try {
      if (!this.accessToken) {
        await this.loadAccessToken();
      }

      if (!this.accessToken) {
        throw new Error('Not logged in to Dropbox');
      }

      const response = await fetch(`${DROPBOX_CONTENT_URL}/files/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: BACKUP_FILENAME,
          }),
        },
      });

      if (!response.ok) {
        const error: DropboxError = await response.json();
        if (error.error?.['.tag'] === 'path' || error.error_summary?.includes('not_found')) {
          throw new Error('No backup file found on Dropbox');
        }
        throw new Error(error.error_summary || 'Download failed');
      }

      const data = await response.text();
      console.log('Backup downloaded successfully from Dropbox');
      return data;
    } catch (error: any) {
      console.error('Download backup error:', error);
      throw new Error(error.message || 'Failed to download backup from Dropbox');
    }
  }

  // Check if backup exists on Dropbox
  async hasBackup(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        await this.loadAccessToken();
      }

      if (!this.accessToken) {
        return false;
      }

      const response = await fetch(`${DROPBOX_API_URL}/files/get_metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: BACKUP_FILENAME,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error checking backup:', error);
      return false;
    }
  }

  // Get Dropbox account info
  async getAccountInfo(): Promise<{ name: string; email: string } | null> {
    try {
      if (!this.accessToken) {
        await this.loadAccessToken();
      }

      if (!this.accessToken) {
        return null;
      }

      const response = await fetch(`${DROPBOX_API_URL}/users/get_current_account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: DropboxAccountInfo = await response.json();
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
