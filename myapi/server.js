// server.js
// A minimal Node.js Express server that handles contact form submissions securely
// and sends data to Web3Forms for email delivery.

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// CORS setup (so the frontend can call the backend)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Simple sanitize function to clean input
const sanitize = (v) =>
  typeof v === "string" ? v.replace(/<[^>]*>/g, "").trim().slice(0, 2000) : "";

// POST endpoint for handling form submissions
app.post("/api/submit-form.js", async (req, res) => {
  try {
    const body = req.body || {};
    let { name, email, company, phone, inquiry, message, botcheck } = body;

    // Validation
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Sanitize all inputs
    name = sanitize(name);
    email = sanitize(email).slice(0, 254);
    company = sanitize(company || "");
    phone = sanitize(phone || "");
    inquiry = sanitize(inquiry || "");
    message = sanitize(message);
    botcheck = sanitize(botcheck || "");

    const access_key = process.env.WEB3FORMS_ACCESS_KEY;
    if (!access_key) {
      console.error("WEB3FORMS_ACCESS_KEY is missing in environment variables");
      return res
        .status(500)
        .json({ success: false, message: "Server not configured" });
    }

    const formData = {
      access_key,
      subject: "New Contact Form Submission - Skylah LLC",
      from_name: "Skylah LLC Website",
      name,
      email,
      company,
      phone,
      inquiry,
      message,
      botcheck,
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const upstreamText = await response.text();
    let data;
    try {
      data = upstreamText ? JSON.parse(upstreamText) : {};
    } catch {
      data = {
        success: false,
        message: upstreamText || "Invalid response from Web3Forms",
      };
    }

    return res.status(response.ok ? 200 : 502).json(data);
  } catch (err) {
    console.error("submit-form error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Default route (optional)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
