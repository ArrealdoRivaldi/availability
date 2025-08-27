import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { doc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';

interface User {
  id: string;
  displayName: string;
  email: string;
  nop: string;
  role: string;
}

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  mode: 'add' | 'edit';
}

const nopOptions = [
  { value: 'kalimantan', label: 'Kalimantan' },
  { value: 'sumatra', label: 'Sumatra' },
  { value: 'jawa', label: 'Jawa' },
  { value: 'sulawesi', label: 'Sulawesi' },
  { value: 'papua', label: 'Papua' }
];

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' }
];

export default function UserFormModal({ open, onClose, user, mode }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    nop: '',
    role: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        nop: user.nop || '',
        role: user.role || ''
      });
    } else {
      setFormData({
        displayName: '',
        email: '',
        nop: '',
        role: ''
      });
    }
    setErrors({});
    setSubmitError('');
  }, [user, mode, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.nop) {
      newErrors.nop = 'NOP is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setSubmitError('');

    try {
      if (mode === 'add') {
        // Add new user
        const userData = {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await addDoc(collection(db, 'users'), userData);
      } else {
        // Update existing user
        if (user?.id) {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, {
            ...formData,
            updatedAt: new Date()
          });
        }
      }

      onClose();
      // You might want to add a success callback here to refresh the user list
    } catch (error) {
      console.error('Error saving user:', error);
      setSubmitError('Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add New User' : 'Edit User'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            error={!!errors.displayName}
            helperText={errors.displayName}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            margin="normal"
            required
          />

          <FormControl fullWidth margin="normal" required error={!!errors.nop}>
            <InputLabel>NOP</InputLabel>
            <Select
              value={formData.nop}
              label="NOP"
              onChange={(e) => handleInputChange('nop', e.target.value)}
            >
              {nopOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.nop && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.nop}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal" required error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => handleInputChange('role', e.target.value)}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.role}
              </Typography>
            )}
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : (mode === 'add' ? 'Add User' : 'Update User')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
