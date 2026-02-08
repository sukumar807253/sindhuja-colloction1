import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/collections";

export default function Members() {
  const { centerId } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    if (!centerId) return;

    const fetchMembers = async () => {
      try {
        const res = await axios.get(`${API}/members/${centerId}`);

        const formatted = res.data.map(m => ({
          id: m.member_id,
          loan_id: m.loan_id,
          name: m.name,
          weekNo: m.week_no,
          collection_date: m.collection_date, // ✅ FIXED NAME
          weeklyAmount: Number(m.weekly_amount) || 0,
          manualAmount: Number(m.weekly_amount) || 0
        }));

        setMembers(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to load weekly amount");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [centerId]);

  /* ================= UPDATE AMOUNT ================= */
  const updateAmount = (id, value) => {
    const amt = value === "" ? "" : Number(value);

    setMembers(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, manualAmount: isNaN(amt) ? 0 : amt }
          : m
      )
    );
  };

  /* ================= TOTAL ================= */
  const totalCollection = members.reduce(
    (sum, m) => sum + (Number(m.manualAmount) || 0),
    0
  );

  /* ================= COLLECT ================= */
  const collectAll = () => {
    navigate(`/members/${centerId}/collection`, {
      state: {
        centerId,
        total: totalCollection,
        collection: members.map(m => ({
          member_id: m.id,
          loan_id: m.loan_id,
          week_no: m.weekNo,
          collection_date: m.collection_date, // ✅ CONSISTENT
          amount: Number(m.manualAmount) || 0,
          name: m.name
        }))
      }
    });
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Weekly Collection</h2>

      {members.map(m => (
        <div key={m.id} className="border p-3 rounded mb-3">
          <p className="font-semibold">{m.name}</p>

          <p className="text-green-700 font-bold">
            Week {m.weekNo} – ₹ {m.weeklyAmount}
          </p>

          <p className="text-indigo-600 font-semibold">
            Collection Date: {m.collection_date || "-"}
          </p>

          <label className="block text-sm mt-2">Collection Amount</label>
          <input
            type="number"
            min="0"
            value={m.manualAmount === "" ? "" : String(m.manualAmount)}
            onChange={e => updateAmount(m.id, e.target.value)}
            className="border p-1 rounded w-full mt-1"
          />
        </div>
      ))}

      <p className="font-bold text-lg mt-2 text-indigo-700">
        Total Collection: ₹ {totalCollection}
      </p>

      <button
        onClick={collectAll}
        disabled={!members.length}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded"
      >
        Collect All
      </button>
    </div>
  );
}
