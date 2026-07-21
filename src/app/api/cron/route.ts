import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetings, appSettings } from "@/db/schema";
import { format, addHours, startOfMinute, endOfMinute } from "date-fns";
import axios from "axios";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(req: Request) {
  // Verifikasi token cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    // Cari jadwal 1 jam dari sekarang
    const oneHourLater = addHours(now, 1);
    const dateStr = format(oneHourLater, 'yyyy-MM-dd');
    const startTarget = format(startOfMinute(oneHourLater), 'HH:mm:ss');
    const endTarget = format(endOfMinute(oneHourLater), 'HH:mm:ss');

    const upcomingMeetings = await db.query.meetings.findMany({
      where: and(
        eq(meetings.status, 'terjadwal'),
        eq(meetings.tanggal, dateStr),
        gte(meetings.jam_mulai, startTarget),
        lte(meetings.jam_mulai, endTarget)
      ),
      with: {
        room: true,
        participants: {
          with: { user: true }
        }
      }
    });

    const dbSettings = await db.select().from(appSettings).where(eq(appSettings.key, 'fonnte_token'));
    const fonnteToken = dbSettings.length > 0 && dbSettings[0].value ? dbSettings[0].value : process.env.FONNTE_TOKEN;
    
    if (!fonnteToken) {
      return NextResponse.json({ error: "Missing Fonnte Token" }, { status: 500 });
    }

    let sent = 0;
    for (const meeting of upcomingMeetings) {
      try {
        const targets = meeting.participants
          .filter(p => p.user.whatsapp_number)
          .map(p => p.user.whatsapp_number)
          .join(',');

        if (targets) {
          const text = `⏰ *REMINDER: RAPAT 1 JAM LAGI*\n\nAgenda rapat akan segera dimulai 1 jam dari sekarang.\n\n📌 *Agenda:* ${meeting.agenda}\n🏢 *Tempat:* ${meeting.room?.nama_ruangan}\n\nMohon segera bersiap dan menuju ke ruangan.`;
          
          const formData = new URLSearchParams();
          formData.append('target', targets);
          formData.append('message', text);

          await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: { 
              "Authorization": fonnteToken,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formData
          });
          sent++;
        }
      } catch (e) {
        console.error("Failed sending reminder broadcast for meeting:", meeting.id);
      }
    }

    return NextResponse.json({ ok: true, sent_count: sent });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
