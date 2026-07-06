import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from './_lib/firebase.js';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; username?: string; first_name: string; last_name?: string };
    chat: { id: number };
    text?: string;
    date: number;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  try {
    const update: TelegramUpdate = req.body;
    const msg = update.message;
    if (!msg || !msg.text) return res.status(200).json({ ok: true });

    // Ignore bot commands
    if (msg.text.startsWith('/start') || msg.text.startsWith('/help')) {
      // Auto-reply with instructions
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: msg.chat.id,
            text: 'Welcome to BonusByte Support! Send us your message and our team will respond shortly.',
          }),
        }
      );
      return res.status(200).json({ ok: true });
    }

    // Store message in Firestore
    const messageId = `${msg.from.id}_${msg.message_id}`;
    await db.collection('support_messages').doc(messageId).set({
      messageId:   msg.message_id,
      telegramId:  String(msg.from.id),
      username:    msg.from.username ?? '',
      firstName:   msg.from.first_name ?? 'User',
      lastName:    msg.from.last_name ?? '',
      text:        msg.text,
      date:        msg.date * 1000, // convert to ms
      status:      'new',
      chatId:      msg.chat.id,
      createdAt:   Date.now(),
    });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    console.error('[webhook]', err);
    return res.status(200).json({ ok: true }); // always return 200 to Telegram
  }
}
