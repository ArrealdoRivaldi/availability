'use client';

import React from 'react';
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

interface ChartData {
  week: string;
  total: number;
  close: number;
  progress: number;
}

interface CustomBarChartProps {
  data: (string | number | { role: string })[][];
}

const CustomBarChart: React.FC<CustomBarChartProps> = ({ data }) => {
  // Skip header row and process data, filtering out annotation objects
  const chartData: ChartData[] = data.slice(1).map((row) => ({
    week: row[0] as string,
    total: row[1] as number,
    close: row[3] as number,
    progress: row[5] as number
  }));

  const maxValue = Math.max(...chartData.map(d => Math.max(d.total, d.close, d.progress)));
  const chartHeight = 300;
  const chartWidth = 600;
  const barWidth = 40;
  const groupSpacing = 20;
  const weekSpacing = 80;

  return (
    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
      <svg width="100%" height={chartHeight + 100} viewBox={`0 0 ${chartWidth} ${chartHeight + 100}`}>
        {/* Grid lines */}
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, index) => (
          <g key={index}>
            <line
              x1={60}
              y1={chartHeight - (chartHeight * ratio) + 20}
              x2={chartWidth - 20}
              y2={chartHeight - (chartHeight * ratio) + 20}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
            <text
              x={50}
              y={chartHeight - (chartHeight * ratio) + 25}
              fontSize="12"
              fill="#666"
              textAnchor="end"
            >
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {chartData.map((weekData, weekIndex) => {
          const x = 80 + (weekIndex * weekSpacing);
          const totalHeight = (weekData.total / maxValue) * chartHeight;
          const closeHeight = (weekData.close / maxValue) * chartHeight;
          const progressHeight = (weekData.progress / maxValue) * chartHeight;

          return (
            <g key={weekData.week}>
              {/* Total bar (blue) */}
              <rect
                x={x}
                y={chartHeight - totalHeight + 20}
                width={barWidth}
                height={totalHeight}
                fill="#1976d2"
                rx={2}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - totalHeight + 15}
                fontSize="11"
                fontWeight="bold"
                fill="#333"
                textAnchor="middle"
              >
                {weekData.total}
              </text>

              {/* Close bar (orange) */}
              <rect
                x={x + barWidth + 5}
                y={chartHeight - closeHeight + 20}
                width={barWidth}
                height={closeHeight}
                fill="#ff9800"
                rx={2}
              />
              <text
                x={x + barWidth + 5 + barWidth / 2}
                y={chartHeight - closeHeight + 15}
                fontSize="11"
                fontWeight="bold"
                fill="#333"
                textAnchor="middle"
              >
                {weekData.close}
              </text>

              {/* Progress bar (green) */}
              <rect
                x={x + (barWidth + 5) * 2}
                y={chartHeight - progressHeight + 20}
                width={barWidth}
                height={progressHeight}
                fill="#4caf50"
                rx={2}
              />
              <text
                x={x + (barWidth + 5) * 2 + barWidth / 2}
                y={chartHeight - progressHeight + 15}
                fontSize="11"
                fontWeight="bold"
                fill="#333"
                textAnchor="middle"
              >
                {weekData.progress.toFixed(1)}%
              </text>

              {/* Week label */}
              <text
                x={x + (barWidth + 5) * 1.5}
                y={chartHeight + 40}
                fontSize="12"
                fontWeight="bold"
                fill="#333"
                textAnchor="middle"
              >
                {weekData.week}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={chartWidth / 2}
          y={chartHeight + 60}
          fontSize="14"
          fontWeight="bold"
          fill="#333"
          textAnchor="middle"
        >
          Week
        </text>
        <text
          x={20}
          y={chartHeight / 2 + 20}
          fontSize="14"
          fontWeight="bold"
          fill="#333"
          textAnchor="middle"
          transform={`rotate(-90, 20, ${chartHeight / 2 + 20})`}
        >
          Count
        </text>
      </svg>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: 1 }} />
          <Typography variant="body2" fontWeight="bold">Total</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#ff9800', borderRadius: 1 }} />
          <Typography variant="body2" fontWeight="bold">Close</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', borderRadius: 1 }} />
          <Typography variant="body2" fontWeight="bold">Progress</Typography>
        </Box>
      </Box>
    </Box>
  );
};

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
          <Box sx={{ width: '100%', height: 400, position: 'relative' }}>
            <CustomBarChart data={chartData} />
          </Box>
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
