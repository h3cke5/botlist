// api/add-bot.js
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

    const dbName = process.env.MONGODB_DB || "hecka"; // se não definir, usa "hecka"
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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const bot = req.body;

    if (!bot || !bot.userId || !bot.name) {
      console.warn("⚠️ Dados inválidos recebidos:", bot);
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const db = await connectToDatabase();
    const result = await db.collection("bots").insertOne(bot);

    console.log("✅ Bot salvo com ID:", result.insertedId);

    return res.status(200).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("❌ Erro no handler /api/add-bot:", err);
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
