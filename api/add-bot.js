import { connectToDatabase } from "../../lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const { bot, userId } = req.body;a

    if (!bot || !userId) return res.status(400).json({ error: "Dados incompletos" });

    const db = await connectToDatabase();
    await db.collection("bots").insertOne({ ...bot, userId });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
