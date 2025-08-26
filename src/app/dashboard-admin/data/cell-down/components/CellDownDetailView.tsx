import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box
} from '@mui/material';

interface CellDownData {
  id?: string;
  week: number;
  regional: string;
  siteId: string;
  alarmSource: string;
  nop: string;
  districtOperation: string;
  firstOccurredOn: string;
  agingDown: number;
  rangeAgingDown: string;
  ticketId: string;
  alarmName: string;
  siteClass: string;
  subDomain: string;
  alarmSeverity: string;
  alarmLocationInfo: string;
  remarkRedsector: string;
  remarkSite: string;
  cellDownName: string;
  rootCause: string;
  detailProblem: string;
  planAction: string;
  needSupport: string;
  picDept: string;
  progress: string;
  closedDate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CellDownDetailViewProps {
  open: boolean;
  onClose: () => void;
  data: CellDownData | null;
}



export default function CellDownDetailView({ open, onClose, data }: CellDownDetailViewProps) {
  if (!data) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Detail Data
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Category
              </Typography>
              <Typography variant="body1">
                {data.siteClass || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Site ID
              </Typography>
              <Typography variant="body1">
                {data.siteId || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Site Name
              </Typography>
              <Typography variant="body1">
                {data.cellDownName || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Site Class
              </Typography>
              <Typography variant="body1">
                {data.siteClass || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                NOP
              </Typography>
              <Typography variant="body1">
                {data.nop || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Source Power
              </Typography>
              <Typography variant="body1">
                {data.alarmSource || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Root Cause
              </Typography>
              <Typography variant="body1">
                {data.rootCause || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Detail Problem
              </Typography>
              <Typography variant="body1">
                {data.detailProblem || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Plan Action
              </Typography>
              <Typography variant="body1">
                {data.planAction || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Need Support
              </Typography>
              <Typography variant="body1">
                {data.needSupport || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                PIC Dept
              </Typography>
              <Typography variant="body1">
                {data.picDept || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Progress
              </Typography>
              <Typography variant="body1">
                {data.progress || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Status
              </Typography>
              <Typography variant="body1">
                {data.status || ''}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'textSecondary' }} gutterBottom>
                Remark
              </Typography>
              <Typography variant="body1">
                {data.remarkSite || ''}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={onClose} 
          variant="contained"
          sx={{ 
            backgroundColor: '#1976d2', 
            color: 'white',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
