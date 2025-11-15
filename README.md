# Charity Management App

A comprehensive charity donation management application built with React Native and Expo, targeting both Android and Web platforms. This app is designed for single-user offline management of charity donations with optional backup functionality.

## Features

### Core Functionality
- **Fully Offline**: All data is stored locally using AsyncStorage
- **Dropbox Cloud Backup**: Secure cloud backup and restore using Dropbox
- **No Authentication**: Simple, single-user experience (only Dropbox token for backup)
- **Beautiful UI**: Mobile-first design following Material Design principles

### Donor Management
- Add, edit, and remove donors
- Track donor status (Active/Inactive)
- Store donor information: name, phone number, location, notes
- View donor profiles with complete donation history
- See donor statistics (total donations, donation count)

### Project Management
- Create and manage donation projects
- Track project status (Active, On Hold, Completed)
- Set target amounts and monitor progress
- Visual progress indicators
- View project profiles with donation history
- Track project statistics

### Donation Tracking
- Quick and easy donation entry
- Link donations to specific donors and projects
- Add donation dates and notes
- View complete donation history
- See donation summaries and totals

### Dashboard
- Real-time statistics overview
- Quick access to add donations
- Recent donations list
- Active donors and projects count
- Dropbox cloud backup and restore functionality

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Development and build tooling
- **TypeScript**: Type-safe code
- **React Navigation**: Navigation and routing
- **AsyncStorage**: Offline data persistence
- **Dropbox REST API**: Cloud backup and restore

## Project Structure

```
charity-management/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── StatusBadge.tsx
│   │   └── EmptyState.tsx
│   ├── contexts/           # React Context for state management
│   │   └── AppContext.tsx
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/           # All app screens
│   │   ├── dashboard/
│   │   ├── donors/
│   │   ├── projects/
│   │   ├── donations/
│   │   └── settings/
│   ├── services/          # External services
│   │   ├── storage.ts     # AsyncStorage wrapper
│   │   └── dropbox.ts        # Dropbox cloud backup service
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── utils/             # Helper functions
│       └── helpers.ts
├── App.tsx                # App entry point
├── app.json              # Expo configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI (optional, but recommended)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd charity-management
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running the App

#### On Android
```bash
npm run android
```

#### On Web
```bash
npm run web
```

## Usage Guide

### Adding a Donor
1. Navigate to the "Donors" tab
2. Tap "Add Donor"
3. Fill in donor information (name, phone, location)
4. Set donor status
5. Save

### Creating a Project
1. Navigate to the "Projects" tab
2. Tap "Add Project"
3. Enter project details (name, description, target amount)
4. Set start date and optional end date
5. Save

### Recording a Donation
1. From the Dashboard or Donations tab, tap "Add Donation"
2. Select a donor from the list
3. Select a project
4. Enter the donation amount
5. Set the date (defaults to today)
6. Add optional notes
7. Save

The app will automatically:
- Update the project's current amount
- Update donor's donation history
- Reflect changes in all statistics


### Dropbox Cloud Backup and Restore

#### Setting Up Dropbox
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Create a new app:
   - Choose "Scoped access"
   - Choose "Full Dropbox" access
   - Give your app a name (e.g., "Charity Manager")
3. In the app settings, go to the "Permissions" tab and enable these scopes:
   - `files.content.write`
   - `files.content.read`
4. Generate an access token in the "Settings" tab
5. From the app Dashboard, tap "Settings" in the Dropbox Cloud Backup section
6. Paste your access token
7. Tap "Test Connection" to verify
8. Tap "Connect" - your token will be saved securely

#### Creating a Backup
1. Go to the Dashboard
2. Scroll to "Dropbox Cloud Backup" section
3. Ensure you're connected to Dropbox (green status badge)
4. Tap "Backup to Dropbox"
5. Your data will be uploaded to Dropbox as `charity_backup.json`
6. Previous backups are automatically replaced

#### Restoring from Backup
1. Go to the Dashboard
2. Scroll to "Dropbox Cloud Backup" section
3. Ensure you're connected to Dropbox
4. Tap "Restore from Dropbox"
5. Confirm the action
6. All data will be downloaded and restored from Dropbox

**Note**: Only one backup file is kept on Dropbox at a time. Each new backup replaces the previous one. The backup is stored at `/charity_backup.json` in your Dropbox.

## Data Models

### Donor
- ID, Name, Phone Number, Location
- Status (Active/Inactive)
- Notes (optional)
- Creation and update timestamps

### Project
- ID, Name, Description
- Target Amount, Current Amount
- Status (Active, On Hold, Completed)
- Start Date, End Date (optional)
- Creation and update timestamps

### Donation
- ID, Donor ID, Project ID
- Amount, Date
- Notes (optional)
- Creation and update timestamps

## Customization

### Changing Colors
The app uses a Material Design color scheme. To customize colors, update the color values in the component StyleSheet definitions. Main colors:
- Primary: #2196F3 (Blue)
- Success: #4CAF50 (Green)
- Danger: #F44336 (Red)
- Secondary: #757575 (Gray)

### Extending Functionality
The app is built with extensibility in mind:
- Add new fields to data models in `src/types/index.ts`
- Update storage service in `src/services/storage.ts`
- Create new screens in `src/screens/`
- Add navigation routes in `src/navigation/AppNavigator.tsx`

## Future Enhancements

- [x] Dropbox cloud backup integration (Completed!)
- [ ] Export data to CSV/Excel
- [ ] Donation receipts generation
- [ ] Email/SMS notifications
- [ ] Charts and analytics
- [ ] Multi-currency support
- [ ] Recurring donation tracking
- [ ] Multiple cloud storage options (Google Drive, OneDrive)

## Contributing

This is a single-user app designed for simplicity. However, contributions for bug fixes and enhancements are welcome.

## License

ISC

## Support

For issues or questions, please open an issue in the repository.
