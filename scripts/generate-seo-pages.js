#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'data', 'fragrances.json');
const BASE_URL = 'https://perfume.khaitringuyen.com';
const SITE_NAME = "Hihie's Scent OS";
const GA_ID = 'G-ZK6YJ4RVTN';

const OUT = {
  fragrance: path.join(ROOT, 'fragrance'),
  perfumer: path.join(ROOT, 'perfumer'),
  assets: path.join(ROOT, 'seo-assets'),
  sitemap: path.join(ROOT, 'sitemap.xml'),
  manifest: path.join(ROOT, 'seo-pages-manifest.json')
};

function readJson(file){
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function esc(value){
  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function jsonScript(value){
  return JSON.stringify(value).replace(/</g,'\\u003c');
}
function xmlEsc(value){
  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}
function slugify(value){
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)/g,'');
}
function list(value){
  if(Array.isArray(value)) return value.map(String).map(x=>x.trim()).filter(Boolean);
  return String(value || '').split(/[,;|]+/).map(x=>x.trim()).filter(Boolean);
}
function unique(values){
  return [...new Set(values.filter(Boolean))];
}
function truncate(value, max=155){
  const text = String(value || '').replace(/\s+/g,' ').trim();
  if(text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/,'') + '…';
}
function normalizeImageUrl(url){
  const raw = String(url || '').trim().replace(/^http:\/\//i,'https://');
  return raw.replace(
    /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/i,
    'https://cdn.jsdelivr.net/gh/$1/$2@$3/$4'
  );
}
function safeImage(p){
  return normalizeImageUrl(p.imageUrl) || `${BASE_URL}/Banner.png`;
}
function pageDescription(p){
  return truncate(
    p.smartNote || p.mood ||
    `${p.fullName}: nhóm hương ${p.family || p.originalFamily || 'nước hoa'}, độ bám ${p.longevity || 'đang cập nhật'}, độ tỏa ${p.sillage || 'đang cập nhật'} và gợi ý sử dụng trong Hihie's Scent OS.`
  );
}
function ensureCleanDir(dir){
  fs.rmSync(dir,{recursive:true,force:true});
  fs.mkdirSync(dir,{recursive:true});
}
function write(file, content){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file, content, 'utf8');
}
function formatDate(value){
  const d = value ? new Date(value) : new Date();
  if(Number.isNaN(d.getTime())) return new Date().toISOString().slice(0,10);
  return d.toISOString().slice(0,10);
}
function topTerms(items, key, limit=6){
  const counts = new Map();
  items.forEach(item=>{
    String(item[key] || '').split(/[\/,;|]+/).map(x=>x.trim()).filter(Boolean).forEach(term=>{
      counts.set(term,(counts.get(term)||0)+1);
    });
  });
  return [...counts.entries()]
    .sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0],'vi'))
    .slice(0,limit)
    .map(([term])=>term);
}
function preparedMessage(p){
  return `Chào Trí, mình vừa xem ${p.fullName} trên Hihie's Scent OS.\nMình muốn được tư vấn thêm về mùi hương, giá, dung tích/decant hiện có và cách sử dụng phù hợp.`;
}
function asset(pathname){
  return `${BASE_URL}/seo-assets/${pathname}`;
}
function head({title,description,canonical,image,type='website',schema}){
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#0a1020">
<link rel="canonical" href="${esc(canonical)}">
<link rel="alternate" hreflang="vi-VN" href="${esc(canonical)}">
<meta property="og:type" content="${esc(type)}">
<meta property="og:locale" content="vi_VN">
<meta property="og:site_name" content="${esc(SITE_NAME)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@700&display=swap"></noscript>
<link rel="stylesheet" href="${asset('seo-pages.css')}">
<link rel="manifest" href="${BASE_URL}/manifest.webmanifest">
<link rel="icon" sizes="192x192" href="${BASE_URL}/icons/pwa-icon-192.png">
<link rel="apple-touch-icon" sizes="180x180" href="${BASE_URL}/icons/apple-touch-icon-180.png">
<meta name="application-name" content="Hihie’s Scent OS">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Scent OS">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');</script>
<script type="application/ld+json">${jsonScript(schema)}</script>
</head>`;
}
function siteHeader(){
  return `<body>
<a class="skip" href="#main">Đến nội dung chính</a>
<header class="site-head">
  <a class="logo" href="/"><span></span>${esc(SITE_NAME)}</a>
  <nav aria-label="Điều hướng SEO">
    <a href="/">Scent OS</a>
    <a href="/fragrance/">Nước hoa</a>
    <a href="/perfumer/">Perfumer</a>
  </nav>
</header>`;
}
function breadcrumbs(items){
  return `<nav class="crumbs" aria-label="Breadcrumb">${items.map((item,i)=>
    i===items.length-1
      ? `<span aria-current="page">${esc(item.label)}</span>`
      : `<a href="${esc(item.url)}">${esc(item.label)}</a>`
  ).join('<b>›</b>')}</nav>`;
}
function siteFooter(){
  return `<footer class="site-foot">
  <div>
    <strong>${esc(SITE_NAME)}</strong>
    <p>Gợi ý nước hoa theo thời tiết, tình huống, mood và công thức layer từ bộ sưu tập cá nhân của Nguyễn Khai Trí.</p>
  </div>
  <div class="foot-links">
    <a href="/">Mở ứng dụng</a>
    <a href="/fragrance/">Danh mục nước hoa</a>
    <a href="/perfumer/">Danh mục perfumer</a>
    <a href="https://m.me/trinkse61538" target="_blank" rel="noopener">Messenger</a>
    <a href="https://zalo.me/0367676119" target="_blank" rel="noopener">Zalo</a>
  </div>
</footer>
<script src="${asset('seo-pages.js')}" defer></script>
</body></html>`;
}
function chips(values){
  const clean = values.filter(Boolean);
  return clean.length ? `<div class="chips">${clean.map(x=>`<span>${esc(x)}</span>`).join('')}</div>` : '';
}
function noteBlock(label, notes){
  const values = list(notes);
  return `<div class="note"><b>${esc(label)}</b><p>${values.length ? esc(values.join(' · ')) : 'Đang cập nhật'}</p></div>`;
}
function detailRows(entries){
  return `<dl class="details">${entries.filter(([,v])=>String(v||'').trim()).map(([k,v])=>
    `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`
  ).join('')}</dl>`;
}
function card(p){
  return `<article class="card">
    <a class="card-img" href="/fragrance/${esc(p.id)}.html">
      <img src="${esc(safeImage(p))}" loading="lazy" decoding="async" width="420" height="420" alt="${esc(p.fullName)}">
    </a>
    <div class="card-copy">
      <small>${esc(p.brand)}</small>
      <h2><a href="/fragrance/${esc(p.id)}.html">${esc(p.name)}</a></h2>
      <p>${esc(truncate(p.mood || p.smartNote || p.family,120))}</p>
      ${chips([p.family,p.year,p.concentration])}
    </div>
  </article>`;
}
function cta(p){
  const message = preparedMessage(p);
  return `<section class="cta">
    <small>TƯ VẤN · ĐẶT HÀNG · DECANT</small>
    <h2>Quan tâm ${esc(p.name)}?</h2>
    <p>Hỏi thêm về mùi hương, giá, dung tích hiện có, decant dùng thử hoặc cách layer phù hợp.</p>
    <div class="prepared"><b>Lời nhắn chuẩn bị sẵn</b><p>${esc(message).replace(/\n/g,'<br>')}</p></div>
    <div class="cta-actions">
      <button type="button" data-copy-message="${esc(encodeURIComponent(message))}" data-perfume="${esc(p.fullName)}">Sao chép lời nhắn</button>
      <a href="https://m.me/trinkse61538" target="_blank" rel="noopener" data-contact="messenger" data-perfume="${esc(p.fullName)}">Messenger</a>
      <a href="https://zalo.me/0367676119" target="_blank" rel="noopener" data-contact="zalo" data-perfume="${esc(p.fullName)}">Zalo</a>
      <a href="tel:+84367676119" data-contact="phone" data-perfume="${esc(p.fullName)}">Gọi tư vấn</a>
    </div>
    <div class="copy-status" role="status" aria-live="polite"></div>
  </section>`;
}
function fragrancePage(p, data, generatedDate){
  const canonical = `${BASE_URL}/fragrance/${p.id}.html`;
  const image = safeImage(p);
  const description = pageDescription(p);
  const perfumerSlug = p.perfumer ? slugify(p.perfumer) : '';
  const related = data
    .filter(x=>x.id!==p.id)
    .map(x=>{
      let score=0;
      if(p.perfumer && x.perfumer && x.perfumer.toLowerCase()===p.perfumer.toLowerCase()) score+=5;
      if(p.family && x.family && x.family.toLowerCase()===p.family.toLowerCase()) score+=4;
      if(p.brand && x.brand && x.brand.toLowerCase()===p.brand.toLowerCase()) score+=2;
      score += 1-Math.min(1,Math.abs(Number(p.freshScore||0)-Number(x.freshScore||0))/5);
      return {x,score};
    })
    .sort((a,b)=>b.score-a.score || Number(a.x.stt)-Number(b.x.stt))
    .slice(0,4)
    .map(item=>item.x);

  const schema = {
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'WebPage',
        '@id':`${canonical}#webpage`,
        url:canonical,
        name:`${p.fullName} | ${SITE_NAME}`,
        description,
        inLanguage:'vi-VN',
        dateModified:generatedDate,
        isPartOf:{'@id':`${BASE_URL}/#website`},
        mainEntity:{'@id':`${canonical}#product`}
      },
      {
        '@type':'Product',
        '@id':`${canonical}#product`,
        name:p.fullName,
        description,
        image,
        brand:p.brand ? {'@type':'Brand',name:p.brand}:undefined,
        category:p.family || p.originalFamily || 'Fragrance',
        releaseDate:p.year || undefined
      }
    ]
  };

  return `${head({
    title:`${p.name} – ${p.brand} | Mùi hương & cách dùng`,
    description,
    canonical,
    image,
    type:'article',
    schema
  })}
${siteHeader()}
<main id="main" class="page">
  ${breadcrumbs([
    {label:'Scent OS',url:'/'},
    {label:'Nước hoa',url:'/fragrance/'},
    {label:p.fullName}
  ])}
  <article>
    <section class="hero">
      <div class="hero-image"><img src="${esc(image)}" width="680" height="680" fetchpriority="high" alt="${esc(p.fullName)}"></div>
      <div class="hero-copy">
        <div class="eyebrow">${esc(p.brand)}</div>
        <h1>${esc(p.name)}</h1>
        ${chips([p.concentration,p.year,p.family || p.originalFamily,p.season,p.dayNight])}
        <p class="lead">${esc(p.mood || description)}</p>
        <div class="hero-actions">
          <a class="primary" href="/#today">Mở gợi ý theo thời tiết</a>
          <a href="/">Mở Scent OS</a>
        </div>
      </div>
    </section>

    <section class="content-grid">
      <div class="main-copy">
        <section class="box">
          <div class="eyebrow">Tổng quan</div>
          <h2>Ấn tượng và cách sử dụng</h2>
          <p>${esc(p.smartNote || p.mood || description)}</p>
          ${p.avoid ? `<p><b>Lưu ý:</b> ${esc(p.avoid)}</p>`:''}
        </section>

        <section class="box">
          <div class="eyebrow">Note pyramid</div>
          <h2>Cấu trúc mùi hương</h2>
          <div class="notes">
            ${noteBlock('Hương đầu',p.top)}
            ${noteBlock('Hương giữa',p.heart)}
            ${noteBlock('Hương cuối',p.base)}
          </div>
        </section>

        <section class="box">
          <div class="eyebrow">Practical profile</div>
          <h2>Độ bám, độ tỏa và hoàn cảnh</h2>
          ${detailRows([
            ['Nhóm hương',p.family || p.originalFamily],
            ['DNA / Sub-family',p.subFamily],
            ['Mùa phù hợp',p.season],
            ['Ngày / Đêm',p.dayNight],
            ['Độ bám',p.longevity],
            ['Độ tỏa',p.sillage],
            ['Presence',p.presence],
            ['Độ ngọt',p.sweetness],
            ['Văn phòng',p.officeSafe],
            ['Gặp khách',p.clientSafe],
            ['Trời nóng',p.hotSafe],
            ['Tình huống',p.occasions],
            ['Số xịt gợi ý',p.sprays]
          ])}
        </section>

        <section class="box">
          <div class="eyebrow">Layering</div>
          <h2>Vai trò khi phối mùi</h2>
          ${detailRows([
            ['Layer role',p.layerRole],
            ['Nên phối với',p.layerWith],
            ['Nên tránh',p.avoid]
          ])}
        </section>

        ${cta(p)}
      </div>

      <aside>
        <section class="box sticky">
          <div class="eyebrow">Thông tin nhanh</div>
          ${detailRows([
            ['Thương hiệu',p.brand],
            ['Tên đầy đủ',p.fullName],
            ['Nồng độ',p.concentration],
            ['Năm ra mắt',p.year],
            ['Nhà điều chế',p.perfumer],
            ['Nhóm hương gốc',p.originalFamily],
            ['Độ tin cậy dữ liệu',p.confidence]
          ])}
          ${p.perfumer ? `<a class="wide-link" href="/perfumer/${esc(perfumerSlug)}.html">Xem hồ sơ ${esc(p.perfumer)} ↗</a>`:''}
        </section>
      </aside>
    </section>

    ${related.length ? `<section class="related">
      <div class="section-head"><div><div class="eyebrow">Khám phá thêm</div><h2>Mùi hương liên quan</h2></div><a href="/fragrance/">Xem toàn bộ</a></div>
      <div class="cards">${related.map(card).join('')}</div>
    </section>`:''}
  </article>
</main>
${siteFooter()}`;
}
function fragranceIndex(data, generatedDate){
  const canonical = `${BASE_URL}/fragrance/`;
  const description = `Danh mục ${data.length} mùi hương trong Hihie's Scent OS, gồm thông tin nhóm hương, độ bám, độ tỏa, perfumer và cách sử dụng.`;
  const schema = {
    '@context':'https://schema.org',
    '@type':'CollectionPage',
    url:canonical,
    name:'Danh mục nước hoa | Hihie’s Scent OS',
    description,
    inLanguage:'vi-VN',
    dateModified:generatedDate,
    mainEntity:{
      '@type':'ItemList',
      numberOfItems:data.length,
      itemListElement:data.slice(0,100).map((p,i)=>({
        '@type':'ListItem',
        position:i+1,
        url:`${BASE_URL}/fragrance/${p.id}.html`,
        name:p.fullName
      }))
    }
  };
  return `${head({
    title:'Danh mục nước hoa | Hihie’s Scent OS',
    description,
    canonical,
    image:`${BASE_URL}/Banner.png`,
    schema
  })}
${siteHeader()}
<main id="main" class="page">
  ${breadcrumbs([{label:'Scent OS',url:'/'},{label:'Danh mục nước hoa'}])}
  <section class="listing-hero">
    <div class="eyebrow">STATIC FRAGRANCE LIBRARY</div>
    <h1>${data.length} mùi hương<br>trong bộ sưu tập</h1>
    <p>${esc(description)}</p>
    <label class="search-label" for="seoSearch">Tìm theo tên, thương hiệu, perfumer hoặc nhóm hương</label>
    <input id="seoSearch" class="seo-search" type="search" placeholder="Ví dụ: Zoologist, iris, Jacques Huclier..." data-card-search>
  </section>
  <div class="listing-count" data-result-count>${data.length} kết quả</div>
  <section class="cards listing-cards" data-card-list>
    ${data.map(p=>`<div data-search-text="${esc([p.fullName,p.perfumer,p.family,p.originalFamily,p.year].join(' ').toLowerCase())}">${card(p)}</div>`).join('')}
  </section>
</main>
${siteFooter()}`;
}
function perfumerPage(name, items, generatedDate){
  const slug = slugify(name);
  const canonical = `${BASE_URL}/perfumer/${slug}.html`;
  const years = items.map(x=>Number(x.year)).filter(Number.isFinite).sort((a,b)=>a-b);
  const range = years.length ? (years[0]===years.at(-1)?String(years[0]):`${years[0]}–${years.at(-1)}`) : '';
  const families = topTerms(items,'family',8);
  const description = truncate(`${name} trong bộ sưu tập Hihie's Scent OS: ${items.length} mùi hương${range?` giai đoạn ${range}`:''}. Nhóm hương nổi bật: ${families.join(', ') || 'đang cập nhật'}.`);
  const schema = {
    '@context':'https://schema.org',
    '@graph':[
      {
        '@type':'ProfilePage',
        url:canonical,
        name:`${name} – Perfumer Index`,
        description,
        inLanguage:'vi-VN',
        dateModified:generatedDate,
        mainEntity:{'@id':`${canonical}#person`}
      },
      {
        '@type':'Person',
        '@id':`${canonical}#person`,
        name,
        knowsAbout:['Perfumery','Fragrance creation'],
        subjectOf:items.map(p=>`${BASE_URL}/fragrance/${p.id}.html`)
      }
    ]
  };
  return `${head({
    title:`${name} – Perfumer Index | Hihie’s Scent OS`,
    description,
    canonical,
    image:safeImage(items[0] || {}),
    type:'profile',
    schema
  })}
${siteHeader()}
<main id="main" class="page">
  ${breadcrumbs([{label:'Scent OS',url:'/'},{label:'Perfumer',url:'/perfumer/'},{label:name}])}
  <section class="listing-hero">
    <div class="eyebrow">PERFUMER PROFILE</div>
    <h1>${esc(name)}</h1>
    <p>${esc(description)}</p>
    ${chips([`${items.length} chai`,range,...families.slice(0,4)])}
  </section>
  <section class="box prose">
    <h2>Dấu vết sáng tạo trong bộ sưu tập</h2>
    <p>Trang này nhóm các mùi hương trong bộ sưu tập cá nhân theo dữ liệu nhà điều chế. Đây không phải tiểu sử toàn diện; nội dung tập trung vào các chai đang có trong Scent OS và điểm chung có thể quan sát từ nhóm hương, thời gian ra mắt và cách sử dụng.</p>
  </section>
  <section class="related">
    <div class="section-head"><div><div class="eyebrow">${items.length} FRAGRANCES</div><h2>Các mùi hương trong Scent OS</h2></div><a href="/perfumer/">Tất cả perfumer</a></div>
    <div class="cards">${items.map(card).join('')}</div>
  </section>
</main>
${siteFooter()}`;
}
function perfumerIndex(groups, generatedDate){
  const list = [...groups.entries()]
    .sort((a,b)=>b[1].length-a[1].length || a[0].localeCompare(b[0],'vi'));
  const canonical = `${BASE_URL}/perfumer/`;
  const description = `Danh mục ${list.length} nhà điều chế được ghi nhận trong bộ sưu tập Hihie's Scent OS, liên kết tới các mùi hương tương ứng.`;
  const schema = {
    '@context':'https://schema.org',
    '@type':'CollectionPage',
    url:canonical,
    name:'Perfumer Index | Hihie’s Scent OS',
    description,
    inLanguage:'vi-VN',
    dateModified:generatedDate,
    mainEntity:{
      '@type':'ItemList',
      numberOfItems:list.length,
      itemListElement:list.map(([name],i)=>({
        '@type':'ListItem',
        position:i+1,
        url:`${BASE_URL}/perfumer/${slugify(name)}.html`,
        name
      }))
    }
  };
  const cards = list.map(([name,items])=>{
    const families=topTerms(items,'family',4);
    const years=items.map(x=>Number(x.year)).filter(Number.isFinite).sort((a,b)=>a-b);
    const range=years.length?(years[0]===years.at(-1)?String(years[0]):`${years[0]}–${years.at(-1)}`):'';
    return `<article class="person-card" data-search-text="${esc([name,...families,range].join(' ').toLowerCase())}">
      <small>${items.length} chai${range?` · ${esc(range)}`:''}</small>
      <h2><a href="/perfumer/${esc(slugify(name))}.html">${esc(name)}</a></h2>
      <p>${families.length?`Nhóm hương nổi bật: ${esc(families.join(', '))}.`:'Dữ liệu nhóm hương đang được cập nhật.'}</p>
      ${chips(families)}
      <a class="wide-link" href="/perfumer/${esc(slugify(name))}.html">Xem hồ sơ ↗</a>
    </article>`;
  }).join('');
  return `${head({
    title:'Perfumer Index | Hihie’s Scent OS',
    description,
    canonical,
    image:`${BASE_URL}/Banner.png`,
    schema
  })}
${siteHeader()}
<main id="main" class="page">
  ${breadcrumbs([{label:'Scent OS',url:'/'},{label:'Perfumer Index'}])}
  <section class="listing-hero">
    <div class="eyebrow">CREATIVE SIGNATURES</div>
    <h1>${list.length} nhà điều chế<br>trong bộ sưu tập</h1>
    <p>${esc(description)}</p>
    <label class="search-label" for="seoSearch">Tìm perfumer hoặc nhóm hương</label>
    <input id="seoSearch" class="seo-search" type="search" placeholder="Ví dụ: Dominique Ropion, iris, woody..." data-card-search>
  </section>
  <div class="listing-count" data-result-count>${list.length} kết quả</div>
  <section class="people" data-card-list>${cards}</section>
</main>
${siteFooter()}`;
}
function stylesheet(){
  return `:root{--bg:#07101d;--panel:#0e1929;--ink:#edf6ff;--muted:#a5b5c9;--line:rgba(255,255,255,.13);--accent:#78e3c4;--gold:#d8b56d;--max:1180px}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 12% 0,rgba(120,227,196,.16),transparent 28%),linear-gradient(180deg,#091222,#040812 80%);color:var(--ink);font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif}a{color:inherit;text-decoration:none}img{max-width:100%;display:block}button,input{font:inherit}.skip{position:fixed;top:10px;left:10px;z-index:99;padding:10px 14px;border-radius:12px;background:#fff;color:#06101d;transform:translateY(-160%)}.skip:focus{transform:none}.site-head{position:sticky;top:0;z-index:20;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:13px max(18px,calc((100vw - var(--max))/2));border-bottom:1px solid var(--line);background:rgba(7,16,29,.85);backdrop-filter:blur(16px)}.logo{display:flex;align-items:center;gap:10px;font-weight:900}.logo span{width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#fff5c9,#d8b56d 40%,#4c2d12 75%)}.site-head nav{display:flex;gap:8px;flex-wrap:wrap}.site-head nav a{padding:8px 11px;border-radius:999px;color:var(--muted);font-weight:800;font-size:.8rem}.site-head nav a:hover{background:rgba(255,255,255,.07);color:#fff}.page{width:min(var(--max),calc(100% - 32px));margin:auto;padding:24px 0 80px}.crumbs{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:var(--muted);font-size:.8rem;margin-bottom:22px}.crumbs a:hover{color:var(--accent)}.crumbs b{opacity:.45}.hero{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr);gap:32px;align-items:center;min-height:70vh}.hero-image{min-height:520px;border:1px solid var(--line);border-radius:38px;display:grid;place-items:center;background:radial-gradient(circle at 50% 38%,rgba(120,227,196,.15),transparent 44%),rgba(255,255,255,.045);overflow:hidden}.hero-image img{width:100%;height:520px;object-fit:contain;filter:drop-shadow(0 26px 30px rgba(0,0,0,.45))}.eyebrow{font-family:JetBrains Mono,monospace;color:var(--accent);font-size:.68rem;letter-spacing:.15em;text-transform:uppercase;font-weight:900}.hero h1,.listing-hero h1{font-family:'Cormorant Garamond',serif;font-size:clamp(4rem,9vw,8.5rem);line-height:.82;letter-spacing:-.055em;margin:12px 0 18px}.lead,.listing-hero p{font-size:1.05rem;line-height:1.7;color:var(--muted);max-width:720px}.chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.chips span{padding:7px 9px;border:1px solid var(--line);border-radius:999px;background:rgba(120,227,196,.08);color:#d0fff1;font-size:.7rem;font-weight:900}.hero-actions,.cta-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.hero-actions a,.cta-actions a,.cta-actions button,.primary,.wide-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 14px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.065);color:#fff;font-weight:900;cursor:pointer}.hero-actions .primary,.cta-actions button{background:linear-gradient(135deg,#f8df9a,#b98638);color:#171008;border:0}.content-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;margin-top:34px}.main-copy{display:grid;gap:16px}.box,.cta,.person-card{border:1px solid var(--line);border-radius:28px;background:rgba(255,255,255,.05);padding:22px}.box h2,.cta h2,.related h2,.person-card h2{font-family:'Cormorant Garamond',serif;font-size:clamp(2.3rem,5vw,4rem);line-height:.9;margin:8px 0 14px}.box p,.cta p,.person-card p{color:var(--muted);line-height:1.65}.sticky{position:sticky;top:90px}.notes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.note{padding:14px;border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.04)}.note b{color:var(--accent);font-size:.75rem}.note p{margin:7px 0 0;font-size:.88rem}.details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0}.details div{padding:12px;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.035)}.details dt{color:var(--accent);font-size:.68rem;text-transform:uppercase;font-weight:900;letter-spacing:.08em}.details dd{margin:6px 0 0;color:var(--muted);line-height:1.45}.wide-link{width:100%;margin-top:12px}.cta{background:radial-gradient(circle at 100% 0,rgba(120,227,196,.15),transparent 34%),rgba(255,255,255,.055)}.cta small{font-family:JetBrains Mono,monospace;color:var(--accent);font-weight:900}.prepared{padding:13px;border-radius:17px;border:1px solid var(--line);background:rgba(0,0,0,.18)}.prepared b{font-size:.75rem;color:#d0fff1}.prepared p{font-size:.85rem;margin:6px 0 0}.copy-status{min-height:1.2rem;margin-top:8px;color:var(--accent);font-size:.8rem}.related{margin-top:42px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:16px}.section-head a{color:var(--accent);font-weight:900}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.card{min-width:0;border:1px solid var(--line);border-radius:24px;background:rgba(255,255,255,.045);overflow:hidden}.card-img{display:block;height:240px;background:radial-gradient(circle,rgba(120,227,196,.12),transparent 60%)}.card-img img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 18px 18px rgba(0,0,0,.4))}.card-copy{padding:15px}.card-copy small,.person-card small{color:var(--accent);font-weight:900;text-transform:uppercase;font-size:.68rem}.card-copy h2{font-family:'Cormorant Garamond',serif;font-size:2rem;line-height:.95;margin:7px 0}.card-copy p{color:var(--muted);font-size:.82rem;line-height:1.5}.listing-hero{padding:60px 0 30px}.listing-hero h1{max-width:900px}.search-label{display:block;color:#fff;font-weight:900;margin:24px 0 8px}.seo-search{width:min(700px,100%);padding:14px 16px;border:1px solid var(--line);border-radius:17px;background:rgba(255,255,255,.07);color:#fff;outline:0}.seo-search:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(120,227,196,.1)}.listing-count{margin:10px 0 14px;color:var(--muted);font-weight:900}.listing-cards{grid-template-columns:repeat(4,minmax(0,1fr))}.people{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.person-card{min-width:0}.prose{max-width:820px;margin-bottom:26px}.site-foot{width:min(var(--max),calc(100% - 32px));margin:0 auto 40px;padding:28px;border:1px solid var(--line);border-radius:28px;background:rgba(255,255,255,.04);display:grid;grid-template-columns:1fr 1fr;gap:20px}.site-foot p{color:var(--muted);line-height:1.6}.foot-links{display:flex;align-content:start;justify-content:flex-end;gap:8px;flex-wrap:wrap}.foot-links a{padding:8px 10px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:.8rem;font-weight:900}[hidden]{display:none!important}:focus-visible{outline:3px solid #f8df9a;outline-offset:3px}
@media(max-width:1000px){.hero,.content-grid{grid-template-columns:1fr}.hero{min-height:auto}.hero-image{min-height:400px}.hero-image img{height:400px}.sticky{position:static}.cards,.listing-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.people{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:650px){.site-head{align-items:flex-start}.site-head nav{justify-content:flex-end}.page{width:min(100% - 22px,var(--max));padding-top:16px}.hero{gap:18px}.hero-image{min-height:320px;border-radius:28px}.hero-image img{height:320px}.hero h1,.listing-hero h1{font-size:clamp(3.5rem,20vw,5.8rem)}.content-grid{margin-top:20px}.box,.cta,.person-card{padding:16px;border-radius:23px}.notes,.details,.cards,.listing-cards,.people,.site-foot{grid-template-columns:1fr}.section-head{align-items:start}.card-img{height:260px}.site-foot{width:calc(100% - 22px);padding:18px}.foot-links{justify-content:flex-start}.hero-actions,.cta-actions{display:grid}.hero-actions a,.cta-actions a,.cta-actions button{width:100%}}`;
}
function clientScript(){
  return `(()=>{const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js',{scope:'/',updateViaCache:'none'}).catch(()=>{}))}
async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true}}catch(e){}const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}t.remove();return ok}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-copy-message]');if(b){const msg=decodeURIComponent(b.dataset.copyMessage||'');const ok=await copyText(msg);const status=b.closest('.cta')?.querySelector('.copy-status');if(status)status.textContent=ok?'Đã sao chép lời nhắn. Hãy mở Messenger hoặc Zalo và dán để gửi.':'Không thể tự sao chép. Hãy chọn lời nhắn phía trên để sao chép.';if(typeof gtag==='function')gtag('event','seo_inquiry_message_copied',{perfume_name:b.dataset.perfume||'',copy_status:ok?'success':'failed'})}const a=e.target.closest('[data-contact]');if(a&&typeof gtag==='function')gtag('event','seo_contact_clicked',{contact_channel:a.dataset.contact,perfume_name:a.dataset.perfume||'',page_location:location.href})});
const input=$('[data-card-search]');const list=$('[data-card-list]');const count=$('[data-result-count]');if(input&&list){const items=[...list.children];input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();let visible=0;items.forEach(item=>{const show=!q||(item.dataset.searchText||'').includes(q);item.hidden=!show;if(show)visible++});if(count)count.textContent=visible+' kết quả'})}})();`;
}
function sitemap(urls, lastmod){
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(item=>`  <url>\n    <loc>${xmlEsc(item.loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${item.changefreq || 'weekly'}</changefreq>\n    <priority>${item.priority || '0.7'}</priority>\n  </url>`).join('\n')}\n</urlset>\n`;
}

function main(){
  if(!fs.existsSync(DATA_PATH)) throw new Error(`Missing ${DATA_PATH}`);
  const payload = readJson(DATA_PATH);
  const raw = Array.isArray(payload) ? payload : payload.data;
  if(!Array.isArray(raw) || !raw.length) throw new Error('fragrances.json contains no data');

  const seen = new Set();
  const data = raw
    .map((p,index)=>{
      const fullName=String(p.fullName || [p.brand,p.name].filter(Boolean).join(' ')).trim();
      let id=slugify(p.id || fullName || `scent-${index+1}`);
      if(seen.has(id)) id=`${id}-${p.stt || index+1}`;
      seen.add(id);
      return {...p,id,fullName};
    })
    .filter(p=>p.brand && p.name)
    .sort((a,b)=>Number(a.stt||0)-Number(b.stt||0));

  if(!data.length) throw new Error('No valid fragrances after normalization');

  const generatedDate = formatDate(payload.generatedAt);
  ensureCleanDir(OUT.fragrance);
  ensureCleanDir(OUT.perfumer);
  ensureCleanDir(OUT.assets);

  write(path.join(OUT.assets,'seo-pages.css'),stylesheet());
  write(path.join(OUT.assets,'seo-pages.js'),clientScript());

  write(path.join(OUT.fragrance,'index.html'),fragranceIndex(data,generatedDate));
  data.forEach(p=>write(path.join(OUT.fragrance,`${p.id}.html`),fragrancePage(p,data,generatedDate)));

  const perfumerGroups = new Map();
  data.filter(p=>String(p.perfumer||'').trim()).forEach(p=>{
    const name=String(p.perfumer).trim();
    if(!perfumerGroups.has(name)) perfumerGroups.set(name,[]);
    perfumerGroups.get(name).push(p);
  });
  write(path.join(OUT.perfumer,'index.html'),perfumerIndex(perfumerGroups,generatedDate));
  for(const [name,items] of perfumerGroups){
    write(path.join(OUT.perfumer,`${slugify(name)}.html`),perfumerPage(name,items,generatedDate));
  }

  const urls=[
    {loc:`${BASE_URL}/`,priority:'1.0',changefreq:'weekly'},
    {loc:`${BASE_URL}/fragrance/`,priority:'0.9',changefreq:'weekly'},
    {loc:`${BASE_URL}/perfumer/`,priority:'0.8',changefreq:'weekly'},
    ...data.map(p=>({loc:`${BASE_URL}/fragrance/${p.id}.html`,priority:'0.8',changefreq:'monthly'})),
    ...[...perfumerGroups.keys()].map(name=>({loc:`${BASE_URL}/perfumer/${slugify(name)}.html`,priority:'0.7',changefreq:'monthly'}))
  ];
  write(OUT.sitemap,sitemap(urls,generatedDate));

  const manifest={
    generatedAt:new Date().toISOString(),
    dataGeneratedAt:payload.generatedAt || null,
    fragrancePages:data.length,
    perfumerPages:perfumerGroups.size,
    totalSitemapUrls:urls.length
  };
  write(OUT.manifest,JSON.stringify(manifest,null,2));

  console.log(`[generate-seo-pages] ${data.length} fragrance pages`);
  console.log(`[generate-seo-pages] ${perfumerGroups.size} perfumer pages`);
  console.log(`[generate-seo-pages] ${urls.length} sitemap URLs`);
}
try{main()}catch(error){console.error('[generate-seo-pages] Failed:',error);process.exit(1)}
