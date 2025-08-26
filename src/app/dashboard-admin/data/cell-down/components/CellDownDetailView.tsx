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
      maxWidth="xl" 
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
      
             <DialogContent dividers>
         <Grid container spacing={3}>
           {/* Basic Information - Kolom 1-8 */}
           <Grid item xs={12}>
             <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
               Basic Information
             </Typography>
             <Box sx={{ 
               border: '1px solid #e0e0e0', 
               borderRadius: 1, 
               backgroundColor: 'white',
               overflow: 'hidden'
             }}>
               <Grid container>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Category</Typography>
                     <Typography variant="body1">{data.siteClass || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Site ID</Typography>
                     <Typography variant="body1">{data.siteId || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Site Name</Typography>
                     <Typography variant="body1">{data.cellDownName || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Site Class</Typography>
                     <Typography variant="body1">{data.siteClass || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>NOP</Typography>
                     <Typography variant="body1">{data.nop || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Source Power</Typography>
                     <Typography variant="body1">{data.alarmSource || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Root Cause</Typography>
                     <Typography variant="body1">{data.rootCause || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Detail Problem</Typography>
                     <Typography variant="body1">{data.detailProblem || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Plan Action</Typography>
                     <Typography variant="body1">{data.planAction || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Need Support</Typography>
                     <Typography variant="body1">{data.needSupport || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>PIC Dept</Typography>
                     <Typography variant="body1">{data.picDept || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Progress</Typography>
                     <Typography variant="body1">{data.progress || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6} sx={{ borderRight: '1px solid #e0e0e0' }}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Status</Typography>
                     <Typography variant="body1">{data.status || ''}</Typography>
                   </Box>
                 </Grid>
                 <Grid item xs={12} md={6}>
                   <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                     <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Remark</Typography>
                     <Typography variant="body1">{data.remarkSite || ''}</Typography>
                   </Box>
                 </Grid>
               </Grid>
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
