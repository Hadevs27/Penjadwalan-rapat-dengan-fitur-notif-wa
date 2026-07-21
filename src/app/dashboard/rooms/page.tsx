"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit2, Trash2, Building2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Room = {
  id: number;
  nama_ruangan: string;
  kapasitas: number;
};

export default function RoomsPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, id: number | null }>({ isOpen: false, id: null });
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({ id: 0, nama_ruangan: "", kapasitas: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      setRooms(data);
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
      const url = "/api/rooms";
      const method = editMode ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchRooms();
      } else {
        alert("Gagal menyimpan data ruangan");
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
      const res = await fetch(`/api/rooms?id=${deleteModal.id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteModal({ isOpen: false, id: null });
        fetchRooms();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setFormData({ id: 0, nama_ruangan: "", kapasitas: "" });
    setModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditMode(true);
    setFormData({ 
      id: room.id, 
      nama_ruangan: room.nama_ruangan, 
      kapasitas: room.kapasitas.toString()
    });
    setModalOpen(true);
  };

  if (session?.user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak. Anda bukan admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-slate-800">Manajemen Ruangan</h1>
          <p className="text-slate-500 mt-1">Kelola data ruangan yang tersedia untuk rapat.</p>
        </div>
        <button onClick={openAddModal} className="relative z-10 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-brand-500/25 hover:shadow-lg flex items-center gap-2 group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span>Tambah Ruangan</span>
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase text-xs tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-6 py-4">Nama Ruangan</th>
                <th className="px-6 py-4">Kapasitas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400">Loading data...</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Belum ada data ruangan
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-slate-800">{room.nama_ruangan}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {room.kapasitas} Orang
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(room)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteModal({ isOpen: true, id: room.id })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full relative z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold font-heading text-slate-800">{editMode ? 'Edit Ruangan' : 'Tambah Ruangan'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Ruangan *</label>
                  <input type="text" required value={formData.nama_ruangan} onChange={(e) => setFormData({...formData, nama_ruangan: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" placeholder="Contoh: Ruang Rapat Utama" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Kapasitas (Orang) *</label>
                  <input type="number" required min="1" value={formData.kapasitas} onChange={(e) => setFormData({...formData, kapasitas: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm" placeholder="Contoh: 50" />
                </div>
                
                <div className="pt-4 flex gap-3">
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
              <h3 className="text-xl font-bold text-slate-800 mb-2">Hapus Ruangan?</h3>
              <p className="text-slate-500 mb-6 text-sm">Ruangan yang dihapus tidak dapat dikembalikan. Pastikan tidak ada rapat yang terkait dengan ruangan ini.</p>
              
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
