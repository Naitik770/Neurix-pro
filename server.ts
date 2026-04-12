import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRO_PLAN_DAYS = 30;
const INR_AMOUNT = 9900; // paise
const USD_AMOUNT = 100; // cents

const base64Url = (input: Buffer | string) => Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

async function getGoogleAccessToken() {
  const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Firebase service account configuration (FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_EMAIL, FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY).');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  const signature = signer.sign(privateKey);
  const jwt = `${unsignedJwt}.${base64Url(signature)}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    throw new Error(`Google token exchange failed: ${errText}`);
  }
  const tokenData: any = await tokenResp.json();
  return tokenData.access_token as string;
}

const serializeFirestoreValue = (value: any): any => {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(serializeFirestoreValue) } };
  if (typeof value === 'object') {
    const nested: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) nested[k] = serializeFirestoreValue(v);
    return { mapValue: { fields: nested } };
  }
  return { stringValue: String(value) };
};

const toFirestoreDoc = (data: Record<string, any>) => {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) fields[key] = serializeFirestoreValue(value);
  return { fields };
};

async function upsertFirestoreDocument(collectionPath: string, docId: string, data: Record<string, any>) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is missing.');
  const token = await getGoogleAccessToken();

  const encodedPath = collectionPath.split('/').map(encodeURIComponent).join('/');
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodedPath}/${encodeURIComponent(docId)}`;

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(toFirestoreDoc(data))
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Firestore write failed (${collectionPath}/${docId}): ${err}`);
  }
}

async function activatePro(userId: string, paymentId: string, orderId: string) {
  const now = new Date();
  const expiry = new Date(now.getTime() + PRO_PLAN_DAYS * 24 * 60 * 60 * 1000);

  await upsertFirestoreDocument('users', userId, {
    plan: 'PRO',
    startDate: now,
    expiryDate: expiry,
    paymentId,
    orderId,
    updatedAt: now
  });

  await upsertFirestoreDocument('subscriptions', orderId, {
    userId,
    plan: 'PRO',
    paymentId,
    orderId,
    startDate: now,
    expiryDate: expiry
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/create-order', async (req, res) => {
    try {
      const { userId, currency = 'INR', gateway = 'razorpay' } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      if (gateway === 'razorpay') {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay keys missing' });

        const basic = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basic}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: INR_AMOUNT,
            currency: 'INR',
            receipt: `neurix_${userId}_${Date.now()}`,
            notes: { userId, plan: 'PRO' }
          })
        });
        const data: any = await response.json();
        if (!response.ok) return res.status(500).json({ error: data.error?.description || 'Unable to create Razorpay order' });
        return res.json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId });
      }

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      if (!stripeSecret) return res.status(500).json({ error: 'Stripe key missing' });

      const body = new URLSearchParams({
        mode: 'payment',
        success_url: `${appUrl}/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing?status=cancelled`,
        'line_items[0][price_data][currency]': currency.toLowerCase(),
        'line_items[0][price_data][product_data][name]': 'NEURIX Pro (Monthly)',
        'line_items[0][price_data][unit_amount]': String(currency === 'USD' ? USD_AMOUNT : INR_AMOUNT),
        'line_items[0][quantity]': '1',
        'metadata[userId]': userId,
        'metadata[plan]': 'PRO'
      });

      const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });
      const stripeData: any = await stripeResp.json();
      if (!stripeResp.ok) return res.status(500).json({ error: stripeData.error?.message || 'Unable to create Stripe session' });
      return res.json({ url: stripeData.url, orderId: stripeData.id });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal error' });
    }
  });

  app.post('/api/verify-payment', async (req, res) => {
    try {
      const { gateway = 'razorpay', userId, orderId, paymentId, signature, stripeSessionId } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      if (gateway === 'razorpay') {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) return res.status(500).json({ error: 'Razorpay secret missing' });
        const generated = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
        if (generated !== signature) return res.status(400).json({ error: 'Invalid signature' });
        await activatePro(userId, paymentId, orderId);
        return res.json({ success: true, plan: 'PRO' });
      }

      if (!stripeSessionId) return res.status(400).json({ error: 'stripeSessionId is required' });
      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) return res.status(500).json({ error: 'Stripe key missing' });
      const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}`, {
        headers: { 'Authorization': `Bearer ${stripeSecret}` }
      });
      const stripeData: any = await stripeResp.json();
      if (!stripeResp.ok || stripeData.payment_status !== 'paid') return res.status(400).json({ error: 'Stripe session not paid' });
      const stripeUserId = stripeData.metadata?.userId || userId;
      await activatePro(stripeUserId, stripeData.payment_intent || stripeData.id, stripeData.id);
      return res.json({ success: true, plan: 'PRO' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal error' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
