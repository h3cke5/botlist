import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // URL do seu MongoDB
const options = {};

let client;
let clientPromise;

if (!uri) {
  throw new Error("Por favor defina a variável MONGODB_URI no .env");
}

if (process.env.NODE_ENV === "development") {
  // Em desenvolvimento, mantém a conexão para não criar várias
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // Em produção, cria uma nova conexão
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db("botlist"); // nome do banco
  return { client, db };
}
