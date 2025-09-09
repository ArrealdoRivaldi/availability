'use client';

import React from 'react';
import { Chart } from 'react-google-charts';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface CellDownData {
  id: string;
  week?: string;
  progress?: string;
  status?: string;
  rootCause?: string;
  picDept?: string;
  siteClass?: string;
  nop?: string;
  agingDown?: number;
  createdAt?: any;
}

interface TrendCellDownKalimantanChartProps {
  data: CellDownData[];
}

const TrendCellDownKalimantanChart: React.FC<TrendCellDownKalimantanChartProps> = ({ data }) => {
  // Process data for the chart - this should show ALL weeks regardless of filters
  const processChartData = () => {
    if (!data || data.length === 0) {
      return [['Week', 'Total', 'Close', 'Progress'], ['No Data', 0, 0, 0]];
    }

    // Group data by week
    const weeklyData = data.reduce((acc, item) => {
      if (!item.week || typeof item.week !== 'string') return acc;
      
      const week = item.week.trim();
      if (!week) return acc;
      
      if (!acc[week]) {
        acc[week] = { total: 0, close: 0 };
      }
      
      acc[week].total++;
      if (item.status && typeof item.status === 'string' && item.status.toLowerCase() === 'close') {
        acc[week].close++;
      }
      
      return acc;
    }, {} as Record<string, { total: number; close: number }>);

    // Convert to chart data format
    const chartData = [
      ['Week', 'Total', 'Close', 'Progress'],
      ...Object.entries(weeklyData)
        .sort(([a], [b]) => {
          // Sort by week number, handling both "W1", "W2" format and numeric format
          const aNum = a.startsWith('W') ? parseInt(a.substring(1)) : parseInt(a);
          const bNum = b.startsWith('W') ? parseInt(b.substring(1)) : parseInt(b);
          return aNum - bNum;
        })
        .map(([week, counts]) => {
          const progress = counts.total > 0 ? (counts.close / counts.total) * 100 : 0;
          return [week, counts.total, counts.close, progress];
        })
    ];

    return chartData;
  };

  const chartData = processChartData();

  // Debug logging
  console.log('TrendCellDownKalimantanChart - Raw data:', data);
  console.log('TrendCellDownKalimantanChart - Processed chart data:', chartData);

  return (
    <Card sx={{ 
      borderRadius: 2, 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      height: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 600, 
            color: '#1a1a1a',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Trend Cell Down Kalimantan
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Menampilkan data seluruh week tanpa terpengaruh filter
          </Typography>
        </Box>
        
        <Chart
          chartType="ColumnChart"
          width="100%"
          height="400px"
          data={chartData}
          options={{
            title: '',
            chartArea: { 
              width: '75%', 
              height: '75%',
              left: 60,
              top: 20,
              right: 20,
              bottom: 60
            },
            hAxis: { 
              title: 'Week', 
              titleTextStyle: { 
                fontSize: 14, 
                color: '#333',
                bold: true
              },
              textStyle: { 
                fontSize: 12, 
                color: '#666' 
              },
              gridlines: { color: '#f0f0f0' }
            },
            vAxis: { 
              title: 'Count', 
              titleTextStyle: { 
                fontSize: 14, 
                color: '#333',
                bold: true
              },
              textStyle: { 
                fontSize: 12, 
                color: '#666' 
              },
              gridlines: { color: '#f0f0f0' },
              minValue: 0
            },
            seriesType: 'bars',
            series: { 
              0: { type: 'bars', color: '#1976d2' }, // Blue for Total
              1: { type: 'bars', color: '#ff9800' }, // Orange for Close
              2: { type: 'bars', color: '#4caf50' }  // Green for Progress
            },
            colors: ['#1976d2', '#ff9800', '#4caf50'],
            legend: { 
              position: 'top',
              textStyle: { 
                fontSize: 13, 
                color: '#333',
                bold: true
              },
              alignment: 'center'
            },
            fontSize: 12,
            backgroundColor: 'transparent',
            bar: { 
              groupWidth: '60%',
              gapWidth: 0.2
            },
            tooltip: {
              textStyle: { fontSize: 12 },
              trigger: 'selection'
            },
            animation: {
              startup: true,
              duration: 1000,
              easing: 'out'
            }
          }}
        />
        
        {/* Legend Explanation */}
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            Keterangan:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: 1 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Total:</strong> Total Data pada week tersebut
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Close:</strong> Total Data dengan status Close
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>Progress:</strong> Persentase Close/Total
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TrendCellDownKalimantanChart;
