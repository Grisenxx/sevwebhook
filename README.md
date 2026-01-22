# 🔑 Stripe Key Delivery System

Super simpel key levering - Stripe webhook sender automatisk keys fra `keys.json`.

## 🚀 Opsætning

1. **Installer:**
```bash
npm install
```

2. **Lav `.env` fil:**
```env
STRIPE_SECRET_KEY=sk_test_din_key
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret
RESEND_API_KEY=re_din_api_key (valgfri)
EMAIL_FROM=din@email.dk (valgfri)
PORT=3000
```

3. **Tilføj keys i `keys.json`:**
```json
{
  "weekly": ["WEEKLY-KEY-001", "WEEKLY-KEY-002"],
  "monthly": ["MONTHLY-KEY-001", "MONTHLY-KEY-002"],
  "quarterly": ["QUARTERLY-KEY-001", "QUARTERLY-KEY-002"]
}
```

4. **Start server:**
```bash
npm start
```

5. **Lokalt test (brug Stripe CLI):**
```bash
stripe listen --forward-to localhost:3000/webhook
```

## 🌐 Hosting

**Gratis muligheder:**
- Railway.app (gratis tier)
- Render.com (gratis tier)  
- Fly.io (gratis tier)

**VPS (billigt):**
- Hetzner: ~30 kr/måned
- Digital Ocean: ~40 kr/måned
STRIPE_SECRET_KEY=sk_test_din_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret
PORT=3000
DOMAIN=http://localhost:3000
```

### 3. Opret produkter i Stripe Dashboard

1. Gå til [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Klik på "Add product"
3. Opret tre produkter:
   - **Weekly Subscription** (eller hvad du vil kalde det)
   - **Monthly Subscription**
   - **Quarterly Subscription**

4. **VIGTIGT**: For hvert produkt, tilføj metadata:
   - Klik på produktet
   - Scroll ned til "Metadata"
   - Tilføj: Key: `category`, Value: `weekly` (eller `monthly`/`quarterly`)

### 4. Tilføj dine keys

Rediger `keys.json` og tilføj dine rigtige keys:

```json
{
  "weekly": [
    "WEEKLY-KEY-1",
    "WEEKLY-KEY-2",
    "WEEKLY-KEY-3"
  ],
  "monthly": [
    "MONTHLY-KEY-1",
    "MONTHLY-KEY-2"
  ],
  "quarterly": [
    "QUARTERLY-KEY-1",
    "QUARTERLY-KEY-2"
  ]
}
```

### 5. Opsæt Stripe Webhook

1. Gå til [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Klik "Add endpoint"
3. Endpoint URL: `http://localhost:3000/webhook` (eller din domain)
4. Vælg event: `checkout.session.completed`
5. Kopier "Signing secret" til din `.env` fil

**Til lokal udvikling**: Brug Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/webhook
```

### 6. Start serveren

```bash
npm start
```

Eller med auto-reload:
```bash
npm run dev
```

## 📝 Sådan virker det

1. **Kunde køber et produkt** via Stripe Checkout
2. **Stripe sender webhook** til `/webhook` endpoint
3. **Systemet**:
   - Tjekker hvilken kategori (weekly/monthly/quarterly)
   - Vælger en tilfældig key fra `keys.json`
   - Logger keyen (eller sender via email)
   - Fjerner keyen fra filen
4. **Kunden modtager** deres key

## 🔌 API Endpoints

### `POST /create-checkout-session`
Opret en Stripe checkout session

```json
{
  "priceId": "price_xxxxx"
}
```

### `POST /webhook`
Stripe webhook endpoint (bruges automatisk af Stripe)

### `GET /key-status`
Tjek hvor mange keys der er tilbage:

```json
{
  "weekly": 10,
  "monthly": 5,
  "quarterly": 3
}
```

### `GET /`
Simpel test frontend

## 🔧 Tilpasning

### Email integration

For at sende keys via email, tilføj en email service i [server.js](server.js):

```javascript
// Eksempel med nodemailer
const nodemailer = require('nodemailer');

async function sendKeyEmail(email, key, category) {
  const transporter = nodemailer.createTransport({
    // Din email konfiguration
  });

  await transporter.sendMail({
    from: 'din@email.com',
    to: email,
    subject: `Din ${category} key`,
    text: `Her er din key: ${key}`
  });
}
```

Og kald den i webhook handleren:
```javascript
await sendKeyEmail(session.customer_email, key, category);
```

## 📊 Monitorering

Systemet logger:
- ✅ Vellykkede key leveringer
- ❌ Fejl (f.eks. ingen keys tilbage)
- 📈 Antal tilgængelige keys

Tjek konsollen for logs når serveren kører.

## ⚠️ Vigtige noter

1. **Backup dine keys**: Hold en backup af `keys.json` - når keys er brugt, er de væk!
2. **Webhook secret**: Hold din webhook secret hemmelig
3. **Production**: Når du går live, skift fra test mode til live mode i Stripe
4. **Notifikationer**: Sæt et system op til at advare dig når keys løber tør

## 🛠️ Fejlfinding

### "Webhook signature verification failed"
- Tjek at `STRIPE_WEBHOOK_SECRET` er korrekt i `.env`
- Hvis du bruger Stripe CLI, brug secret fra `stripe listen` output

### "Ingen keys tilgængelige"
- Tilføj flere keys til `keys.json`
- Tjek at kategori metadata er sat korrekt på dine Stripe produkter

### Keyen bliver ikke leveret
- Tjek at webhook er sat op korrekt i Stripe Dashboard
- Tjek server logs for fejl
- Verificer at produkt metadata `category` matcher ("weekly", "monthly", eller "quarterly")

## 📦 Fil struktur

```
stripesystem/
├── server.js          # Hovedserver med Stripe integration
├── keyManager.js      # Key håndtering (hent/fjern/tilføj)
├── keys.json          # Dine produkt keys
├── package.json       # Dependencies
├── .env              # Miljøvariabler (GIT IGNORE!)
├── .env.example      # Eksempel miljøvariabler
└── README.md         # Denne fil
```

## 📞 Support

Hvis du har problemer, tjek:
1. Server logs i konsollen
2. Stripe webhook logs i Dashboard
3. [Stripe API dokumentation](https://stripe.com/docs/api)

---

Lavet med ❤️ til automatisk key delivery
