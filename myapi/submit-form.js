import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  const { name, email, company, phone, inquiry, message, "h-captcha-response": hCaptchaToken } = req.body;

  if (!name || !email || !message || !hCaptchaToken) {
    return res.status(400).json({ success: false, message: "Missing required fields or captcha" });
  }

  // 1️⃣ Verify hCaptcha
  const hCaptchaSecret = process.env.HCAPTCHA_SECRET; // store in Vercel env
  const verify = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${hCaptchaSecret}&response=${hCaptchaToken}`,
  });
  const captchaData = await verify.json();
  if (!captchaData.success) {
    return res.status(400).json({ success: false, message: "Captcha verification failed" });
  }

  // 2️⃣ Send to Web3Forms
  const web3Key = process.env.WEB3FORMS_ACCESS_KEY; // store in Vercel env
  const formData = {
    access_key: web3Key,
    subject: "New Contact Form Submission - Skylah LLC",
    from_name: "Skylah LLC Website",
    name, email, company, phone, inquiry, message,
  };

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const result = await response.json();
  res.status(response.ok ? 200 : 502).json(result);
}
