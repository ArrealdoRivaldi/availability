import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Grid, Paper, List, ListItem, ListItemText, ListItemIcon, Alert } from '@mui/material';
import { Download as DownloadIcon, Info as InfoIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import * as XLSX from 'exceljs';

export default function ExcelTemplate() {
  const [open, setOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>('');

  // Check user role on component mount
  React.useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role || '');
  }, []);

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  const downloadTemplate = async () => {
    // All roles can download template
    try {
      // Create workbook and worksheet
      const workbook = new XLSX.Workbook();
      const worksheet = workbook.addWorksheet('Template');

      // Define headers with descriptions
      const headers = [
        'Week',
        'Regional',
        'Site ID',
        'Alarm Source',
        'NOP',
        'District Operation',
        'First Occurred On',
        'AGING DOWN',
        'RANGE AGING DOWN',
        'Ticket ID',
        'Alarm Name',
        'SITE CLASS',
        'Sub Domain',
        'Alarm Severity',
        'Alarm Location Info',
        'remark_redsector',
        'Remark Site',
        'Cell Down Name'
      ];

      // Add headers
      worksheet.addRow(headers);

      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }
      };

      // Add sample data row
      const sampleData = [
        34,
        'REGIONAL8',
        'BPP011',
        'E_BPP011M41_KEMENDUR',
        'NOP BALIKPAPAN',
        'TO BALIKPAPAN',
        '18/08/2025 00:11',
        88,
        '8-30 Days',
        'EM-20250818-00000297',
        'CELL LOGICAL CHANNEL AVAILABILITY SUPERVISION',
        'BRONZE',
        '4G',
        'Critical',
        'OFFICEID:304007;OFFICENAME:KSN007_MENDAWAI;OBJECTTYPE:CELL;OBJECTID:24;OBJECTNAME:KSN007ME1_MENDAWAI_ME02;BOARDTYPE:#Remark:G BSCId: 317; U RNCId: 767; Cell type: normal cell,70001000,Cell ID: 24.LTE eNBId:304007.Location: rack=1,shelf=1,board=1.#AID:1749073232Aid:1749073232@Restype:LTE-TDD@Position:ENBCUCPFunction=510-10_304007,CULTE=1,CUEUtranCellTDDLTE=24@Umeid:umeidDC=www.zte.com.cn,SubNetwork=ZTE_UTRAN_SYSTEM,SubNetwork=2108,ManagedElement=ITBBU_304007,ENBCUCPFunction=510-10_304007,CULTE=1,CUEUtranCell',
        '3. Green Sector',
        'Belum Perpanjangan',
        'COH709MR1_COMBATPANTAIMANGGARMR02'
      ];

      worksheet.addRow(sampleData);

      // Style sample data row
      const sampleRow = worksheet.getRow(2);
      sampleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };

      // Add instructions worksheet
      const instructionsSheet = workbook.addWorksheet('Instructions');
      
      const instructions = [
        ['Column', 'Description', 'Format', 'Example', 'Required'],
        ['Week', 'Week number of the year', 'Number', '34', 'Yes'],
        ['Regional', 'Regional identifier', 'Text', 'REGIONAL8', 'Yes'],
        ['Site ID', 'Unique site identifier', 'Text', 'BPP011', 'Yes'],
        ['Alarm Source', 'Source of the alarm', 'Text', 'E_BPP011M41_KEMENDUR', 'Yes'],
        ['NOP', 'Network Operation Center', 'Text', 'NOP BALIKPAPAN', 'Yes'],
        ['District Operation', 'District operation center', 'Text', 'TO BALIKPAPAN', 'Yes'],
        ['First Occurred On', 'When the issue first occurred', 'Date/Time', '18/08/2025 00:11', 'Yes'],
        ['AGING DOWN', 'Aging down value', 'Number', '88', 'Yes'],
        ['RANGE AGING DOWN', 'Range of aging down', 'Text', '8-30 Days', 'Yes'],
        ['Ticket ID', 'Support ticket identifier', 'Text', 'EM-20250818-00000297', 'Yes'],
        ['Alarm Name', 'Name of the alarm', 'Text', 'CELL LOGICAL CHANNEL AVAILABILITY SUPERVISION', 'Yes'],
        ['SITE CLASS', 'Classification of the site', 'Text', 'BRONZE', 'Yes'],
        ['Sub Domain', 'Sub domain information', 'Text', '4G', 'Yes'],
        ['Alarm Severity', 'Severity level of alarm', 'Text', 'Critical', 'Yes'],
        ['Alarm Location Info', 'Detailed location information', 'Text', 'Long text...', 'Yes'],
        ['remark_redsector', 'Red sector remarks', 'Text', '3. Green Sector', 'Yes'],
        ['Remark Site', 'Site-specific remarks', 'Text', 'Belum Perpanjangan', 'Yes'],
        ['Cell Down Name', 'Name of the cell down', 'Text', 'COH709MR1_COMBATPANTAIMANGGARMR02', 'Yes']
      ];

      instructions.forEach((row, index) => {
        const excelRow = instructionsSheet.addRow(row);
        if (index === 0) {
          excelRow.font = { bold: true };
          excelRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1976D2' }
          };
          excelRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        }
      });

      // Auto-fit columns for both sheets
      [worksheet, instructionsSheet].forEach(sheet => {
        sheet.columns.forEach(column => {
          if (column.values) {
            let maxLength = 0;
            column.values.forEach((value: any) => {
              if (value && value.toString().length > maxLength) {
                maxLength = value.toString().length;
              }
            });
            column.width = Math.min(maxLength + 2, 50);
          }
        });
      });

      // Save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cell_down_data_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template. Please try again.');
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => setOpen(true)}
        color="secondary"
        title="Download Excel Template"
      >
        Download Template
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Excel Template for Cell Down Data</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              Download this Excel template to understand the required format for uploading cell down data.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Template Features
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="18 columns with proper headers" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Sample data row for reference" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Instructions worksheet with details" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Formatted headers and styling" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, backgroundColor: 'info.50' }}>
                <Typography variant="h6" gutterBottom color="info">
                  Upload Requirements
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary="First row must contain headers" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary="Data starts from second row" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary="All 18 columns are required" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary="Supported formats: .xlsx, .xls" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: 'warning.50' }}>
                <Typography variant="h6" gutterBottom color="warning.main">
                  Important Notes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • The template includes sample data that should be replaced with your actual data
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Date format should be DD/MM/YYYY HH:mm for "First Occurred On" column
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Numbers should be entered as numbers, not text
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • Text fields can contain any characters including special characters
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button 
            onClick={downloadTemplate} 
            variant="contained" 
            color="secondary"
            startIcon={<DownloadIcon />}
          >
            Download Template
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
