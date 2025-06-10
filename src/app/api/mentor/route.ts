import { google } from '@ai-sdk/google';
import { streamText } from 'ai';
const model = google('gemini-2.0-flash-lite-preview-02-05');

export const maxDuration = 60;

export async function POST(req: Request) {
    const { text } = await req.json();
    const result = await streamText({
        model,
        system: 'You are MentorAI — a friendly, insightful mentor.',
        messages: [{ role: 'user', content: text }],
        providerOptions: {
            google: {
                responseModalities: ['TEXT'],
            },
        },
    });
    return result.toDataStreamResponse();
}
