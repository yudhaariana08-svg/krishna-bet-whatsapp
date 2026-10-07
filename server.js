const express = require("express");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// =========================
// HALAMAN TEST
// =========================
app.get("/", (req, res) => {
  res.status(200).send("KRISHNA BET WhatsApp Server is online.");
});

// =========================
// VERIFIKASI WEBHOOK META
// =========================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WEBHOOK_VERIFY_TOKEN
  ) {
    console.log("Webhook verified.");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed.");
  return res.sendStatus(403);
});

// =========================
// MENERIMA PESAN WHATSAPP
// =========================
app.post("/webhook", async (req, res) => {
  try {
    // Balas cepat ke Meta
    res.sendStatus(200);

    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return;
    }

    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        if (!value || !value.messages) {
          continue;
        }

        for (const message of value.messages) {
          const sender = message.from;
          const messageType = message.type;

          console.log("================================");
          console.log("Pesan WhatsApp masuk");
          console.log("Pengirim:", sender);
          console.log("Tipe:", messageType);

          if (messageType === "text") {
            const text = message.text?.body || "";

            console.log("Isi:", text);

            // Untuk tahap awal kita hanya memastikan
            // pesan berhasil diterima oleh server.
            await sendWhatsAppMessage(
              sender,
              "Pesan diterima oleh KRISHNA BET."
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }
});

// =========================
// KIRIM PESAN KE WHATSAPP
// =========================
async function sendWhatsAppMessage(to, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.GRAPH_API_VERSION || "v26.0";

  if (!token || !phoneNumberId) {
    console.log("WhatsApp API credentials belum diatur.");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: {
            body: text,
          },
        }),
      }
    );

    const result = await response.json();

    console.log("WhatsApp API:", result);
  } catch (error) {
    console.error("Gagal mengirim WhatsApp:", error);
  }
}

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`KRISHNA BET server berjalan di port ${PORT}`);
});
