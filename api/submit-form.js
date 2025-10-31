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

  // 1️⃣ Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Name, email, and message are required" });
  }

  // // 2️⃣ hCaptcha verification
  // try {
  //   const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  //   if (!hCaptchaToken) {
  //     return res.status(400).json({ success: false, message: 'Captcha token missing' });
  //   }
  //   if (!hcaptchaSecret) {
  //     return res.status(500).json({ success: false, message: 'hCaptcha secret not configured on server' });
  //   }

  //   const params = new URLSearchParams({ secret: hcaptchaSecret, response: hCaptchaToken });
  //   const verifyRes = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params });
  //   const verifyJson = await verifyRes.json();

  //   if (!verifyJson.success) {
  //     const debug = process.env.NODE_ENV === 'production' ? '' : ` - verify response: ${JSON.stringify(verifyJson)}`;
  //     return res.status(400).json({ success: false, message: 'Captcha verification failed' + debug });
  //   }
  // } catch (err) {
  //   console.error("hCaptcha error:", err);
  //   return res.status(500).json({ success: false, message: "Captcha verification error" });
  // }

  // 3️⃣ Send the form data to Web3Forms
  try {
    const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
    if (!web3Key) {
      return res.status(500).json({ success: false, message: "Web3Forms key not configured on server" });
    }

    const formData = {
      access_key: web3Key,
      subject: "New Contact Form Submission - Skylah LLC",
      name,
      email,
      from_name: name,
      replyto: email,
      company,
      phone,
      inquiry,
      message
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
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
