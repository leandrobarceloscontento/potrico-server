import OpenAI from "openai";
import fs from "fs";
import FormData from "form-data";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(messages: { role: string; content: string }[]) {
  const resp = await client.chat.completions.create({
    model: "gpt-5-mini", // Use o modelo que estiver disponível
    messages: messages.map(m => ({ role: m.role as any, content: m.content })),
    max_tokens: 500,
    temperature: 0.6
  });
  return resp.choices?.[0]?.message?.content ?? "Desculpa, não consegui responder agora.";
}

// Transcribe audio file (Whisper or OpenAI audio)
export async function transcribeAudio(filePath: string) {
  const stream = fs.createReadStream(filePath);
  // Nota: o nome do modelo pode mudar. Use o modelo Whisper disponível.
  const resp = await client.audio.transcriptions.create({
    file: stream,
    model: "whisper-1" // Modelo Whisper padrão
  } as any);
  return resp.text || "";
}

// Analyze image: returns short description
export async function analyzeImage(filePath: string) {
  // Para usar o gpt-4-turbo com visão (vision), é preciso codificar a imagem em base64 e enviar no prompt
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  const messages = [
    {
      role: "user",
      content: [
        { type: "text", text: "Descreva a imagem detalhadamente para um assistente de vendas em 50 palavras, focando em materiais de construção, cor, ou estilo." },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    }
  ];

  const resp = await client.chat.completions.create({
    model: "gpt-4-turbo", // Modelo que suporta visão
    messages: messages as any,
    max_tokens: 300,
  });

  return resp.choices?.[0]?.message?.content ?? "Imagem recebida - não foi possível descrever.";
}
