# Changelog

All notable changes to the Charity Manager app will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production deployment setup with EAS Build
- Environment configuration for development, staging, and production
- Comprehensive deployment documentation
- Automated build and submission scripts
- Version management workflow
- OTA update support

## [1.0.0] - 2025-11-15

### Added
- Initial release
- Dashboard with donation statistics and recent activity
- Donor management (add, edit, delete, view profile)
- Project management (add, edit, delete, view details)
- Donation tracking with one-time and monthly donation types
- Advanced filtering on donations, donor profiles, and project profiles
- Bengali localization for entire app
- Bangladeshi Taka (৳) currency formatting
- Bengali date formatting
- Modern 3D UI with gradient effects and shadows
- Beautiful Ionicons navigation icons
- Dropbox backup and restore functionality
- Monthly donation tracking
- Donor ordering system
- Color-coded donation cards
- Statistics dashboard with charts
- Search functionality across donors
- Filter by project, donor, and month
- Offline-first data persistence with AsyncStorage

### Features
- **Dashboard**: Total donations, active donors/projects, recent donations
- **Donors**: Full CRUD operations, profile pages, donation history
- **Projects**: Project tracking, progress monitoring, target amounts
- **Donations**: Record donations, link to donors/projects, monthly tracking
- **Filters**: Search by donor name, filter by project/month
- **Localization**: Complete Bengali translation
- **UI/UX**: Modern design with 3D effects, gradients, icons
- **Data**: Local storage with cloud backup option

### Technical
- React Native with Expo SDK 54
- TypeScript for type safety
- React Navigation for routing
- AsyncStorage for data persistence
- expo-auth-session for OAuth
- expo-file-system for file operations
- Bengali i18n with translation helper

---

## Version History Format

### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security patches
