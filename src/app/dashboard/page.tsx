"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import DashboardStats from "@/components/DashboardStats";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchMeetings();
    }
  }, [session]);

  const fetchMeetings = async () => {
    try {
      // Admin sees all for stats, user sees only theirs
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

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-heading text-slate-800">
            Selamat Datang, {session?.user?.name || (session?.user as any)?.nama || 'Pengguna'}!
          </h1>
          <p className="text-slate-500 mt-1">
            {isAdmin 
              ? "Ini adalah pusat kendali sistem Manajemen Rapat BAPENDA." 
              : "Ini adalah ringkasan rapat yang harus Anda hadiri."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100/60 animate-pulse">
          Memuat Data Statistik...
        </div>
      ) : (
        <DashboardStats meetings={meetings} />
      )}
      
      {!isAdmin && !loading && meetings.length > 0 && (
        <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-100">
          <p className="font-medium text-sm">
            Anda memiliki {meetings.length} jadwal rapat yang terkait dengan Anda. Buka menu <b>Data Rapat</b> untuk melihat detailnya.
          </p>
        </div>
      )}
    </div>
  );
}
