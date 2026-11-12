import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function PublicTopBar() {
  const { updateLanguage } = useAuth();
  const { dark, toggle } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
      <select
        value={i18n.language}
        onChange={(e) => updateLanguage(e.target.value)}
        className={dark
          ? "bg-navy-950/90 text-white text-xs rounded-md px-2 py-1.5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer"
          : "bg-white/90 text-slate-700 text-xs rounded-md px-2 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"}
        aria-label={t("common.language")}
      >
        <option value="en" className="text-navy-950">EN</option>
        <option value="bn" className="text-navy-950">বাং</option>
      </select>
      <button
        onClick={toggle}
        className={dark
          ? "w-8 h-8 rounded-md bg-navy-950/90 hover:bg-navy-950 text-white flex items-center justify-center transition-colors"
          : "w-8 h-8 rounded-md bg-white/90 hover:bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center transition-colors"}
        aria-label={dark ? t("common.lightMode") : t("common.darkMode")}
      >
        {dark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
