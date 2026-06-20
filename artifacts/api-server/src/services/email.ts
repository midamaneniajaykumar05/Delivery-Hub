import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:80";

function htmlWrap(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🍔 FoodFleet</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a1a1a;margin-top:0">${title}</h2>
      ${body}
    </div>
    <div style="background:#f3f4f6;padding:16px;text-align:center;font-size:12px;color:#6b7280">
      © 2024 FoodFleet. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  try {
    await transporter.sendMail({ from: `"FoodFleet" <${process.env.GMAIL_USER}>`, to, subject, html });
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  await sendEmail(to, "Welcome to FoodFleet! 🍔", htmlWrap("Welcome to FoodFleet!", `
    <p style="color:#374151">Hi <strong>${name}</strong>,</p>
    <p style="color:#374151">Welcome to FoodFleet! We're excited to have you on board.</p>
    <p style="color:#374151">You can now browse hundreds of restaurants, order your favourite food, and track your delivery in real time.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${BASE_URL}" style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Start Ordering</a>
    </div>
    <p style="color:#6b7280;font-size:14px">Enjoy your first meal!</p>
  `));
}

export async function sendOrderPlacedEmail(to: string, name: string, orderId: number, total: number, restaurantName: string) {
  await sendEmail(to, `Order #${orderId} Placed Successfully ✅`, htmlWrap(`Order #${orderId} Confirmed`, `
    <p style="color:#374151">Hi <strong>${name}</strong>,</p>
    <p style="color:#374151">Your order from <strong>${restaurantName}</strong> has been placed successfully!</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#6b7280;padding:4px 0">Order ID</td><td style="text-align:right;font-weight:bold">#${orderId}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Restaurant</td><td style="text-align:right;font-weight:bold">${restaurantName}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Total</td><td style="text-align:right;font-weight:bold;color:#f59e0b">$${total.toFixed(2)}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${BASE_URL}/orders/${orderId}" style="background:#f59e0b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track Order</a>
    </div>
  `));
}

export async function sendPaymentSuccessEmail(to: string, name: string, orderId: number, amount: number, transactionId: string) {
  await sendEmail(to, `Payment Confirmed for Order #${orderId} 💳`, htmlWrap("Payment Successful!", `
    <p style="color:#374151">Hi <strong>${name}</strong>,</p>
    <p style="color:#374151">Your payment has been confirmed. The restaurant will start preparing your food shortly.</p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:16px;margin:16px 0">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="color:#6b7280;padding:4px 0">Order ID</td><td style="text-align:right;font-weight:bold">#${orderId}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Amount Paid</td><td style="text-align:right;font-weight:bold;color:#059669">$${amount.toFixed(2)}</td></tr>
        <tr><td style="color:#6b7280;padding:4px 0">Transaction ID</td><td style="text-align:right;font-size:12px;font-family:monospace">${transactionId}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${BASE_URL}/orders/${orderId}" style="background:#059669;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track Your Order</a>
    </div>
  `));
}

export async function sendPaymentFailureEmail(to: string, name: string, orderId: number) {
  await sendEmail(to, `Payment Failed for Order #${orderId} ❌`, htmlWrap("Payment Failed", `
    <p style="color:#374151">Hi <strong>${name}</strong>,</p>
    <p style="color:#374151">Unfortunately, your payment for order <strong>#${orderId}</strong> could not be processed.</p>
    <p style="color:#374151">Please try again or use a different payment method.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${BASE_URL}/orders" style="background:#ef4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Orders</a>
    </div>
  `));
}

export async function sendOrderStatusEmail(to: string, name: string, orderId: number, status: string) {
  const statusMessages: Record<string, { subject: string; msg: string; color: string }> = {
    accepted:          { subject: "Order Accepted by Restaurant 👨‍🍳", msg: "Your order has been accepted! The restaurant is now preparing your food.", color: "#f59e0b" },
    preparing:         { subject: "Your Food is Being Prepared 🍳", msg: "Great news! The kitchen has started preparing your order.", color: "#f59e0b" },
    ready_for_pickup:  { subject: "Order Ready for Pickup 📦", msg: "Your order is ready! A delivery partner will pick it up shortly.", color: "#8b5cf6" },
    out_for_delivery:  { subject: "Order Out for Delivery 🚴", msg: "Your order is on the way! Sit tight.", color: "#3b82f6" },
    delivered:         { subject: "Order Delivered! 🎉", msg: "Your order has been delivered. Enjoy your meal!", color: "#059669" },
    cancelled:         { subject: "Order Cancelled ❌", msg: "Your order has been cancelled. Contact support if you need help.", color: "#ef4444" },
  };
  const info = statusMessages[status];
  if (!info) return;
  await sendEmail(to, info.subject, htmlWrap(info.subject, `
    <p style="color:#374151">Hi <strong>${name}</strong>,</p>
    <p style="color:#374151">${info.msg}</p>
    <div style="background:${info.color}15;border-left:4px solid ${info.color};padding:12px 16px;border-radius:0 8px 8px 0;margin:16px 0">
      <strong style="color:${info.color}">Order #${orderId}</strong>
    </div>
    <div style="text-align:center;margin:24px 0">
      <a href="${BASE_URL}/orders/${orderId}" style="background:${info.color};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Track Order</a>
    </div>
  `));
}

export async function sendDeliveryConfirmationEmail(to: string, name: string, orderId: number) {
  await sendOrderStatusEmail(to, name, orderId, "delivered");
}
