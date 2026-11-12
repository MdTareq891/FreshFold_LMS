import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useSocket } from "../context/SocketContext";
import client from "../api/client";

export default function Navbar() {
  const { user, logout, updateLanguage } = useAuth();
  const { dark, toggle } = useTheme();
  const { socket } = useSocket();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const unread = notifications.filter((n) => !n.read).length;
  const controlClass = dark
    ? "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#171b24] text-xs font-medium text-slate-200 transition-colors hover:bg-[#1d2330] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    : "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
  const iconControlClass = `${controlClass} w-9 text-sm`;
  const logoutControlClass = dark
    ? "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#4F6BFF]/40 bg-[#4F6BFF]/10 px-3 text-xs font-medium text-[#A9BAFF] transition-colors hover:bg-[#4F6BFF]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
    : "inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";

  useEffect(() => {
    if (!user) return;
    client.get("/notifications").then((res) => setNotifications(res.data.notifications));
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    function onNotif(n) {
      setNotifications((prev) => [n, ...prev]);
    }
    socket.on("notification", onNotif);
    return () => socket.off("notification", onNotif);
  }, [socket]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true } : n)));
    try {
      await client.patch(`/notifications/${id}/read`);
    } catch (e) {}
  }

  async function clearNotifications() {
    try {
      await client.delete("/notifications");
      setNotifications([]);
      window.dispatchEvent(new Event("notifications:cleared"));
    } catch (e) {}
  }

  return (
<header className={dark ? "sticky top-0 z-40 border-b border-white/6 bg-[#10141a]/90 backdrop-blur-xl" : "sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl"}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-4">
          <div className={dark ? "flex items-center gap-2 rounded-md border border-white/6 bg-white/[0.02] px-2 py-1.5 text-sm text-slate-300" : "flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-900"}>
            <span className={dark ? "text-slate-100" : "text-slate-950"}>Dashboard</span>
            <span className={dark ? "text-slate-500" : "text-slate-400"}>/</span>
            <span className={dark ? "text-slate-400" : "text-slate-900"}>{user?.name || user?.role || "Account"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className={dark ? "hidden items-center gap-2 rounded-md border border-white/6 bg-[#171b24] px-3 py-2 text-slate-300 md:flex" : "hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-700 md:flex"}>
            <span className={dark ? "text-sm text-slate-500" : "text-sm text-slate-700"}>⌕</span>
            <span className={dark ? "text-xs text-slate-400" : "text-xs text-slate-700"}>Search anything...</span>
          </div>

          <span className={`${controlClass} px-3`}>
            {new Intl.DateTimeFormat(i18n.language, { month: "short", year: "numeric" }).format(new Date())}
          </span>

          <button
            onClick={toggle}
            className={iconControlClass}
            aria-label={dark ? t("common.lightMode") : t("common.darkMode")}
          >
            {dark ? "☀️" : "🌙"}
          </button>

          <select
            value={i18n.language}
            onChange={(e) => updateLanguage(e.target.value)}
            className={`${controlClass} cursor-pointer px-2`}
            aria-label={t("common.language")}
          >
            <option value="en" className="text-slate-900">EN</option>
            <option value="bn" className="text-slate-900">বাং</option>
          </select>

          {user && (
            <>
              <div className="relative">
                <button
                  onClick={() => setBellOpen((o) => !o)}
                  className={`${iconControlClass} relative`}
                >
                  🔔
                  {unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4F6BFF] text-[9px] font-bold text-white"
                    >
                      {unread > 9 ? "9+" : unread}
                    </motion.span>
                  )}
                </button>
                <AnimatePresence>
                  {bellOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={dark ? "absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-white/6 bg-[#111827] p-2 text-slate-100 shadow-2xl" : "absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl"}
                    >
                      {notifications.length > 0 && (
                        <div className={dark ? "mb-1 flex justify-end border-b border-white/6 pb-1" : "mb-1 flex justify-end border-b border-slate-200 pb-1"}>
                          <button
                            onClick={clearNotifications}
                            className={dark ? "px-2 py-1 text-[11px] text-slate-300 hover:underline" : "px-2 py-1 text-[11px] text-slate-500 hover:underline"}
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                      {notifications.length === 0 && (
                        <p className={dark ? "p-3 text-center text-xs text-slate-400" : "p-3 text-center text-xs text-slate-500"}>{t("customer.noNotifications")}</p>
                      )}
                      {notifications.slice(0, 15).map((n) => (
                        <button
                          key={n._id || n.id}
                          onClick={() => markRead(n._id || n.id)}
                          className={dark ? `flex w-full gap-2 rounded-lg p-2 text-left text-xs text-slate-200 hover:bg-[#1d2330] ${n.read ? "opacity-50" : ""}` : `flex w-full gap-2 rounded-lg p-2 text-left text-xs text-slate-700 hover:bg-slate-100 ${n.read ? "opacity-50" : ""}`}
                        >
                          <span className="mt-0.5 text-[#4F6BFF]">●</span>
                          <span>{n.message}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={handleLogout} className={logoutControlClass}>
                {t("common.logout")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
