const CACHE = "velora-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    const { request } = e;
    const url = new URL(request.url);

    // Only cache-enhance GET requests for static assets
    if (
        request.method !== "GET" ||
        url.pathname.startsWith("/api/") ||
        request.mode === "navigate"
    ) {
        return;
    }

    if (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.match(/\.(ico|png|svg|woff2?)$/)
    ) {
        e.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((res) => {
                        if (res.ok) {
                            caches.open(CACHE).then((c) => c.put(request, res.clone()));
                        }
                        return res;
                    })
            )
        );
    }
});
