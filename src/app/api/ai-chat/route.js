import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are ShareVIT AI Assistant — a helpful, friendly academic assistant for students at Vishwakarma Institute of Technology (VIT), Pune.
You help with:
- Explaining academic concepts across engineering branches
- Answering questions about subjects, formulas, derivations
- Study tips, exam preparation strategies
- VIT Pune specific queries (departments, semesters, grading)
- General coding help and project guidance

Be concise, friendly, and use examples when helpful. Use markdown formatting for better readability.
If asked about something non-academic or inappropriate, politely redirect to academic topics.`;

export async function POST(request) {
  try {
    const { message, history } = await request.json();
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'You are the ShareVIT AI assistant. Follow these instructions: ' + SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'I understand! I\'m the ShareVIT AI Assistant, ready to help VIT Pune students with their academic needs. How can I help you today?' }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({ error: 'AI service temporarily unavailable. Please try again.' }, { status: 500 });
  }
}