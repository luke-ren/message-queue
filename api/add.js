import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
let client = null;

async function connect() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db("smsdb").collection("messages");
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: "Missing phone or message" });
    }

    try {
      const col = await connect();
      await col.insertOne({
        phone,
        message,
        status: "queued",
        createdAt: new Date()
      });
      res.status(200).json({ status: "queued" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}