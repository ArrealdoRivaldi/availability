'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, TableContainer, TablePagination, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { SuperAdminGuard } from '@/components/SuperAdminGuard';

const STATUS_OPTIONS = [
  { value: 'Close', label: 'Approve' },
  { value: 'Rejected', label: 'Rejected' },
];

// Helper untuk format tampilan tanggal (hanya tanggal saja)
function toDisplayDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Helper untuk truncate text dan show detail button
const TruncatedTextWithDetail = ({ text, fieldName, onShowDetail, row }: { text: string, fieldName: string, onShowDetail: (row: any, field: string) => void, row: any }) => {
  if (!text) return <span></span>;
  
  const str = String(text);
  if (str.length > 3) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ flex: 1 }}>{str.slice(0, 3)}...</span>
        <button 
          style={{
            color: '#1976d2',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 500,
            transition: 'all 0.2s',
            minWidth: 'auto'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#e3f2fd';
            e.currentTarget.style.color = '#1565c0';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#1976d2';
          }}
          onClick={e => {
            e.stopPropagation(); 
            onShowDetail(row, fieldName);
          }}
          title={`Lihat detail ${fieldName}`}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Detail
        </button>
      </span>
    );
  }
  
  return <span>{str}</span>;
};

const AvailabilityApprovalPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any | null>(null);
  const [detailField, setDetailField] = useState<string>('');
  const [remarkEdit, setRemarkEdit] = useState<{ [id: string]: string }>({});
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [filter, setFilter] = useState({
    category: '',
    siteId: '',
    siteClass: '',
    nop: '',
    status: '',
    search: '',
  });
  const [filterDraft, setFilterDraft] = useState({
    category: '',
    siteId: '',
    siteClass: '',
    nop: '',
    status: '',
    search: '',
  });
  const [filterLoading, setFilterLoading] = useState(false);

  // Debounce filter
  useEffect(() => {
    setFilterLoading(true);
    const t = setTimeout(() => {
      setFilter(filterDraft);
      setPage(0);
      setFilterLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [filterDraft]);

  useEffect(() => {
    if (!database) {
      setLoading(false);
      return;
    }
    
    const dbRef = ref(database);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.entries(data)
          .map(([id, value]: any) => ({ id, ...value }))
          .filter((row: any) => row.Status === 'Waiting approval');
        setRows(arr);
      } else {
        setRows([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Unique options for filter dropdowns
  const uniqueOptions = (key: string) => {
    const opts = Array.from(new Set(rows.map(r => r[key]).filter(Boolean)));
    return opts.sort();
  };

  // Filtered rows
  const filteredRows = rows.filter(row => {
    const match = (val: string, filterVal: string) => !filterVal || (val || '').toLowerCase().includes(filterVal.toLowerCase());
    const matchSearch = !filter.search || [
      row['Category'], row['Site ID'], row['Site Name'], row['Site Class'], row['NOP'], row['Source Power'], row['Root Cause'], row['Detail Problem'], row['Plan Action'], row['Need Support'], row['PIC Dept'], row['Progress'], row['Status'], row['Remark']
    ].some(val => (val || '').toString().toLowerCase().includes(filter.search.toLowerCase()));
    
    return (
      match(row['Category'], filter.category) &&
      match(row['Site ID'], filter.siteId) &&
      match(row['Site Class'], filter.siteClass) &&
      match(row['NOP'], filter.nop) &&
      matchSearch
    );
  });

  const handleStatusChange = (id: string, value: string) => {
    setStatusEdit(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async (row: any) => {
    const newStatus = statusEdit[row.id];
    const newRemark = remarkEdit[row.id] || '';
    if (!newStatus) return;
    if (!database) {
      console.error('Database not initialized');
      return;
    }
    setSaving(row.id);
    const updates: any = {
      Status: newStatus,
      Remark: newRemark,
    };
    if (newStatus === 'Rejected') {
      updates.Progress = 'Identification';
      updates['PIC Dept'] = 'ENOM';
    }
    await update(ref(database, row.id), updates);
    setSaving(null);
    setStatusEdit(prev => ({ ...prev, [row.id]: '' }));
    setRemarkEdit(prev => ({ ...prev, [row.id]: '' }));
  };

  // Show detail for specific field
  const handleShowFieldDetail = (row: any, fieldName: string) => {
    setShowDetail(row);
    setDetailField(fieldName);
  };

  // Show full row detail
  const handleShowRowDetail = (row: any) => {
    setShowDetail(row);
    setDetailField('');
  };

  // Daftar field detail
  const detailFields = [
    'Category', 'Site ID', 'Site Name', 'Site Class', 'NOP', 'Source Power', 'Progress', 'Root Cause', 'PIC Dept', 'Detail Problem', 'Plan Action', 'Need Support', 'Date Close', 'Status'
  ];

  return (
    <SuperAdminGuard>
      <Box p={{ xs: 1, md: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.2 }}>
            Availability Approval
          </Typography>
          <Chip
            icon={<NotificationsIcon />}
            label={`${filteredRows.length} data Availability menunggu approval`}
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Search & Filter Bar */}
        <Paper sx={{ mb: 2, p: { xs: 1, md: 2 }, borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} gap={2}>
            <TextField
              size="small"
              placeholder="Cari data... (semua kolom)"
              value={filterDraft.search}
              onChange={e => setFilterDraft(f => ({ ...f, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220, maxWidth: 320, background: '#fff', borderRadius: 2 }}
            />
            <Box display="flex" flexWrap="wrap" gap={1} alignItems="center" flex={1}>
              <TextField select size="small" label="Category" value={filterDraft.category} onChange={e => setFilterDraft(f => ({ ...f, category: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Category').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site ID" value={filterDraft.siteId} onChange={e => setFilterDraft(f => ({ ...f, siteId: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site ID').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Site Class" value={filterDraft.siteClass} onChange={e => setFilterDraft(f => ({ ...f, siteClass: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('Site Class').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="NOP" value={filterDraft.nop} onChange={e => setFilterDraft(f => ({ ...f, nop: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 110 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {uniqueOptions('NOP').map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </TextField>
              <TextField select size="small" label="Status" value={filterDraft.status} onChange={e => setFilterDraft(f => ({ ...f, status: e.target.value }))} SelectProps={{ native: true }} sx={{ minWidth: 90 }} InputLabelProps={{ shrink: true }}>
                <option value="">All</option>
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </TextField>
            </Box>
          </Box>
        </Paper>

        {/* Table */}
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)', maxHeight: 520 }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ background: '#f7fafd' }}>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, width: 50, textAlign: 'center' }}>No</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Site ID</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Site Name</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Site Class</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>NOP</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Source Power</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Root Cause</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 120 }}>Detail Problem</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 120 }}>Plan Action</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 120 }}>Need Support</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>PIC Dept</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Progress</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 80 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 100 }}>Remark</TableCell>
                <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, minWidth: 200 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ py: 4 }}>
                    Tidak ada data yang menunggu approval.
                  </TableCell>
                </TableRow>
              ) : filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                <TableRow 
                  key={row.id} 
                  hover 
                  sx={{ 
                    '&:hover': { bgcolor: '#f5f5f5' }
                  }}
                  onClick={() => handleShowRowDetail(row)}
                >
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {page * rowsPerPage + idx + 1}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Category']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Site ID']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Site Name']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Site Class']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['NOP']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Source Power']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Root Cause']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    <TruncatedTextWithDetail 
                      text={row['Detail Problem']} 
                      fieldName="Detail Problem"
                      onShowDetail={handleShowFieldDetail}
                      row={row}
                    />
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    <TruncatedTextWithDetail 
                      text={row['Plan Action']} 
                      fieldName="Plan Action"
                      onShowDetail={handleShowFieldDetail}
                      row={row}
                    />
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    <TruncatedTextWithDetail 
                      text={row['Need Support']} 
                      fieldName="Need Support"
                      onShowDetail={handleShowFieldDetail}
                      row={row}
                    />
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['PIC Dept']}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Progress']}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Status'] === 'Waiting approval' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span style={{ fontWeight: 600, color: '#ff9800', letterSpacing: 0.2 }}>Waiting approval</span>
                      </span>
                    ) : (
                      row['Status'] || ''
                    )}
                  </TableCell>
                  <TableCell align="left" sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                    {row['Remark'] || ''}
                  </TableCell>
                  <TableCell align="center" sx={{ border: '1px solid #e0e0e0', padding: '0 2px', fontSize: 13, verticalAlign: 'middle', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                    <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                      <TextField
                        select
                        size="small"
                        value={statusEdit[row.id] || ''}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        sx={{ minWidth: 100, '& .MuiSelect-select': { py: 0.5, px: 1, fontSize: 12 } }}
                        SelectProps={{ native: true }}
                      >
                        <option value="">Pilih Status</option>
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </TextField>
                      <TextField
                        size="small"
                        placeholder="Remark"
                        value={remarkEdit[row.id] || ''}
                        onChange={(e) => setRemarkEdit(prev => ({ ...prev, [row.id]: e.target.value }))}
                        sx={{ minWidth: 120, '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: 12 } }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSave(row)}
                        disabled={!statusEdit[row.id] || saving === row.id}
                        sx={{ minWidth: 60, py: 0.5, px: 1, fontSize: 12 }}
                      >
                        {saving === row.id ? <CircularProgress size={16} /> : 'Save'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        <Box display="flex" justifyContent="flex-end" alignItems="center" mt={1}>
          <TablePagination
            component="div"
            count={filteredRows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage="Show"
            sx={{ '.MuiTablePagination-toolbar': { minHeight: 40 }, '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: 13 } }}
          />
        </Box>

        {/* Detail Dialog */}
        {showDetail && (
          <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowDetail(null); setDetailField(''); }}>
            <div style={{ background: '#fff', borderRadius: 8, minWidth: 320, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24 }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                {detailField ? `Detail ${detailField}` : 'Detail Data'}
              </h3>
              {detailField ? (
                // Show specific field detail
                <div style={{ marginTop: 16 }}>
                  <h4 style={{ fontWeight: 600, fontSize: 16, marginBottom: 12, color: '#1976d2' }}>{detailField}</h4>
                  <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <p style={{ margin: 0, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                      {showDetail[detailField] || '-'}
                    </p>
                  </div>
                </div>
              ) : (
                // Show full row detail
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {detailFields.map(field => (
                      <tr key={field}>
                        <th style={{ width: 140, border: '1px solid #e0e0e0', padding: 8, textAlign: 'left' }}>{field}</th>
                        <td style={{ border: '1px solid #e0e0e0', padding: 8 }}>{Array.isArray(showDetail[field]) ? showDetail[field].join(', ') : (showDetail[field] ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ textAlign: 'right', marginTop: 18 }}>
                <button onClick={() => { setShowDetail(null); setDetailField(''); }} style={{ padding: '6px 18px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
              </div>
            </div>
          </div>
        )}
      </Box>
    </SuperAdminGuard>
  );
};

export default AvailabilityApprovalPage; 