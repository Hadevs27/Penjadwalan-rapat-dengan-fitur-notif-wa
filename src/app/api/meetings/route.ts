import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetings, meetingParticipants, users, rooms } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import axios from "axios";
import { format } from "date-fns";
import { eq, or, and, lt, gt, lte, gte, inArray, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter");

  let result;
  
  if (filter === 'my_meetings' && session.user.role !== 'admin') {
    result = await db.query.meetings.findMany({
      where: (meetings, { inArray }) => 
        inArray(
          meetings.id,
          db.select({ meeting_id: meetingParticipants.meeting_id })
            .from(meetingParticipants)
            .where(eq(meetingParticipants.user_id, parseInt(session.user.id)))
        ),
      with: {
        room: true,
        creator: { columns: { nama: true } },
        participants: {
          with: {
            user: { columns: { nama: true, bidang: true } }
          }
        }
      },
      orderBy: [desc(meetings.tanggal)]
    });
  } else {
    result = await db.query.meetings.findMany({
      with: {
        room: true,
        creator: { columns: { nama: true } },
        participants: {
          with: {
            user: { columns: { nama: true, bidang: true } }
          }
        }
      },
      orderBy: [desc(meetings.tanggal)]
    });
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { judul_rapat, agenda, tanggal, jam_mulai, jam_selesai, ruangan_id, participant_ids } = await req.json();

  if (!judul_rapat || !tanggal || !jam_mulai || !jam_selesai || !ruangan_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tglDate = tanggal; // In Drizzle, date field accepts YYYY-MM-DD string
  const startDateTime = `${jam_mulai}:00`; 
  const endDateTime = `${jam_selesai}:00`;

  // Validasi Kapasitas Ruangan
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, parseInt(ruangan_id))
  });

  if (!room) {
    return NextResponse.json({ error: "Ruangan tidak ditemukan." }, { status: 404 });
  }

  if (participant_ids.length > room.kapasitas) {
    return NextResponse.json({ 
      error: `Kapasitas berlebih! Ruangan '${room.nama_ruangan}' hanya muat untuk ${room.kapasitas} orang (Anda memilih ${participant_ids.length} orang).` 
    }, { status: 400 });
  }

  // Validasi Bentrok
  const overlap = await db.select().from(meetings).where(
    and(
      eq(meetings.ruangan_id, parseInt(ruangan_id)),
      eq(meetings.tanggal, tglDate),
      eq(meetings.status, 'scheduled'),
      or(
        and(
          lte(meetings.jam_mulai, startDateTime),
          gt(meetings.jam_selesai, startDateTime)
        ),
        and(
          lt(meetings.jam_mulai, endDateTime),
          gte(meetings.jam_selesai, endDateTime)
        ),
        and(
          gte(meetings.jam_mulai, startDateTime),
          lte(meetings.jam_selesai, endDateTime)
        )
      )
    )
  );

  if (overlap.length > 0) {
    return NextResponse.json({ error: "Ruangan telah dibooking pada jam tersebut." }, { status: 400 });
  }

  // Insert meeting
  const newMeetingRes = await db.insert(meetings).values({
    judul_rapat,
    agenda,
    tanggal: tglDate,
    jam_mulai: startDateTime,
    jam_selesai: endDateTime,
    ruangan_id: parseInt(ruangan_id),
    created_by: parseInt(session.user.id),
  }).returning();

  const newMeeting = newMeetingRes[0];

  // Insert participants
  if (participant_ids.length > 0) {
    const partsData = participant_ids.map((id: number) => ({
      meeting_id: newMeeting.id,
      user_id: id,
      status_kehadiran: 'pending'
    }));
    await db.insert(meetingParticipants).values(partsData);
  }

  // Fetch complete meeting data for notification
  const completeMeeting = await db.query.meetings.findFirst({
    where: eq(meetings.id, newMeeting.id),
    with: {
      room: true,
      participants: {
        with: { user: true }
      }
    }
  });

  return NextResponse.json(completeMeeting);
}
