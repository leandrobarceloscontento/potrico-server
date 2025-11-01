import express from "express";
import bodyParser from "body-parser";
import { handleWebhook } from "./handlers/webhook"; // Caminho OK
import { PrismaClient } from "@prisma/client";
import { sendTextToWhatsApp } from "./lib/whatsapp"; // CORRIGIDO: Importação estática
// import { sendTextToWhatsApp } from "./lib/whatsapp" é o caminho correto se 'whatsapp.ts' está em 'src/lib/'

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/webhook", async (req, res) => {
  try {
    await handleWebhook(req, res, prisma);
  } catch (err) {
    console.error("webhook error", err);
    res.status(500).send("error");
  }
});

app.post("/admin/send", async (req, res) => {
  const { phone, text } = req.body;
  if (!phone || !text) return res.status(400).json({ error: "phone/text required" });
  
  // Linha anterior (removida): const { sendTextToWhatsApp } = await import("./lib/whatsapp");
  
  const r = await sendTextToWhatsApp(phone, text);
  res.json(r.data || r);
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Potrico server running on ${PORT}`));
