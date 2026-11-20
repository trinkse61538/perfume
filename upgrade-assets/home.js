/* Library First homepage enhancement: independent from the weather/advisor app. */
(()=>{'use strict';
const host=document.getElementById('lf-featured-grid');if(!host)return;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const link=p=>`/fragrance/${encodeURIComponent(p.id||slug(`${p.brand} ${p.name}`))}.html`;
const image=p=>String(p.imageUrl||'/Banner.png').replace(/^http:\/\//,'https://');
let data=[];
function render(){
 const featured=data.slice().sort((a,b)=>Number(b.stt||0)-Number(a.stt||0)).slice(0,8);
 if(!featured.length){host.innerHTML='<p class="lf-load-status">Không có mùi hương để hiển thị. <a href="/fragrance/">Mở thư viện đầy đủ</a>.</p>';return}
 host.innerHTML=featured.map((p,i)=>`<article class="lf-scent"><a class="lf-scent-image" href="${link(p)}" aria-label="Đọc hồ sơ ${esc(p.fullName||p.name)}"><img src="${esc(image(p))}" alt="${esc(p.fullName||p.name)}" loading="lazy" decoding="async" width="240" height="240"></a><div class="lf-scent-copy"><span class="lf-scent-brand">${esc(p.brand)}</span><h3><a href="${link(p)}">${esc(p.name)}</a></h3><p class="lf-scent-meta">${esc([p.family,p.season].filter(Boolean).join(' · ').slice(0,95))}</p><div class="lf-scent-actions"><button type="button" data-open="${esc(p.id)}" aria-label="Xem nhanh ${esc(p.name)}">Xem nhanh</button><a href="${link(p)}">Chi tiết ↗</a></div></div></article>`).join('');
 }
 fetch('/data/fragrances.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(json=>{data=Array.isArray(json)?json:json.data||[];render()}).catch(()=>{host.innerHTML='<p class="lf-load-status">Không tải được ảnh đề xuất. <a href="/fragrance/">Xem toàn bộ bộ sưu tập ↗</a></p>'});
 const form=$('#lf-home-search');form?.addEventListener('submit',e=>{e.preventDefault();const q=form.querySelector('input')?.value.trim();window.location.href='/fragrance/'+(q?'?q='+encodeURIComponent(q):'')});
})();
