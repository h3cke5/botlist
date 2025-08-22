import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("❌ Variável MONGODB_URI não está definida");
  }

  console.log("🔗 Tentando conectar ao MongoDB...");

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log("✅ Conectado ao MongoDB com sucesso");

    const dbName = uri.split("/").pop().split("?")[0]; // pega o nome depois da última /
    const db = client.db(dbName || "test");

    cachedClient = client;
    cachedDb = db;

    return db;
  } catch (err) {
    console.error("❌ Erro na conexão com MongoDB:", err.message);
    throw err;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const bot = req.body;

    // Validação
    if (!bot || !bot.userId || !bot.name) {
      console.warn("⚠️ Dados inválidos recebidos:", bot);
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const db = await connectToDatabase();

    const result = await db.collection("bots").insertOne(bot);

    console.log("✅ Bot salvo no MongoDB:", result.insertedId);

    res.status(200).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("🔥 Erro ao salvar bot:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
