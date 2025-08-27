# User Management System

A comprehensive user management system built with React, Material-UI, and Firebase Firestore.

## Features

### 🗂️ User Table Display
- **Sortable Columns**: Click on column headers to sort by name, email, NOP, or role
- **Pagination**: Configurable rows per page (5, 10, 25, 50)
- **Responsive Design**: Mobile-friendly table layout
- **Loading States**: Visual feedback during data operations

### 🔍 Search & Filtering
- **Text Search**: Search users by name or email
- **NOP Filter**: Filter by Network Operation Point (Kalimantan, Sumatra, Jawa, Sulawesi, Papua)
- **Role Filter**: Filter by user role (Super Admin, Admin, User)
- **Active Filters Display**: Visual chips showing current filters
- **Clear All Filters**: One-click filter reset

### ➕ Add New Users
- **Form Validation**: Required field validation with error messages
- **Role Selection**: Dropdown for user role assignment
- **NOP Assignment**: Geographic region assignment
- **Email Validation**: Proper email format validation

### ✏️ Edit Users
- **Inline Editing**: Modal form for user updates
- **Data Preservation**: Maintains existing user data
- **Validation**: Same validation rules as add form
- **Real-time Updates**: Immediate reflection in the table

### 👁️ View User Details
- **Comprehensive View**: All user information in read-only format
- **Timestamps**: Creation, update, and last login times
- **Visual Indicators**: Color-coded roles and NOPs
- **User ID Display**: Full Firestore document ID

### 🗑️ Delete Users
- **Confirmation Dialog**: Prevents accidental deletions
- **Warning Messages**: Clear indication of permanent action
- **User Identification**: Shows user name before deletion
- **Error Handling**: Graceful failure handling

### 📊 Dashboard Overview
- **Total Users Count**: Real-time user count
- **Filtered Results**: Shows current filtered count
- **Role Distribution**: Count of super admins
- **NOP Coverage**: Number of active regions

## Technical Implementation

### Architecture
- **Component-based**: Modular, reusable components
- **Custom Hooks**: `useUsers` for data management
- **Utility Functions**: Filtering and search logic
- **TypeScript**: Full type safety

### Firebase Integration
- **Real-time Updates**: `onSnapshot` for live data
- **CRUD Operations**: Create, Read, Update, Delete
- **Error Handling**: Comprehensive error management
- **Data Validation**: Client-side and server-side validation

### State Management
- **Local State**: Component-level state management
- **Memoization**: Optimized filtering and calculations
- **Loading States**: User feedback during operations
- **Error States**: Proper error display and handling

## File Structure

```
user-management/
├── components/
│   ├── UserTable.tsx           # Main user data table
│   ├── SearchAndFilter.tsx     # Search and filter controls
│   ├── UserFormModal.tsx       # Add/Edit user form
│   ├── UserDetailsModal.tsx    # User details view
│   ├── DeleteConfirmationDialog.tsx # Delete confirmation
│   └── index.ts               # Component exports
├── hooks/
│   └── useUsers.ts            # Custom hook for user data
├── utils/
│   └── userFilters.ts         # Filtering and search utilities
├── page.tsx                   # Main page component
└── README.md                  # This documentation
```

## Usage

### Basic Operations
1. **View Users**: Users are automatically loaded and displayed
2. **Add User**: Click "Add User" button and fill the form
3. **Edit User**: Click edit icon on any user row
4. **Delete User**: Click delete icon and confirm deletion
5. **View Details**: Click view icon to see full user information

### Filtering
1. **Search**: Type in the search box to find users by name or email
2. **NOP Filter**: Select a specific region from the dropdown
3. **Role Filter**: Select a specific role from the dropdown
4. **Clear Filters**: Use the clear button to reset all filters

### Sorting
- Click on any column header to sort by that field
- Click again to reverse the sort order
- Sort indicators show current sort direction

## Data Model

### User Object
```typescript
interface User {
  id: string;              // Firestore document ID
  displayName: string;     // User's display name
  email: string;           // User's email address
  nop: string;            // Network Operation Point
  role: string;           // User role (super_admin, admin, user)
  createdAt?: any;        // Account creation timestamp
  lastLoginAt?: any;      // Last login timestamp
  updatedAt?: any;        // Last update timestamp
}
```

### Supported Values
- **NOPs**: kalimantan, sumatra, jawa, sulawesi, papua
- **Roles**: super_admin, admin, user

## Security Considerations

- **Role-based Access**: Different permissions for different user roles
- **Data Validation**: Client and server-side validation
- **Confirmation Dialogs**: Prevents accidental data loss
- **Error Handling**: Secure error messages without data exposure

## Performance Features

- **Real-time Updates**: Live data synchronization
- **Optimized Filtering**: Efficient search and filter algorithms
- **Pagination**: Handles large datasets efficiently
- **Memoization**: Prevents unnecessary re-renders
- **Loading States**: User feedback during operations

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Works on all device sizes
- **Progressive Enhancement**: Graceful degradation for older browsers

## Dependencies

- React 18+
- Material-UI 5+
- Firebase 11+
- TypeScript 5+
- Next.js 13+
