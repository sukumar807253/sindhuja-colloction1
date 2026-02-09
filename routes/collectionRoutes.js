const express = require("express");
const router = express.Router();
const { supabase } = require("../supabase");


/* =====================================================
   FETCH MEMBERS WITH NEXT WEEKLY COLLECTION
   GET /api/collections/members/:centerId
===================================================== */
router.get("/members/:centerId", async (req, res) => {
  try {
    const { centerId } = req.params;

    // Fetch all members in the center with their loans
    const { data: members, error } = await supabase
      .from("members")
      .select(`id, name, loans!inner(id)`)
      .eq("center_id", centerId);

    if (error) throw error;

    const result = [];

    for (const m of members) {
      const loanId = m.loans[0]?.id;
      if (!loanId) continue;

      // Fetch next pending week including collection_date
      const { data: nextWeek } = await supabase
        .from("collection_schedule")
        .select("expected_amount, week_no, collection_date") // ✅ added collection_date
        .eq("loan_id", loanId)
        .eq("status", "pending")
        .order("week_no", { ascending: true })
        .limit(1)
        .maybeSingle();

      result.push({
        member_id: m.id,
        loan_id: loanId,
        name: m.name,
        weekly_amount: Number(nextWeek?.expected_amount || 0),
        week_no: nextWeek?.week_no || null,
        collection_date: nextWeek?.collection_date || null // ✅ send date
      });
    }

    res.json(result);
  } catch (err) {
    console.error("SUPABASE ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch weekly amount" });
  }
});

/* =====================================================
   CREATE WEEKLY COLLECTION SCHEDULE
   POST /api/collections/schedule
===================================================== */
router.post("/schedule", async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || rows.length === 0)
      return res.status(400).json({ message: "No schedule rows provided" });

    const { data, error } = await supabase
      .from("collection_schedule") // ✅ correct table name
      .upsert(rows, { onConflict: ["loan_id", "week_no"] });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error("SUPABASE ERROR 👉", err);
    res.status(500).json({ message: "Failed to save schedule" });
  }
});
/* =====================================================
   PAY WEEKLY COLLECTION BATCH
   POST /api/collections/pay-batch
===================================================== */
router.post("/pay-batch", async (req, res) => {
  try {
    const { collection, denomination } = req.body;

    if (!collection || !collection.length) {
      return res.status(400).json({ message: "No collection data provided" });
    }

    /* ================= DENOMINATION VALIDATION ================= */
    const totalCollection = collection.reduce(
      (sum, c) => sum + Number(c.amount || 0),
      0
    );

    const totalNotes = denomination
      ? Object.entries(denomination).reduce(
          (sum, [note, count]) => sum + Number(note) * Number(count),
          0
        )
      : totalCollection;

    if (totalCollection !== totalNotes) {
      return res.status(400).json({
        message: `Denomination mismatch ₹${totalNotes} vs ₹${totalCollection}`,
      });
    }

    /* ================= PROCESS EACH MEMBER ================= */
    for (const item of collection) {
      const { member_id, amount } = item;
      if (!member_id) continue;

      let remainingAmount = Number(amount || 0);

      /* ===== GET LOAN ID ===== */
      const { data: memberData } = await supabase
        .from("members")
        .select("loans!inner(id)")
        .eq("id", member_id)
        .maybeSingle();

      const loanId = memberData?.loans?.[0]?.id;
      if (!loanId) continue;

      /* ===== GET ALL SCHEDULES ===== */
      const { data: schedules } = await supabase
        .from("collection_schedule")
        .select("*")
        .eq("loan_id", loanId)
        .order("week_no", { ascending: true });

      let carryOver = 0;

      for (const sched of schedules) {
        if (sched.status === "paid") continue;

        const expected =
          Number(sched.expected_amount || 0) + carryOver;

        if (remainingAmount <= 0) {
          // No money → just carry forward expected
          await supabase
            .from("collection_schedule")
            .update({
              expected_amount: expected,
              status: "pending",
            })
            .eq("id", sched.id);

          carryOver = expected;
          continue;
        }

        if (remainingAmount >= expected) {
          // FULL PAID
          await supabase
            .from("collection_schedule")
            .update({
              paid_amount: expected,
              expected_amount: expected,
              status: "paid",
            })
            .eq("id", sched.id);

          remainingAmount -= expected;
          carryOver = 0;
        } else {
          // PARTIAL PAID
          await supabase
            .from("collection_schedule")
            .update({
              paid_amount: remainingAmount,
              expected_amount: expected,
              status: "paid",
            })
            .eq("id", sched.id);

          carryOver = expected - remainingAmount;
          remainingAmount = 0;
        }
      }
    }

    /* ================= SAVE DENOMINATION ================= */
    if (denomination) {
      await supabase.from("denominations").insert([
        { notes: denomination },
      ]);
    }

    res.json({ message: "Collection saved successfully ✅" });
  } catch (err) {
    console.error("SERVER ERROR 👉", err);
    res.status(500).json({ message: "Payment failed" });
  }
});

/* =====================================================
   DAILY COLLECTION REPORT
   GET /api/collections/daily
===================================================== */
router.get("/daily", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("collection_schedule")
      .select(`
        paid_amount,
        collection_date,
        loans (
          members (
            name,
            centers (name)
          )
        )
      `)
      .eq("collection_date", today)
      .eq("status", "paid");

    if (error) throw error;

    const result = data.map(row => ({
      center_name: row.loans?.members?.centers?.name || "",
      member_name: row.loans?.members?.name || "",
      amount: row.paid_amount,
      paid_at: row.collection_date
    }));

    res.json(result);
  } catch (err) {
    console.error("SERVER ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch daily collections" });
  }
});

/* =====================================================
   DATE WISE TOTAL COLLECTION (FOR BILL)
   GET /api/collections/daily-total?date=YYYY-MM-DD
===================================================== */
router.get("/daily-total", async (req, res) => {
  try {
    // 👉 date query param (optional)
    const date =
      req.query.date || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("collection_schedule")
      .select("paid_amount")
      .eq("collection_date", date)
      .eq("status", "paid");

    if (error) throw error;

    // ✅ total calculation
    const totalAmount = data.reduce(
      (sum, row) => sum + Number(row.paid_amount || 0),
      0
    );

    res.json({
      date,
      total_amount: totalAmount
    });
  } catch (err) {
    console.error("DAILY TOTAL ERROR 👉", err);
    res.status(500).json({
      message: "Failed to fetch daily total"
    });
  }
});




/* =====================================================
   UNPAID COLLECTIONS (FOR MOBILE)
   GET /api/collections/unpaid-mobile
===================================================== */
router.get("/unpaid-mobile", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("collection_schedule")
      .select(`
        id,
        expected_amount,
        paid_amount,
        loans (
          member:members (
            name,
            mobile,
            center:centers (name)
          )
        )
      `)
      .eq("collection_date", today);

    if (error) throw error;

    const result = data
      .filter(s => (s.paid_amount || 0) < (s.expected_amount || 0))
      .map(s => ({
        schedule_id: s.id,
        center_name: s.loans.member.center.name,
        member_name: s.loans.member.name,
        mobile: s.loans.member.mobile,
        expected_amount: s.expected_amount,
        paid_amount: s.paid_amount || 0,
        amount_due: (s.expected_amount || 0) - (s.paid_amount || 0)
      }));

    res.json(result);
  } catch (err) {
    console.error("UNPAID MOBILE ERROR 👉", err);
    res.status(500).json({ message: "Failed to fetch unpaid members" });
  }
});
router.post("/collections/schedule", async (req, res) => {
  const { rows } = req.body;

  if (!rows || rows.length === 0) {
    return res.status(400).json({ message: "No rows provided" });
  }

  try {
    for (const r of rows) {
      await db.query(
        `INSERT INTO collections 
         (loan_id, week_no, collection_date, expected_amount, amount_due, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          r.loan_id,
          r.week_no,
          r.collection_date,
          r.expected_amount,
          r.amount_due,
          r.status
        ]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
