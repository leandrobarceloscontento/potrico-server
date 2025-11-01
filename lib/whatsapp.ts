import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID!;
// Versão da API: ajuste se necessário
const API_VERSION = "v17.0"; 
const API_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_ID}/messages`;
const MEDIA_URL = `https://graph.facebook.com/${API_VERSION}/`;

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
export async function downloadMediaFromWhatsApp(mediaId: string): Promise<string> {
  // 1) get media metadata and URL
  const res = await axios.get(`${MEDIA_URL}${mediaId}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const url = res.data.url;
  const mimeType = res.data.mime_type;

  // 2) download binary
  const r2 = await axios.get(url, {
    responseType: "arraybuffer",
    headers: { Authorization: `Bearer ${TOKEN}` } // Necessário para baixar
  });
  
  // Extrai extensão do mime type (e.g., audio/ogg -> ogg)
  const ext = mimeType ? mimeType.split('/')[1] : 'bin';
  // Use um diretório temporário
  const fileName = path.join(process.cwd(), "tmp", `${mediaId}.${ext}`); 

  // Cria o diretório 'tmp' se não existir
  if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
    fs.mkdirSync(path.join(process.cwd(), "tmp"));
  }
  
  fs.writeFileSync(fileName, Buffer.from(r2.data));
  return fileName;
}
