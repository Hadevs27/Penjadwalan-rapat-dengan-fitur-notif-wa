"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Plus, CheckCircle2, XCircle, Info, MessageSquare, FileText, Search, X, Send } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export const exportToCSV = (meetings: Meeting[]) => {
  const headers = ["ID", "Judul Rapat", "Agenda", "Tanggal", "Jam Mulai", "Jam Selesai", "Ruangan", "Jumlah Peserta"];
  
  const csvContent = meetings.map(m => {
    return [
      m.id,
      `"${m.judul_rapat.replace(/"/g, '""')}"`,
      `"${m.agenda.replace(/"/g, '""')}"`,
      m.tanggal,
      m.jam_mulai,
      m.jam_selesai,
      `"${m.room?.nama_ruangan || '-'}"`,
      m.participants.length
    ].join(",");
  });
  
  const csvData = [headers.join(","), ...csvContent].join("\n");
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Laporan_Rapat_BAPENDA_${format(new Date(), "yyyyMMdd")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

type Meeting = {
  id: number;
  judul_rapat: string;
  agenda: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  room: { nama_ruangan: string };
  creator: { nama: string };
  participants: { user_id: number, user: { nama: string, bidang: string }, status_kehadiran: string, alasan_izin: string | null }[];
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<number | null>(null);
  const [izinModal, setIzinModal] = useState<{ isOpen: boolean, meetingId: number | null }>({ isOpen: false, meetingId: null });
  const [alasanIzin, setAlasanIzin] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [participantsModal, setParticipantsModal] = useState<{ isOpen: boolean, participants: Meeting['participants'] }>({ isOpen: false, participants: [] });
  const [notifyingId, setNotifyingId] = useState<number | null>(null);

  useEffect(() => {
    fetchMeetings();
  }, [session]);

  const fetchMeetings = async () => {
    try {
      const filter = session?.user?.role === 'admin' ? 'all' : 'my_meetings';
      const res = await fetch(`/api/meetings?filter=${filter}`);
      const data = await res.json();
      setMeetings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (meetingId: number, status_kehadiran: string, alasan_izin?: string) => {
    if (!session) return;
    setRsvpLoading(meetingId);
    try {
      const res = await fetch('/api/meetings/rsvp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: meetingId, status_kehadiran, alasan_izin })
      });
      if (res.ok) {
        setIzinModal({ isOpen: false, meetingId: null });
        setAlasanIzin("");
        fetchMeetings(); // Refresh
      }
    } catch (e) {
      console.error("RSVP failed", e);
    } finally {
      setRsvpLoading(null);
    }
  };

  const handleNotify = async (meetingId: number) => {
    setNotifyingId(meetingId);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/notify`, {
        method: 'POST'
      });
      if (res.ok) {
        alert("Notifikasi WhatsApp berhasil dikirim ke peserta!");
      } else {
        const err = await res.json();
        alert("Gagal mengirim notifikasi: " + (err.error || "Kesalahan server"));
      }
    } catch (e) {
      alert("Gagal mengirim notifikasi.");
    } finally {
      setNotifyingId(null);
    }
  };

  const isAdmin = session?.user?.role === 'admin';
  const userId = session?.user?.id ? parseInt(session.user.id as string) : 0;

  const getStatusBadge = (status: string, alasan: string | null) => {
    switch (status) {
      case 'Hadir': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-semibold border border-green-200"><CheckCircle2 className="w-3.5 h-3.5"/> Hadir</span>;
      case 'Izin': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200" title={alasan || ''}><Info className="w-3.5 h-3.5"/> Izin</span>;
      case 'Absen': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-semibold border border-red-200"><XCircle className="w-3.5 h-3.5"/> Absen</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">Menunggu Konfirmasi</span>;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-slate-800">Manajemen Rapat</h1>
          <p className="text-slate-500 mt-1">{isAdmin ? "Kelola seluruh data dan agenda rapat." : "Daftar agenda rapat yang membutuhkan kehadiran Anda."}</p>
        </div>
        {isAdmin && (
          <div className="relative z-10 flex flex-wrap gap-3">
            <button onClick={() => exportToCSV(meetings)} className="bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border border-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>Export CSV</span>
            </button>
            <Link href="/dashboard/meetings/create" className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/30 flex items-center gap-2 group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>Buat Rapat Baru</span>
            </Link>
          </div>
        )}
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow shadow-sm"
          placeholder="Cari nama rapat atau ruangan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-slate-200/50 animate-pulse rounded-2xl border border-slate-100"></div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24 glass-panel rounded-2xl border-dashed">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarIcon className="w-10 h-10 text-brand-400" />
          </div>
          <h3 className="text-xl font-bold font-heading text-slate-800 mb-2">Belum ada agenda rapat</h3>
          <p className="text-slate-500 max-w-sm mx-auto">Saat ini belum ada jadwal rapat yang terdaftar atau membutuhkan kehadiran Anda.</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {meetings.filter(m => 
            m.judul_rapat.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (m.room?.nama_ruangan || "").toLowerCase().includes(searchQuery.toLowerCase())
          ).map((meeting) => {
            const myParticipantInfo = meeting.participants.find(p => p.user_id === userId);
            
            return (
              <motion.div variants={itemVariants} key={meeting.id} className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col h-full">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-400 to-brand-600"></div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-lg font-bold font-heading text-slate-800 line-clamp-2 leading-tight" title={meeting.judul_rapat}>
                      {meeting.judul_rapat}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-5 line-clamp-2 leading-relaxed">{meeting.agenda}</p>
                  
                  <div className="space-y-3.5 mb-6">
                    <div className="flex items-center text-sm text-slate-700 gap-3 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <span>{format(new Date(meeting.tanggal), "EEEE, dd MMM yyyy", { locale: id })}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-700 gap-3 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-amber-50/80 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/50">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span>{meeting.jam_mulai.substring(0, 5)} - {meeting.jam_selesai.substring(0, 5)} WIB</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-700 gap-3 font-medium">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50/80 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/50">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="truncate">{meeting.room?.nama_ruangan}</span>
                    </div>

                    <div 
                      onClick={() => setParticipantsModal({ isOpen: true, participants: meeting.participants })}
                      className="flex items-center text-sm text-slate-700 gap-3 font-medium cursor-pointer hover:text-brand-600 transition-colors group/peserta"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50/80 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/50 group-hover/peserta:bg-purple-100 transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="underline decoration-slate-300 decoration-dashed underline-offset-4 group-hover/peserta:decoration-brand-300">{meeting.participants.length} Peserta Terundang</span>
                    </div>
                  </div>
                </div>

                {/* Additional Actions (For All) */}
                <div className="pt-4 border-t border-slate-100 mt-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3">
                  <Link href={`/dashboard/meetings/${meeting.id}`} className="text-xs font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider flex items-center gap-1 hover:underline">
                    Detail Rapat <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <button 
                        onClick={() => handleNotify(meeting.id)} 
                        disabled={notifyingId === meeting.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {notifyingId === meeting.id ? "Mengirim..." : "Notifikasikan"}
                      </button>
                    )}
                    <Link href={`/dashboard/meetings/${meeting.id}/notulen`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200">
                      <FileText className="w-3.5 h-3.5"/> Buka Notulen
                    </Link>
                  </div>
                </div>

                {/* RSVP Section for Non-Admin Participants */}
                {!isAdmin && myParticipantInfo && (
                  <div className="pt-2 border-t border-slate-100/50 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Anda</span>
                      {getStatusBadge(myParticipantInfo.status_kehadiran, myParticipantInfo.alasan_izin)}
                    </div>
                    
                    {myParticipantInfo.status_kehadiran === 'pending' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button 
                          disabled={rsvpLoading === meeting.id}
                          onClick={() => handleRSVP(meeting.id, 'Hadir')}
                          className="flex justify-center items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 border border-green-200/50"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Hadir
                        </button>
                        <button 
                          disabled={rsvpLoading === meeting.id}
                          onClick={() => setIzinModal({ isOpen: true, meetingId: meeting.id })}
                          className="flex justify-center items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 border border-slate-200"
                        >
                          <Info className="w-4 h-4" /> Izin
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Izin Modal */}
      <AnimatePresence>
        {izinModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIzinModal({ isOpen: false, meetingId: null })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full relative z-10 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-slate-800">Alasan Izin</h3>
                  <p className="text-xs text-slate-500">Berikan keterangan mengapa Anda berhalangan hadir.</p>
                </div>
              </div>
              <div className="p-6">
                <textarea 
                  value={alasanIzin}
                  onChange={(e) => setAlasanIzin(e.target.value)}
                  placeholder="Contoh: Sedang dinas luar kota..."
                  className="w-full h-32 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none text-sm"
                />
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIzinModal({ isOpen: false, meetingId: null })} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
                    Batal
                  </button>
                  <button 
                    disabled={!alasanIzin.trim()}
                    onClick={() => izinModal.meetingId && handleRSVP(izinModal.meetingId, 'Izin', alasanIzin)} 
                    className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20"
                  >
                    Kirim Konfirmasi
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Participants Modal */}
      <AnimatePresence>
        {participantsModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setParticipantsModal({ isOpen: false, participants: [] })} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-2xl shadow-xl max-w-md w-full relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-slate-800">Daftar Peserta</h3>
                </div>
                <button onClick={() => setParticipantsModal({ isOpen: false, participants: [] })} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-3">
                {participantsModal.participants.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{p.user.nama}</p>
                      <p className="text-xs text-slate-500">{p.user.bidang}</p>
                    </div>
                    <div>
                      {getStatusBadge(p.status_kehadiran, p.alasan_izin)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
