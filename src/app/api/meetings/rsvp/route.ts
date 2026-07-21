import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetingParticipants } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { meeting_id, status_kehadiran, alasan_izin } = await req.json();

    if (!meeting_id || !status_kehadiran) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const userId = parseInt(session.user.id);

    await db.update(meetingParticipants)
      .set({
        status_kehadiran,
        alasan_izin: alasan_izin || null
      })
      .where(
        and(
          eq(meetingParticipants.meeting_id, meeting_id),
          eq(meetingParticipants.user_id, userId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("RSVP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
