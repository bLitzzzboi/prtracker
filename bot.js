const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

let latestQR = '';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', async (qr) => {
  latestQR = qr;
  console.log('⚠️ New QR code generated. Visit /qr to scan.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot is ready!');
});

client.initialize();

app.use(express.json());

app.get('/qr', async (req, res) => {
  if (!latestQR) return res.send('QR not generated yet. Please wait.');
  const qrImage = await qrcode.toDataURL(latestQR);
  res.send(`
    <html>
      <body style="text-align:center">
        <h2>Scan this QR code with WhatsApp</h2>
        <img src="${qrImage}" />
      </body>
    </html>
  `);
});

// existing /send route
app.post('/send', async (req, res) => {
  const { phone, fileId } = req.body;

  if (!phone || !fileId) {
    return res.status(400).send({ error: 'Missing phone or fileId' });
  }

  try {
    const fileUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const media = new MessageMedia(
      'application/pdf',
      Buffer.from(response.data, 'binary').toString('base64'),
      'receipt.pdf'
    );

    const chatId = `${phone}@c.us`;
    await client.sendMessage(chatId, media, {
      caption: '✅ آپ کی پی آر رسید منظور ہو گئی ہے۔ یہ رہی!'
    });

    console.log(`✅ Receipt sent to ${phone}`);
    res.send({ success: true });
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    res.status(500).send({ error: 'Failed to send message' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server is running at http://localhost:${PORT}`);
});
