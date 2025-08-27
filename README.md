# Availability Dashboard

A Next.js application with Firebase integration for monitoring and analyzing cell down incidents.

## Features

### Cell Down Dashboard
The dashboard provides comprehensive analytics for cell down incidents including:

- **Trend Cell Down Chart**: Weekly trends showing total incidents, progress, and status
- **Root Cause Analysis**: Horizontal bar chart displaying root cause distribution
- **PIC Dept Table**: Person in charge department statistics
- **Site Class Table**: Site classification statistics
- **NOP Progress Table**: Network Operations Point progress with ENOM closed alarm percentages
- **Aging Table**: Incident aging analysis by NOP location

## Data Structure

The dashboard expects data from the `data_celldown` Firestore collection with the following fields:

- `createdAt`: Timestamp for incident creation
- `progress`: Progress status (e.g., "done", "in progress")
- `status`: Incident status (e.g., "Close", "Open")
- `rootCause`: Root cause of the incident
- `picDept`: Person in charge department
- `siteClass`: Site classification (DIAMOND, PLATINUM, GOLD, SILVER, BRONZE)
- `nop`: Network Operations Point location
- `agingDown`: Aging in days

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Firebase in `src/app/firebaseConfig.ts`
4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

Navigate to `/dashboard-admin/dashboard/cell-down` to view the Cell Down Dashboard.

The dashboard automatically fetches data from Firestore and displays:
- Real-time charts and tables
- Automatic week calculation from timestamps
- Progress and status tracking
- Aging analysis
- Performance metrics

## Technologies Used

- Next.js 13+
- Firebase Firestore
- Material-UI
- React Google Charts
- TypeScript

## Data Processing

The dashboard automatically:
- Groups data by week for trend analysis
- Calculates progress and status percentages
- Processes aging data into ranges (8-30, 30-60, >60 days)
- Handles missing or empty field values
- Provides real-time data refresh capability
