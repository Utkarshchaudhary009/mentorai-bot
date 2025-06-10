import { google } from '@ai-sdk/google';
import { CoreMessage, generateText } from 'ai';
import { NextResponse } from 'next/server';
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redis: Awaited<ReturnType<typeof createClient>> | null = null;

try {
    redis = await createClient({ url: redisUrl }).connect();
} catch (e) {
    console.error('Failed to connect to Redis:', e);
}

const model = google('gemini-1.5-flash-latest');
const HISTORY_LENGTH = 50; // 25 conversations
const EXPIRATION_SECONDS = 3600; // 1 hour

export const maxDuration = 60;

export async function POST(req: Request) {
    if (!redis) {
        return NextResponse.json(
            { error: 'Redis client is not connected.' },
            { status: 500 }
        );
    }

    // Destructure userId and text from the request body
    const { text, userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Create a user-specific key
    const conversationKey = `mentorai:history:${userId}`;

    const rawHistory = await redis.lRange(conversationKey, 0, HISTORY_LENGTH - 1);
    const history: CoreMessage[] = rawHistory.map((item) => JSON.parse(item)).reverse();

    const messages: CoreMessage[] = [
        ...history,
        { role: 'user', content: text },
    ];

    const result = await generateText({
        model,
        system: `You are MentorAI, an AI mentor...`, // System prompt
        messages: messages,
        providerOptions: {
            google: {
                responseMimeType: 'text/plain',
            },
        },
    });

    const aiResponse = result.text;

    if (aiResponse) {
        const userMessage = JSON.stringify({ role: 'user', content: text });
        const assistantMessage = JSON.stringify({ role: 'assistant', content: aiResponse });

        // Use a transaction to store messages, trim the list, and set expiration
        await redis.multi()
            .lPush(conversationKey, assistantMessage)
            .lPush(conversationKey, userMessage)
            .lTrim(conversationKey, 0, HISTORY_LENGTH - 1)
            .expire(conversationKey, EXPIRATION_SECONDS) // Set/reset the 1-hour expiration
            .exec();
    }

    return NextResponse.json(aiResponse);
}