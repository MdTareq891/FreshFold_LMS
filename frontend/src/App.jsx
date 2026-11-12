import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { SocketProvider } from "./context/SocketContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login, { redirectByRole } from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Receipt from "./pages/Receipt";
import { useTheme } from "./context/ThemeContext";

function Home() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) redirectByRole(user.role, navigate);
      else navigate("/login");
    }
  }, [user, loading]);

  return <div className="min-h-screen flex items-center justify-center text-navy-900/60 dark:text-sand-100/60">Loading…</div>;
}

function Shell({ children }) {
  const { dark } = useTheme();

  return (
    <div className={dark ? "min-h-screen bg-[#0B0D14] px-3 py-3 text-slate-100 transition-colors duration-300" : "min-h-screen bg-slate-100 px-3 py-3 text-slate-900 transition-colors duration-300"}>
      <div className={dark ? "mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1600px] overflow-hidden rounded-[18px] border border-white/10 bg-[#111319] shadow-[0_4px_16px_rgba(0,0,0,0.25)]" : "mx-auto min-h-[calc(100vh-1.5rem)] max-w-[1600px] overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)]"}>
        <Navbar />
        <main className="px-3 pb-3 pt-2">{children}</main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { token } = useAuth();
  return (
    <SocketProvider token={token}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/receipt/:token" element={<Receipt />} />
        <Route path="/" element={<Home />} />
        <Route
          path="/customer"
          element={
            <ProtectedRoute roles={["customer"]}>
              <Shell><CustomerDashboard /></Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute roles={["staff", "admin"]}>
              <Shell><StaffDashboard /></Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Shell><AdminDashboard /></Shell>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
