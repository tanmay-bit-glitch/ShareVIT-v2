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

          <div style="text-align: center; margin-top: 32px;">
            <a href="https://share-vit-v2.vercel.app/chat" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">Go to Chat</a>
          </div>
          <p style="color: #6b6b80; font-size: 13px; margin-top: 24px; text-align: center;">The buyer has already sent you a message in your ShareVIT Direct Messages.</p>
        </div>
      </div>
    `,
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