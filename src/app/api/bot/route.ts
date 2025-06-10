export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { Bot, webhookCallback, Context } from 'grammy';
import { ReplyWithMarkdownFlavour, replyWithMarkdownPlugin } from '@vlad-yakovlev/grammy-reply-with-markdown';

const bot = new Bot<Context & ReplyWithMarkdownFlavour>(process.env.TELEGRAM_BOT_TOKEN!);
bot.use(replyWithMarkdownPlugin());

bot.on('message:text', async ctx => {
    await ctx.api.sendChatAction(ctx.chat.id, 'typing');

    const res = await fetch(`${process.env.BASE_URL}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass both the message text and the chat ID as the unique user identifier
        body: JSON.stringify({
            text: ctx.message.text,
            userId: ctx.chat.id 
        }),
    });

    if (res.ok) {
        const reply = await res.json();
        await ctx.replyWithMarkdown(reply);
    } else {
        console.error('API request failed:', await res.text());
        await ctx.replyWithMarkdown('Sorry, something went wrong. Please try again later.');
    }
});

export const POST = webhookCallback(bot, 'std/http');