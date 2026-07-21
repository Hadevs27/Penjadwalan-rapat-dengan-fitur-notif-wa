import 'dotenv/config';
import { db } from './index';
import { users, rooms, meetings, meetingParticipants } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { format, addDays } from 'date-fns';

async function main() {
  console.log('Seeding dummy data...');

  // 1. Clean existing data (optional, but good for fresh seed)
  // We'll just append if they don't exist, to avoid breaking things, 
  // but for a true fresh seed we could truncate. 
  // Since Drizzle kit push will create fresh tables if they don't exist, we just insert.

  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('pegawai123', 10);
  
  // Seed Users
  const dummyUsers = [
    { nip: 'admin', nama: 'Super Admin', jabatan: 'Administrator', bidang: 'Sekretariat', role: 'admin', password: adminPassword },
    { nip: '198001012005011001', nama: 'Budi Santoso', jabatan: 'Kepala Bidang', bidang: 'Pajak Daerah', role: 'pegawai', password: userPassword },
    { nip: '198502022010022002', nama: 'Siti Aminah', jabatan: 'Staf Analis', bidang: 'Retribusi', role: 'pegawai', password: userPassword },
    { nip: '199003032015031003', nama: 'Agus Pratama', jabatan: 'Staf IT', bidang: 'Pusdatin', role: 'pegawai', password: userPassword },
  ];

  const insertedUsers = [];
  for (const u of dummyUsers) {
    const existing = await db.select().from(users).where(eq(users.nip, u.nip));
    if (existing.length === 0) {
      const res = await db.insert(users).values(u).returning();
      insertedUsers.push(res[0]);
    } else {
      insertedUsers.push(existing[0]);
    }
  }
  console.log('Users seeded.');

  // Seed Rooms
  const dummyRooms = [
    { nama_ruangan: 'Ruang Rapat Utama (Lt. 2)', kapasitas: 30 },
    { nama_ruangan: 'Ruang Rapat Bidang Pajak (Lt. 3)', kapasitas: 15 },
    { nama_ruangan: 'Aula BAPENDA', kapasitas: 100 },
  ];

  const insertedRooms = [];
  for (const r of dummyRooms) {
    const existing = await db.select().from(rooms).where(eq(rooms.nama_ruangan, r.nama_ruangan));
    if (existing.length === 0) {
      const res = await db.insert(rooms).values(r).returning();
      insertedRooms.push(res[0]);
    } else {
      insertedRooms.push(existing[0]);
    }
  }
  console.log('Rooms seeded.');

  // Seed Meetings
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);

  const dummyMeetings = [
    {
      judul_rapat: 'Evaluasi Pajak Daerah Q2',
      agenda: 'Membahas realisasi penerimaan pajak daerah kuartal kedua dan strategi pencapaian target.',
      tanggal: format(tomorrow, 'yyyy-MM-dd'),
      jam_mulai: '09:00:00',
      jam_selesai: '11:30:00',
      ruangan_id: insertedRooms[0].id,
      created_by: insertedUsers[0].id,
      status: 'scheduled',
    },
    {
      judul_rapat: 'Rapat Koordinasi Retribusi',
      agenda: 'Sinkronisasi data retribusi parkir dan pasar.',
      tanggal: format(nextWeek, 'yyyy-MM-dd'),
      jam_mulai: '13:00:00',
      jam_selesai: '15:00:00',
      ruangan_id: insertedRooms[1].id,
      created_by: insertedUsers[0].id,
      status: 'scheduled',
    }
  ];

  for (const m of dummyMeetings) {
    const existing = await db.select().from(meetings).where(eq(meetings.judul_rapat, m.judul_rapat));
    if (existing.length === 0) {
      const newMeeting = await db.insert(meetings).values(m).returning();
      
      // Add participants
      await db.insert(meetingParticipants).values([
        { meeting_id: newMeeting[0].id, user_id: insertedUsers[1].id, status_kehadiran: 'pending' },
        { meeting_id: newMeeting[0].id, user_id: insertedUsers[2].id, status_kehadiran: 'pending' },
        { meeting_id: newMeeting[0].id, user_id: insertedUsers[3].id, status_kehadiran: 'pending' },
      ]);
    }
  }

  console.log('Meetings & Participants seeded.');
  console.log('Seeding complete! ✨');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
