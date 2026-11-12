import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const COLORS = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-[#FFB020]/10 dark:text-[#FFB020]",
  Scheduled: "bg-blue-100 text-blue-800 dark:bg-[#4F7CFF]/10 dark:text-[#8BA4FF]",
  Received: "bg-violet-100 text-violet-800 dark:bg-[#7B5CFF]/10 dark:text-[#BBA6FF]",
  "In Process": "bg-emerald-100 text-emerald-800 dark:bg-[#22D46B]/10 dark:text-[#7CF29C]",
  Checked: "bg-purple-100 text-purple-800 dark:bg-[#A855F7]/10 dark:text-[#D9A7FF]",
  Ready: "bg-green-100 text-green-800 dark:bg-[#7CF29C]/10 dark:text-[#9EF0B5]",
  Completed: "bg-emerald-100 text-emerald-800 dark:bg-[#22D46B]/10 dark:text-[#7CF29C]",
};

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const { dark } = useTheme();
  const color = COLORS[status] || (dark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-700");
  return (
    <span className={`badge ${color}`}>
      {t(`status.${status}`, status)}
    </span>
  );
}
