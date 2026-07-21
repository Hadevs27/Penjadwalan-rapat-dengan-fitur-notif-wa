require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`ALTER TABLE users RENAME COLUMN telegram_chat_id TO whatsapp_number;`;
    console.log("Renamed successfully");
  } catch (e) {
    console.error("Error or already renamed:", e.message);
  }
}
main();
