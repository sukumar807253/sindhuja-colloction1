import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Centers from "./pages/Centers";
import Members from "./pages/Members";
import MemberDetails from "./pages/MemberDetails";
import Collection from "./pages/Collection";



import AdminDashboard from "./pages/AdminDashboard";
import CollectionRegistration from "./pages/admin/CollectionRegistration";
import DailyTally from "./pages/admin/DailyTally";
import UnpaidMembers from "./pages/admin/UnpaidMembers";

/* ================= APP ================= */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------- PUBLIC ---------- */}
          <Route path="/" element={<Login />} />

          {/* ---------- USER (PROTECTED) ---------- */}
          <Route
            path="/centers"
            element={
              <ProtectedRoute>
                <Centers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/members/:centerId"
            element={
              <ProtectedRoute>
                <Members />
              </ProtectedRoute>
            }
          />

          {/* Single Member Collection */}
          <Route
            path="/members/:centerId/collection/:memberId"
            element={
              <ProtectedRoute>
                <Collection />
              </ProtectedRoute>
            }
          />

          {/* Center-wise Collection */}
          <Route
            path="/members/:centerId/collection"
            element={
              <ProtectedRoute>
                <Collection />
              </ProtectedRoute>
            }
          />

          {/* Member Profile */}
          <Route
            path="/member/:memberId"
            element={
              <ProtectedRoute>
                <MemberDetails />
              </ProtectedRoute>
            }
          />

          {/* ---------- ADMIN (PROTECTED) ---------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute admin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/collection-registration"
            element={
              <ProtectedRoute admin>
                <CollectionRegistration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/daily-tally"
            element={
              <ProtectedRoute admin>
                <DailyTally />
              </ProtectedRoute>
            }
          />

          {/* ⭐ NEW: UNPAID MEMBERS */}
          <Route
            path="/admin/unpaid-members"
            element={
              <ProtectedRoute admin>
                <UnpaidMembers />
              </ProtectedRoute>
            }
          />

          {/* ---------- FALLBACK ---------- */}
          <Route
            path="*"
            element={
              <div className="p-6 text-center text-red-600 text-xl">
                404 - Page Not Found
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}   