import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import client from "../api/client";
import PublicTopBar from "../components/PublicTopBar";
import StatusBadge from "../components/StatusBadge";

function buildReceiptText(order) {
  const lines = [];
  lines.push("FRESHFOLD LAUNDRY — RECEIPT");
  lines.push("----------------------------");
  lines.push(`Order No: ${order.orderNo}`);
  lines.push(`Customer: ${order.customerName}`);
  lines.push(`Date placed: ${new Date(order.createdAt).toLocaleString()}`);
  lines.push(`Pickup date: ${order.pickupDate || "-"}`);
  lines.push(`Address: ${order.address || "-"}`);
  lines.push(`Status: ${order.status}`);
  lines.push(`Payment: ${order.paid ? "Paid" : "Unpaid"}`);
  lines.push("----------------------------");
  lines.push("Items:");
  order.items.forEach((it) => {
    lines.push(`${it.qty} x ${it.name} = $${it.lineTotal.toFixed(2)}`);
  });
  lines.push("----------------------------");
  lines.push(`TOTAL: $${order.total.toFixed(2)}`);
  return lines.join("\n");
}

export default function Receipt() {
  const { token } = useParams();
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get(`/orders/receipt/${token}`)
      .then((res) => setOrder(res.data.order))
      .catch((err) => setError(err.response?.data?.error || t("receipt.notFound")));
  }, [token]);

  const qrText = order ? buildReceiptText(order) : "";

  if (error) {
    return (
      <div className="min-h-screen bg-sand-100 dark:bg-navy-950 flex items-center justify-center px-4">
        <div className="card max-w-sm text-center">
          <p className="text-2xl mb-2">🧾</p>
          <p className="text-navy-950 dark:text-sand-100 font-semibold mb-1">{t("receipt.notFound")}</p>
          <p className="text-sm text-navy-900/60 dark:text-sand-100/60">{error}</p>
          <Link to="/" className="text-teal-600 dark:text-teal-400 text-sm font-medium mt-4 inline-block">{t("receipt.goHome")}</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center text-navy-900/60 dark:text-sand-100/60">{t("common.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-sand-100 dark:bg-navy-950 px-4 py-10 print:bg-white">
      <PublicTopBar />
      <div className="max-w-md mx-auto card print:shadow-none print:border-none">
        <div className="text-center border-b border-dashed border-navy-900/20 dark:border-white/20 pb-4 mb-4">
          <p className="text-2xl">🧺</p>
          <h1 className="font-display text-xl text-navy-950 dark:text-sand-100">FreshFold Laundry</h1>
          <p className="text-xs text-navy-900/50 dark:text-sand-100/50">{t("receipt.official")}</p>
        </div>

        <div className="flex justify-between text-sm mb-1"><span className="text-navy-900/60 dark:text-sand-100/60">{t("receipt.orderNo")}</span><span className="font-semibold text-navy-950 dark:text-sand-100">{order.orderNo}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-navy-900/60 dark:text-sand-100/60">{t("receipt.customer")}</span><span className="font-medium text-navy-950 dark:text-sand-100">{order.customerName}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-navy-900/60 dark:text-sand-100/60">{t("receipt.datePlaced")}</span><span className="text-navy-950 dark:text-sand-100">{new Date(order.createdAt).toLocaleString()}</span></div>
        <div className="flex justify-between text-sm mb-1"><span className="text-navy-900/60 dark:text-sand-100/60">{t("receipt.pickupDate")}</span><span className="text-navy-950 dark:text-sand-100">{order.pickupDate || "—"}</span></div>
        <div className="flex justify-between text-sm mb-3"><span className="text-navy-900/60 dark:text-sand-100/60">{t("receipt.address")}</span><span className="text-navy-950 dark:text-sand-100 text-right max-w-[60%]">{order.address || "—"}</span></div>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={order.status} />
          <span className={`badge ${order.paid ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"}`}>
            {order.paid ? t("common.paid") : t("common.unpaid")}
          </span>
        </div>

        {order.note && (
          <div className="text-xs bg-sand-100 dark:bg-white/5 rounded-md p-2 mb-3">
            <span className="font-semibold">{t("customer.yourNote")}:</span> {order.note}
          </div>
        )}

        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-navy-900/50 dark:text-sand-100/40 border-b border-navy-900/10 dark:border-white/10">
              <th className="py-1.5">{t("staff.items")}</th>
              <th className="py-1.5 text-center">Qty</th>
              <th className="py-1.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-900/5 dark:divide-white/5">
            {order.items.map((it, i) => (
              <tr key={i}>
                <td className="py-1.5 dark:text-sand-100">{it.name}</td>
                <td className="py-1.5 text-center dark:text-sand-100">{it.qty}</td>
                <td className="py-1.5 text-right dark:text-sand-100">${it.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between border-t border-navy-900/10 dark:border-white/10 pt-2 mb-5">
          <span className="font-semibold text-navy-950 dark:text-sand-100">{t("common.total")}</span>
          <span className="font-display text-lg text-navy-950 dark:text-sand-100">${order.total.toFixed(2)}</span>
        </div>

        <div className="flex flex-col items-center gap-2 border-t border-dashed border-navy-900/20 dark:border-white/20 pt-4">
          <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG value={qrText} size={140} fgColor="#0f2338" level="M" />
          </div>
          <p className="text-[11px] text-navy-900/40 dark:text-sand-100/40 text-center">{t("receipt.scanHint")}</p>
        </div>

        <button onClick={() => window.print()} className="btn-ghost w-full mt-5 print:hidden">{t("receipt.print")}</button>
      </div>
    </div>
  );
}
