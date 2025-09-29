/**
 * Edit Modal Component for Cell Down Data Management
 * Handles editing of individual Cell Down records
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography
} from '@mui/material';
import { EditModalData } from '../types';
import { 
  ROOT_CAUSE_OPTIONS, 
  PIC_DEPT_OPTIONS, 
  PROGRESS_OPTIONS, 
  CATEGORY_OPTIONS 
} from '../constants';

interface EditModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Function to save the edited data */
  onSave: () => void;
  /** Current edit data */
  editData: EditModalData;
  /** Function to update edit data */
  setEditData: (data: EditModalData) => void;
  /** Selected data for display */
  selectedData: any;
  /** Available TO options */
  uniqueTOs: string[];
}

/**
 * Edit Modal Component
 * Provides a form for editing Cell Down data fields
 */
export const EditModal: React.FC<EditModalProps> = ({
  open,
  onClose,
  onSave,
  editData,
  setEditData,
  selectedData,
  uniqueTOs
}) => {
  /**
   * Handle input change for form fields
   * @param field - Field name to update
   * @param value - New value
   */
  const handleInputChange = (field: keyof EditModalData, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6">Edit Cell Down Data</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Cell Down Name: <strong>{selectedData?.cellDownName || 'N/A'}</strong>
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Root Cause Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Root Cause</InputLabel>
              <Select 
                value={editData.rootCause} 
                onChange={(e) => handleInputChange('rootCause', e.target.value)} 
                label="Root Cause"
              >
                {ROOT_CAUSE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* PIC Department Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>PIC Department</InputLabel>
              <Select 
                value={editData.picDept} 
                onChange={(e) => handleInputChange('picDept', e.target.value)} 
                label="PIC Department"
              >
                {PIC_DEPT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Progress Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Progress</InputLabel>
              <Select 
                value={editData.progress} 
                onChange={(e) => handleInputChange('progress', e.target.value)} 
                label="Progress"
              >
                {PROGRESS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" color={option === 'Done' ? 'success.main' : 'error.main'}>
                        {option === 'Done' ? '✅' : '❌'}
                      </Typography>
                      {option}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* TO Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>TO</InputLabel>
              <Select 
                value={editData.to || ''} 
                onChange={(e) => handleInputChange('to', e.target.value)} 
                label="TO"
              >
                <MenuItem value="">Select TO</MenuItem>
                {uniqueTOs.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Category Field */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select 
                value={editData.category || ''} 
                onChange={(e) => handleInputChange('category', e.target.value)} 
                label="Category"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Detail Problem Field */}
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label="Detail Problem" 
              value={editData.detailProblem} 
              onChange={(e) => handleInputChange('detailProblem', e.target.value)} 
            />
          </Grid>

          {/* Plan Action Field */}
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label="Plan Action" 
              value={editData.planAction} 
              onChange={(e) => handleInputChange('planAction', e.target.value)} 
            />
          </Grid>

          {/* Need Support Field */}
          <Grid item xs={12}>
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              label="Need Support" 
              value={editData.needSupport} 
              onChange={(e) => handleInputChange('needSupport', e.target.value)} 
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
};
