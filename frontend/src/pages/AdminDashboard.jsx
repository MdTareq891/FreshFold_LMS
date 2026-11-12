import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import client from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useTheme } from "../context/ThemeContext";

const PIE_COLORS = ["#FF9F43", "#14B8A6", "#4F7CFF", "#22D46B", "#E8DFC8", "#7B5CFF"];
const STATUS_FLOW = ["Pending", "Scheduled", "Received", "In Process", "Checked", "Ready", "Completed"];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");

  const tabs = [
    ["overview", t("admin.overview")],
    ["orders", t("admin.orders")],
    ["services", t("admin.services")],
    ["inventory", t("admin.inventory")],
    ["staff", t("admin.staff")],
    ["customers", t("admin.customers")],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display mb-1 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-[#F5F5F7]">{t("admin.title")}</h1>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">{t("admin.subtitle")}</p>
      </motion.div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-white/5 pb-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "border-[#4F6BFF] text-slate-900 dark:text-white"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {tab === "overview" && <Overview />}
          {tab === "orders" && <Orders />}
          {tab === "services" && <Services />}
          {tab === "inventory" && <Inventory />}
          {tab === "staff" && <Staff />}
          {tab === "customers" && <Customers />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="card flex min-h-[120px] flex-col justify-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-slate-500 dark:text-[#8A8F98]">{label}</p>
      <p className={`mt-3 text-[28px] font-bold leading-none tracking-[-0.05em] ${accent || "text-slate-900 dark:text-[#F5F5F7]"}`}>{value}</p>
    </motion.div>
  );
}

function Overview() {
  const { t } = useTranslation();
  const { dark } = useTheme();
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get("/reports/summary").then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-navy-900/60 dark:text-sand-100/60">{t("common.loading")}</p>;

  const statusData = Object.entries(data.byStatus).map(([name, value]) => ({ name: t(`status.${name}`, name), value }));
  const tooltipStyle = {
    backgroundColor: dark ? "#111827" : "#ffffff",
    border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #cbd5e1",
    borderRadius: "8px",
    color: dark ? "#f8fafc" : "#1e293b",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("admin.totalOrders")} value={data.totalOrders} />
        <StatCard label={t("admin.completed")} value={data.completedOrders} accent="text-emerald-700 dark:text-[#7CF29C]" />
        <StatCard label={t("admin.revenueCollected")} value={`$${data.totalRevenue.toFixed(2)}`} accent="text-green-700 dark:text-[#22D46B]" />
        <StatCard label={t("admin.outstanding")} value={`$${data.outstanding.toFixed(2)}`} accent="text-amber-700 dark:text-[#FF9F43]" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-[#F5F5F7]">{t("admin.ordersByStatus")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {statusData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 flex flex-wrap gap-3 text-xs text-navy-900/60 dark:text-sand-100/60">
            {statusData.map((s, i) => (
              <li key={s.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.name} ({s.value})
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-[#F5F5F7]">{t("admin.topServices")}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topServices} layout="vertical" margin={{ left: 10 }}>
              <defs>
                <linearGradient id="tealGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#5EEAD4" />
                </linearGradient>
              </defs>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: dark ? "#9CA3AF" : "#475569" }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tooltipStyle.color }} itemStyle={{ color: tooltipStyle.color }} />
              <Bar dataKey="qty" fill="url(#tealGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <p className="text-sm text-navy-900/70 dark:text-sand-100/70">
          <span className="font-semibold text-navy-950 dark:text-sand-100">{data.totalCustomers}</span> {t("admin.registeredCustomers")} ·{" "}
          <span className="font-semibold text-navy-950 dark:text-sand-100">{data.pendingOrders}</span> {t("admin.ordersInProgress")}
        </p>
      </div>
    </div>
  );
}

function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    client.get("/orders").then((res) => setOrders(res.data.orders));
  }
  useEffect(load, []);

  async function advanceStatus(order) {
    const oid = order._id || order.id;
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    setBusyId(oid);
    try {
      await client.patch(`/orders/${oid}/status`, { status: next });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function markPaid(order) {
    const oid = order._id || order.id;
    setBusyId(oid);
    try {
      await client.patch(`/orders/${oid}/pay`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  const filtered = search.trim()
    ? orders.filter((o) => o.orderNo.toLowerCase().includes(search.trim().toLowerCase()))
    : orders;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <input className="input sm:max-w-xs" placeholder={t("staff.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch("")} className="text-xs text-navy-900/50 dark:text-sand-100/50 hover:underline">{t("common.clearSearch")}</button>}
        <span className="text-xs text-navy-900/40 dark:text-sand-100/40 sm:ml-auto">{filtered.length} order(s)</span>
      </div>

      <div className="card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
              <th className="px-4 py-3">{t("staff.order")}</th>
              <th className="px-4 py-3">{t("staff.customer")}</th>
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
                <tr key={oid}>
                  <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">{o.orderNo}</td>
                  <td className="px-4 py-3 dark:text-sand-100/80">{o.customerName}</td>
                  <td className="px-4 py-3 dark:text-sand-100/80">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <span className={`badge ${o.paid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"}`}>
                      {o.paid ? t("common.paid") : t("common.unpaid")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <a href={`/receipt/${o.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1 !text-xs">{t("staff.receipt")}</a>
                      {o.status !== "Completed" && (
                        <button onClick={() => advanceStatus(o)} disabled={busyId === oid} className="btn-teal !px-3 !py-1 !text-xs">{t("staff.advance")}</button>
                      )}
                      {!o.paid && (
                        <button onClick={() => markPaid(o)} disabled={busyId === oid} className="btn-ghost !px-3 !py-1 !text-xs">{t("staff.markPaid")}</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-navy-900/50 dark:text-sand-100/50">{t("staff.noOrders")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: "", pricePerItem: "", category: "" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", pricePerItem: "", category: "" });

  function load() {
    client.get("/services").then((res) => setServices(res.data.services));
  }
  useEffect(load, []);

  const svcId = (s) => s._id || s.id;

  async function addService(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/services", { ...form, pricePerItem: Number(form.pricePerItem) });
      setForm({ name: "", pricePerItem: "", category: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not add service");
    }
  }

  async function removeService(id) {
    await client.delete(`/services/${id}`);
    load();
  }

  function startEdit(s) {
    setEditingId(svcId(s));
    setEditForm({ name: s.name, pricePerItem: s.pricePerItem, category: s.category });
  }

  async function saveEdit(id) {
    await client.put(`/services/${id}`, { ...editForm, pricePerItem: Number(editForm.pricePerItem) });
    setEditingId(null);
    load();
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
              <th className="px-4 py-3">{t("admin.serviceName")}</th>
              <th className="px-4 py-3">{t("admin.category")}</th>
              <th className="px-4 py-3">{t("admin.pricePerItem")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
            {services.map((s) => {
              const id = svcId(s);
              return editingId === id ? (
                <tr key={id} className="bg-teal-50/50 dark:bg-teal-500/5">
                  <td className="px-4 py-2"><input className="input !py-1" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td className="px-4 py-2"><input className="input !py-1" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></td>
                  <td className="px-4 py-2"><input type="number" step="0.01" className="input !py-1 w-24" value={editForm.pricePerItem} onChange={(e) => setEditForm({ ...editForm, pricePerItem: e.target.value })} /></td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => saveEdit(id)} className="text-teal-700 dark:text-teal-400 text-xs font-semibold hover:underline mr-3">{t("common.save")}</button>
                    <button onClick={() => setEditingId(null)} className="text-navy-900/50 dark:text-sand-100/50 text-xs font-medium hover:underline">{t("common.cancel")}</button>
                  </td>
                </tr>
              ) : (
                <tr key={id}>
                  <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">{s.name}</td>
                  <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{s.category}</td>
                  <td className="px-4 py-3 dark:text-sand-100/80">${s.pricePerItem.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="text-teal-700 dark:text-teal-400 text-xs font-medium hover:underline mr-3">{t("common.edit")}</button>
                    <button onClick={() => removeService(id)} className="text-red-600 text-xs font-medium hover:underline">{t("common.remove")}</button>
                  </td>
                </tr>
              );
            })}
            {services.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-navy-900/50 dark:text-sand-100/50">{t("admin.noServicesYet")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={addService} className="card space-y-3 h-fit">
        <h3 className="font-semibold text-navy-950 dark:text-sand-100">{t("admin.addService")}</h3>
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">{error}</div>}
        <div><label className="label">{t("admin.serviceName")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">{t("admin.category")}</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
        <div><label className="label">{t("admin.pricePerItem")}</label><input type="number" step="0.01" className="input" value={form.pricePerItem} onChange={(e) => setForm({ ...form, pricePerItem: e.target.value })} required /></div>
        <button className="btn-teal w-full">{t("admin.addService")}</button>
      </form>
    </div>
  );
}

function Inventory() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "", threshold: "" });
  const [error, setError] = useState("");

  function load() {
    client.get("/inventory").then((res) => setItems(res.data.inventory));
  }
  useEffect(load, []);

  const itemId = (i) => i._id || i.id;

  async function addItem(e) {
    e.preventDefault();
    setError("");
    try {
      await client.post("/inventory", form);
      setForm({ name: "", quantity: "", unit: "", threshold: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not add item");
    }
  }

  async function removeItem(id) {
    await client.delete(`/inventory/${id}`);
    load();
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
              <th className="px-4 py-3">{t("admin.serviceName")}</th>
              <th className="px-4 py-3">{t("admin.quantity")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
            {items.map((it) => {
              const id = itemId(it);
              const low = it.quantity <= it.threshold;
              return (
                <tr key={id}>
                  <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">{it.name}</td>
                  <td className="px-4 py-3 dark:text-sand-100/80">{it.quantity} {it.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${low ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"}`}>
                      {low ? t("admin.lowStock") : t("admin.ok")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeItem(id)} className="text-red-600 text-xs font-medium hover:underline">{t("common.remove")}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {items.length === 0 && <p className="px-4 py-6 text-center text-navy-900/50 dark:text-sand-100/50 text-sm">{t("admin.noInventoryYet")}</p>}
      </div>

      <form onSubmit={addItem} className="card space-y-3 h-fit">
        <h3 className="font-semibold text-navy-950 dark:text-sand-100">{t("admin.addInventoryItem")}</h3>
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">{error}</div>}
        <div><label className="label">{t("admin.serviceName")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{t("admin.quantity")}</label><input type="number" className="input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
          <div><label className="label">{t("admin.unit")}</label><input className="input" placeholder="kg, L, pcs" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
        </div>
        <div><label className="label">{t("admin.threshold")}</label><input type="number" className="input" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} /></div>
        <button className="btn-teal w-full">{t("admin.addInventoryItem")}</button>
      </form>
    </div>
  );
}

function Staff() {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  function load() {
    client.get("/users", { params: { role: "staff" } }).then((res) => setStaffList(res.data.users));
  }
  useEffect(load, []);

  async function addStaff(e) {
    e.preventDefault();
    setError("");
    setOk("");
    try {
      await client.post("/users/staff", form);
      setForm({ name: "", email: "", password: "", phone: "" });
      setOk(t("admin.staffCreated"));
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Could not create staff account");
    }
  }

  async function removeStaff(id) {
    if (!window.confirm(t("admin.removeStaffConfirm"))) return;
    await client.delete(`/users/${id}`);
    load();
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <div className="md:col-span-2 card !p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
              <th className="px-4 py-3">{t("common.name")}</th>
              <th className="px-4 py-3">{t("common.email")}</th>
              <th className="px-4 py-3">{t("common.phone")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
            {staffList.map((s) => (
              <tr key={s._id || s.id}>
                <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">{s.name}</td>
                <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{s.email}</td>
                <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{s.phone}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => removeStaff(s._id || s.id)} className="text-red-600 text-xs font-medium hover:underline">{t("common.remove")}</button>
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-navy-900/50 dark:text-sand-100/50">{t("admin.noStaffYet")}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={addStaff} className="card space-y-3 h-fit">
        <h3 className="font-semibold text-navy-950 dark:text-sand-100">{t("admin.addStaffAccount")}</h3>
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-500/10 rounded-md px-3 py-2">{error}</div>}
        {ok && <div className="text-sm text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-500/10 rounded-md px-3 py-2">{ok}</div>}
        <div><label className="label">{t("common.name")}</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">{t("common.email")}</label><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
        <div><label className="label">{t("admin.tempPassword")}</label><input className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
        <div><label className="label">{t("common.phone")}</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <button className="btn-teal w-full">{t("admin.createAccount")}</button>
      </form>
    </div>
  );
}

function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);

  function load() {
    client.get("/users", { params: { role: "customer" } }).then((res) => setCustomers(res.data.users));
  }
  useEffect(load, []);

  async function removeCustomer(id) {
    if (!window.confirm(t("admin.removeCustomerConfirm"))) return;
    await client.delete(`/users/${id}`);
    load();
  }

  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
            <th className="px-4 py-3">{t("common.name")}</th>
            <th className="px-4 py-3">{t("common.email")}</th>
            <th className="px-4 py-3">{t("common.phone")}</th>
            <th className="px-4 py-3">{t("common.address")}</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
          {customers.map((c) => (
            <tr key={c._id || c.id}>
              <td className="px-4 py-3 font-medium text-navy-950 dark:text-sand-100">{c.name}</td>
              <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{c.email}</td>
              <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{c.phone}</td>
              <td className="px-4 py-3 text-navy-900/70 dark:text-sand-100/70">{c.address}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => removeCustomer(c._id || c.id)} className="text-red-600 text-xs font-medium hover:underline">{t("common.remove")}</button>
              </td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan="5" className="px-4 py-6 text-center text-navy-900/50 dark:text-sand-100/50">{t("admin.noCustomersYet")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
