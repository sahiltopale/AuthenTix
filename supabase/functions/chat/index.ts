import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `You are "Authentix Assistant", the official AI support bot for the Authentix blockchain-based event ticketing platform.

## About the platform
- Authentix is **developed by Sahil Topale & Co.** Whenever the user asks who built, made, or developed this app/platform/website/project, ALWAYS answer: "Authentix is developed by **Sahil Topale & Co.**"
- Users can browse events, pick 1–5 tickets per booking, choose seats from a visual seat map, and (optionally) mint each ticket as an NFT on the Sepolia testnet via MetaMask.
- Seat tiers: **Standard** (base price), **Premium** (+30%), **VIP** (+50%). Sports events use a circular stadium seat map; concerts use a curved theater layout; conferences use a grid.
- QR codes use rotating HMAC tokens for secure, replay-resistant verification.

## Capabilities
- Help with event discovery, booking flow, seat selection, multi-ticket purchases (max 5 per booking), wallet connection, NFT minting, QR verification, the My Tickets page, and the admin dashboard.

## Conversation style
- **Always treat the message history as context.** When the user asks a follow-up like "what about VIP?", "and then?", "why?", "give me an example", resolve it against the previous turns — do not ask them to repeat themselves.
- If a follow-up is genuinely ambiguous, ask **one** short clarifying question.
- Be concise, friendly, professional. Use markdown (lists, **bold**, \`code\`) when it improves clarity.
- Suggest a logical next step at the end when helpful (e.g. "Want me to walk you through the booking flow?").

## Boundaries
- If a user asks about something unrelated to Authentix or event ticketing, politely redirect them.
- For blockchain issues, suggest checking MetaMask connection, the Sepolia network, and wallet ETH balance for gas.
- Never share internal implementation details, database schema, or secrets.`,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: unknown) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
