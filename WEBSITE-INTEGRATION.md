# 🌐 Website Integration (til sevsite på Vercel)

## Hvad skal tilføjes til din hjemmeside

### 1. Opret Stripe Produkter (én gang)

Gå til [Stripe Dashboard → Products](https://dashboard.stripe.com/products) og opret 3 produkter:

**Weekly Subscription:**
- Navn: "Weekly Key"
- Pris: (din pris)
- **Vigtigt:** Tilføj metadata: `category = weekly`

**Monthly Subscription:**
- Navn: "Monthly Key"  
- Pris: (din pris)
- **Vigtigt:** Tilføj metadata: `category = monthly`

**Quarterly Subscription:**
- Navn: "Quarterly Key"
- Pris: (din pris)
- **Vigtigt:** Tilføj metadata: `category = quarterly`

### 2. Tilføj til din website (sevsite)

**Hvis du bruger HTML/JavaScript:**

```html
<!-- I din HTML hvor du vil have køb knapper -->
<button onclick="buyWeekly()">Køb Weekly - 99 kr</button>
<button onclick="buyMonthly()">Køb Monthly - 299 kr</button>
<button onclick="buyQuarterly()">Køb Quarterly - 699 kr</button>

<script>
  // Dine Stripe Price IDs (få dem fra Stripe Dashboard)
  const PRICES = {
    weekly: 'price_XXXXXXXXXXXXX',
    monthly: 'price_XXXXXXXXXXXXX',
    quarterly: 'price_XXXXXXXXXXXXX'
  };

  async function checkout(priceId) {
    const stripe = Stripe('pk_test_DIN_PUBLISHABLE_KEY');
    
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel',
    });

    if (error) alert('Fejl: ' + error.message);
  }

  function buyWeekly() { checkout(PRICES.weekly); }
  function buyMonthly() { checkout(PRICES.monthly); }
  function buyQuarterly() { checkout(PRICES.quarterly); }
</script>

<!-- Tilføj Stripe.js -->
<script src="https://js.stripe.com/v3/"></script>
```

**Hvis du bruger React/Next.js:**

```jsx
// components/PricingButtons.jsx
'use client';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_DIN_PUBLISHABLE_KEY');

const PRICES = {
  weekly: 'price_XXXXXXXXXXXXX',
  monthly: 'price_XXXXXXXXXXXXX',
  quarterly: 'price_XXXXXXXXXXXXX'
};

export default function PricingButtons() {
  const handleCheckout = async (priceId) => {
    const stripe = await stripePromise;
    
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel',
    });

    if (error) console.error(error);
  };

  return (
    <div>
      <button onClick={() => handleCheckout(PRICES.weekly)}>
        Køb Weekly - 99 kr
      </button>
      <button onClick={() => handleCheckout(PRICES.monthly)}>
        Køb Monthly - 299 kr
      </button>
      <button onClick={() => handleCheckout(PRICES.quarterly)}>
        Køb Quarterly - 699 kr
      </button>
    </div>
  );
}
```

### 3. Opret success/cancel sider

**success.html** (eller success page):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Tak for dit køb!</title>
</head>
<body>
  <h1>✅ Betaling gennemført!</h1>
  <p>Din nøgle er blevet sendt til din email.</p>
  <a href="/">Tilbage til forsiden</a>
</body>
</html>
```

**cancel.html** (eller cancel page):
```html
<!DOCTYPE html>
<html>
<head>
  <title>Køb annulleret</title>
</head>
<body>
  <h1>Køb annulleret</h1>
  <p><a href="/">Prøv igen</a></p>
</body>
</html>
```

### 4. Find dine Stripe keys

**Publishable Key** (til website):
- [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
- Brug `pk_test_...` (test mode) eller `pk_live_...` (live mode)

**Price IDs** (til knapperne):
- Gå til dit produkt i Stripe Dashboard
- Kopiér "Price ID" (starter med `price_...`)

---

## Flow oversigt

```
Din Website (sevsite på Vercel)
         ↓
   [Kunde klikker køb]
         ↓
    Stripe Checkout
         ↓
   [Betaling gennemført]
         ↓
  Stripe Webhook → Din Server (stripesystem)
         ↓
  [Sender key via email]
```

**De to projekter er 100% adskilte:**
- `sevsite` = kun frontend på Vercel
- `stripesystem` = kun webhook server (Railway/Render/VPS)
