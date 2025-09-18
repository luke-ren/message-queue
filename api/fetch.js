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
  if (req.method === "GET") {
    try {
      const col = await connect();
      const docs = await col.find({ status: "queued" }).limit(10).toArray();

      // mark them as "sent" so they don't get re-fetched
      const ids = docs.map(d => d._id);
      if (ids.length > 0) {
        await col.updateMany({ _id: { $in: ids } }, { $set: { status: "sent" } });
      }

      res.status(200).json(docs);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}