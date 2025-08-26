import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Box, Chip, Alert } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'exceljs';

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

interface ExportToExcelProps {
  data: CellDownData[];
  onExport: () => void;
}

export default function ExportToExcel({ data, onExport }: ExportToExcelProps) {
  const [open, setOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<'all' | 'open' | 'closed'>('all');
  const [exporting, setExporting] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>('');

  // Check user role on component mount
  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  const handleExport = async () => {
    // All roles can export data
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    setExporting(true);
    try {
      // Filter data based on export format
      let filteredData = data;
      if (exportFormat === 'open') {
        filteredData = data.filter(item => item.status === 'open');
      } else if (exportFormat === 'closed') {
        filteredData = data.filter(item => item.status === 'close');
      }

      // Create workbook and worksheet
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Cell Down Data');

             // Define headers (8 upload columns + 7 editable columns + 2 system columns)
       const headers = [
         'Week',
         'Site ID',
         'NOP',
         'AGING DOWN',
         'RANGE AGING DOWN',
         'SITE CLASS',
         'Sub Domain',
         'Cell Down Name',
         'Root Cause',
         'Detail Problem',
         'Plan Action',
         'Need Support',
         'PIC Dept',
         'Progress',
         'Closed Date',
         'Status',
         'Created At',
         'Updated At'
       ];

      // Add headers
      worksheet.addRow(headers);

      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

             // Add data rows
       filteredData.forEach(item => {
         worksheet.addRow([
           item.week,
           item.siteId,
           item.nop,
           item.agingDown,
           item.rangeAgingDown,
           item.siteClass,
           item.subDomain,
           item.cellDownName,
           item.rootCause,
           item.detailProblem,
           item.planAction,
           item.needSupport,
           item.picDept,
           item.progress,
           item.closedDate,
           item.status,
           item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
           item.updatedAt ? new Date(item.updatedAt).toLocaleString() : ''
         ]);
       });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.values) {
          let maxLength = 0;
          column.values.forEach((value: any) => {
            if (value && value.toString().length > maxLength) {
              maxLength = value.toString().length;
            }
          });
          column.width = Math.min(maxLength + 2, 50); // Max width 50
        }
      });

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `cell_down_data_${exportFormat}_${timestamp}.xlsx`;

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      setOpen(false);
      onExport();
      alert(`Successfully exported ${filteredData.length} records to ${filename}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getExportCount = () => {
    if (exportFormat === 'all') return data.length;
    if (exportFormat === 'open') return data.filter(item => item.status === 'open').length;
    if (exportFormat === 'closed') return data.filter(item => item.status === 'close').length;
    return 0;
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => setOpen(true)}
        disabled={data.length === 0}
        title="Export data to Excel"
      >
        Export Data
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Cell Down Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Total records available: {data.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Records to export: {getExportCount()}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'all' | 'open' | 'closed')}
                  label="Export Format"
                >
                  <MenuItem value="all">All Records ({data.length})</MenuItem>
                  <MenuItem value="open">Open Records Only ({data.filter(item => item.status === 'open').length})</MenuItem>
                  <MenuItem value="closed">Closed Records Only ({data.filter(item => item.status === 'close').length})</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Export will include:</strong>
                </Typography>
                                 <Typography variant="body2" color="textSecondary">
                   • All 17 columns (8 upload + 7 editable + 2 system)
                 </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Formatted headers with proper column names
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Auto-sized columns for better readability
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Timestamp in filename for version control
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExport} 
            variant="contained" 
            disabled={exporting || getExportCount() === 0}
            startIcon={<DownloadIcon />}
          >
            {exporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
