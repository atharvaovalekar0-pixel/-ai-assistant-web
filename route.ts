import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const MODEL_NAME = "gemini-2.5-flash"; // works broadly; swap to "gemini-3-flash-preview" or similar if your key has access to a newer model

const SYSTEM_INSTRUCTION =
  "You are a helpful, knowledgeable general-purpose assistant. Answer clearly and " +
  "directly. When a question depends on current or time-sensitive information " +
  "(news, prices, recent events, current holders of a position, etc.), use the " +
  "web search tool rather than guessing from memory.";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Set it in your Vercel project's environment variables." },
      { status: 500 }
    );
  }

  let body: { history: ChatMessage[]; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { history, message } = body;
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing 'message' field." }, { status: 400 });
  }

  const client = new GoogleGenAI({ apiKey });

  // Convert prior turns (everything before this new message) into the
  // Content[] shape the SDK expects, then create a chat seeded with them.
  const contents = (history || []).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  try {
    const chat = client.chats.create({
      model: MODEL_NAME,
      history: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const response = await chat.sendMessage({ message });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API error:", err);
    return NextResponse.json(
      { error: "Something went wrong talking to Gemini. Check your API key and try again." },
      { status: 500 }
    );
  }
}
