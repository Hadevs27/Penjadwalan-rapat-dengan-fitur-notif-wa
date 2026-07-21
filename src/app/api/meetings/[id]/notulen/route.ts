import { NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const meetingId = parseInt(id);
  const meeting = await db.select().from(meetings).where(eq(meetings.id, meetingId));
  
  if (meeting.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(meeting[0]);
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const meetingId = parseInt(id);
  const { hasil_notulensi } = await req.json();

  const result = await db.update(meetings)
    .set({ hasil_notulensi })
    .where(eq(meetings.id, meetingId))
    .returning();

  return NextResponse.json(result[0]);
}
