import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
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

const DetailRow = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ 
    display: 'flex', 
    borderBottom: '1px solid #e0e0e0',
    py: 1.5,
    '&:last-child': { borderBottom: 'none' }
  }}>
    <Box sx={{ 
      width: '40%', 
      fontWeight: 600, 
      color: '#333',
      pr: 2
    }}>
      {label}
    </Box>
    <Box sx={{ 
      width: '60%', 
      color: '#666',
      wordBreak: 'break-word'
    }}>
      {value || ''}
    </Box>
  </Box>
);

  export default function CellDownDetailView({ open, onClose, data }: CellDownDetailViewProps) {
  if (!data) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          maxHeight: '90vh',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
          Detail Data
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ backgroundColor: 'white' }}>
          {/* Only show the columns that are present in the table */}
          <DetailRow label="Week" value={data.week} />
          <DetailRow label="Site ID" value={data.siteId} />
          <DetailRow label="Cell Down Name" value={data.cellDownName} />
          <DetailRow label="NOP" value={data.nop} />
          <DetailRow label="AGING DOWN" value={data.agingDown} />
          <DetailRow label="RANGE AGING DOWN" value={data.rangeAgingDown} />
          <DetailRow label="SITE CLASS" value={data.siteClass} />
          <DetailRow label="Sub Domain" value={data.subDomain} />
          <DetailRow label="Root Cause" value={data.rootCause} />
          <DetailRow label="Detail Problem" value={data.detailProblem} />
          <DetailRow label="Plan Action" value={data.planAction} />
          <DetailRow label="Need Support" value={data.needSupport} />
          <DetailRow label="PIC Dept" value={data.picDept} />
          <DetailRow label="Progress" value={data.progress} />
          <DetailRow label="Closed Date" value={data.closedDate} />
          <DetailRow label="Status" value={data.status} />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa'
      }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
        >
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}
