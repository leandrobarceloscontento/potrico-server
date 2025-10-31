import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { callOpenAI, transcribeAudio, analyzeImage } from "../lib/openai";
import { sendTextToWhatsApp, downloadMediaFromWhatsApp } from "../lib/whatsapp";
import { processMedia } from "../lib/media";

const SYSTEM_PROMPT = `Você é Potrico, chatbot vendedor da Redemac Camobi. Responda em português (pt-BR).
Tom: conversinha + profissional amistoso. Não seja invasivo; "sinta a temperatura" antes de tentar fechar.
Nunca mencione preços de outras lojas ou enalteça concorrentes.
Horário da loja: Seg–Sex 07:45–12:00 & 13:30–18:00; Sáb 07:45–12:15.
Durante a conversa, coletar sutilmente nome, endereço e materiais necessários. Se o cliente disser "Ana" ou "Ana Paula", responda: "O Leandro me comentou de você! Temos que te impressionar nesse piloto de testes!".
Se for necessário buscar produto, priorize DB; se não encontrar, diga que vai checar e peça um instante.
Se for push/promoções, confirme opt-in antes de enviar.
Seja sucinto em respostas iniciais (1–3 frases), ofereça opções (ver catálogo / falar com vendedor / pedir orçamento).`;

export async function handleWebhook(req: Request, res: Response, prisma: PrismaClient) {
  const body = req.body;

  // Exemplo genérico: adapte ao payload do seu provedor.
  const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] || body.message || body.messages?.[0] || body;
  const from = msg?.from || msg?.from_phone || msg?.sender?.id || body?.contact?.wa_id;
  if (!from) return res.status(400).send("no from");

  // Detect text or media
  const text = msg?.text?.body || msg?.text;
  const hasAudio = msg?.audio || (msg?.type === "audio");
  const hasImage = msg?.image || (msg?.type === "image");
  const mediaId = msg?.audio?.id || msg?.image?.id || msg?.media?.id;

  // Get or create user
  let user = await prisma.user.findUnique({ where: { phone: from } });
  if (!user) user = await prisma.user.create({ data: { phone: from } });

  // Upsert conversation (simple)
  let conv = await prisma.conversation.findFirst({ where: { userId: user.id } });
  if (!conv) conv = await prisma.conversation.create({ data: { userId: user.id } });

  // Handle media: download -> transcribe/analyze -> append to text
  let processedText = text || "";
  if (mediaId) {
    try {
      const filePath = await downloadMediaFromWhatsApp(mediaId);
      if (hasAudio) {
        const transcript = await transcribeAudio(filePath);
        processedText += `\n[Áudio transcrito]: ${transcript}`;
      } else if (hasImage) {
        const imgDesc = await analyzeImage(filePath);
        processedText += `\n[Imagem analisada]: ${imgDesc}`;
      }
      // optional: delete file after use
    } catch (e) {
      console.error("media processing error", e);
    }
  }

  if (!processedText) return res.status(400).send("no content");

  // save inbound message
  await prisma.message.create({
    data: { conversationId: conv.id, role: "user", content: processedText }
  });

  // build chat history
  const lastMessages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 12
  });

  const chatMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...lastMessages.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  ];

  // call OpenAI
  const aiResponse = await callOpenAI(chatMessages);

  // save assistant message
  await prisma.message.create({
    data: { conversationId: conv.id, role: "assistant", content: aiResponse }
  });

  // send to whatsapp
  await sendTextToWhatsApp(from, aiResponse);

  res.sendStatus(200);
}
