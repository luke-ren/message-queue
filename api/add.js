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
  console.log(`[${new Date().toISOString()}] Add API - ${req.method} request received`);
  
  if (req.method === "POST") {
    const { phone, message } = req.body;
    console.log(`[${new Date().toISOString()}] Add API - Processing message for phone: ${phone}`);
    
    if (!phone || !message) {
      console.warn(`[${new Date().toISOString()}] Add API - Validation failed: Missing phone or message`);
      return res.status(400).json({ error: "Missing phone or message" });
    }

    try {
      console.log(`[${new Date().toISOString()}] Add API - Connecting to database`);
      const col = await connect();
      
      const messageData = {
        phone,
        message,
        status: "queued",
        createdAt: new Date()
      };
      
      console.log(`[${new Date().toISOString()}] Add API - Inserting message to queue`);
      await col.insertOne(messageData);
      
      console.log(`[${new Date().toISOString()}] Add API - Message queued successfully for phone: ${phone}`);
      res.status(200).json({ status: "queued" });
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Add API - Database error:`, e.message);
      res.status(500).json({ error: e.message });
    }
  } else {
    console.warn(`[${new Date().toISOString()}] Add API - Method not allowed: ${req.method}`);
    res.status(405).json({ error: "Method not allowed" });
  }
}