import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allUsers = await db.select({
    id: users.id,
    nip: users.nip,
    nama: users.nama,
    jabatan: users.jabatan,
    bidang: users.bidang,
    role: users.role,
    whatsapp_number: users.whatsapp_number,
    created_at: users.created_at
  }).from(users).orderBy(asc(users.nama));
  
  return NextResponse.json(allUsers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nip, nama, jabatan, bidang, role, password, whatsapp_number } = await req.json();

  if (!nip || !nama || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.nip, nip));
  if (existing.length > 0) {
    return NextResponse.json({ error: "NIP already registered" }, { status: 400 });
  }

  const hashedPassword = await hash(password, 10);

  const result = await db.insert(users).values({
    nip,
    nama,
    jabatan: jabatan || "-",
    bidang: bidang || "-",
    role: role || "pegawai",
    whatsapp_number: whatsapp_number || null,
    password: hashedPassword
  }).returning({
    id: users.id,
    nip: users.nip,
    nama: users.nama,
    role: users.role
  });

  return NextResponse.json(result[0]);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, nama, nip, jabatan, bidang, role, whatsapp_number } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await db.update(users)
    .set({ nama, nip, jabatan, bidang, role, whatsapp_number })
    .where(eq(users.id, parseInt(id)))
    .returning();

  return NextResponse.json(result[0]);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await db.delete(users).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
