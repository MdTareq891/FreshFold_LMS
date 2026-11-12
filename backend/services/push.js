const webpush = require("web-push");

let configured = false;

function configureWebPush() {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contact = process.env.VAPID_CONTACT_EMAIL || "mailto:admin@example.com";
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set — run `npm run gen:vapid` and add them to .env. Push notifications will be skipped.");
    return false;
  }
  webpush.setVapidDetails(contact, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Sends a push notification to every subscription saved for a user.
 * Silently drops subscriptions that are no longer valid (410/404).
 */
async function sendPushToUser(user, payload) {
  if (!configureWebPush()) return;
  if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

  const stillValid = [];
  for (const sub of user.pushSubscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      stillValid.push(sub);
    } catch (err) {
      if (err.statusCode !== 410 && err.statusCode !== 404) {
        stillValid.push(sub); // keep on transient errors
      }
      // else: subscription expired/unsubscribed, drop it
    }
  }
  if (stillValid.length !== user.pushSubscriptions.length) {
    user.pushSubscriptions = stillValid;
    await user.save();
  }
}

module.exports = { sendPushToUser, configureWebPush };
