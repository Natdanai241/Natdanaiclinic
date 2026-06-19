const { useState, useEffect, useRef } = React;

// ===================== SUPABASE CONFIG =====================
const SUPA_URL = "https://ggshgsyoytrkbnepsryu.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc2hnc3lveXRya2JuZXBzcnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODQ5NjEsImV4cCI6MjA5NzI2MDk2MX0.hH0ERaYGLueEtxjW8dNVs0d3q3IugCglxc2vlyLoXYQ";

const supa = {
  headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },

  // ── Generic fetch all rows from a table
  async getAll(table) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?order=created_at.asc`, { headers: this.headers });
    if (!r.ok) { console.error(`getAll ${table}:`, await r.text()); return null; }
    return r.json();
  },

  // ── Upsert (insert or update by primary key)
  async upsert(table, data) {
    const body = Array.isArray(data) ? data : [data];
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(body),
    });
    if (!r.ok) { console.error(`upsert ${table}:`, await r.text()); return null; }
    return r.json();
  },

  // ── Delete by primary key
  async delete(table, pkCol, pkVal) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
      method: "DELETE", headers: this.headers,
    });
    if (!r.ok) { console.error(`delete ${table}:`, await r.text()); return false; }
    return true;
  },

  // ── Patch (partial update) by pk
  async patch(table, pkCol, pkVal, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
      method: "PATCH",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    if (!r.ok) { console.error(`patch ${table}:`, await r.text()); return null; }
    return r.json();
  },
};

// DB row → app shape converters (snake_case ↔ camelCase for visits/receipts)
const fromDbVisit = (r) => r ? ({
  id:r.id, hn:r.hn, date:r.date, cc:r.cc, pi:r.pi, pe:r.pe,
  dx:r.dx, tx:r.tx, note:r.note, nurse:r.nurse,
  bp:r.bp, pr:r.pr, rr:r.rr, temp:r.temp, o2:r.o2,
  weight:r.weight, height:r.height,
  drugs: Array.isArray(r.drugs) ? r.drugs : (r.drugs ? JSON.parse(r.drugs) : []),
  services: Array.isArray(r.services) ? r.services : (r.services ? JSON.parse(r.services) : []),
}) : null;

const toDbVisit = (v) => ({
  id:v.id, hn:v.hn, date:v.date, cc:v.cc||'', pi:v.pi||'', pe:v.pe||'',
  dx:v.dx||'', tx:v.tx||'', note:v.note||'', nurse:v.nurse||'',
  bp:v.bp||'', pr:v.pr||'', rr:v.rr||'', temp:v.temp||'', o2:v.o2||'',
  weight:v.weight||'', height:v.height||'',
  drugs: v.drugs||[], services: v.services||[],
});

const fromDbReceipt = (r) => r ? ({
  id:r.id, hn:r.hn, visitId:r.visit_id, patname:r.patname, date:r.date,
  items: Array.isArray(r.items) ? r.items : (r.items ? JSON.parse(r.items) : []),
  discount:r.discount||0, paid:r.paid||'เงินสด', status:r.status||'รอชำระ',
}) : null;

const toDbReceipt = (r) => ({
  id:r.id, hn:r.hn, visit_id:r.visitId||'', patname:r.patname||'',
  date:r.date, items:r.items||[], discount:r.discount||0,
  paid:r.paid||'เงินสด', status:r.status||'รอชำระ',
});

const fromDbAppointment = (r) => r ? ({
  id:r.id, hn:r.hn, patname:r.patname, date:r.date,
  time:r.time, reason:r.reason, status:r.status, note:r.note||'',
}) : null;

const fromDbService = (r) => r ? ({
  id:r.id, name:r.name, category:r.category,
  price:r.price, unit:r.unit, active:r.active,
}) : null;

// ===================== STYLES =====================
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; }
  :root {
    --primary: #1a5276;
    --primary-light: #2e86c1;
    --primary-pale: #d6eaf8;
    --accent: #1e8449;
    --accent-light: #27ae60;
    --accent-pale: #d5f5e3;
    --danger: #c0392b;
    --danger-pale: #fadbd8;
    --warning: #d35400;
    --warning-pale: #fdebd0;
    --gray-dark: #2c3e50;
    --gray: #7f8c8d;
    --gray-light: #ecf0f1;
    --gray-pale: #f8f9fa;
    --white: #ffffff;
    --shadow: 0 2px 12px rgba(26,82,118,0.10);
    --shadow-md: 0 4px 24px rgba(26,82,118,0.13);
    --radius: 10px;
    --radius-sm: 6px;
  }
  .btn { cursor:pointer; border:none; border-radius:var(--radius-sm); font-family:inherit; font-size:13px; font-weight:600; padding:8px 18px; transition:all 0.18s; display:inline-flex; align-items:center; gap:6px; }
  .btn-primary { background:var(--primary); color:#fff; }
  .btn-primary:hover { background:var(--primary-light); }
  .btn-accent { background:var(--accent); color:#fff; }
  .btn-accent:hover { background:var(--accent-light); }
  .btn-danger { background:var(--danger); color:#fff; }
  .btn-outline { background:transparent; border:1.5px solid var(--primary); color:var(--primary); }
  .btn-outline:hover { background:var(--primary-pale); }
  .btn-gray { background:var(--gray-light); color:var(--gray-dark); }
  .btn-gray:hover { background:#dfe6e9; }
  .btn-sm { padding:5px 12px; font-size:12px; }
  .tag { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .tag-blue { background:var(--primary-pale); color:var(--primary); }
  .tag-green { background:var(--accent-pale); color:var(--accent); }
  .tag-red { background:var(--danger-pale); color:var(--danger); }
  .tag-orange { background:var(--warning-pale); color:var(--warning); }
  input, select, textarea { font-family:inherit; font-size:13px; border:1.5px solid #d0d7de; border-radius:var(--radius-sm); padding:7px 11px; width:100%; background:#fff; transition:border 0.15s; outline:none; }
  input:focus, select:focus, textarea:focus { border-color:var(--primary-light); box-shadow:0 0 0 3px rgba(46,134,193,0.12); }
  label { font-size:12px; font-weight:600; color:var(--gray-dark); display:block; margin-bottom:4px; }
  .form-group { margin-bottom:12px; }
  .card { background:#fff; border-radius:var(--radius); box-shadow:var(--shadow); padding:20px; }
  .divider { height:1px; background:var(--gray-light); margin:14px 0; }
  .text-primary { color:var(--primary); }
  .text-accent { color:var(--accent); }
  .text-danger { color:var(--danger); }
  .text-gray { color:var(--gray); }
  .text-sm { font-size:12px; }
  .text-xs { font-size:11px; }
  .fw-600 { font-weight:600; }
  .fw-700 { font-weight:700; }
  .mt-1 { margin-top:4px; }
  .mt-2 { margin-top:8px; }
  .mt-3 { margin-top:14px; }
  .mb-1 { margin-bottom:4px; }
  .mb-2 { margin-bottom:8px; }
  .row { display:flex; gap:12px; align-items:flex-start; }
  .col-1 { flex:1; }
  .col-2 { flex:2; }
  .col-3 { flex:3; }
  .scroll-thin::-webkit-scrollbar { width:5px; }
  .scroll-thin::-webkit-scrollbar-thumb { background:#c0cdd9; border-radius:3px; }
  .btn-print { background:#6c3483; color:#fff; border:none; }
  .btn-print:hover { background:#7d3c98; }
  .drug-dropdown { position:absolute; top:calc(100% + 2px); left:0; right:0; background:#fff; border:1.5px solid var(--primary-light); border-radius:6px; z-index:500; box-shadow:0 4px 20px rgba(0,0,0,0.14); max-height:220px; overflow-y:auto; }
  .drug-item { padding:8px 12px; cursor:pointer; font-size:12px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; gap:8px; }
  .drug-item:hover { background:var(--primary-pale); }
  .drug-item:last-child { border-bottom:none; }
  .drug-allergy-row { background:#fff0f0 !important; }
  @media print {
    .no-print { display:none !important; }
    .print-only { display:block !important; }
    .card { box-shadow:none !important; border:1px solid #ddd; }
    body { font-size:12pt; }
  }
`;

// ===================== HELPERS =====================
const pad = (n, z=6) => String(n).padStart(z,'0');
const today = () => new Date().toISOString().split('T')[0];
const thaiDate = (d) => {
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  const th=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${dt.getDate()} ${th[dt.getMonth()]} ${dt.getFullYear()+543}`;
};
const thaiDateFull = (d) => {
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  const days=['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];
  const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return `วัน${days[dt.getDay()]}ที่ ${dt.getDate()} ${months[dt.getMonth()]} พ.ศ. ${dt.getFullYear()+543}`;
};
const getWeekBounds = (d=new Date()) => {
  const day = d.getDay(); const diff = d.getDate()-day+(day===0?-6:1);
  const mon = new Date(d); mon.setDate(diff);
  const sun = new Date(mon); sun.setDate(mon.getDate()+6);
  return [mon.toISOString().split('T')[0], sun.toISOString().split('T')[0]];
};
const getQuarterBounds = (d=new Date()) => {
  const q=Math.floor(d.getMonth()/3); const y=d.getFullYear();
  const s=new Date(y,q*3,1); const e=new Date(y,q*3+3,0);
  return [s.toISOString().split('T')[0], e.toISOString().split('T')[0]];
};

// Print helper — opens a new window with clean content
const doPrint = (elementId, title='') => {
  const el = document.getElementById(elementId);
  if(!el){ window.print(); return; }
  const win = window.open('','_blank','width=850,height=950');
  win.document.write(`<!DOCTYPE html><html><head><title>${title||CLINIC_NAME}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sarabun',sans-serif;font-size:13px;color:#111;padding:20px 28px;}
    table{border-collapse:collapse;width:100%;}
    th,td{padding:5px 8px;}
    .no-print{display:none!important;}
    input,select,textarea{border:none!important;box-shadow:none!important;background:transparent!important;font-family:inherit;font-size:inherit;padding:0!important;width:auto!important;resize:none;}
    .card{border:1px solid #ddd;border-radius:6px;padding:14px;margin-bottom:10px;box-shadow:none;}
    .divider{height:1px;background:#e0e0e0;margin:10px 0;}
    .tag{display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;}
    .tag-green{background:#d5f5e3;color:#1e8449;}
    .tag-orange{background:#fdebd0;color:#d35400;}
  </style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  setTimeout(()=>{win.focus();win.print();},600);
};

// ===================== INITIAL DATA =====================
const CLINIC_NAME = "คลินิกเวชกรรมแพทย์ณัฐดนัย";
const CLINIC_ADDRESS = "เลขที่ 123 ถนนสายหลัก ตำบลเวียง อำเภอเชียงแสน จังหวัดเชียงราย 57150";
const CLINIC_TEL = "053-777-XXX";
const DOCTOR_NAME = "นายแพทย์ณัฐดนัย มะลิวัน";
const DOCTOR_TITLE = "แพทย์เฉพาะทางเวชศาสตร์ครอบครัว";
const DOCTOR_LICENSE = "ว.53359";

const SAMPLE_PATIENTS = [
  { hn:'000001', prefix:'นาย', fname:'สมชาย', lname:'ใจดี', gender:'ชาย', dob:'1980-05-10', idcard:'3500100000001', tel:'0812345678', address:'123 ม.1 ต.เวียง อ.เชียงแสน จ.เชียงราย', bloodtype:'O', allergy:'Amoxicillin', chronic:'เบาหวาน, ความดันโลหิตสูง', currentmed:'Metformin 500mg, Amlodipine 5mg', createdAt:'2025-01-10' },
  { hn:'000002', prefix:'นาง', fname:'สมหญิง', lname:'รักดี', gender:'หญิง', dob:'1975-08-22', idcard:'3500100000002', tel:'0823456789', address:'456 ม.2 ต.บ้านแซว อ.เชียงแสน จ.เชียงราย', bloodtype:'A', allergy:'-', chronic:'ไทรอยด์', currentmed:'Levothyroxine 50mcg', createdAt:'2025-01-15' },
  { hn:'000003', prefix:'เด็กชาย', fname:'มานะ', lname:'สุขสม', gender:'ชาย', dob:'2015-03-01', idcard:'3500100000003', tel:'0834567890', address:'789 ม.3 ต.โยนก อ.เชียงแสน จ.เชียงราย', bloodtype:'B', allergy:'-', chronic:'-', currentmed:'-', createdAt:'2025-02-01' },
];
const SAMPLE_VISITS = [
  { id:'V001', hn:'000001', date:'2025-06-01', cc:'ไข้ ปวดศีรษะ 2 วัน', pi:'ผู้ป่วยมีไข้สูง 38.5°C ปวดศีรษะ น้ำมูกไหล ไม่มีไอ ไม่มีเหนื่อยหอบ', pe:'T 38.5°C, PR 88/min, RR 18/min, BP 130/80 mmHg\nGA: มีไข้ ไม่ซีด ไม่เหลือง\nENT: คอแดงเล็กน้อย ต่อมทอนซิลไม่โต\nLung: clear', dx:'URI (J069)', tx:'Paracetamol 500mg #20 tab, Loratadine 10mg #10 tab, นัดติดตาม 1 สัปดาห์', bp:'130/80', pr:'88', rr:'18', temp:'38.5', o2:'98', weight:'72', height:'168', nurse:'สมใจ', createdAt:'2025-06-01' },
  { id:'V002', hn:'000002', date:'2025-06-03', cc:'ปวดท้อง คลื่นไส้ 1 วัน', pi:'ปวดท้องบริเวณยอดอก คลื่นไส้ ไม่อาเจียน ไม่มีไข้', pe:'T 37.0°C, PR 76/min, BP 120/75 mmHg\nAbdomen: soft, mild epigastric tenderness', dx:'Gastritis (K29.7)', tx:'Omeprazole 20mg #14 cap, Domperidone 10mg #15 tab', bp:'120/75', pr:'76', rr:'16', temp:'37.0', o2:'99', weight:'58', height:'160', nurse:'สมใจ', createdAt:'2025-06-03' },
];
const SAMPLE_APPOINTS = [
  { id:'A001', hn:'000001', patname:'นายสมชาย ใจดี', date:'2025-06-15', time:'09:00', reason:'ติดตามอาการ URI / ตรวจเบาหวาน', status:'นัดแล้ว', note:'' },
  { id:'A002', hn:'000002', patname:'นางสมหญิง รักดี', date:'2025-06-15', time:'10:30', reason:'ตรวจไทรอยด์ประจำปี', status:'นัดแล้ว', note:'' },
  { id:'A003', hn:'000003', patname:'เด็กชายมานะ สุขสม', date:'2025-06-18', time:'14:00', reason:'ฉีดวัคซีน', status:'นัดแล้ว', note:'' },
];
const SAMPLE_RECEIPTS = [
  { id:'R001', hn:'000001', visitId:'V001', patname:'นายสมชาย ใจดี', date:'2025-06-01', items:[{desc:'ค่าตรวจรักษา',qty:1,unit:'ครั้ง',price:300},{desc:'Paracetamol 500mg',qty:20,unit:'เม็ด',price:4},{desc:'Loratadine 10mg',qty:10,unit:'เม็ด',price:8}], discount:0, paid:'เงินสด', status:'ชำระแล้ว' },
  { id:'R002', hn:'000002', visitId:'V002', patname:'นางสมหญิง รักดี', date:'2025-06-03', items:[{desc:'ค่าตรวจรักษา',qty:1,unit:'ครั้ง',price:300},{desc:'Omeprazole 20mg',qty:14,unit:'แคปซูล',price:10},{desc:'Domperidone 10mg',qty:15,unit:'เม็ด',price:6}], discount:0, paid:'โอนเงิน', status:'ชำระแล้ว' },
];
const SAMPLE_MEDICINES = [
  { id:'M001', name:'Paracetamol 500mg', unit:'เม็ด', stock:500, price:2, cost:1, expire:'2026-12-31', category:'ยาแก้ปวด/ลดไข้', minstock:100 },
  { id:'M002', name:'Amoxicillin 250mg', unit:'แคปซูล', stock:150, price:6, cost:3, expire:'2026-06-30', category:'ยาปฏิชีวนะ', minstock:50 },
  { id:'M003', name:'Amoxicillin 500mg', unit:'แคปซูล', stock:200, price:8, cost:4, expire:'2026-06-30', category:'ยาปฏิชีวนะ', minstock:50 },
  { id:'M004', name:'Augmentin 375mg (Amox+Clav)', unit:'เม็ด', stock:100, price:25, cost:14, expire:'2026-08-31', category:'ยาปฏิชีวนะ', minstock:30 },
  { id:'M005', name:'Augmentin 625mg (Amox+Clav)', unit:'เม็ด', stock:80, price:35, cost:20, expire:'2026-08-31', category:'ยาปฏิชีวนะ', minstock:20 },
  { id:'M006', name:'Azithromycin 250mg', unit:'แคปซูล', stock:60, price:20, cost:10, expire:'2026-10-31', category:'ยาปฏิชีวนะ', minstock:20 },
  { id:'M007', name:'Azithromycin 500mg', unit:'เม็ด', stock:40, price:35, cost:18, expire:'2026-10-31', category:'ยาปฏิชีวนะ', minstock:15 },
  { id:'M008', name:'Omeprazole 20mg', unit:'แคปซูล', stock:150, price:12, cost:6, expire:'2026-09-30', category:'ยาระบบทางเดินอาหาร', minstock:50 },
  { id:'M009', name:'Loratadine 10mg', unit:'เม็ด', stock:300, price:10, cost:5, expire:'2026-08-31', category:'ยาแก้แพ้', minstock:80 },
  { id:'M010', name:'Cetirizine 10mg', unit:'เม็ด', stock:200, price:8, cost:4, expire:'2026-07-31', category:'ยาแก้แพ้', minstock:60 },
  { id:'M011', name:'Metformin 500mg', unit:'เม็ด', stock:600, price:3, cost:1.5, expire:'2027-01-31', category:'ยาเบาหวาน', minstock:150 },
  { id:'M012', name:'Amlodipine 5mg', unit:'เม็ด', stock:400, price:5, cost:2, expire:'2026-11-30', category:'ยาความดัน', minstock:100 },
  { id:'M013', name:'Atorvastatin 10mg', unit:'เม็ด', stock:120, price:12, cost:6, expire:'2026-12-31', category:'ยาลดไขมัน', minstock:40 },
  { id:'M014', name:'Domperidone 10mg', unit:'เม็ด', stock:45, price:8, cost:3, expire:'2025-09-30', category:'ยาระบบทางเดินอาหาร', minstock:50 },
  { id:'M015', name:'Dexamethasone 0.5mg', unit:'เม็ด', stock:100, price:4, cost:1.5, expire:'2026-12-31', category:'ยาสเตียรอยด์', minstock:30 },
  { id:'M016', name:'Alcohol 70%', unit:'ขวด 500ml', stock:20, price:60, cost:35, expire:'2027-03-31', category:'เวชภัณฑ์', minstock:5 },
  { id:'M017', name:'Ibuprofen 400mg', unit:'เม็ด', stock:200, price:5, cost:2, expire:'2026-11-30', category:'ยาแก้ปวด/ลดไข้', minstock:60 },
  { id:'M018', name:'Diclofenac 50mg', unit:'เม็ด', stock:150, price:6, cost:2.5, expire:'2026-10-31', category:'ยาแก้ปวด/ลดไข้', minstock:50 },
];

const SAMPLE_EXPENSES = [
  { id:'X001', date:'2025-06-01', category:'เวชภัณฑ์/ยา', desc:'ซื้อยา Paracetamol 500mg x1000 เม็ด', amount:1000 },
  { id:'X002', date:'2025-06-02', category:'ค่าสาธารณูปโภค', desc:'ค่าไฟฟ้าเดือนพฤษภาคม', amount:2500 },
  { id:'X003', date:'2025-06-05', category:'เวชภัณฑ์/ยา', desc:'ซื้อยา Amoxicillin 500mg x200 แคปซูล', amount:800 },
  { id:'X004', date:'2025-06-10', category:'ค่าเช่า', desc:'ค่าเช่าสถานที่ประจำเดือนมิถุนายน', amount:8000 },
];

// ── Treatment / Service master list (not linked to inventory)
const SAMPLE_SERVICES = [
  { id:'S001', name:'ค่าตรวจรักษา (OPD)',            category:'ค่าตรวจ',    price:300,  unit:'ครั้ง', active:true },
  { id:'S002', name:'ค่าตรวจรักษา (พิเศษ)',          category:'ค่าตรวจ',    price:500,  unit:'ครั้ง', active:true },
  { id:'S003', name:'ค่าหัตถการฉีดยา (1 รายการ)',    category:'ค่าหัตถการ', price:50,   unit:'ครั้ง', active:true },
  { id:'S004', name:'ค่าหัตถการฉีดยา (2 รายการ)',    category:'ค่าหัตถการ', price:80,   unit:'ครั้ง', active:true },
  { id:'S005', name:'ค่าหัตถการฉีดยา (3 รายการ)',    category:'ค่าหัตถการ', price:100,  unit:'ครั้ง', active:true },
  { id:'S006', name:'ค่าพันแผล (เล็ก)',              category:'ค่าหัตถการ', price:100,  unit:'ครั้ง', active:true },
  { id:'S007', name:'ค่าพันแผล (ใหญ่)',              category:'ค่าหัตถการ', price:200,  unit:'ครั้ง', active:true },
  { id:'S008', name:'ค่าตัดไหม',                     category:'ค่าหัตถการ', price:150,  unit:'ครั้ง', active:true },
  { id:'S009', name:'ค่าเจาะหลอดเลือด/채혈',         category:'ค่าหัตถการ', price:50,   unit:'ครั้ง', active:true },
  { id:'S010', name:'ค่าตรวจ EKG',                   category:'ค่าตรวจพิเศษ',price:200, unit:'ครั้ง', active:true },
  { id:'S011', name:'ค่าตรวจ DTX (Blood Sugar)',      category:'ค่าตรวจพิเศษ',price:50,  unit:'ครั้ง', active:true },
  { id:'S012', name:'ค่าตรวจ Rapid Antigen Test',    category:'ค่าตรวจพิเศษ',price:200, unit:'ครั้ง', active:true },
  { id:'S013', name:'ค่าออกใบรับรองแพทย์',           category:'เอกสาร',     price:100,  unit:'ฉบับ', active:true },
  { id:'S014', name:'ค่าบริการอื่นๆ',               category:'อื่นๆ',       price:0,    unit:'ครั้ง', active:true },
];

// ===================== MAIN APP =====================
function ClinicDashboard() {
  const [page, setPage] = useState('dashboard');
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── App state — starts from SAMPLE data, gets overwritten by DB on load
  const [patients, setPatients] = useState(SAMPLE_PATIENTS);
  const [visits, setVisits] = useState(SAMPLE_VISITS);
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTS);
  const [receipts, setReceipts] = useState(SAMPLE_RECEIPTS);
  const [medicines, setMedicines] = useState(SAMPLE_MEDICINES);
  const [treatmentServices, setTreatmentServices] = useState(SAMPLE_SERVICES);
  const [certModal, setCertModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [appointModal, setAppointModal] = useState(null);

  // ── Load all data from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [pts, vis, apps, recs, meds, svcs] = await Promise.all([
          supa.getAll('patients'),
          supa.getAll('visits'),
          supa.getAll('appointments'),
          supa.getAll('receipts'),
          supa.getAll('medicines'),
          supa.getAll('treatment_services'),
        ]);
        if (cancelled) return;
        if (pts === null) { setDbError('ไม่สามารถเชื่อมต่อฐานข้อมูลได้ — ใช้ข้อมูลทดสอบแทน'); setLoading(false); return; }
        // Use DB data if tables have rows, else keep sample data as seed
        if (pts.length > 0) setPatients(pts);
        if (vis.length > 0) setVisits(vis.map(fromDbVisit));
        if (apps.length > 0) setAppointments(apps.map(fromDbAppointment));
        if (recs.length > 0) setReceipts(recs.map(fromDbReceipt));
        if (meds.length > 0) setMedicines(meds);
        if (svcs.length > 0) setTreatmentServices(svcs.map(fromDbService));
        setDbReady(true);
      } catch(e) {
        if (!cancelled) {
          console.error('DB load error:', e);
          const msg = e.message||String(e);
          // "Load failed" = artifact sandbox blocks fetch → tell user to open in browser
          if(msg.includes('Load failed')||msg.includes('Failed to fetch')||msg.includes('NetworkError')) {
            setDbError('SANDBOX_BLOCK');
          } else {
            setDbError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // ── Seed sample data to DB on first run (only when tables are empty)
  useEffect(() => {
    if (!dbReady) return;
    const seed = async () => {
      const pts = await supa.getAll('patients');
      if (pts && pts.length === 0) {
        await supa.upsert('patients', SAMPLE_PATIENTS);
        await supa.upsert('medicines', SAMPLE_MEDICINES);
        await supa.upsert('treatment_services', SAMPLE_SERVICES);
        console.log('Sample data seeded to DB');
      }
    };
    seed();
  }, [dbReady]);

  // ── CRUD helpers that update both state and DB
  const savePatient = async (p) => {
    setPatients(prev => {
      const exists = prev.find(x => x.hn === p.hn);
      return exists ? prev.map(x => x.hn === p.hn ? p : x) : [...prev, p];
    });
    await supa.upsert('patients', p);
  };

  const saveVisit = async (v) => {
    setVisits(prev => {
      const exists = prev.find(x => x.id === v.id);
      return exists ? prev.map(x => x.id === v.id ? v : x) : [...prev, v];
    });
    await supa.upsert('visits', toDbVisit(v));
  };

  const saveReceipt = async (r) => {
    setReceipts(prev => [...prev, r]);
    await supa.upsert('receipts', toDbReceipt(r));
  };

  const saveAppointment = async (a) => {
    setAppointments(prev => {
      const exists = prev.find(x => x.id === a.id);
      return exists ? prev.map(x => x.id === a.id ? a : x) : [...prev, a];
    });
    await supa.upsert('appointments', a);
  };

  const deleteAppointment = async (id) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    await supa.delete('appointments', 'id', id);
  };

  const saveMedicine = async (m) => {
    setMedicines(prev => {
      const exists = prev.find(x => x.id === m.id);
      return exists ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
    });
    await supa.upsert('medicines', m);
  };

  const deleteMedicine = async (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
    await supa.delete('medicines', 'id', id);
  };

  const patchMedicineStock = async (medId, newStock) => {
    setMedicines(prev => prev.map(m => m.id === medId ? { ...m, stock: newStock } : m));
    await supa.patch('medicines', 'id', medId, { stock: newStock });
  };

  const saveTreatmentService = async (s) => {
    setTreatmentServices(prev => {
      const exists = prev.find(x => x.id === s.id);
      return exists ? prev.map(x => x.id === s.id ? s : x) : [...prev, s];
    });
    await supa.upsert('treatment_services', s);
  };

  const deleteTreatmentService = async (id) => {
    setTreatmentServices(prev => prev.filter(s => s.id !== id));
    await supa.delete('treatment_services', 'id', id);
  };

  // ── ID generators (based on current state length for uniqueness)
  const nextHN = () => pad(patients.length + 1);
  const nextVID = () => `V${pad(visits.length+1,3)}`;
  const nextRID = () => `R${pad(receipts.length+1,3)}`;
  const nextAID = () => `A${pad(appointments.length+1,3)}`;

  const getPatient = (hn) => patients.find(p=>p.hn===hn);
  const getVisitsForHN = (hn) => visits.filter(v=>v.hn===hn).sort((a,b)=>b.date.localeCompare(a.date));

  // Stats
  const todayStr = today();
  const todayVisits = visits.filter(v=>v.date===todayStr).length;
  const todayAppoints = appointments.filter(a=>a.date===todayStr).length;
  const lowStock = medicines.filter(m=>m.stock<=m.minstock).length;
  const monthReceipts = receipts.filter(r=>r.date.startsWith(todayStr.slice(0,7)));
  const monthRevenue = monthReceipts.reduce((s,r)=>{
    const total = r.items.reduce((t,i)=>t+i.qty*i.price,0)-r.discount;
    return s+total;
  },0);

  const NAV = [
    {key:'dashboard',icon:'📊',label:'หน้าหลัก'},
    {key:'register',icon:'📋',label:'ลงทะเบียน/เวชระเบียน'},
    {key:'examine',icon:'🩺',label:'ตรวจรักษา'},
    {key:'cert',icon:'📄',label:'ใบรับรองแพทย์'},
    {key:'receipt',icon:'🧾',label:'ใบเสร็จรับเงิน'},
    {key:'appoint',icon:'📅',label:'การนัดหมาย'},
    {key:'accounting',icon:'💼',label:'บัญชี'},
    {key:'pharmacy',icon:'💊',label:'คลังยาและเวชภัณฑ์'},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#eef2f7',fontFamily:"'Sarabun','Noto Sans Thai',sans-serif"}}>
      <style>{globalStyles}</style>

      {/* ── DB Loading overlay */}
      {loading&&(
        <div style={{position:'fixed',inset:0,background:'rgba(26,82,118,0.92)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:'#fff'}}>
          <div style={{fontSize:48,marginBottom:16}}>🏥</div>
          <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>{CLINIC_NAME}</div>
          <div style={{fontSize:14,opacity:0.85,marginBottom:24}}>กำลังโหลดข้อมูลจากฐานข้อมูล...</div>
          <div style={{width:200,height:4,background:'rgba(255,255,255,0.2)',borderRadius:2,overflow:'hidden'}}>
            <div style={{width:'60%',height:'100%',background:'#2ecc71',borderRadius:2,animation:'pulse 1.5s ease-in-out infinite'}}></div>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
        </div>
      )}

      {/* ── DB status banner */}
      {!loading&&(
        dbError==='SANDBOX_BLOCK' ? (
          <div style={{background:'#e67e22',color:'#fff',fontSize:12,padding:'6px 16px',textAlign:'center',lineHeight:1.6}}>
            ⚠️ <b>Claude Artifact ไม่อนุญาตให้เชื่อมต่อ internet</b> — ระบบทำงานปกติแต่ยังไม่ sync DB &nbsp;|&nbsp;
            เพื่อใช้งานจริงกับ Supabase: เปิดไฟล์ใน <b>Netlify Drop</b> หรือ <b>CodeSandbox</b> แทน
          </div>
        ) : (
          <div style={{background:dbError?'#e74c3c':dbReady?'#1e8449':'#e67e22',color:'#fff',fontSize:11,padding:'3px 16px',textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {dbError
              ? <span>⚠️ DB Error: {dbError}</span>
              : dbReady
                ? <span>✅ เชื่อมต่อ Supabase แล้ว — ข้อมูลบันทึกอัตโนมัติ</span>
                : <span>⏳ กำลังเชื่อมต่อ...</span>
            }
          </div>
        )
      )}
      {/* HEADER */}
      <div style={{background:`linear-gradient(135deg,#1a5276,#2e86c1)`,color:'#fff',padding:'0 0 0 0',boxShadow:'0 2px 12px rgba(26,82,118,0.25)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 24px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,background:'rgba(255,255,255,0.2)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🏥</div>
            <div>
              <div style={{fontWeight:700,fontSize:17,letterSpacing:0.3}}>{CLINIC_NAME}</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:1}}>{CLINIC_ADDRESS}</div>
            </div>
          </div>
          <div style={{textAlign:'right',fontSize:12,opacity:0.85}}>
            <div>{thaiDateFull(today())}</div>
            <div style={{marginTop:2}}>โทร. {CLINIC_TEL}</div>
          </div>
        </div>
        {/* NAV */}
        <div style={{display:'flex',gap:2,padding:'10px 16px 0',overflowX:'auto',flexWrap:'nowrap'}} className="scroll-thin">
          {NAV.map(n=>(
            <button key={n.key} onClick={()=>setPage(n.key)}
              style={{background:page===n.key?'rgba(255,255,255,0.22)':'transparent',color:'#fff',border:'none',borderRadius:'8px 8px 0 0',padding:'8px 14px',cursor:'pointer',fontSize:12.5,fontWeight:page===n.key?700:400,whiteSpace:'nowrap',fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,borderBottom:page===n.key?'2.5px solid #fff':'2.5px solid transparent',transition:'all 0.15s'}}>
              <span>{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{padding:'20px 20px 40px',maxWidth:1200,margin:'0 auto'}}>
        {page==='dashboard' && <DashboardPage todayVisits={todayVisits} todayAppoints={todayAppoints} lowStock={lowStock} monthRevenue={monthRevenue} patients={patients} visits={visits} appointments={appointments} medicines={medicines} today={todayStr} />}
        {page==='register' && <RegisterPage patients={patients} savePatient={savePatient} visits={visits} saveVisit={saveVisit} nextHN={nextHN} nextVID={nextVID} setPage={setPage} getVisitsForHN={getVisitsForHN} getPatient={getPatient} treatmentServices={treatmentServices} />}
        {page==='examine' && <ExaminePage patients={patients} visits={visits} saveVisit={saveVisit} nextVID={nextVID} getPatient={getPatient} getVisitsForHN={getVisitsForHN} setCertModal={setCertModal} setReceiptModal={setReceiptModal} setAppointModal={setAppointModal} medicines={medicines} patchMedicineStock={patchMedicineStock} treatmentServices={treatmentServices} receipts={receipts} saveReceipt={saveReceipt} nextRID={nextRID} />}
        {page==='cert' && <CertPage patients={patients} visits={visits} getPatient={getPatient} />}
        {page==='receipt' && <ReceiptPage receipts={receipts} saveReceipt={saveReceipt} patients={patients} visits={visits} nextRID={nextRID} getPatient={getPatient} medicines={medicines} patchMedicineStock={patchMedicineStock} />}
        {page==='appoint' && <AppointPage appointments={appointments} saveAppointment={saveAppointment} deleteAppointment={deleteAppointment} patients={patients} nextAID={nextAID} getPatient={getPatient} today={todayStr} />}
        {page==='accounting' && <AccountingPage receipts={receipts} today={todayStr} />}
        {page==='pharmacy' && <PharmacyPage medicines={medicines} saveMedicine={saveMedicine} deleteMedicine={deleteMedicine} receipts={receipts} treatmentServices={treatmentServices} saveTreatmentService={saveTreatmentService} deleteTreatmentService={deleteTreatmentService} />}
      </div>

      {/* Floating Modals */}
      {certModal && <CertModal data={certModal} onClose={()=>setCertModal(null)} getPatient={getPatient} />}
      {receiptModal && <ReceiptQuickModal data={receiptModal} onClose={()=>setReceiptModal(null)} getPatient={getPatient} nextRID={nextRID} receipts={receipts} saveReceipt={saveReceipt} medicines={medicines} patchMedicineStock={patchMedicineStock} />}
      {appointModal && <AppointQuickModal data={appointModal} onClose={()=>setAppointModal(null)} getPatient={getPatient} appointments={appointments} saveAppointment={saveAppointment} nextAID={nextAID} />}
    </div>
  );
}

// ===================== DASHBOARD =====================
function DashboardPage({todayVisits,todayAppoints,lowStock,monthRevenue,patients,visits,appointments,medicines,today}) {
  const upcomingAppoints = appointments.filter(a=>a.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)).slice(0,5);
  const recentVisits = [...visits].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const expireSoon = medicines.filter(m=>{
    const diff = (new Date(m.expire)-new Date())/(1000*60*60*24);
    return diff<90;
  });
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>📊 ภาพรวมคลินิก</h2>
        <button className="btn btn-print btn-sm no-print" onClick={()=>doPrint('dashboard-printarea','ภาพรวมคลินิก')}>🖨️ พิมพ์หน้าหลัก</button>
      </div>
      <div id="dashboard-printarea">
        <div style={{display:'none'}} className="print-only"><ClinicHeader /><div style={{textAlign:'center',fontWeight:700,fontSize:14,marginBottom:12}}>รายงานภาพรวมคลินิก — {thaiDate(today)}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:20}}>
        {[
          {icon:'👤',label:'ผู้ป่วยทั้งหมด',value:patients.length+' ราย',color:'var(--primary)'},
          {icon:'🩺',label:'ตรวจวันนี้',value:todayVisits+' ราย',color:'var(--accent)'},
          {icon:'📅',label:'นัดวันนี้',value:todayAppoints+' ราย',color:'#8e44ad'},
          {icon:'💰',label:'รายรับเดือนนี้',value:(monthRevenue).toLocaleString()+' บ.',color:'var(--warning)'},
          {icon:'⚠️',label:'ยาใกล้หมด',value:lowStock+' รายการ',color:'var(--danger)'},
        ].map((s,i)=>(
          <div key={i} className="card" style={{textAlign:'center',padding:'18px 10px'}}>
            <div style={{fontSize:28,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:12,color:'var(--gray)',marginTop:3}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:10}}>📋 การตรวจล่าสุด</div>
          {recentVisits.length===0 && <div className="text-gray text-sm">ยังไม่มีข้อมูล</div>}
          {recentVisits.map(v=>(
            <div key={v.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--gray-light)'}}>
              <div>
                <span style={{fontWeight:600,fontSize:13,color:'var(--primary)'}}>HN {v.hn}</span>
                <span style={{fontSize:12,color:'var(--gray)',marginLeft:8}}>{v.cc?.slice(0,25)}{v.cc?.length>25?'...':''}</span>
              </div>
              <span className="text-xs text-gray">{thaiDate(v.date)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:10}}>📅 นัดหมายที่กำลังจะมาถึง</div>
          {upcomingAppoints.length===0 && <div className="text-gray text-sm">ไม่มีการนัดหมาย</div>}
          {upcomingAppoints.map(a=>(
            <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid var(--gray-light)'}}>
              <div>
                <span style={{fontWeight:600,fontSize:13}}>{a.patname}</span>
                <div style={{fontSize:11,color:'var(--gray)'}}>{a.reason?.slice(0,30)}</div>
              </div>
              <span className="text-xs text-gray">{thaiDate(a.date)} {a.time}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{gridColumn:'1/-1'}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--danger)',marginBottom:10}}>⚠️ ยาที่ต้องระวัง (สต๊อกต่ำ / ใกล้หมดอายุ)</div>
          {medicines.filter(m=>m.stock<=m.minstock||((new Date(m.expire)-new Date())/(1000*60*60*24)<90)).length===0&&<div className="text-gray text-sm">ทุกรายการปกติ</div>}
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {medicines.filter(m=>m.stock<=m.minstock).map(m=>(
              <div key={m.id+'low'} style={{background:'var(--danger-pale)',border:'1px solid var(--danger)',borderRadius:6,padding:'5px 12px',fontSize:12}}>
                <span style={{fontWeight:600,color:'var(--danger)'}}>{m.name}</span> <span style={{color:'var(--gray)'}}>เหลือ {m.stock} {m.unit}</span>
              </div>
            ))}
            {medicines.filter(m=>(new Date(m.expire)-new Date())/(1000*60*60*24)<90).map(m=>(
              <div key={m.id+'exp'} style={{background:'var(--warning-pale)',border:'1px solid var(--warning)',borderRadius:6,padding:'5px 12px',fontSize:12}}>
                <span style={{fontWeight:600,color:'var(--warning)'}}>{m.name}</span> <span style={{color:'var(--gray)'}}>หมดอายุ {thaiDate(m.expire)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ===================== QUEUE TICKET PRINT =====================
function printQueueTicket(qNum, pat, cc) {
  const win = window.open('','_blank','width=320,height=420');
  const now = new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
  win.document.write(`<!DOCTYPE html><html><head><title>บัตรคิว</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sarabun',sans-serif;background:#fff;padding:6px;width:80mm;}
    .ticket{border:2px dashed #1a5276;border-radius:8px;padding:10px 12px;text-align:center;}
    .clinic{font-size:10px;font-weight:700;color:#1a5276;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:8px;}
    .qlabel{font-size:10px;color:#888;margin-bottom:2px;letter-spacing:2px;}
    .qnum{font-size:56px;font-weight:800;color:#1a5276;line-height:1;margin:6px 0;}
    .hn{font-size:12px;font-weight:700;color:#555;margin-bottom:3px;}
    .name{font-size:14px;font-weight:700;color:#222;margin-bottom:8px;}
    .cc-box{background:#fff8e1;border:1px solid #f39c12;border-radius:5px;padding:5px 8px;margin:5px 0;text-align:left;}
    .cc-label{font-size:9px;color:#888;font-weight:700;margin-bottom:2px;}
    .cc-text{font-size:12px;color:#333;font-weight:600;}
    .foot{font-size:9px;color:#aaa;margin-top:8px;border-top:1px dashed #eee;padding-top:5px;}
    @media print{body{padding:0;width:auto;}button{display:none!important;}}
  </style></head><body>
  <div class="ticket">
    <div class="clinic">🏥 ${CLINIC_NAME}</div>
    <div class="qlabel">หมายเลขคิว / QUEUE NO.</div>
    <div class="qnum">${qNum}</div>
    <div class="hn">HN: ${pat.hn}</div>
    <div class="name">${(pat.prefix||'')+pat.fname} ${pat.lname}</div>
    ${cc ? `<div class="cc-box"><div class="cc-label">อาการที่มาพบแพทย์</div><div class="cc-text">${cc}</div></div>` : ''}
    <div class="foot">${thaiDate(today())} เวลา ${now} น.</div>
  </div>
  <div style="text-align:center;margin-top:8px;">
    <button onclick="window.print()" style="padding:7px 20px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-family:'Sarabun',sans-serif;font-weight:700;">🖨️ พิมพ์บัตรคิว</button>
  </div></body></html>`);
  win.document.close();
  setTimeout(()=>{win.focus();win.print();},500);
}

// ===================== REGISTER / MEDICAL RECORD =====================
function RegisterPage({patients,savePatient,visits,saveVisit,nextHN,nextVID,setPage,getVisitsForHN,getPatient,treatmentServices}) {
  const [subpage, setSubpage] = useState('list');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    prefix:'นาย',fname:'',lname:'',gender:'ชาย',dob:'',idcard:'',tel:'',
    address:'',bloodtype:'',allergy:'',chronic:'',currentmed:'',
    email:'',occupation:'',emcontact:'',emtel:'',
  });
  const [intake, setIntake] = useState({cc:'',temp:'',bp_sys:'',bp_dia:'',pr:'',rr:'',o2:'',weight:'',height:'',nurse:''});
  const [lastRegistered, setLastRegistered] = useState(null);
  const [selectedPat, setSelectedPat] = useState(null);
  const fi = (k,v) => setIntake(prev=>({...prev,[k]:v}));

  const filtered = patients.filter(p=>{
    const q=search.toLowerCase();
    return (p.fname||'').toLowerCase().includes(q)||(p.lname||'').toLowerCase().includes(q)||
           (p.hn||'').includes(q)||(p.idcard||'').includes(q)||(p.tel||'').includes(q);
  });

  const saveNewPatient = async () => {
    if(!form.fname.trim()||!form.lname.trim()){alert('กรุณากรอกชื่อและนามสกุล');return;}
    const hn = nextHN();
    const newP = { ...form, hn, created_at: new Date().toISOString() };
    await savePatient(newP);
    const hasIntake = Object.values(intake).some(v=>v&&String(v).trim());
    let visitId = null;
    if(hasIntake && saveVisit && nextVID) {
      const vid = nextVID();
      visitId = vid;
      await saveVisit({
        id:vid, hn, date:today(),
        cc:intake.cc||'', pi:'', pe:'', dx:'', tx:'',
        drugs:[], services:[],
        bp:`${intake.bp_sys||''}${intake.bp_dia?'/'+intake.bp_dia:''}`,
        pr:intake.pr||'', rr:intake.rr||'', temp:intake.temp||'',
        o2:intake.o2||'', weight:intake.weight||'', height:intake.height||'',
        nurse:intake.nurse||'', note:'บันทึกโดยพยาบาลตอนลงทะเบียน',
      });
    }
    const qNum = String(patients.length+1).padStart(3,'0');
    setLastRegistered({pat:newP, visitId, qNum, cc:intake.cc});
    setForm({prefix:'นาย',fname:'',lname:'',gender:'ชาย',dob:'',idcard:'',tel:'',address:'',bloodtype:'',allergy:'',chronic:'',currentmed:'',email:'',occupation:'',emcontact:'',emtel:''});
    setIntake({cc:'',temp:'',bp_sys:'',bp_dia:'',pr:'',rr:'',o2:'',weight:'',height:'',nurse:''});
    setSubpage('registered');
  };

  const age=(dob)=>{if(!dob)return'-';return Math.floor((new Date()-new Date(dob))/(365.25*24*60*60*1000))+' ปี';};

  const bmi = intake.weight&&intake.height ? (intake.weight/((intake.height/100)**2)).toFixed(1) : null;
  const bmiLabel = bmi ? (bmi<18.5?'น้ำหนักน้อย':bmi<23?'ปกติ':bmi<25?'ท้วม':bmi<30?'อ้วน':'อ้วนมาก') : '';

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>📋 เวชระเบียน</h2>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-outline btn-sm" onClick={()=>setSubpage('list')} style={{background:subpage==='list'?'var(--primary-pale)':''}}>📂 รายชื่อผู้ป่วย</button>
          <button className="btn btn-primary btn-sm" onClick={()=>{setSubpage('new');setSelectedPat(null);setLastRegistered(null);}}>+ ลงทะเบียนใหม่</button>
        </div>
      </div>

      {subpage==='list'&&(
        <div>
          <div style={{marginBottom:14}}>
            <input placeholder="🔍 ค้นหาตามชื่อ นามสกุล HN บัตรประชาชน เบอร์โทร" value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:440}} />
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead><tr style={{background:'var(--primary)',color:'#fff'}}>
                <th style={{padding:'10px 14px',textAlign:'left'}}>HN</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>ชื่อ-นามสกุล</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>เพศ/อายุ</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>โรคประจำตัว</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>แพ้ยา</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>Visit</th>
                <th style={{padding:'10px 14px',textAlign:'left'}}>จัดการ</th>
              </tr></thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={7} style={{padding:'20px',textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูล</td></tr>}
                {filtered.map((p,i)=>(
                  <tr key={p.hn} style={{background:i%2===0?'#fff':'var(--gray-pale)',cursor:'pointer'}} onClick={()=>{setSelectedPat(p);setSubpage('detail');}}>
                    <td style={{padding:'9px 14px',fontWeight:700,color:'var(--primary)'}}>{p.hn}</td>
                    <td style={{padding:'9px 14px',fontWeight:600}}>{p.prefix}{p.fname} {p.lname}</td>
                    <td style={{padding:'9px 14px'}}>{p.gender} / {age(p.dob)}</td>
                    <td style={{padding:'9px 14px',color:p.chronic&&p.chronic!=='-'?'var(--warning)':'var(--gray)'}}>{p.chronic||'-'}</td>
                    <td style={{padding:'9px 14px',color:p.allergy&&p.allergy!=='-'?'var(--danger)':'var(--gray)'}}>{p.allergy||'-'}</td>
                    <td style={{padding:'9px 14px'}}>{getVisitsForHN(p.hn).length} ครั้ง</td>
                    <td style={{padding:'9px 14px'}}><button className="btn btn-outline btn-sm" onClick={e=>{e.stopPropagation();setSelectedPat(p);setSubpage('detail');}}>ดูรายละเอียด</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subpage==='new'&&(
        <div className="card">
          <ClinicHeader />
          <div style={{textAlign:'center',fontWeight:700,fontSize:15,color:'var(--primary)',marginBottom:16}}>แบบฟอร์มลงทะเบียนผู้ป่วยรายใหม่</div>
          <div style={{background:'var(--primary-pale)',border:'1.5px solid var(--primary-light)',borderRadius:8,padding:'8px 14px',marginBottom:14,fontSize:13}}>
            <b>HN ที่จะได้รับ:</b> <span style={{color:'var(--primary)',fontWeight:700,fontSize:15}}>{nextHN()}</span>
            <span style={{marginLeft:16}}><b>วันที่:</b> {thaiDate(today())}</span>
          </div>
          <PatientForm form={form} setForm={setForm} />

          {/* Intake section */}
          <div className="divider" />
          <div style={{background:'#fff3e0',border:'2px solid #e67e22',borderRadius:10,padding:'12px 14px',marginBottom:4}}>
            <div style={{fontWeight:700,fontSize:13,color:'#e67e22',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <span>🔴</span> บันทึกอาการและสัญญาณชีพ
              <span style={{fontWeight:400,fontSize:11,color:'#888',marginLeft:4}}>(พยาบาล/เจ้าหน้าที่ — กรอกหรือข้ามได้)</span>
            </div>
            <div className="form-group">
              <label>CC. อาการที่นำมาพบแพทย์ (Chief Complaint)</label>
              <input value={intake.cc} onChange={e=>fi('cc',e.target.value)} placeholder="เช่น ไข้ ปวดศีรษะ 2 วัน, ไอมีเสมหะ" />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10,marginBottom:8}}>
              {[['อุณหภูมิ (°C)','temp','36.5'],['BP ตัวบน (mmHg)','bp_sys','120'],['BP ตัวล่าง (mmHg)','bp_dia','80'],
                ['ชีพจร (ครั้ง/นาที)','pr','80'],['อัตราการหายใจ (/นาที)','rr','18'],['SpO₂ (%)','o2','98'],
                ['น้ำหนัก (กก.)','weight','60'],['ส่วนสูง (ซม.)','height','165'],['บันทึกโดย','nurse','']].map(([lbl,key,ph])=>(
                <div key={key}>
                  <label>{lbl}</label>
                  <input value={intake[key]} onChange={e=>fi(key,e.target.value)} placeholder={ph}
                    type={key==='nurse'?'text':'number'} step={key==='temp'||key==='weight'?'0.1':'1'} />
                </div>
              ))}
            </div>
            {bmi&&(
              <div style={{fontSize:12,color:'#666',background:'#fff',borderRadius:5,padding:'4px 10px',display:'inline-block'}}>
                BMI: <b style={{color:'#1a5276'}}>{bmi}</b> <span style={{color:'#888'}}>({bmiLabel})</span>
              </div>
            )}
          </div>

          <div className="divider" />
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button className="btn btn-gray" onClick={()=>setSubpage('list')}>ยกเลิก</button>
            <button className="btn btn-primary" onClick={saveNewPatient}>💾 ลงทะเบียนและบันทึก</button>
          </div>
        </div>
      )}

      {subpage==='registered'&&lastRegistered&&(
        <div className="card" style={{maxWidth:500,margin:'0 auto',textAlign:'center',padding:28}}>
          <div style={{fontSize:40,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:16,color:'var(--accent)',marginBottom:4}}>ลงทะเบียนสำเร็จ!</div>
          <div style={{fontSize:14,color:'var(--gray-dark)',marginBottom:16}}>
            {lastRegistered.pat.prefix}{lastRegistered.pat.fname} {lastRegistered.pat.lname}
            &nbsp;|&nbsp; <b style={{color:'var(--primary)'}}>HN: {lastRegistered.pat.hn}</b>
          </div>
          <div style={{background:'var(--primary)',color:'#fff',borderRadius:12,padding:'12px 24px',marginBottom:14,display:'inline-block',minWidth:130}}>
            <div style={{fontSize:11,opacity:0.8,marginBottom:2,letterSpacing:2}}>หมายเลขคิว</div>
            <div style={{fontSize:52,fontWeight:800,lineHeight:1}}>{lastRegistered.qNum}</div>
          </div>
          {lastRegistered.cc&&(
            <div style={{background:'#fff8e1',border:'1px solid #f39c12',borderRadius:6,padding:'6px 12px',marginBottom:14,fontSize:13}}>
              <b>CC:</b> {lastRegistered.cc}
            </div>
          )}
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn btn-print" onClick={()=>printQueueTicket(lastRegistered.qNum,lastRegistered.pat,lastRegistered.cc)}>🖨️ พิมพ์บัตรคิว</button>
            <button className="btn btn-primary" onClick={()=>{setSubpage('new');setLastRegistered(null);}}>+ ลงทะเบียนคนต่อไป</button>
            <button className="btn btn-gray" onClick={()=>setSubpage('list')}>กลับรายชื่อ</button>
          </div>
        </div>
      )}
      {subpage==='detail' && selectedPat && (
        <PatientDetail pat={selectedPat} visits={getVisitsForHN(selectedPat.hn)} onBack={()=>setSubpage('list')} patients={patients} savePatient={savePatient} treatmentServices={treatmentServices} />
      )}
    </div>
  );
}

function PatientForm({form,setForm}) {
  const f = (k,v) => setForm(prev=>({...prev,[k]:v}));
  return (
    <div>
      <div style={{background:'var(--gray-pale)',borderRadius:8,padding:'12px 14px',marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:13,color:'var(--primary)',marginBottom:10}}>ข้อมูลส่วนตัว</div>
        <div className="row">
          <div style={{flex:'0 0 110px'}}>
            <label>คำนำหน้าชื่อ *</label>
            <select value={form.prefix} onChange={e=>f('prefix',e.target.value)}>
              {['นาย','นาง','นางสาว','เด็กชาย','เด็กหญิง','ด.ช.','ด.ญ.','พ.ท.','พ.ญ.','อื่นๆ'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="col-2"><label>ชื่อ *</label><input value={form.fname} onChange={e=>f('fname',e.target.value)} placeholder="ชื่อจริง" /></div>
          <div className="col-2"><label>นามสกุล *</label><input value={form.lname} onChange={e=>f('lname',e.target.value)} placeholder="นามสกุล" /></div>
          <div style={{flex:'0 0 90px'}}>
            <label>เพศ *</label>
            <select value={form.gender} onChange={e=>f('gender',e.target.value)}>
              <option>ชาย</option><option>หญิง</option><option>อื่นๆ</option>
            </select>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-1"><label>วันเกิด</label><input type="date" value={form.dob} onChange={e=>f('dob',e.target.value)} /></div>
          <div className="col-2"><label>เลขบัตรประชาชน / Passport</label><input value={form.idcard} onChange={e=>f('idcard',e.target.value)} placeholder="เลข 13 หลัก" /></div>
          <div className="col-1"><label>หมู่เลือด</label>
            <select value={form.bloodtype} onChange={e=>f('bloodtype',e.target.value)}>
              <option value=''>-ไม่ทราบ-</option>
              {['O','A','B','AB'].map(b=>[<option key={b+'+'}>{b}+</option>,<option key={b+'-'}>{b}-</option>])}
            </select>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-1"><label>เบอร์โทรศัพท์</label><input value={form.tel} onChange={e=>f('tel',e.target.value)} placeholder="0x-xxxx-xxxx" /></div>
          <div className="col-1"><label>อีเมล</label><input value={form.email} onChange={e=>f('email',e.target.value)} placeholder="email@..." /></div>
          <div className="col-1"><label>อาชีพ</label><input value={form.occupation} onChange={e=>f('occupation',e.target.value)} /></div>
        </div>
        <div className="form-group mt-2"><label>ที่อยู่</label><input value={form.address} onChange={e=>f('address',e.target.value)} placeholder="บ้านเลขที่ หมู่ที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" /></div>
        <div className="row mt-2">
          <div className="col-2"><label>ชื่อผู้ติดต่อฉุกเฉิน</label><input value={form.emcontact} onChange={e=>f('emcontact',e.target.value)} /></div>
          <div className="col-1"><label>เบอร์โทรฉุกเฉิน</label><input value={form.emtel} onChange={e=>f('emtel',e.target.value)} /></div>
        </div>
      </div>
      <div style={{background:'#fff8f0',borderRadius:8,padding:'12px 14px',border:'1.5px solid #f0d9c0'}}>
        <div style={{fontWeight:700,fontSize:13,color:'var(--warning)',marginBottom:10}}>⚠️ ข้อมูลทางการแพทย์สำคัญ</div>
        <div className="row">
          <div className="col-2">
            <label>โรคประจำตัว / ประวัติโรคสำคัญ</label>
            <textarea value={form.chronic} onChange={e=>f('chronic',e.target.value)} rows={2} placeholder="เช่น เบาหวาน ความดัน โรคหัวใจ หอบหืด ฯลฯ" />
          </div>
          <div className="col-1">
            <label>ประวัติการผ่าตัด</label>
            <textarea value={form.surgery||''} onChange={e=>f('surgery',e.target.value)} rows={2} placeholder="ผ่าตัดอะไร เมื่อไหร่" />
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-1">
            <label style={{color:'var(--danger)'}}>🚫 ประวัติแพ้ยา / แพ้อาหาร (ระบุชื่อและอาการ)</label>
            <input value={form.allergy} onChange={e=>f('allergy',e.target.value)} placeholder="เช่น แพ้ Penicillin มีผื่น, แพ้อาหารทะเล" style={{borderColor:form.allergy&&form.allergy!=='-'?'var(--danger)':''}} />
          </div>
          <div className="col-1">
            <label>ยาที่ใช้ประจำ</label>
            <input value={form.currentmed} onChange={e=>f('currentmed',e.target.value)} placeholder="เช่น Metformin 500mg 1x1 pc, Amlodipine 5mg 1x1 hs" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PatientDetail({pat,visits,onBack,patients,savePatient,treatmentServices}) {
  const [tab,setTab]=useState('info');
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({...pat});
  const age = (dob)=>{if(!dob)return '-';const d=new Date()-new Date(dob);return Math.floor(d/(365.25*24*60*60*1000))+' ปี';};
  const save=async()=>{await savePatient(form);setEditing(false);alert('บันทึกข้อมูลเรียบร้อย');};
  return (
    <div>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:14}}>
        <button className="btn btn-gray btn-sm" onClick={onBack}>← กลับ</button>
        <div style={{fontWeight:700,fontSize:15,color:'var(--primary)'}}>{pat.prefix}{pat.fname} {pat.lname}</div>
        <div style={{background:'var(--primary)',color:'#fff',borderRadius:20,padding:'3px 14px',fontSize:12,fontWeight:700}}>HN: {pat.hn}</div>
        {pat.allergy&&pat.allergy!=='-'&&<div style={{background:'var(--danger-pale)',color:'var(--danger)',borderRadius:20,padding:'3px 12px',fontSize:12,fontWeight:700}}>⚠️ แพ้ยา: {pat.allergy}</div>}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {['info','visits'].map(t=>(
          <button key={t} className={`btn btn-sm ${tab===t?'btn-primary':'btn-outline'}`} onClick={()=>setTab(t)}>
            {t==='info'?'👤 ข้อมูลผู้ป่วย':'📋 ประวัติการรักษา ('+visits.length+' ครั้ง)'}
          </button>
        ))}
        {tab==='info'&&!editing&&<button className="btn btn-print btn-sm" style={{marginLeft:'auto'}} onClick={()=>doPrint(`patient-info-${pat.hn}`,'เวชระเบียน '+pat.prefix+pat.fname+' '+pat.lname)}>🖨️ พิมพ์เวชระเบียน</button>}
        {tab==='info'&&<button className="btn btn-sm btn-accent" style={{marginLeft:tab==='info'&&!editing?0:'auto'}} onClick={()=>editing?save():setEditing(true)}>{editing?'💾 บันทึก':'✏️ แก้ไขข้อมูล'}</button>}
      </div>
      {tab==='info' && (
        editing ? <div className="card"><PatientForm form={form} setForm={setForm} /><div style={{textAlign:'right',marginTop:12}}><button className="btn btn-gray btn-sm" onClick={()=>setEditing(false)}>ยกเลิก</button><button className="btn btn-primary btn-sm" style={{marginLeft:8}} onClick={save}>💾 บันทึก</button></div></div>
        : (
          <div className="card" id={`patient-info-${pat.hn}`}>
            <ClinicHeader />
            <div style={{textAlign:'center',fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:12}}>ข้อมูลเวชระเบียนผู้ป่วย</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
              {[['HN',pat.hn],['ชื่อ-นามสกุล',pat.prefix+pat.fname+' '+pat.lname],['เพศ',pat.gender],['อายุ',age(pat.dob)],['วันเกิด',thaiDate(pat.dob)],['หมู่เลือด',pat.bloodtype||'-'],['เลขบัตรประชาชน',pat.idcard||'-'],['เบอร์โทร',pat.tel||'-'],['ที่อยู่',pat.address||'-'],['อาชีพ',pat.occupation||'-'],].map(([k,v])=>(
                <div key={k} style={{padding:'5px 0',borderBottom:'1px solid var(--gray-light)'}}><span className="text-gray">{k}: </span><span style={{fontWeight:600}}>{v}</span></div>
              ))}
            </div>
            <div className="divider" />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
              <div style={{padding:'5px 0'}}><span style={{color:'var(--danger)',fontWeight:700}}>⚠️ แพ้ยา/อาหาร: </span><span style={{fontWeight:600,color:pat.allergy&&pat.allergy!=='-'?'var(--danger)':'var(--gray)'}}>{pat.allergy||'-'}</span></div>
              <div style={{padding:'5px 0'}}><span style={{color:'var(--warning)',fontWeight:700}}>โรคประจำตัว: </span><span style={{fontWeight:600}}>{pat.chronic||'-'}</span></div>
              <div style={{padding:'5px 0',gridColumn:'1/-1'}}><span className="text-gray">ยาประจำ: </span><span style={{fontWeight:600}}>{pat.currentmed||'-'}</span></div>
            </div>
          </div>
        )
      )}
      {tab==='visits' && (
        <div>
          {visits.length===0&&<div className="card" style={{textAlign:'center',color:'var(--gray)',padding:30}}>ยังไม่มีประวัติการรักษา</div>}
          {visits.map(v=>(
            <div key={v.id} className="card" style={{marginBottom:12}} id={`visit-card-${v.id}`}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div><span style={{fontWeight:700,color:'var(--primary)',fontSize:14}}>Visit: {v.id}</span><span style={{marginLeft:10,color:'var(--gray)',fontSize:13}}>{thaiDate(v.date)}</span></div>
                <button className="btn btn-print btn-sm no-print" onClick={()=>doPrint(`visit-card-${v.id}`,'บันทึกการตรวจ Visit '+v.id)}>🖨️ พิมพ์</button>
              </div>
              <VisitRecord v={v} pat={pat} readOnly treatmentServices={treatmentServices} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===================== EXAMINE PAGE =====================
function ExaminePage({patients,visits,saveVisit,nextVID,getPatient,getVisitsForHN,setCertModal,setReceiptModal,setAppointModal,medicines,patchMedicineStock,treatmentServices,receipts,saveReceipt,nextRID}) {
  const [query,setQuery]=useState('');
  const [searchResults,setSearchResults]=useState([]);
  const [pat,setPat]=useState(null);
  const [vform,setVform]=useState(null);
  const [saved,setSaved]=useState(false);
  const [lastVisit,setLastVisit]=useState(null);

  // Multi-field search: HN, name, idcard — partial match
  const doSearch=()=>{
    const q=query.trim().toLowerCase();
    if(!q){alert('กรุณากรอกคำค้นหา');return;}
    const results=patients.filter(p=>
      (p.hn||'').includes(q)||
      (p.fname||'').toLowerCase().includes(q)||
      (p.lname||'').toLowerCase().includes(q)||
      ((p.fname||'')+' '+(p.lname||'')).toLowerCase().includes(q)||
      (p.idcard||'').includes(q)
    );
    if(results.length===0){alert('ไม่พบผู้ป่วยที่ตรงกับ "'+query+'"');return;}
    if(results.length===1){loadPatient(results[0]);return;}
    setSearchResults(results);
  };

  const loadPatient=(p)=>{
    setSearchResults([]);
    setPat(p);
    const today_=today();
    // Find existing visit for today OR load the most recent one pre-filled
    const existing=visits.find(v=>v.hn===p.hn&&v.date===today_);
    if(existing){
      setVform({...existing,drugs:existing.drugs||[],services:existing.services||[]});
    } else {
      // Pre-fill vitals from latest intake visit if exists
      const latest=visits.filter(v=>v.hn===p.hn).sort((a,b)=>b.date.localeCompare(a.date))[0];
      setVform({
        id:nextVID(),hn:p.hn,date:today_,
        cc:latest?.cc||'',pi:'',pe:'',dx:'',tx:'',
        drugs:[],services:[],
        bp:latest?.date===today_?latest.bp:'',
        pr:latest?.date===today_?latest.pr:'',
        rr:latest?.date===today_?latest.rr:'',
        temp:latest?.date===today_?latest.temp:'',
        o2:latest?.date===today_?latest.o2:'',
        weight:latest?.date===today_?latest.weight:'',
        height:latest?.date===today_?latest.height:'',
        nurse:latest?.date===today_?latest.nurse:'',
        note:'',
      });
    }
    setSaved(false);
  };

  const save=async()=>{
    // Deduct inventory stock for drugs ordered
    if(vform.drugs&&vform.drugs.length>0){
      for(const med of medicines){
        const ordered=vform.drugs.filter(d=>d.medId===med.id);
        if(ordered.length===0) continue;
        const totalQty=ordered.reduce((s,d)=>s+Number(d.qty),0);
        await patchMedicineStock(med.id, Math.max(0,med.stock-totalQty));
      }
    }
    await saveVisit(vform);
    setSaved(true);
    setLastVisit(vform);
    alert('บันทึกข้อมูลการตรวจเรียบร้อยแล้ว\n\n💊 ระบบหักสต็อกยาจากคลังแล้ว');
  };

  const confirmAndBill=async()=>{
    const drugItems=(vform.drugs||[]).map(d=>({
      desc:d.name, qty:d.qty, unit:d.unit, price:d.price, type:'drug', medId:d.medId
    }));
    const svcItems=(vform.services||[]).map(s=>({
      desc:s.name, qty:s.qty||1, unit:s.unit||'ครั้ง', price:s.price, type:'service'
    }));
    const allItems=[...svcItems,...drugItems];
    const r={
      id:nextRID(),
      hn:pat.hn,
      visitId:vform.id,
      patname:pat.prefix+pat.fname+' '+pat.lname,
      date:today(),
      items:allItems.length>0?allItems:[{desc:'ค่าตรวจรักษา',qty:1,unit:'ครั้ง',price:300,type:'service'}],
      discount:0,
      paid:'เงินสด',
      status:'รอชำระ',
    };
    await saveReceipt(r);
    if(!saved&&vform.drugs&&vform.drugs.length>0){
      for(const med of medicines){
        const ordered=vform.drugs.filter(d=>d.medId===med.id);
        if(ordered.length===0) continue;
        await patchMedicineStock(med.id, Math.max(0,med.stock-ordered.reduce((s,d)=>s+Number(d.qty),0)));
      }
    }
    if(!saved){ await saveVisit(vform); }
    setSaved(true);
    setLastVisit(vform);
    alert(`สร้างใบเสร็จ ${r.id} เรียบร้อย\nยอดรวม: ${r.items.reduce((s,i)=>s+i.qty*i.price,0).toLocaleString()} บาท\n\nไปที่ "ใบเสร็จรับเงิน" เพื่อยืนยันการชำระ`);
  };

  const age=(dob)=>{if(!dob)return '-';return Math.floor((new Date()-new Date(dob))/(365.25*24*60*60*1000))+' ปี';};

  return (
    <div>
      <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)',marginBottom:16}}>🩺 หน้าตรวจรักษาผู้ป่วย</h2>
      <div className="card no-print" style={{marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:13,color:'var(--gray-dark)',marginBottom:8}}>
          ค้นหาผู้ป่วย <span style={{fontWeight:400,color:'var(--gray)'}}>(ชื่อ / นามสกุล / HN / เลขบัตรประชาชน)</span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="พิมพ์ชื่อ นามสกุล HN หรือเลขบัตรประชาชน" style={{maxWidth:320}} onKeyDown={e=>e.key==='Enter'&&doSearch()} />
          <button className="btn btn-primary" onClick={doSearch}>🔍 ค้นหา</button>
          {pat&&<div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <button className="btn btn-outline btn-sm" onClick={()=>setCertModal({pat,visit:lastVisit||vform})}>📄 ใบรับรองแพทย์</button>
            <button className="btn btn-outline btn-sm" onClick={()=>setAppointModal({pat,visit:lastVisit||vform})}>📅 ใบนัด</button>
            <button className="btn btn-accent btn-sm" onClick={()=>setReceiptModal({pat,visit:lastVisit||vform})}>🧾 ออกใบเสร็จ</button>
          </div>}
        </div>

        {/* Multi-result picker */}
        {searchResults.length>1&&(
          <div style={{marginTop:12,border:'1.5px solid var(--primary-light)',borderRadius:8,overflow:'hidden'}}>
            <div style={{background:'var(--primary-pale)',padding:'7px 12px',fontSize:12,fontWeight:700,color:'var(--primary)'}}>
              พบ {searchResults.length} รายการ — เลือกผู้ป่วย
            </div>
            {searchResults.map(p=>(
              <div key={p.hn} onClick={()=>loadPatient(p)}
                style={{padding:'9px 12px',cursor:'pointer',borderTop:'1px solid #eee',display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:13}}
                onMouseEnter={e=>e.currentTarget.style.background='#f5f9fc'}
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                <div>
                  <b style={{color:'var(--primary)'}}>{p.hn}</b>
                  <span style={{marginLeft:10,fontWeight:600}}>{p.prefix}{p.fname} {p.lname}</span>
                </div>
                <div style={{fontSize:11,color:'var(--gray)'}}>
                  {p.gender} / {age(p.dob)} {p.idcard?'| บัตร: '+p.idcard:''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pat&&vform&&(
        <div className="card" id="examine-printarea">
          <ClinicHeader />
          <div style={{textAlign:'center',fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:12}}>ใบบันทึกการตรวจรักษา</div>
          {/* Patient header */}
          <div style={{background:'var(--primary-pale)',borderRadius:8,padding:'10px 14px',marginBottom:14,display:'flex',flexWrap:'wrap',gap:'10px 24px',fontSize:13}}>
            <div><b>HN:</b> <span style={{color:'var(--primary)',fontWeight:700}}>{pat.hn}</span></div>
            <div><b>ชื่อ-สกุล:</b> <span style={{fontWeight:600}}>{pat.prefix}{pat.fname} {pat.lname}</span></div>
            <div><b>เพศ:</b> {pat.gender}</div>
            <div><b>อายุ:</b> {age(pat.dob)}</div>
            <div><b>วันที่:</b> {thaiDate(vform.date)}</div>
            {pat.allergy&&pat.allergy!=='-'&&<div style={{color:'var(--danger)',fontWeight:700}}>⚠️ แพ้ยา: {pat.allergy}</div>}
            {pat.chronic&&pat.chronic!=='-'&&<div style={{color:'var(--warning)',fontWeight:600}}>โรคประจำตัว: {pat.chronic}</div>}
          </div>
          <VisitRecord v={vform} setV={setVform} pat={pat} readOnly={false} medicines={medicines} treatmentServices={treatmentServices} />
          <div className="divider" />
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',flexWrap:'wrap'}}>
            <button className="btn btn-print btn-sm no-print" onClick={()=>doPrint('examine-printarea','บันทึกการตรวจ '+pat.prefix+pat.fname+' '+pat.lname)}>🖨️ พิมพ์</button>
            <button className="btn btn-gray" onClick={save}>💾 บันทึกการตรวจ</button>
            <button className="btn btn-accent" onClick={confirmAndBill}>✅ ยืนยันการตรวจและออกใบเสร็จ</button>
          </div>
          {saved&&(
            <div style={{marginTop:14,background:'var(--accent-pale)',borderRadius:8,padding:'10px 14px',display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{fontWeight:600,color:'var(--accent)'}}>✅ บันทึกเรียบร้อย — เลือกดำเนินการต่อ:</span>
              <button className="btn btn-sm btn-outline" onClick={()=>setCertModal({pat,visit:vform})}>📄 ออกใบรับรองแพทย์</button>
              <button className="btn btn-sm btn-outline" onClick={()=>setAppointModal({pat,visit:vform})}>📅 นัดหมาย</button>
              <button className="btn btn-sm btn-accent" onClick={()=>setReceiptModal({pat,visit:vform})}>🧾 ออกใบเสร็จ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== MEDICATION INSTRUCTION TEMPLATES =====================
const MED_INSTRUCTIONS = [
  // Quick-number shortcuts
  { code:'1',  short:'1×2 หลังอาหาร',     full:'รับประทาน 1 เม็ด วันละ 2 ครั้ง หลังอาหารเช้าและเย็น' },
  { code:'2',  short:'1×1 หลังอาหารเช้า', full:'รับประทาน 1 เม็ด วันละ 1 ครั้ง หลังอาหารเช้า' },
  { code:'3',  short:'1×3 หลังอาหาร',     full:'รับประทาน 1 เม็ด วันละ 3 ครั้ง หลังอาหารเช้า กลางวัน เย็น' },
  { code:'4',  short:'1×3 ก่อนนอน',       full:'รับประทาน 1 เม็ด วันละ 1 ครั้ง ก่อนนอน' },
  { code:'5',  short:'2×3 หลังอาหาร',     full:'รับประทาน 2 เม็ด วันละ 3 ครั้ง หลังอาหารเช้า กลางวัน เย็น' },
  { code:'6',  short:'1×3 ก่อนอาหาร',     full:'รับประทาน 1 เม็ด วันละ 3 ครั้ง ก่อนอาหารเช้า กลางวัน เย็น' },
  { code:'7',  short:'1×4 ทุก 6 ชม.',     full:'รับประทาน 1 เม็ด ทุก 6 ชั่วโมง เมื่อมีอาการ' },
  { code:'8',  short:'PRN ปวด/ไข้',        full:'รับประทาน 1 เม็ด เมื่อมีอาการปวดหรือมีไข้ ทุก 4-6 ชั่วโมง ไม่เกิน 4 ครั้ง/วัน' },
  // Oral other
  { code:'ac', short:'ก่อนอาหาร 30 นาที', full:'รับประทาน 1 เม็ด ก่อนอาหาร 30 นาที วันละ 2 ครั้ง' },
  { code:'pc', short:'หลังอาหารทันที',     full:'รับประทาน 1 เม็ด หลังอาหารทันที วันละ 3 ครั้ง' },
  { code:'hs', short:'ก่อนนอน',           full:'รับประทาน 1 เม็ด ก่อนนอน' },
  { code:'od', short:'วันละครั้ง',         full:'รับประทาน 1 เม็ด วันละ 1 ครั้ง' },
  { code:'bid',short:'วันละ 2 ครั้ง',      full:'รับประทาน 1 เม็ด วันละ 2 ครั้ง เช้า-เย็น' },
  { code:'tid',short:'วันละ 3 ครั้ง',      full:'รับประทาน 1 เม็ด วันละ 3 ครั้ง เช้า-กลางวัน-เย็น' },
  { code:'qid',short:'วันละ 4 ครั้ง',      full:'รับประทาน 1 เม็ด วันละ 4 ครั้ง เช้า-กลางวัน-เย็น-ก่อนนอน' },
  // Syrup
  { code:'sy1',short:'น้ำเชื่อม 1 ช้อนชา', full:'รับประทาน 1 ช้อนชา (5 มล.) วันละ 3 ครั้ง หลังอาหาร' },
  { code:'sy2',short:'น้ำเชื่อม 2 ช้อนชา', full:'รับประทาน 2 ช้อนชา (10 มล.) วันละ 3 ครั้ง หลังอาหาร' },
  // Injection
  { code:'im', short:'ฉีด IM ครั้งเดียว',  full:'ฉีดเข้ากล้ามเนื้อ (IM) ครั้งละ 1 หลอด ครั้งเดียว' },
  { code:'iv', short:'ให้ทาง IV',          full:'ให้ทางหลอดเลือดดำ (IV) ตามแผนการรักษา' },
  { code:'sc', short:'ฉีด SC',             full:'ฉีดเข้าใต้ผิวหนัง (SC) ตามแผนการรักษา' },
  { code:'im2',short:'ฉีด IM วันเว้นวัน',   full:'ฉีดเข้ากล้ามเนื้อ (IM) วันเว้นวัน' },
  // External
  { code:'cr', short:'ทาครีม/ขี้ผึ้ง',     full:'ทาบริเวณที่มีอาการ วันละ 2 ครั้ง เช้า-เย็น' },
  { code:'eye',short:'หยอดตา',             full:'หยอดตา ข้างละ 1-2 หยด วันละ 3-4 ครั้ง' },
  { code:'nh', short:'พ่นจมูก',             full:'พ่นจมูก ข้างละ 1-2 ครั้ง วันละ 2 ครั้ง เช้า-เย็น' },
];

// ===================== DRUG INSTRUCTION FIELD =====================
function InstructionField({value,onChange}) {
  const [q,setQ]=useState(value||'');
  const [open,setOpen]=useState(false);
  const ref=useRef(null);

  useEffect(()=>{ setQ(value||''); },[value]);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const matches = q.trim().length>0
    ? MED_INSTRUCTIONS.filter(t=>
        t.code.toLowerCase().startsWith(q.toLowerCase()) ||
        t.short.toLowerCase().includes(q.toLowerCase()) ||
        t.full.toLowerCase().includes(q.toLowerCase())
      ).slice(0,8)
    : MED_INSTRUCTIONS.slice(0,8);

  const pick=(tpl)=>{
    setQ(tpl.full);
    onChange(tpl.full);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{position:'relative',flex:1}}>
      <input
        value={q}
        onChange={e=>{setQ(e.target.value);onChange(e.target.value);setOpen(true);}}
        onFocus={()=>setOpen(true)}
        placeholder='พิมพ์ "1" "2" หรือ "tid" "im" หรือพิมพ์คำสั่งเอง...'
        style={{width:'100%',fontSize:12,padding:'7px 10px'}}
      />
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 2px)',left:0,right:0,background:'#fff',border:'1.5px solid #1a5276',borderRadius:6,zIndex:600,boxShadow:'0 4px 18px rgba(0,0,0,0.13)',maxHeight:220,overflowY:'auto'}}>
          {matches.map((t,i)=>(
            <div key={i} onClick={()=>pick(t)}
              style={{padding:'7px 11px',cursor:'pointer',borderBottom:'1px solid #f0f0f0',display:'flex',gap:8,alignItems:'flex-start'}}
              onMouseEnter={e=>e.currentTarget.style.background='#e8f0fc'}
              onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <div style={{background:'#1a5276',color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:10,fontWeight:700,flexShrink:0,marginTop:2}}>{t.code}</div>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:'#1a5276'}}>{t.short}</div>
                <div style={{fontSize:11,color:'#666',marginTop:1}}>{t.full}</div>
              </div>
            </div>
          ))}
          {matches.length===0&&<div style={{padding:'10px 12px',color:'#888',fontSize:12}}>ไม่พบรูปแบบคำสั่งที่ตรงกัน</div>}
        </div>
      )}
    </div>
  );
}

// ===================== DRUG AUTOCOMPLETE + CONFIRM MODAL =====================
function DrugConfirmModal({med,allergyList,onConfirm,onCancel}) {
  const [qty,setQty]=useState(10);
  const [freq,setFreq]=useState('');
  const isAllergic=allergyList&&allergyList!=='-'&&allergyList.toLowerCase().split(/[\s,;/]+/).filter(a=>a.length>2).some(a=>med.name.toLowerCase().includes(a));
  const isLow=med.stock<=med.minstock;

  const confirm=()=>{
    if(!freq.trim()){alert('กรุณาระบุวิธีใช้ยาก่อนยืนยัน');return;}
    onConfirm({name:med.name,qty,unit:med.unit,freq,price:med.price,medId:med.id,stock:med.stock});
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onCancel();}}>
      <div style={{background:'#fff',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,0.22)',width:'100%',maxWidth:520,padding:24}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:40,height:40,background:'#1e8449',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>💊</div>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:'#1a5276'}}>ยืนยันการสั่งยา</div>
            <div style={{fontSize:12,color:'#666',marginTop:1}}>กรอกรายละเอียดให้ครบก่อนเพิ่มยาในรายการ</div>
          </div>
          <button onClick={onCancel} style={{marginLeft:'auto',background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#999',lineHeight:1}}>×</button>
        </div>

        {/* Drug info */}
        <div style={{background:'#f0faf5',border:'1.5px solid #a8d5c8',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
          <div style={{fontWeight:700,fontSize:14,color:'#1a5276'}}>{med.name}</div>
          <div style={{display:'flex',gap:16,marginTop:4,fontSize:12,color:'#555',flexWrap:'wrap'}}>
            <span>หมวด: {med.category}</span>
            <span>ราคา: <b style={{color:'#1e8449'}}>{med.price}฿/{med.unit}</b></span>
            <span style={{color:isLow?'#c0392b':'#1e8449'}}>คงเหลือ: <b>{med.stock} {med.unit}</b>{isLow?' ⚠️ สต็อกต่ำ':''}</span>
          </div>
          {/* Warnings */}
          {isAllergic&&(
            <div style={{marginTop:8,background:'#fff0f0',border:'1.5px solid #e74c3c',borderRadius:6,padding:'7px 10px',fontSize:12,color:'#c0392b',fontWeight:600}}>
              ⚠️ คำเตือน: ผู้ป่วยมีประวัติแพ้ยาที่อาจเกี่ยวข้อง ({allergyList}) — กรุณาตรวจสอบก่อนสั่งยา
            </div>
          )}
          {isLow&&!isAllergic&&(
            <div style={{marginTop:8,background:'#fff8e1',border:'1px solid #f39c12',borderRadius:6,padding:'6px 10px',fontSize:11.5,color:'#d35400'}}>
              ⚠️ สต็อกยาต่ำกว่าขั้นต่ำ ({med.stock} เหลือจาก minimum {med.minstock}) — ยังสั่งได้ตามปกติ
            </div>
          )}
        </div>

        {/* Quantity */}
        <div style={{marginBottom:12}}>
          <label style={{fontWeight:700,fontSize:12,color:'#2c3e50',marginBottom:5,display:'block'}}>จำนวนที่สั่ง <span style={{color:'#c0392b'}}>*</span></label>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{width:32,height:32,border:'1.5px solid #1a5276',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,color:'#1a5276'}}>−</button>
            <input type="number" value={qty} onChange={e=>setQty(Math.max(1,Number(e.target.value)))}
              style={{width:80,textAlign:'center',fontSize:15,fontWeight:700,padding:'6px'}} />
            <button onClick={()=>setQty(q=>q+1)} style={{width:32,height:32,border:'1.5px solid #1a5276',borderRadius:6,background:'#fff',cursor:'pointer',fontSize:16,fontWeight:700,color:'#1a5276'}}>+</button>
            <span style={{fontSize:13,color:'#666'}}>{med.unit}</span>
            {/* Quick qty */}
            {[7,10,14,20,28,30].map(n=>(
              <button key={n} onClick={()=>setQty(n)}
                style={{padding:'4px 8px',border:`1.5px solid ${qty===n?'#1a5276':'#ddd'}`,borderRadius:5,background:qty===n?'#1a5276':'#fff',color:qty===n?'#fff':'#555',cursor:'pointer',fontSize:11,fontWeight:600}}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Instruction — mandatory */}
        <div style={{marginBottom:16}}>
          <label style={{fontWeight:700,fontSize:12,color:'#2c3e50',marginBottom:5,display:'block'}}>
            วิธีใช้ยา <span style={{color:'#c0392b'}}>*</span>
            <span style={{fontWeight:400,color:'#888',marginLeft:6,fontSize:11}}>พิมพ์ตัวเลข (1-8) หรือรหัส เช่น "tid", "im" เพื่อเลือกรูปแบบสำเร็จ</span>
          </label>
          <InstructionField value={freq} onChange={setFreq} />
          {!freq.trim()&&<div style={{fontSize:11,color:'#e74c3c',marginTop:3}}>⚠️ จำเป็นต้องระบุวิธีใช้ก่อนยืนยัน</div>}
        </div>

        {/* Preview */}
        {freq.trim()&&(
          <div style={{background:'#f8fff8',border:'1.5px solid #2ecc71',borderRadius:7,padding:'8px 12px',marginBottom:14,fontSize:12}}>
            <div style={{fontWeight:700,color:'#1e8449',marginBottom:3}}>📋 ตัวอย่างฉลากยา</div>
            <div><b>{med.name}</b> — จำนวน {qty} {med.unit}</div>
            <div style={{color:'#1a5276',marginTop:2}}>{freq}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} className="btn btn-gray btn-sm">ยกเลิก</button>
          <button onClick={confirm}
            style={{padding:'8px 22px',background:freq.trim()?'#1e8449':'#aaa',color:'#fff',border:'none',borderRadius:6,cursor:freq.trim()?'pointer':'not-allowed',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
            ✅ เพิ่มยาในรายการสั่ง
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== DRUG SEARCH + AUTOCOMPLETE =====================
function DrugAutocomplete({medicines,onAdd,allergyList}) {
  const [q,setQ]=useState('');
  const [open,setOpen]=useState(false);
  const [pending,setPending]=useState(null); // med waiting for instruction confirm
  const ref=useRef(null);

  const isAllergic=(name)=>{
    if(!allergyList||allergyList==='-') return false;
    return allergyList.toLowerCase().split(/[\s,;/]+/).filter(a=>a.length>2).some(a=>name.toLowerCase().includes(a));
  };

  const matches = q.trim().length>0
    ? medicines.filter(m=>m.name.toLowerCase().includes(q.toLowerCase())).slice(0,12)
    : [];

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const selectMed=(med)=>{
    setOpen(false);
    setQ('');
    setPending(med); // open confirm modal
  };

  const confirmAdd=(drug)=>{
    onAdd(drug);
    setPending(null);
  };

  return (
    <>
      <div ref={ref} style={{background:'#f0faf8',border:'1.5px solid #a8d5c8',borderRadius:8,padding:'10px 12px',marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:12,color:'#1e8449',marginBottom:8}}>
          💊 เพิ่มยาจากคลังยา
          <span style={{fontWeight:400,color:'#888',marginLeft:8,fontSize:11}}>เลือกยา → ระบุวิธีใช้ → ยืนยัน</span>
        </div>
        <div style={{position:'relative'}}>
          <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>setOpen(true)}
            placeholder="🔍 พิมพ์ชื่อยา: amoxy, augm, para, omep, lorat..."
            style={{fontSize:13,width:'100%',paddingRight:32}} />
          {q&&<button onClick={()=>{setQ('');setOpen(false);}} style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#999',fontSize:16,lineHeight:1}}>×</button>}
          {open&&matches.length>0&&(
            <div className="drug-dropdown">
              {matches.map(m=>{
                const isLow=m.stock<=m.minstock;
                const allergic=isAllergic(m.name);
                return (
                  <div key={m.id}
                    className={`drug-item${allergic?' drug-allergy-row':''}`}
                    onClick={()=>selectMed(m)}>
                    <div style={{flex:1}}>
                      {allergic&&<span style={{color:'#c0392b',fontWeight:700,marginRight:4}}>⚠️</span>}
                      <b style={{fontSize:13}}>{m.name}</b>
                      <span style={{fontSize:11,color:'#888',marginLeft:6}}>{m.category}</span>
                    </div>
                    <div style={{fontSize:11,textAlign:'right',whiteSpace:'nowrap',display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{color:'#1e8449',fontWeight:600}}>{m.price}฿/{m.unit}</span>
                      <span style={{background:isLow?'#ffeaea':'#e8f8f0',color:isLow?'#c0392b':'#1e8449',borderRadius:4,padding:'1px 6px',fontWeight:600}}>
                        {isLow?'⚠️ ':''}คงเหลือ {m.stock}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {open&&q.trim().length>0&&matches.length===0&&(
            <div className="drug-dropdown">
              <div style={{padding:'10px 12px',color:'#888',fontSize:12}}>ไม่พบยาในคลัง "{q}"</div>
            </div>
          )}
        </div>
      </div>

      {pending&&(
        <DrugConfirmModal
          med={pending}
          allergyList={allergyList}
          onConfirm={confirmAdd}
          onCancel={()=>setPending(null)}
        />
      )}
    </>
  );
}

// ===================== MED LABEL PRINT =====================
function printMedLabel(drug,pat,visitDate) {
  const win=window.open('','_blank','width=400,height=320');
  win.document.write(`<!DOCTYPE html><html><head><title>ฉลากยา</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Sarabun',sans-serif;font-size:12px;padding:6px;}
    .label{border:2px solid #1a5276;border-radius:6px;padding:8px 10px;width:100%;max-width:340px;}
    .header{border-bottom:1.5px solid #1a5276;padding-bottom:5px;margin-bottom:6px;text-align:center;}
    .clinic{font-size:11px;font-weight:700;color:#1a5276;}
    .addr{font-size:9px;color:#555;}
    .drug{font-size:13px;font-weight:700;color:#1a5276;margin:5px 0 2px;}
    .freq{font-size:12px;color:#1a5276;font-weight:600;background:#e8f5ff;border-radius:4px;padding:3px 7px;margin:4px 0;}
    .row{display:flex;justify-content:space-between;font-size:11px;margin:2px 0;}
    .footer{border-top:1px dashed #aaa;margin-top:6px;padding-top:5px;font-size:10px;color:#555;}
    @media print{body{padding:0;}button{display:none!important;}}
  </style></head><body>
  <div class="label">
    <div class="header">
      <div class="clinic">${CLINIC_NAME}</div>
      <div class="addr">${CLINIC_ADDRESS} โทร.${CLINIC_TEL}</div>
    </div>
    <div class="drug">💊 ${drug.name}</div>
    <div class="row"><span>จำนวน:</span><span><b>${drug.qty} ${drug.unit}</b></span></div>
    <div class="freq">📋 ${drug.freq||'-'}</div>
    <div style="height:4px;"></div>
    <div class="row"><span>ผู้ป่วย:</span><span><b>${pat?pat.prefix+pat.fname+' '+pat.lname:'—'}</b></span></div>
    <div class="row"><span>HN:</span><span>${pat?.hn||'—'}</span></div>
    <div class="row"><span>วันที่จ่ายยา:</span><span>${thaiDate(visitDate||today())}</span></div>
    <div class="footer">
      <div>แพทย์ผู้สั่ง: ${DOCTOR_NAME} (${DOCTOR_LICENSE})</div>
      <div style="margin-top:2px;color:#c0392b;font-size:9px;">⚠️ โปรดอ่านวิธีใช้ให้ครบถ้วน หากมีอาการผิดปกติหยุดใช้และปรึกษาแพทย์</div>
    </div>
  </div>
  <div style="text-align:center;margin-top:8px;">
    <button onclick="window.print()" style="padding:6px 18px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-family:'Sarabun',sans-serif;">🖨️ พิมพ์ฉลากยา</button>
  </div>
  </body></html>`);
  win.document.close();
}

// ===================== TREATMENT ORDER BOX =====================
function TreatmentOrderBox({services,onServicesChange,treatmentServices,readOnly}) {
  const [search,setSearch]=useState('');
  const [showDropdown,setShowDropdown]=useState(false);
  const ref=useRef(null);

  const svcCats=[...new Set((treatmentServices||[]).filter(s=>s.active).map(s=>s.category))];
  const filtered=(treatmentServices||[]).filter(s=>s.active&&(
    !search||s.name.toLowerCase().includes(search.toLowerCase())||s.category.toLowerCase().includes(search.toLowerCase())
  ));

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setShowDropdown(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);

  const addService=(svc)=>{
    const existing=services.find(s=>s.serviceId===svc.id);
    if(existing){
      onServicesChange(services.map(s=>s.serviceId===svc.id?{...s,qty:(s.qty||1)+1}:s));
    } else {
      onServicesChange([...services,{serviceId:svc.id,name:svc.name,qty:1,unit:svc.unit,price:svc.price,category:svc.category}]);
    }
    setSearch('');setShowDropdown(false);
  };
  const rmService=(i)=>onServicesChange(services.filter((_,idx)=>idx!==i));
  const updService=(i,k,v)=>onServicesChange(services.map((s,idx)=>idx===i?{...s,[k]:k==='qty'||k==='price'?Number(v):v}:s));

  const total=services.reduce((s,i)=>s+(i.qty||1)*i.price,0);

  return (
    <div style={{background:'linear-gradient(135deg,#e8f8f0,#f0fff8)',border:'2px solid #1e8449',borderRadius:10,padding:'12px 14px',marginBottom:10}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,background:'#1e8449',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>🏥</div>
          <div>
            <div style={{fontWeight:700,fontSize:13,color:'#1e8449'}}>รายการหัตถการ / ค่าบริการ</div>
            <div style={{fontSize:11,color:'#555'}}>ค่าตรวจ ค่าหัตถการ ค่าบริการต่างๆ (ไม่หักสต็อกยา)</div>
          </div>
        </div>
        {!readOnly&&total>0&&<div style={{fontSize:13,fontWeight:700,color:'#1e8449'}}>รวม: {total.toLocaleString()}฿</div>}
      </div>

      {/* Search & add — edit mode */}
      {!readOnly&&(
        <div ref={ref} style={{position:'relative',marginBottom:services.length>0?10:0}}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setShowDropdown(true);}}
            onFocus={()=>setShowDropdown(true)}
            placeholder="🔍 ค้นหารายการ: ค่าตรวจ ฉีดยา พันแผล EKG ..."
            style={{width:'100%',fontSize:13,borderColor:'#1e8449'}} />
          {showDropdown&&(
            <div style={{position:'absolute',top:'calc(100%+2px)',left:0,right:0,background:'#fff',border:'1.5px solid #1e8449',borderRadius:6,zIndex:500,boxShadow:'0 4px 18px rgba(0,0,0,0.12)',maxHeight:260,overflowY:'auto'}}>
              {svcCats.map(cat=>{
                const catItems=filtered.filter(s=>s.category===cat);
                if(catItems.length===0) return null;
                return (
                  <div key={cat}>
                    <div style={{padding:'5px 12px',fontSize:11,fontWeight:700,color:'#1a5276',background:'#eef6ff',letterSpacing:0.5}}>{cat}</div>
                    {catItems.map(svc=>(
                      <div key={svc.id} onClick={()=>addService(svc)}
                        style={{padding:'8px 14px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #f0f5f0',fontSize:13}}
                        onMouseEnter={e=>e.currentTarget.style.background='#e8f8f0'}
                        onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                        <span>{svc.name}</span>
                        <span style={{color:'#1e8449',fontWeight:700,fontSize:12}}>{svc.price>0?svc.price.toLocaleString()+'฿/'+svc.unit:'กำหนดเอง'}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {filtered.length===0&&<div style={{padding:'12px',color:'#888',fontSize:12,textAlign:'center'}}>ไม่พบรายการที่ค้นหา</div>}
            </div>
          )}
        </div>
      )}

      {/* Service list */}
      {services.length>0&&(
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{background:'#1e8449',color:'#fff'}}>
              <th style={{padding:'5px 8px',textAlign:'left'}}>รายการ</th>
              <th style={{padding:'5px 8px',textAlign:'left',width:80}}>หมวด</th>
              <th style={{padding:'5px 8px',textAlign:'center',width:50}}>จำนวน</th>
              <th style={{padding:'5px 8px',textAlign:'right',width:80}}>ราคา</th>
              <th style={{padding:'5px 8px',textAlign:'right',width:70}}>รวม</th>
              {!readOnly&&<th style={{width:26}}></th>}
            </tr>
          </thead>
          <tbody>
            {services.map((s,i)=>(
              <tr key={i} style={{background:i%2===0?'#fff':'#f0faf5'}}>
                <td style={{padding:'5px 8px',fontWeight:600,color:'#1a5276'}}>{s.name}</td>
                <td style={{padding:'5px 8px'}}><span className="tag tag-green" style={{fontSize:10}}>{s.category}</span></td>
                <td style={{padding:'5px 8px',textAlign:'center'}}>
                  {readOnly?<b>{s.qty||1}</b>
                    :<input type="number" value={s.qty||1} onChange={e=>updService(i,'qty',e.target.value)}
                      style={{width:44,textAlign:'center',fontSize:11,padding:'2px 3px'}} />}
                </td>
                <td style={{padding:'5px 8px',textAlign:'right'}}>
                  {readOnly?s.price.toLocaleString()
                    :<input type="number" value={s.price} onChange={e=>updService(i,'price',e.target.value)}
                      style={{width:70,textAlign:'right',fontSize:11,padding:'2px 4px'}} />}
                  ฿
                </td>
                <td style={{padding:'5px 8px',textAlign:'right',fontWeight:700,color:'#1e8449'}}>{((s.qty||1)*s.price).toLocaleString()}฿</td>
                {!readOnly&&<td style={{padding:'3px'}}>
                  <button onClick={()=>rmService(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:13}}>✕</button>
                </td>}
              </tr>
            ))}
            <tr style={{background:'#d5f5e3',fontWeight:700}}>
              <td colSpan={readOnly?3:3} style={{padding:'5px 8px',textAlign:'right',fontSize:12}}>รวมค่าหัตถการ</td>
              <td colSpan={readOnly?2:2} style={{padding:'5px 8px',textAlign:'right',fontSize:13,color:'#1e8449'}}>{total.toLocaleString()}฿</td>
              {!readOnly&&<td></td>}
            </tr>
          </tbody>
        </table>
      )}
      {services.length===0&&readOnly&&<div style={{fontSize:12,color:'#888',padding:'4px 0'}}>ไม่มีรายการหัตถการ</div>}
    </div>
  );
}

// ===================== VISIT RECORD =====================
function VisitRecord({v,setV,pat,readOnly,medicines,treatmentServices}) {
  const f=(k,val)=>setV&&setV(prev=>({...prev,[k]:val}));
  const drugs=v.drugs||[];
  const services=v.services||[];

  const addDrug=(d)=>f('drugs',[...drugs,{...d}]);
  const rmDrug=(i)=>f('drugs',drugs.filter((_,idx)=>idx!==i));
  const updDrug=(i,k,val)=>f('drugs',drugs.map((d,idx)=>idx===i?{...d,[k]:val}:d));

  return (
    <div>
      {/* Vital Signs */}
      <div style={{background:'var(--gray-pale)',borderRadius:8,padding:'10px 14px',marginBottom:12}}>
        <div style={{fontWeight:700,fontSize:12,color:'var(--primary)',marginBottom:8}}>🔴 สัญญาณชีพ (Vital Signs)</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
          {[['BP (mmHg)','bp'],['PR (bpm)','pr'],['RR (/min)','rr'],['Temp (°C)','temp'],['O₂ Sat (%)','o2'],['น้ำหนัก (kg)','weight'],['ส่วนสูง (cm)','height']].map(([l,k])=>(
            <div key={k}>
              <label style={{fontSize:11}}>{l}</label>
              {readOnly?<div style={{fontWeight:600,fontSize:14}}>{v[k]||'-'}</div>:<input value={v[k]||''} onChange={e=>f(k,e.target.value)} style={{padding:'5px 8px'}} />}
            </div>
          ))}
          <div>
            <label style={{fontSize:11}}>บันทึกโดย</label>
            {readOnly?<div style={{fontWeight:600,fontSize:13}}>{v.nurse||'-'}</div>:<input value={v.nurse||''} onChange={e=>f('nurse',e.target.value)} style={{padding:'5px 8px'}} />}
          </div>
        </div>
      </div>

      {/* Clinical note */}
      <div style={{background:'#fff',borderRadius:8,border:'1.5px solid var(--gray-light)',padding:'12px 14px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 14px'}}>
          <div>
            <label style={{fontWeight:700,color:'var(--gray-dark)'}}>CC. (อาการที่นำมาคลินิก)</label>
            {readOnly?<div style={{fontSize:13,padding:'4px 0'}}>{v.cc||'-'}</div>:<input value={v.cc||''} onChange={e=>f('cc',e.target.value)} placeholder="เช่น ไข้ ปวดศีรษะ 2 วัน" />}
          </div>
          <div>
            <label style={{fontWeight:700,color:'var(--gray-dark)'}}>DX. (การวินิจฉัย)</label>
            {readOnly?<div style={{fontSize:13,padding:'4px 0'}}>{v.dx||'-'}</div>:<input value={v.dx||''} onChange={e=>f('dx',e.target.value)} placeholder="เช่น URI (J069), Gastritis (K29.7)" />}
          </div>
        </div>
        <div className="divider" />
        <div>
          <label style={{fontWeight:700,color:'var(--gray-dark)'}}>PI. (ประวัติการเจ็บป่วยปัจจุบัน)</label>
          {readOnly?<div style={{fontSize:13,padding:'4px 0',whiteSpace:'pre-wrap'}}>{v.pi||'-'}</div>:<textarea value={v.pi||''} onChange={e=>f('pi',e.target.value)} rows={3} placeholder="Onset, ระยะเวลา, อาการร่วม, ปัจจัยที่ทำให้ดีขึ้น/แย่ลง ฯลฯ" style={{resize:'vertical'}} />}
        </div>
        <div className="divider" />
        <div>
          <label style={{fontWeight:700,color:'var(--gray-dark)'}}>PE. (ตรวจร่างกาย)</label>
          {readOnly?<div style={{fontSize:13,padding:'4px 0',whiteSpace:'pre-wrap'}}>{v.pe||'-'}</div>:<textarea value={v.pe||''} onChange={e=>f('pe',e.target.value)} rows={4} placeholder={"General appearance:\nHEENT:\nLung:\nHeart:\nAbdomen:\nExtremities:"} style={{resize:'vertical'}} />}
        </div>
        <div className="divider" />

        {/* TX Section */}
        <div>
          <label style={{fontWeight:700,color:'var(--gray-dark)'}}>TX. (การรักษา / คำสั่งการรักษา)</label>

          {/* Drug search — edit mode only */}
          {!readOnly&&medicines&&(
            <DrugAutocomplete medicines={medicines} onAdd={addDrug} allergyList={pat?.allergy} />
          )}

          {/* Ordered drugs table */}
          {drugs.length>0&&(
            <div style={{background:'#f4fbf7',border:'1.5px solid #aeddc8',borderRadius:7,padding:'8px 10px',marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:12,color:'#1e8449',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>💊 รายการยาที่สั่ง ({drugs.length} รายการ)</span>
                {!readOnly&&<span style={{fontWeight:400,fontSize:11,color:'#888'}}>สามารถแก้ไขจำนวน/วิธีใช้ได้ในตาราง</span>}
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr style={{background:'#1e8449',color:'#fff'}}>
                    <th style={{padding:'6px 8px',textAlign:'left'}}>ชื่อยา</th>
                    <th style={{padding:'6px 8px',textAlign:'center',width:60}}>จำนวน</th>
                    <th style={{padding:'6px 8px',textAlign:'left',width:50}}>หน่วย</th>
                    <th style={{padding:'6px 8px',textAlign:'left',minWidth:200}}>วิธีใช้</th>
                    <th style={{padding:'6px 8px',textAlign:'right',width:75}}>ราคา/หน่วย</th>
                    <th style={{padding:'6px 8px',textAlign:'right',width:70}}>รวม</th>
                    <th style={{padding:'6px 4px',width:readOnly?90:60}} className="no-print">{readOnly?'ฉลากยา':''}</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((d,i)=>(
                    <tr key={i} style={{background:i%2===0?'#fff':'#f0faf5',verticalAlign:'top'}}>
                      <td style={{padding:'7px 8px',fontWeight:700,color:'#1a5276'}}>
                        {d.name}
                        {d.stock<=d.minstock&&<div style={{fontSize:9.5,color:'#e67e22',fontWeight:400}}>⚠️ สต็อกต่ำ</div>}
                      </td>
                      <td style={{padding:'6px 8px',textAlign:'center'}}>
                        {readOnly?<b>{d.qty}</b>:<input type="number" value={d.qty} onChange={e=>updDrug(i,'qty',Math.max(1,Number(e.target.value)))} style={{width:50,textAlign:'center',fontSize:12,padding:'3px 4px'}} />}
                      </td>
                      <td style={{padding:'7px 8px',color:'#555'}}>{d.unit}</td>
                      <td style={{padding:'6px 8px'}}>
                        {readOnly
                          ?<div style={{fontSize:12,color:'#1a5276',fontWeight:600,lineHeight:1.5}}>{d.freq||'-'}</div>
                          :<InstructionField value={d.freq||''} onChange={val=>updDrug(i,'freq',val)} />
                        }
                      </td>
                      <td style={{padding:'7px 8px',textAlign:'right',color:'#1e8449'}}>{d.price}฿</td>
                      <td style={{padding:'7px 8px',textAlign:'right',fontWeight:700}}>{(d.qty*d.price).toLocaleString()}฿</td>
                      <td style={{padding:'6px 4px',textAlign:'center'}} className="no-print">
                        {readOnly
                          ?<button onClick={()=>printMedLabel(d,pat,v.date)}
                              style={{padding:'4px 7px',background:'#6c3483',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:10.5,fontWeight:700,whiteSpace:'nowrap',fontFamily:'inherit'}}>
                              🏷️ ฉลากยา
                            </button>
                          :<div style={{display:'flex',flexDirection:'column',gap:3}}>
                              <button onClick={()=>printMedLabel(d,pat,v.date)}
                                style={{padding:'3px 6px',background:'#6c3483',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:10,fontFamily:'inherit',whiteSpace:'nowrap'}}>
                                🏷️ ฉลากยา
                              </button>
                              <button onClick={()=>rmDrug(i)} style={{padding:'3px 6px',background:'#e74c3c',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',fontSize:10,fontFamily:'inherit'}}>✕ ลบ</button>
                            </div>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:'#e8f8f0',fontWeight:700}}>
                    <td colSpan={5} style={{padding:'6px 8px',textAlign:'right',fontSize:12}}>รวมค่ายาทั้งหมด</td>
                    <td style={{padding:'6px 8px',textAlign:'right',fontSize:14,color:'#1e8449'}}>{drugs.reduce((s,d)=>s+d.qty*d.price,0).toLocaleString()}฿</td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* ── TREATMENT ORDER BOX (green) ── */}
          <TreatmentOrderBox
            services={services}
            onServicesChange={val=>f('services',val)}
            treatmentServices={treatmentServices}
            readOnly={readOnly}
          />

          {/* Free-text TX notes */}
          <label style={{fontSize:11.5,color:'var(--gray)',marginBottom:3,display:'block'}}>คำสั่งรักษาเพิ่มเติม / คำแนะนำ</label>
          {readOnly
            ?<div style={{fontSize:13,padding:'4px 0',whiteSpace:'pre-wrap'}}>{v.tx||'-'}</div>
            :<textarea value={v.tx||''} onChange={e=>f('tx',e.target.value)} rows={3} placeholder="คำแนะนำ, follow-up, อื่นๆ" style={{resize:'vertical'}} />
          }
        </div>

        {!readOnly&&<div className="divider" />}
        <div>
          <label style={{fontWeight:700,color:'var(--gray-dark)'}}>Note (บันทึกเพิ่มเติม)</label>
          {readOnly?<div style={{fontSize:13,padding:'4px 0'}}>{v.note||'-'}</div>:<textarea value={v.note||''} onChange={e=>f('note',e.target.value)} rows={2} placeholder="หมายเหตุอื่นๆ" style={{resize:'vertical'}} />}
        </div>
      </div>
    </div>
  );
}

// ===================== CERT PAGE =====================
const CERT_DISEASES_5 = [
  {key:'d1', label:'(1) วัณโรคในระยะแพร่กระจายเชื้อ'},
  {key:'d2', label:'(2) โรคเท้าช้างในระยะที่ปรากฏอาการเป็นที่รังเกียจแก่สังคม'},
  {key:'d3', label:'(3) โรคติดสารเสพติดให้โทษ'},
  {key:'d4', label:'(4) โรคพิษสุราเรื้อรัง'},
  {key:'d5', label:'(5) โรคติดต่อร้ายแรงหรือโรคเรื้อรังที่ปรากฏอาการเด่นชัดหรือรุนแรงและเป็นอุปสรรคต่อการปฏิบัติงานในหน้าที่ตามที่ ก.พ. กำหนด'},
];

function CertPage({patients,visits,getPatient}) {
  const [type,setType]=useState('sick');
  const [hn,setHn]=useState('');
  const [pat,setPat]=useState(null);
  const [certNo,setCertNo]=useState('');
  const [examDate,setExamDate]=useState(today());
  const [certDate,setCertDate]=useState(today());
  // Sick cert fields
  const [diagText,setDiagText]=useState('');
  const [restDays,setRestDays]=useState('');
  const [fromDate,setFromDate]=useState(today());
  const [toDate,setToDate]=useState('');
  const [doctorNote,setDoctorNote]=useState('');
  // 5-disease fields — per disease: 'none'|'found'
  const [d5results,setD5results]=useState({d1:'none',d2:'none',d3:'none',d4:'none',d5:'none'});
  const [d5notes,setD5notes]=useState({d1:'',d2:'',d3:'',d4:'',d5:''});
  const [d6note,setD6note]=useState('');
  const [conclusion,setConclusion]=useState('');
  // Driving cert fields — Part 1 (patient self-declaration) + Part 2 (doctor exam)
  const [drvBookNo,setDrvBookNo]=useState('');
  const [drvCertNo,setDrvCertNo]=useState('');
  const [drvAddr,setDrvAddr]=useState('');
  const [drvWeight,setDrvWeight]=useState('');
  const [drvHeight,setDrvHeight]=useState('');
  const [drvBP,setDrvBP]=useState('');
  const [drvPR,setDrvPR]=useState('');
  const [drvExamDate,setDrvExamDate]=useState(today());
  // Patient history checkboxes
  const [drvHist,setDrvHist]=useState({
    chronic:{has:false,detail:''},
    accident:{has:false,detail:''},
    hospital:{has:false,detail:''},
    epilepsy:{has:false,detail:''},
    other:{has:false,detail:''},
  });
  const updDrvHist=(k,f,v)=>setDrvHist(prev=>({...prev,[k]:{...prev[k],[f]:v}}));
  // Doctor exam
  const [drvBodyResult,setDrvBodyResult]=useState('normal'); // 'normal'|'abnormal'
  const [drvBodyNote,setDrvBodyNote]=useState('');
  const [drvFitResult,setDrvFitResult]=useState('fit'); // 'fit'|'notfit'
  const [drvFitReason,setDrvFitReason]=useState('');
  // Prohibited disease check rows for driving (Part 2)
  const [drvDiseases,setDrvDiseases]=useState([
    {key:'d1',label:'1. โรคเรือนในระยะติดต่อ หรือในระยะที่ปรากฏอาการเป็นที่รังเกียจแก่สังคม',found:false,note:''},
    {key:'d2',label:'2. วัณโรคในระยะอันตราย',found:false,note:''},
    {key:'d3',label:'3. โรคเท้าช้างในระยะที่ปรากฏอาการเป็นที่รังเกียจแก่สังคม',found:false,note:''},
    {key:'d4',label:'4. อื่น ๆ (ถ้ามี)',found:false,note:''},
  ]);
  const updDrvDisease=(i,f,v)=>setDrvDiseases(prev=>prev.map((d,idx)=>idx===i?{...d,[f]:v}:d));
  const [drvConclusion,setDrvConclusion]=useState('');

  const searchPat=()=>{const p=getPatient(hn.trim());if(!p){alert('ไม่พบผู้ป่วย');return;}setPat(p);setDrvAddr(p.address||'');};
  const calcAge=(dob)=>{if(!dob)return '—';return Math.floor((new Date()-new Date(dob+'T00:00:00'))/(365.25*24*60*60*1000))+' ปี';};

  const certTypes=[
    {k:'sick',l:'ใบรับรองแพทย์ (อาการเจ็บป่วย)'},
    {k:'group5',l:'ใบรับรองแพทย์ 5 กลุ่มโรค'},
    {k:'driving',l:'ใบรับรองแพทย์ (ใบขับขี่)'},
  ];

  // ── Dot-line helper for print
  const DotLine=({w='100%',style={}})=><span style={{display:'inline-block',borderBottom:'1px dotted #555',minWidth:w,...style,verticalAlign:'bottom'}}>&nbsp;</span>;
  const FieldLine=({label,value,onChange,width='100%',inline=false,type='text'})=>(
    inline
    ? <span style={{fontSize:13}}>{label}<input value={value} onChange={e=>onChange(e.target.value)} type={type} style={{display:'inline-block',width,borderBottom:'1px dotted #555',border:'none',borderBottom:'1px dotted #888',outline:'none',fontSize:13,padding:'0 4px',background:'transparent'}} /></span>
    : <div style={{fontSize:13,marginBottom:4}}>{label}<input value={value} onChange={e=>onChange(e.target.value)} type={type} style={{width,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,padding:'0 4px',background:'transparent',display:'inline-block'}} /></div>
  );

  return (
    <div>
      {/* Controls — no-print */}
      <div className="no-print">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>📄 ใบรับรองแพทย์</h2>
          {pat&&<button className="btn btn-print btn-sm" style={{marginLeft:'auto'}} onClick={()=>doPrint('cert-doc-area',`ใบรับรองแพทย์ — ${pat.prefix}${pat.fname} ${pat.lname}`)}>🖨️ พิมพ์ใบรับรอง A4</button>}
        </div>
        <div className="card" style={{marginBottom:14}}>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
            <span style={{fontWeight:600,fontSize:13}}>ประเภท:</span>
            {certTypes.map(t=><button key={t.k} className={`btn btn-sm ${type===t.k?'btn-primary':'btn-outline'}`} onClick={()=>setType(t.k)}>{t.l}</button>)}
          </div>
          <div className="divider" />
          <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <input value={hn} onChange={e=>setHn(e.target.value)} placeholder="กรอก HN ผู้ป่วย" style={{maxWidth:200}} onKeyDown={e=>e.key==='Enter'&&searchPat()} />
            <button className="btn btn-primary btn-sm" onClick={searchPat}>🔍 ดึงข้อมูลผู้ป่วย</button>
            {pat&&<span style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>✅ {pat.prefix}{pat.fname} {pat.lname} (HN: {pat.hn})</span>}
          </div>
        </div>
      </div>

      {/* ── PRINTABLE CERT AREA ── */}
      <div id="cert-doc-area" className="card" style={{maxWidth:720,margin:'0 auto',padding:'28px 36px',fontFamily:"'Sarabun',sans-serif",fontSize:14,lineHeight:1.9,background:'#fff'}}>

        {/* Header */}
        <div style={{textAlign:'center',borderBottom:'2.5px solid #1a5276',paddingBottom:12,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#1a5276',letterSpacing:0.5}}>{CLINIC_NAME}</div>
          <div style={{fontSize:11,color:'#555'}}>{CLINIC_ADDRESS}</div>
          <div style={{fontSize:11,color:'#555'}}>โทรศัพท์ {CLINIC_TEL} &nbsp;|&nbsp; ใบอนุญาตประกอบกิจการ เลขที่ {DOCTOR_LICENSE}</div>
        </div>

        {/* Title */}
        <div style={{textAlign:'center',fontWeight:700,fontSize:17,letterSpacing:2,marginBottom:18}}>
          {type==='sick'&&'ใบรับรองแพทย์'}
          {type==='group5'&&'ใบรับรองแพทย์'}
          {type==='driving'&&'ใบรับรองแพทย์ (สำหรับใบอนุญาตขับรถ)'}
        </div>

        {/* Top right — station / date — only for sick/group5 */}
        {type!=='driving'&&(
        <div style={{textAlign:'right',fontSize:13,marginBottom:10}}>
          <span>สถานที่ตรวจ </span>
          <input value={CLINIC_NAME} readOnly style={{width:240,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',textAlign:'left'}} />
          <br/>
          <span>เลขที่ </span>
          <input value={certNo} onChange={e=>setCertNo(e.target.value)} placeholder="—" style={{width:80,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',textAlign:'center'}} />
          <span style={{marginLeft:12}}>วันที่ </span>
          <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)} style={{width:150,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px'}} />
        </div>
        )}

        {/* Doctor block — only for sick/group5 */}
        {type!=='driving'&&(
        <div>
        <div style={{fontSize:13,marginBottom:6}}>
          ข้าพเจ้า นายแพทย์/แพทย์หญิง <span style={{fontWeight:700}}>{DOCTOR_NAME}</span>
        </div>
        <div style={{fontSize:13,marginBottom:4}}>
          ใบอนุญาตประกอบวิชาชีพเวชกรรม เลขที่ <span style={{fontWeight:700}}>{DOCTOR_LICENSE}</span>
        </div>
        <div style={{fontSize:13,marginBottom:4}}>
          สถานที่ประกอบวิชาชีพเวชกรรม / สถานที่ปฏิบัติงานประจำ หรืออยู่ที่
          <input value={CLINIC_NAME+' '+CLINIC_ADDRESS} readOnly style={{width:'100%',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',display:'block',marginTop:2}} />
        </div>
        <div style={{borderTop:'1px dashed #ccc',margin:'10px 0'}} />

        {/* Patient block */}
        <div style={{fontSize:13,marginBottom:4}}>
          ได้ตรวจร่างกาย นาย/นาง/นางสาว
          <input value={pat?pat.prefix+pat.fname+' '+pat.lname:''} onChange={()=>{}} placeholder="ชื่อ-นามสกุลผู้รับการตรวจ"
            style={{width:'calc(100% - 220px)',marginLeft:8,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',display:'inline-block'}} />
        </div>
        {/* ID box */}
        <div style={{fontSize:13,marginBottom:4,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <span>เลขประจำตัวประชาชน</span>
          <div style={{display:'flex',gap:2}}>
            {(pat?.idcard||'             ').replace(/-/g,'').split('').slice(0,13).map((c,i)=>(
              <div key={i} style={{width:22,height:24,border:'1px solid #555',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,background:'#f8f8f8'}}>{c||''}</div>
            ))}
            {[...Array(Math.max(0,13-(pat?.idcard?.replace(/-/g,'')||'').length))].map((_,i)=>(
              <div key={'e'+i} style={{width:22,height:24,border:'1px solid #555',background:'#f8f8f8'}} />
            ))}
          </div>
        </div>
        <div style={{fontSize:13,marginBottom:4}}>
          สถานที่อยู่ที่สามารถติดต่อได้
          <input value={pat?.address||''} onChange={()=>{}} placeholder="ที่อยู่"
            style={{width:'calc(100% - 200px)',marginLeft:8,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',display:'inline-block'}} />
        </div>
        <div style={{fontSize:13,marginBottom:2,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span>แล้ว เมื่อวันที่</span>
          <input type="date" value={examDate} onChange={e=>setExamDate(e.target.value)} style={{width:160,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px'}} />
          <span>ขอรับรองว่า</span>
        </div>
        <div style={{borderTop:'1px dashed #ccc',margin:'10px 0'}} />
        </div>
        )}

        {/* ── TYPE-SPECIFIC CONTENT ── */}

        {type==='sick'&&(
          <div style={{fontSize:13}}>
            <div style={{fontWeight:600,marginBottom:6}}>ผู้ป่วยมีอาการเจ็บป่วย / การวินิจฉัยโรค:</div>
            <textarea value={diagText} onChange={e=>setDiagText(e.target.value)} rows={3}
              style={{width:'100%',resize:'vertical',border:'1px solid #ccc',borderRadius:4,padding:'6px 8px',fontSize:13,fontFamily:'inherit'}}
              placeholder="อาการ / การวินิจฉัย / ICD-10 code" />
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
              <span>จำเป็นต้องพักรักษาตัว</span>
              <input value={restDays} onChange={e=>setRestDays(e.target.value)} style={{width:50,textAlign:'center',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent'}} placeholder="0" />
              <span>วัน ตั้งแต่วันที่</span>
              <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:155,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent'}} />
              <span>ถึงวันที่</span>
              <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:155,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent'}} />
            </div>
            <div style={{marginTop:10,fontWeight:600}}>ความเห็นและข้อแนะนำของแพทย์:</div>
            <textarea value={doctorNote} onChange={e=>setDoctorNote(e.target.value)} rows={3}
              style={{width:'100%',resize:'vertical',border:'1px solid #ccc',borderRadius:4,padding:'6px 8px',fontSize:13,fontFamily:'inherit'}}
              placeholder="ความเห็น / คำแนะนำ" />
          </div>
        )}

        {type==='group5'&&(
          <div style={{fontSize:13}}>
            <div style={{marginBottom:8}}>
              <input value={pat?pat.prefix+pat.fname+' '+pat.lname:''} onChange={()=>{}} placeholder="นาย/นาง/นางสาว..."
                style={{display:'inline-block',width:'60%',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px'}} />
              <span style={{marginLeft:8}}>ไม่เป็นโรคต่อไปนี้</span>
            </div>
            {/* 5 diseases */}
            {CERT_DISEASES_5.map(dis=>(
              <div key={dis.key} style={{marginBottom:8,paddingLeft:20}}>
                <div style={{fontWeight:dis.key==='d5'?600:400,fontStyle:dis.key==='d5'?'italic':''}}>{dis.label}</div>
                <div style={{display:'flex',gap:16,alignItems:'center',marginTop:3,paddingLeft:16}}>
                  <label style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:400,cursor:'pointer'}}>
                    <input type="radio" name={dis.key} checked={d5results[dis.key]==='none'} onChange={()=>setD5results(p=>({...p,[dis.key]:'none'}))} />
                    ไม่พบหลักฐาน
                  </label>
                  <label style={{display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:400,cursor:'pointer'}}>
                    <input type="radio" name={dis.key} checked={d5results[dis.key]==='found'} onChange={()=>setD5results(p=>({...p,[dis.key]:'found'}))} />
                    พบ
                  </label>
                  {d5results[dis.key]==='found'&&(
                    <input value={d5notes[dis.key]} onChange={e=>setD5notes(p=>({...p,[dis.key]:e.target.value}))} placeholder="ระบุรายละเอียด"
                      style={{flex:1,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12,background:'transparent',padding:'0 4px'}} />
                  )}
                </div>
              </div>
            ))}
            {/* Field (6) */}
            <div style={{paddingLeft:20,marginTop:4}}>
              <div style={{fontStyle:'italic',marginBottom:4}}>(6) .............(ถ้าหากจำเป็นต้องตรวจหาโรคที่เกี่ยวข้องกับการปฏิบัติงานของผู้รับการตรวจให้ระบุในข้อนี้)............</div>
              <textarea value={d6note} onChange={e=>setD6note(e.target.value)} rows={2}
                style={{width:'100%',resize:'vertical',border:'none',borderBottom:'1px solid #ccc',outline:'none',fontSize:12,fontFamily:'inherit',background:'transparent',padding:'2px 4px'}}
                placeholder="ผลการตรวจเพิ่มเติม (ถ้ามี)" />
            </div>
            {/* Conclusion */}
            <div style={{borderTop:'1px dashed #bbb',marginTop:12,paddingTop:8}}>
              <div style={{fontWeight:600,marginBottom:4}}>สรุปความเห็นและข้อแนะนำของแพทย์</div>
              <textarea value={conclusion} onChange={e=>setConclusion(e.target.value)} rows={3}
                style={{width:'100%',resize:'vertical',border:'1px solid #ccc',borderRadius:4,padding:'6px 8px',fontSize:13,fontFamily:'inherit'}}
                placeholder="สรุปความเห็นแพทย์" />
            </div>
          </div>
        )}

        {type==='driving'&&(
          <div style={{fontSize:13}}>
            {/* ── Override title for driving cert ── */}
            <style>{`#cert-doc-area .cert-main-title{display:none}`}</style>
            {/* BOOK / CERT number row */}
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12.5,marginBottom:10}}>
              <span>เล่มที่ <input value={drvBookNo} onChange={e=>setDrvBookNo(e.target.value)} style={{width:100,borderBottom:'1px dotted #888',border:'none',outline:'none',background:'transparent',fontSize:12.5,padding:'0 4px'}} /></span>
              <span>เลขที่ <input value={drvCertNo} onChange={e=>setDrvCertNo(e.target.value)} style={{width:100,borderBottom:'1px dotted #888',border:'none',outline:'none',background:'transparent',fontSize:12.5,padding:'0 4px'}} /></span>
            </div>

            {/* ── PART 1 — Patient ── */}
            <div style={{border:'2px solid #1a5276',borderRadius:6,marginBottom:14}}>
              <div style={{background:'#1a5276',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px',borderRadius:'4px 4px 0 0',display:'flex',alignItems:'center',gap:8}}>
                <span style={{background:'#fff',color:'#1a5276',borderRadius:3,padding:'1px 7px',fontWeight:800,fontSize:13}}>ส่วนที่ 1</span>
                ของผู้ขอรับใบรับรองสุขภาพ
              </div>
              <div style={{padding:'12px 16px'}}>
                {/* Name */}
                <div style={{marginBottom:6}}>
                  ข้าพเจ้า นาย/นาง/นางสาว
                  <input value={pat?pat.prefix+pat.fname+' '+pat.lname:''} readOnly
                    style={{width:'calc(100% - 180px)',marginLeft:8,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',display:'inline-block'}} />
                </div>
                {/* Address */}
                <div style={{marginBottom:4}}>
                  สถานที่อยู่ (ที่สามารถติดต่อได้)
                  <input value={drvAddr} onChange={e=>setDrvAddr(e.target.value)}
                    style={{width:'calc(100% - 210px)',marginLeft:8,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px',display:'inline-block'}} />
                </div>
                <div style={{marginBottom:8}}>
                  <input value={drvAddr} onChange={e=>setDrvAddr(e.target.value)}
                    style={{width:'100%',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px'}} />
                </div>
                {/* ID box */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                  <span style={{fontWeight:600}}>หมายเลขบัตรประจำตัวประชาชน</span>
                  <div style={{display:'flex',gap:1,alignItems:'center'}}>
                    {/* Format: X-XXXX-XXXXX-XX-X (13 digits with separators at 1,5,10,12) */}
                    {[1,4,5,2].map((grpLen,gi)=>{
                      const offsets=[0,1,5,10,12];
                      const start=offsets[gi]; const end=offsets[gi]+grpLen;
                      const idStr=(pat?.idcard||'').replace(/-/g,'');
                      return (
                        <div key={gi} style={{display:'flex',gap:1,alignItems:'center'}}>
                          {gi>0&&<span style={{margin:'0 2px',fontWeight:700}}>-</span>}
                          {Array.from({length:grpLen}).map((_,ci)=>(
                            <div key={ci} style={{width:20,height:22,border:'1px solid #555',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,background:'#fafafa'}}>
                              {idStr[start+ci]||''}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {/* last groups: 4+5+2+1 = 12, plus first 1 = 13 */}
                  </div>
                </div>
                {/* Health history */}
                <div style={{marginBottom:6,fontWeight:600}}>ข้าพเจ้าขอใบรับรองสุขภาพ โดยมีประวัติสุขภาพดังนี้</div>
                {[
                  {k:'chronic',   l:'1. โรคประจำตัว'},
                  {k:'accident',  l:'2. อุบัติเหตุ และ ผ่าตัด'},
                  {k:'hospital',  l:'3. เคยเข้ารับการรักษาในโรงพยาบาล'},
                  {k:'epilepsy',  l:'4. โรคลมชัก *'},
                  {k:'other',     l:'5. ประวัติอื่นที่สำคัญ'},
                ].map(item=>(
                  <div key={item.k} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontSize:12.5}}>
                    <span style={{width:220,flexShrink:0}}>{item.l}</span>
                    <label style={{display:'flex',alignItems:'center',gap:3,fontWeight:400,cursor:'pointer'}}>
                      <input type="radio" name={`drh_${item.k}`} checked={!drvHist[item.k].has} onChange={()=>updDrvHist(item.k,'has',false)} /> ไม่มี
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:3,fontWeight:400,cursor:'pointer',marginLeft:8}}>
                      <input type="radio" name={`drh_${item.k}`} checked={drvHist[item.k].has} onChange={()=>updDrvHist(item.k,'has',true)} /> มี (ระบุ)
                    </label>
                    {drvHist[item.k].has&&(
                      <input value={drvHist[item.k].detail} onChange={e=>updDrvHist(item.k,'detail',e.target.value)}
                        style={{flex:1,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12,background:'transparent',padding:'0 4px'}} placeholder="ระบุรายละเอียด" />
                    )}
                    {!drvHist[item.k].has&&<span style={{flex:1,borderBottom:'1px dotted #ccc',display:'inline-block'}}>&nbsp;</span>}
                  </div>
                ))}
                <div style={{fontSize:11,color:'#555',marginTop:4,fontStyle:'italic',paddingLeft:8}}>
                  * ในกรณีมีโรคลมชัก ให้นำประวัติการรักษาจากแพทย์ผู้รักษาว่าท่านปลอดจากอาการชักมากกว่า 1 ปี เพื่ออนุญาตให้ขับรถได้
                </div>
                {/* Patient signature */}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
                  <div style={{textAlign:'center'}}>
                    <span>ลงชื่อ </span>
                    <span style={{display:'inline-block',width:180,borderBottom:'1px solid #888'}}>&nbsp;</span>
                    <span style={{marginLeft:12}}>วันที่ </span>
                    <input type="date" value={drvExamDate} onChange={e=>setDrvExamDate(e.target.value)}
                      style={{width:150,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12,background:'transparent'}} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── PART 2 — Doctor ── */}
            <div style={{border:'2px solid #1a5276',borderRadius:6}}>
              <div style={{background:'#1a5276',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px',borderRadius:'4px 4px 0 0',display:'flex',alignItems:'center',gap:8}}>
                <span style={{background:'#fff',color:'#1a5276',borderRadius:3,padding:'1px 7px',fontWeight:800,fontSize:13}}>ส่วนที่ 2</span>
                ของแพทย์
              </div>
              <div style={{padding:'12px 16px'}}>
                {/* Station / date */}
                <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:6,flexWrap:'wrap',fontSize:12.5}}>
                  <span>สถานที่ตรวจ</span>
                  <input value={CLINIC_NAME} readOnly style={{flex:2,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent',padding:'0 4px'}} />
                  <span>วันที่</span>
                  <input type="date" value={drvExamDate} onChange={e=>setDrvExamDate(e.target.value)} style={{width:155,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} />
                </div>
                {/* Doctor declaration */}
                <div style={{marginBottom:4,fontSize:12.5}}>
                  (1) ข้าพเจ้า นายแพทย์/แพทย์หญิง <b>{DOCTOR_NAME}</b>
                </div>
                <div style={{fontSize:12.5,marginBottom:2}}>
                  ใบอนุญาตประกอบวิชาชีพเวชกรรม เลขที่ <b>{DOCTOR_LICENSE}</b>
                  <span style={{marginLeft:10}}>สถานพยาบาลชื่อ <b>{CLINIC_NAME}</b></span>
                </div>
                <div style={{fontSize:12.5,marginBottom:2}}>
                  ที่อยู่ <input value={CLINIC_ADDRESS} readOnly style={{width:'80%',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent',padding:'0 4px'}} />
                </div>
                <div style={{fontSize:12.5,marginBottom:2}}>
                  ได้ตรวจร่างกาย นาย/นาง/นางสาว <b>{pat?pat.prefix+pat.fname+' '+pat.lname:'................................'}</b>
                </div>
                <div style={{fontSize:12.5,marginBottom:8}}>
                  แล้วเมื่อวันที่ <input type="date" value={drvExamDate} onChange={e=>setDrvExamDate(e.target.value)} style={{width:155,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} />
                  <span style={{marginLeft:16}}>มีรายละเอียดดังนี้</span>
                </div>
                {/* Vital signs */}
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',fontSize:12.5,marginBottom:8,background:'#f0f6ff',borderRadius:5,padding:'7px 10px'}}>
                  <span>น้ำหนักตัว <input value={drvWeight} onChange={e=>setDrvWeight(e.target.value)} style={{width:50,textAlign:'center',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} /> กก.</span>
                  <span>ความสูง <input value={drvHeight} onChange={e=>setDrvHeight(e.target.value)} style={{width:50,textAlign:'center',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} /> เซนติเมตร</span>
                  <span>ความดันโลหิต <input value={drvBP} onChange={e=>setDrvBP(e.target.value)} style={{width:70,textAlign:'center',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} /> มม.ปรอท</span>
                  <span>ชีพจร <input value={drvPR} onChange={e=>setDrvPR(e.target.value)} style={{width:50,textAlign:'center',borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent'}} /> ครั้ง/นาที</span>
                </div>
                {/* General body exam */}
                <div style={{fontSize:12.5,marginBottom:4}}>
                  <span>สภาพร่างกายทั่วไปอยู่ในเกณฑ์</span>
                  <label style={{marginLeft:12,display:'inline-flex',alignItems:'center',gap:4,fontWeight:400,cursor:'pointer'}}>
                    <input type="radio" name="drvbody" checked={drvBodyResult==='normal'} onChange={()=>setDrvBodyResult('normal')} /> ปกติ
                  </label>
                  <label style={{marginLeft:12,display:'inline-flex',alignItems:'center',gap:4,fontWeight:400,cursor:'pointer'}}>
                    <input type="radio" name="drvbody" checked={drvBodyResult==='abnormal'} onChange={()=>setDrvBodyResult('abnormal')} /> ผิดปกติ (ระบุ)
                  </label>
                  <input value={drvBodyNote} onChange={e=>setDrvBodyNote(e.target.value)}
                    style={{marginLeft:8,width:200,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12.5,background:'transparent',display:'inline-block'}} placeholder="ระบุ..." />
                </div>
                {/* Certification statement */}
                <div style={{fontSize:12.5,lineHeight:1.8,marginBottom:8,paddingLeft:12,borderLeft:'3px solid #1a5276'}}>
                  ขอรับรองว่า บุคคลดังกล่าว ไม่เป็นผู้มีร่างกายทุพพลภาพจนไม่สามารถปฏิบัติหน้าที่ได้ ไม่ปรากฏอาการของโรคจิต
                  หรือจิตฟั่นเฟือน หรือปัญญาอ่อน ไม่ปรากฏอาการของการติดยาเสพติดให้โทษ และอาการของโรคพิษสุราเรื้อรัง และไม่
                  ปรากฏอาการและอาการแสดงของโรคต่อไปนี้
                </div>
                {/* Disease rows */}
                {drvDiseases.map((dis,i)=>(
                  <div key={dis.key} style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:5,paddingLeft:16,fontSize:12.5}}>
                    <span style={{flex:1,lineHeight:1.6}}>{dis.label}</span>
                    {i<3&&<span style={{color:'#555',fontStyle:'italic',fontSize:11,whiteSpace:'nowrap'}}>{dis.found?'พบ':'ไม่พบ'}</span>}
                    {i===3&&(
                      <div style={{flex:1,display:'flex',alignItems:'center',gap:6}}>
                        <label style={{display:'inline-flex',alignItems:'center',gap:3,fontWeight:400,cursor:'pointer'}}>
                          <input type="checkbox" checked={dis.found} onChange={e=>updDrvDisease(i,'found',e.target.checked)} /> มี
                        </label>
                        <input value={dis.note} onChange={e=>updDrvDisease(i,'note',e.target.value)}
                          style={{flex:1,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:12,background:'transparent'}} placeholder="ระบุ..." />
                      </div>
                    )}
                  </div>
                ))}
                {/* Fit / Not fit */}
                <div style={{marginTop:12,padding:'10px 14px',background:'#f0f6ff',borderRadius:6,border:'1px solid #aac6d8'}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:'#1a5276'}}>ความเห็นแพทย์เกี่ยวกับความเหมาะสมในการขับรถ</div>
                  <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:8}}>
                    <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer',fontWeight:400}}>
                      <input type="radio" name="drvfit" checked={drvFitResult==='fit'} onChange={()=>setDrvFitResult('fit')} style={{width:14,height:14}} />
                      <span style={{color:'#1e8449',fontWeight:600}}>✅ มีสุขภาพเหมาะสมในการขอรับใบอนุญาตขับรถ</span>
                    </label>
                    <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer',fontWeight:400}}>
                      <input type="radio" name="drvfit" checked={drvFitResult==='notfit'} onChange={()=>setDrvFitResult('notfit')} style={{width:14,height:14}} />
                      <span style={{color:'#c0392b',fontWeight:600}}>❌ ไม่เหมาะสม เนื่องจาก</span>
                    </label>
                  </div>
                  {drvFitResult==='notfit'&&(
                    <input value={drvFitReason} onChange={e=>setDrvFitReason(e.target.value)}
                      style={{width:'100%',borderBottom:'1.5px solid #c0392b',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'2px 4px'}} placeholder="ระบุเหตุผล..." />
                  )}
                </div>
                {/* Doctor conclusion */}
                <div style={{marginTop:10}}>
                  <div style={{fontWeight:600,marginBottom:4,fontSize:12.5}}>(2) สรุปความเห็นและข้อแนะนำของแพทย์</div>
                  <textarea value={drvConclusion} onChange={e=>setDrvConclusion(e.target.value)} rows={2}
                    style={{width:'100%',resize:'vertical',border:'none',borderBottom:'1px solid #ccc',outline:'none',fontSize:12.5,fontFamily:'inherit',background:'transparent'}}
                    placeholder="สรุปความเห็นแพทย์เพิ่มเติม..." />
                  <div style={{borderBottom:'1px dotted #888',marginTop:4}}>&nbsp;</div>
                </div>
                {/* Doctor signature */}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:20}}>
                  <div style={{textAlign:'center',minWidth:260}}>
                    <div style={{borderBottom:'1px solid #888',height:40,marginBottom:4}} />
                    <div style={{fontSize:13}}>ลงชื่อ .................................................. แพทย์ผู้ตรวจร่างกาย</div>
                    <div style={{fontWeight:700,fontSize:13,marginTop:4}}>{DOCTOR_NAME}</div>
                    <div style={{fontSize:12,color:'#555'}}>{DOCTOR_TITLE}</div>
                    <div style={{fontSize:12,color:'#555'}}>ใบอนุญาตประกอบวิชาชีพเวชกรรม เลขที่ {DOCTOR_LICENSE}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div style={{borderTop:'1.5px solid #bbb',marginTop:16,paddingTop:10,fontSize:11,color:'#444',lineHeight:1.8}}>
              <b>หมายเหตุ</b>
              <div style={{paddingLeft:14}}>(1) ต้องเป็นแพทย์ซึ่งได้ขึ้นทะเบียนรับใบอนุญาตประกอบวิชาชีพเวชกรรม</div>
              <div style={{paddingLeft:14}}>(2) ให้แสดงว่าเป็นผู้มีร่างกายสมบูรณ์เพียงใด ใบรับรองแพทย์ฉบับนี้ให้ใช้ได้ 1 เดือน นับแต่วันที่ตรวจร่างกาย</div>
              <div style={{paddingLeft:14}}>(3) คำรับรองนี้เป็นการตรวจวินิจัยเบื้องต้น และใบรับรองแพทย์นี้ใช้สำหรับใบอนุญาตขับรถและปฏิบัติหน้าที่เป็นผู้ประจำรถ แบบฟอร์มนี้ได้รับการรับรองจากคณะกรรมการแพทยสภาในการประชุมครั้งที่ 2/2564 วันที่ 4 กุมภาพันธ์ 2564</div>
            </div>
          </div>
        )}

        {/* Issue date — only for sick/group5 */}
        {type!=='driving'&&(
        <div style={{fontSize:13,marginTop:14,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span>ออกให้ ณ วันที่</span>
          <input type="date" value={certDate} onChange={e=>setCertDate(e.target.value)}
            style={{width:160,borderBottom:'1px dotted #888',border:'none',outline:'none',fontSize:13,background:'transparent',padding:'0 4px'}} />
        </div>
        )}

        {/* Signature — only for sick/group5 */}
        {type!=='driving'&&(
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:32,marginBottom:8}}>
          <div style={{textAlign:'center',minWidth:250}}>
            <div style={{borderBottom:'1px solid #888',height:44,marginBottom:4}} />
            <div style={{fontWeight:700,fontSize:13}}>ลงชื่อ ..................................................</div>
            <div style={{fontSize:13,marginTop:2}}>{DOCTOR_NAME}</div>
            <div style={{fontSize:12,color:'#555'}}>{DOCTOR_TITLE}</div>
            <div style={{fontSize:12,color:'#555'}}>ใบอนุญาตประกอบวิชาชีพเวชกรรม เลขที่ {DOCTOR_LICENSE}</div>
            <div style={{fontSize:12,color:'#555'}}>แพทย์ผู้ตรวจร่างกาย</div>
          </div>
        </div>
        )}

        {/* Remark footer — only for sick/group5 */}
        {type!=='driving'&&(
        <div style={{borderTop:'1.5px solid #bbb',marginTop:16,paddingTop:10,fontSize:11.5,color:'#444',lineHeight:1.7}}>
          <span style={{fontWeight:700}}>หมายเหตุ</span>
          <div style={{paddingLeft:16}}>
            (1) ต้องเป็นแพทย์ซึ่งได้ขึ้นทะเบียนรับใบอนุญาตประกอบวิชาชีพเวชกรรม
          </div>
          <div style={{paddingLeft:16}}>
            (2) ให้แสดงว่าเป็นผู้มีร่างกายสมบูรณ์เพียงใด หรือหากจากโรคที่เป็นเหตุให้ออกจากราชการ ใบรับรองแพทย์ฉบับนี้ให้ใช้ได้ 1 เดือน นับแต่วันที่ตรวจร่างกาย
          </div>
        </div>
        )}

        {/* Print button — hidden on print */}
        <div style={{textAlign:'center',marginTop:20,display:'flex',gap:10,justifyContent:'center'}} className="no-print">
          <button className="btn btn-print" onClick={()=>doPrint('cert-doc-area',`ใบรับรองแพทย์${type==='driving'?' (ใบขับขี่)':''} — ${pat?pat.prefix+pat.fname+' '+pat.lname:''}`)}>
            🖨️ พิมพ์ใบรับรองแพทย์ (A4)
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== CERT MODAL =====================
function CertModal({data,onClose,getPatient}) {
  const {pat,visit}=data;
  const [type,setType]=useState('sick');
  const [form,setForm]=useState({diagText:visit?.dx||'',restDays:'',fromDate:today(),toDate:'',doctorNote:'',certDate:today(),certNo:''});
  const f=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const certTypes=[{k:'sick',l:'อาการเจ็บป่วย'},{k:'group5',l:'5 กลุ่มโรค'},{k:'driving',l:'ใบขับขี่'}];
  const age=pat?.dob?Math.floor((new Date()-new Date(pat.dob))/(365.25*24*60*60*1000))+' ปี':'';
  return (
    <Modal title="📄 ออกใบรับรองแพทย์" onClose={onClose} width={720}>
      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {certTypes.map(t=><button key={t.k} className={`btn btn-sm ${type===t.k?'btn-primary':'btn-outline'}`} onClick={()=>setType(t.k)}>{t.l}</button>)}
      </div>
      <div id="cert-modal-doc">
        <ClinicHeader />
        <div style={{textAlign:'center',fontWeight:700,fontSize:15,color:'var(--primary)',margin:'8px 0'}}>ใบรับรองแพทย์{type==='group5'?' (5 กลุ่มโรค)':type==='driving'?' (ใบขับขี่)':''}</div>
        <div style={{textAlign:'right',fontSize:12}}>เลขที่: <input value={form.certNo} onChange={e=>f('certNo',e.target.value)} style={{display:'inline',width:90,fontSize:12,padding:'2px 6px'}} /></div>
        <div className="divider" />
        <div style={{fontSize:13,lineHeight:1.9}}>
          <div>ข้าพเจ้า <b>{DOCTOR_NAME}</b> ใบอนุญาต เลขที่ <b>{DOCTOR_LICENSE}</b> ขอรับรองว่าได้ตรวจ</div>
          <div style={{display:'flex',gap:'8px 20px',flexWrap:'wrap',background:'var(--gray-pale)',borderRadius:6,padding:'7px 10px',margin:'8px 0',fontSize:12}}>
            <div>ชื่อ: <b>{pat?.prefix}{pat?.fname} {pat?.lname}</b></div>
            <div>เพศ: <b>{pat?.gender}</b></div>
            <div>อายุ: <b>{age}</b></div>
            <div>บัตรประชาชน: <b>{pat?.idcard||'...........'}</b></div>
          </div>
          <div>วันที่ตรวจ: <b>{thaiDate(today())}</b></div>
          <div className="divider" />
          {type==='sick'&&<>
            <div>มีอาการ / การวินิจฉัย:</div>
            <textarea value={form.diagText} onChange={e=>f('diagText',e.target.value)} rows={2} style={{width:'100%',resize:'vertical',marginBottom:6}} placeholder="อาการ / การวินิจฉัย" />
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',fontSize:13}}>
              <span>ควรพักรักษาตัว</span>
              <input value={form.restDays} onChange={e=>f('restDays',e.target.value)} style={{width:50,textAlign:'center'}} />
              <span>วัน ตั้งแต่</span>
              <input type="date" value={form.fromDate} onChange={e=>f('fromDate',e.target.value)} style={{width:150}} />
              <span>ถึง</span>
              <input type="date" value={form.toDate} onChange={e=>f('toDate',e.target.value)} style={{width:150}} />
            </div>
          </>}
          <div style={{marginTop:8}}>ความเห็นแพทย์:</div>
          <textarea value={form.doctorNote} onChange={e=>f('doctorNote',e.target.value)} rows={3} style={{width:'100%',resize:'vertical'}} />
          <div style={{marginTop:8}}>ออกให้ ณ วันที่ <b>{thaiDate(form.certDate)}</b></div>
        </div>
        <DoctorSignature />
      </div>
      <div style={{textAlign:'center',marginTop:14,display:'flex',gap:10,justifyContent:'center'}}>
        <button className="btn btn-print" onClick={()=>doPrint('cert-modal-doc','ใบรับรองแพทย์')}>🖨️ พิมพ์ใบรับรองแพทย์</button>
        <button className="btn btn-gray" onClick={onClose}>ปิด</button>
      </div>
    </Modal>
  );
}

// ===================== RECEIPT PAGE =====================
function ReceiptPage({receipts,saveReceipt,patients,visits,nextRID,getPatient,medicines,patchMedicineStock}) {
  const [tab,setTab]=useState('list');
  const [search,setSearch]=useState('');
  const [filterFrom,setFilterFrom]=useState('');
  const [filterTo,setFilterTo]=useState('');
  const [newForm,setNewForm]=useState(null);

  const filtered=receipts.filter(r=>{
    const q=search.toLowerCase();
    const pat=getPatient(r.hn);
    const nameMatch=(pat?.fname+' '+pat?.lname).toLowerCase().includes(q)||r.hn.includes(q)||r.id.toLowerCase().includes(q);
    const dateMatch=(!filterFrom||r.date>=filterFrom)&&(!filterTo||r.date<=filterTo);
    return nameMatch&&dateMatch;
  });

  const totalFiltered=filtered.reduce((s,r)=>s+r.items.reduce((t,i)=>t+i.qty*i.price,0)-r.discount,0);

  const [detail,setDetail]=useState(null);

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>🧾 ใบเสร็จรับเงิน</h2>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className={`btn btn-sm ${tab==='list'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('list')}>📋 รายการ</button>
          <button className={`btn btn-sm ${tab==='summary'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('summary')}>📊 สรุปรายรับ</button>
        </div>
      </div>

      {tab==='list'&&(
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div><label>ค้นหา</label><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="HN / ชื่อ / เลขใบเสร็จ" style={{width:220}} /></div>
              <div><label>ตั้งแต่วันที่</label><input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={{width:160}} /></div>
              <div><label>ถึงวันที่</label><input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={{width:160}} /></div>
              <button className="btn btn-gray btn-sm" onClick={()=>{setSearch('');setFilterFrom('');setFilterTo('');}}>ล้าง</button>
            </div>
            <div style={{marginTop:10,fontSize:13,color:'var(--accent)',fontWeight:600}}>
              รายการที่แสดง: {filtered.length} รายการ | รวมรายรับ: <span style={{fontSize:15}}>{totalFiltered.toLocaleString()}</span> บาท
            </div>
          </div>
          {detail?(
            <div>
              <button className="btn btn-gray btn-sm" onClick={()=>setDetail(null)} style={{marginBottom:12}}>← กลับรายการ</button>
              <ReceiptDoc r={detail} pat={getPatient(detail.hn)} />
            </div>
          ):(
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead>
                  <tr style={{background:'var(--primary)',color:'#fff'}}>
                    <th style={{padding:'9px 14px',textAlign:'left'}}>เลขใบเสร็จ</th>
                    <th style={{padding:'9px 14px',textAlign:'left'}}>HN / ชื่อ</th>
                    <th style={{padding:'9px 14px',textAlign:'left'}}>วันที่</th>
                    <th style={{padding:'9px 14px',textAlign:'right'}}>ยอดรวม (บ.)</th>
                    <th style={{padding:'9px 14px',textAlign:'left'}}>ชำระโดย</th>
                    <th style={{padding:'9px 14px',textAlign:'left'}}>สถานะ</th>
                    <th style={{padding:'9px 14px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0&&<tr><td colSpan={7} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูล</td></tr>}
                  {filtered.map((r,i)=>{
                    const total=r.items.reduce((s,it)=>s+it.qty*it.price,0)-r.discount;
                    const pat=getPatient(r.hn);
                    return (
                      <tr key={r.id} style={{background:i%2===0?'#fff':'var(--gray-pale)'}}>
                        <td style={{padding:'8px 14px',fontWeight:700,color:'var(--primary)'}}>{r.id}</td>
                        <td style={{padding:'8px 14px'}}><div style={{fontWeight:600}}>HN {r.hn}</div><div style={{fontSize:12,color:'var(--gray)'}}>{pat?.prefix}{pat?.fname} {pat?.lname}</div></td>
                        <td style={{padding:'8px 14px'}}>{thaiDate(r.date)}</td>
                        <td style={{padding:'8px 14px',textAlign:'right',fontWeight:700}}>{total.toLocaleString()}</td>
                        <td style={{padding:'8px 14px'}}>{r.paid}</td>
                        <td style={{padding:'8px 14px'}}><span className={`tag ${r.status==='ชำระแล้ว'?'tag-green':'tag-orange'}`}>{r.status}</span></td>
                        <td style={{padding:'8px 14px'}}><button className="btn btn-outline btn-sm" onClick={()=>setDetail(r)}>ดู/พิมพ์</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab==='summary'&&<ReceiptSummary receipts={receipts} />}
    </div>
  );
}

function ReceiptSummary({receipts}) {
  const [period,setPeriod]=useState('month');
  const [year,setYear]=useState(new Date().getFullYear()+'');
  const [month,setMonth]=useState(String(new Date().getMonth()+1).padStart(2,'0'));
  const [fromDate,setFromDate]=useState('');
  const [toDate,setToDate]=useState('');
  const filtered=receipts.filter(r=>{
    if(period==='month') return r.date.startsWith(`${year}-${month}`);
    if(period==='year') return r.date.startsWith(year);
    return (!fromDate||r.date>=fromDate)&&(!toDate||r.date<=toDate);
  });
  const totalIncome=filtered.reduce((s,r)=>s+r.items.reduce((t,i)=>t+i.qty*i.price,0)-r.discount,0);
  const byDate=filtered.reduce((acc,r)=>{
    const d=r.date;
    if(!acc[d])acc[d]={income:0,count:0};
    acc[d].income+=r.items.reduce((t,i)=>t+i.qty*i.price,0)-r.discount;
    acc[d].count++;
    return acc;
  },{});
  return (
    <div>
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div>
            <label>ประเภทช่วงเวลา</label>
            <select value={period} onChange={e=>setPeriod(e.target.value)} style={{width:130}}>
              <option value="month">รายเดือน</option>
              <option value="year">รายปี</option>
              <option value="custom">กำหนดเอง</option>
            </select>
          </div>
          {(period==='month'||period==='year')&&<div>
            <label>ปี (ค.ศ.)</label>
            <input value={year} onChange={e=>setYear(e.target.value)} style={{width:90}} />
          </div>}
          {period==='month'&&<div>
            <label>เดือน (01-12)</label>
            <input value={month} onChange={e=>setMonth(e.target.value)} style={{width:80}} />
          </div>}
          {period==='custom'&&<>
            <div><label>ตั้งแต่</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:160}} /></div>
            <div><label>ถึง</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:160}} /></div>
          </>}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:700,color:'var(--accent)'}}>{totalIncome.toLocaleString()}</div>
          <div style={{fontSize:12,color:'var(--gray)'}}>รายรับรวม (บาท)</div>
        </div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:700,color:'var(--primary)'}}>{filtered.length}</div>
          <div style={{fontSize:12,color:'var(--gray)'}}>จำนวนใบเสร็จ</div>
        </div>
        <div className="card" style={{textAlign:'center'}}>
          <div style={{fontSize:24,fontWeight:700,color:'var(--warning)'}}>{filtered.length>0?(totalIncome/filtered.length).toFixed(0):0}</div>
          <div style={{fontSize:12,color:'var(--gray)'}}>เฉลี่ยต่อใบเสร็จ (บาท)</div>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'var(--primary)',color:'#fff'}}>
              <th style={{padding:'9px 14px',textAlign:'left'}}>วันที่</th>
              <th style={{padding:'9px 14px',textAlign:'center'}}>จำนวนใบเสร็จ</th>
              <th style={{padding:'9px 14px',textAlign:'right'}}>รายรับ (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(byDate).length===0&&<tr><td colSpan={3} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูล</td></tr>}
            {Object.entries(byDate).sort((a,b)=>b[0].localeCompare(a[0])).map(([d,v],i)=>(
              <tr key={d} style={{background:i%2===0?'#fff':'var(--gray-pale)'}}>
                <td style={{padding:'8px 14px'}}>{thaiDate(d)}</td>
                <td style={{padding:'8px 14px',textAlign:'center'}}>{v.count}</td>
                <td style={{padding:'8px 14px',textAlign:'right',fontWeight:600}}>{v.income.toLocaleString()}</td>
              </tr>
            ))}
            <tr style={{background:'var(--primary-pale)',fontWeight:700}}>
              <td style={{padding:'8px 14px'}}>รวม</td>
              <td style={{padding:'8px 14px',textAlign:'center'}}>{filtered.length}</td>
              <td style={{padding:'8px 14px',textAlign:'right'}}>{totalIncome.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReceiptDoc({r,pat}) {
  const total=r.items.reduce((s,i)=>s+i.qty*i.price,0);
  const net=total-r.discount;
  const docId=`receipt-doc-${r.id}`;
  const svcItems=r.items.filter(i=>i.type!=='drug');
  const drugItems=r.items.filter(i=>i.type==='drug');
  return (
    <div className="card" id={docId}>
      <ClinicHeader />
      <div style={{textAlign:'center',fontWeight:700,fontSize:15,color:'var(--primary)',margin:'6px 0 2px'}}>ใบเสร็จรับเงิน / Receipt</div>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--gray)',marginBottom:8}}>
        <div>เลขที่: <b style={{color:'var(--primary)'}}>{r.id}</b></div>
        <div>วันที่: <b>{thaiDate(r.date)}</b></div>
      </div>
      <div style={{background:'var(--gray-pale)',borderRadius:6,padding:'8px 12px',marginBottom:10,fontSize:13}}>
        <div><b>ผู้รับบริการ:</b> {pat?.prefix}{pat?.fname} {pat?.lname}</div>
        <div><b>HN:</b> {r.hn} <span style={{marginLeft:16}}><b>Visit:</b> {r.visitId}</span></div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:10}}>
        <thead>
          <tr style={{background:'var(--primary)',color:'#fff'}}>
            <th style={{padding:'7px 10px',textAlign:'left'}}>รายการ</th>
            <th style={{padding:'7px 10px',textAlign:'center',width:55}}>จำนวน</th>
            <th style={{padding:'7px 10px',textAlign:'left',width:50}}>หน่วย</th>
            <th style={{padding:'7px 10px',textAlign:'right',width:80}}>ราคา/หน่วย</th>
            <th style={{padding:'7px 10px',textAlign:'right',width:80}}>รวม</th>
          </tr>
        </thead>
        <tbody>
          {/* Service items */}
          {svcItems.length>0&&(
            <tr><td colSpan={5} style={{padding:'5px 10px',background:'#e8f8f0',fontWeight:700,fontSize:11,color:'#1e8449'}}>🏥 ค่าหัตถการ / ค่าบริการ</td></tr>
          )}
          {svcItems.map((it,i)=>(
            <tr key={'s'+i} style={{background:'#f4fbf7'}}>
              <td style={{padding:'6px 10px'}}>{it.desc}</td>
              <td style={{padding:'6px 10px',textAlign:'center'}}>{it.qty}</td>
              <td style={{padding:'6px 10px'}}>{it.unit}</td>
              <td style={{padding:'6px 10px',textAlign:'right'}}>{(it.price||0).toLocaleString()}</td>
              <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{(it.qty*it.price).toLocaleString()}</td>
            </tr>
          ))}
          {/* Drug items */}
          {drugItems.length>0&&(
            <tr><td colSpan={5} style={{padding:'5px 10px',background:'#f0f6ff',fontWeight:700,fontSize:11,color:'#1a5276'}}>💊 รายการยา</td></tr>
          )}
          {drugItems.map((it,i)=>(
            <tr key={'d'+i} style={{background:i%2===0?'#f5faff':'#eef5ff'}}>
              <td style={{padding:'6px 10px'}}>{it.desc}</td>
              <td style={{padding:'6px 10px',textAlign:'center'}}>{it.qty}</td>
              <td style={{padding:'6px 10px'}}>{it.unit}</td>
              <td style={{padding:'6px 10px',textAlign:'right'}}>{(it.price||0).toLocaleString()}</td>
              <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{(it.qty*it.price).toLocaleString()}</td>
            </tr>
          ))}
          {/* Legacy rows without type */}
          {r.items.filter(i=>!i.type).map((it,i)=>(
            <tr key={'l'+i} style={{background:i%2===0?'#fff':'var(--gray-pale)'}}>
              <td style={{padding:'6px 10px'}}>{it.desc}</td>
              <td style={{padding:'6px 10px',textAlign:'center'}}>{it.qty}</td>
              <td style={{padding:'6px 10px'}}>{it.unit}</td>
              <td style={{padding:'6px 10px',textAlign:'right'}}>{(it.price||0).toLocaleString()}</td>
              <td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{(it.qty*it.price).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{background:'var(--gray-pale)'}}>
            <td colSpan={4} style={{padding:'7px 10px',textAlign:'right',fontWeight:600}}>รวมก่อนหัก</td>
            <td style={{padding:'7px 10px',textAlign:'right',fontWeight:600}}>{total.toLocaleString()}</td>
          </tr>
          {r.discount>0&&<tr><td colSpan={4} style={{padding:'7px 10px',textAlign:'right',color:'var(--danger)'}}>ส่วนลด</td><td style={{padding:'7px 10px',textAlign:'right',color:'var(--danger)'}}>-{r.discount.toLocaleString()}</td></tr>}
          <tr style={{background:'var(--primary)',color:'#fff'}}>
            <td colSpan={4} style={{padding:'8px 10px',textAlign:'right',fontWeight:700,fontSize:14}}>ยอดสุทธิ (บาท)</td>
            <td style={{padding:'8px 10px',textAlign:'right',fontWeight:700,fontSize:14}}>{net.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:14}}>
        <div><b>ชำระโดย:</b> {r.paid}</div>
        <div><span className={`tag ${r.status==='ชำระแล้ว'?'tag-green':'tag-orange'}`}>{r.status}</span></div>
      </div>
      <div style={{borderTop:'1px dashed #ccc',paddingTop:10,fontSize:11,color:'var(--gray)',textAlign:'center'}}>
        {CLINIC_NAME} — {CLINIC_ADDRESS} — โทร. {CLINIC_TEL}
      </div>
      <div style={{textAlign:'center',marginTop:14}} className="no-print">
        <button className="btn btn-print btn-sm" onClick={()=>doPrint(docId,'ใบเสร็จรับเงิน เลขที่ '+r.id)}>🖨️ พิมพ์ใบเสร็จ</button>
      </div>
    </div>
  );
}

function ReceiptQuickModal({data,onClose,getPatient,nextRID,receipts,saveReceipt,medicines,patchMedicineStock}) {
  const {pat,visit}=data;

  // Auto-build items from visit drugs + services
  const buildItems=()=>{
    const svcItems=(visit?.services||[]).map(s=>({desc:s.name,qty:s.qty||1,unit:s.unit||'ครั้ง',price:s.price,type:'service'}));
    const drugItems=(visit?.drugs||[]).map(d=>({desc:d.name,qty:d.qty,unit:d.unit,price:d.price,type:'drug',medId:d.medId}));
    const all=[...svcItems,...drugItems];
    return all.length>0?all:[{desc:'ค่าตรวจรักษา',qty:1,unit:'ครั้ง',price:300,type:'service'}];
  };

  const [items,setItems]=useState(buildItems);
  const [discount,setDiscount]=useState(0);
  const [paid,setPaid]=useState('เงินสด');
  const addItem=()=>setItems(prev=>[...prev,{desc:'',qty:1,unit:'ครั้ง',price:0,type:'service'}]);
  const updItem=(i,k,v)=>setItems(prev=>prev.map((it,idx)=>idx===i?{...it,[k]:k==='qty'||k==='price'?Number(v):v}:it));
  const rmItem=i=>setItems(prev=>prev.filter((_,idx)=>idx!==i));
  const total=items.reduce((s,it)=>s+it.qty*it.price,0)-Number(discount);

  const save=async()=>{
    const r={id:nextRID(),hn:pat.hn,visitId:visit?.id||'',patname:pat.prefix+pat.fname+' '+pat.lname,date:today(),items,discount:Number(discount),paid,status:'ชำระแล้ว'};
    await saveReceipt(r);
    for(const it of items){
      if(it.type==='drug'){
        const med=it.medId
          ? medicines.find(m=>m.id===it.medId)
          : medicines.find(m=>it.desc.includes(m.name));
        if(med) await patchMedicineStock(med.id, Math.max(0,med.stock-it.qty));
      }
    }
    alert('บันทึกใบเสร็จเรียบร้อยแล้ว');
    onClose();
  };

  const drugTotal=items.filter(i=>i.type==='drug').reduce((s,i)=>s+i.qty*i.price,0);
  const svcTotal=items.filter(i=>i.type!=='drug').reduce((s,i)=>s+i.qty*i.price,0);

  return (
    <Modal title="🧾 ออกใบเสร็จรับเงิน" onClose={onClose} width={720}>
      <div style={{background:'var(--primary-pale)',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><b>ผู้ป่วย:</b> {pat.prefix}{pat.fname} {pat.lname} &nbsp;|&nbsp; <b>HN:</b> {pat.hn}</div>
        {visit&&<div style={{fontSize:12,color:'var(--gray)'}}>Visit: {visit.id} | {thaiDate(visit.date)}</div>}
      </div>

      {/* Summary badges */}
      {(visit?.drugs?.length>0||visit?.services?.length>0)&&(
        <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
          {svcTotal>0&&<div style={{background:'#e8f8f0',border:'1px solid #a8d5c8',borderRadius:5,padding:'4px 10px',fontSize:12,color:'#1e8449'}}>🏥 ค่าหัตถการ: <b>{svcTotal.toLocaleString()}฿</b></div>}
          {drugTotal>0&&<div style={{background:'#f0f8ff',border:'1px solid #a8c8e8',borderRadius:5,padding:'4px 10px',fontSize:12,color:'#1a5276'}}>💊 ค่ายา: <b>{drugTotal.toLocaleString()}฿</b></div>}
        </div>
      )}

      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,marginBottom:8}}>
        <thead>
          <tr style={{background:'var(--primary)',color:'#fff'}}>
            <th style={{padding:'6px 8px',textAlign:'left'}}>รายการ</th>
            <th style={{padding:'6px 6px',textAlign:'center',width:30}}>ประเภท</th>
            <th style={{padding:'6px 8px',textAlign:'center',width:60}}>จำนวน</th>
            <th style={{padding:'6px 8px',textAlign:'left',width:60}}>หน่วย</th>
            <th style={{padding:'6px 8px',textAlign:'right',width:90}}>ราคา/หน่วย</th>
            <th style={{padding:'6px 8px',textAlign:'right',width:80}}>รวม</th>
            <th style={{width:28}}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it,i)=>(
            <tr key={i} style={{background:it.type==='drug'?'#f0f8ff':i%2===0?'#fff':'#f8fff8'}}>
              <td style={{padding:'4px 6px'}}><input value={it.desc} onChange={e=>updItem(i,'desc',e.target.value)} style={{fontSize:12}} /></td>
              <td style={{padding:'4px 4px',textAlign:'center'}}>
                <span style={{fontSize:10}}>{it.type==='drug'?'💊':'🏥'}</span>
              </td>
              <td style={{padding:'4px 6px'}}><input type="number" value={it.qty} onChange={e=>updItem(i,'qty',e.target.value)} style={{textAlign:'center',fontSize:12}} /></td>
              <td style={{padding:'4px 6px'}}><input value={it.unit} onChange={e=>updItem(i,'unit',e.target.value)} style={{fontSize:12}} /></td>
              <td style={{padding:'4px 6px'}}><input type="number" value={it.price} onChange={e=>updItem(i,'price',e.target.value)} style={{textAlign:'right',fontSize:12}} /></td>
              <td style={{padding:'4px 6px',textAlign:'right',fontWeight:600}}>{(it.qty*it.price).toLocaleString()}</td>
              <td><button onClick={()=>rmItem(i)} style={{background:'none',border:'none',color:'var(--danger)',cursor:'pointer',fontSize:14}}>✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-sm btn-outline" onClick={addItem}>+ เพิ่มรายการ</button>
      <div style={{display:'flex',gap:12,alignItems:'center',marginTop:10,fontSize:13,flexWrap:'wrap'}}>
        <div>ส่วนลด: <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} style={{width:80,fontSize:12}} /></div>
        <div>ชำระโดย: <select value={paid} onChange={e=>setPaid(e.target.value)} style={{fontSize:12,width:120}}>{['เงินสด','โอนเงิน','บัตรเครดิต','บัตรเดบิต','QR Code','อื่นๆ'].map(o=><option key={o}>{o}</option>)}</select></div>
        <div style={{marginLeft:'auto',fontWeight:700,fontSize:16,color:'var(--accent)'}}>ยอดสุทธิ: {total.toLocaleString()} บาท</div>
      </div>
      <div style={{textAlign:'right',marginTop:14,display:'flex',gap:10,justifyContent:'flex-end'}}>
        <button className="btn btn-gray btn-sm" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-accent btn-sm" onClick={save}>💾 บันทึกและออกใบเสร็จ</button>
      </div>
    </Modal>
  );
}

// ===================== APPOINT PAGE =====================
function AppointPage({appointments,saveAppointment,deleteAppointment,patients,nextAID,getPatient,today}) {
  const [search,setSearch]=useState('');
  const [tab,setTab]=useState('all');
  const [edit,setEdit]=useState(null);
  const [newForm,setNewForm]=useState(null);

  const filtered=appointments.filter(a=>{
    const q=search.toLowerCase();
    const match=a.hn.includes(q)||a.patname.toLowerCase().includes(q)||a.id.toLowerCase().includes(q);
    if(tab==='today') return match&&a.date===today;
    if(tab==='upcoming') return match&&a.date>=today;
    return match;
  }).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));

  const todayCount=appointments.filter(a=>a.date===today).length;
  const upCount=appointments.filter(a=>a.date>today).length;

  const save=async(f)=>{
    const appt = f.id ? f : {...f, id:nextAID()};
    await saveAppointment(appt);
    setEdit(null);setNewForm(null);
  };
  const del=async(id)=>{ if(window.confirm('ยืนยันลบการนัดหมายนี้?')) await deleteAppointment(id); };

  // Print a single appointment slip
  const printAppointSlip=(a)=>{
    const pat=getPatient(a.hn);
    const win=window.open('','_blank','width=380,height=480');
    win.document.write(`<!DOCTYPE html><html><head><title>ใบนัดหมาย</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Sarabun',sans-serif;padding:16px;}
      .card{border:2px solid #1a5276;border-radius:10px;padding:16px 18px;max-width:340px;}
      .clinic{text-align:center;border-bottom:2px solid #1a5276;padding-bottom:10px;margin-bottom:12px;}
      .clinic-name{font-size:14px;font-weight:700;color:#1a5276;}
      .clinic-addr{font-size:10px;color:#666;margin-top:2px;}
      .title{text-align:center;font-size:15px;font-weight:700;color:#1a5276;margin-bottom:12px;letter-spacing:1px;}
      .row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px dashed #eee;}
      .row b{color:#1a5276;}
      .label{color:#888;}
      .datetime{background:#e8f5ff;border-radius:6px;padding:8px 12px;text-align:center;margin:10px 0;}
      .datetime .d{font-size:14px;font-weight:700;color:#1a5276;}
      .datetime .t{font-size:22px;font-weight:800;color:#1a5276;}
      .note{font-size:11px;color:#888;margin-top:10px;border-top:1px dashed #ddd;padding-top:8px;text-align:center;}
      @media print{button{display:none!important;}}
    </style></head><body>
    <div class="card">
      <div class="clinic">
        <div class="clinic-name">🏥 ${CLINIC_NAME}</div>
        <div class="clinic-addr">${CLINIC_ADDRESS}<br/>โทร. ${CLINIC_TEL}</div>
      </div>
      <div class="title">ใบนัดหมาย</div>
      <div class="row"><span class="label">เลขที่นัด</span><b>${a.id}</b></div>
      <div class="row"><span class="label">ชื่อ-นามสกุล</span><b>${a.patname}</b></div>
      <div class="row"><span class="label">HN</span><b>${a.hn}</b></div>
      <div class="datetime">
        <div class="d">${thaiDate(a.date)}</div>
        <div class="t">${a.time} น.</div>
      </div>
      <div class="row"><span class="label">เหตุผลนัด</span><b>${a.reason||'-'}</b></div>
      ${a.note?`<div class="row"><span class="label">หมายเหตุ</span><b>${a.note}</b></div>`:''}
      <div class="note">กรุณามาก่อนเวลานัด 15 นาที<br/>หากไม่สามารถมาได้ตามนัด กรุณาโทรแจ้งล่วงหน้า</div>
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button onclick="window.print()" style="padding:8px 22px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-family:'Sarabun',sans-serif;font-weight:700;">🖨️ พิมพ์ใบนัด</button>
    </div></body></html>`);
    win.document.close();
    setTimeout(()=>{win.focus();win.print();},500);
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>📅 การนัดหมาย</h2>
        <button className="btn btn-primary btn-sm" style={{marginLeft:'auto'}} onClick={()=>setNewForm({hn:'',patname:'',date:'',time:'',reason:'',status:'นัดแล้ว',note:''})}>+ เพิ่มการนัด</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:14}}>
        {[{label:'นัดวันนี้',val:todayCount,color:'var(--primary)'},{label:'นัดที่กำลังจะมาถึง',val:upCount,color:'var(--accent)'},{label:'ทั้งหมด',val:appointments.length,color:'var(--gray)'}].map(s=>(
          <div key={s.label} className="card" style={{textAlign:'center',padding:'14px 10px'}}>
            <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:12,color:'var(--gray)'}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{marginBottom:12}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ค้นหา HN / ชื่อ / นามสกุล" style={{maxWidth:260}} />
          <div style={{display:'flex',gap:6}}>
            {[{k:'all',l:'ทั้งหมด'},{k:'today',l:`วันนี้ (${todayCount})`},{k:'upcoming',l:'กำลังจะมาถึง'}].map(t=>(
              <button key={t.k} className={`btn btn-sm ${tab===t.k?'btn-primary':'btn-outline'}`} onClick={()=>setTab(t.k)}>{t.l}</button>
            ))}
          </div>
        </div>
      </div>
      {(edit||newForm)&&(
        <AppointForm form={edit||newForm} onSave={save} onCancel={()=>{setEdit(null);setNewForm(null);}} patients={patients} />
      )}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead>
            <tr style={{background:'var(--primary)',color:'#fff'}}>
              <th style={{padding:'9px 14px',textAlign:'left'}}>เลขนัด</th>
              <th style={{padding:'9px 14px',textAlign:'left'}}>HN / ชื่อ</th>
              <th style={{padding:'9px 14px',textAlign:'left'}}>วันที่ / เวลา</th>
              <th style={{padding:'9px 14px',textAlign:'left'}}>เหตุผลนัด</th>
              <th style={{padding:'9px 14px',textAlign:'left'}}>สถานะ</th>
              <th style={{padding:'9px 14px',textAlign:'left'}}>หมายเหตุ</th>
              <th style={{padding:'9px 14px'}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={7} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูล</td></tr>}
            {filtered.map((a,i)=>(
              <tr key={a.id} style={{background:a.date===today?'#e8f5e9':i%2===0?'#fff':'var(--gray-pale)'}}>
                <td style={{padding:'8px 14px',fontWeight:700,color:'var(--primary)'}}>{a.id}</td>
                <td style={{padding:'8px 14px'}}><div style={{fontWeight:600}}>HN {a.hn}</div><div style={{fontSize:12}}>{a.patname}</div></td>
                <td style={{padding:'8px 14px'}}>{thaiDate(a.date)} <b>{a.time}</b></td>
                <td style={{padding:'8px 14px',color:'var(--gray-dark)'}}>{a.reason}</td>
                <td style={{padding:'8px 14px'}}>
                  <span className={`tag ${a.status==='นัดแล้ว'?'tag-blue':a.status==='มาตามนัด'?'tag-green':'tag-orange'}`}>{a.status}</span>
                </td>
                <td style={{padding:'8px 14px',fontSize:12,color:'var(--gray)'}}>{a.note}</td>
                <td style={{padding:'8px 14px',display:'flex',gap:4,flexWrap:'wrap'}}>
                  <button className="btn btn-print btn-sm" onClick={()=>printAppointSlip(a)}>🖨️ พิมพ์</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>setEdit({...a})}>แก้ไข</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>del(a.id)}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppointForm({form,onSave,onCancel,patients}) {
  const [f,setF]=useState({...form});
  const up=(k,v)=>setF(prev=>({...prev,[k]:v}));
  const searchPat=(hn)=>{const p=patients.find(x=>x.hn===hn);if(p)up('patname',p.prefix+p.fname+' '+p.lname);};
  return (
    <div className="card" style={{marginBottom:14,background:'var(--primary-pale)',border:'1.5px solid var(--primary-light)'}}>
      <div style={{fontWeight:700,fontSize:13,color:'var(--primary)',marginBottom:10}}>{f.id?'✏️ แก้ไขการนัดหมาย':'📅 เพิ่มการนัดหมายใหม่'}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
        <div><label>HN ผู้ป่วย</label><input value={f.hn} onChange={e=>{up('hn',e.target.value);searchPat(e.target.value);}} placeholder="000001" /></div>
        <div><label>ชื่อ-นามสกุล</label><input value={f.patname} onChange={e=>up('patname',e.target.value)} /></div>
        <div><label>วันที่นัด *</label><input type="date" value={f.date} onChange={e=>up('date',e.target.value)} /></div>
        <div><label>เวลา *</label><input type="time" value={f.time} onChange={e=>up('time',e.target.value)} /></div>
        <div><label>สถานะ</label>
          <select value={f.status} onChange={e=>up('status',e.target.value)}>
            {['นัดแล้ว','มาตามนัด','เลื่อนนัด','ยกเลิก'].map(o=><option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group mt-2"><label>เหตุผลนัด</label><input value={f.reason} onChange={e=>up('reason',e.target.value)} /></div>
      <div className="form-group"><label>หมายเหตุ</label><input value={f.note} onChange={e=>up('note',e.target.value)} /></div>
      <div style={{textAlign:'right',display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
        <button className="btn btn-gray btn-sm" onClick={onCancel}>ยกเลิก</button>
        <button className="btn btn-primary btn-sm" onClick={()=>onSave(f)}>💾 บันทึก</button>
      </div>
    </div>
  );
}

function AppointQuickModal({data,onClose,getPatient,appointments,saveAppointment,nextAID}) {
  const {pat}=data;
  const [form,setForm]=useState({hn:pat.hn,patname:pat.prefix+pat.fname+' '+pat.lname,date:'',time:'09:00',reason:'',status:'นัดแล้ว',note:''});
  const f=(k,v)=>setForm(prev=>({...prev,[k]:v}));
  const slipId='appoint-slip-'+pat.hn;
  const save=async()=>{await saveAppointment({...form,id:nextAID()});alert('บันทึกการนัดหมายเรียบร้อย');onClose()};
  return (
    <Modal title="📅 บันทึกการนัดหมาย" onClose={onClose} width={540}>
      <div style={{background:'var(--primary-pale)',borderRadius:6,padding:'8px 12px',marginBottom:12,fontSize:13}}>
        <b>{pat.prefix}{pat.fname} {pat.lname}</b> — HN: {pat.hn}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <div><label>วันที่นัด</label><input type="date" value={form.date} onChange={e=>f('date',e.target.value)} /></div>
        <div><label>เวลา</label><input type="time" value={form.time} onChange={e=>f('time',e.target.value)} /></div>
      </div>
      <div className="form-group mt-2"><label>เหตุผลนัด</label><input value={form.reason} onChange={e=>f('reason',e.target.value)} /></div>
      <div className="form-group"><label>หมายเหตุ</label><input value={form.note} onChange={e=>f('note',e.target.value)} /></div>

      {/* Printable slip preview */}
      {form.date&&(
        <div id={slipId} style={{border:'1px dashed #aaa',borderRadius:6,padding:'12px 16px',marginTop:10,fontSize:13}}>
          <ClinicHeader />
          <div style={{textAlign:'center',fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:10,letterSpacing:1}}>ใบนัดหมาย</div>
          <table style={{width:'100%',fontSize:13,borderCollapse:'collapse'}}>
            <tbody>
              {[
                ['ชื่อ-นามสกุล',pat.prefix+pat.fname+' '+pat.lname],
                ['HN',pat.hn],
                ['วันนัดหมาย',thaiDate(form.date)+' เวลา '+form.time+' น.'],
                ['เหตุผลนัด',form.reason||'ติดตามอาการ'],
                form.note?['หมายเหตุ',form.note]:null,
              ].filter(Boolean).map(([k,v])=>(
                <tr key={k}><td style={{padding:'4px 0',color:'#666',width:120}}>{k}:</td><td style={{padding:'4px 0',fontWeight:600}}>{v}</td></tr>
              ))}
            </tbody>
          </table>
          <div style={{borderTop:'1px dashed #ccc',marginTop:12,paddingTop:8,fontSize:11,color:'#888',textAlign:'center'}}>
            กรุณามาตามนัด หากไม่สะดวกโปรดแจ้งล่วงหน้า — {CLINIC_NAME} โทร. {CLINIC_TEL}
          </div>
          <DoctorSignature />
        </div>
      )}

      <div style={{textAlign:'right',marginTop:12,display:'flex',gap:8,justifyContent:'flex-end'}}>
        {form.date&&<button className="btn btn-print btn-sm" onClick={()=>doPrint(slipId,'ใบนัดหมาย '+pat.prefix+pat.fname+' '+pat.lname)}>🖨️ พิมพ์ใบนัด</button>}
        <button className="btn btn-gray btn-sm" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary btn-sm" onClick={save}>💾 บันทึกนัด</button>
      </div>
    </Modal>
  );
}

// ===================== ACCOUNTING PAGE =====================
const EXP_CATS=['เวชภัณฑ์/ยา','ค่าสาธารณูปโภค','ค่าเช่าสถานที่','เงินเดือน/ค่าจ้าง','อุปกรณ์การแพทย์','ค่าซ่อมบำรุง','ค่าการตลาด/ประชาสัมพันธ์','ภาษี','ค่าใช้จ่ายทั่วไป','อื่นๆ'];
const INIT_EXPENSES=[
  {id:'X001',date:'2025-06-01',category:'เวชภัณฑ์/ยา',desc:'ซื้อยา Paracetamol 500mg x1000 เม็ด',amount:1000},
  {id:'X002',date:'2025-06-02',category:'ค่าสาธารณูปโภค',desc:'ค่าไฟฟ้าเดือนพฤษภาคม',amount:2500},
  {id:'X003',date:'2025-06-05',category:'เวชภัณฑ์/ยา',desc:'ซื้อยา Amoxicillin 500mg x200 แคปซูล',amount:800},
  {id:'X004',date:'2025-06-10',category:'ค่าเช่าสถานที่',desc:'ค่าเช่าสถานที่ประจำเดือนมิถุนายน',amount:8000},
];

function AccountingPage({receipts,today}) {
  const [expenses,setExpenses]=useState(INIT_EXPENSES);
  const nextXID=()=>`X${pad(expenses.length+1,3)}`;
  const [showType,setShowType]=useState('both');
  const [period,setPeriod]=useState('month');
  const [year,setYear]=useState(new Date().getFullYear().toString());
  const [month,setMonth]=useState(String(new Date().getMonth()+1).padStart(2,'0'));
  const [fromDate,setFromDate]=useState('');
  const [toDate,setToDate]=useState('');
  const [addForm,setAddForm]=useState(null);
  const [editForm,setEditForm]=useState(null);

  // Compute date range
  const getRange=()=>{
    const d=new Date();
    if(period==='today') return [today,today];
    if(period==='week') return getWeekBounds(d);
    if(period==='month') return [`${year}-${month}-01`,`${year}-${month}-31`];
    if(period==='quarter') return getQuarterBounds(d);
    if(period==='year') return [`${year}-01-01`,`${year}-12-31`];
    return [fromDate||'2000-01-01',toDate||'2099-12-31'];
  };
  const [r0,r1]=getRange();
  const inRange=(d)=>d>=r0&&d<=r1;

  const filtIncome=receipts.filter(r=>inRange(r.date));
  const filtExp=expenses.filter(e=>inRange(e.date));
  const totalIncome=filtIncome.reduce((s,r)=>s+r.items.reduce((t,i)=>t+i.qty*i.price,0)-r.discount,0);
  const totalExpense=filtExp.reduce((s,e)=>s+e.amount,0);
  const netProfit=totalIncome-totalExpense;

  const saveExp=(f)=>{
    if(f.id&&expenses.find(e=>e.id===f.id)){setExpenses(prev=>prev.map(e=>e.id===f.id?f:e));}
    else{setExpenses(prev=>[...prev,{...f,id:nextXID()}]);}
    setAddForm(null);setEditForm(null);
  };
  const delExp=(id)=>{if(window.confirm('ยืนยันลบรายการนี้?'))setExpenses(prev=>prev.filter(e=>e.id!==id));};

  const PERIODS=[
    {k:'today',l:'วันนี้'},{k:'week',l:'สัปดาห์นี้'},{k:'month',l:'เดือนนี้'},
    {k:'quarter',l:'ไตรมาสนี้'},{k:'year',l:'ปีนี้'},{k:'custom',l:'กำหนดเอง'},
  ];

  // Build combined ledger rows for display
  const allRows=[];
  if(showType!=='expense') filtIncome.forEach(r=>{
    const tot=r.items.reduce((s,i)=>s+i.qty*i.price,0)-r.discount;
    allRows.push({type:'income',date:r.date,id:r.id,desc:`ใบเสร็จ ${r.id} — ${r.patname||'HN:'+r.hn}`,category:'ค่าตรวจรักษา',income:tot,expense:0});
  });
  if(showType!=='income') filtExp.forEach(e=>{
    allRows.push({type:'expense',date:e.date,id:e.id,desc:e.desc,category:e.category,income:0,expense:e.amount,expObj:e});
  });
  allRows.sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>💼 บัญชีรายรับ-รายจ่าย</h2>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="btn btn-print btn-sm no-print" onClick={()=>doPrint('accounting-report','รายงานบัญชีรายรับ-รายจ่าย')}>🖨️ พิมพ์รายงาน</button>
          <button className="btn btn-accent btn-sm" onClick={()=>setAddForm({date:today,category:'เวชภัณฑ์/ยา',desc:'',amount:0})}>+ เพิ่มรายจ่าย</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card no-print" style={{marginBottom:14}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
          <span style={{fontWeight:600,fontSize:13}}>ช่วงเวลา:</span>
          {PERIODS.map(p=><button key={p.k} className={`btn btn-sm ${period===p.k?'btn-primary':'btn-outline'}`} onClick={()=>setPeriod(p.k)}>{p.l}</button>)}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'flex-end'}}>
          {(period==='month'||period==='year')&&<div><label>ปี (ค.ศ.)</label><input value={year} onChange={e=>setYear(e.target.value)} style={{width:90}} /></div>}
          {period==='month'&&<div><label>เดือน (01-12)</label><input value={month} onChange={e=>setMonth(e.target.value.padStart(2,'0'))} style={{width:80}} /></div>}
          {period==='custom'&&<><div><label>ตั้งแต่วันที่</label><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:160}} /></div><div><label>ถึงวันที่</label><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:160}} /></div></>}
          <div><label>แสดง</label>
            <select value={showType} onChange={e=>setShowType(e.target.value)} style={{width:180}}>
              <option value="both">รายรับและรายจ่าย</option>
              <option value="income">รายรับอย่างเดียว</option>
              <option value="expense">รายจ่ายอย่างเดียว</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit expense form */}
      {(addForm||editForm)&&(
        <div className="card no-print" style={{marginBottom:14,background:'#fff8f0',border:'1.5px solid var(--warning)'}}>
          <div style={{fontWeight:700,color:'var(--warning)',marginBottom:10}}>{editForm?'✏️ แก้ไขรายจ่าย':'+ เพิ่มรายจ่ายใหม่'}</div>
          {(()=>{
            const ef=editForm||addForm;
            const setEf=editForm?setEditForm:setAddForm;
            return (
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
                  <div><label>วันที่</label><input type="date" value={ef.date} onChange={e=>setEf(p=>({...p,date:e.target.value}))} /></div>
                  <div><label>หมวดหมู่</label>
                    <select value={ef.category} onChange={e=>setEf(p=>({...p,category:e.target.value}))}>
                      {EXP_CATS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{gridColumn:'span 2'}}><label>รายละเอียด</label><input value={ef.desc} onChange={e=>setEf(p=>({...p,desc:e.target.value}))} /></div>
                  <div><label>จำนวนเงิน (บาท)</label><input type="number" value={ef.amount} onChange={e=>setEf(p=>({...p,amount:Number(e.target.value)}))} /></div>
                </div>
                <div style={{textAlign:'right',marginTop:10,display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button className="btn btn-gray btn-sm" onClick={()=>{setAddForm(null);setEditForm(null);}}>ยกเลิก</button>
                  <button className="btn btn-sm" style={{background:'var(--warning)',color:'#fff'}} onClick={()=>saveExp(ef)}>💾 บันทึก</button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Report — printable */}
      <div id="accounting-report">
        <div style={{display:'none'}} className="print-only">
          <ClinicHeader />
          <div style={{textAlign:'center',fontWeight:700,fontSize:14,marginBottom:4}}>รายงานบัญชีรายรับ-รายจ่าย</div>
          <div style={{textAlign:'center',fontSize:12,color:'#666',marginBottom:12}}>{r0===r1?thaiDate(r0):`${thaiDate(r0)} — ${thaiDate(r1)}`}</div>
        </div>

        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:16}}>
          {showType!=='expense'&&<div className="card" style={{textAlign:'center',border:'2px solid var(--accent)'}}>
            <div style={{fontSize:11,color:'var(--accent)',fontWeight:700,marginBottom:4}}>💰 รายรับรวม</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--accent)'}}>{totalIncome.toLocaleString()}</div>
            <div style={{fontSize:11,color:'var(--gray)'}}>บาท ({filtIncome.length} รายการ)</div>
          </div>}
          {showType!=='income'&&<div className="card" style={{textAlign:'center',border:'2px solid var(--danger)'}}>
            <div style={{fontSize:11,color:'var(--danger)',fontWeight:700,marginBottom:4}}>💸 รายจ่ายรวม</div>
            <div style={{fontSize:22,fontWeight:700,color:'var(--danger)'}}>{totalExpense.toLocaleString()}</div>
            <div style={{fontSize:11,color:'var(--gray)'}}>บาท ({filtExp.length} รายการ)</div>
          </div>}
          {showType==='both'&&<div className="card" style={{textAlign:'center',border:`2.5px solid ${netProfit>=0?'var(--accent)':'var(--danger)'}`}}>
            <div style={{fontSize:11,color:netProfit>=0?'var(--accent)':'var(--danger)',fontWeight:700,marginBottom:4}}>{netProfit>=0?'📈':'📉'} กำไรสุทธิ</div>
            <div style={{fontSize:22,fontWeight:700,color:netProfit>=0?'var(--accent)':'var(--danger)'}}>{netProfit.toLocaleString()}</div>
            <div style={{fontSize:11,color:'var(--gray)'}}>บาท</div>
          </div>}
        </div>

        {/* Ledger table */}
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'var(--primary)',color:'#fff'}}>
                <th style={{padding:'9px 12px',textAlign:'left',width:100}}>วันที่</th>
                <th style={{padding:'9px 12px',textAlign:'left',width:70}}>ประเภท</th>
                <th style={{padding:'9px 12px',textAlign:'left'}}>รายละเอียด</th>
                <th style={{padding:'9px 12px',textAlign:'left',width:130}}>หมวดหมู่</th>
                {showType!=='expense'&&<th style={{padding:'9px 12px',textAlign:'right',width:110}}>รายรับ (฿)</th>}
                {showType!=='income'&&<th style={{padding:'9px 12px',textAlign:'right',width:110}}>รายจ่าย (฿)</th>}
                <th style={{padding:'9px 8px',width:80}} className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {allRows.length===0&&<tr><td colSpan={7} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูลในช่วงเวลาที่เลือก</td></tr>}
              {allRows.map((row,i)=>(
                <tr key={row.id+i} style={{background:row.type==='income'?'#f0fdf4':i%2===0?'#fff8f7':'#fff2f2'}}>
                  <td style={{padding:'8px 12px',fontSize:12}}>{thaiDate(row.date)}</td>
                  <td style={{padding:'8px 12px'}}>{row.type==='income'?<span className="tag tag-green">รายรับ</span>:<span className="tag tag-red">รายจ่าย</span>}</td>
                  <td style={{padding:'8px 12px',fontSize:12}}>{row.desc}</td>
                  <td style={{padding:'8px 12px'}}><span className="tag tag-blue">{row.category}</span></td>
                  {showType!=='expense'&&<td style={{padding:'8px 12px',textAlign:'right',fontWeight:row.income>0?700:400,color:row.income>0?'var(--accent)':'#ccc'}}>{row.income>0?row.income.toLocaleString():'-'}</td>}
                  {showType!=='income'&&<td style={{padding:'8px 12px',textAlign:'right',fontWeight:row.expense>0?700:400,color:row.expense>0?'var(--danger)':'#ccc'}}>{row.expense>0?row.expense.toLocaleString():'-'}</td>}
                  <td style={{padding:'8px 8px'}} className="no-print">
                    {row.type==='expense'&&<div style={{display:'flex',gap:3}}>
                      <button className="btn btn-outline btn-sm" style={{padding:'3px 8px',fontSize:11}} onClick={()=>setEditForm({...row.expObj})}>แก้</button>
                      <button className="btn btn-danger btn-sm" style={{padding:'3px 8px',fontSize:11}} onClick={()=>delExp(row.id)}>ลบ</button>
                    </div>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{background:'#1a5276',color:'#fff',fontWeight:700,fontSize:13}}>
                <td colSpan={showType==='both'?3:3} style={{padding:'9px 12px'}}>รวมทั้งหมด ({allRows.length} รายการ)</td>
                <td style={{padding:'9px 12px'}}></td>
                {showType!=='expense'&&<td style={{padding:'9px 12px',textAlign:'right'}}>{totalIncome.toLocaleString()}</td>}
                {showType!=='income'&&<td style={{padding:'9px 12px',textAlign:'right'}}>{totalExpense.toLocaleString()}</td>}
                {showType==='both'&&<td style={{padding:'9px 8px',textAlign:'right',fontSize:11}} className="no-print">กำไร: {netProfit.toLocaleString()}</td>}
                {showType!=='both'&&<td className="no-print"></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===================== PHARMACY PAGE =====================
function PharmacyPage({medicines,saveMedicine,deleteMedicine,receipts,treatmentServices,saveTreatmentService,deleteTreatmentService}) {
  const [search,setSearch]=useState('');
  const [cat,setCat]=useState('ทั้งหมด');
  const [tab,setTab]=useState('stock');
  const [edit,setEdit]=useState(null);
  const [adding,setAdding]=useState(false);
  const [newMed,setNewMed]=useState({name:'',unit:'เม็ด',stock:0,price:0,cost:0,expire:'',category:'ยาแก้ปวด/ลดไข้',minstock:50});
  // Treatment services tab state
  const [svcEdit,setSvcEdit]=useState(null);
  const [svcAdding,setSvcAdding]=useState(false);
  const SVC_CATS=['ค่าตรวจ','ค่าหัตถการ','ค่าตรวจพิเศษ','เอกสาร','อื่นๆ'];
  const saveService=async(f)=>{
    const svc=f.id?f:{...f,id:'S'+pad((treatmentServices||[]).length+1,3),active:true};
    await saveTreatmentService(svc);
    setSvcEdit(null);setSvcAdding(false);
  };
  const delService=async(id)=>{if(window.confirm('ยืนยันลบรายการหัตถการ?'))await deleteTreatmentService(id);};
  const toggleActive=async(id)=>{
    const svc=(treatmentServices||[]).find(s=>s.id===id);
    if(svc) await saveTreatmentService({...svc,active:!svc.active});
  };
  const cats=['ทั้งหมด',...new Set(medicines.map(m=>m.category))];
  const filtered=medicines.filter(m=>{
    const q=search.toLowerCase();
    const match=m.name.toLowerCase().includes(q)||m.id.toLowerCase().includes(q);
    const catMatch=cat==='ทั้งหมด'||m.category===cat;
    return match&&catMatch;
  });
  const lowStock=medicines.filter(m=>m.stock<=m.minstock);
  const expireSoon=medicines.filter(m=>(new Date(m.expire)-new Date())/(1000*60*60*24)<90);

  const saveMed=async(f)=>{
    const med=f.id?f:{...f,id:'M'+pad(medicines.length+1,3)};
    await saveMedicine(med);
    setEdit(null);setAdding(false);
  };
  const delMed=async(id)=>{if(window.confirm('ยืนยันลบ?'))await deleteMedicine(id);};

  // Consumption report
  const consumed={};
  receipts.forEach(r=>r.items.forEach(it=>{
    const med=medicines.find(m=>it.desc.includes(m.name));
    if(med){if(!consumed[med.id])consumed[med.id]={name:med.name,qty:0,revenue:0};consumed[med.id].qty+=it.qty;consumed[med.id].revenue+=it.qty*it.price;}
  }));

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <h2 style={{fontWeight:700,fontSize:18,color:'var(--primary)'}}>💊 คลังยาและเวชภัณฑ์</h2>
        <div style={{marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap'}}>
          <button className={`btn btn-sm ${tab==='stock'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('stock')}>📦 สต๊อกยา</button>
          <button onClick={()=>setTab('services')}
            style={{padding:'5px 12px',fontSize:12,fontWeight:600,border:'none',borderRadius:6,cursor:'pointer',fontFamily:'inherit',background:tab==='services'?'#1e8449':'transparent',color:tab==='services'?'#fff':'#1e8449',boxShadow:tab==='services'?'none':'inset 0 0 0 1.5px #1e8449'}}>
            🏥 รายการหัตถการ
          </button>
          <button className={`btn btn-sm ${tab==='report'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('report')}>📊 รายงาน</button>
          {tab==='stock'&&<button className="btn btn-accent btn-sm" onClick={()=>setAdding(true)}>+ เพิ่มรายการยา</button>}
          {tab==='services'&&<button onClick={()=>setSvcAdding(true)} style={{padding:'5px 12px',fontSize:12,fontWeight:700,border:'none',borderRadius:6,cursor:'pointer',fontFamily:'inherit',background:'#1e8449',color:'#fff'}}>+ เพิ่มรายการหัตถการ</button>}
        </div>
      </div>
      {/* Alerts */}
      {(lowStock.length>0||expireSoon.length>0)&&(
        <div className="card" style={{marginBottom:12,background:'#fff8f0',border:'1.5px solid var(--warning)'}}>
          <div style={{fontWeight:700,color:'var(--warning)',marginBottom:8}}>⚠️ แจ้งเตือน</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {lowStock.map(m=><div key={m.id+'l'} style={{background:'var(--danger-pale)',borderRadius:5,padding:'3px 10px',fontSize:12,color:'var(--danger)'}}><b>{m.name}</b> เหลือ {m.stock} {m.unit} (min: {m.minstock})</div>)}
            {expireSoon.map(m=><div key={m.id+'e'} style={{background:'var(--warning-pale)',borderRadius:5,padding:'3px 10px',fontSize:12,color:'var(--warning)'}}><b>{m.name}</b> หมดอายุ {thaiDate(m.expire)}</div>)}
          </div>
        </div>
      )}
      {tab==='stock'&&(
        <div>
          <div className="card" style={{marginBottom:12}}>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 ค้นหายา" style={{maxWidth:220}} />
              <select value={cat} onChange={e=>setCat(e.target.value)} style={{width:180}}>
                {cats.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          {(adding||(edit&&!edit.id))&&(
            <MedForm form={adding?newMed:edit} onSave={saveMed} onCancel={()=>{setAdding(false);setEdit(null);}} isNew={adding} />
          )}
          {edit&&edit.id&&(
            <MedForm form={edit} onSave={saveMed} onCancel={()=>setEdit(null)} />
          )}
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'var(--primary)',color:'#fff'}}>
                  <th style={{padding:'9px 10px',textAlign:'left'}}>รหัส</th>
                  <th style={{padding:'9px 10px',textAlign:'left'}}>ชื่อยา/เวชภัณฑ์</th>
                  <th style={{padding:'9px 10px',textAlign:'left'}}>หมวดหมู่</th>
                  <th style={{padding:'9px 10px',textAlign:'center'}}>สต๊อก</th>
                  <th style={{padding:'9px 10px',textAlign:'center'}}>หน่วย</th>
                  <th style={{padding:'9px 10px',textAlign:'right'}}>ราคาขาย</th>
                  <th style={{padding:'9px 10px',textAlign:'right'}}>ราคาทุน</th>
                  <th style={{padding:'9px 10px',textAlign:'left'}}>วันหมดอายุ</th>
                  <th style={{padding:'9px 10px'}}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0&&<tr><td colSpan={9} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่พบข้อมูล</td></tr>}
                {filtered.map((m,i)=>{
                  const expDays=(new Date(m.expire)-new Date())/(1000*60*60*24);
                  const isLow=m.stock<=m.minstock;
                  const isExp=expDays<90;
                  return (
                    <tr key={m.id} style={{background:isLow?'#fff0f0':isExp?'#fffaf0':i%2===0?'#fff':'var(--gray-pale)'}}>
                      <td style={{padding:'7px 10px',fontWeight:700,color:'var(--primary)'}}>{m.id}</td>
                      <td style={{padding:'7px 10px',fontWeight:600}}>{m.name}</td>
                      <td style={{padding:'7px 10px'}}><span className="tag tag-blue">{m.category}</span></td>
                      <td style={{padding:'7px 10px',textAlign:'center',fontWeight:700,color:isLow?'var(--danger)':'var(--accent)'}}>
                        {m.stock} {isLow&&<span style={{fontSize:10}}>⚠️</span>}
                      </td>
                      <td style={{padding:'7px 10px',textAlign:'center'}}>{m.unit}</td>
                      <td style={{padding:'7px 10px',textAlign:'right'}}>{m.price.toLocaleString()}</td>
                      <td style={{padding:'7px 10px',textAlign:'right',color:'var(--gray)'}}>{m.cost.toLocaleString()}</td>
                      <td style={{padding:'7px 10px',color:isExp?'var(--warning)':''}}>{thaiDate(m.expire)}{isExp&&<span style={{fontSize:10}}> ⚠️</span>}</td>
                      <td style={{padding:'7px 10px',display:'flex',gap:4}}>
                        <button className="btn btn-outline btn-sm" onClick={()=>setEdit({...m})}>แก้ไข</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>delMed(m.id)}>ลบ</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='services'&&(
        <div>
          {/* Add/Edit Service Form */}
          {(svcAdding||svcEdit)&&(
            <ServiceForm
              form={svcEdit||{name:'',category:'ค่าตรวจ',price:300,unit:'ครั้ง',active:true}}
              isNew={!svcEdit}
              cats={SVC_CATS}
              onSave={saveService}
              onCancel={()=>{setSvcAdding(false);setSvcEdit(null);}}
            />
          )}
          {/* Info banner */}
          <div style={{background:'#e8f8f0',border:'1px solid #a8d5c8',borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:12,color:'#1e8449'}}>
            💡 รายการที่ <b>เปิดใช้งาน</b> จะแสดงในกล่องสั่งหัตถการตอนตรวจรักษา | รายการ <b>ปิดใช้งาน</b> จะซ่อนไว้แต่ไม่ถูกลบออก
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#1e8449',color:'#fff'}}>
                  <th style={{padding:'9px 12px',textAlign:'left',width:70}}>รหัส</th>
                  <th style={{padding:'9px 12px',textAlign:'left'}}>ชื่อรายการ</th>
                  <th style={{padding:'9px 12px',textAlign:'left',width:110}}>หมวดหมู่</th>
                  <th style={{padding:'9px 12px',textAlign:'right',width:90}}>ราคา (฿)</th>
                  <th style={{padding:'9px 12px',textAlign:'left',width:60}}>หน่วย</th>
                  <th style={{padding:'9px 12px',textAlign:'center',width:95}}>สถานะ</th>
                  <th style={{padding:'9px 12px',width:110}}></th>
                </tr>
              </thead>
              <tbody>
                {(treatmentServices||[]).length===0&&(
                  <tr><td colSpan={7} style={{padding:24,textAlign:'center',color:'var(--gray)'}}>ยังไม่มีรายการ กดปุ่ม "+ เพิ่มรายการหัตถการ" เพื่อเริ่มต้น</td></tr>
                )}
                {(treatmentServices||[]).map((s,i)=>(
                  <tr key={s.id} style={{background:!s.active?'#f8f8f8':i%2===0?'#fff':'#f4fbf7',opacity:s.active?1:0.65}}>
                    <td style={{padding:'8px 12px',fontWeight:700,color:'#1e8449',fontSize:12}}>{s.id}</td>
                    <td style={{padding:'8px 12px',fontWeight:600}}>{s.name}</td>
                    <td style={{padding:'8px 12px'}}><span className="tag tag-green" style={{fontSize:11}}>{s.category}</span></td>
                    <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:'#1a5276'}}>{(s.price||0).toLocaleString()}</td>
                    <td style={{padding:'8px 12px',fontSize:12,color:'#666'}}>{s.unit}</td>
                    <td style={{padding:'8px 12px',textAlign:'center'}}>
                      <button onClick={()=>toggleActive(s.id)}
                        style={{padding:'3px 10px',border:'none',borderRadius:12,cursor:'pointer',fontSize:11,fontWeight:700,fontFamily:'inherit',background:s.active?'#d5f5e3':'#eee',color:s.active?'#1e8449':'#999',transition:'all 0.15s'}}>
                        {s.active?'✅ เปิดใช้':'⏸ ปิดใช้'}
                      </button>
                    </td>
                    <td style={{padding:'8px 12px',display:'flex',gap:4}}>
                      <button className="btn btn-outline btn-sm" onClick={()=>setSvcEdit({...s})}>✏️ แก้ไข</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>delService(s.id)}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='report'&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,color:'var(--primary)',marginBottom:12}}>📊 สรุปการใช้ยา (ทั้งหมด)</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{background:'var(--primary)',color:'#fff'}}>
                <th style={{padding:'9px 14px',textAlign:'left'}}>ชื่อยา</th>
                <th style={{padding:'9px 14px',textAlign:'center'}}>จำนวนที่จ่าย</th>
                <th style={{padding:'9px 14px',textAlign:'right'}}>รายรับ (บาท)</th>
                <th style={{padding:'9px 14px',textAlign:'center'}}>สต๊อกคงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(consumed).length===0&&<tr><td colSpan={4} style={{padding:20,textAlign:'center',color:'var(--gray)'}}>ไม่มีข้อมูล</td></tr>}
              {Object.values(consumed).sort((a,b)=>b.revenue-a.revenue).map((c,i)=>{
                const med=medicines.find(m=>m.name===c.name);
                return (
                  <tr key={i} style={{background:i%2===0?'#fff':'var(--gray-pale)'}}>
                    <td style={{padding:'8px 14px',fontWeight:600}}>{c.name}</td>
                    <td style={{padding:'8px 14px',textAlign:'center'}}>{c.qty}</td>
                    <td style={{padding:'8px 14px',textAlign:'right',color:'var(--accent)',fontWeight:600}}>{c.revenue.toLocaleString()}</td>
                    <td style={{padding:'8px 14px',textAlign:'center'}}>{med?.stock||0} {med?.unit||''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MedForm({form,onSave,onCancel,isNew}) {
  const [f,setF]=useState({...form});
  const up=(k,v)=>setF(prev=>({...prev,[k]:k==='stock'||k==='price'||k==='cost'||k==='minstock'?Number(v):v}));
  const cats=['ยาแก้ปวด/ลดไข้','ยาปฏิชีวนะ','ยาแก้แพ้','ยาระบบทางเดินอาหาร','ยาความดัน','ยาเบาหวาน','ยาหัวใจ','วิตามิน/อาหารเสริม','เวชภัณฑ์/วัสดุสิ้นเปลือง','อื่นๆ'];
  return (
    <div className="card" style={{marginBottom:12,background:'var(--accent-pale)',border:'1.5px solid var(--accent)'}}>
      <div style={{fontWeight:700,color:'var(--accent)',marginBottom:10}}>{isNew?'+ เพิ่มรายการยาใหม่':'✏️ แก้ไขข้อมูลยา'}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
        <div className="col-2"><label>ชื่อยา/เวชภัณฑ์ *</label><input value={f.name} onChange={e=>up('name',e.target.value)} /></div>
        <div><label>หน่วย</label><input value={f.unit} onChange={e=>up('unit',e.target.value)} /></div>
        <div><label>หมวดหมู่</label><select value={f.category} onChange={e=>up('category',e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label>สต๊อกปัจจุบัน</label><input type="number" value={f.stock} onChange={e=>up('stock',e.target.value)} /></div>
        <div><label>สต๊อกขั้นต่ำ (แจ้งเตือน)</label><input type="number" value={f.minstock} onChange={e=>up('minstock',e.target.value)} /></div>
        <div><label>ราคาขาย (บาท/หน่วย)</label><input type="number" value={f.price} onChange={e=>up('price',e.target.value)} /></div>
        <div><label>ราคาทุน (บาท/หน่วย)</label><input type="number" value={f.cost} onChange={e=>up('cost',e.target.value)} /></div>
        <div><label>วันหมดอายุ</label><input type="date" value={f.expire} onChange={e=>up('expire',e.target.value)} /></div>
      </div>
      <div style={{textAlign:'right',marginTop:10,display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn btn-gray btn-sm" onClick={onCancel}>ยกเลิก</button>
        <button className="btn btn-accent btn-sm" onClick={()=>onSave(f)}>💾 บันทึก</button>
      </div>
    </div>
  );
}

function ServiceForm({form,onSave,onCancel,isNew,cats}) {
  const [f,setF]=useState({...form});
  const up=(k,v)=>setF(prev=>({...prev,[k]:k==='price'?Number(v):v}));
  return (
    <div className="card" style={{marginBottom:14,background:'#e8f8f0',border:'2px solid #1e8449'}}>
      <div style={{fontWeight:700,color:'#1e8449',marginBottom:12,fontSize:14}}>{isNew?'➕ เพิ่มรายการหัตถการ / ค่าบริการใหม่':'✏️ แก้ไขรายการหัตถการ'}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:12}}>
        <div style={{gridColumn:'span 2'}}>
          <label>ชื่อรายการ / คำอธิบาย <span style={{color:'var(--danger)'}}>*</span></label>
          <input value={f.name} onChange={e=>up('name',e.target.value)} placeholder="เช่น ค่าตรวจรักษา OPD, ค่าฉีดยา 1 รายการ" />
        </div>
        <div>
          <label>หมวดหมู่</label>
          <select value={f.category} onChange={e=>up('category',e.target.value)}>
            {(cats||['ค่าตรวจ','ค่าหัตถการ','ค่าตรวจพิเศษ','เอกสาร','อื่นๆ']).map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>ราคาปกติ (บาท)</label>
          <input type="number" value={f.price} onChange={e=>up('price',e.target.value)} min={0} />
        </div>
        <div>
          <label>หน่วย</label>
          <input value={f.unit||'ครั้ง'} onChange={e=>up('unit',e.target.value)} placeholder="ครั้ง, ฉบับ, ชุด..." />
        </div>
      </div>
      <div style={{textAlign:'right',marginTop:12,display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button className="btn btn-gray btn-sm" onClick={onCancel}>ยกเลิก</button>
        <button onClick={()=>{if(!f.name.trim()){alert('กรุณาใส่ชื่อรายการ');return;}onSave(f);}}
          style={{padding:'6px 18px',background:'#1e8449',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:700,fontSize:13,fontFamily:'inherit'}}>
          💾 บันทึก
        </button>
      </div>
    </div>
  );
}

// ===================== SHARED COMPONENTS =====================
function ClinicHeader() {
  return (
    <div style={{textAlign:'center',marginBottom:10,paddingBottom:10,borderBottom:'2px solid var(--primary)'}}>
      <div style={{fontWeight:700,fontSize:16,color:'var(--primary)',letterSpacing:0.5}}>{CLINIC_NAME}</div>
      <div style={{fontSize:11,color:'var(--gray)',marginTop:2}}>{CLINIC_ADDRESS}</div>
      <div style={{fontSize:11,color:'var(--gray)'}}>โทร. {CLINIC_TEL}</div>
    </div>
  );
}

function DoctorSignature() {
  return (
    <div style={{display:'flex',justifyContent:'flex-end',marginTop:24}}>
      <div style={{textAlign:'center',minWidth:220}}>
        <div style={{borderBottom:'1px solid #999',marginBottom:4,height:40}}></div>
        <div style={{fontWeight:700,fontSize:13}}>{DOCTOR_NAME}</div>
        <div style={{fontSize:12,color:'var(--gray)'}}>{DOCTOR_TITLE}</div>
        <div style={{fontSize:12,color:'var(--gray)'}}>ใบอนุญาตประกอบวิชาชีพเวชกรรม เลขที่ {DOCTOR_LICENSE}</div>
      </div>
    </div>
  );
}

function Modal({title,onClose,children,width=600}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:'#fff',borderRadius:'12px',boxShadow:'0 8px 40px rgba(0,0,0,0.25)',width:'100%',maxWidth:width,maxHeight:'90vh',overflow:'auto',padding:24,position:'relative'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:15,color:'var(--primary)'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--gray)',lineHeight:1}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

