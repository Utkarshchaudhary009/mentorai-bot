import { google } from '@ai-sdk/google';
import { CoreMessage, generateText } from 'ai';
import { NextResponse } from 'next/server';

const model = google('gemini-1.5-flash-latest');
const HISTORY_LENGTH = 50; // 25 conversations
const EXPIRATION_SECONDS = 3600; // 1 hour

// In-memory storage with expiration timestamps
const conversationStore: Record<string, {
    messages: CoreMessage[];
    expiry: number;
}> = {};

// // Cleanup expired conversations periodically
// const cleanupInterval = setInterval(() => {
//     const now = Date.now();
//     Object.keys(conversationStore).forEach(key => {
//         if (conversationStore[key].expiry < now) {
//             delete conversationStore[key];
//         }
//     });
// }, 60000); // Run every minute

export const maxDuration = 60;

export async function POST(req: Request) {
    // Destructure userId and text from the request body
    const { text, userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    // Create a user-specific key
    const conversationKey = `mentorai:history:${userId}`;
    const now = Date.now();

    // Initialize or get existing conversation
    if (!conversationStore[conversationKey] || conversationStore[conversationKey].expiry < now) {
        conversationStore[conversationKey] = {
            messages: [],
            expiry: now + (EXPIRATION_SECONDS * 1000)
        };
    }

    // Get history and reset expiration
    const history = conversationStore[conversationKey].messages;
    conversationStore[conversationKey].expiry = now + (EXPIRATION_SECONDS * 1000);

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
        // Add new messages to history
        conversationStore[conversationKey].messages = [
            { role: 'assistant' as const, content: aiResponse },
            { role: 'user' as const, content: text },
            ...history
        ].slice(0, HISTORY_LENGTH);
    }

    return NextResponse.json(aiResponse);
}