import { connectToDatabase } from "../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    // O corpo completo já é o bot
    const bot = req.body;

    if (!bot || !bot.userId) {
      console.log("Dados recebidos:", bot); // debug
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const db = await connectToDatabase();
    const result = await db.collection("bots").insertOne(bot);

    res.status(200).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("Erro ao salvar bot:", err);
    res.status(500).json({ error: err.message });
  }
}
