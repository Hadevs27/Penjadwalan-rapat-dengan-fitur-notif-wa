"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, Edit2, Trash2, ArrowLeft, Send, CheckCircle2, XCircle, Info, FileText } from "lucide-react";

export default function MeetingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [notifying, setNotifying] = useState(false);
  
  useEffect(() => {
    fetchMeeting();
  }, [id]);
  
  const fetchMeeting = async () => {
    try {
      const res = await fetch("/api/meetings?filter=all");
      const data = await res.json();
      const m = data.find((x: any) => x.id === parseInt(id as string));
      setMeeting(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal rapat ini?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/dashboard/meetings");
      } else {
        alert("Gagal menghapus rapat.");
        setDeleting(false);
      }
    } catch (e) {
      alert("Terjadi kesalahan");
      setDeleting(false);
    }
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const res = await fetch(`/api/meetings/${id}/notify`, { method: "POST" });
      if (res.ok) alert("Notifikasi berhasil dikirim!");
      else alert("Gagal mengirim notifikasi.");
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setNotifying(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat detail rapat...</div>;
  if (!meeting) return <div className="p-8 text-center text-red-500">Rapat tidak ditemukan.</div>;

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.push("/dashboard/meetings")} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Rapat
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-heading text-slate-800 mb-2">{meeting.judul_rapat}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                meeting.status === 'terjadwal' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                meeting.status === 'berlangsung' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                meeting.status === 'selesai' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                'bg-red-50 text-red-700 border-red-200'
              } border`}>
                {meeting.status.toUpperCase()}
              </span>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => router.push(`/dashboard/meetings/${id}/edit`)} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-medium border border-slate-200 transition-colors flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Rapat
                </button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-medium border border-red-200 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> {deleting ? "Menghapus..." : "Hapus Rapat"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-5 mb-8 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Agenda</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{meeting.agenda}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">TANGGAL</div>
                  <div className="font-medium">{format(new Date(meeting.tanggal), "EEEE, dd MMMM yyyy", { locale: idLocale })}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">WAKTU</div>
                  <div className="font-medium">{meeting.jam_mulai.substring(0, 5)} - {meeting.jam_selesai.substring(0, 5)} WIB</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">RUANGAN</div>
                  <div className="font-medium">{meeting.room?.nama_ruangan || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold mb-0.5">PEMBUAT RAPAT</div>
                  <div className="font-medium">{meeting.creator?.nama || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h3 className="text-lg font-bold font-heading text-slate-800 flex items-center gap-2">
                Daftar Peserta <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{meeting.participants.length}</span>
              </h3>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={handleNotify} disabled={notifying} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200 transition-colors flex items-center gap-2 disabled:opacity-50">
                    <Send className="w-4 h-4" /> {notifying ? "Mengirim..." : "Kirim Notifikasi"}
                  </button>
                  <button onClick={() => router.push(`/dashboard/meetings/${id}/notulen`)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-200 transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Buka Notulen
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 border-b">Nama Pegawai</th>
                    <th className="px-4 py-3 border-b">Bidang</th>
                    <th className="px-4 py-3 border-b">Kehadiran</th>
                    <th className="px-4 py-3 border-b">Alasan (Jika Izin)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {meeting.participants.map((p: any, index: number) => (
                    <tr key={p.user_id || index} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">{p.user.nama}</td>
                      <td className="px-4 py-3">{p.user.bidang}</td>
                      <td className="px-4 py-3">
                        {p.status_kehadiran === 'Hadir' ? <span className="inline-flex text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md text-xs font-semibold items-center gap-1.5"><CheckCircle2 className="w-3 h-3"/> Hadir</span> :
                         p.status_kehadiran === 'Izin' ? <span className="inline-flex text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md text-xs font-semibold items-center gap-1.5"><Info className="w-3 h-3"/> Izin</span> :
                         p.status_kehadiran === 'Absen' ? <span className="inline-flex text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-md text-xs font-semibold items-center gap-1.5"><XCircle className="w-3 h-3"/> Absen</span> :
                         <span className="inline-flex text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs font-semibold items-center gap-1.5">Menunggu</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500 italic max-w-[200px] truncate" title={p.alasan_izin || ""}>{p.alasan_izin || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
