import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CollectionRegistration() {
  const [centers, setCenters] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [commonDate, setCommonDate] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH CENTERS ================= */
  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const res = await axios.get(`${API}/centers`);
        // show only inactive centers for schedule creation
        setCenters(res.data.filter(c => !c.is_active));
      } catch (err) {
        console.error(err);
        alert("Failed to load centers ❌");
      }
    };
    fetchCenters();
  }, []);

  /* ================= OPEN CENTER ================= */
  const handleOpenCenter = async (center) => {
    const stored = localStorage.getItem(`collection_${center.id}`);

    if (stored) {
      const parsed = JSON.parse(stored);
      setMembers(parsed.members);
      setCommonDate(parsed.commonDate);
    } else {
      try {
        const res = await axios.get(`${API}/members/${center.id}`);
        const initial = res.data.map(m => ({
          name: m.name,
          loanId: m.loan_id,
          schedule: []
        }));
        setMembers(initial);
        setCommonDate("");
      } catch {
        alert("Failed to load members ❌");
        return;
      }
    }

    setSelectedCenter(center);
    setShowModal(true);
  };

  /* ================= GENERATE SCHEDULE ================= */
  const handleGenerateAll = () => {
    if (!commonDate) {
      alert("Select first collection date ❌");
      return;
    }

    const weeklyAmounts = [
      1100, 1100, 1100, 1100,
      1080, 1080, 1080, 1080,
      1070, 1070, 1070, 1070
    ];

    const generated = members.map(m => {
      let date = new Date(commonDate);

      const schedule = weeklyAmounts.map((amt, i) => {
        const row = {
          week_no: i + 1,
          collection_date: date.toISOString().split("T")[0],
          expected_amount: amt,
          amount_due: amt
        };
        date.setDate(date.getDate() + 7);
        return row;
      });

      return { ...m, schedule };
    });

    setMembers(generated);

    localStorage.setItem(
      `collection_${selectedCenter.id}`,
      JSON.stringify({ commonDate, members: generated })
    );
  };

  /* ================= CLEAR ================= */
  const handleClear = () => {
    if (!window.confirm("Clear generated schedules?")) return;
    setMembers(members.map(m => ({ ...m, schedule: [] })));
    setCommonDate("");
    localStorage.removeItem(`collection_${selectedCenter.id}`);
  };

  /* ================= SAVE ALL ================= */
  const handleSaveAll = async () => {
    if (members.some(m => m.schedule.length === 0)) {
      alert("Generate schedules for all members ❌");
      return;
    }

    const rows = members.flatMap(m =>
      m.schedule.map(s => ({
        loan_id: m.loanId,
        week_no: s.week_no,
        collection_date: s.collection_date,
        expected_amount: s.expected_amount,
        amount_due: s.amount_due,
        status: "pending"
      }))
    );

    try {
      setLoading(true);

     await axios.post(`${API}/collections/schedule`, { rows });
     await axios.put(`${API}/centers/${selectedCenter.id}/activate`);


      localStorage.removeItem(`collection_${selectedCenter.id}`);
      alert("Schedules saved & center activated ✅");

      setShowModal(false);
      setMembers([]);
    } catch {
      alert("Failed to save schedules ❌");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Collection Schedule</h2>

      {/* CENTER TABLE */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">#</th>
            <th className="border px-3 py-2">Center Name</th>
            <th className="border px-3 py-2 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {centers.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center py-6 text-gray-500">
                No inactive centers available
              </td>
            </tr>
          ) : (
            centers.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{i + 1}</td>
                <td className="border px-3 py-2">{c.name}</td>
                <td className="border px-3 py-2 text-center">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                    onClick={() => handleOpenCenter(c)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[95%] max-w-5xl rounded p-5">
            <h3 className="text-lg font-semibold mb-3">
              {selectedCenter?.name}
            </h3>

            {/* DATE + ACTIONS */}
            <div className="flex gap-3 items-center mb-4">
              <label className="font-medium">First Collection Date:</label>
              <input
                type="date"
                className="border px-3 py-1 rounded"
                value={commonDate}
                onChange={(e) => setCommonDate(e.target.value)}
              />
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded"
                onClick={handleGenerateAll}
              >
                Generate All
              </button>
              <button
                className="bg-red-600 text-white px-4 py-1 rounded"
                onClick={handleClear}
              >
                Clear
              </button>
            </div>

            {/* MEMBERS TABLE */}
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2">Member</th>
                  <th className="border px-3 py-2 text-center">First Date</th>
                  <th className="border px-3 py-2 text-center">Status</th>
                  <th className="border px-3 py-2 text-center">Loan ID</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.loanId}>
                    <td className="border px-3 py-2">{m.name}</td>
                    <td className="border px-3 py-2 text-center">
                      {m.schedule[0]?.collection_date || "-"}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      {m.schedule.length > 0 ? (
                        <span className="text-green-600 font-semibold">✓ Generated</span>
                      ) : (
                        <span className="text-red-500">Pending</span>
                      )}
                    </td>
                    <td className="border px-3 py-2 text-center">{m.loanId}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-700 text-white px-4 py-2 rounded"
                onClick={handleSaveAll}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
