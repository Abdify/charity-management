# Charity Manager - Deployment Guide

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Building the App](#building-the-app)
- [Version Management](#version-management)
- [OTA Updates](#ota-updates)
- [App Store Submission](#app-store-submission)
- [Troubleshooting](#troubleshooting)

## Overview

This app uses **Expo Application Services (EAS)** for building and deploying production-ready applications. We support three environments:

- **Development**: For local development and testing
- **Staging/Preview**: For QA and pre-production testing
- **Production**: For App Store/Play Store releases

## Prerequisites

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Link Project**:
   ```bash
   eas init
   ```
   Update the `projectId` in `app.config.js` with your EAS project ID.

4. **Configure Credentials**:
   - **iOS**: Apple Developer account
   - **Android**: Google Play Console account

## Environment Setup

### 1. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Update the values in `.env.local` with your actual configuration.

### 2. EAS Configuration

The `eas.json` file contains build profiles for different environments:

- `development`: Development builds with debugging enabled
- `preview`: Staging builds for internal testing
- `production`: Production builds for app stores
- `production-ios`: iOS-specific production build
- `production-android`: Android-specific production build

## Building the App

### Development Builds

**Android**:
```bash
npm run build:dev:android
```

**iOS**:
```bash
npm run build:dev:ios
```

### Preview/Staging Builds

**Android**:
```bash
npm run build:preview:android
```

**iOS**:
```bash
npm run build:preview:ios
```

### Production Builds

**Android**:
```bash
npm run build:prod:android
```

**iOS**:
```bash
npm run build:prod:ios
```

**Both Platforms**:
```bash
npm run build:prod:all
```

## Version Management

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (1.0.0 → 1.0.1)

### Bumping Versions

**Patch (Bug fixes)**:
```bash
npm run version:bump:patch
```

**Minor (New features)**:
```bash
npm run version:bump:minor
```

**Major (Breaking changes)**:
```bash
npm run version:bump:major
```

### Manual Version Update

Update version in both files:
1. `package.json` → `version`
2. `app.config.js` → `expo.version`

**iOS Build Number**:
- Update `buildNumber` in `app.config.js` (iOS section)
- Must be incremented for each App Store submission

**Android Version Code**:
- Update `versionCode` in `app.config.js` (Android section)
- Must be incremented for each Play Store submission
- With `autoIncrement: true` in `eas.json`, this is automatic

### Recommended Workflow

Before each release:

1. **Update version**:
   ```bash
   npm run version:bump:minor  # or patch/major
   ```

2. **Update build numbers manually** in `app.config.js`:
   - iOS: Increment `buildNumber`
   - Android: Increment `versionCode` (or rely on autoIncrement)

3. **Commit version changes**:
   ```bash
   git add package.json app.config.js
   git commit -m "chore: bump version to X.Y.Z"
   git tag vX.Y.Z
   git push origin --tags
   ```

4. **Build production**:
   ```bash
   npm run build:prod:all
   ```

## OTA Updates

Over-the-Air (OTA) updates allow you to push JavaScript and asset changes without going through app store review.

### Publishing Updates

**Development**:
```bash
npm run update:dev
```

**Staging**:
```bash
npm run update:preview
```

**Production**:
```bash
npm run update:prod
```

### Important Notes

- OTA updates work only for JS/asset changes
- Native code changes require a new build
- Updates are downloaded on app restart
- Users on different channels (dev/preview/prod) receive different updates

## App Store Submission

### Prerequisites

**iOS**:
- Apple Developer account ($99/year)
- App-specific password for `eas submit`
- Valid App Store Connect entry

**Android**:
- Google Play Developer account ($25 one-time)
- Service account JSON key for automated submission

### Submission Commands

**Android**:
```bash
npm run submit:android
```

**iOS**:
```bash
npm run submit:ios
```

### Manual Submission

1. Build production app
2. Download the build artifact (.ipa or .apk/.aab)
3. Upload manually via:
   - **iOS**: App Store Connect
   - **Android**: Google Play Console

## Release Checklist

Before releasing to production:

- [ ] Test app thoroughly on physical devices
- [ ] Update version number (package.json + app.config.js)
- [ ] Update build numbers (iOS buildNumber, Android versionCode)
- [ ] Update CHANGELOG.md with release notes
- [ ] Run type checking: `npm run typecheck`
- [ ] Test on both iOS and Android
- [ ] Verify app icons and splash screens
- [ ] Review app permissions
- [ ] Check for console errors/warnings
- [ ] Test offline functionality
- [ ] Verify Dropbox backup/restore
- [ ] Create git tag for release
- [ ] Build production binaries
- [ ] Test production builds before submission
- [ ] Submit to app stores
- [ ] Monitor crash reports and user feedback

## Troubleshooting

### Build Failures

**"No valid provisioning profile"** (iOS):
```bash
eas credentials
```
Select iOS → Provisioning Profile → Regenerate

**"Keystore not found"** (Android):
```bash
eas credentials
```
Select Android → Keystore → Generate new

### Environment Issues

If environment variables aren't working:
1. Check `app.config.js` reads `process.env.APP_ENV`
2. Ensure you're setting `APP_ENV` when running build commands
3. Verify `extra.appEnv` is accessible in the app

### Version Conflicts

If app store rejects due to version conflicts:
1. Check existing versions in store console
2. Increment build number (iOS) or version code (Android)
3. Rebuild and resubmit

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/about/guides/policycenter/)

## Support

For issues or questions:
1. Check [Expo Documentation](https://docs.expo.dev/)
2. Visit [Expo Forums](https://forums.expo.dev/)
3. File issues in the project repository
