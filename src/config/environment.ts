import Constants from 'expo-constants';

type AppEnvironment = 'development' | 'staging' | 'production';

const getEnvironment = (): AppEnvironment => {
  const env = Constants.expoConfig?.extra?.appEnv;
  if (env === 'production') return 'production';
  if (env === 'staging') return 'staging';
  return 'development';
};

export const ENV = getEnvironment();

export const IS_DEV = ENV === 'development';
export const IS_STAGING = ENV === 'staging';
export const IS_PROD = ENV === 'production';

export const config = {
  app: {
    name: IS_PROD ? 'Charity Manager' : `Charity Manager (${ENV})`,
    version: Constants.expoConfig?.version || '1.0.0',
    buildNumber: Constants.expoConfig?.ios?.buildNumber ||
                 Constants.expoConfig?.android?.versionCode || '1',
  },
  api: {
    // Add your API endpoints here
    baseUrl: IS_PROD
      ? 'https://api.charitymanager.com'
      : IS_STAGING
      ? 'https://staging-api.charitymanager.com'
      : 'https://dev-api.charitymanager.com',
    timeout: 30000,
  },
  features: {
    enableDropboxBackup: true,
    enableAnalytics: IS_PROD,
    enableCrashReporting: IS_PROD || IS_STAGING,
    debugMode: IS_DEV,
  },
  storage: {
    keys: {
      donors: 'donors',
      projects: 'projects',
      donations: 'donations',
      dropboxToken: 'dropbox_token',
    },
  },
};

export default config;
