import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const prompt = `
      Extract attendance data from this image or text. 
      Return ONLY a valid JSON array with objects containing:
      - subject: string (subject name)
      - attended: number (classes attended)
      - total: number (total classes)
      - percentage: number (attendance percentage)
    `;

    let result;
    if (file.type.startsWith('image/')) {
      const base64Data = buffer.toString('base64');
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      const text = buffer.toString('utf-8');
      result = await model.generateContent(`${prompt}\n\nData:\n${text}`);
    }

    const response = await result.response;
    let responseText = response.text();
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) responseText = jsonMatch[1];

    const data = JSON.parse(responseText);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Extract attendance error:', error);
    return NextResponse.json({ error: 'Failed to extract attendance data' }, { status: 500 });
  }
}