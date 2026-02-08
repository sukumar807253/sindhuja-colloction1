import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-4">
        <button
          onClick={() => navigate("/admin/collection-registration")}
          className="bg-blue-600 text-white px-6 py-3 rounded"
        >
          Collection Registration
        </button>

        <button
          onClick={() => navigate("/admin/daily-tally")}
          className="bg-green-600 text-white px-6 py-3 rounded"
        >
          Daily Collection Tally
        </button>

        <button
          onClick={() => navigate("/admin/unpaid-members")}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          View Unpaid Members
        </button>

      </div>
    </div>
  );
}
