import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

export default function Collection() {
  const location = useLocation();
  const navigate = useNavigate();

  // Receive data from Members page
  const initialMembers = location.state?.collection ?? [];
  const totalFromMembers = location.state?.total ?? 0;

  const [members, setMembers] = useState(
    initialMembers.map(m => ({ ...m, manualAmount: m.amount }))
  );

  const denominationOrder = [2000, 500, 200, 100, 50, 20, 10];
  const [notes, setNotes] = useState(
    denominationOrder.reduce((acc, note) => ({ ...acc, [note]: 0 }), {})
  );

  /* ================= UPDATE MEMBER AMOUNT ================= */
  const updateAmount = (id, value) => {
    const amt = value === "" ? 0 : Number(value);
    setMembers(prev =>
      prev.map(m => (m.member_id === id ? { ...m, manualAmount: amt } : m))
    );
  };

  /* ================= TOTAL COLLECTION ================= */
  const totalCollection = members.reduce(
    (sum, m) => sum + (Number(m.manualAmount) || 0),
    0
  );

  /* ================= TOTAL NOTES VALUE ================= */
  const totalNotes = denominationOrder.reduce(
    (sum, note) => sum + note * (Number(notes[note]) || 0),
    0
  );

  /* ================= SAVE COLLECTION ================= */
  const saveCollection = async () => {
    if (totalNotes !== totalCollection) {
      alert(`❌ Denomination mismatch: ₹${totalNotes} vs ₹${totalCollection}`);
      return;
    }

    try {
      // Prepare collection array with correct status
      const payload = members.map(m => ({
        member_id: m.member_id,
        loan_id: m.loan_id,
        week_no: m.week_no,
        amount: Number(m.manualAmount),
        status: Number(m.manualAmount) > 0 ? "paid" : "pending" // ✅ 0 amount -> pending
      }));

      await axios.post("http://localhost:5000/api/collections/pay-batch", {
        collection: payload,
        denomination: notes
      });

      alert("✅ Collection saved successfully");
      navigate(-1);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save collection");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Collection</h2>

      <p className="mb-3 font-semibold text-green-700">
        Total Collection Amount: ₹ {totalCollection} {/* Live total */}
      </p>

      <h3 className="font-semibold mt-4 mb-2">Denominations</h3>
      {denominationOrder.map(note => (
        <div key={note} className="flex justify-between items-center mb-2">
          <span className="font-medium">₹ {note}</span>
          <input
            type="number"
            min="0"
            value={notes[note] === 0 ? "" : notes[note]}
            onChange={e =>
              setNotes({
                ...notes,
                [note]: e.target.value === "" ? 0 : Number(e.target.value)
              })
            }
            className="w-20 border p-1 rounded text-right"
          />
        </div>
      ))}

      <p className={`font-bold mt-4 ${totalNotes === totalCollection ? "text-green-700" : "text-red-600"}`}>
        Total Notes Value: ₹ {totalNotes}
      </p>

      <button
        onClick={saveCollection}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
      >
        Save Collection
      </button>
    </div>
  );
}
