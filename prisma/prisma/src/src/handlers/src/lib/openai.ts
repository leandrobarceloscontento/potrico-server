import OpenAI from "openai";
import fs from "fs";
// import FormData from "form-data"; // Removido, pois não é necessário para análise de imagem via Visão

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

// Analisa imagem: retorna uma breve descrição (CORRIGIDO)
export async function analyzeImage(filePath: string) {
  // 1. Ler o arquivo e codificar em Base64
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  const resp = await client.chat.completions.create({
    model: "gpt-4o", // Modelo que suporta visão (recomendado)
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Descreva esta imagem em detalhes." },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`, // Certifique-se de que o tipo MIME é o correto (jpeg, png, etc.)
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  return resp.choices?.[0]?.message?.content ?? "Desculpa, não consegui descrever a imagem.";
}
