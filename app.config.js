const IS_DEV = process.env.APP_ENV === 'development';
const IS_STAGING = process.env.APP_ENV === 'staging';
const IS_PROD = process.env.APP_ENV === 'production';

const getAppName = () => {
  if (IS_DEV) return 'Charity Manager (Dev)';
  if (IS_STAGING) return 'Charity Manager (Staging)';
  return 'Charity Manager';
};

const getBundleIdentifier = () => {
  if (IS_DEV) return 'com.charitymanagement.app.dev';
  if (IS_STAGING) return 'com.charitymanagement.app.staging';
  return 'com.charitymanagement.app';
};

const getAndroidPackage = () => {
  if (IS_DEV) return 'com.charitymanagement.app.dev';
  if (IS_STAGING) return 'com.charitymanagement.app.staging';
  return 'com.charitymanagement.app';
};

module.exports = {
  expo: {
    name: getAppName(),
    slug: 'charity-management',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#2196F3',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      buildNumber: '1',
      infoPlist: {
        LSApplicationQueriesSchemes: ['dbapi-8-emm', 'dbapi-2'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2196F3',
      },
      package: getAndroidPackage(),
      versionCode: 1,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [],
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/your-project-id',
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    extra: {
      appEnv: process.env.APP_ENV || 'development',
      eas: {
        projectId: 'your-project-id-here',
      },
    },
  },
};
