import OpenAI from "openai";
import fs from "fs";
import FormData from "form-data";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(messages: { role: string; content: string }[]) {
  const resp = await client.chat.completions.create({
    model: "gpt-5-mini",
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    max_tokens: 500,
    temperature: 0.6
  });
  return resp.choices?.[0]?.message?.content ?? "Desculpa, não consegui responder agora.";
}

// Transcribe audio file (Whisper or OpenAI audio)
export async function transcribeAudio(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const resp = await client.audio.transcriptions.create({
    file: stream,
    model: "gpt-5-mini-transcribe" // ajuste conforme disponibilidade
  } as any);
  return resp.text || "";
}

// Analyze image: returns short description
export async function analyzeImage(filePath: string) {
  const image = fs.createReadStream(filePath);
  const resp = await client.images.analyze?.({
    model: "gpt-5-mini-image",
    image
  } as any);
  // If the SDK doesn't support images.analyze, you can instead encode and send to chat with system prompt
  if (resp && (resp as any).description) return (resp as any).description;
  // fallback: send a prompt to chat asking to describe image given binary? (not ideal)
  return "imagem recebida — não foi possível descrever com o SDK atual.";
}
