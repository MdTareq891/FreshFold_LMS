import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PublicTopBar from "../components/PublicTopBar";

export default function Register() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(form);
      navigate("/customer");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-navy-950 flex items-center justify-center px-4 py-10 transition-colors duration-300">
      <PublicTopBar />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🧺</div>
          <h1 className="font-display text-2xl text-navy-950 dark:text-sand-100">{t("register.title")}</h1>
          <p className="text-sm text-navy-900/60 dark:text-sand-100/60">{t("register.subtitle")}</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">{error}</div>}
          <div>
            <label className="label">{t("register.fullName")}</label>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("common.email")}</label>
            <input className="input" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </div>
          <div>
            <label className="label">{t("common.password")}</label>
            <div className="relative">
              <input className="input pr-12" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 6.2a1.7 1.7 0 010 1.6 13 13 0 01-3.1 3.8M6.2 6.2A13 13 0 002.5 11.2a1.7 1.7 0 000 1.6C3.5 14.8 7 19 12 19c1 0 2-.2 2.9-.5" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="label">{t("common.phone")}</label>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <label className="label">{t("register.pickupAddress")}</label>
            <input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? t("register.creating") : t("register.createAccount")}
          </button>
          <p className="text-center text-sm text-navy-900/60 dark:text-sand-100/60">
            {t("register.alreadyRegistered")} <Link to="/login" className="text-teal-600 dark:text-teal-400 font-medium">{t("register.signIn")}</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
