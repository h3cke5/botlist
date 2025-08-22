import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não definida");

  const client = new MongoClient(uri, {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const dbName = process.env.MONGODB_DB || "hecka"; // banco específico
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  return db;
}

export default async function handler(req, res) {
  try {
    const db = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    res.status(200).json({ ok: true, collections });
  } catch (err) {
    console.error("Erro no teste de DB:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
