# Release Process Quick Reference

## Pre-Release Checklist

### 1. Version Update
```bash
# For bug fixes
npm run version:bump:patch

# For new features
npm run version:bump:minor

# For breaking changes
npm run version:bump:major
```

### 2. Update Build Numbers

Edit `app.config.js`:

**iOS**:
```javascript
buildNumber: 'X'  // Increment by 1
```

**Android**:
```javascript
versionCode: X  // Increment by 1 (or use autoIncrement)
```

### 3. Update Changelog

Add release notes to `CHANGELOG.md`:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature descriptions

### Fixed
- Bug fix descriptions
```

### 4. Commit Version Changes
```bash
git add package.json app.config.js CHANGELOG.md
git commit -m "chore: release v1.0.1"
git tag v1.0.1
git push origin main --tags
```

## Build & Deploy

### Development Build
```bash
npm run build:dev:android
npm run build:dev:ios
```

### Preview/Staging Build
```bash
npm run build:preview:android
npm run build:preview:ios
```

### Production Build
```bash
# Build both platforms
npm run build:prod:all

# Or build individually
npm run build:prod:android
npm run build:prod:ios
```

## App Store Submission

### Automated Submission
```bash
npm run submit:android
npm run submit:ios
```

### Manual Submission

1. **Build production**: `npm run build:prod:all`
2. **Download build** from EAS dashboard
3. **Upload to stores**:
   - iOS: App Store Connect
   - Android: Google Play Console

## OTA Updates

For JavaScript/asset-only changes:

```bash
# Development
npm run update:dev

# Staging
npm run update:preview

# Production
npm run update:prod
```

## Emergency Hotfix Process

1. **Create hotfix branch**:
   ```bash
   git checkout -b hotfix/v1.0.1
   ```

2. **Fix the issue**

3. **Bump patch version**:
   ```bash
   npm run version:bump:patch
   ```

4. **Update build numbers** in `app.config.js`

5. **Update CHANGELOG.md**

6. **Commit and tag**:
   ```bash
   git add .
   git commit -m "fix: critical bug description"
   git tag v1.0.1
   ```

7. **Build and deploy**:
   ```bash
   npm run build:prod:all
   npm run submit:android
   npm run submit:ios
   ```

8. **Merge back**:
   ```bash
   git checkout main
   git merge hotfix/v1.0.1
   git push origin main --tags
   ```

## Version Numbering Guide

**Format**: `MAJOR.MINOR.PATCH`

- **1.0.0 → 1.0.1**: Bug fixes, small improvements (PATCH)
- **1.0.0 → 1.1.0**: New features, backward compatible (MINOR)
- **1.0.0 → 2.0.0**: Breaking changes, major redesign (MAJOR)

## Testing Checklist

Before production release:

- [ ] Run `npm run typecheck`
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test Dropbox backup/restore
- [ ] Test offline functionality
- [ ] Verify all filters work correctly
- [ ] Check Bengali translations
- [ ] Test navigation between all screens
- [ ] Verify icons display correctly
- [ ] Test with fresh install (no existing data)
- [ ] Test with existing data migration

## Common Commands

```bash
# Check TypeScript errors
npm run typecheck

# Start development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# View EAS builds
eas build:list

# View EAS credentials
eas credentials

# Configure EAS project
eas init
```

## Environment Variables

Set before building:

```bash
# Development
export APP_ENV=development

# Staging
export APP_ENV=staging

# Production
export APP_ENV=production
```

## Build Profiles

Defined in `eas.json`:

- **development**: Dev builds with debug info
- **preview**: Staging builds for QA
- **production**: App store builds
- **production-ios**: iOS-specific production
- **production-android**: Android-specific production

## Troubleshooting

### Build fails with credentials error
```bash
eas credentials
# Regenerate provisioning profile (iOS) or keystore (Android)
```

### Version already exists in store
- Increment build number in `app.config.js`
- Rebuild without changing version number

### OTA update not showing
- Clear app data and restart
- Check update channel matches build profile
- Verify runtime version compatibility

## Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Changelog](./CHANGELOG.md)
- [EAS Documentation](https://docs.expo.dev/eas/)
