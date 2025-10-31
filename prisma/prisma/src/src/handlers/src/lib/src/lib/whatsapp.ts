import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
const API_URL = `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`;
const MEDIA_URL = `https://graph.facebook.com/v17.0/`;

export async function sendTextToWhatsApp(to: string, text: string) {
  const payload = {
    messaging_product: "whatsapp",
    to,
    text: { body: text }
  };
  return axios.post(API_URL, payload, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
}

// Download media given media ID (WhatsApp Cloud)
export async function downloadMediaFromWhatsApp(mediaId: string) {
  // 1) get media URL
  const res = await axios.get(`${MEDIA_URL}${mediaId}`, {
    params: { fields: "url" },
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const url = res.data.url;
  // 2) download binary
  const r2 = await axios.get(url, { responseType: "arraybuffer" });
  const ext = (res.headers && res.headers['content-type']) ? res.headers['content-type'].split('/')[1] : 'bin';
  const fileName = path.join("/tmp", `${mediaId}.${ext}`);
  fs.writeFileSync(fileName, Buffer.from(r2.data));
  return fileName;
}
