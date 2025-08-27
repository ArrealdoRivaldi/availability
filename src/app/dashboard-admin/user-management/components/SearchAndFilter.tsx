import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedNop: string;
  onNopChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (value: string) => void;
  onClearFilters: () => void;
}

const nopOptions = [
  { value: '', label: 'All NOP' },
  { value: 'kalimantan', label: 'Kalimantan' },
  { value: 'balikpapan', label: 'Balikpapan' },
  { value: 'banjarmasin', label: 'Banjarmasin' },
  { value: 'palangkaraya', label: 'Palangkaraya' },
  { value: 'pangkalan_bun', label: 'Pangkalan Bun' },
  { value: 'pontianak', label: 'Pontianak' },
  { value: 'samarinda', label: 'Samarinda' },
  { value: 'tarakan', label: 'Tarakan' }
];

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' }
];

export default function SearchAndFilter({
  searchTerm,
  onSearchChange,
  selectedNop,
  onNopChange,
  selectedRole,
  onRoleChange,
  onClearFilters
}: SearchAndFilterProps) {
  const hasActiveFilters = searchTerm || selectedNop || selectedRole;

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or email..."
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            size="small"
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by NOP</InputLabel>
            <Select
              value={selectedNop}
              label="Filter by NOP"
              onChange={(e) => onNopChange(e.target.value)}
            >
              {nopOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={selectedRole}
              label="Filter by Role"
              onChange={(e) => onRoleChange(e.target.value)}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            startIcon={<ClearIcon />}
            size="small"
          >
            Clear
          </Button>
        </Grid>
      </Grid>
      
      {hasActiveFilters && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {searchTerm && (
            <Chip
              label={`Search: "${searchTerm}"`}
              onDelete={() => onSearchChange('')}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
          {selectedNop && (
            <Chip
              label={`NOP: ${nopOptions.find(opt => opt.value === selectedNop)?.label}`}
              onDelete={() => onNopChange('')}
              color="secondary"
              variant="outlined"
              size="small"
            />
          )}
          {selectedRole && (
            <Chip
              label={`Role: ${roleOptions.find(opt => opt.value === selectedRole)?.label}`}
              onDelete={() => onRoleChange('')}
              color="info"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
