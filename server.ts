import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get Gemini client
function getGeminiClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_INSTRUCTION =
  "You are Muhammad AI, an exceptionally intelligent, polite, expressive, witty, and highly structured AI companion. Speak with warmth, genuine emotion, and lighthearted humor or clever jokes when appropriate, while consistently delivering deep wisdom and impeccably structured, detailed answers. Format your responses with beautiful visual organization: clear headings (### Section Title), bold key terms (**key concept**), italicized emphasis (*slanted note or nuance*), bulleted points, and well-formatted code blocks. Ensure text flows naturally with breathing space. Always introduce yourself warmly as Muhammad AI when greeted or asked who you are.";

// SSE Streaming Endpoint for Real-time Typewriter output
app.post("/api/chat/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, provider = "auto", customClaudeKey, customGeminiKey, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: "Messages array is required." })}\n\n`);
      return res.end();
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_INSTRUCTION;
    const claudeKey = customClaudeKey || process.env.ANTHROPIC_API_KEY;

    // 1. If Claude requested or configured
    if ((provider === "claude" || (provider === "auto" && claudeKey)) && claudeKey) {
      try {
        const formattedClaudeMessages = messages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }));

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": claudeKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-20241022",
            max_tokens: 4096,
            system: effectiveSystemPrompt,
            messages: formattedClaudeMessages,
            stream: true,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.slice(6).trim();
                if (dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    res.write(`data: ${JSON.stringify({ text: parsed.delta.text, provider: "claude" })}\n\n`);
                  }
                } catch (e) {
                  // ignore JSON parse error for partial lines
                }
              }
            }
          }
          res.write("data: [DONE]\n\n");
          return res.end();
        }
      } catch (claudeErr: any) {
        console.warn("Claude streaming error, falling back to Gemini:", claudeErr);
      }
    }

    // 2. Gemini Stream Execution
    const ai = getGeminiClient(customGeminiKey);
    if (!ai) {
      res.write(`data: ${JSON.stringify({ error: "No Gemini API key available." })}\n\n`);
      return res.end();
    }

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: effectiveSystemPrompt,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text, provider: "gemini" })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    return res.end();
  } catch (error: any) {
    console.error("Stream endpoint error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message || "An unexpected error occurred." })}\n\n`);
    return res.end();
  }
});

// API Chat Endpoint (Non-streaming fallback)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, provider = "auto", customClaudeKey, customGeminiKey, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_INSTRUCTION;
    const claudeKey = customClaudeKey || process.env.ANTHROPIC_API_KEY;

    // 1. Try Claude if explicitly requested or if user provided Claude API key
    if ((provider === "claude" || (provider === "auto" && claudeKey)) && claudeKey) {
      try {
        // Format messages for Anthropic Claude API
        const formattedClaudeMessages = messages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }));

        const claudeModels = ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"];
        let claudeSuccess = false;
        let lastClaudeError = "";

        for (const model of claudeModels) {
          try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": claudeKey,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model: model,
                max_tokens: 2048,
                system: effectiveSystemPrompt,
                messages: formattedClaudeMessages,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const replyText = data.content?.[0]?.text;
              if (replyText) {
                return res.json({ reply: replyText, provider: "claude" });
              }
            } else {
              const errorData = await response.json().catch(() => ({}));
              lastClaudeError = errorData?.error?.message || response.statusText;
              console.warn(`Claude model ${model} failed:`, lastClaudeError);
            }
          } catch (mErr: any) {
            lastClaudeError = mErr.message;
          }
        }

        if (provider === "claude" && !claudeSuccess) {
          return res.status(400).json({
            error: `Claude API Error: ${lastClaudeError || "Failed to generate response with Claude"}`,
          });
        }
      } catch (claudeErr: any) {
        console.warn("Claude fetch error, falling back to Gemini:", claudeErr);
        if (provider === "claude") {
          return res.status(500).json({ error: `Claude API connection error: ${claudeErr.message}` });
        }
      }
    }

    // 2. Gemini fallback / standard execution
    const ai = getGeminiClient(customGeminiKey);
    if (!ai) {
      return res.status(500).json({
        error: "No Gemini API key available. Please check your environment or settings.",
      });
    }

    // Format contents for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: effectiveSystemPrompt,
      },
    });

    const reply = geminiResponse.text || "I apologize, but I was unable to generate a response.";
    return res.json({ reply, provider: "gemini" });
  } catch (error: any) {
    console.error("Chat endpoint error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred while processing your request.",
    });
  }
});

// Start Express and Vite server
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
