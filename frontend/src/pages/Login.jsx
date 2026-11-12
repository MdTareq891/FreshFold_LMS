import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PublicTopBar from "../components/PublicTopBar";

export default function Login() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password);
      redirectByRole(user.role, navigate);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function quickFill(role) {
    const creds = {
      admin: ["admin@lms.com", "admin123"],
      staff: ["staff@lms.com", "staff123"],
      customer: ["customer@lms.com", "customer123"],
    }[role];
    setEmail(creds[0]);
    setPassword(creds[1]);
  }

  return (
    <div className="login-page relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 transition-colors duration-300">
      <div className="laundry-backdrop" aria-hidden="true">
        <div className="wash-drum">
          <div className="wash-drum__rim">
            <div className="wash-drum__glass">
              <div className="wash-drum__current" />
              <div className="wash-drum__fabric" />
            </div>
          </div>
        </div>
        <span className="soap-bubble soap-bubble--one" />
        <span className="soap-bubble soap-bubble--two" />
        <span className="soap-bubble soap-bubble--three" />
        <span className="soap-bubble soap-bubble--four" />
        <span className="soap-bubble soap-bubble--five" />
        <span className="soap-bubble soap-bubble--six" />
      </div>
      <div className="laundry-girl" aria-hidden="true">
        <svg viewBox="0 0 320 520" role="presentation">
          <ellipse cx="157" cy="489" rx="89" ry="13" fill="#173B48" opacity=".12" />
          <g className="laundry-girl__figure">
            <path d="m126 363-7 95 22 1 23-91 20 91 23-1-7-97" fill="#31586A" />
            <path d="M111 451c-10 8-12 20-4 25h36l2-7-13-18m49 18-9 9c-2 5 1 9 7 9h34c5 0 7-5 3-9l-17-9" fill="#253E4D" />
            <path d="M143 164h29v34h-29z" fill="#F4A97A" />
            <path d="m133 184 12 10 25 0 12-10 25 14c14 8 20 25 15 40l-8 22-23-13-3 98h-78l-2-98-23 13-10-24c-6-14 0-31 13-39l23-14 22 1Z" fill="#168F91" />
            <path d="m124 215 64 1 23 146H99l25-147Z" fill="#F3F7F3" />
            <path d="m136 221 42 0 22 134h-82l18-134Z" fill="#177FB2" />
            <path d="m145 213 13 11 13-11 9 11-22 20-22-20 9-11Z" fill="#F7FBF8" />
            <path d="m158 238v83" stroke="#D7F0EC" strokeWidth="3" />
            <circle cx="158" cy="264" r="2.5" fill="#F3F7F3" />
            <circle cx="158" cy="283" r="2.5" fill="#F3F7F3" />
            <path d="M119 220 99 255 90 277" fill="none" stroke="#168F91" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m90 277-8 42" fill="none" stroke="#F4A97A" strokeWidth="14" strokeLinecap="round" />
            <path d="m88 315-5 16 12 9 10-12-5-12" fill="#F4A97A" />
            <path d="m88 318-5 16 12 9 10-12-5-12" fill="#F4A97A" />
            <path d="M123 115c-8 16-9 36-4 49 3 8 2 15-3 22 11 5 23 7 33 4 9 4 19 4 27 1-8-12-9-25-11-39-4-24-21-38-42-37Z" fill="#3C2D36" />
            <circle cx="157" cy="119" r="42" fill="#F4A97A" />
            <path d="M115 117c2-36 20-57 49-55 29 2 44 22 43 49-11-2-20-9-26-20-11 14-35 23-66 26Z" fill="#3C2D36" />
            <path d="M194 111c12 3 19 12 17 28l-1 29c0 10-5 20-13 27l-9-9c8-11 8-22 6-35l-2-24" fill="#3C2D36" />
            <path d="M144 121h1m27 0h1" stroke="#334D57" strokeWidth="5" strokeLinecap="round" />
            <path d="M151 140c5 5 12 5 17 0" fill="none" stroke="#B85F5D" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="135" cy="137" r="5" fill="#EC8F80" opacity=".62" />
            <circle cx="184" cy="137" r="5" fill="#EC8F80" opacity=".62" />
            <g className="laundry-girl__wave-arm">
              <path d="m199 207 16-25 8-16" fill="none" stroke="#168F91" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m223 166 14-25 8-4" fill="none" stroke="#F4A97A" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m216 177 12 7" stroke="#F3F7F3" strokeWidth="4" strokeLinecap="round" />
              <path d="m237 151 7-13 12 2 4 11-9 8-12-2" fill="#F4A97A" />
              <g className="laundry-girl__cloth">
                <path d="m244 143 9-49 52 11-12 53-49-15Z" fill="#E84A9D" />
                <path d="m253 101 46 10m-49 5 45 10m-48 5 42 9" stroke="#FFC1DF" strokeWidth="4" opacity=".9" />
                <path d="m254 95 4-14 48 10-3 14" fill="#F4F8F2" />
              </g>
              <path d="M239 145c1-5 5-8 9-6l10 4c5 2 6 7 3 11l-5 6c-3 3-7 3-10 1l-7-5c-3-2-3-7 0-11Z" fill="#F4A97A" />
              <path d="m249 144 8 4m-10-1 8 4" stroke="#D98269" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>
      <PublicTopBar />
      <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="login-panel relative z-10 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="text-3xl mb-1">🧺</div>
            <h1 className="font-display text-2xl text-navy-950 dark:text-sand-100">{t("app.name")}</h1>
            <p className="text-sm text-navy-900/60 dark:text-sand-100/60">{t("login.title")}</p>
          </div>
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">{error}</div>}
            <div>
              <label className="label">{t("common.email")}</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">{t("common.password")}</label>
              <div className="relative">
                <input className="input pr-12" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
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
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? t("login.signingIn") : t("login.signIn")}
            </button>
            <p className="text-center text-sm text-navy-900/60 dark:text-sand-100/60">
              {t("login.newCustomer")} <Link to="/register" className="text-teal-600 dark:text-teal-400 font-medium">{t("login.createAccount")}</Link>
            </p>
          </form>

          <div className="card mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 mb-2">{t("login.demoLogins")}</p>
            <div className="flex gap-2">
              <button onClick={() => quickFill("admin")} className="btn-ghost flex-1 !text-xs">{t("login.admin")}</button>
              <button onClick={() => quickFill("staff")} className="btn-ghost flex-1 !text-xs">{t("login.staff")}</button>
              <button onClick={() => quickFill("customer")} className="btn-ghost flex-1 !text-xs">{t("login.customer")}</button>
            </div>
          </div>
      </motion.div>
    </div>
  );
}

export function redirectByRole(role, navigate) {
  if (role === "admin") navigate("/admin");
  else if (role === "staff") navigate("/staff");
  else navigate("/customer");
}
