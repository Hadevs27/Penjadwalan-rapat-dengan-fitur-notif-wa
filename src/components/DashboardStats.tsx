"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { Users, Calendar, Building2, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

type Meeting = {
  id: number;
  tanggal: string;
  room: { nama_ruangan: string };
  participants: any[];
};

export default function DashboardStats({ meetings }: { meetings: Meeting[] }) {
  const stats = useMemo(() => {
    const totalMeetings = meetings.length;
    const thisMonth = new Date().getMonth();
    const thisMonthMeetings = meetings.filter(m => new Date(m.tanggal).getMonth() === thisMonth).length;
    
    let totalParticipants = 0;
    const roomCount: Record<string, number> = {};
    const monthlyCount: Record<string, number> = {};

    meetings.forEach(m => {
      totalParticipants += m.participants.length;
      
      const roomName = m.room?.nama_ruangan || "Tanpa Ruangan";
      roomCount[roomName] = (roomCount[roomName] || 0) + 1;

      const monthName = format(new Date(m.tanggal), "MMM", { locale: id });
      monthlyCount[monthName] = (monthlyCount[monthName] || 0) + 1;
    });

    const popularRoom = Object.entries(roomCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
    
    // Prepare chart data
    const chartData = Object.entries(monthlyCount).map(([name, total]) => ({ name, total }));
    
    // For smooth visual curve if only 1 month of data exists
    if (chartData.length === 1) {
      chartData.unshift({ name: "", total: 0 });
      chartData.push({ name: " ", total: 0 });
    }

    return { totalMeetings, thisMonthMeetings, totalParticipants, popularRoom, chartData };
  }, [meetings]);

  if (meetings.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Rapat (Bulan Ini)</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.thisMonthMeetings}</h3>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Semua Rapat</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalMeetings}</h3>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Peserta Diundang</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats.totalParticipants}</h3>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Ruangan Terfavorit</p>
            <h3 className="text-xl font-bold text-slate-800 truncate">{stats.popularRoom}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-slate-100">
        <h3 className="text-lg font-bold font-heading text-slate-800 mb-6">Tren Frekuensi Rapat</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
