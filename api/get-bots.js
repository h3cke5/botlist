// api/get-bots.js
import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ Variável MONGODB_URI não configurada no .env ou no painel da Vercel!");

  try {
    console.log("🔌 Conectando ao MongoDB...");
    const client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log("✅ Conectado ao MongoDB!");

    const dbName = process.env.MONGODB_DB || "hecka";
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (err) {
    console.error("❌ Erro na conexão com MongoDB:", err);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      console.warn("⚠️ Nenhum userId recebido:", req.query);
      return res.status(400).json({ error: "UserId necessário" });
    }

    const db = await connectToDatabase();

    const bots = await db.collection("bots").find({ userId }).toArray();

    console.log(`✅ ${bots.length} bots encontrados para userId=${userId}`);

    return res.status(200).json(bots);
  } catch (err) {
    console.error("❌ Erro no handler /api/get-bots:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
