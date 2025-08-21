import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI; // coloque sua URI do Mongo no .env
  const client = new MongoClient(uri);

  await client.connect();
  const db = client.db(); // pega o banco da URI

  cachedClient = client;
  cachedDb = db;

  return db;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const bot = req.body;

    // Validação básica
    if (!bot || !bot.userId || !bot.name) {
      console.log("Dados recebidos inválidos:", bot);
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const db = await connectToDatabase();
    const result = await db.collection("bots").insertOne(bot);

    res.status(200).json({ ok: true, insertedId: result.insertedId });
  } catch (err) {
    console.error("Erro ao salvar bot:", err);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}
