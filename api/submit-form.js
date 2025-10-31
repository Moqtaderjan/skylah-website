import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const {
    name,
    email,
    company = "",
    phone = "",
    inquiry = "",
    message,
    "h-captcha-response": hCaptchaToken
  } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Captcha verification failed" });
    // hCaptcha verification only
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
    const captchaToken = hCaptchaToken;
    if (!captchaToken) {
      return res.status(400).json({ success: false, message: 'Captcha token missing' });
    }
    if (!hcaptchaSecret) {
      return res.status(500).json({ success: false, message: 'hCaptcha secret not configured on server' });
    }
    const params = new URLSearchParams({ secret: hcaptchaSecret, response: captchaToken });
    const verifyRes = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
      const baseMsg = 'Captcha verification failed';
      const debug = process.env.NODE_ENV === 'production' ? '' : ` - verify response: ${JSON.stringify(verifyJson)}`;
      return res.status(400).json({ success: false, message: baseMsg + debug });
    }
  }
  

  // Send the form data to Web3Forms
  try {
    const web3Key = process.env.WEB3FORMS_ACCESS_KEY;

    const formData = {
      access_key: web3Key,
      subject: "New Contact Form Submission - Skylah LLC",
      name,
      email,           // Must be 'email' for Web3Forms
      from_name: name, // Optional: sender name
      replyto: email,  // Reply-to address
      company,
      phone,
      inquiry,
      message
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!result.success) {
      console.error("Web3Forms response error:", result);
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to send email via Web3Forms"
      });
    }

    // Success
    res.status(200).json({ success: true, message: "Message sent successfully" });

  } catch (err) {
    console.error("Web3Forms error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
