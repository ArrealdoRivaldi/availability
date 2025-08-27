import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface User {
  id: string;
  displayName: string;
  email: string;
  nop: string;
  role: string;
  createdAt?: any;
  lastLoginAt?: any;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onView: (user: User) => void;
  loading: boolean;
}

type Order = 'asc' | 'desc';

export default function UserTable({ users, onEdit, onDelete, onView, loading }: UserTableProps) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof User>('displayName');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (property: keyof User) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedUsers = React.useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, order, orderBy]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getNopColor = (nop: string) => {
    const nopColors: { [key: string]: string } = {
      'kalimantan': 'success',
      'balikpapan': 'primary',
      'banjarmasin': 'secondary',
      'palangkaraya': 'info',
      'pangkalan_bun': 'warning',
      'pontianak': 'success',
      'samarinda': 'primary',
      'tarakan': 'secondary'
    };
    return nopColors[nop.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="user table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'displayName'}
                  direction={orderBy === 'displayName' ? order : 'asc'}
                  onClick={() => handleRequestSort('displayName')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'email'}
                  direction={orderBy === 'email' ? order : 'asc'}
                  onClick={() => handleRequestSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'nop'}
                  direction={orderBy === 'nop' ? order : 'asc'}
                  onClick={() => handleRequestSort('nop')}
                >
                  NOP
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'role'}
                  direction={orderBy === 'role' ? order : 'asc'}
                  onClick={() => handleRequestSort('role')}
                >
                  Role
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow hover key={user.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {user.displayName}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.nop}
                      color={getNopColor(user.nop) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace('_', ' ').toUpperCase()}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => onView(user)}
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(user)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          onClick={() => onDelete(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {sortedUsers.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No users found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={sortedUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
