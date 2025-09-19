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
  console.log(`[${new Date().toISOString()}] Fetch API - ${req.method} request received`);
  
  if (req.method === "GET") {
    try {
      console.log(`[${new Date().toISOString()}] Fetch API - Connecting to database`);
      const col = await connect();
      
      console.log(`[${new Date().toISOString()}] Fetch API - Fetching queued messages (limit: 10)`);
      const docs = await col.find({ status: "queued" }).limit(10).toArray();
      
      console.log(`[${new Date().toISOString()}] Fetch API - Found ${docs.length} queued messages`);

      // mark them as "sent" so they don't get re-fetched
      const ids = docs.map(d => d._id);
      if (ids.length > 0) {
        console.log(`[${new Date().toISOString()}] Fetch API - Updating ${ids.length} messages status to "sent"`);
        await col.updateMany({ _id: { $in: ids } }, { $set: { status: "sent" } });
        console.log(`[${new Date().toISOString()}] Fetch API - Successfully updated ${ids.length} messages to sent status`);
      } else {
        console.log(`[${new Date().toISOString()}] Fetch API - No messages to update`);
      }

      console.log(`[${new Date().toISOString()}] Fetch API - Returning ${docs.length} messages`);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(docs);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Fetch API - Database error:`, e.message);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: e.message });
    }
  } else {
    console.warn(`[${new Date().toISOString()}] Fetch API - Method not allowed: ${req.method}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(405).json({ error: "Method not allowed" });
  }
}