// const { Client, LocalAuth } = require('whatsapp-web.js');

// // Initialize WhatsApp client
// const client = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: {
//     headless: true,
//     args: ['--no-sandbox']
//   }
// });

// // Define your Google Form links
// const PR_SLIP_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfRvoxIljh5V7YloiejgUxsaF0QcHsugoYkOXx5mA2AXpRTMg/viewform?usp=dialog';
// const BANK_RECEIPT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSf7pu53M2nVgAJ3prIY4X8ots-OXiDXpYHR4pSPFjinJQgQpw/viewform?usp=header';

// client.on('qr', (qr) => {
//   console.log('📱 Scan this QR code with WhatsApp:');
//   console.log(qr);
// });

// client.on('ready', () => {
//   console.log('✅ WhatsApp bot is ready!');
// });

// client.on('message', async (msg) => {
//   const text = msg.body.trim().toLowerCase();

//   if (text === 'menu' || text === 'hi') {
//     await msg.reply(
//       `بایوفورس واٹس ایپ پورٹل میں خوش آمدید 👋\آپ کیا کرنا چاہیں گے؟ آپشن نمبر لکھ کر جواب دیں۔\n\n` +
//       `1.پی آر سلپ بھیجیں 📤\n2. موصولی انوائس بھیجیں 🧾\n3. وزٹ رپورٹ جمع کرائیں 📅`
//     );
//   }

//   else if (text === '1') {
//     await msg.reply(`دیے گئے فارم کو کھولیں اور اپنی پی آر سلپ کی تفصیلات شامل کریں اور بینک کی سلپ کی تصویر اپ لوڈ کریں۔ 📤\n${PR_SLIP_FORM_URL}`);
//   }

//   else if (text === '2') {
//     await msg.reply(`دیے گئے فارم کو کھولیں اور اپنی وصولی کی تفصیلات شامل کریں اور وصولی کی انوائس کی تصویر شامل کریں۔ 🧾\n${BANK_RECEIPT_FORM_URL}`);
//   }

//   else if (text === '3') {
//     await msg.reply('دیے گئے فارم کو کھولیں اور اپنی وزٹ کی رپورٹ شامل کریں۔ 📅');
//   }

//   else {
//     // await msg.reply(
//     //   `❓ Invalid option.\nPlease type *menu* to see available choices.`
//     // );
//   }
// });

// client.initialize();

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');
const axios = require('axios');
const app = express();
const PORT = 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', (qr) => {
  const qrcode = require('qrcode-terminal');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot is ready!');
});

client.initialize();

// Receive webhook from Apps Script
app.use(express.json());

app.post('/send', async (req, res) => {
  const { phone, fileId } = req.body;

  console.log(`📩 Received request for ${phone} with file ID ${fileId}`);

  try {
    const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }  // Helps bypass some Google Drive restrictions
    });

    const media = new MessageMedia('application/pdf', response.data.toString('base64'), 'receipt.pdf');

    const chatId = `${phone}@c.us`;

    await client.sendMessage(chatId, media, { caption: '✅ آپ کی پی آر رسید منظور ہو گئی ہے۔ یہ رہی!' });

    console.log(`✅ Receipt sent to ${phone}`);
    res.send({ success: true });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).send({ error: 'Failed to send' });
  }
});
app.listen(PORT, () => {
  console.log(`🌐 Webhook server running on http://localhost:${PORT}`);
});
