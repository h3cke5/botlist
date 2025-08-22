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
  if (req.method !== "GET") return res.status(405).json({ error: "Método não permitido" });

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId necessário" });

  try {
    const db = await connectToDatabase();
    const bots = await db.collection("bots").find({ userId }).toArray();
    return res.status(200).json(bots);
  } catch (err) {
    console.error("Erro /api/get-bots:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
