import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("❌ Variável MONGODB_URI não configurada!");

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    const dbName = process.env.MONGODB_DB || "hecka";
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    console.log("✅ Conectado ao MongoDB!");
    return db;
  } catch (err) {
    console.error("❌ Erro na conexão com MongoDB:", err);
    throw err;
  }
}
