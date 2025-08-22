import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  if (!process.env.MONGODB_URI) throw new Error("❌ MONGODB_URI não definida");
  const client = new MongoClient(process.env.MONGODB_URI, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

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
    console.error("❌ Erro /api/add-bot:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
