const express = require("express");
const router = express.Router();
const { supabase } = require("../supabase");

/* ================= GET ALL CENTERS (ADMIN) ================= */
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("centers")          // ✅ missing line fixed
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data); // 👈 ALL centers (active + inactive)
  } catch (err) {
    console.error("FETCH CENTERS ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch centers" });
  }
});

/* ================= OPEN CENTER (DAY OPEN) ================= */
router.put("/:id/open", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("centers")
      .update({
        day_closed: false,
        day_closed_date: null,
      })
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Center opened successfully",
    });
  } catch (err) {
    console.error("OPEN CENTER ERROR 👉", err);
    res.status(500).json({ message: "Failed to open center" });
  }
});

/* ================= DAY CLOSE ================= */
router.put("/:id/day-close", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("centers")
      .update({
        day_closed: true,
        day_closed_date: new Date(),
      })
      .eq("id", id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Day closed successfully",
    });
  } catch (err) {
    console.error("DAY CLOSE ERROR 👉", err);
    res.status(500).json({ message: "Day close failed" });
  }
});

/* ================= ACTIVATE CENTER ================= */
router.get("/active", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("centers")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) throw error;

    res.json(data); // 👈 active centers only
  } catch (err) {
    console.error("FETCH ACTIVE CENTERS ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch active centers" });
  }
});

/* ================= DEACTIVATE CENTER ================= */
router.put("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("centers")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Center deactivated successfully",
    });
  } catch (err) {
    console.error("DEACTIVATE CENTER ERROR 👉", err);
    res.status(500).json({
      message: "Center deactivation failed",
    });
  }
});

module.exports = router;
