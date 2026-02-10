require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { supabase } = require("./supabaseClient");

const collectionRoutes = require("./routes/collectionRoutes");
const centerRoutes = require("./routes/centerRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");

const app = express();

/* ==================== ENV ==================== */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_BUCKET,
  FRONTEND_URL
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

/* ==================== MIDDLEWARE ==================== */
app.use(cors({
  origin: FRONTEND_URL, // https://sindhuja-frontend.vercel.app
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================== HEALTH ==================== */
app.get("/", (req, res) => {
  res.json({ status: "API running ✅" });
});

/* ==================== LOGIN ==================== */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, password, isAdmin, blocked")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.blocked)
      return res.status(403).json({ message: "Account blocked" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Wrong password" });

    res.json({
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin
    });
  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= MEMBERS ================= */
app.get("/api/members/:centerId", async (req, res) => {
  try {
    const { centerId } = req.params;

    const { data, error } = await supabase
      .from("members")
      .select(`
        id,
        name,
        loans ( id, status )
      `)
      .eq("center_id", centerId);

    if (error) throw error;

    const result = data
      .filter(m => m.loans?.some(l => l.status === "CREDITED"))
      .map(m => {
        const loan = m.loans.find(l => l.status === "CREDITED");
        return {
          member_id: m.id,
          name: m.name,
          loan_id: loan.id,
          status: loan.status
        };
      });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

/* ================= CENTERS ================= */
app.put("/api/centers/:id/activate", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("centers")
    .update({ is_active: true })
    .eq("id", id);

  if (error)
    return res.status(500).json({ message: "Failed to activate center" });

  res.json({ success: true, data });
});

/* ================= ROUTES ================= */
app.use("/api/centers", centerRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/schedule", scheduleRoutes);

/* ================= START ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
