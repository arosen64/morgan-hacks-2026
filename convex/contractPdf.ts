"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

// These globals are available in the Convex Node.js runtime
declare const process: { env: Record<string, string | undefined> };
declare const Buffer: {
  from(data: ArrayBuffer): { toString(encoding: string): string };
};

export const extractContractFromPdf = action({
  args: { pdfBytes: v.bytes() },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const base64 = Buffer.from(args.pdfBytes).toString("base64");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64,
                  },
                },
                {
                  text: "Extract the full text content of this document. Return only the extracted text, preserving paragraph structure.",
                },
              ],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText} — ${errorBody}`,
      );
    }

    const data = await response.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return text;
  },
});
