import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select().from(rooms);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nama_ruangan, kapasitas } = await req.json();

  if (!nama_ruangan || !kapasitas) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await db.insert(rooms).values({
    nama_ruangan,
    kapasitas: parseInt(kapasitas),
  }).returning();

  return NextResponse.json(result[0]);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, nama_ruangan, kapasitas } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await db.update(rooms)
    .set({ nama_ruangan, kapasitas: parseInt(kapasitas) })
    .where(eq(rooms.id, parseInt(id)))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(rooms).where(eq(rooms.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
