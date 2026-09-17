import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import authRoutes from "./src/routes/auth.js";
import donationRoutes from "./src/routes/donations.js";
import volunteerRoutes from "./src/routes/volunteers.js";
import adminRoutes from "./src/routes/admin.js";
import supabaseMock from "./src/routes/supabaseMock.js";
import { connectToDatabase } from "./src/db/mongo.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Auth and PostgREST compatibility layer
app.use(supabaseMock);

// Initialize MongoDB Connection via Mongoose
connectToDatabase().catch((err) => {
  console.warn("Mongoose initial connect warning:", err.message);
});

// REST API Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/admin", adminRoutes);

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "The Last Plate Project API" });
});

// AI Smart Food Expiry & Logistics Estimator Endpoint
app.post("/api/ai/food-estimator", async (req, res) => {
  try {
    const { foodTitle, foodCategory, quantity, preparationTime } = req.body;

    if (!foodTitle) {
      return res.status(400).json({ error: "Food title is required" });
    }

    const client = getAIClient();
    if (!client) {
      // Fallback response if GEMINI_API_KEY is not configured yet
      const estimatedMeals = Math.round(parseInt(quantity || "10", 10) * 2.5);
      return res.json({
        estimatedMeals,
        shelfLifeHours: 4,
        storageType: "Insulated Thermal Box (Refrigerated or >60°C)",
        urgencyLevel: "Medium",
        dietaryBadges: ["Nutritious", "Ready to Serve"],
        logisticsTip: "Ensure food items are sealed in airtight food-grade containers before volunteer pickup.",
        aiGenerated: false
      });
    }

    const prompt = `
You are an expert food safety specialist and surplus food logistics coordinator for "The Last Plate Project".
Analyze this surplus food donation item:
- Title: ${foodTitle}
- Category: ${foodCategory || "General Catering"}
- Quantity / Servings details: ${quantity || "Standard bulk tray"}
- Prepared / Cooked At: ${preparationTime || "1 hour ago"}

Provide a JSON object with:
1. "estimatedMeals": number (estimated total individual meals served)
2. "shelfLifeHours": number (safe distribution timeframe in hours from now)
3. "storageType": string (e.g. "Refrigerated Container", "Insulated Hot Box", "Room Temp Sealed")
4. "urgencyLevel": string ("High", "Medium", or "Low")
5. "dietaryBadges": string array (e.g. ["Halal Friendly", "Vegetarian Option", "High Protein"])
6. "logisticsTip": string (a short 1-2 sentence recommendation for the volunteer collecting this food)

Return ONLY valid JSON matching this schema, no markdown codeblocks or extra text.
`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleanJson);

    return res.json({
      ...data,
      aiGenerated: true
    });
  } catch (error: any) {
    console.error("AI estimation error:", error);
    return res.json({
      estimatedMeals: 35,
      shelfLifeHours: 3,
      storageType: "Insulated Box / Hot Hold",
      urgencyLevel: "High",
      dietaryBadges: ["Freshly Cooked", "Warm Delivery"],
      logisticsTip: "Maintain thermal chain during transport to ensure safety for recipients.",
      aiGenerated: false,
      errorMsg: error?.message || "Calculation fallback"
    });
  }
});

async function startServer() {
  const publicPath = path.join(process.cwd(), "public");
  app.use(express.static(publicPath));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.use("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
