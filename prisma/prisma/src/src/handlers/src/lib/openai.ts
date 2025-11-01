import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Função para chamadas de texto normais
export async function callOpenAI(messages: { role: string; content: string }[]) {
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
    max_tokens: 500,
    temperature: 0.6
  });
  return resp.choices?.[0]?.message?.content ?? "Desculpa, não consegui responder agora.";
}

// Transcribe audio file (Whisper ou OpenAI audio)
export async function transcribeAudio(filePath: string) {
  const stream = fs.createReadStream(filePath);
  const resp = await client.audio.transcriptions.create({
    file: stream,
    model: "whisper-1", 
  });
  return resp.text || "";
}

// Analisa imagem: retorna uma breve descrição (Forçando a tipagem para o compilador aceitar)
export async function analyzeImage(filePath: string) {
  // 1. Ler o arquivo e codificar em Base64
  const imageBase64 = fs.readFileSync(filePath, { encoding: 'base64' });

  const resp = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        // FORÇA A TIPAGEM 'as any' para contornar o erro TS2769 do compilador
        content: [
          { type: "text", text: "Descreva esta imagem em detalhes." },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ] as any, // <--- O PONTO CRÍTICO PARA O BUILD
      },
    ],
    max_tokens: 300,
  });

  return resp.choices?.[0]?.message?.content ?? "Desculpa, não consegui descrever a imagem.";
}
