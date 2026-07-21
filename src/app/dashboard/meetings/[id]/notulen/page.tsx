"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, FileText, Clock, Calendar } from "lucide-react";
import Link from "next/link";

export default function NotulenPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [notulen, setNotulen] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        // Karena API meeting tidak return full untuk semua role, kita fetch semua meeting lalu find.
        const filter = session?.user?.role === 'admin' ? 'all' : 'my_meetings';
        const res = await fetch(`/api/meetings?filter=${filter}`);
        const data = await res.json();
        const m = data.find((d: any) => d.id === parseInt(id as string));
        if (m) {
          setMeeting(m);
          setNotulen(m.hasil_notulensi || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchMeeting();
  }, [id, session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/meetings/${id}/notulen`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasil_notulensi: notulen })
      });
      if (res.ok) {
        alert("Notulen berhasil disimpan!");
      } else {
        alert("Gagal menyimpan notulen.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = session?.user?.role === 'admin';

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat Notulen...</div>;
  if (!meeting) return <div className="p-8 text-center text-red-500">Rapat tidak ditemukan atau Anda tidak memiliki akses.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-800">Notulen Rapat</h1>
          <p className="text-slate-500 text-sm">{meeting.judul_rapat}</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shrink-0">
          <FileText className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-2">
          <h2 className="text-xl font-bold text-slate-800">{meeting.judul_rapat}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {meeting.tanggal}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {meeting.jam_mulai} - {meeting.jam_selesai}</span>
          </div>
          <p className="text-slate-700 bg-slate-50 p-4 rounded-xl text-sm border border-slate-100">{meeting.agenda}</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-100">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h3 className="text-lg font-bold text-slate-800">Hasil Notulensi</h3>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-slate-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Cetak
            </button>
            {isAdmin && (
              <button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Notulen'}
              </button>
            )}
          </div>
        </div>
        
        {isAdmin ? (
          <textarea
            value={notulen}
            onChange={(e) => setNotulen(e.target.value)}
            placeholder="Ketik hasil notulensi di sini..."
            className="w-full h-96 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none text-slate-700 text-sm leading-relaxed"
          />
        ) : (
          <div className="w-full min-h-64 p-6 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
            {notulen || <span className="text-slate-400 italic">Notulen belum tersedia untuk rapat ini.</span>}
          </div>
        )}
      </div>
    </div>
  );
}
