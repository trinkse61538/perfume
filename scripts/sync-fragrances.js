#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SHEET_ID = process.env.SHEET_ID || '1bXgcQULRQu5BgXtabt7dwBcV9SmWaeBNH0sQIswPcoY';
const SHEET_GID = process.env.SHEET_GID || '0';
const SHEET_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?gid=${SHEET_GID}&tqx=out:json`;
const OUTPUT_PATH = path.join(process.cwd(), 'data', 'fragrances.json');

function slugify(v){
  return String(v || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
function cellValue(cell){
  if(!cell) return '';
  if(cell.f !== undefined && cell.f !== null) return cell.f;
  if(cell.v !== undefined && cell.v !== null) return cell.v;
  return '';
}
function toNumber(v, fallback=0){
  const n = Number(String(v ?? '').replace(',', '.').match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) ? n : fallback;
}
function splitNotes(v){
  if(Array.isArray(v)) return v.map(String).map(x=>x.trim()).filter(Boolean);
  return String(v || '').split(',').map(x => x.trim()).filter(Boolean);
}
function mapSheetRow(values){
  const p = {
    stt: toNumber(values[0]),
    brand: String(values[1] || '').trim(),
    name: String(values[2] || '').trim(),
    originalFamily: String(values[3] || '').trim(),
    concentration: String(values[4] || '').trim(),
    top: splitNotes(values[5]),
    heart: splitNotes(values[6]),
    base: splitNotes(values[7]),
    perfumer: String(values[8] || '').trim(),
    year: String(values[9] || '').trim(),
    season: String(values[10] || '').trim(),
    dayNight: String(values[11] || '').trim(),
    longevity: String(values[12] || '').trim(),
    sillage: String(values[13] || '').trim(),
    mood: String(values[14] || '').trim(),
    family: String(values[15] || '').trim(),
    subFamily: String(values[16] || '').trim(),
    presence: String(values[17] || '').trim(),
    sweetness: String(values[18] || '').trim(),
    freshScore: toNumber(values[19]),
    warmScore: toNumber(values[20]),
    longevityScore: toNumber(values[21]),
    sillageScore: toNumber(values[22]),
    officeSafe: String(values[23] || '').trim(),
    clientSafe: String(values[24] || '').trim(),
    hotSafe: String(values[25] || '').trim(),
    occasions: String(values[26] || '').trim(),
    sprays: String(values[27] || '').trim(),
    layerRole: String(values[28] || '').trim(),
    layerWith: String(values[29] || '').trim(),
    avoid: String(values[30] || '').trim(),
    smartNote: String(values[31] || '').trim(),
    confidence: String(values[32] || '').trim(),
    sourceMethod: String(values[33] || '').trim(),
    imageUrl: String(values[34] || '').trim()
  };
  p.fullName = [p.brand, p.name].filter(Boolean).join(' ');
  p.id = slugify(p.fullName || `scent-${p.stt}`);
  return p;
}
function readExisting(){
  try{
    const parsed = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
    return parsed && Array.isArray(parsed.data) ? parsed : null;
  }catch(error){
    return null;
  }
}
function stableData(data){
  return JSON.stringify(data);
}

async function main(){
  console.log(`[sync-fragrances] Fetching ${SHEET_JSON_URL}`);
  const response = await fetch(SHEET_JSON_URL, { cache: 'no-store' });
  if(!response.ok) throw new Error(`Google Sheet HTTP ${response.status}`);

  const raw = await response.text();
  const match = raw.match(/google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
  if(!match) throw new Error('Cannot parse Google Sheet response');

  const json = JSON.parse(match[1]);
  const rows = json.table.rows || [];
  const data = rows
    .map(row => (row.c || []).map(cellValue))
    .map(mapSheetRow)
    .filter(p => p.stt > 0 && p.brand && p.name && !/^(thương hiệu|brand)$/i.test(p.brand));

  if(!data.length) throw new Error('No valid fragrance rows found in sheet');

  const existing = readExisting();
  if(existing && stableData(existing.data) === stableData(data)){
    console.log(`[sync-fragrances] No data changes across ${data.length} fragrances.`);
    return;
  }

  const payload = {
    source: 'github_action_sync',
    sheetId: SHEET_ID,
    gid: SHEET_GID,
    generatedAt: new Date().toISOString(),
    count: data.length,
    data
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`[sync-fragrances] Wrote ${data.length} fragrances to ${OUTPUT_PATH}`);
}

main().catch(error => {
  console.error('[sync-fragrances] Failed:', error);
  process.exit(1);
});
