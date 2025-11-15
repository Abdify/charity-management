import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from 'megajs';

const MEGA_CREDENTIALS_KEY = '@charity_app_mega_credentials';
const BACKUP_FILENAME = 'charity_backup.json';

interface MegaCredentials {
  email: string;
  password: string;
}

class MegaService {
  private storage: any = null;
  private credentials: MegaCredentials | null = null;

  // Load stored credentials
  async loadCredentials(): Promise<MegaCredentials | null> {
    try {
      const credsJson = await AsyncStorage.getItem(MEGA_CREDENTIALS_KEY);
      if (credsJson) {
        this.credentials = JSON.parse(credsJson);
        return this.credentials;
      }
      return null;
    } catch (error) {
      console.error('Error loading MEGA credentials:', error);
      return null;
    }
  }

  // Save credentials
  async saveCredentials(email: string, password: string): Promise<void> {
    try {
      const credentials: MegaCredentials = { email, password };
      await AsyncStorage.setItem(MEGA_CREDENTIALS_KEY, JSON.stringify(credentials));
      this.credentials = credentials;
    } catch (error) {
      console.error('Error saving MEGA credentials:', error);
      throw error;
    }
  }

  // Clear credentials
  async clearCredentials(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MEGA_CREDENTIALS_KEY);
      this.credentials = null;
      this.storage = null;
    } catch (error) {
      console.error('Error clearing MEGA credentials:', error);
      throw error;
    }
  }

  // Check if credentials are saved
  async hasCredentials(): Promise<boolean> {
    const creds = await this.loadCredentials();
    return creds !== null;
  }

  // Login to MEGA
  async login(email?: string, password?: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Use provided credentials or load from storage
        let loginEmail = email;
        let loginPassword = password;

        if (!loginEmail || !loginPassword) {
          const storedCreds = await this.loadCredentials();
          if (!storedCreds) {
            reject(new Error('No credentials provided or stored'));
            return;
          }
          loginEmail = storedCreds.email;
          loginPassword = storedCreds.password;
        }

        // Create new storage instance
        this.storage = new Storage({
          email: loginEmail,
          password: loginPassword,
        });

        this.storage.once('ready', () => {
          console.log('MEGA login successful');
          resolve();
        });

        this.storage.once('error', (error: Error) => {
          console.error('MEGA login error:', error);
          this.storage = null;
          reject(error);
        });
      } catch (error) {
        console.error('MEGA login exception:', error);
        reject(error);
      }
    });
  }

  // Upload backup to MEGA
  async uploadBackup(data: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure we're logged in
        if (!this.storage) {
          await this.login();
        }

        if (!this.storage) {
          reject(new Error('Not logged in to MEGA'));
          return;
        }

        // Convert string to buffer
        const buffer = Buffer.from(data, 'utf8');

        // Get root folder
        const root = this.storage.root;
        if (!root) {
          reject(new Error('Cannot access MEGA root folder'));
          return;
        }

        // Check if backup file already exists and delete it
        const existingFiles = root.children;
        if (existingFiles) {
          for (const file of existingFiles) {
            if (file.name === BACKUP_FILENAME) {
              console.log('Deleting old backup file...');
              await new Promise((res, rej) => {
                file.delete((err: Error) => {
                  if (err) rej(err);
                  else res(undefined);
                });
              });
            }
          }
        }

        // Upload new backup
        console.log('Uploading backup to MEGA...');
        const uploadStream = root.upload({
          name: BACKUP_FILENAME,
          size: buffer.length,
        });

        uploadStream.on('error', (error: Error) => {
          console.error('Upload error:', error);
          reject(error);
        });

        uploadStream.on('complete', () => {
          console.log('Backup uploaded successfully');
          resolve();
        });

        // Write data to stream
        uploadStream.write(buffer);
        uploadStream.end();
      } catch (error) {
        console.error('Upload backup exception:', error);
        reject(error);
      }
    });
  }

  // Download backup from MEGA
  async downloadBackup(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure we're logged in
        if (!this.storage) {
          await this.login();
        }

        if (!this.storage) {
          reject(new Error('Not logged in to MEGA'));
          return;
        }

        // Get root folder
        const root = this.storage.root;
        if (!root) {
          reject(new Error('Cannot access MEGA root folder'));
          return;
        }

        // Find backup file
        const backupFile = root.children?.find(
          (file: any) => file.name === BACKUP_FILENAME
        );

        if (!backupFile) {
          reject(new Error('No backup file found on MEGA'));
          return;
        }

        console.log('Downloading backup from MEGA...');

        // Download file
        const chunks: Buffer[] = [];
        const downloadStream = backupFile.download();

        downloadStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        downloadStream.on('error', (error: Error) => {
          console.error('Download error:', error);
          reject(error);
        });

        downloadStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const data = buffer.toString('utf8');
          console.log('Backup downloaded successfully');
          resolve(data);
        });
      } catch (error) {
        console.error('Download backup exception:', error);
        reject(error);
      }
    });
  }

  // Test connection
  async testConnection(email: string, password: string): Promise<boolean> {
    try {
      await this.login(email, password);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get storage info
  async getStorageInfo(): Promise<{ used: number; total: number } | null> {
    try {
      if (!this.storage) {
        await this.login();
      }

      if (!this.storage) {
        return null;
      }

      // MEGA storage info is available after login
      return {
        used: this.storage.mounts?.[0]?.used || 0,
        total: this.storage.mounts?.[0]?.total || 0,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  // Check if backup exists
  async hasBackup(): Promise<boolean> {
    try {
      if (!this.storage) {
        await this.login();
      }

      if (!this.storage) {
        return false;
      }

      const root = this.storage.root;
      if (!root) {
        return false;
      }

      const backupFile = root.children?.find(
        (file: any) => file.name === BACKUP_FILENAME
      );

      return !!backupFile;
    } catch (error) {
      console.error('Error checking backup:', error);
      return false;
    }
  }
}

export const megaService = new MegaService();
