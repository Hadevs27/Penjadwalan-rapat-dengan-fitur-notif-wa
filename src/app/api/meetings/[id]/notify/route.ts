import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetings, appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { format } from "date-fns";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const meetingId = parseInt(id);

  const completeMeeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: {
      room: true,
      participants: {
        with: { user: true }
      }
    }
  });

  if (!completeMeeting) {
    return NextResponse.json({ error: "Rapat tidak ditemukan" }, { status: 404 });
  }

  const dbSettings = await db.select().from(appSettings).where(eq(appSettings.key, 'fonnte_token'));
  const fonnteToken = dbSettings.length > 0 && dbSettings[0].value ? dbSettings[0].value : process.env.FONNTE_TOKEN;
  
  if (!fonnteToken) {
    return NextResponse.json({ error: "Fonnte Token tidak ditemukan di pengaturan maupun .env" }, { status: 500 });
  }

  try {
    const targets = completeMeeting.participants
      .filter(p => p.user.whatsapp_number)
      .map(p => p.user.whatsapp_number)
      .join(',');

    if (!targets) {
      return NextResponse.json({ error: "Tidak ada peserta dengan nomor WhatsApp valid" }, { status: 400 });
    }

    const text = `📢 *UNDANGAN RAPAT BARU*\n\n📌 *Agenda:* ${completeMeeting.agenda}\n📅 *Waktu:* ${format(new Date(completeMeeting.tanggal), 'dd MMM yyyy')}\n⏰ *Pukul:* ${completeMeeting.jam_mulai.substring(0,5)} s.d ${completeMeeting.jam_selesai.substring(0,5)} WIB\n🏢 *Tempat:* ${completeMeeting.room?.nama_ruangan}\n\nAnda terdaftar sebagai peserta pada rapat ini. Mohon kehadiran Bapak/Ibu tepat pada waktunya. Konfirmasi kehadiran dapat dilakukan melalui Dashboard BAPENDA.`;
    
    const formData = new URLSearchParams();
    formData.append('target', targets);
    formData.append('message', text);

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { 
        "Authorization": fonnteToken,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });

    const fonnteData = await fonnteRes.json();
    return NextResponse.json({ success: true, data: fonnteData });
  } catch (e) {
    console.error("Failed to broadcast whatsapp:", e);
    return NextResponse.json({ error: "Gagal mengirim notifikasi" }, { status: 500 });
  }
}
