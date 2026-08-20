self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch(e) {}

    const title = data.title || 'BizSNS - 新着通知';
    const options = {
      body: data.body || '新しい投稿がありました',
      icon: '/icon512_maskable.png',
      badge: '/icon512_maskable.png'
    };

    const promises = [];
    promises.push(self.registration.showNotification(title, options));

    try {
      if ('setAppBadge' in navigator) {
        promises.push(navigator.setAppBadge(1).catch(function(e) { console.error('Badge error:', e); }));
      }
    } catch(e) {
      console.error('Badge sync error:', e);
    }
    
    event.waitUntil(Promise.all(promises));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
