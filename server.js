require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs').promises;
const path = require('path');

const app = express();
const KEYS_FILE = path.join(__dirname, 'keys.json');

// Stripe webhook - RAW body
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook fejl:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Find produktet og dets kategori
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    const product = await stripe.products.retrieve(lineItems.data[0].price.product);
    const category = product.metadata.category; // "weekly", "monthly", eller "quarterly"

    if (!category) {
      console.error('FEJL: Produkt har ingen category metadata!');
      return res.json({ received: true });
    }

    // Læs keys fra keys.json
    const data = await fs.readFile(KEYS_FILE, 'utf8');
    let keys = JSON.parse(data);

    if (!keys[category] || keys[category].length === 0) {
      console.error(`INGEN KEYS TILBAGE for ${category}!`);
      return res.json({ received: true });
    }

    // Tag tilfældig key og fjern den
    const randomIndex = Math.floor(Math.random() * keys[category].length);
    const key = keys[category][randomIndex];
    keys[category].splice(randomIndex, 1);

    // Gem opdateret keys.json
    await fs.writeFile(KEYS_FILE, JSON.stringify(keys, null, 2));

    console.log('=== KEY LEVERET ===');
    console.log('Email:', session.customer_details?.email || 'Ingen email');
    console.log('Kategori:', category);
    console.log('Key:', key);
    console.log('Keys tilbage:', keys[category].length);
    console.log('===================');

    // Send email (valgfrit - kan også bare logge)
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          to: session.customer_details.email,
          subject: 'Din nøgle er klar 🔑',
          html: `<h2>Tak for dit køb!</h2><p><strong>Din nøgle:</strong> <code>${key}</code></p>`
        })
      });
    }
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server kører på http://localhost:${PORT}`);
  console.log(`📍 Webhook: http://localhost:${PORT}/webhook`);
});
