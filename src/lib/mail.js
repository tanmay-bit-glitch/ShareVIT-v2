import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(to, otp, name = 'Student') {
  const mailOptions = {
    from: `"ShareVIT" <${process.env.SMTP_USER}>`,
    to,
    subject: `ShareVIT - Your Verification Code: ${otp}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0;">Share<span style="color: #6366f1;">VIT</span></h1>
          <p style="color: #a0a0b8; margin-top: 8px;">Student Resource Platform</p>
        </div>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #a0a0b8; margin-bottom: 16px;">Hello ${name},</p>
          <p style="margin-bottom: 24px;">Your verification code is:</p>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6366f1; margin: 16px 0;">${otp}</div>
          <p style="color: #6b6b80; font-size: 13px; margin-top: 24px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
        <p style="color: #6b6b80; font-size: 12px; text-align: center; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendOrderNotificationEmail(to, sellerName, buyerName, buyerPhone, items) {
  const itemsListHtml = items.map(item => `
    <div style="background: rgba(255,255,255,0.04); padding: 12px; margin-bottom: 8px; border-radius: 8px;">
      <strong style="color: #fff;">${item.title}</strong>
      <div style="color: #a0a0b8; font-size: 13px; margin-top: 4px;">Price: ${item.price > 0 ? `₹${item.price}` : 'Free'}</div>
    </div>
  `).join('');

  const phoneText = buyerPhone ? ` They can also be reached at <strong>${buyerPhone}</strong>.` : '';

  const mailOptions = {
    from: `"ShareVIT Orders" <${process.env.SMTP_USER}>`,
    to,
    subject: '🎉 New Order Request on ShareVIT!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0;">Share<span style="color: #6366f1;">VIT</span></h1>
        </div>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px;">
          <p style="font-size: 18px; font-weight: bold; margin-top: 0;">Hello ${sellerName},</p>
          <p style="color: #a0a0b8; margin-bottom: 24px; line-height: 1.5;">Great news! <strong>${buyerName}</strong> has just requested to buy your item(s). Please coordinate with them to arrange for delivery.${phoneText}</p>

          <div style="margin-bottom: 24px;">
            ${itemsListHtml}
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/chat" style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 14px 0; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            Open Chats to Coordinate
          </a>
        </div>
        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 12px;">
          &copy; ${new Date().getFullYear()} ShareVIT. All rights reserved.<br>VIT Pune Campus
        </div>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendSupportTicketEmail(ticket) {
  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const reportId = escapeHtml(ticket.reportId);
  const title = escapeHtml(ticket.title);
  const userName = escapeHtml(ticket.userName || 'Anonymous Student');
  const userEmail = escapeHtml(ticket.userEmail || 'Not provided');
  const category = escapeHtml(ticket.category || 'Other');
  const severity = escapeHtml(ticket.severity || 'N/A');
  const description = escapeHtml(ticket.description);
  const screenshotUrl = ticket.screenshotUrl ? escapeHtml(ticket.screenshotUrl) : '';

  const mailOptions = {
    from: `"ShareVIT System" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    replyTo: ticket.userEmail || undefined,
    subject: `🚨 New Issue Report: ${ticket.title} (${ticket.reportId})`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9fb; padding: 20px; border-radius: 8px;">
        <h2 style="color: #e11d48; margin-top: 0;">New Issue Reported</h2>
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p><strong>User:</strong> ${userName} (${userEmail})</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Severity:</strong> ${severity}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <h3>Subject: ${title}</h3>
        <p style="white-space: pre-wrap; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0;">${description}</p>
        ${screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">${screenshotUrl}</a></p>` : ''}
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(to, resetLink, name = 'Student') {
  const mailOptions = {
    from: `"ShareVIT" <${process.env.SMTP_USER}>`,
    to,
    subject: 'ShareVIT - Password Reset Request',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; padding: 40px 30px; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin: 0;">Share<span style="color: #6366f1;">VIT</span></h1>
        </div>
        <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center;">
          <p>Hello ${name},</p>
          <p style="margin: 16px 0;">Click the link below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Reset Password</a>
          <p style="color: #6b6b80; font-size: 13px; margin-top: 24px;">This link expires in 1 hour.</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
