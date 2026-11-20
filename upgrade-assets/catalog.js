/* Hihie's Scent OS | Library First catalog enhancements (no dependencies). */
(()=>{'use strict';
const root=document.querySelector('[data-scent-catalog]');if(!root)return;
const $=(s,p=root)=>p.querySelector(s);
const $$=(s,p=root)=>[...p.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fold=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().trim();
const items=$$('.catalog-item');
const list=$('[data-card-list]'),search=$('[data-card-search]'),brand=$('[data-brand-filter]'),family=$('[data-family-filter]'),season=$('[data-season-filter]'),sort=$('[data-sort-filter]');
const count=$('[data-result-count]'),more=$('[data-catalog-more]'),empty=$('[data-catalog-empty]');
const chips=$$('[data-preset-filter]');
const viewBtns=$$('[data-catalog-view]');
const selected=new Set();let limit=24,preset='',view='grid',matched=[],timer;
const qs=new URLSearchParams(location.search);
if(search)search.value=qs.get('q')||'';
if(brand)brand.value=qs.get('brand')||'';
if(family)family.value=qs.get('family')||'';
if(season)season.value=qs.get('season')||'';
if(sort)sort.value=qs.get('sort')||'original';
preset=qs.get('mood')||'';
function metric(e,key){return Number(e.dataset[key]||0)}
function passes(e){
 const d=e.dataset;
 const q=fold(search?.value);
 if(q&&!fold(d.searchText).includes(q))return false;
 if(brand?.value&&d.brand!==brand.value)return false;
 if(family?.value&&d.family!==family.value)return false;
 if(season?.value&&!fold(d.season).includes(fold(season.value)))return false;
 const office=fold(d.office),night=fold(d.daypart),seasonText=fold(d.season);
 if(preset==='office'&&!(/rat hop|^hop|^phu hop/.test(office)))return false;
 if(preset==='fresh'&&metric(e,'fresh')<4)return false;
 if(preset==='dark'&&metric(e,'warm')<4)return false;
 if(preset==='summer'&&!(seasonText.includes('he')||seasonText.includes('moi mua')))return false;
 if(preset==='night'&&!night.includes('dem'))return false;
 return true;
}
function compareOrder(a,b){
 const s=sort?.value||'original';
 if(s==='newest')return metric(b,'ordinal')-metric(a,'ordinal');
 if(s==='name')return fold(a.dataset.fullname).localeCompare(fold(b.dataset.fullname),'vi');
 if(s==='brand')return fold(a.dataset.brand).localeCompare(fold(b.dataset.brand),'vi')||fold(a.dataset.fullname).localeCompare(fold(b.dataset.fullname),'vi');
 if(s==='year')return metric(b,'year')-metric(a,'year');
 if(s==='longevity')return metric(b,'longevity')-metric(a,'longevity');
 return metric(a,'ordinal')-metric(b,'ordinal');
}
function updateUrl(){
 const params=new URLSearchParams();
 if(search?.value.trim())params.set('q',search.value.trim());
 if(brand?.value)params.set('brand',brand.value);
 if(family?.value)params.set('family',family.value);
 if(season?.value)params.set('season',season.value);
 if(preset)params.set('mood',preset);
 if(sort?.value&&sort.value!=='original')params.set('sort',sort.value);
 const url=location.pathname+(params.size?'?'+params.toString():'')+location.hash;
 history.replaceState(null,'',url);
}
function track(name,args={}){if(typeof window.gtag==='function')window.gtag('event',name,{page_type:'fragrance_catalog',...args})}
function render(reset=false){
 if(reset)limit=24;
 matched=items.filter(passes).sort(compareOrder);
 const fragment=document.createDocumentFragment();
 matched.forEach((e,i)=>{e.hidden=i>=limit;fragment.appendChild(e)});
 items.filter(x=>!matched.includes(x)).forEach(e=>{e.hidden=true;fragment.appendChild(e)});
 list?.appendChild(fragment);
 if(count)count.textContent=`${matched.length} kết quả · Đang hiển thị ${Math.min(matched.length,limit)} chai`;
 if(more){more.hidden=matched.length<=limit;more.textContent=`Xem thêm ${Math.min(24,matched.length-limit)} chai ↓`}
 if(empty)empty.hidden=matched.length!==0;
 chips.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.presetFilter===preset)));
 viewBtns.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.catalogView===view)));
 list?.classList.toggle('lf-as-list',view==='list');
 updateUrl();
}
search?.addEventListener('input',()=>{render(true);clearTimeout(timer);timer=setTimeout(()=>track('fragrance_search',{search_length:search.value.trim().length,result_count:matched.length}),450)});
[brand,family,season,sort].forEach(el=>el?.addEventListener('change',()=>{render(true);track('fragrance_filter_applied',{filter_type:el.dataset.brandFilter!==undefined?'brand':el.dataset.familyFilter!==undefined?'family':el.dataset.seasonFilter!==undefined?'season':'sort',result_count:matched.length})}));
chips.forEach(b=>b.addEventListener('click',()=>{preset=preset===b.dataset.presetFilter?'':b.dataset.presetFilter;render(true);track('fragrance_filter_applied',{filter_type:'mood',filter_name:preset||'all',result_count:matched.length})}));
$('[data-catalog-clear]')?.addEventListener('click',()=>{if(search)search.value='';if(brand)brand.value='';if(family)family.value='';if(season)season.value='';if(sort)sort.value='original';preset='';render(true);search?.focus()});
viewBtns.forEach(b=>b.addEventListener('click',()=>{view=b.dataset.catalogView;render();track('fragrance_view_changed',{view})}));
more?.addEventListener('click',()=>{limit+=24;render();track('fragrance_show_more',{visible_count:Math.min(limit,matched.length)})});
const bar=$('[data-compare-bar]'),barCount=$('[data-compare-count]'),run=$('[data-compare-run]');
const modal=$('[data-compare-modal]');let lastFocus=null;
function renderCompare(){
 $$('[data-compare-id]').forEach(b=>b.setAttribute('aria-pressed',String(selected.has(b.dataset.compareId))));
 if(bar)bar.hidden=selected.size===0;
 if(barCount)barCount.textContent=`Đã chọn ${selected.size}/3 chai`;
 if(run)run.disabled=selected.size<2;
}
list?.addEventListener('click',e=>{
 const b=e.target.closest('[data-compare-id]');if(!b)return;
 const id=b.dataset.compareId;
 if(selected.has(id))selected.delete(id);
 else if(selected.size>=3){b.title='Chỉ so sánh tối đa 3 chai';return}
 else selected.add(id);
 renderCompare();track('fragrance_compare_selected',{selected_count:selected.size})
});
$('[data-compare-clear]')?.addEventListener('click',()=>{selected.clear();renderCompare()});
function cell(text){return `<td>${esc(text||'—')}</td>`}
async function showCompare(){
 lastFocus=document.activeElement;
 run.disabled=true;run.textContent='Đang tải...';
 try{
  const r=await fetch('/data/fragrances.json',{cache:'default'});if(!r.ok)throw Error('Không tải được dữ liệu');
  const payload=await r.json();const byId=new Map((payload.data||payload).map(p=>[p.id,p]));const perfumes=[...selected].map(id=>byId.get(id)).filter(Boolean);
  if(perfumes.length<2)throw Error('Chưa đủ dữ liệu so sánh.');
  const rows=[['Nhóm hương','family'],['Nồng độ','concentration'],['Năm ra mắt','year'],['Mùa','season'],['Ngày / đêm','dayNight'],['Độ bám','longevity'],['Độ tỏa','sillage'],['Văn phòng','officeSafe'],['Gặp khách','clientSafe'],['Trời nóng','hotSafe'],['Số xịt','sprays'],['Ghi chú','smartNote']];
  const content=`<header><h2 id="lf-compare-title">So sánh mùi hương</h2><button type="button" class="lf-compare-close" data-compare-close aria-label="Đóng so sánh">Đóng ✕</button></header><div class="lf-table-scroll"><table class="lf-compare-table"><thead><tr><th>Thuộc tính</th>${perfumes.map(p=>`<th><a href="/fragrance/${encodeURIComponent(p.id)}.html">${esc(p.fullName)} ↗</a></th>`).join('')}</tr></thead><tbody>${rows.map(([name,key])=>`<tr><th scope="row">${esc(name)}</th>${perfumes.map(p=>cell(p[key])).join('')}</tr>`).join('')}</tbody></table></div>`;
  $('.lf-compare-dialog',modal).innerHTML=content;modal.hidden=false;document.body.style.overflow='hidden';modal.querySelector('[data-compare-close]')?.focus();track('fragrance_compare_open',{compare_count:perfumes.length});
 }catch(err){alert(err.message||'Không thể mở so sánh.')}finally{run.disabled=selected.size<2;run.textContent='So sánh ngay'}
}
function closeCompare(){if(modal){modal.hidden=true;document.body.style.overflow='';lastFocus?.focus()}}
run?.addEventListener('click',showCompare);
modal?.addEventListener('click',e=>{if(e.target===modal||e.target.closest('[data-compare-close]'))closeCompare()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal?.hidden)closeCompare()});
list?.addEventListener('click',e=>{const a=e.target.closest('a[href*="/fragrance/"]');if(a)track('fragrance_detail_open',{fragrance_id:a.closest('[data-id]')?.dataset.id||'',source:'catalog'})});
render();renderCompare();
})();
