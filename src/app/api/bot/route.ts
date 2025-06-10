export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Bot, webhookCallback } from 'grammy';
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

bot.on('message:text', async ctx => {
    await ctx.api.sendChatAction(ctx.chat.id, 'typing');
    const res = await fetch(`${process.env.BASE_URL}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ctx.message.text }),
    });
    const reply = await res.text();
    await ctx.api.editMessageText(ctx.chat.id, ctx.message.message_id, reply);
});

export const POST = webhookCallback(bot, 'std/http');
