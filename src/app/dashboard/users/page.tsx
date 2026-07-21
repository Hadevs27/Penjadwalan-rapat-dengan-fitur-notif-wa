"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit2, Trash2, Users, X, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Pegawai = {
  id: number;
  nip: string;
  nama: string;
  jabatan: string;
  bidang: string;
  role: string;
  whatsapp_number: string | null;
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [usersList, setUsersList] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({ id: 0, nip: "", nama: "", jabatan: "", bidang: "", role: "pegawai", password: "", whatsapp_number: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsersList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/users";
      const method = editMode ? "PUT" : "POST";
      
      const payload = { ...formData };
      if (editMode) {
        delete (payload as any).password; // Jangan kirim password jika edit (untuk saat ini)
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(`Gagal: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users?id=${deleteModal.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteModal({ isOpen: false, id: null });
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ id: 0, nip: "", nama: "", jabatan: "", bidang: "", role: "pegawai", password: "", whatsapp_number: "" });
    setModalOpen(true);
  };

  const openEditModal = (user: Pegawai) => {
    setEditMode(true);
    setFormData({ 
      id: user.id, 
      nip: user.nip, 
      nama: user.nama, 
      jabatan: user.jabatan,
      bidang: user.bidang,
      role: user.role,
      whatsapp_number: user.whatsapp_number || "",
      password: "" 
    });
    setModalOpen(true);
  };

  if (session?.user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak. Anda bukan admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-slate-800">Manajemen Pegawai</h1>
          <p className="text-slate-500 mt-1">Kelola data seluruh pegawai yang terdaftar di sistem.</p>
        </div>
        <button onClick={openAddModal} className="relative z-10 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-brand-500/25 hover:shadow-lg flex items-center gap-2 group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4">Nama Pegawai / NIP</th>
                <th className="px-6 py-4">Kontak (WA)</th>
                <th className="px-6 py-4">Jabatan & Bidang</th>
                <th className="px-6 py-4">Hak Akses</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Belum ada data pegawai
                  </td>
                </tr>
              ) : (
                usersList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase shrink-0">
                          {user.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.nama}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{user.nip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 text-sm font-medium">{user.whatsapp_number || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{user.jabatan}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{user.bidang}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200">
                          <Shield className="w-3 h-3"/> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                          <User className="w-3 h-3"/> Pegawai
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: user.id })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={user.id === parseInt(session.user.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl max-w-lg w-full relative z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold font-heading text-slate-800">{editMode ? 'Edit Pegawai' : 'Tambah Pegawai'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">NIP *</label>
                    <input type="text" required value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap *</label>
                    <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Jabatan</label>
                    <input type="text" value={formData.jabatan} onChange={(e) => setFormData({...formData, jabatan: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" placeholder="Misal: Kepala Sub Bidang..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Bidang</label>
                    <input type="text" value={formData.bidang} onChange={(e) => setFormData({...formData, bidang: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor WhatsApp</label>
                    <input type="text" value={formData.whatsapp_number} onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" placeholder="Misal: 081234567890" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Hak Akses</label>
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm bg-white">
                      <option value="pegawai">Pegawai Biasa</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {!editMode && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                      <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" />
                    </div>
                  )}
                </div>
                
                <div className="pt-4 flex gap-3 mt-4">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 text-white bg-brand-600 hover:bg-brand-700 rounded-xl font-medium transition-colors disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl max-w-sm w-full relative z-10 p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Pegawai?</h3>
              <p className="text-slate-500 mb-6 text-sm">Pegawai yang dihapus tidak dapat mengakses sistem lagi. Data rapat yang melibatkan pegawai ini mungkin terdampak.</p>
              
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 px-4 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">Batal</button>
                <button onClick={handleDelete} disabled={submitting} className="flex-1 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors disabled:opacity-50">
                  {submitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
