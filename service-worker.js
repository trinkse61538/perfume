/* Hihie's Scent OS — PWA Service Worker V27R5 */
const VERSION = 'v27r5';
const PRECACHE = `scent-os-precache-${VERSION}`;
const PAGE_CACHE = `scent-os-pages-${VERSION}`;
const DATA_CACHE = `scent-os-data-${VERSION}`;
const ASSET_CACHE = `scent-os-assets-${VERSION}`;
const IMAGE_CACHE = `scent-os-images-${VERSION}`;

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/pwa-icon-96.png',
  '/icons/pwa-icon-192.png',
  '/icons/pwa-icon-512.png',
  '/icons/pwa-maskable-512.png',
  '/icons/apple-touch-icon-180.png',
  '/data/fragrances.json',
  '/fragrance/',
  '/perfumer/',
  '/seo-assets/seo-pages.css',
  '/seo-assets/seo-pages.js'
];

function isCacheable(response){
  return response && (response.ok || response.type === 'opaque');
}
async function putIfCacheable(cacheName,request,response){
  if(!isCacheable(response)) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request,response.clone());
  return response;
}
async function trimCache(cacheName,maxEntries){
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if(keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0,keys.length-maxEntries).map(key=>cache.delete(key)));
}
async function fetchWithTimeout(request,timeoutMs=5000){
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(request,{signal:controller.signal});
  }finally{
    clearTimeout(timer);
  }
}
async function precacheAsset(cache,url){
  try{
    const response = await fetch(new Request(url,{cache:'reload'}));
    if(isCacheable(response)) await cache.put(url,response);
  }catch(error){
    console.warn('[Scent OS SW] Precache skipped:',url);
  }
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache = await caches.open(PRECACHE);
    await Promise.allSettled(CORE_ASSETS.map(url=>precacheAsset(cache,url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keep = new Set([PRECACHE,PAGE_CACHE,DATA_CACHE,ASSET_CACHE,IMAGE_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith('scent-os-')&&!keep.has(name)).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function navigationStrategy(request){
  try{
    const response = await fetchWithTimeout(request,5000);
    if(isCacheable(response)){
      await putIfCacheable(PAGE_CACHE,request,response);
      trimCache(PAGE_CACHE,60);
    }
    return response;
  }catch(error){
    return (await caches.match(request,{ignoreSearch:true})) ||
      (await caches.match('/offline.html')) ||
      (await caches.match('/index.html'));
  }
}
async function dataStrategy(request){
  try{
    const response = await fetchWithTimeout(request,5500);
    if(isCacheable(response)) await putIfCacheable(DATA_CACHE,request,response);
    return response;
  }catch(error){
    return (await caches.match(request,{ignoreSearch:true})) ||
      new Response(JSON.stringify({source:'offline',count:0,data:[]}),{
        headers:{'Content-Type':'application/json; charset=utf-8'}
      });
  }
}
async function staleWhileRevalidate(request,cacheName,maxEntries=80){
  const cached = await caches.match(request,{ignoreSearch:false});
  const networkPromise = fetch(request)
    .then(response=>putIfCacheable(cacheName,request,response))
    .then(response=>{
      trimCache(cacheName,maxEntries);
      return response;
    })
    .catch(()=>null);
  return cached || (await networkPromise) || Response.error();
}
async function cacheFirst(request,cacheName,maxEntries=100){
  const cached = await caches.match(request,{ignoreSearch:false});
  if(cached) return cached;
  try{
    const response = await fetch(request);
    if(isCacheable(response)){
      await putIfCacheable(cacheName,request,response);
      trimCache(cacheName,maxEntries);
    }
    return response;
  }catch(error){
    return Response.error();
  }
}

self.addEventListener('fetch',event=>{
  const request = event.request;
  if(request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if(
    /googletagmanager\.com|google-analytics\.com|api\.open-meteo\.com|geocoding-api\.open-meteo\.com/i.test(url.hostname)
  ){
    return;
  }

  if(request.mode === 'navigate'){
    event.respondWith(navigationStrategy(request));
    return;
  }

  if(sameOrigin && url.pathname === '/data/fragrances.json'){
    event.respondWith(dataStrategy(request));
    return;
  }

  if(sameOrigin && (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.startsWith('/seo-assets/')
  )){
    event.respondWith(staleWhileRevalidate(request,ASSET_CACHE,70));
    return;
  }

  if(request.destination === 'image'){
    event.respondWith(cacheFirst(request,IMAGE_CACHE,140));
    return;
  }

  if(!sameOrigin && ['style','font'].includes(request.destination)){
    event.respondWith(cacheFirst(request,ASSET_CACHE,40));
  }
});
