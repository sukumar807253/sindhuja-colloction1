import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function UnpaidMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get(`${API}/collections/unpaid-mobile`);
        setMembers(res.data);
      } catch (err) {
        console.error("Failed to fetch unpaid members:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!members.length) return <p className="p-6">No unpaid members found today.</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Unpaid Members Today</h2>
      <table className="border w-full">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Center</th>
            <th className="border p-2">Member</th>
            <th className="border p-2">Expected</th>
            <th className="border p-2">Paid</th>
            <th className="border p-2">Due</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.schedule_id}>
              <td className="border p-2">{m.center_name}</td>
              <td className="border p-2">{m.member_name}</td>
              <td className="border p-2">{m.expected_amount}</td>
              <td className="border p-2">{m.paid_amount}</td>
              <td className="border p-2">{m.amount_due}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
