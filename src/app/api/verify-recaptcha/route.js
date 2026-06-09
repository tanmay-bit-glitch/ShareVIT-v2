import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token missing' }, { status: 400 });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      // Bypass in dev
      return NextResponse.json({ success: true, score: 1.0 });
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
    const response = await fetch(verifyUrl, { method: 'POST' });
    const data = await response.json();

    if (data.success && data.score >= 0.5) {
      return NextResponse.json({ success: true, score: data.score });
    } else {
      return NextResponse.json({ success: false, error: 'reCAPTCHA verification failed', score: data.score }, { status: 403 });
    }
  } catch (error) {
    console.error('reCAPTCHA error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}