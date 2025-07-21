'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, InputLabel, Paper, Grid, Button, CircularProgress } from '@mui/material';
import { Chart } from 'react-google-charts';
import { database } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Stepper, Step, StepLabel, StepIconProps } from '@mui/material';

const statusColors: Record<string, string> = {
  Open: '#1976d2',
  'Waiting approval': '#ff9800',
  Close: '#43a047',
  Rejected: '#e53935',
};

const progressColors: string[] = [
  '#1976d2', '#43a047', '#ff9800', '#e53935', '#8e24aa', '#00bcd4', '#fbc02d', '#6d4c41',
];

// 1. Add 'Waiting pada budget' to progress order and color
const PROGRESS_ORDER = [
  'Identification',
  'Plan Action',
  'Waiting Budget',
  'Have program',
  'Excution',
  'Done',
];
const progressSoftColors = [
  '#42a5f5', // Identification - blue
  '#66bb6a', // Plan Action - green
  '#bdb76b', // Waiting Budget - khaki
  '#ffa726', // Have program - orange
  '#ef5350', // Excution - red
  '#8e24aa', // Done - purple
];

const Dashboard = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    nop: '',
    status: '',
    pic: '',
  });

  useEffect(() => {
    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
        setRows(arr);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filtered data
  const filteredRows: any[] = rows.filter((row: any) =>
    (!filter.nop || row['NOP'] === filter.nop) &&
    (!filter.status || row['Status'] === filter.status) &&
    (!filter.pic || row['PIC Dept'] === filter.pic)
  );

  // Stepper config sesuai permintaan
  const STEPPER_STEPS = [
    { value: 'Identification', label: 'Identification', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Identification').length },
    { value: 'Plan Action', label: 'Plan Action', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Plan Action').length },
    { value: 'Assessment', label: 'Assessment TSel', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Assessment').length },
    { value: 'Justification', label: 'Justification', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Justification').length },
    { value: 'Waiting Budget', label: 'Waiting Budget', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Waiting Budget').length },
    { value: 'Waiting PO', label: 'Waiting PO', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Waiting PO').length },
    { value: 'Have Program', label: 'Have Program', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Have Program').length },
    { value: 'Execution', label: 'Execution', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Execution').length },
    // Step khusus: Done - Review by Tsel
    { value: 'Done - Review by Tsel', label: 'Done - Review by Tsel', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Done' && (row['Status'] || '') === 'Waiting approval').length },
    // Step khusus: Complete
    { value: 'Complete', label: 'Complete', count: (rows: any[]) => rows.filter((row: any) => (row['Progress'] || '') === 'Done' && (row['Status'] || '') === 'Close').length },
  ];
  const stepCounts: Record<string, number> = STEPPER_STEPS.reduce((acc: Record<string, number>, step) => {
    acc[step.value] = step.count(filteredRows);
    return acc;
  }, {});
  const totalStepCount = Object.values(stepCounts).reduce((sum, val) => sum + val, 0);
  function CustomStepIcon({ status }: { status: string }) {
    return <span style={{ fontSize: 22, color: statusColors[status] }}>{statusColors[status]}</span>;
  }

  // Tambahkan mapping icon untuk setiap step
  const stepIcons: Record<string, string> = {
    'Identification': '✔️',
    'Plan Action': '🔄',
    'Assessment TSel': '⏳',
    'Justification': '✔️',
    'Waiting Budget': '⏸️',
    'Waiting PO': '🔄',
    'Have Program': '🔄',
    'Execution': '✔️',
    'Done - Review by Tsel': '⏳',
    'Complete': '🏁',
  };

  // Pie chart data (status)
  const statusList = ['Open', 'Close', 'Waiting approval', 'Rejected'];
  const statusCounts: Record<string, number> = statusList.reduce((acc: Record<string, number>, status) => {
    acc[status] = filteredRows.filter(row => (row['Status'] || 'Open') === status).length;
    return acc;
  }, {});
  const pieChartData = [
    ['Status', 'Jumlah'],
    ...statusList.map(status => [status, statusCounts[status]])
  ];
  const pieChartColors = statusList.map((status, i) => statusColors[status] || progressColors[i % progressColors.length]);

  // Progress Flow Data (dynamic from database)
  // Use the order and label from PROGRESS_OPTIONS if available, otherwise use the order from the data
  const PROGRESS_OPTIONS = [
    { value: 'Identification', label: 'Identification (enom)' },
    { value: 'Plan Action', label: 'Plan Action (enom)' },
    { value: 'Assessment', label: 'Assessment (tsel power)' },
    { value: 'Justification', label: 'Justification (tsel power)' },
    { value: 'Waiting Budget', label: 'Waiting Budget (tsel nos)' },
    { value: 'Waiting PO', label: 'Waiting PO (tsel nos)' },
    { value: 'Have Program', label: 'Have Program (enom)' },
    { value: 'Execution', label: 'Execution (enom)' },
    { value: 'Done', label: 'Done (radio)' },
  ];
  const progressKeysInData = Array.from(new Set(rows.map(r => r['Progress']).filter(Boolean)));
  const progressFlowList = PROGRESS_OPTIONS.filter(opt => progressKeysInData.includes(opt.value));
  const progressCounts: Record<string, number> = progressFlowList.reduce((acc: Record<string, number>, step) => {
    acc[step.value] = rows.filter(row => (row['Progress'] || '') === step.value).length;
    return acc;
  }, {});
  const totalProgressCount = Object.values(progressCounts).reduce((sum, val) => sum + val, 0);

  // Status list untuk bar stack
  const statusListForStackedBar = ['Open', 'Waiting approval', 'Close', 'Rejected'];

  // Data untuk stacked bar: header + tiap progress
  const stackedBarData = [
    ['Progress', ...statusListForStackedBar],
    ...Object.keys(progressCounts).map(progress => {
      const rowsForProgress = rows.filter(r => (r['Progress'] || 'Unknown') === progress);
      return [
        progress,
        ...statusListForStackedBar.map(status =>
          rowsForProgress.filter(r => (r['Status'] || 'Open') === status).length
        ),
      ];
    }),
  ];
  const stackedBarColors = statusListForStackedBar.map((status, i) => statusColors[status] || progressColors[i % progressColors.length]);

  // Urutan progress yang diinginkan
  // Data dan warna untuk bar chart progress multi-warna
  const progressBarData = [
    ['Progress', 'Jumlah', { role: 'style' }, { role: 'annotation' }],
    ...PROGRESS_ORDER.map((progress, i) => [
      progress,
      Number(progressCounts[progress] || 0),
      progressSoftColors[i % progressSoftColors.length],
      `${progressCounts[progress] || 0} (${progressCounts[progress] ? Math.round(((Number(progressCounts[progress]) || 0) / Object.values(progressCounts).reduce((sum, val) => sum + val, 0)) * 100) : 0}%)`
    ]),
  ];
  const progressBarColor = ['#1976d2'];

  // Unique filter options
  const unique = (key: string) => Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));

  // Table helpers
  const getTableData = (groupKey: string, label: string) => {
    const groups = Array.from(new Set(rows.map(r => r[groupKey]).filter(Boolean)));
    const data = groups.map(g => {
      const groupRows = rows.filter(r => r[groupKey] === g);
      return {
        label: g,
        worst: groupRows.length,
        open: groupRows.filter(r => (r['Status'] || 'Open') === 'Open').length,
        close: groupRows.filter(r => r['Status'] === 'Close').length,
        ach: groupRows.length ? Math.round((groupRows.filter(r => r['Status'] === 'Close').length / groupRows.length) * 100) : 0,
      };
    });
    const total = {
      label: 'Grand Total',
      worst: data.reduce((a, b) => a + b.worst, 0),
      open: data.reduce((a, b) => a + b.open, 0),
      close: data.reduce((a, b) => a + b.close, 0),
      ach: data.reduce((a, b) => a + b.worst, 0) ? Math.round((data.reduce((a, b) => a + b.close, 0) / data.reduce((a, b) => a + b.worst, 0)) * 100) : 0,
    };
    return [...data, total];
  };

  // 2. Dept PIC table data with new columns
  const getDeptPicTableData = () => {
    const groups = Array.from(new Set(rows.map(r => r['PIC Dept']).filter(Boolean)));
    const data = groups.map(g => {
      const groupRows = rows.filter(r => r['PIC Dept'] === g);
      return {
        label: g,
        open: groupRows.filter(r => (r['Status'] || 'Open') === 'Open').length,
        waiting: groupRows.filter(r => r['Status'] === 'Waiting approval').length,
        rejected: groupRows.filter(r => r['Status'] === 'Rejected').length,
        close: groupRows.filter(r => r['Status'] === 'Close').length,
      };
    });
    const total = {
      label: 'Grand Total',
      open: data.reduce((a, b) => a + b.open, 0),
      waiting: data.reduce((a, b) => a + b.waiting, 0),
      rejected: data.reduce((a, b) => a + b.rejected, 0),
      close: data.reduce((a, b) => a + b.close, 0),
    };
    return [...data, total];
  };

  // Calculate total data and total data with progress
  const totalData = rows.length;
  const totalDataProgress = rows.filter((row: any) => row['Progress'] && row['Progress'].trim() !== '').length;

  // Mapping warna untuk setiap step
  const stepColors: Record<string, string> = {
    'Identification': '#1976d2',
    'Plan Action': '#388e3c',
    'Assessment TSel': '#fbc02d',
    'Justification': '#7b1fa2',
    'Waiting Budget': '#0288d1',
    'Waiting PO': '#0288d1',
    'Have Program': '#0097a7',
    'Execution': '#8e24aa',
    'Done - Review by Tsel': '#ff9800',
    'Complete': '#43a047',
  };

  return (
    <Box p={{ xs: 1, md: 3 }} sx={{ background: '#f7f8fa', minHeight: '100vh' }}>
      <Paper sx={{ p: { xs: 1, md: 3 }, mb: 4, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', background: '#fff' }} elevation={2}>
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>NOP</InputLabel>
                  <Select value={filter.nop} label="NOP" onChange={e => setFilter(f => ({ ...f, nop: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {unique('NOP').map(nop => <MenuItem key={nop} value={nop}>{nop}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={filter.status} label="Status" onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {unique('Status').map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>PIC Dept</InputLabel>
                  <Select value={filter.pic} label="PIC Dept" onChange={e => setFilter(f => ({ ...f, pic: e.target.value }))}>
                    <MenuItem value="">All</MenuItem>
                    {unique('PIC Dept').map(pic => <MenuItem key={pic} value={pic}>{pic}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={3} display="flex" justifyContent="flex-end" alignItems="center">
            <Button variant="outlined" fullWidth sx={{ minWidth: 120, height: 40 }} onClick={() => setFilter({ nop: '', status: '', pic: '' })}>Reset Filter</Button>
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          {/* Status Distribution */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 370, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fafdff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} align="center">Status Distribution</Typography>
              {loading ? <CircularProgress /> : (
                <Chart
                  chartType="PieChart"
                  data={pieChartData}
                  width={"100%"}
                  height={"260px"}
                  options={{
                    legend: { position: 'right', textStyle: { fontSize: 13 } },
                    pieHole: 0.4,
                    colors: pieChartColors,
                    chartArea: { width: '80%', height: '80%' },
                    fontName: 'inherit',
                    fontSize: 13,
                  }}
                />
              )}
            </Paper>
          </Grid>
          {/* Dept PIC Table */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff' }}>
              <Typography fontWeight={700} mb={1} fontSize={16}>Dept PIC</Typography>
              <DeptPicTable data={getDeptPicTableData()} loading={loading} />
            </Paper>
          </Grid>
          {/* Progress Flow */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, minWidth: 0, width: '100%', height: STEPPER_STEPS.length > 6 ? 60 * STEPPER_STEPS.length + 110 : 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fafdff', transition: 'box-shadow 0.2s', overflow: 'hidden', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2} align="center">Progress Stepper</Typography>
              <Typography variant="body2" color="text.secondary" mb={0.5} align="center">
                Total Data: <b>{totalData}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1} align="center">
                Total Data Progress: <b>{totalDataProgress}</b>
              </Typography>
              {loading ? <CircularProgress /> : (
                <Stepper orientation="vertical" alternativeLabel={false} activeStep={-1} connector={null} sx={{ width: '100%' }}>
                  {STEPPER_STEPS.map((step, idx) => {
                    const count = stepCounts[step.value] || 0;
                    const percent = totalStepCount > 0 ? Math.round((count / totalStepCount) * 100) : 0;
                    return (
                      <Step key={step.value} completed={false}>
                        <StepLabel
                          StepIconComponent={undefined}
                          sx={{
                            '.MuiStepLabel-label': { fontWeight: 600 },
                            '.MuiStepLabel-iconContainer': { pr: 1 },
                          }}
                        >
                          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                            <Box display="flex" alignItems="center" gap={1}>
                              <span style={{fontSize:20, color:stepColors[step.label]}}>{stepIcons[step.label] || '•'}</span>
                              <Typography fontWeight={600} style={{color:stepColors[step.label]}}>{step.label}</Typography>
                            </Box>
                            <Box minWidth={60} textAlign="right">
                              <Typography fontWeight={700} style={{color:stepColors[step.label]}}>{count} <span style={{ fontWeight: 400, color: '#888', fontSize: 13 }}>({percent}%)</span></Typography>
                            </Box>
                          </Box>
                        </StepLabel>
                      </Step>
                    );
                  })}
                </Stepper>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      {/* Static Tables Section: NOP and Root Cause in one row */}
      <Grid container spacing={3} mt={0.5}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, minHeight: 320, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
            <Typography fontWeight={700} mb={1} fontSize={16}>NOP</Typography>
            <TableStatic data={getTableData('NOP', 'NOP')} label="NOP" loading={loading} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, minHeight: 320, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', background: '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' } }}>
            <Typography fontWeight={700} mb={1} fontSize={16}>Root Cause</Typography>
            <TableStatic data={getTableData('Root Cause', 'Root Cause')} label="Root Cause" loading={loading} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Static Table Component
const TableStatic = ({ data, label, loading }: { data: any[], label: string, loading?: boolean }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
    <thead>
      <tr style={{ background: '#f5f7fa' }}>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>{label}</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Worst Site</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Open</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Close</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Ach (%)</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}><CircularProgress size={20} /></td></tr>
      ) : (
        data.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.label}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.worst}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.open}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.close}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.ach}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// Dept PIC Table Component
const DeptPicTable = ({ data, loading }: { data: any[], loading?: boolean }) => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
    <thead>
      <tr style={{ background: '#f5f7fa' }}>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Dept PIC</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Open</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Waiting approval</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Rejected</th>
        <th style={{ border: '1px solid #e0e0e0', padding: 6, fontWeight: 700 }}>Close</th>
      </tr>
    </thead>
    <tbody>
      {loading ? (
        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}><CircularProgress size={20} /></td></tr>
      ) : (
        data.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.label}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.open}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.waiting}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.rejected}</td>
            <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row.close}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

export default Dashboard; 