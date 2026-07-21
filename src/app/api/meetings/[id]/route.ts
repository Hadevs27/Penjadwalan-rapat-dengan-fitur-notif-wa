import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetings, meetingParticipants, rooms } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, and, not, or, lte, gt, lt, gte } from "drizzle-orm";
import axios from "axios";
import { format } from "date-fns";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const meetingId = parseInt(id);
  const body = await req.json();

  const { judul_rapat, agenda, tanggal, jam_mulai, jam_selesai, ruangan_id, participant_ids, status } = body;

  // Jika update status saja (misal Mulai/Selesai/Batal)
  if (status && !judul_rapat) {
    const res = await db.update(meetings).set({ status }).where(eq(meetings.id, meetingId)).returning();
    return NextResponse.json(res[0]);
  }

  // Jika update data rapat (Reschedule/Edit)
  if (!judul_rapat || !tanggal || !jam_mulai || !jam_selesai || !ruangan_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Handle format jam (tambahkan :00 jika hanya HH:mm)
  const startDateTime = jam_mulai.length === 5 ? `${jam_mulai}:00` : jam_mulai;
  const endDateTime = jam_selesai.length === 5 ? `${jam_selesai}:00` : jam_selesai;

  // Validasi Kapasitas
  if (participant_ids) {
    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, parseInt(ruangan_id))
    });
    if (room && participant_ids.length > room.kapasitas) {
      return NextResponse.json({ error: `Kapasitas berlebih! Ruangan hanya muat ${room.kapasitas} orang.` }, { status: 400 });
    }
  }

  // Validasi Bentrok (exclude current meeting)
  const overlap = await db.select().from(meetings).where(
    and(
      not(eq(meetings.id, meetingId)),
      eq(meetings.ruangan_id, parseInt(ruangan_id)),
      eq(meetings.tanggal, tanggal),
      or(eq(meetings.status, 'terjadwal'), eq(meetings.status, 'berlangsung')),
      or(
        and(lte(meetings.jam_mulai, startDateTime), gt(meetings.jam_selesai, startDateTime)),
        and(lt(meetings.jam_mulai, endDateTime), gte(meetings.jam_selesai, endDateTime)),
        and(gte(meetings.jam_mulai, startDateTime), lte(meetings.jam_selesai, endDateTime))
      )
    )
  );

  if (overlap.length > 0) {
    return NextResponse.json({ error: "Ruangan telah dibooking pada jam tersebut." }, { status: 400 });
  }

  // 1. Update Rapat
  const updateData: any = {
    judul_rapat,
    agenda,
    tanggal,
    jam_mulai: startDateTime,
    jam_selesai: endDateTime,
    ruangan_id: parseInt(ruangan_id),
  };
  if (status) updateData.status = status;

  await db.update(meetings).set(updateData).where(eq(meetings.id, meetingId));

  // 2. Update Participants (Jika dikirim)
  if (participant_ids && Array.isArray(participant_ids)) {
    // Ambil peserta saat ini
    const currentParts = await db.select().from(meetingParticipants).where(eq(meetingParticipants.meeting_id, meetingId));
    const currentIds = currentParts.map(p => p.user_id);
    
    // Yg perlu dihapus: ada di current, tapi ga ada di payload
    const toDelete = currentIds.filter(id => !participant_ids.includes(id));
    if (toDelete.length > 0) {
      await db.delete(meetingParticipants).where(
        and(eq(meetingParticipants.meeting_id, meetingId), or(...toDelete.map(uid => eq(meetingParticipants.user_id, uid))))
      );
    }
    
    // Yg perlu ditambah: ada di payload, tapi ga ada di current
    const toAdd = participant_ids.filter(id => !currentIds.includes(id));
    if (toAdd.length > 0) {
      await db.insert(meetingParticipants).values(
        toAdd.map(uid => ({ meeting_id: meetingId, user_id: uid, status_kehadiran: 'pending' }))
      );
    }
  }

  // Ambil data terbaru untuk response
  const updatedMeeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, meetingId),
    with: { room: true, participants: { with: { user: true } } }
  });

  return NextResponse.json(updatedMeeting);
}
