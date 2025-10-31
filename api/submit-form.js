import fetch from "node-fetch";
import FormData from "form-data"; // important — install this if not already

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { name, email, company = "", phone = "", inquiry = "", message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Name, email, and message are required" });
  }

  try {
    const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
    if (!web3Key) {
      return res.status(500).json({ success: false, message: "Web3Forms key not configured on server" });
    }

    // ✅ Use FormData (multipart/form-data) instead of JSON
    const formData = new FormData();
    formData.append("access_key", web3Key);
    formData.append("subject", "New Contact Form Submission - Skylah LLC");
    formData.append("name", name);
    formData.append("email", email);
    formData.append("from_name", name);
    formData.append("replyto", email);
    formData.append("message", message);

    // Optional custom fields (they’ll be ignored safely by Web3Forms)
    if (company) formData.append("company", company);
    if (phone) formData.append("phone", phone);
    if (inquiry) formData.append("inquiry", inquiry);

    // ✅ Send request to Web3Forms using FormData
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(), // needed for proper multipart headers
    });

    const result = await response.json();

    if (!result.success) {
      console.error("Web3Forms response error:", result);
      return res.status(500).json({
        success: false,
        message: result.message || "Failed to send email via Web3Forms",
      });
    }

    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Web3Forms error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}
