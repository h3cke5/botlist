import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definida!");

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(process.env.MONGODB_DB || "hecka");

  cachedClient = client;
  cachedDb = db;

  return db;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido" });

  try {
    const bot = req.body;
    if (!bot || !bot.userId || !bot.name) return res.status(400).json({ error: "Dados incompletos" });

    const db = await connectToDatabase();
    const result = await db.collection("bots").insertOne(bot);

    return res.status(200).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("Erro /api/add-bot:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
