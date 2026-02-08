import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function Centers({ user }) {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(""); // 🔍 search state

  const navigate = useNavigate();
  const isAdmin = user?.isAdmin === true;

  const fetchCenters = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const url = isAdmin
        ? `${API}/centers`
        : `${API}/centers/active`;

      const res = await axios.get(url);
      setCenters(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load centers");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  // 🔍 FILTER LOGIC
  const filteredCenters = centers.filter(center =>
    center.name
      ?.toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        {isAdmin ? "All Centers (Admin)" : "Centers"}
      </h2>

      {/* 🔍 SEARCH BOX */}
      <input
        type="text"
        placeholder="Search center..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4 focus:outline-none focus:ring"
      />

      {loading && <p>Loading...</p>}
      {!loading && error && (
        <p className="text-red-500">{error}</p>
      )}

      {!loading && !error && filteredCenters.length === 0 && (
        <p>No centers found</p>
      )}

      {!loading && filteredCenters.length > 0 && (
        <ul className="space-y-2">
          {filteredCenters.map(center => (
            <li
              key={center.id}
              onClick={() => navigate(`/members/${center.id}`)}
              className="border p-3 rounded cursor-pointer hover:bg-gray-100 flex justify-between items-center"
            >
              <span>{center.name}</span>

              {/* 👮 Admin-ku status kaattu */}
              {isAdmin && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    center.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {center.is_active ? "Active" : "Inactive"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
