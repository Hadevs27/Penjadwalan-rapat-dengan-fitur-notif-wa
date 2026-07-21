"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Users, Save } from "lucide-react";

export default function EditMeetingPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  
  const [rooms, setRooms] = useState<{id: number, nama_ruangan: string}[]>([]);
  const [users, setUsers] = useState<{id: number, nama: string, bidang: string}[]>([]);
  
  const [form, setForm] = useState({
    judul_rapat: "",
    agenda: "",
    tanggal: "",
    jam_mulai: "",
    jam_selesai: "",
    ruangan_id: "",
    participant_ids: [] as number[]
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/rooms").then(res => res.json()),
      fetch("/api/users").then(res => res.json()),
      fetch("/api/meetings?filter=all").then(res => res.json())
    ]).then(([roomsData, usersData, meetingsData]) => {
      setRooms(roomsData);
      setUsers(usersData);
      
      const m = meetingsData.find((x: any) => x.id === parseInt(id as string));
      if (m) {
        setForm({
          judul_rapat: m.judul_rapat,
          agenda: m.agenda,
          tanggal: m.tanggal,
          jam_mulai: m.jam_mulai.substring(0, 5),
          jam_selesai: m.jam_selesai.substring(0, 5),
          ruangan_id: m.ruangan_id?.toString() || "",
          participant_ids: m.participants.map((p: any) => p.user_id)
        });
      } else {
        setError("Rapat tidak ditemukan");
      }
      setFetching(false);
    });
  }, [id]);

  const handleParticipantToggle = (id: number) => {
    setForm(prev => {
      const exists = prev.participant_ids.includes(id);
      if (exists) {
        return { ...prev, participant_ids: prev.participant_ids.filter(p => p !== id) };
      } else {
        return { ...prev, participant_ids: [...prev.participant_ids, id] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.participant_ids.length === 0) {
      setError("Pilih minimal 1 peserta rapat.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal membuat rapat");
      }

      router.push("/dashboard/meetings");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-center text-slate-500">Memuat data rapat...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800">Edit Jadwal Rapat</h1>
        <p className="text-slate-500 mt-1">Ubah formulir di bawah ini. Pastikan ruangan dan waktu masih tersedia jika jadwal diubah.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:p-8 space-y-8">
        
        {/* Informasi Dasar */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Informasi Rapat
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul Rapat</label>
              <input type="text" required value={form.judul_rapat} onChange={e => setForm({...form, judul_rapat: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Rapat Koordinasi Pajak Daerah" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Agenda / Deskripsi Singkat</label>
              <textarea required rows={3} value={form.agenda} onChange={e => setForm({...form, agenda: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Jelaskan agenda atau poin penting rapat..."></textarea>
            </div>
          </div>
        </div>

        {/* Waktu & Tempat */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Waktu & Lokasi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
              <input type="time" required value={form.jam_mulai} onChange={e => setForm({...form, jam_mulai: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
              <input type="time" required value={form.jam_selesai} onChange={e => setForm({...form, jam_selesai: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Ruangan <MapPin className="w-4 h-4 inline text-emerald-500 ml-1"/></label>
              <select required value={form.ruangan_id} onChange={e => setForm({...form, ruangan_id: e.target.value})} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="" disabled>-- Pilih Ruangan --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.nama_ruangan}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Pemilihan Peserta */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" /> Peserta Terundang ({form.participant_ids.length} dipilih)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1">
            {users.map(u => {
              const isSelected = form.participant_ids.includes(u.id);
              return (
                <div 
                  key={u.id} 
                  onClick={() => handleParticipantToggle(u.id)}
                  className={`cursor-pointer border rounded-xl p-3 flex flex-col transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-800 truncate pr-2">{u.nama}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 truncate">{u.bidang}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Batal
          </button>
          <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-8 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {loading ? "Menyimpan Perubahan..." : (
              <><Save className="w-4 h-4" /> Simpan Perubahan</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
