import { useEffect, useState, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import client from "../api/client";
import { useSocket } from "../context/SocketContext";
import StatusBadge from "../components/StatusBadge";

const STATUS_FLOW = ["Pending", "Scheduled", "Received", "In Process", "Checked", "Ready", "Completed"];

export default function StaffDashboard() {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    const res = await client.get("/orders");
    setOrders(res.data.orders);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("order:new", load);
    return () => socket.off("order:new", load);
  }, [socket]);

  async function advanceStatus(order) {
    const oid = order._id || order.id;
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setBusyId(oid);
    try {
      // Doesn't change the status directly — asks the customer to confirm first.
      await client.patch(`/orders/${oid}/request-confirmation`, { status: next });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(order) {
    const oid = order._id || order.id;
    setBusyId(oid);
    try {
      await client.patch(`/orders/${oid}/pay`);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  let filtered = filter === "All" ? orders : orders.filter((o) => o.status === filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((o) => o.orderNo.toLowerCase().includes(q) || (o._id || o.id).toLowerCase().includes(q));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-navy-950 dark:text-sand-100 mb-1">{t("staff.queueTitle")}</h1>
        <p className="text-navy-950 dark:text-sand-100/60 mb-5">{t("staff.queueSubtitle")}</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input
          className="input sm:max-w-xs"
          placeholder={t("staff.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-navy-950 dark:text-sand-100/70 hover:text-navy-900 dark:hover:text-sand-100 underline">
            {t("common.clearSearch")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {["All", ...STATUS_FLOW].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-navy-900 text-white border-navy-900 dark:bg-teal-600 dark:border-teal-600"
                : "border-navy-900/20 dark:border-white/15 text-navy-950 dark:text-sand-100/70 hover:bg-navy-900/5 dark:hover:bg-white/5"
            }`}
          >
            {s === "All" ? t("staff.all") : t(`status.${s}`)}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card !p-0 overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900 dark:text-sand-100/60 border-b border-navy-900/10 dark:border-white/10">
              <th className="px-4 py-3">{t("staff.order")}</th>
              <th className="px-4 py-3">{t("staff.customer")}</th>
              <th className="px-4 py-3">{t("staff.items")}</th>
              <th className="px-4 py-3">{t("common.total")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3">{t("staff.payment")}</th>
              <th className="px-4 py-3 text-right">{t("staff.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
            {filtered.map((o) => {
              const oid = o._id || o.id;
              return (
                <Fragment key={oid}>
                  <tr>
                    <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">
                      {o.orderNo}
                      {(o.note || o.notePhotos?.length > 0) && (
                        <button onClick={() => setExpanded(expanded === oid ? null : oid)} className="ml-2 text-teal-600 dark:text-teal-400 text-xs align-middle">📝</button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy-950 dark:text-sand-100/80">{o.customerName}</td>
                    <td className="px-4 py-3 text-navy-950 dark:text-sand-100/70">{o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}</td>
                    <td className="px-4 py-3 text-navy-950 dark:text-sand-100/80">${o.total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                      {o.awaitingConfirmation && (
                        <div className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Waiting on customer to confirm "{o.confirmationStatus}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${o.paid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"}`}>
                        {o.paid ? t("common.paid") : t("common.unpaid")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <a href={`/receipt/${o.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1 !text-xs">{t("staff.receipt")}</a>
                        {o.status !== "Completed" && (
                          <button
                            onClick={() => advanceStatus(o)}
                            disabled={busyId === oid || o.awaitingConfirmation}
                            title={o.awaitingConfirmation ? "Waiting for the customer to confirm" : undefined}
                            className="btn-teal !px-3 !py-1 !text-xs"
                          >
                            {o.awaitingConfirmation ? "Pending…" : t("staff.advance")}
                          </button>
                        )}
                        {!o.paid && (
                          <button onClick={() => markPaid(o)} disabled={busyId === oid} className="btn-ghost !px-3 !py-1 !text-xs">{t("staff.markPaid")}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expanded === oid && (o.note || o.notePhotos?.length > 0) && (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <td colSpan="7" className="px-4 pb-3 bg-sand-100/60 dark:bg-white/5">
                          {o.note && <p className="text-xs mb-2"><span className="font-semibold">{t("staff.customerNote")}:</span> {o.note}</p>}
                          {o.notePhotos?.length > 0 && (
                            <div className="flex gap-2">
                              {o.notePhotos.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-md overflow-hidden border border-navy-900/10 dark:border-white/10 block">
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-navy-900 dark:text-sand-100/70">{t("staff.noOrders")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((o) => {
          const oid = o._id || o.id;
          return (
            <motion.div layout key={oid} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-navy-950 dark:text-sand-100">{o.orderNo}</p>
                  <p className="text-xs text-navy-950 dark:text-sand-100/60">{o.customerName}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
              {o.awaitingConfirmation && (
                <div className="mb-2 text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Waiting on customer to confirm "{o.confirmationStatus}"
                </div>
              )}
              <p className="text-xs text-navy-950 dark:text-sand-100/70 mb-2">{o.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}</p>
              {o.note && <p className="text-xs text-navy-950 dark:text-sand-100 bg-sand-100 dark:bg-white/5 rounded p-2 mb-2">{o.note}</p>}
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy-950 dark:text-sand-100">${o.total.toFixed(2)}</span>
                <div className="flex gap-1.5">
                  <a href={`/receipt/${o.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost !px-2 !py-1 !text-xs">{t("staff.receipt")}</a>
                  {o.status !== "Completed" && (
                    <button onClick={() => advanceStatus(o)} disabled={busyId === oid || o.awaitingConfirmation} className="btn-teal !px-2 !py-1 !text-xs">
                      {o.awaitingConfirmation ? "Pending…" : t("staff.advance")}
                    </button>
                  )}
                  {!o.paid && (
                    <button onClick={() => markPaid(o)} disabled={busyId === oid} className="btn-ghost !px-2 !py-1 !text-xs">{t("staff.markPaid")}</button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-navy-900 dark:text-sand-100/70 py-6">{t("staff.noOrders")}</p>}
      </div>
    </div>
  );
}
