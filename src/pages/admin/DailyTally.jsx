import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function DailyTally() {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodayTotal();
  }, []);

  const fetchTodayTotal = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API}/collections/daily`);

      const data = Array.isArray(res.data) ? res.data : [];

      const todayTotal = data.reduce(
        (sum, row) => sum + Number(row.amount || 0),
        0
      );

      setTotal(todayTotal);
    } catch (err) {
      console.error(err);
      setError("Unable to load today collection");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-600">Loading...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600 font-semibold">{error}</p>;
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">
        Today Collection Summary
      </h2>

      <div className="p-6 bg-green-100 border border-green-300 rounded text-center">
        <p className="text-sm text-gray-600">
          Date: {new Date().toLocaleDateString("en-IN")}
        </p>

        <p className="mt-2 text-2xl font-bold text-green-800">
          ₹ {total}
        </p>

        <p className="text-sm text-gray-700 mt-1">
          Total Collected Today
        </p>
      </div>
    </div>
  );
}
