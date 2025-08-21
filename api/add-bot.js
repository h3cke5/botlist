// api/add-bot.js
import { connectToDatabase } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const bot = req.body; // recebe o objeto completo com userId já dentro

    if (!bot || !bot.userId) return res.status(400).json({ error: "Dados incompletos" });

    const db = await connectToDatabase();
    await db.collection("bots").insertOne(bot);

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
