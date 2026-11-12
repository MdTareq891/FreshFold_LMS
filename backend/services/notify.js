const Notification = require("../models/Notification");
const { sendEmail } = require("./email");
const { sendPushToUser } = require("./push");

/**
 * Fires all notification channels for a user in parallel:
 * - saves an in-app Notification doc
 * - emits a socket.io event to that user's room (instant UI update)
 * - sends an email (if the user has an email and Gmail is configured)
 * - sends a browser push (if the user has an active push subscription)
 *
 * `io` is the Socket.io server instance (passed in from server.js).
 */
async function notifyUser(io, user, { message, title, emailSubject }) {
  const notif = await Notification.create({ userId: user._id, message });

  if (io) {
    io.to(`user:${user._id}`).emit("notification", {
      id: notif._id,
      message,
      read: false,
      createdAt: notif.createdAt,
    });
  }

  // Fire-and-forget external channels — don't block the API response on them
  sendEmail({
    to: user.email,
    subject: emailSubject || "FreshFold Laundry — Order Update",
    text: message,
    html: `<p>Hi ${user.name},</p><p>${message}</p><p style="color:#888;font-size:12px">— FreshFold Laundry</p>`,
  }).catch(() => {});

  sendPushToUser(user, {
    title: title || "FreshFold Laundry",
    body: message,
  }).catch(() => {});

  return notif;
}

module.exports = { notifyUser };
