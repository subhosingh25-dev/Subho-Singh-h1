import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

const app = express();
const PORT = 3000;

app.use(express.json());

// Free Self-Hosted VAPID Keys for WebPush
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "UUxI2pxjhqn5_XmH2kYV8JbW6L6bWk_J1w8L_9B8k1o";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@velvetboxs.com";

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn("VAPID setup notice:", e);
}

// In-memory persistent subscription store
interface PushSubscriptionRecord {
  subscription: webpush.PushSubscription;
  productName?: string;
  code?: string;
  url?: string;
  lastSent: number;
  subscribedAt: number;
}

const subscriptions: Map<string, PushSubscriptionRecord> = new Map();

const FUNNY_HINGLISH_JOKES = [
  {
    title: "Crush nahi hai jo ignore karoge! 😜",
    body: "Bhai 50% discount wait kar raha hai! Jaldi order karo coupon code use karke. 💍"
  },
  {
    title: "Mummy ki bargaining se bhi zyada discount! 😂",
    body: "Flat 50% OFF mil raha hai VelvetBoxs pe! Mauka haath se mat jaane do."
  },
  {
    title: "Shona ko gift kab de rahe ho? 🎁",
    body: "50% OFF chal raha hai, baad me mehenga padega toh mat bolna! 🏃‍♂️"
  },
  {
    title: "Padosi ko mat batana! 🤫",
    body: "Chupke se apna 50% discount jewellery order kar lo. Exclusive deal zindabad!"
  },
  {
    title: "5-Star hotel ki chai se sasta discount! ☕",
    body: "Itna bhari 50% off chhoot gaya toh bohot pachtaoge dost! ⏳"
  },
  {
    title: "Dost ko batane se pehle khud le lo! 🏃‍♂️💨",
    body: "VelvetBoxs ka 50% OFF offer timer chal raha hai! Abhi claim karo."
  },
  {
    title: "Zindagi me mauke baar baar nahi aate! 💎",
    body: "Arey abhi bhi soch rahe ho? 50% discount code active hai, tap karke khareedo!"
  }
];

let jokeIndex = 0;

// API 1: Get VAPID Public Key for client subscription
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// API 2: Register device subscription
app.post("/api/subscribe", (req, res) => {
  const { subscription, productName, code, url } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  const endpointKey = subscription.endpoint;
  subscriptions.set(endpointKey, {
    subscription,
    productName: productName || "Velvet Jewellery",
    code: code || "VELVET50",
    url: url || "/",
    lastSent: Date.now(),
    subscribedAt: Date.now()
  });

  console.log(`[Push Server] New subscriber registered! Total active: ${subscriptions.size}`);

  // Send an immediate welcome push notification
  const payload = JSON.stringify({
    title: "🎉 50% OFF Unlocked! Mauka mat chhodna!",
    body: `"${productName || 'Velvet Jewellery'}" pe 50% discount active ho gaya hai! Use Code: ${code || 'VELVET50'}`,
    url: url || "/",
    icon: "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png",
    timestamp: Date.now()
  });

  webpush.sendNotification(subscription, payload).catch((err) => {
    console.warn("[Push Server] Initial push error:", err?.statusCode || err?.message);
  });

  res.status(201).json({ success: true, totalSubscribers: subscriptions.size });
});

// API 3: Broadcast Push to all active devices (Can also be called by external free cron)
app.post("/api/trigger-push", async (req, res) => {
  const joke = FUNNY_HINGLISH_JOKES[jokeIndex % FUNNY_HINGLISH_JOKES.length];
  jokeIndex++;

  let successCount = 0;
  let failCount = 0;

  for (const [endpoint, record] of Array.from(subscriptions.entries())) {
    let body = joke.body;
    if (record.code && !body.includes(record.code)) {
      body += ` (Code: ${record.code})`;
    }

    const payload = JSON.stringify({
      title: joke.title,
      body: body,
      url: record.url || "/",
      icon: "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png",
      timestamp: Date.now()
    });

    try {
      await webpush.sendNotification(record.subscription, payload);
      record.lastSent = Date.now();
      successCount++;
    } catch (err: any) {
      failCount++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Expired subscription, remove from list
        subscriptions.delete(endpoint);
      }
    }
  }

  res.json({ success: true, sent: successCount, failed: failCount, activeSubscribers: subscriptions.size });
});

function sanitizeKey(val?: string): string {
  if (!val) return "";
  return val.replace(/['"]+/g, "").trim();
}

const ONESIGNAL_APP_ID = sanitizeKey(process.env.VITE_ONESIGNAL_APP_ID);
const ONESIGNAL_REST_API_KEY = sanitizeKey(process.env.ONESIGNAL_REST_API_KEY);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Send push notification via OneSignal Cloud REST API (only if env variables provided)
async function sendOneSignalPushNotification(title: string, body: string, url: string = "https://velvetboxs.com") {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;
  if (!UUID_REGEX.test(ONESIGNAL_APP_ID)) {
    return;
  }

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Key ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Total Subscriptions", "Subscribed Users"],
        headings: { en: title },
        contents: { en: body },
        url: url,
        chrome_web_icon: "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png",
        chrome_web_badge: "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png"
      })
    });
    const data = await response.json();
    console.log("[OneSignal Cloud Push Result]:", data);
  } catch (err) {
    console.warn("[OneSignal Cloud Push Error]:", err);
  }
}

// Automated 5-minute Background Loop inside Server
// This runs 24/7 on the server, sending OS-level WebPush directly to Google's Push Servers!
setInterval(async () => {
  const joke = FUNNY_HINGLISH_JOKES[jokeIndex % FUNNY_HINGLISH_JOKES.length];
  jokeIndex++;

  // 1. Broadcast via OneSignal Cloud Push API (reaches phones even when browser is killed!)
  sendOneSignalPushNotification(joke.title, `${joke.body} Use Code: 50% OFF`);

  // 2. Broadcast via Native WebPush VAPID
  if (subscriptions.size > 0) {
    for (const [endpoint, record] of Array.from(subscriptions.entries())) {
      let body = joke.body;
      if (record.code && !body.includes(record.code)) {
        body += ` (Code: ${record.code})`;
      }

      const payload = JSON.stringify({
        title: joke.title,
        body: body,
        url: record.url || "/",
        icon: "https://ik.imagekit.io/84hq8peasx/Untitled%20design%20-%202026-07-08T112803.563.png",
        timestamp: Date.now()
      });

      webpush.sendNotification(record.subscription, payload).catch((err: any) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          subscriptions.delete(endpoint);
        }
      });
    }
  }
}, 5 * 60 * 1000);

// Start Vite / Express server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WebPush Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
