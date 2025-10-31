// Single consolidated serverless API handler for /api/submit-form
// Accepts POST, optional CORS preflight, sanitizes input, optionally verifies captcha, forwards to Web3Forms using WEB3FORMS_ACCESS_KEY.

const sanitize = v => (typeof v === 'string' ? v.replace(/<[^>]*>/g, '').trim().slice(0, 2000) : '');

export default async function handler(req, res) {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const body = req.body || {};
    let { name, email, company, phone, inquiry, message, botcheck } = body;

    if (!name || !email || !inquiry || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Sanitize inputs
    name = sanitize(name);
    email = sanitize(email).slice(0, 254);
    company = sanitize(company || '');
    phone = sanitize(phone || '');
    inquiry = sanitize(inquiry);
    message = sanitize(message);
    botcheck = sanitize(botcheck || '');

    // Optional captcha verification
    const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
    const recaptchaSecret = process.env.RECAPTCHA_SECRET;
    const captchaToken = body['h-captcha-response'] || body.hcaptchaToken || body['g-recaptcha-response'] || body.recaptchaToken;

    if ((hcaptchaSecret || recaptchaSecret) && !captchaToken) {
      return res.status(400).json({ success: false, message: 'Captcha token missing' });
    }

    if (hcaptchaSecret && captchaToken) {
      const params = new URLSearchParams({ secret: hcaptchaSecret, response: captchaToken });
      const verifyRes = await fetch('https://hcaptcha.com/siteverify', { method: 'POST', body: params });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        const baseMsg = 'Captcha verification failed';
        const debug = process.env.NODE_ENV === 'production' ? '' : ` - verify response: ${JSON.stringify(verifyJson)}`;
        return res.status(400).json({ success: false, message: baseMsg + debug });
      }
    }

    if (recaptchaSecret && captchaToken) {
      const params = new URLSearchParams({ secret: recaptchaSecret, response: captchaToken });
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body: params });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        const baseMsg = 'Captcha verification failed';
        const debug = process.env.NODE_ENV === 'production' ? '' : ` - verify response: ${JSON.stringify(verifyJson)}`;
        return res.status(400).json({ success: false, message: baseMsg + debug });
      }
    }

    const access_key = process.env.WEB3FORMS_ACCESS_KEY;
    if (!access_key) {
      console.error('WEB3FORMS_ACCESS_KEY not configured');
      return res.status(500).json({ success: false, message: 'Server not configured' });
    }

    const formData = { access_key, subject: 'New Contact Form Submission - Skylah LLC', from_name: 'Skylah LLC Website', name, email, company, phone, inquiry, message, botcheck };

    const upstream = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const upstreamText = await upstream.text();
    let data;
    try {
      data = upstreamText ? JSON.parse(upstreamText) : {};
    } catch (e) {
      data = { success: false, message: upstreamText || 'Empty or non-JSON response from Web3Forms' };
    }

    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    return res.status(upstream.ok ? 200 : 502).json(data);

  } catch (err) {
    console.error('submit-form error:', err && err.message ? err.message : err);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
