// api/webhook.js  (eller hvor din handler er)
import stripePackage from 'stripe';
import clientPromise from '../lib/mongodb.js';   // ← din nye fil

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ... din eksisterende raw body + signature verificering ...

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const product = await stripe.products.retrieve(lineItems.data[0].price.product);
      const category = product.metadata.category; // "weekly", "monthly", "quarterly"

      if (!category) {
        console.error('Ingen category på produktet!');
        return res.json({ received: true });
      }

      // Forbind til MongoDB (cached)
      const client = await clientPromise;
      const db = client.db('license_keys');          // ← vælg dit db-navn
      const collection = db.collection('keys');

      // Find og opdater én ubrugt key atomisk (findOneAndUpdate)
      const result = await collection.findOneAndUpdate(
        { category, used: false },
        { 
          $set: { 
            used: true,
            usedAt: new Date(),
            email: session.customer_details?.email || 'ukendt',
            usedBySession: session.id
          } 
        },
        { 
          sort: { createdAt: 1 },   // eller { random: 1 } hvis du har random index
          returnDocument: 'after' 
        }
      );

      const keyDoc = result.value || result; // afhænger af driver version

      if (!keyDoc) {
        console.error(`Ingen ledige keys for ${category}!`);
        // måske send email til dig selv her?
        return res.json({ received: true });
      }

      const key = keyDoc.key_value;   // eller keyDoc.key – tilpas efter dit felt

      console.log('=== KEY LEVERET ===');
      console.log('Email:', session.customer_details?.email);
      console.log('Kategori:', category);
      console.log('Key:', key);
      console.log('===================');

      // Send email via Resend (din eksisterende kode)
      if (process.env.RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { /* ... */ },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: session.customer_details.email,
            subject: 'Din nøgle er klar 🔑',
            html: `<h2>Tak for dit køb!</h2><p><strong>Din nøgle:</strong> <code>${key}</code></p>`
          })
        });
      }

    } catch (error) {
      console.error('Fejl ved key-levering:', error);
      return res.status(500).json({ error: 'Internal error' });
    }
  }

  res.json({ received: true });
}

// Helper to get raw body for Vercel
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
