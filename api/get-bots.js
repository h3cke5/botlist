import { connectToDatabase } from "../lib/db";

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "UserId necessário" });

  const db = await connectToDatabase();
  const bots = await db.collection("bots").find({ userId }).toArray();

  res.status(200).json(bots);
}
