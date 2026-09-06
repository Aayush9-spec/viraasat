const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.EMAIL_FROM || 'Viraasat <noreply@viraasat.in>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'care@viraasat.in';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured; email not sent:', payload.subject);
    return false;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      replyTo: REPLY_TO,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendOrderConfirmation(params: {
  to: string;
  orderId: string;
  items: Array<{ productName: string; quantity: number; unitPrice: number }>;
  total: number;
  shippingAddress: string;
}): Promise<boolean> {
  const itemRows = params.items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.unitPrice.toLocaleString('en-IN')}</td></tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#5e2c18">Order Confirmed</h2>
      <p>Thank you for your purchase! Your order <strong>#${params.orderId}</strong> has been confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#fbf7f0"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:center">Qty</th><th style="padding:8px;text-align:right">Price</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="font-size:18px;font-weight:bold;text-align:right">Total: ₹${params.total.toLocaleString('en-IN')}</p>
      <p style="color:#666">Shipping to: ${params.shippingAddress}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:12px;color:#999">Viraasat — Artisan Marketplace</p>
    </div>`;

  return sendEmail({
    to: params.to,
    subject: `Order #${params.orderId} Confirmed — Viraasat`,
    html,
  });
}

export async function sendContactReceipt(params: {
  to: string;
  name: string;
  topic: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#5e2c18">We收到您的消息</h2>
      <p>Hi ${params.name},</p>
      <p>We've received your message about <strong>${params.topic}</strong> and will reply within 24 hours.</p>
      <p style="color:#666">If your matter is urgent, please email us directly at <a href="mailto:care@viraasat.in">care@viraasat.in</a>.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:12px;color:#999">Viraasat — Artisan Marketplace</p>
    </div>`;

  return sendEmail({
    to: params.to,
    subject: `Message Received — Viraasat`,
    html,
  });
}

export async function sendApplyReceipt(params: {
  to: string;
  name: string;
  craft: string;
}): Promise<boolean> {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#5e2c18">Application Received</h2>
      <p>Hi ${params.name},</p>
      <p>Thank you for applying to become a Viraasat artisan! We've received your application for <strong>${params.craft}</strong>.</p>
      <p>Our team will review it and get back to you within 5-7 business days.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="font-size:12px;color:#999">Viraasat — Artisan Marketplace</p>
    </div>`;

  return sendEmail({
    to: params.to,
    subject: `Artisan Application Received — Viraasat`,
    html,
  });
}
