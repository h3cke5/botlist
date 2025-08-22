export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
    if (!WEBHOOK_URL) throw new Error("DISCORD_WEBHOOK_URL não configurado!");

    const result = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!result.ok) throw new Error("Erro no envio do webhook");

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro /api/send-webhook:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
