import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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

const DetailField = ({ label, value, type = 'text' }: { label: string; value: any; type?: string }) => (
  <Grid item xs={12} md={6}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
        {label}
      </Typography>
      {type === 'chip' ? (
        <Chip 
          label={value || 'Not Set'} 
          color={value ? 'primary' : 'default'} 
          size="small" 
        />
      ) : type === 'longText' ? (
        <Typography variant="body2" sx={{ 
          backgroundColor: 'grey.50', 
          p: 1, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          wordBreak: 'break-word'
        }}>
          {value || 'Not Set'}
        </Typography>
      ) : (
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {value || 'Not Set'}
        </Typography>
      )}
    </Box>
  </Grid>
);

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
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Cell Down Detail - {data.siteId}
          </Typography>
          <Button
            startIcon={<CloseIcon />}
            onClick={onClose}
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
             <DialogContent dividers>
         <Grid container spacing={3}>
           {/* Basic Information - Kolom 1-8 */}
           <Grid item xs={12}>
             <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
               Basic Information
             </Typography>
             <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
               <Grid container spacing={2}>
                 <DetailField label="1. Week" value={data.week} />
                 <DetailField label="2. Regional" value={data.regional} />
                 <DetailField label="3. Site ID" value={data.siteId} />
                 <DetailField label="4. Alarm Source" value={data.alarmSource} />
                 <DetailField label="5. NOP" value={data.nop} />
                 <DetailField label="6. District Operation" value={data.districtOperation} />
                 <DetailField label="7. First Occurred On" value={data.firstOccurredOn} />
                 <DetailField label="8. AGING DOWN" value={data.agingDown} />
               </Grid>
             </Paper>
           </Grid>

           <Grid item xs={12}>
             <Divider />
           </Grid>

           {/* Additional Upload Columns - Kolom 9-18 */}
           <Grid item xs={12}>
             <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
               Additional Information
             </Typography>
             <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
               <Grid container spacing={2}>
                 <DetailField label="9. RANGE AGING DOWN" value={data.rangeAgingDown} />
                 <DetailField label="10. Ticket ID" value={data.ticketId} />
                 <DetailField label="11. Alarm Name" value={data.alarmName} />
                 <DetailField label="12. SITE CLASS" value={data.siteClass} />
                 <DetailField label="13. Sub Domain" value={data.subDomain} />
                 <DetailField label="14. Alarm Severity" value={data.alarmSeverity} type="chip" />
                 <DetailField label="15. Alarm Location Info" value={data.alarmLocationInfo} type="longText" />
                 <DetailField label="16. remark_redsector" value={data.remarkRedsector} />
                 <DetailField label="17. Remark Site" value={data.remarkSite} />
                 <DetailField label="18. Cell Down Name" value={data.cellDownName} />
               </Grid>
             </Paper>
           </Grid>

           <Grid item xs={12}>
             <Divider />
           </Grid>

           {/* Editable Columns - Kolom 19-26 */}
           <Grid item xs={12}>
             <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
               Analysis & Action (Editable)
             </Typography>
             <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
               <Grid container spacing={2}>
                 <DetailField label="19. Root Cause" value={data.rootCause} />
                 <DetailField label="20. Detail Problem" value={data.detailProblem} type="longText" />
                 <DetailField label="21. Plan Action" value={data.planAction} type="longText" />
                 <DetailField label="22. Need Support" value={data.needSupport} type="longText" />
                 <DetailField label="23. PIC Dept" value={data.picDept} />
                 <DetailField label="24. Progress" value={data.progress} type="chip" />
                 <DetailField label="25. Closed Date" value={data.closedDate} />
                 <DetailField label="26. Status" value={data.status} type="chip" />
               </Grid>
             </Paper>
           </Grid>

           <Grid item xs={12}>
             <Divider />
           </Grid>

           {/* System Information - Kolom 27-28 */}
           <Grid item xs={12}>
             <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
               System Information
             </Typography>
             <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
               <Grid container spacing={2}>
                 <DetailField label="27. Created At" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Not Set'} />
                 <DetailField label="28. Updated At" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not Set'} />
                 <DetailField label="Document ID" value={data.id} />
               </Grid>
             </Paper>
           </Grid>
         </Grid>
       </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
