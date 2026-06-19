import { NextResponse } from 'next/server';
import { sendSupportTicketEmail } from '@/lib/mail';

export async function POST(request) {
  try {
    const ticketData = await request.json();
    
    if (!ticketData?.reportId || !ticketData?.title || !ticketData?.description) {
      return NextResponse.json({ error: 'Report ID, title, and description are required' }, { status: 400 });
    }

    // Send email to administrator
    await sendSupportTicketEmail(ticketData);

    return NextResponse.json({ success: true, message: 'Support email sent successfully' });
  } catch (error) {
    console.error('Error sending support email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
