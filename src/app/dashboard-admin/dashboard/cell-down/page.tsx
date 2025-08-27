'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Chart } from 'react-google-charts';
import { CellDownData, mapFirestoreData, extractWeekFromTimestamp } from '../../../../utils/cellDownDataMapper';

export default function CellDownDashboardPage() {
  const [cellDownData, setCellDownData] = useState<CellDownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCellDownData();
  }, []);

  const fetchCellDownData = async () => {
    try {
      console.log('Fetching cell down data...');
      const q = query(collection(db, 'data_celldown'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const data: CellDownData[] = [];
      
      console.log(`Found ${querySnapshot.size} documents`);
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        console.log('Document data:', docData);
        const mappedData = mapFirestoreData(docData, doc.id);
        
        // Extract week from createdAt timestamp if not already present
        if (!mappedData.week && mappedData.createdAt) {
          mappedData.week = extractWeekFromTimestamp(mappedData.createdAt);
        }
        
        data.push(mappedData);
      });
      
      console.log('Processed data:', data);
      setCellDownData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts and tables
  const processData = () => {
    if (!cellDownData.length) return {};

    // Group by week
    const weeklyData = cellDownData.reduce((acc, item) => {
      if (!item.week) return acc;
      if (!acc[item.week]) {
        acc[item.week] = { total: 0, progress: 0, status: 0 };
      }
      acc[item.week].total++;
      if (item.progress?.toLowerCase() === 'done') acc[item.week].progress++;
      if (item.status?.toLowerCase() === 'close') acc[item.week].status++;
      return acc;
    }, {} as Record<string, { total: number; progress: number; status: number }>);

    // Root cause data
    const rootCauseData = cellDownData.reduce((acc, item) => {
      if (item.rootCause && item.rootCause.trim()) {
        acc[item.rootCause] = (acc[item.rootCause] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // PIC Dept data
    const picDeptData = cellDownData.reduce((acc, item) => {
      if (item.picDept && item.picDept.trim()) {
        acc[item.picDept] = (acc[item.picDept] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Site Class data
    const siteClassData = cellDownData.reduce((acc, item) => {
      if (item.siteClass && item.siteClass.trim()) {
        acc[item.siteClass] = (acc[item.siteClass] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // NOP data
    const nopData = cellDownData.reduce((acc, item) => {
      if (item.nop && item.nop.trim()) {
        if (!acc[item.nop]) {
          acc[item.nop] = { total: 0, progress: 0, status: 0 };
        }
        acc[item.nop].total++;
        if (item.progress?.toLowerCase() === 'done') acc[item.nop].progress++;
        if (item.status?.toLowerCase() === 'close') acc[item.nop].status++;
      }
      return acc;
    }, {} as Record<string, { total: number; progress: number; status: number }>);

    // Aging data
    const agingData = cellDownData.reduce((acc, item) => {
      if (item.nop && item.nop.trim() && item.agingDown !== undefined) {
        if (!acc[item.nop]) {
          acc[item.nop] = { '8-30': 0, '30-60': 0, '>60': 0 };
        }
        if (item.agingDown >= 8 && item.agingDown <= 30) {
          acc[item.nop]['8-30']++;
        } else if (item.agingDown > 30 && item.agingDown <= 60) {
          acc[item.nop]['30-60']++;
        } else if (item.agingDown > 60) {
          acc[item.nop]['>60']++;
        }
      }
      return acc;
    }, {} as Record<string, { '8-30': number; '30-60': number; '>60': number }>);

    return {
      weeklyData,
      rootCauseData,
      picDeptData,
      siteClassData,
      nopData,
      agingData
    };
  };

  const data = processData();

        if (loading) {
          return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography>Loading dashboard...</Typography>
            </Box>
          );
        }

        if (!cellDownData.length) {
          return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <Typography>No data available. Please check your Firestore collection.</Typography>
            </Box>
          );
        }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Cell Down Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchCellDownData} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Filter */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">Filter: Week/NOP</Typography>
          </Paper>
        </Grid>

        {/* Trend Cell Down Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Trend Cell Down</Typography>
              <Chart
                chartType="ColumnChart"
                width="100%"
                height="300px"
                data={
                  Object.keys(data.weeklyData || {}).length > 0 
                    ? [
                        ['Week', 'Cell Down', 'Progress', 'Status'],
                        ...Object.entries(data.weeklyData || {}).map(([week, counts]) => [
                          week,
                          counts.total,
                          counts.progress,
                          counts.status
                        ])
                      ]
                    : [['Week', 'Cell Down', 'Progress', 'Status'], ['No Data', 0, 0, 0]]
                }
                options={{
                  title: 'Weekly Trend',
                  chartArea: { width: '60%', height: '70%' },
                  hAxis: { title: 'Week', titleTextStyle: { fontSize: 14 } },
                  vAxis: { title: 'Count', titleTextStyle: { fontSize: 14 } },
                  seriesType: 'bars',
                  series: { 1: { type: 'bars' }, 2: { type: 'bars' } },
                  colors: ['#1976d2', '#ff9800', '#4caf50'],
                  legend: { position: 'top' },
                  fontSize: 12,
                  backgroundColor: 'transparent'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Root Cause Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Root Cause</Typography>
              <Chart
                chartType="BarChart"
                width="100%"
                height="300px"
                data={
                  Object.keys(data.rootCauseData || {}).length > 0
                    ? [
                        ['Root Cause', 'Count'],
                        ...Object.entries(data.rootCauseData || {}).map(([cause, count]) => [
                          cause,
                          count
                        ])
                      ]
                    : [['Root Cause', 'Count'], ['No Data', 0]]
                }
                options={{
                  title: 'Root Cause Distribution',
                  chartArea: { width: '60%', height: '70%' },
                  hAxis: { title: 'Count', titleTextStyle: { fontSize: 14 } },
                  vAxis: { title: 'Root Cause', titleTextStyle: { fontSize: 14 } },
                  colors: ['#1976d2'],
                  legend: { position: 'top' },
                  fontSize: 12,
                  backgroundColor: 'transparent'
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* PIC Dept and Site Class Tables */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>PIC Dept</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PIC Dept</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.picDeptData || {}).map(([pic, count]) => (
                      <TableRow key={pic}>
                        <TableCell>{pic || '(blank)'}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Grand Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.picDeptData || {}).reduce((a, b) => a + b, 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Site Class</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Site Class</TableCell>
                      <TableCell align="right">Count</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.siteClassData || {}).map(([siteClass, count]) => (
                      <TableRow key={siteClass}>
                        <TableCell>{siteClass}</TableCell>
                        <TableCell align="right">{count}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Grand Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.siteClassData || {}).reduce((a, b) => a + b, 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cell Down Progress by ENOM Closed Alarm */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Cell Down Progress by ENOM Closed Alarm</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>NOP</TableCell>
                      <TableCell align="right">Cell Down</TableCell>
                      <TableCell align="right">Progress</TableCell>
                      <TableCell align="right">ENOM Closed Alarm</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.nopData || {}).map(([nop, counts]) => {
                      const percentage = counts.total > 0 ? ((counts.status / counts.total) * 100).toFixed(2) : '0.00';
                      return (
                        <TableRow key={nop}>
                          <TableCell>{nop}</TableCell>
                          <TableCell align="right">{counts.total}</TableCell>
                          <TableCell align="right">{counts.progress}</TableCell>
                          <TableCell align="right">{counts.status}</TableCell>
                          <TableCell align="right">{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell><strong>Grand Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.nopData || {}).reduce((a, b) => a + b.progress, 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          {(() => {
                            const total = Object.values(data.nopData || {}).reduce((a, b) => a + b.total, 0);
                            const status = Object.values(data.nopData || {}).reduce((a, b) => a + b.status, 0);
                            return total > 0 ? ((status / total) * 100).toFixed(2) : '0.00';
                          })()}%
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Aging Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>NOP Aging</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>NOP</TableCell>
                      <TableCell align="right">8-30 Days</TableCell>
                      <TableCell align="right">30-60 Days</TableCell>
                      <TableCell align="right">&gt;60 Days</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(data.agingData || {}).map(([nop, aging]) => (
                      <TableRow key={nop}>
                        <TableCell>{nop}</TableCell>
                        <TableCell align="right">{aging['8-30']}</TableCell>
                        <TableCell align="right">{aging['30-60']}</TableCell>
                        <TableCell align="right">{aging['>60']}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell><strong>Grand Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.agingData || {}).reduce((a, b) => a + b['8-30'], 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.agingData || {}).reduce((a, b) => a + b['30-60'], 0)}</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{Object.values(data.agingData || {}).reduce((a, b) => a + b['>60'], 0)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
