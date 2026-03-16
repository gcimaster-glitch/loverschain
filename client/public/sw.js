// Service Worker for Web Push Notifications
// koibito-shomei / loverschain.jp

const CACHE_NAME = 'koibito-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// プッシュ通知受信
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: '恋人証明',
      body: event.data.text(),
      url: '/dashboard',
      tag: 'koibito-notification',
    };
  }

  const options = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/icon-192.png',
    badge: payload.badge ?? '/icon-72.png',
    tag: payload.tag ?? 'koibito-notification',
    data: { url: payload.url ?? '/dashboard' },
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? '恋人証明', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // 既存のウィンドウがあればフォーカス
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // なければ新しいウィンドウを開く
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
