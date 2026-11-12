import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import client from "../api/client";
import { uploadToCloudinary, cloudinaryConfigured } from "../api/cloudinary";
import { useSocket } from "../context/SocketContext";
import { usePushNotifications } from "../hooks/usePushNotifications";
import StatusBadge from "../components/StatusBadge";

const STEPS = ["Pending", "Scheduled", "Received", "In Process", "Checked", "Ready", "Completed"];

// Friendly icon + one-line meaning for every step, so the dots aren't a mystery.
const STEP_META = {
  Pending: { icon: "🕓", label: "Placed", hint: "We've got your order — waiting to schedule pickup." },
  Scheduled: { icon: "📅", label: "Scheduled", hint: "Your pickup date is confirmed." },
  Received: { icon: "📥", label: "Received", hint: "Your items arrived at our facility." },
  "In Process": { icon: "🧼", label: "Washing", hint: "Your items are being washed & cleaned." },
  Checked: { icon: "🔍", label: "Checked", hint: "Quality check complete." },
  Ready: { icon: "📦", label: "Ready", hint: "Ready for delivery / pickup." },
  Completed: { icon: "🎉", label: "Done", hint: "Order complete. Thank you!" },
};

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const push = usePushNotifications(true);

  const [tab, setTab] = useState("new");
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cart, setCart] = useState({});
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [quickAddQty, setQuickAddQty] = useState(1);
  const [pickupDate, setPickupDate] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState([]); // { file, previewUrl, uploading, url, error }
  const [msg, setMsg] = useState("");
  const [lastReceiptToken, setLastReceiptToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch] = useState("");

  const svcId = (s) => s.id || s._id;

  async function loadAll() {
    const [s, o, n] = await Promise.all([
      client.get("/services"),
      client.get("/orders"),
      client.get("/notifications"),
    ]);
    setServices(s.data.services);
    setOrders(o.data.orders);
    setNotifications(n.data.notifications);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!services.length) return;
    if (!selectedServiceId) {
      setSelectedServiceId(svcId(services[0]));
    }
  }, [services, selectedServiceId]);

  // Real-time: refresh orders whenever a socket notification arrives (status/payment change)
  useEffect(() => {
    if (!socket) return;
    function onNotif() {
      client.get("/orders").then((res) => setOrders(res.data.orders));
      client.get("/notifications").then((res) => setNotifications(res.data.notifications));
    }
    socket.on("notification", onNotif);
    return () => socket.off("notification", onNotif);
  }, [socket]);

  useEffect(() => {
    function onNotificationsCleared() {
      setNotifications([]);
    }
    window.addEventListener("notifications:cleared", onNotificationsCleared);
    return () => window.removeEventListener("notifications:cleared", onNotificationsCleared);
  }, []);

  async function clearNotifications() {
    try {
      await client.delete("/notifications");
      setNotifications([]);
      window.dispatchEvent(new Event("notifications:cleared"));
    } catch (e) {}
  }

  function setQty(serviceId, qty) {
    setCart((c) => ({ ...c, [serviceId]: Math.max(0, qty) }));
  }

  function removeFromCart(serviceId) {
    setCart((current) => {
      const next = { ...current };
      delete next[serviceId];
      return next;
    });
  }

  function addSelectedServiceToCart() {
    if (!selectedServiceId) return;
    const quantity = Math.max(0, Number(quickAddQty) || 0);
    if (quantity <= 0) return;

    setCart((current) => ({
      ...current,
      [selectedServiceId]: (current[selectedServiceId] || 0) + quantity,
    }));
    setQuickAddQty(1);
  }

  const total = services.reduce((sum, s) => sum + (cart[s.id] || cart[s._id] || 0) * s.pricePerItem, 0);
  const selectedService = services.find((service) => svcId(service) === selectedServiceId) || services[0];
  const selectedServices = services.filter((service) => (cart[svcId(service)] || 0) > 0);

  function onPickPhotos(e) {
    const files = Array.from(e.target.files || []).slice(0, 6 - photos.length);
    const entries = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file), uploading: false, url: null, error: null }));
    setPhotos((p) => [...p, ...entries]);
    e.target.value = "";
  }

  function removePhoto(idx) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }

  async function placeOrder(e) {
    e.preventDefault();
    setMsg("");
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([serviceId, qty]) => ({ serviceId, qty }));
    if (items.length === 0) {
      setMsg(t("customer.noServicesAvailable"));
      return;
    }
    setBusy(true);
    try {
      let notePhotos = [];
      if (photos.length > 0 && cloudinaryConfigured) {
        setPhotos((p) => p.map((ph) => ({ ...ph, uploading: true })));
        const uploaded = await Promise.all(
          photos.map(async (ph) => {
            try {
              const url = await uploadToCloudinary(ph.file);
              return url;
            } catch (err) {
              return null;
            }
          })
        );
        notePhotos = uploaded.filter(Boolean);
      }

      const res = await client.post("/orders", { items, pickupDate, address, note, notePhotos });
      setCart({});
      setNote("");
      setPhotos([]);
      setMsg(t("customer.orderPlaced"));
      setLastReceiptToken(res.data.order.receiptToken);
      await loadAll();
    } catch (err) {
      setMsg(err.response?.data?.error || "Could not place order");
      setLastReceiptToken(null);
    } finally {
      setBusy(false);
    }
  }

  const [confirmBusyId, setConfirmBusyId] = useState(null);

  async function respondToConfirmation(order, approve) {
    const oid = order._id || order.id;
    setConfirmBusyId(oid);
    try {
      await client.patch(`/orders/${oid}/confirm`, { approve });
      await loadAll();
    } finally {
      setConfirmBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl text-navy-950 dark:text-sand-100 mb-1">{t("customer.welcome")}</h1>
        <p className="text-navy-900/60 dark:text-sand-100/60 mb-6">{t("customer.subtitle")}</p>
      </motion.div>

      {push.supported && push.permission !== "granted" && (
        <div className="card !p-3 mb-5 flex items-center justify-between gap-3 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20">
          <p className="text-xs text-teal-800 dark:text-teal-300">🔔 Enable notifications to get real-time updates on your orders.</p>
          <button onClick={push.subscribe} className="btn-teal !text-xs !py-1 !px-3 shrink-0">Enable</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 border-b border-navy-900/10 dark:border-white/10 overflow-hidden">
        {[
          ["new", t("customer.newOrder")],
          ["orders", `${t("customer.myOrders")} (${orders.length})`],
          ["notifications", `${t("customer.notifications")} (${notifications.filter((n) => !n.read).length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key ? "border-teal-600 text-teal-700 dark:text-teal-400" : "border-transparent text-navy-900/50 dark:text-sand-100/50 hover:text-navy-900 dark:hover:text-sand-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "new" && (
          <motion.form
            key="new"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={placeOrder}
            className="grid md:grid-cols-3 gap-5"
          >
            <div className="md:col-span-2 card">
              <h2 className="font-semibold text-navy-950 dark:text-sand-100 mb-3">{t("customer.chooseServices")}</h2>

              {services.length > 0 && (
                <div className="mb-4 rounded-xl border border-navy-900/10 dark:border-white/10 bg-navy-50/50 dark:bg-slate-900/40 p-3">
                  <label className="label">Choose service from admin list</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      className="input"
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                    >
                      {services.map((service) => (
                        <option key={svcId(service)} value={svcId(service)}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      className="input w-24 text-center"
                      value={quickAddQty}
                      onChange={(e) => setQuickAddQty(Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button type="button" onClick={addSelectedServiceToCart} className="btn-teal whitespace-nowrap">
                      Add to cart
                    </button>
                  </div>
                  {selectedService && (
                    <p className="mt-2 text-xs text-navy-900/60 dark:text-sand-100/60">
                      {selectedService.category} · ${selectedService.pricePerItem.toFixed(2)} per item
                    </p>
                  )}
                </div>
              )}

              {services.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">🧺</p>
                  <p className="text-navy-950 dark:text-sand-100 font-medium">{t("customer.noServices")}</p>
                  <p className="text-sm text-navy-900/50 dark:text-sand-100/50 mt-1">{t("customer.noServicesDesc")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedServices.length === 0 && (
                    <p className="text-sm text-navy-900/50 dark:text-sand-100/50 py-2">
                      Add a service above to begin your order.
                    </p>
                  )}
                  {selectedServices.map((s) => (
                    <div key={svcId(s)} className="grid grid-cols-[minmax(0,1fr)_3.5rem_1.5rem] items-center gap-2 rounded-lg border border-navy-900/10 dark:border-white/10 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-navy-950 dark:text-sand-100 truncate">
                          {s.name} <span className="font-normal text-xs text-navy-900/50 dark:text-sand-100/50">· ${s.pricePerItem.toFixed(2)} / item</span>
                        </p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        className="input !py-1 !px-1 w-14 text-center"
                        value={cart[svcId(s)]}
                        onChange={(e) => setQty(svcId(s), Number(e.target.value))}
                        aria-label={`${s.name} quantity`}
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(svcId(s))}
                        className="text-lg leading-none text-clay-600 dark:text-clay-400 hover:text-clay-800 dark:hover:text-clay-300"
                        aria-label={`Remove ${s.name}`}
                        title={`Remove ${s.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-navy-900/10 dark:border-white/10">
                <label className="label">{t("customer.notes")}</label>
                <textarea
                  className="input mb-3"
                  rows="2"
                  placeholder={t("customer.notesPlaceholder")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <label className="label">{t("customer.addPhoto")}</label>
                <p className="text-xs text-navy-900/50 dark:text-sand-100/50 mb-2">{t("customer.addPhotoHint")}</p>
                <div className="flex flex-wrap gap-2">
                  {photos.map((ph, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-navy-900/10 dark:border-white/10">
                      <img src={ph.previewUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0 right-0 bg-black/60 text-white w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-navy-900/20 dark:border-white/20 flex items-center justify-center text-2xl text-navy-900/30 dark:text-sand-100/30 cursor-pointer hover:border-teal-500 hover:text-teal-500 transition-colors">
                      +
                      <input type="file" accept="image/*" multiple className="hidden" onChange={onPickPhotos} />
                    </label>
                  )}
                </div>
                {!cloudinaryConfigured && photos.length > 0 && (
                  <p className="text-xs text-amber-600 mt-2">Photo upload isn't configured yet on this deployment (Cloudinary env vars missing) — the order will be placed without photos.</p>
                )}
              </div>
            </div>

            <div className="card h-fit space-y-3">
              <h2 className="font-semibold text-navy-950 dark:text-sand-100">{t("customer.pickupDetails")}</h2>
              <div>
                <label className="label">{t("customer.pickupDate")}</label>
                <input type="date" className="input" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} required />
              </div>
              <div>
                <label className="label">{t("common.address")}</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
              <div className="border-t border-navy-900/10 dark:border-white/10 pt-3 flex items-center justify-between">
                <span className="text-sm text-navy-900/60 dark:text-sand-100/60">{t("customer.estimatedTotal")}</span>
                <span className="font-semibold text-lg text-navy-950 dark:text-sand-100">${total.toFixed(2)}</span>
              </div>
              {msg && (
                <div className="text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 rounded-md px-3 py-2 flex items-center justify-between gap-2">
                  <span>{msg}</span>
                  {lastReceiptToken && (
                    <a href={`/receipt/${lastReceiptToken}`} target="_blank" rel="noreferrer" className="font-semibold underline whitespace-nowrap">
                      {t("common.viewReceipt")}
                    </a>
                  )}
                </div>
              )}
              <button className="btn-teal w-full" disabled={busy || services.length === 0}>
                {busy ? t("customer.placingOrder") : services.length === 0 ? t("customer.noServicesAvailable") : t("customer.placeOrder")}
              </button>
            </div>
          </motion.form>
        )}

        {tab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="input sm:max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders"
                aria-label="Search orders"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-navy-900/50 dark:text-sand-100/50 hover:underline">
                  Clear
                </button>
              )}
            </div>

            {(() => {
              const filteredOrders = search.trim()
                ? orders.filter((o) => {
                    const q = search.trim().toLowerCase();
                    const haystack = [
                      o.orderNo || "",
                      o.status || "",
                      o.customerName || "",
                      o._id || o.id || "",
                      o.pickupDate || "",
                      ...(o.items || []).map((it) => it.name || ""),
                      ...(o.items || []).map((it) => it.category || ""),
                    ]
                      .join(" ")
                      .toLowerCase();

                    return haystack.includes(q);
                  })
                : orders;

              if (filteredOrders.length === 0) {
                return <p className="text-navy-900/60 dark:text-sand-100/60">{search ? "No matching orders found" : t("customer.noOrdersYet")}</p>;
              }

              return filteredOrders.map((o) => {
                const oid = o._id || o.id;
                const isOpen = expandedOrder === oid;
                const currentIdx = STEPS.indexOf(o.status);
                const currentMeta = STEP_META[o.status] || {};

                return (
                  <motion.div
                    key={oid}
                    layout
                    className="card !p-0 overflow-hidden border-l-4"
                    style={{ borderLeftColor: o.status === "Completed" ? "#0f8b8d" : o.awaitingConfirmation ? "#d97706" : "#3ec1c3" }}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                          <p className="font-semibold text-navy-950 dark:text-sand-100">{o.orderNo}</p>
                          <p className="text-xs text-navy-900/50 dark:text-sand-100/50">
                            {t("customer.placed")} {new Date(o.createdAt).toLocaleDateString()} · {t("customer.pickup")} {o.pickupDate || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={o.status} />
                          <span className={`badge ${o.paid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"}`}>
                            {o.paid ? t("common.paid") : t("common.unpaid")}
                          </span>
                          <a href={`/receipt/${o.receiptToken}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1 !text-xs">
                            {t("common.viewReceipt")}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3 bg-teal-50 dark:bg-teal-500/10 rounded-lg px-3 py-2">
                        <span className="text-lg leading-none">{currentMeta.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-teal-800 dark:text-teal-300 truncate">
                            {t(`status.${o.status}`, o.status)}
                          </p>
                          <p className="text-xs text-teal-700/80 dark:text-teal-300/70 truncate">{currentMeta.hint}</p>
                        </div>
                      </div>

                      <div className="flex items-start mb-4 overflow-hidden pb-1">
                        {STEPS.map((step, i) => {
                          const meta = STEP_META[step] || {};
                          const done = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          return (
                            <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                              <div className="flex items-center w-full gap-1">
                                {i > 0 && <div className={`h-0.5 flex-1 ${i <= currentIdx ? "bg-teal-600" : "bg-navy-900/15 dark:bg-white/15"}`} />}
                                <motion.div
                                  title={`${meta.label || step}: ${meta.hint || ""}`}
                                  animate={{ scale: isCurrent ? 1.12 : 1 }}
                                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                    done
                                      ? "bg-teal-600 text-white shadow-sm"
                                      : "bg-navy-900/10 text-navy-900/40 dark:bg-white/10 dark:text-sand-100/40"
                                  } ${isCurrent ? "ring-4 ring-teal-500/25" : ""}`}
                                >
                                  {meta.icon}
                                </motion.div>
                                {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < currentIdx ? "bg-teal-600" : "bg-navy-900/15 dark:bg-white/15"}`} />}
                              </div>
                              <span
                                className={`mt-1 text-[11px] sm:text-xs text-center leading-tight ${
                                  isCurrent
                                    ? "font-semibold text-teal-700 dark:text-teal-400"
                                    : done
                                    ? "font-medium text-navy-900/60 dark:text-sand-100/50"
                                    : "text-navy-900/30 dark:text-sand-100/25"
                                }`}
                              >
                                {meta.label || step}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <AnimatePresence>
                        {o.awaitingConfirmation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 rounded-lg border border-amber-300/60 dark:border-amber-400/30 bg-amber-50 dark:bg-amber-400/10 px-4 py-3"
                          >
                            <p className="text-sm text-amber-900 dark:text-amber-300">
                              <span className="font-semibold">Confirmation needed:</span> the laundry wants to mark this order as{" "}
                              <span className="font-semibold">{t(`status.${o.confirmationStatus}`, o.confirmationStatus)}</span>
                              {STEP_META[o.confirmationStatus]?.hint ? ` — ${STEP_META[o.confirmationStatus].hint}` : ""}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => respondToConfirmation(o, true)}
                                disabled={confirmBusyId === oid}
                                className="btn-teal !py-1 !px-3 !text-xs"
                              >
                                ✓ Confirm
                              </button>
                              <button
                                onClick={() => respondToConfirmation(o, false)}
                                disabled={confirmBusyId === oid}
                                className="btn-ghost !py-1 !px-3 !text-xs"
                              >
                                Not yet
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <ul className="text-sm text-navy-900/70 dark:text-sand-100/70 space-y-1 mb-2">
                        {o.items.map((it, i) => (
                          <li key={i}>{it.qty} × {it.name} — ${it.lineTotal.toFixed(2)}</li>
                        ))}
                      </ul>

                      {o.note && (
                        <div className="text-xs bg-sand-100 dark:bg-white/5 rounded-md p-2 mb-2">
                          <span className="font-semibold">{t("customer.yourNote")}: </span>{o.note}
                        </div>
                      )}
                      {o.notePhotos?.length > 0 && (
                        <div className="flex gap-2 mb-2">
                          {o.notePhotos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-md overflow-hidden border border-navy-900/10 dark:border-white/10 block">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedOrder(isOpen ? null : oid)}
                        className="text-xs text-teal-700 dark:text-teal-400 font-medium hover:underline"
                      >
                        {isOpen ? "▲" : "▼"} {t("customer.orderHistory")}
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 text-xs text-navy-900/60 dark:text-sand-100/60 space-y-1 overflow-hidden"
                          >
                            {o.statusHistory?.map((h, i) => (
                              <li key={i} className="flex justify-between border-b border-navy-900/5 dark:border-white/5 pb-1">
                                <span>{h.status}</span>
                                <span>{new Date(h.at).toLocaleString()}</span>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>

                      <p className="text-right font-semibold text-navy-950 dark:text-sand-100 mt-2">{t("common.total")}: ${o.total.toFixed(2)}</p>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </motion.div>
        )}

        {tab === "notifications" && (
          <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {notifications.length > 0 && (
              <div className="flex justify-end">
                <button onClick={clearNotifications} className="text-xs text-clay-600 dark:text-clay-400 hover:underline">
                  Clear all notifications
                </button>
              </div>
            )}
            {notifications.length === 0 && <p className="text-navy-900/60 dark:text-sand-100/60">{t("customer.noNotifications")}</p>}
            {notifications.map((n) => (
              <div key={n._id || n.id} className={`card !p-3 flex items-start gap-3 ${n.read ? "opacity-60" : ""}`}>
                <span className="text-teal-600 mt-0.5">●</span>
                <div>
                  <p className="text-sm text-navy-950 dark:text-sand-100">{n.message}</p>
                  <p className="text-xs text-navy-900/40 dark:text-sand-100/40">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
