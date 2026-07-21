import { pgTable, serial, varchar, integer, timestamp, text, date, time, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  nama_ruangan: varchar('nama_ruangan', { length: 100 }).notNull(),
  kapasitas: integer('kapasitas').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  nip: varchar('nip', { length: 20 }).notNull().unique(),
  nama: varchar('nama', { length: 150 }).notNull(),
  jabatan: varchar('jabatan', { length: 100 }).notNull(),
  bidang: varchar('bidang', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).default('pegawai'),
  whatsapp_number: varchar('whatsapp_number', { length: 20 }),
  password: varchar('password', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const meetings = pgTable('meetings', {
  id: serial('id').primaryKey(),
  judul_rapat: varchar('judul_rapat', { length: 255 }).notNull(),
  agenda: text('agenda').notNull(),
  tanggal: date('tanggal').notNull(),
  jam_mulai: time('jam_mulai').notNull(),
  jam_selesai: time('jam_selesai').notNull(),
  ruangan_id: integer('ruangan_id').references(() => rooms.id, { onDelete: 'set null' }),
  file_notulensi: varchar('file_notulensi', { length: 255 }),
  hasil_notulensi: text('hasil_notulensi'),
  status: varchar('status', { length: 20 }).default('terjadwal').notNull(), // terjadwal, berlangsung, selesai, batal
  created_by: integer('created_by').references(() => users.id).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const meetingParticipants = pgTable('meeting_participants', {
  id: serial('id').primaryKey(),
  meeting_id: integer('meeting_id').notNull().references(() => meetings.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status_kehadiran: varchar('status_kehadiran', { length: 20 }).default('pending'),
  alasan_izin: text('alasan_izin'),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  room: one(rooms, {
    fields: [meetings.ruangan_id],
    references: [rooms.id],
  }),
  creator: one(users, {
    fields: [meetings.created_by],
    references: [users.id],
  }),
  participants: many(meetingParticipants),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdMeetings: many(meetings),
  meetings: many(meetingParticipants),
}));

export const meetingParticipantsRelations = relations(meetingParticipants, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingParticipants.meeting_id],
    references: [meetings.id],
  }),
  user: one(users, {
    fields: [meetingParticipants.user_id],
    references: [users.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  meetings: many(meetings),
}));

export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: text('value'),
  updated_at: timestamp('updated_at').defaultNow(),
});
