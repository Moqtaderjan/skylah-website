// api/submit-form.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { name, email, phone, company, inquiry, message, website } = req.body;

    // --- Honeypot spam check ---
    if (website) {
      return res.status(400).json({ success: false, message: "Spam detected." });
    }

    // --- Basic validation ---
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields (name, email, message)." });
    }

    // --- Email format validation ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    // --- Create transporter ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "mail.smtp2go.com",
      port: 2525,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // --- Compose HTML email ---
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color:#1e293b; line-height:1.6; max-width:600px; margin:auto; padding:20px; border:1px solid #e2e8f0; border-radius:10px;">
        <img src="images/skylah-logo-tps.png" alt="Skylah LLC Logo" style="width:150px; margin-bottom:20px;">
        <h2 style="color:#8e0000; margin-bottom:15px;">New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Company:</strong> ${company || "N/A"}</p>
        <p><strong>Inquiry Type:</strong> ${inquiry || "N/A"}</p>
        <p><strong>Message:</strong></p>
        <p style="padding-left:10px; border-left:3px solid #8e0000;">${message}</p>
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;">
        <p style="font-size:0.9rem; color:#64748b;">This message was sent from the Skylah LLC website contact form.</p>
      </div>
    `;

    const mailOptions = {
      from: `"Skylah LLC Website" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `New Inquiry from ${name}`,
      html: htmlContent,
    };
    const hcaptchaResponse = req.body['h-captcha-response']; // get token from front-end
    if (!hcaptchaResponse) {
      return res.status(400).json({ success: false, message: 'Please complete the captcha.' });
    }

    // Verify with hCaptcha server
    const verifyRes = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.HCAPTCHA_SECRET}&response=${hcaptchaResponse}`
    });
    const captchaData = await verifyRes.json();

    if (!captchaData.success) {
      return res.status(400).json({ success: false, message: 'Captcha verification failed.' });
    }

    // --- Send the email ---
    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
}
