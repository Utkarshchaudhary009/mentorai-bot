export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { Bot, webhookCallback,Context } from 'grammy';
import { ReplyWithMarkdownFlavour, replyWithMarkdownPlugin } from '@vlad-yakovlev/grammy-reply-with-markdown';

const bot = new Bot<Context & ReplyWithMarkdownFlavour>(process.env.TELEGRAM_BOT_TOKEN!);
bot.use(replyWithMarkdownPlugin());

bot.on('message:text', async ctx => {
    await ctx.api.sendChatAction(ctx.chat.id, 'typing');
    const res = await fetch(`${process.env.BASE_URL}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ctx.message.text }),
    });
    const reply = await res.json();
    await ctx.replyWithMarkdown(reply);
});

export const POST = webhookCallback(bot, 'std/http');
