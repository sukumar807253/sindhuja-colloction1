require("dotenv").config(); // Load .env variables
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const collectionRoutes = require("./routes/collectionRoutes");
const centerRoutes = require("./routes/centerRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

// ================== SUPABASE CLIENT ==================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================== EXPRESS APP ==================
const app = express();

// ================== CORS ==================
const allowedOrigins = [
  "https://sindhuja-colloction.vercel.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like Postman or mobile apps)
    if (!origin) return callback(null, true);

    if (!allowedOrigins.includes(origin)) {
      return callback(new Error("Not allowed by CORS"), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ================== MIDDLEWARE ==================
app.use(express.json());

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

// ================== LOGIN ROUTE ==================
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing email or password" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, password, isAdmin, blocked")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.blocked) return res.status(403).json({ message: "Account blocked" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Wrong password" });

    res.json({ id: user.id, name: user.name, isAdmin: user.isAdmin });
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// ================== MEMBERS ROUTE ==================
app.get("/api/members/:centerId", async (req, res) => {
  try {
    const { centerId } = req.params;
    const { data, error } = await supabase
      .from("members")
      .select(`id, name, loans(id, status)`)
      .eq("center_id", centerId);

    if (error) throw error;

    const result = data
      .filter(m => m.loans?.some(l => l.status === "CREDITED"))
      .map(m => {
        const loan = m.loans.find(l => l.status === "CREDITED");
        return { member_id: m.id, name: m.name, loan_id: loan.id, status: loan.status };
      });

    res.json(result);
  } catch (err) {
    console.error("MEMBERS ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// ================== ACTIVATE CENTER ==================
app.put("/api/centers/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("centers")
      .update({ is_active: true })
      .eq("id", id);

    if (error) return res.status(500).json({ message: "Failed to activate center" });
    res.json({ success: true, data });
  } catch (err) {
    console.error("ACTIVATE CENTER ERROR 👉", err);
    res.status(500).json({ message: "Failed to activate center" });
  }
});

// ================== ROUTES ==================
app.use("/api/centers", centerRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/schedule", scheduleRoutes);

// ================== START SERVER ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
