import 'dotenv/config';
import axios from 'axios';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ TELEGRAM_BOT_TOKEN tidak ditemukan di .env");
  process.exit(1);
}

const API_URL = `https://api.telegram.org/bot${token}`;
let offset = 0;

async function poll() {
  try {
    const res = await axios.get(`${API_URL}/getUpdates?offset=${offset}&timeout=30`);
    const updates = res.data.result;

    if (updates && updates.length > 0) {
      for (const update of updates) {
        offset = update.update_id + 1;
        
        // Teruskan data ke API lokal Webhook BAPENDA
        try {
          await axios.post('http://localhost:3000/api/telegram/webhook', update);
          console.log(`✅ Update [${update.update_id}] berhasil diteruskan ke localhost:3000`);
        } catch (postErr: any) {
          console.error(`❌ Gagal meneruskan ke localhost: ${postErr.message}`);
        }
      }
    }
  } catch (err: any) {
    console.error('⚠️ Polling error (Timeout/Jaringan):', err.message);
  }
  
  // Looping rekursif untuk terus mendengarkan pesan baru
  setTimeout(poll, 1000);
}

console.log('🚀 Telegram Local Polling berjalan...');
console.log('Menunggu chat/start dari user...');
poll();
