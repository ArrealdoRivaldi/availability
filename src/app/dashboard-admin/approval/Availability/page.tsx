'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, TableContainer, TablePagination, InputAdornment, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, update } from 'firebase/database';

const STATUS_OPTIONS = [
  { value: 'Close', label: 'Approve' },
  { value: 'Rejected', label: 'Rejected' },
];

function isSuperAdmin() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userRole') === 'super_admin';
  }
  return false;
}

// Helper untuk format tampilan tanggal (hanya tanggal saja)
function toDisplayDate(dateString: string) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const AvailabilityApprovalPage = () => {
  const [isSuperAdminState, setIsSuperAdminState] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any | null>(null);
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
    if (typeof window !== 'undefined') {
      const isSuper = localStorage.getItem('userRole') === 'super_admin';
      setIsSuperAdminState(isSuper);
      if (!isSuper) {
        setRedirecting(true);
        const timer = setTimeout(() => {
          window.location.href = '/dashboard-admin';
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
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

  if (isSuperAdminState === false) {
    return <div style={{ padding: 32, color: 'red', fontWeight: 700, fontSize: 20 }}>Akses ditolak. Halaman ini hanya untuk super admin.<br/>Anda akan diarahkan ke dashboard...</div>;
  }
  if (isSuperAdminState === null) {
    return null; // Atau loading spinner
  }

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

  // Daftar field detail
  const detailFields = [
    'Category', 'Site ID', 'Site Name', 'Site Class', 'NOP', 'Source Power', 'Progress', 'Root Cause', 'PIC Dept', 'Detail Problem', 'Plan Action', 'Need Support', 'Date Close', 'Status'
  ];

  return (
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
            <Button variant="outlined" size="small" color="inherit" sx={{ ml: 1, minWidth: 80, fontWeight: 600, borderRadius: 2 }} onClick={() => { setFilterDraft({ category: '', siteId: '', siteClass: '', nop: '', status: '', search: '' }); setPage(0); }}>Reset</Button>
            {filterLoading && <CircularProgress size={18} sx={{ ml: 1 }} />}
          </Box>
        </Box>
      </Paper>

      {/* Table Data */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)', maxHeight: 520 }}>
        <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ background: '#f7fafd' }}>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, width: 40, maxWidth: 50, textAlign: 'center' }}>No</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Site ID</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Site Class</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>NOP</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Date Close</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, textAlign: 'center' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14 }}>Remark</TableCell>
              <TableCell sx={{ fontWeight: 700, background: '#f7fafd', borderBottom: '2px solid #e0e0e0', fontSize: 14, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  Tidak ada data menunggu approval.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => {
                // Ambil tanggal terakhir dari Date Close (array atau string)
                let dateClose = '';
                if (Array.isArray(row['Date Close'])) {
                  const arr = row['Date Close'];
                  dateClose = arr.length > 0 ? toDisplayDate(arr[arr.length - 1]) : '';
                } else if (row['Date Close']) {
                  dateClose = toDisplayDate(row['Date Close']);
                }
                return (
                  <TableRow key={row.id} hover sx={{ background: idx % 2 === 0 ? '#f9fbfd' : '#fff', transition: 'background 0.2s', cursor: 'pointer', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={e => { if ((e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'TEXTAREA') setShowDetail(row); }}>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center' }}>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Category']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Site ID']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['Site Class']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{row['NOP']}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>{dateClose}</TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center' }}>
                      <select
                        value={statusEdit[row.id] || ''}
                        onChange={e => handleStatusChange(row.id, e.target.value)}
                        style={{ padding: 4, borderRadius: 4, border: '1px solid #ccc', minWidth: 90, fontWeight: 600, color: statusEdit[row.id] === 'Close' ? 'green' : statusEdit[row.id] === 'Rejected' ? 'red' : undefined }}
                        onClick={e => e.stopPropagation()}
                      >
                        <option value="">Pilih aksi</option>
                        <option value="Close">Approve &#10003;</option>
                        <option value="Rejected">Rejected &#10007;</option>
                      </select>
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '2px 6px', fontSize: 13, verticalAlign: 'middle' }}>
                      <textarea
                        value={remarkEdit[row.id] ?? row['Remark'] ?? ''}
                        onChange={e => setRemarkEdit(prev => ({ ...prev, [row.id]: e.target.value }))}
                        rows={2}
                        style={{ width: 140, minHeight: 32, borderRadius: 4, border: '1px solid #ccc', padding: 4, resize: 'vertical' }}
                        placeholder="Isi remark..."
                        onClick={e => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell sx={{ border: '1px solid #e0e0e0', padding: '0 2px', fontSize: 13, verticalAlign: 'middle', textAlign: 'center', cursor: 'default' }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={e => { e.stopPropagation(); handleSave(row); }}
                        disabled={!statusEdit[row.id] || saving === row.id}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 0.5,
                          fontSize: 12,
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                        }}
                        startIcon={
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 21H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l5 5v9a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                          </svg>
                        }
                      >
                        {saving === row.id ? 'Saving...' : 'Simpan'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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

      {/* Modal detail */}
      {showDetail && (
        <div style={{ position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDetail(null)}>
          <div style={{ background: '#fff', borderRadius: 8, minWidth: 320, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 24 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Detail Data</h3>
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
            <div style={{ textAlign: 'right', marginTop: 18 }}>
              <button onClick={() => setShowDetail(null)} style={{ padding: '6px 18px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default AvailabilityApprovalPage; 