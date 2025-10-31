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

// Default route (optional)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
// This file is no longer needed for Vercel serverless deployment.
// All API handlers should be in individual files in /api (e.g., /api/submit-form.js) and export a default handler.
});
