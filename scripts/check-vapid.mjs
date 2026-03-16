import { config } from 'dotenv';
import webpush from 'web-push';

config();

const pub = process.env.VAPID_PUBLIC_KEY;
const priv = process.env.VAPID_PRIVATE_KEY;

if (!pub || !priv) {
  console.error('VAPID keys missing');
  process.exit(1);
}

try {
  webpush.setVapidDetails('mailto:support@loverschain.jp', pub, priv);
  console.log('VAPID keys OK, public key length:', pub.length);
  process.exit(0);
} catch (e) {
  console.error('VAPID key invalid:', e.message);
  process.exit(1);
}
