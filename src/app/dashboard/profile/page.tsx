"use client";

import { useSession } from "next-auth/react";
import { UserCircle, Send, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: session } = useSession(); 

  useEffect(() => {
  }, []);

  if (!session) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Profil Pengguna</h1>
        
        <div className="flex items-start gap-6 mb-8 pb-8 border-b border-slate-100">
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <UserCircle className="w-16 h-16 text-slate-400" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 font-medium">Nama Lengkap</p>
                <p className="text-lg font-semibold text-slate-800">{session.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">NIP</p>
                <p className="text-lg font-semibold text-slate-800">{session.user.nip}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Jabatan</p>
                <p className="text-slate-800">{session.user.jabatan}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Bidang</p>
                <p className="text-slate-800">{session.user.bidang}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-500" />
            Integrasi Notifikasi WhatsApp (Fonnte)
          </h2>
          
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
            <p className="text-slate-700 mb-4 leading-relaxed">
              Pastikan Anda sudah melengkapi nomor WhatsApp aktif Anda dengan Admin Sekretariat. 
              Sistem akan mengirimkan undangan rapat dan pengingat (H-1) langsung ke nomor WhatsApp Anda secara personal (Japri).
            </p>

            <ol className="list-decimal list-inside space-y-2 text-slate-600 mb-6">
              <li>Pesan akan dikirim dari nomor WhatsApp Gateway Kantor BAPENDA.</li>
              <li>Sistem akan menyertakan tautan detail rapat dan jadwal yang bisa Anda akses langsung.</li>
            </ol>

            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-medium border border-slate-200">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Sistem Notifikasi Japri Aktif
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
