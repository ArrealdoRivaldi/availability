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
            icon={<CloseIcon />}
            onClick={onClose}
            size="small"
          >
            Close
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Basic Information
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                <DetailField label="Week" value={data.week} />
                <DetailField label="Regional" value={data.regional} />
                <DetailField label="Site ID" value={data.siteId} />
                <DetailField label="Site Class" value={data.siteClass} />
                <DetailField label="Sub Domain" value={data.subDomain} />
                <DetailField label="NOP" value={data.nop} />
                <DetailField label="District Operation" value={data.districtOperation} />
                <DetailField label="Cell Down Name" value={data.cellDownName} />
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Alarm Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Alarm Information
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                <DetailField label="Alarm Source" value={data.alarmSource} />
                <DetailField label="Alarm Name" value={data.alarmName} />
                <DetailField label="Alarm Severity" value={data.alarmSeverity} type="chip" />
                <DetailField label="First Occurred On" value={data.firstOccurredOn} />
                <DetailField label="Aging Down" value={data.agingDown} />
                <DetailField label="Range Aging Down" value={data.rangeAgingDown} />
                <DetailField label="Ticket ID" value={data.ticketId} />
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Location & Remarks */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Location & Remarks
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                <DetailField label="Remark Red Sector" value={data.remarkRedsector} />
                <DetailField label="Remark Site" value={data.remarkSite} />
                <Grid item xs={12}>
                  <DetailField label="Alarm Location Info" value={data.alarmLocationInfo} type="longText" />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Analysis & Action */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              Analysis & Action
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                <DetailField label="Root Cause" value={data.rootCause} />
                <DetailField label="PIC Department" value={data.picDept} />
                <DetailField label="Progress" value={data.progress} type="chip" />
                <DetailField label="Status" value={data.status} type="chip" />
                <DetailField label="Closed Date" value={data.closedDate} />
                <Grid item xs={12}>
                  <DetailField label="Detail Problem" value={data.detailProblem} type="longText" />
                </Grid>
                <Grid item xs={12}>
                  <DetailField label="Plan Action" value={data.planAction} type="longText" />
                </Grid>
                <Grid item xs={12}>
                  <DetailField label="Need Support" value={data.needSupport} type="longText" />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* System Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
              System Information
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Grid container spacing={2}>
                <DetailField label="Created At" value={data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Not Set'} />
                <DetailField label="Updated At" value={data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not Set'} />
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
