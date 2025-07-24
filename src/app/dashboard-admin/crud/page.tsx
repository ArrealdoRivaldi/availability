"use client";
import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, CircularProgress, Slide, Fade, Tooltip } from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { database } from '@/app/firebaseConfig';
import { ref, onValue, push, update, remove } from "firebase/database";
// @ts-ignore
import * as XLSX from 'xlsx';

const DATA_COLUMNS = [
  { id: 'Category', label: 'Category' },
  { id: 'Site ID', label: 'Site ID' },
  { id: 'Site Name', label: 'Site Name' },
  { id: 'Site Class', label: 'Site Class' },
  { id: 'NOP', label: 'NOP' },
  { id: 'Source Power', label: 'Source Power' },
  { id: 'Root Cause', label: 'Root Cause' },
  { id: 'Detail Problem', label: 'Detail Problem' },
  { id: 'Plan Action', label: 'Plan Action' },
  { id: 'Need Support', label: 'Need Support' },
  { id: 'PIC Dept', label: 'PIC Dept' },
  { id: 'Progress', label: 'Progress' },
  { id: 'Status', label: 'Status' },
  { id: 'Remark', label: 'Remark' },
];

function isSuperAdmin() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userRole') === 'super_admin';
  }
  return false;
}

const CrudPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'add'|'edit'>('add');
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string|null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean, message: string, color?: string}>({open: false, message: ''});
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadData, setUploadData] = useState<any[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSuperAdmin()) return;
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

  if (typeof window !== 'undefined' && !isSuperAdmin()) {
    return <Box p={4}><Typography color="error" fontWeight={700} fontSize={20}>Akses ditolak. Hanya untuk super admin.</Typography></Box>;
  }

  // CRUD Handlers
  const handleOpenForm = (mode: 'add'|'edit', row?: any) => {
    setFormMode(mode);
    setFormData(row || {});
    setEditId(row?.id || null);
    setOpenForm(true);
  };
  const handleCloseForm = () => {
    setOpenForm(false);
    setFormData({});
    setEditId(null);
  };
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };
  const handleFormSubmit = async () => {
    // Validasi minimal: semua kolom wajib diisi
    for (const col of DATA_COLUMNS) {
      if (!formData[col.id] || String(formData[col.id]).trim() === '') {
        setSnackbar({open:true, message:`Field '${col.label}' wajib diisi!`, color:'error'});
        return;
      }
    }
    setLoading(true);
    if (formMode === 'add') {
      await push(ref(database), formData);
      setSnackbar({open:true, message:'Data berhasil ditambahkan!', color:'success'});
    } else if (formMode === 'edit' && editId) {
      await update(ref(database, editId), formData);
      setSnackbar({open:true, message:'Data berhasil diupdate!', color:'success'});
    }
    setLoading(false);
    setOpenForm(false);
    setFormData({});
    setEditId(null);
  };
  const handleDelete = async (id: string) => {
    setLoading(true);
    await remove(ref(database, id));
    setSnackbar({open:true, message:'Data berhasil dihapus!', color:'success'});
    setLoading(false);
  };

  // Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      let json: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = data as string;
        const rows = text.split(/\r?\n/).filter(Boolean);
        const headers = rows[0].split(',');
        json = rows.slice(1).map(row => {
          const values = row.split(',');
          const obj: any = {};
          headers.forEach((h, i) => obj[h.trim()] = values[i]?.trim() || '');
          return obj;
        });
      } else {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        json = XLSX.utils.sheet_to_json(sheet);
      }
      setUploadData(json);
      setUploadLoading(false);
      setUploadDialog(true);
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };
  const handleUploadImport = async () => {
    setUploadLoading(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    const chunkSize = 25;
    const total = uploadData.length;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = uploadData.slice(i, i + chunkSize);
      for (const row of chunk) {
        await push(ref(database), row);
      }
      setUploadProgress(Math.min(100, Math.round(((i + chunk.length) / total) * 100)));
      await new Promise(res => setTimeout(res, 200)); // animasi progress
    }
    setUploadLoading(false);
    setUploadProgress(100);
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadDialog(false);
      setUploadData([]);
      setUploadSuccess(false);
      setUploadProgress(0);
      setSnackbar({open:true, message:'Data berhasil diimport!', color:'success'});
    }, 1200);
  };

  return (
    <Box p={{ xs: 1, md: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>CRUD Data (Super Admin Only)</Typography>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: '0 1px 8px rgba(30,58,138,0.06)' }}>
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm('add')} sx={{ borderRadius: 2 }}>Tambah Data</Button>
          <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 2 }}>Upload Excel/CSV</Button>
          <input type="file" accept=".xlsx,.csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        </Box>
        <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 1px 4px rgba(30,58,138,0.04)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {DATA_COLUMNS.map(col => <TableCell key={col.id} sx={{ fontWeight: 700 }}>{col.label}</TableCell>)}
                <TableCell>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={DATA_COLUMNS.length+1} align="center"><CircularProgress /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={DATA_COLUMNS.length+1} align="center">Tidak ada data.</TableCell></TableRow>
              ) : rows.map(row => (
                <TableRow key={row.id}>
                  {DATA_COLUMNS.map(col => <TableCell key={col.id}>{row[col.id]}</TableCell>)}
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleOpenForm('edit', row)}><EditIcon /></IconButton>
                    <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
      {/* Modal Form Tambah/Edit */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth TransitionComponent={Slide} TransitionProps={{ direction: 'up' }}>
        <DialogTitle>{formMode === 'add' ? 'Tambah Data' : 'Edit Data'}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {DATA_COLUMNS.map(col => (
              <TextField
                key={col.id}
                label={col.label}
                value={formData[col.id] || ''}
                onChange={e => handleFormChange(col.id, e.target.value)}
                fullWidth
                sx={{ flex: '1 1 220px', minWidth: 180 }}
                required
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm}>Batal</Button>
          <Button onClick={handleFormSubmit} variant="contained">Simpan</Button>
        </DialogActions>
      </Dialog>
      {/* Modal Upload Preview */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="lg" fullWidth TransitionComponent={Fade}>
        <DialogTitle>Preview Data Upload</DialogTitle>
        <DialogContent dividers>
          {/* Progress Bar & Success Animation */}
          {(uploadLoading || uploadProgress > 0) && (
            <Box mb={2}>
              <Box sx={{ width: '100%', height: 16, bgcolor: '#e3eafc', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ width: `${uploadProgress}%`, height: '100%', bgcolor: uploadSuccess ? '#43a047' : '#1976d2', transition: 'width 0.4s' }} />
                {uploadSuccess && (
                  <Box sx={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                    ✓ Sukses!
                  </Box>
                )}
              </Box>
              {!uploadSuccess && <Typography fontSize={13} color="text.secondary" mt={0.5}>{uploadProgress}%</Typography>}
            </Box>
          )}
          {uploadLoading ? <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress size={40} /></Box> : (
            <Box sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: '0 1px 4px rgba(30,58,138,0.04)', animation: 'fadeIn 0.7s' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {DATA_COLUMNS.map(col => <TableCell key={col.id} sx={{ fontWeight: 700 }}>{col.label}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadData.length === 0 ? (
                    <TableRow><TableCell colSpan={DATA_COLUMNS.length} align="center">Tidak ada data.</TableCell></TableRow>
                  ) : uploadData.map((row, idx) => (
                    <TableRow key={idx} sx={{ background: idx % 2 === 0 ? '#f5fafd' : '#fff', transition: 'background 0.3s' }}>
                      {DATA_COLUMNS.map(col => <TableCell key={col.id}>{row[col.id]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Batal</Button>
          <Button onClick={handleUploadImport} variant="contained" disabled={uploadLoading || uploadSuccess} sx={{ position: 'relative', overflow: 'hidden' }}>
            {uploadLoading && <CircularProgress size={18} sx={{ position: 'absolute', left: 10, top: 10 }} />}
            Import
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar Notifikasi */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({open:false, message:''})}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{ sx: { background: snackbar.color === 'error' ? '#e53935' : '#43a047', fontWeight: 600 } }}
      />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
      `}</style>
    </Box>
  );
};

export default CrudPage; 