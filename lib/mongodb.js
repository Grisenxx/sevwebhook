// lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let client;
let clientPromise;

if (!uri) {
  throw new Error('Tilføj MONGODB_URI i Vercel Environment Variables!');
}

if (process.env.NODE_ENV === 'development') {
  // I dev: genbrug client hvis den findes (hot reload venligt)
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      // anbefalede options til serverless
      maxPoolSize: 10,          // begræns connections
      minPoolSize: 2,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
    });
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // I production: ny client pr. cold start
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  });
  clientPromise = client.connect();
}

export default clientPromise;