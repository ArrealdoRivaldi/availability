'use client';

import React from 'react';
import { Chart } from 'react-google-charts';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface CellDownData {
  id: string;
  week?: number | string;
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
    try {
      if (!data || data.length === 0) {
        return [['Week', 'Total', 'Close', 'Progress'], ['No Data', 0, 0, 0]];
      }

      // Group data by week
      const weeklyData = data.reduce((acc, item) => {
        if (!item || !item.week) return acc;
        
        // Convert week to string, handling both number and string types
        const week = typeof item.week === 'number' ? item.week.toString() : item.week.toString().trim();
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

      // Convert to chart data format with annotations
      const chartData = [
        ['Week', 'Total', { role: 'annotation' }, 'Close', { role: 'annotation' }, 'Progress', { role: 'annotation' }],
        ...Object.entries(weeklyData)
          .sort(([a], [b]) => {
            // Sort by week number, handling both "W1", "W2" format and numeric format
            const aNum = a.startsWith('W') ? parseInt(a.substring(1)) : parseInt(a);
            const bNum = b.startsWith('W') ? parseInt(b.substring(1)) : parseInt(b);
            return aNum - bNum;
          })
          .map(([week, counts]) => {
            const progress = counts.total > 0 ? (counts.close / counts.total) * 100 : 0;
            const totalValue = Number(counts.total);
            const closeValue = Number(counts.close);
            const progressValue = Number(Math.round(progress * 100) / 100);
            
            return [
              week, 
              totalValue,
              totalValue.toString(), // Annotation for Total
              closeValue,
              closeValue.toString(), // Annotation for Close
              progressValue,
              progressValue.toFixed(1) + '%' // Annotation for Progress with % sign
            ];
          })
      ];

      return chartData;
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [['Week', 'Total', 'Close', 'Progress'], ['Error', 0, 0, 0]];
    }
  };

  const chartData = processChartData();

  // Debug logging
  console.log('TrendCellDownKalimantanChart - Raw data:', data);
  console.log('TrendCellDownKalimantanChart - Processed chart data:', chartData);
  console.log('TrendCellDownKalimantanChart - Chart data types:', chartData.map((row, index) => 
    index === 0 ? 'header' : row.map(cell => typeof cell)
  ));

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
        </Box>
        
        {chartData && chartData.length > 1 ? (
          <Chart
            chartType="ColumnChart"
            width="100%"
            height="400px"
            data={chartData}
            options={{
              title: '',
              chartArea: { 
                width: '70%', 
                height: '75%'
              },
              hAxis: { 
                title: 'Week'
              },
              vAxis: { 
                title: 'Count',
                minValue: 0
              },
              colors: ['#1976d2', '#ff9800', '#4caf50'],
              legend: { 
                position: 'top'
              },
              backgroundColor: 'transparent',
              annotations: {
                textStyle: {
                  fontSize: 12,
                  bold: true,
                  color: '#333'
                }
              },
              enableInteractivity: true
            }}
          />
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 400,
            backgroundColor: '#f5f5f5',
            borderRadius: 1
          }}>
            <Typography variant="h6" color="text.secondary">
              {chartData && chartData.length === 1 ? 'No Data Available' : 'Loading Chart...'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendCellDownKalimantanChart;
