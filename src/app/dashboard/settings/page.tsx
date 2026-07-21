"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings as SettingsIcon, Save, Key } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [fonnteToken, setFonnteToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        const fonnteSetting = data.find((d: any) => d.key === "fonnte_token");
        if (fonnteSetting) {
          setFonnteToken(fonnteSetting.value);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "fonnte_token", value: fonnteToken }),
      });
      
      if (res.ok) {
        alert("Pengaturan berhasil disimpan!");
      } else {
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (session?.user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Akses Ditolak. Anda bukan admin.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-800">Pengaturan Sistem</h1>
            <p className="text-slate-500 mt-1">Kelola konfigurasi API dan variabel sistem lainnya.</p>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-6 border border-slate-200/60">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-heading text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key className="w-5 h-5 text-amber-500" /> API WhatsApp (Fonnte)
            </h3>
            <p className="text-sm text-slate-500">
              Token ini digunakan untuk mengirimkan pesan pengingat (notifikasi) jadwal rapat ke nomor WhatsApp pegawai.
              Jika dikosongkan, sistem akan kembali membaca token dari file .env default server.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fonnte API Token</label>
              {loading ? (
                <div className="w-full h-11 bg-slate-100 animate-pulse rounded-xl"></div>
              ) : (
                <input 
                  type="text" 
                  value={fonnteToken}
                  onChange={(e) => setFonnteToken(e.target.value)}
                  placeholder="Misal: ABCD1234XYZ..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm font-mono"
                />
              )}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={saving || loading} 
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-brand-500/20"
            >
              <Save className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
