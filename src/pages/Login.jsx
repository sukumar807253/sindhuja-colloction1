import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/login`, { email: email.toLowerCase(), password });
      const user = res.data;
      login(user);
      if (user.isAdmin) navigate("/admin");
      else navigate("/centers");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
      <div className="bg-white p-10 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-indigo-500">Welcome Back <span className="text-green-400">Sindhuja.Fin</span></h2>
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-700">Login</h2>

        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={loading} className="w-full px-4 py-2 rounded-md border-2 border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"/>
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required disabled={loading} className="w-full px-4 py-2 rounded-md border-2 border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400"/>
          <button type="submit" disabled={loading} className={`w-full flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition ${loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}>
            {loading ? <>Logging in...</> : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
