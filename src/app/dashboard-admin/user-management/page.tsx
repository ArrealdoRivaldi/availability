'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import PageContainer from '../components/container/PageContainer';
import DashboardCard from '../components/shared/DashboardCard';
import UserTable from './components/UserTable';
import SearchAndFilter from './components/SearchAndFilter';
import UserFormModal from './components/UserFormModal';
import UserDetailsModal from './components/UserDetailsModal';
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog';
import { useUsers, User } from './hooks/useUsers';
import { filterUsers, getFilterStats, getNopCounts, getRoleCounts } from './utils/userFilters';

export default function UserManagement() {
  const { users, loading, error, deleteUser, refreshUsers } = useUsers();
  
  // State for modals
  const [userFormModal, setUserFormModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    user: User | null;
  }>({
    open: false,
    mode: 'add',
    user: null
  });
  
  const [userDetailsModal, setUserDetailsModal] = useState<{
    open: boolean;
    user: User | null;
  }>({
    open: false,
    user: null
  });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({
    open: false,
    userId: '',
    userName: ''
  });

  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNop, setSelectedNop] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  // State for notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Filtered users
  const filteredUsers = useMemo(() => {
    return filterUsers(users, searchTerm, selectedNop, selectedRole);
  }, [users, searchTerm, selectedNop, selectedRole]);

  // Filter stats
  const filterStats = useMemo(() => {
    return getFilterStats(users, filteredUsers);
  }, [users, filteredUsers]);

  // Counts for dashboard cards
  const nopCounts = useMemo(() => getNopCounts(users), [users]);
  const roleCounts = useMemo(() => getRoleCounts(users), [users]);

  // Handlers
  const handleAddUser = () => {
    setUserFormModal({
      open: true,
      mode: 'add',
      user: null
    });
  };

  const handleEditUser = (user: User) => {
    setUserFormModal({
      open: true,
      mode: 'edit',
      user
    });
  };

  const handleViewUser = (user: User) => {
    setUserDetailsModal({
      open: true,
      user
    });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setDeleteDialog({
        open: true,
        userId,
        userName: user.displayName
      });
    }
  };

  const handleConfirmDelete = async () => {
    const success = await deleteUser(deleteDialog.userId);
    if (success) {
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    }
    setDeleteDialog({ open: false, userId: '', userName: '' });
  };

  const handleCloseUserFormModal = () => {
    setUserFormModal({ open: false, mode: 'add', user: null });
    // Refresh users after form submission
    refreshUsers();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedNop('');
    setSelectedRole('');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  return (
    <PageContainer title="User Management" description="Manage system users and permissions">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h3">
            User Management
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={refreshUsers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
        </Box>

        {/* Dashboard Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  {filterStats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Showing
                </Typography>
                <Typography variant="h4">
                  {filterStats.showing}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Super Admins
                </Typography>
                <Typography variant="h4">
                  {roleCounts.super_admin || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active NOPs
                </Typography>
                <Typography variant="h4">
                  {Object.keys(nopCounts).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedNop={selectedNop}
          onNopChange={setSelectedNop}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onClearFilters={handleClearFilters}
        />

        {/* User Table */}
        <DashboardCard title="Users">
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Error Loading Users:</strong>
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          )}
          
          <UserTable
            users={filteredUsers}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onView={handleViewUser}
            loading={loading}
          />
        </DashboardCard>

        {/* Modals */}
        <UserFormModal
          open={userFormModal.open}
          onClose={handleCloseUserFormModal}
          user={userFormModal.user}
          mode={userFormModal.mode}
        />

        <UserDetailsModal
          open={userDetailsModal.open}
          onClose={() => setUserDetailsModal({ open: false, user: null })}
          user={userDetailsModal.user}
        />

        <DeleteConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, userId: '', userName: '' })}
          onConfirm={handleConfirmDelete}
          userName={deleteDialog.userName}
          loading={loading}
        />

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </PageContainer>
  );
}
