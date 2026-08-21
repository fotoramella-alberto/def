// Funzione serverless Netlify: crea una sessione di pagamento Stripe
// La chiave segreta NON è scritta qui, ma letta da una variabile d'ambiente
// impostata nel pannello Netlify (Site settings > Environment variables > STRIPE_SECRET_KEY).

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Metodo non consentito' };
  }

  try {
    const { items, shipping } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Carrello vuoto' }) };
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.title },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty,
    }));

    if (shipping && shipping.cost > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `Spedizione — ${shipping.label}` },
          unit_amount: Math.round(shipping.cost * 100),
        },
        quantity: 1,
      });
    }

    const siteUrl = process.env.URL || 'https://federicoramella.it';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${siteUrl}/successo.html`,
      cancel_url: `${siteUrl}/`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
