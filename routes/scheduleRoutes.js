const express = require("express");
const router = express.Router();
const { supabase } = require("../supabase");

/* ================= SAVE SCHEDULE ================= */
router.post("/save", async (req, res) => {
  const { centerId, date, day, week } = req.body;

  if (!centerId || !date || !day || !week) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabase
      .from("schedules")
      .insert([
        {
          center_id: centerId,
          schedule_date: date,
          day_name: day,
          week_number: week
        }
      ]);

    if (error) throw error;

    res.json({ message: "Schedule saved successfully", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save schedule" });
  }
});

module.exports = router;
