import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
const model = google('gemini-2.0-flash-lite-preview-02-05');

export const maxDuration = 60;

export async function POST(req: Request) {
    const { text } = await req.json();
    const result = await generateText({
        model,
        system: 'You are MentorAI — a friendly, insightful mentor.',
        messages: [{ role: 'user', content: text }],
        providerOptions: {
            google: {
                responseModalities: ['TEXT'],
            },
        },
    });
    return NextResponse.json(result.text);
}
