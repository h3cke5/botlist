// api/test-db.js
import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: "❌ MONGODB_URI não configurada!" });
  }

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("🔌 Tentando conectar ao MongoDB...");
    await client.connect();

    const dbName = process.env.MONGODB_DB || "hecka";
    const db = client.db(dbName);

    // só conta quantos documentos tem
    const collections = await db.listCollections().toArray();

    console.log("✅ Conexão bem-sucedida!");
    res.status(200).json({
      ok: true,
      db: dbName,
      collections: collections.map(c => c.name),
    });
  } catch (err) {
    console.error("❌ Erro de conexão:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
