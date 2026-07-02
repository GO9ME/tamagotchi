// LifeGotchi 서비스워커 — 로컬 돌봄 알림 표시용(푸시 서버 없음).
// 페이지가 백그라운드일 때 registration.showNotification 으로 띄운 알림의
// 클릭을 받아 대시보드로 복귀시킨다.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate("/dashboard");
            return client.focus();
          }
        }
        return self.clients.openWindow("/dashboard");
      }),
  );
});
