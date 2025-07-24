'use client';

import React, { useEffect, useState } from 'react';
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

const ApprovalPage = () => {
  // Tambah state untuk akses
  const [isSuperAdminState, setIsSuperAdminState] = useState<boolean | null>(null);
  const [redirecting, setRedirecting] = useState(false);

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

  if (isSuperAdminState === false) {
    return <div style={{ padding: 32, color: 'red', fontWeight: 700, fontSize: 20 }}>Akses ditolak. Halaman ini hanya untuk super admin.<br/>Anda akan diarahkan ke dashboard...</div>;
  }
  if (isSuperAdminState === null) {
    return null; // Atau loading spinner
  }
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusEdit, setStatusEdit] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<any | null>(null);
  const [remarkEdit, setRemarkEdit] = useState<{ [id: string]: string }>({});

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
      updates.Progress = '';
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
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>Approval</h2>
      <style>{`
        .approval-table tr:hover { background: #f0f6ff; cursor: pointer; }
        .approval-table td, .approval-table th { transition: background 0.2s; }
        .approval-modal-bg { position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.18); display: flex; align-items: center; justify-content: center; }
        .approval-modal { background: #fff; border-radius: 8px; min-width: 320px; max-width: 95vw; max-height: 90vh; overflow: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.18); padding: 24px; }
        .approval-modal table { width: 100%; border-collapse: collapse; }
        .approval-modal th, .approval-modal td { border: 1px solid #e0e0e0; padding: 8px; text-align: left; }
      `}</style>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table className="approval-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700, background: '#fff' }}>
          <thead>
            <tr style={{ background: '#fafbfc' }}>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>No</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Category</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Site ID</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Site Class</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>NOP</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Date Close</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Status</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Remark</th>
              <th style={{ border: '1px solid #e0e0e0', padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>Tidak ada data menunggu approval.</td></tr>
            ) : rows.map((row, idx) => {
              // Ambil tanggal terakhir dari Date Close (array atau string)
              let dateClose = '';
              if (Array.isArray(row['Date Close'])) {
                const arr = row['Date Close'];
                dateClose = arr.length > 0 ? toDisplayDate(arr[arr.length - 1]) : '';
              } else if (row['Date Close']) {
                dateClose = toDisplayDate(row['Date Close']);
              }
              return (
              <tr key={row.id} onClick={e => { if ((e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'TEXTAREA') setShowDetail(row); }}>
                <td style={{ border: '1px solid #e0e0e0', padding: 6, textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row['Category']}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row['Site ID']}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row['Site Class']}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{row['NOP']}</td>
                  <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>{dateClose}</td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6, textAlign: 'center' }}>
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
                </td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6 }}>
                  <textarea
                    value={remarkEdit[row.id] ?? row['Remark'] ?? ''}
                    onChange={e => setRemarkEdit(prev => ({ ...prev, [row.id]: e.target.value }))}
                    rows={2}
                    style={{ width: 140, minHeight: 32, borderRadius: 4, border: '1px solid #ccc', padding: 4, resize: 'vertical' }}
                    placeholder="Isi remark..."
                    onClick={e => e.stopPropagation()}
                  />
                </td>
                <td style={{ border: '1px solid #e0e0e0', padding: 6, textAlign: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); handleSave(row); }}
                    disabled={!statusEdit[row.id] || saving === row.id}
                    style={{
                      padding: '4px 16px',
                      borderRadius: 4,
                      border: 'none',
                      background: '#1976d2',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: statusEdit[row.id] && !saving ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = '#1251a3')}
                    onMouseOut={e => (e.currentTarget.style.background = '#1976d2')}
                  >
                    <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: 2 }}>
                      <path d="M17 21H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l5 5v9a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                    </svg>
                    {saving === row.id ? 'Saving...' : 'Simpan'}
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Modal detail */}
      {showDetail && (
        <div className="approval-modal-bg" onClick={() => setShowDetail(null)}>
          <div className="approval-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Detail Data</h3>
            <table>
              <tbody>
                {detailFields.map(field => (
                  <tr key={field}>
                    <th style={{ width: 140 }}>{field}</th>
                    <td>{Array.isArray(showDetail[field]) ? showDetail[field].join(', ') : (showDetail[field] ?? '')}</td>
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
    </div>
  );
};

export default ApprovalPage; 