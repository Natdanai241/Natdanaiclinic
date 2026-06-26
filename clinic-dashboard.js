const { useState, useEffect, useRef } = React;
const SUPA_URL = "https://ggshgsyoytrkbnepsryu.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnc2hnc3lveXRya2JuZXBzcnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODQ5NjEsImV4cCI6MjA5NzI2MDk2MX0.hH0ERaYGLueEtxjW8dNVs0d3q3IugCglxc2vlyLoXYQ";
const supa = {
  headers: { "apikey": SUPA_KEY, "Authorization": `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" },
  // ── Generic fetch all rows from a table
  async getAll(table) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?order=created_at.asc`, { headers: this.headers });
    if (!r.ok) {
      console.error(`getAll ${table}:`, await r.text());
      return null;
    }
    return r.json();
  },
  // ── Upsert (insert or update by primary key)
  async upsert(table, data) {
    const body = Array.isArray(data) ? data : [data];
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      console.error(`upsert ${table}:`, await r.text());
      return null;
    }
    return r.json();
  },
  // ── Delete by primary key
  async delete(table, pkCol, pkVal) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
      method: "DELETE",
      headers: this.headers
    });
    if (!r.ok) {
      console.error(`delete ${table}:`, await r.text());
      return false;
    }
    return true;
  },
  // ── Patch (partial update) by pk
  async patch(table, pkCol, pkVal, data) {
    const r = await fetch(`${SUPA_URL}/rest/v1/${table}?${pkCol}=eq.${pkVal}`, {
      method: "PATCH",
      headers: { ...this.headers, "Prefer": "return=representation" },
      body: JSON.stringify(data)
    });
    if (!r.ok) {
      console.error(`patch ${table}:`, await r.text());
      return null;
    }
    return r.json();
  }
};
const fromDbVisit = (r) => r ? {
  id: r.id,
  hn: r.hn,
  date: r.date,
  cc: r.cc,
  pi: r.pi,
  pe: r.pe,
  dx: r.dx,
  tx: r.tx,
  note: r.note,
  nurse: r.nurse,
  bp: r.bp,
  pr: r.pr,
  rr: r.rr,
  temp: r.temp,
  o2: r.o2,
  weight: r.weight,
  height: r.height,
  drugs: Array.isArray(r.drugs) ? r.drugs : r.drugs ? JSON.parse(r.drugs) : [],
  services: Array.isArray(r.services) ? r.services : r.services ? JSON.parse(r.services) : [],
  // status: 'รอตรวจ' | 'ตรวจเสร็จ' — legacy rows without status treated as done
  status: r.status || (r.dx || r.pe ? "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08" : "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08"),
  queueNo: r.queue_no || ""
} : null;
const toDbVisit = (v) => ({
  id: v.id,
  hn: v.hn,
  date: v.date,
  cc: v.cc || "",
  pi: v.pi || "",
  pe: v.pe || "",
  dx: v.dx || "",
  tx: v.tx || "",
  note: v.note || "",
  nurse: v.nurse || "",
  bp: v.bp || "",
  pr: v.pr || "",
  rr: v.rr || "",
  temp: v.temp || "",
  o2: v.o2 || "",
  weight: v.weight || "",
  height: v.height || "",
  drugs: v.drugs || [],
  services: v.services || [],
  status: v.status || "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08",
  queue_no: v.queueNo || ""
});
const fromDbReceipt = (r) => r ? {
  id: r.id,
  hn: r.hn,
  visitId: r.visit_id,
  patname: r.patname,
  date: r.date,
  items: Array.isArray(r.items) ? r.items : r.items ? JSON.parse(r.items) : [],
  discount: r.discount || 0,
  paid: r.paid || "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14",
  status: r.status || "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"
} : null;
const toDbReceipt = (r) => ({
  id: r.id,
  hn: r.hn,
  visit_id: r.visitId || "",
  patname: r.patname || "",
  date: r.date,
  items: r.items || [],
  discount: r.discount || 0,
  paid: r.paid || "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14",
  status: r.status || "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"
});
const fromDbAppointment = (r) => r ? {
  id: r.id,
  hn: r.hn,
  patname: r.patname,
  date: r.date,
  time: r.time,
  reason: r.reason,
  status: r.status,
  note: r.note || ""
} : null;
const fromDbService = (r) => r ? {
  id: r.id,
  name: r.name,
  category: r.category,
  price: r.price,
  unit: r.unit,
  active: r.active
} : null;
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
const pad = (n, z = 6) => String(n).padStart(z, "0");
const today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
const thaiDate = (d) => {
  if (!d) return "";
  const dt = /* @__PURE__ */ new Date(d + "T00:00:00");
  const th = ["\u0E21.\u0E04.", "\u0E01.\u0E1E.", "\u0E21\u0E35.\u0E04.", "\u0E40\u0E21.\u0E22.", "\u0E1E.\u0E04.", "\u0E21\u0E34.\u0E22.", "\u0E01.\u0E04.", "\u0E2A.\u0E04.", "\u0E01.\u0E22.", "\u0E15.\u0E04.", "\u0E1E.\u0E22.", "\u0E18.\u0E04."];
  return `${dt.getDate()} ${th[dt.getMonth()]} ${dt.getFullYear() + 543}`;
};
const thaiDateFull = (d) => {
  if (!d) return "";
  const dt = /* @__PURE__ */ new Date(d + "T00:00:00");
  const days = ["\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C", "\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C", "\u0E2D\u0E31\u0E07\u0E04\u0E32\u0E23", "\u0E1E\u0E38\u0E18", "\u0E1E\u0E24\u0E2B\u0E31\u0E2A\u0E1A\u0E14\u0E35", "\u0E28\u0E38\u0E01\u0E23\u0E4C", "\u0E40\u0E2A\u0E32\u0E23\u0E4C"];
  const months = ["\u0E21\u0E01\u0E23\u0E32\u0E04\u0E21", "\u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C", "\u0E21\u0E35\u0E19\u0E32\u0E04\u0E21", "\u0E40\u0E21\u0E29\u0E32\u0E22\u0E19", "\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21", "\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19", "\u0E01\u0E23\u0E01\u0E0E\u0E32\u0E04\u0E21", "\u0E2A\u0E34\u0E07\u0E2B\u0E32\u0E04\u0E21", "\u0E01\u0E31\u0E19\u0E22\u0E32\u0E22\u0E19", "\u0E15\u0E38\u0E25\u0E32\u0E04\u0E21", "\u0E1E\u0E24\u0E28\u0E08\u0E34\u0E01\u0E32\u0E22\u0E19", "\u0E18\u0E31\u0E19\u0E27\u0E32\u0E04\u0E21"];
  return `\u0E27\u0E31\u0E19${days[dt.getDay()]}\u0E17\u0E35\u0E48 ${dt.getDate()} ${months[dt.getMonth()]} \u0E1E.\u0E28. ${dt.getFullYear() + 543}`;
};
const getWeekBounds = (d = /* @__PURE__ */ new Date()) => {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setDate(diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return [mon.toISOString().split("T")[0], sun.toISOString().split("T")[0]];
};
const getQuarterBounds = (d = /* @__PURE__ */ new Date()) => {
  const q = Math.floor(d.getMonth() / 3);
  const y = d.getFullYear();
  const s = new Date(y, q * 3, 1);
  const e = new Date(y, q * 3 + 3, 0);
  return [s.toISOString().split("T")[0], e.toISOString().split("T")[0]];
};
const doPrint = (elementId, title = "") => {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }
  const win = window.open("", "_blank", "width=850,height=950");
  win.document.write(`<!DOCTYPE html><html><head><title>${title || CLINIC_NAME}</title>
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
  setTimeout(() => {
    win.focus();
    win.print();
  }, 600);
};
const CLINIC_NAME = "\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E13\u0E31\u0E10\u0E14\u0E19\u0E31\u0E22";
const CLINIC_ADDRESS = "101/2 \u0E2B\u0E21\u0E39\u0E48 12, \u0E15\u0E33\u0E1A\u0E25\u0E42\u0E1B\u0E48\u0E07\u0E1C\u0E32, \u0E2D\u0E33\u0E40\u0E20\u0E2D\u0E41\u0E21\u0E48\u0E2A\u0E32\u0E22, \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E23\u0E32\u0E22, 57130";
const CLINIC_TEL = "087-7876651";
const CLINIC_LOGO = "data:image/png;base64,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";
const DOCTOR_NAME = "\u0E19\u0E32\u0E22\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E13\u0E31\u0E10\u0E14\u0E19\u0E31\u0E22 \u0E21\u0E30\u0E25\u0E34\u0E27\u0E31\u0E19";
const DOCTOR_TITLE = "\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E40\u0E09\u0E1E\u0E32\u0E30\u0E17\u0E32\u0E07\u0E40\u0E27\u0E0A\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27";
const DOCTOR_LICENSE = "\u0E27.53359";
const SAMPLE_PATIENTS = [
  { hn: "000001", prefix: "\u0E19\u0E32\u0E22", fname: "\u0E2A\u0E21\u0E0A\u0E32\u0E22", lname: "\u0E43\u0E08\u0E14\u0E35", gender: "\u0E0A\u0E32\u0E22", dob: "1980-05-10", idcard: "3500100000001", tel: "0812345678", address: "123 \u0E21.1 \u0E15.\u0E40\u0E27\u0E35\u0E22\u0E07 \u0E2D.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E41\u0E2A\u0E19 \u0E08.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E23\u0E32\u0E22", bloodtype: "O", allergy: "Amoxicillin", chronic: "\u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19, \u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19\u0E42\u0E25\u0E2B\u0E34\u0E15\u0E2A\u0E39\u0E07", currentmed: "Metformin 500mg, Amlodipine 5mg", createdAt: "2025-01-10" },
  { hn: "000002", prefix: "\u0E19\u0E32\u0E07", fname: "\u0E2A\u0E21\u0E2B\u0E0D\u0E34\u0E07", lname: "\u0E23\u0E31\u0E01\u0E14\u0E35", gender: "\u0E2B\u0E0D\u0E34\u0E07", dob: "1975-08-22", idcard: "3500100000002", tel: "0823456789", address: "456 \u0E21.2 \u0E15.\u0E1A\u0E49\u0E32\u0E19\u0E41\u0E0B\u0E27 \u0E2D.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E41\u0E2A\u0E19 \u0E08.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E23\u0E32\u0E22", bloodtype: "A", allergy: "-", chronic: "\u0E44\u0E17\u0E23\u0E2D\u0E22\u0E14\u0E4C", currentmed: "Levothyroxine 50mcg", createdAt: "2025-01-15" },
  { hn: "000003", prefix: "\u0E40\u0E14\u0E47\u0E01\u0E0A\u0E32\u0E22", fname: "\u0E21\u0E32\u0E19\u0E30", lname: "\u0E2A\u0E38\u0E02\u0E2A\u0E21", gender: "\u0E0A\u0E32\u0E22", dob: "2015-03-01", idcard: "3500100000003", tel: "0834567890", address: "789 \u0E21.3 \u0E15.\u0E42\u0E22\u0E19\u0E01 \u0E2D.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E41\u0E2A\u0E19 \u0E08.\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E23\u0E32\u0E22", bloodtype: "B", allergy: "-", chronic: "-", currentmed: "-", createdAt: "2025-02-01" }
];
const SAMPLE_VISITS = [
  { id: "V001", hn: "000001", date: "2025-06-01", cc: "\u0E44\u0E02\u0E49 \u0E1B\u0E27\u0E14\u0E28\u0E35\u0E23\u0E29\u0E30 2 \u0E27\u0E31\u0E19", pi: "\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E21\u0E35\u0E44\u0E02\u0E49\u0E2A\u0E39\u0E07 38.5\xB0C \u0E1B\u0E27\u0E14\u0E28\u0E35\u0E23\u0E29\u0E30 \u0E19\u0E49\u0E33\u0E21\u0E39\u0E01\u0E44\u0E2B\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E2D \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E2B\u0E19\u0E37\u0E48\u0E2D\u0E22\u0E2B\u0E2D\u0E1A", pe: "T 38.5\xB0C, PR 88/min, RR 18/min, BP 130/80 mmHg\nGA: \u0E21\u0E35\u0E44\u0E02\u0E49 \u0E44\u0E21\u0E48\u0E0B\u0E35\u0E14 \u0E44\u0E21\u0E48\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07\nENT: \u0E04\u0E2D\u0E41\u0E14\u0E07\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E15\u0E48\u0E2D\u0E21\u0E17\u0E2D\u0E19\u0E0B\u0E34\u0E25\u0E44\u0E21\u0E48\u0E42\u0E15\nLung: clear", dx: "URI (J069)", tx: "Paracetamol 500mg #20 tab, Loratadine 10mg #10 tab, \u0E19\u0E31\u0E14\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21 1 \u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C", bp: "130/80", pr: "88", rr: "18", temp: "38.5", o2: "98", weight: "72", height: "168", nurse: "\u0E2A\u0E21\u0E43\u0E08", createdAt: "2025-06-01" },
  { id: "V002", hn: "000002", date: "2025-06-03", cc: "\u0E1B\u0E27\u0E14\u0E17\u0E49\u0E2D\u0E07 \u0E04\u0E25\u0E37\u0E48\u0E19\u0E44\u0E2A\u0E49 1 \u0E27\u0E31\u0E19", pi: "\u0E1B\u0E27\u0E14\u0E17\u0E49\u0E2D\u0E07\u0E1A\u0E23\u0E34\u0E40\u0E27\u0E13\u0E22\u0E2D\u0E14\u0E2D\u0E01 \u0E04\u0E25\u0E37\u0E48\u0E19\u0E44\u0E2A\u0E49 \u0E44\u0E21\u0E48\u0E2D\u0E32\u0E40\u0E08\u0E35\u0E22\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E44\u0E02\u0E49", pe: "T 37.0\xB0C, PR 76/min, BP 120/75 mmHg\nAbdomen: soft, mild epigastric tenderness", dx: "Gastritis (K29.7)", tx: "Omeprazole 20mg #14 cap, Domperidone 10mg #15 tab", bp: "120/75", pr: "76", rr: "16", temp: "37.0", o2: "99", weight: "58", height: "160", nurse: "\u0E2A\u0E21\u0E43\u0E08", createdAt: "2025-06-03" }
];
const SAMPLE_APPOINTS = [
  { id: "A001", hn: "000001", patname: "\u0E19\u0E32\u0E22\u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E43\u0E08\u0E14\u0E35", date: "2025-06-15", time: "09:00", reason: "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E2D\u0E32\u0E01\u0E32\u0E23 URI / \u0E15\u0E23\u0E27\u0E08\u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19", status: "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", note: "" },
  { id: "A002", hn: "000002", patname: "\u0E19\u0E32\u0E07\u0E2A\u0E21\u0E2B\u0E0D\u0E34\u0E07 \u0E23\u0E31\u0E01\u0E14\u0E35", date: "2025-06-15", time: "10:30", reason: "\u0E15\u0E23\u0E27\u0E08\u0E44\u0E17\u0E23\u0E2D\u0E22\u0E14\u0E4C\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E1B\u0E35", status: "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", note: "" },
  { id: "A003", hn: "000003", patname: "\u0E40\u0E14\u0E47\u0E01\u0E0A\u0E32\u0E22\u0E21\u0E32\u0E19\u0E30 \u0E2A\u0E38\u0E02\u0E2A\u0E21", date: "2025-06-18", time: "14:00", reason: "\u0E09\u0E35\u0E14\u0E27\u0E31\u0E04\u0E0B\u0E35\u0E19", status: "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", note: "" }
];
const SAMPLE_RECEIPTS = [
  { id: "R001", hn: "000001", visitId: "V001", patname: "\u0E19\u0E32\u0E22\u0E2A\u0E21\u0E0A\u0E32\u0E22 \u0E43\u0E08\u0E14\u0E35", date: "2025-06-01", items: [{ desc: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 300 }, { desc: "Paracetamol 500mg", qty: 20, unit: "\u0E40\u0E21\u0E47\u0E14", price: 4 }, { desc: "Loratadine 10mg", qty: 10, unit: "\u0E40\u0E21\u0E47\u0E14", price: 8 }], discount: 0, paid: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14", status: "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" },
  { id: "R002", hn: "000002", visitId: "V002", patname: "\u0E19\u0E32\u0E07\u0E2A\u0E21\u0E2B\u0E0D\u0E34\u0E07 \u0E23\u0E31\u0E01\u0E14\u0E35", date: "2025-06-03", items: [{ desc: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 300 }, { desc: "Omeprazole 20mg", qty: 14, unit: "\u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", price: 10 }, { desc: "Domperidone 10mg", qty: 15, unit: "\u0E40\u0E21\u0E47\u0E14", price: 6 }], discount: 0, paid: "\u0E42\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19", status: "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" }
];
const SAMPLE_MEDICINES = [
  { id: "M001", name: "Paracetamol 500mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 500, price: 2, cost: 1, expire: "2026-12-31", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E1B\u0E27\u0E14/\u0E25\u0E14\u0E44\u0E02\u0E49", minstock: 100 },
  { id: "M002", name: "Amoxicillin 250mg", unit: "\u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", stock: 150, price: 6, cost: 3, expire: "2026-06-30", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 50 },
  { id: "M003", name: "Amoxicillin 500mg", unit: "\u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", stock: 200, price: 8, cost: 4, expire: "2026-06-30", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 50 },
  { id: "M004", name: "Augmentin 375mg (Amox+Clav)", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 100, price: 25, cost: 14, expire: "2026-08-31", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 30 },
  { id: "M005", name: "Augmentin 625mg (Amox+Clav)", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 80, price: 35, cost: 20, expire: "2026-08-31", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 20 },
  { id: "M006", name: "Azithromycin 250mg", unit: "\u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", stock: 60, price: 20, cost: 10, expire: "2026-10-31", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 20 },
  { id: "M007", name: "Azithromycin 500mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 40, price: 35, cost: 18, expire: "2026-10-31", category: "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", minstock: 15 },
  { id: "M008", name: "Omeprazole 20mg", unit: "\u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", stock: 150, price: 12, cost: 6, expire: "2026-09-30", category: "\u0E22\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23", minstock: 50 },
  { id: "M009", name: "Loratadine 10mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 300, price: 10, cost: 5, expire: "2026-08-31", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E41\u0E1E\u0E49", minstock: 80 },
  { id: "M010", name: "Cetirizine 10mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 200, price: 8, cost: 4, expire: "2026-07-31", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E41\u0E1E\u0E49", minstock: 60 },
  { id: "M011", name: "Metformin 500mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 600, price: 3, cost: 1.5, expire: "2027-01-31", category: "\u0E22\u0E32\u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19", minstock: 150 },
  { id: "M012", name: "Amlodipine 5mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 400, price: 5, cost: 2, expire: "2026-11-30", category: "\u0E22\u0E32\u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19", minstock: 100 },
  { id: "M013", name: "Atorvastatin 10mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 120, price: 12, cost: 6, expire: "2026-12-31", category: "\u0E22\u0E32\u0E25\u0E14\u0E44\u0E02\u0E21\u0E31\u0E19", minstock: 40 },
  { id: "M014", name: "Domperidone 10mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 45, price: 8, cost: 3, expire: "2025-09-30", category: "\u0E22\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23", minstock: 50 },
  { id: "M015", name: "Dexamethasone 0.5mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 100, price: 4, cost: 1.5, expire: "2026-12-31", category: "\u0E22\u0E32\u0E2A\u0E40\u0E15\u0E35\u0E22\u0E23\u0E2D\u0E22\u0E14\u0E4C", minstock: 30 },
  { id: "M016", name: "Alcohol 70%", unit: "\u0E02\u0E27\u0E14 500ml", stock: 20, price: 60, cost: 35, expire: "2027-03-31", category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C", minstock: 5 },
  { id: "M017", name: "Ibuprofen 400mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 200, price: 5, cost: 2, expire: "2026-11-30", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E1B\u0E27\u0E14/\u0E25\u0E14\u0E44\u0E02\u0E49", minstock: 60 },
  { id: "M018", name: "Diclofenac 50mg", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 150, price: 6, cost: 2.5, expire: "2026-10-31", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E1B\u0E27\u0E14/\u0E25\u0E14\u0E44\u0E02\u0E49", minstock: 50 }
];
const SAMPLE_EXPENSES = [
  { id: "X001", date: "2025-06-01", category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", desc: "\u0E0B\u0E37\u0E49\u0E2D\u0E22\u0E32 Paracetamol 500mg x1000 \u0E40\u0E21\u0E47\u0E14", amount: 1e3 },
  { id: "X002", date: "2025-06-02", category: "\u0E04\u0E48\u0E32\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E39\u0E1B\u0E42\u0E20\u0E04", desc: "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21", amount: 2500 },
  { id: "X003", date: "2025-06-05", category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", desc: "\u0E0B\u0E37\u0E49\u0E2D\u0E22\u0E32 Amoxicillin 500mg x200 \u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", amount: 800 },
  { id: "X004", date: "2025-06-10", category: "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32", desc: "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19", amount: 8e3 }
];
const SAMPLE_SERVICES = [
  { id: "S001", name: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32 (OPD)", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08", price: 300, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S002", name: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32 (\u0E1E\u0E34\u0E40\u0E28\u0E29)", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08", price: 500, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S003", name: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23\u0E09\u0E35\u0E14\u0E22\u0E32 (1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 50, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S004", name: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23\u0E09\u0E35\u0E14\u0E22\u0E32 (2 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 80, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S005", name: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23\u0E09\u0E35\u0E14\u0E22\u0E32 (3 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 100, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S006", name: "\u0E04\u0E48\u0E32\u0E1E\u0E31\u0E19\u0E41\u0E1C\u0E25 (\u0E40\u0E25\u0E47\u0E01)", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 100, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S007", name: "\u0E04\u0E48\u0E32\u0E1E\u0E31\u0E19\u0E41\u0E1C\u0E25 (\u0E43\u0E2B\u0E0D\u0E48)", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 200, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S008", name: "\u0E04\u0E48\u0E32\u0E15\u0E31\u0E14\u0E44\u0E2B\u0E21", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 150, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S009", name: "\u0E04\u0E48\u0E32\u0E40\u0E08\u0E32\u0E30\u0E2B\u0E25\u0E2D\u0E14\u0E40\u0E25\u0E37\u0E2D\u0E14/\uCC44\uD608", category: "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", price: 50, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S010", name: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08 EKG", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E40\u0E28\u0E29", price: 200, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S011", name: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08 DTX (Blood Sugar)", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E40\u0E28\u0E29", price: 50, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S012", name: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08 Rapid Antigen Test", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E40\u0E28\u0E29", price: 200, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
  { id: "S013", name: "\u0E04\u0E48\u0E32\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", category: "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", price: 100, unit: "\u0E09\u0E1A\u0E31\u0E1A", active: true },
  { id: "S014", name: "\u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E2D\u0E37\u0E48\u0E19\u0E46", category: "\u0E2D\u0E37\u0E48\u0E19\u0E46", price: 0, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true }
];
function ClinicDashboard() {
  const [page, setPage] = useState("dashboard");
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState(SAMPLE_PATIENTS);
  const [visits, setVisits] = useState(SAMPLE_VISITS);
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTS);
  const [receipts, setReceipts] = useState(SAMPLE_RECEIPTS);
  const [medicines, setMedicines] = useState(SAMPLE_MEDICINES);
  const [treatmentServices, setTreatmentServices] = useState(SAMPLE_SERVICES);
  const [certModal, setCertModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [appointModal, setAppointModal] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [pts, vis, apps, recs, meds, svcs] = await Promise.all([
          supa.getAll("patients"),
          supa.getAll("visits"),
          supa.getAll("appointments"),
          supa.getAll("receipts"),
          supa.getAll("medicines"),
          supa.getAll("treatment_services")
        ]);
        if (cancelled) return;
        if (pts === null) {
          setDbError("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E14\u0E49 \u2014 \u0E43\u0E0A\u0E49\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E14\u0E2A\u0E2D\u0E1A\u0E41\u0E17\u0E19");
          setLoading(false);
          return;
        }
        if (pts.length > 0) setPatients(pts);
        if (vis.length > 0) setVisits(vis.map(fromDbVisit));
        if (apps.length > 0) setAppointments(apps.map(fromDbAppointment));
        if (recs.length > 0) setReceipts(recs.map(fromDbReceipt));
        if (meds.length > 0) setMedicines(meds);
        if (svcs.length > 0) setTreatmentServices(svcs.map(fromDbService));
        setDbReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error("DB load error:", e);
          const msg = e.message || String(e);
          if (msg.includes("Load failed") || msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
            setDbError("SANDBOX_BLOCK");
          } else {
            setDbError(msg);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!dbReady) return;
    const seed = async () => {
      const pts = await supa.getAll("patients");
      if (pts && pts.length === 0) {
        await supa.upsert("patients", SAMPLE_PATIENTS);
        await supa.upsert("medicines", SAMPLE_MEDICINES);
        await supa.upsert("treatment_services", SAMPLE_SERVICES);
        console.log("Sample data seeded to DB");
      }
    };
    seed();
  }, [dbReady]);
  const savePatient = async (p) => {
    setPatients((prev) => {
      const exists = prev.find((x) => x.hn === p.hn);
      return exists ? prev.map((x) => x.hn === p.hn ? p : x) : [...prev, p];
    });
    await supa.upsert("patients", p);
  };
  const saveVisit = async (v) => {
    setVisits((prev) => {
      const exists = prev.find((x) => x.id === v.id);
      return exists ? prev.map((x) => x.id === v.id ? v : x) : [...prev, v];
    });
    await supa.upsert("visits", toDbVisit(v));
  };
  const saveReceipt = async (r) => {
    setReceipts((prev) => [...prev, r]);
    await supa.upsert("receipts", toDbReceipt(r));
  };
  const updateReceipt = async (r) => {
    setReceipts((prev) => prev.map((x) => x.id === r.id ? r : x));
    await supa.upsert("receipts", toDbReceipt(r));
  };
  const deleteReceipt = async (id) => {
    if (!window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E19\u0E35\u0E49?\n\u0E01\u0E32\u0E23\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E08\u0E30\u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E15\u0E48\u0E2D\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22")) return;
    setReceipts((prev) => prev.filter((x) => x.id !== id));
    await supa.delete("receipts", "id", id);
  };
  const saveAppointment = async (a) => {
    setAppointments((prev) => {
      const exists = prev.find((x) => x.id === a.id);
      return exists ? prev.map((x) => x.id === a.id ? a : x) : [...prev, a];
    });
    await supa.upsert("appointments", a);
  };
  const deleteAppointment = async (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    await supa.delete("appointments", "id", id);
  };
  const saveMedicine = async (m) => {
    setMedicines((prev) => {
      const exists = prev.find((x) => x.id === m.id);
      return exists ? prev.map((x) => x.id === m.id ? m : x) : [...prev, m];
    });
    await supa.upsert("medicines", m);
  };
  const deleteMedicine = async (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    await supa.delete("medicines", "id", id);
  };
  const patchMedicineStock = async (medId, newStock) => {
    setMedicines((prev) => prev.map((m) => m.id === medId ? { ...m, stock: newStock } : m));
    await supa.patch("medicines", "id", medId, { stock: newStock });
  };
  const saveTreatmentService = async (s) => {
    setTreatmentServices((prev) => {
      const exists = prev.find((x) => x.id === s.id);
      return exists ? prev.map((x) => x.id === s.id ? s : x) : [...prev, s];
    });
    await supa.upsert("treatment_services", s);
  };
  const deleteTreatmentService = async (id) => {
    setTreatmentServices((prev) => prev.filter((s) => s.id !== id));
    await supa.delete("treatment_services", "id", id);
  };
  const nextHN = () => pad(patients.length + 1);
  const nextVID = () => { const ts = Date.now(); return "V" + ts + Math.floor(Math.random()*100); };
  const nextRID = () => { const ts = Date.now(); return "R" + ts + Math.floor(Math.random()*100); };
  const nextAID = () => `A${pad(appointments.length + 1, 3)}`;
  const getPatient = (hn) => patients.find((p) => p.hn === hn);
  const getVisitsForHN = (hn) => visits.filter((v) => v.hn === hn).sort((a, b) => b.date.localeCompare(a.date));
  const todayStr = today();
  const todayVisits = visits.filter((v) => v.date === todayStr).length;
  const todayAppoints = appointments.filter((a) => a.date === todayStr).length;
  const lowStock = medicines.filter((m) => m.stock <= m.minstock).length;
  const monthReceipts = receipts.filter((r) => r.date.startsWith(todayStr.slice(0, 7)));
  const monthRevenue = monthReceipts.reduce((s, r) => {
    const total = r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount;
    return s + total;
  }, 0);
  const NAV = [
    { key: "dashboard", icon: "\u{1F4CA}", label: "\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01" },
    { key: "register", icon: "\u{1F4CB}", label: "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19/\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19" },
    { key: "examine", icon: "\u{1FA7A}", label: "\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32" },
    { key: "cert", icon: "\u{1F4C4}", label: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C" },
    { key: "receipt", icon: "\u{1F9FE}", label: "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19" },
    { key: "appoint", icon: "\u{1F4C5}", label: "\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22" },
    { key: "accounting", icon: "\u{1F4BC}", label: "\u0E1A\u0E31\u0E0D\u0E0A\u0E35" },
    { key: "pharmacy", icon: "\u{1F48A}", label: "\u0E04\u0E25\u0E31\u0E07\u0E22\u0E32\u0E41\u0E25\u0E30\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#eef2f7", fontFamily: "'Sarabun','Noto Sans Thai',sans-serif" } }, /* @__PURE__ */ React.createElement("style", null, globalStyles), loading && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(26,82,118,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" } }, /* @__PURE__ */ React.createElement("img", { src: CLINIC_LOGO, alt: "logo", style: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 18, marginBottom: 8 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, opacity: 0.85, marginBottom: 24 } }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25..."), /* @__PURE__ */ React.createElement("div", { style: { width: 200, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "60%", height: "100%", background: "#2ecc71", borderRadius: 2, animation: "pulse 1.5s ease-in-out infinite" } })), /* @__PURE__ */ React.createElement("style", null, `@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`)), !loading && (dbError === "SANDBOX_BLOCK" ? /* @__PURE__ */ React.createElement("div", { style: { background: "#e67e22", color: "#fff", fontSize: 12, padding: "6px 16px", textAlign: "center", lineHeight: 1.6 } }, "\u26A0\uFE0F ", /* @__PURE__ */ React.createElement("b", null, "Claude Artifact \u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E43\u0E2B\u0E49\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D internet"), " \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 sync DB \xA0|\xA0 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E01\u0E31\u0E1A Supabase: \u0E40\u0E1B\u0E34\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E43\u0E19 ", /* @__PURE__ */ React.createElement("b", null, "Netlify Drop"), " \u0E2B\u0E23\u0E37\u0E2D ", /* @__PURE__ */ React.createElement("b", null, "CodeSandbox"), " \u0E41\u0E17\u0E19") : /* @__PURE__ */ React.createElement("div", { style: { background: dbError ? "#e74c3c" : dbReady ? "#1e8449" : "#e67e22", color: "#fff", fontSize: 11, padding: "3px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, dbError ? /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F DB Error: ", dbError) : dbReady ? /* @__PURE__ */ React.createElement("span", null, "\u2705 \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Supabase \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34") : /* @__PURE__ */ React.createElement("span", null, "\u23F3 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D..."))), /* @__PURE__ */ React.createElement("div", { style: { background: `linear-gradient(135deg,#1a5276,#2e86c1)`, color: "#fff", padding: "0 0 0 0", boxShadow: "0 2px 12px rgba(26,82,118,0.25)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("img", { src: CLINIC_LOGO, alt: "logo", style: { width: 56, height: 56, objectFit: "contain", borderRadius: "50%", background: "rgba(255,255,255,0.15)", flexShrink: 0 } }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 17, letterSpacing: 0.3 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.8, marginTop: 1 } }, CLINIC_ADDRESS))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 12, opacity: 0.85 } }, /* @__PURE__ */ React.createElement("div", null, thaiDateFull(today())), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 2 } }, "\u0E42\u0E17\u0E23. ", CLINIC_TEL))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, padding: "10px 16px 0", overflowX: "auto", flexWrap: "nowrap" }, className: "scroll-thin" }, NAV.map((n) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: n.key,
      onClick: () => setPage(n.key),
      style: { background: page === n.key ? "rgba(255,255,255,0.22)" : "transparent", color: "#fff", border: "none", borderRadius: "8px 8px 0 0", padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: page === n.key ? 700 : 400, whiteSpace: "nowrap", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, borderBottom: page === n.key ? "2.5px solid #fff" : "2.5px solid transparent", transition: "all 0.15s" }
    },
    /* @__PURE__ */ React.createElement("span", null, n.icon),
    n.label
  )))), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 20px 40px", maxWidth: 1200, margin: "0 auto" } }, page === "dashboard" && /* @__PURE__ */ React.createElement(DashboardPage, { todayVisits, todayAppoints, lowStock, monthRevenue, patients, visits, appointments, medicines, today: todayStr }), page === "register" && /* @__PURE__ */ React.createElement(RegisterPage, { patients, savePatient, visits, saveVisit, nextHN, nextVID, setPage, getVisitsForHN, getPatient, treatmentServices }), page === "examine" && /* @__PURE__ */ React.createElement(ExaminePage, { patients, visits, saveVisit, nextVID, getPatient, getVisitsForHN, setCertModal, setReceiptModal, setAppointModal, medicines, patchMedicineStock, treatmentServices, receipts, saveReceipt, nextRID, today: todayStr }), page === "cert" && /* @__PURE__ */ React.createElement(CertPage, { patients, visits, getPatient }), page === "receipt" && /* @__PURE__ */ React.createElement(ReceiptPage, { receipts, saveReceipt, updateReceipt, deleteReceipt, patients, visits, nextRID, getPatient, medicines, patchMedicineStock }), page === "appoint" && /* @__PURE__ */ React.createElement(AppointPage, { appointments, saveAppointment, deleteAppointment, patients, nextAID, getPatient, today: todayStr }), page === "accounting" && /* @__PURE__ */ React.createElement(AccountingPage, { receipts, today: todayStr }), page === "pharmacy" && /* @__PURE__ */ React.createElement(PharmacyPage, { medicines, saveMedicine, deleteMedicine, receipts, treatmentServices, saveTreatmentService, deleteTreatmentService })), certModal && /* @__PURE__ */ React.createElement(CertModal, { data: certModal, onClose: () => setCertModal(null), getPatient }), receiptModal && /* @__PURE__ */ React.createElement(ReceiptQuickModal, { data: receiptModal, onClose: () => setReceiptModal(null), getPatient, nextRID, receipts, saveReceipt, medicines, patchMedicineStock }), appointModal && /* @__PURE__ */ React.createElement(AppointQuickModal, { data: appointModal, onClose: () => setAppointModal(null), getPatient, appointments, saveAppointment, nextAID }));
}
function DashboardPage({ todayVisits, todayAppoints, lowStock, monthRevenue, patients, visits, appointments, medicines, today: today2 }) {
  const upcomingAppoints = appointments.filter((a) => a.date >= today2).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 5);
  const recentVisits = [...visits].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const expireSoon = medicines.filter((m) => {
    const diff = (new Date(m.expire) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24);
    return diff < 90;
  });
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4CA} \u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint("dashboard-printarea", "\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01") }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01")), /* @__PURE__ */ React.createElement("div", { id: "dashboard-printarea" }, /* @__PURE__ */ React.createElement("div", { style: { display: "none" }, className: "print-only" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 12 } }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E20\u0E32\u0E1E\u0E23\u0E27\u0E21\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01 \u2014 ", thaiDate(today2))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 20 } }, [
    { icon: "\u{1F464}", label: "\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", value: patients.length + " \u0E23\u0E32\u0E22", color: "var(--primary)" },
    { icon: "\u{1FA7A}", label: "\u0E15\u0E23\u0E27\u0E08\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", value: todayVisits + " \u0E23\u0E32\u0E22", color: "var(--accent)" },
    { icon: "\u{1F4C5}", label: "\u0E19\u0E31\u0E14\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", value: todayAppoints + " \u0E23\u0E32\u0E22", color: "#8e44ad" },
    { icon: "\u{1F4B0}", label: "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49", value: monthRevenue.toLocaleString() + " \u0E1A.", color: "var(--warning)" },
    { icon: "\u26A0\uFE0F", label: "\u0E22\u0E32\u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14", value: lowStock + " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", color: "var(--danger)" }
  ].map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "card", style: { textAlign: "center", padding: "18px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 28, marginBottom: 6 } }, s.icon), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: s.color } }, s.value), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)", marginTop: 3 } }, s.label)))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 10 } }, "\u{1F4CB} \u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14"), recentVisits.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-gray text-sm" }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"), recentVisits.map((v) => {
    var _a, _b;
    return /* @__PURE__ */ React.createElement("div", { key: v.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--gray-light)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 13, color: "var(--primary)" } }, "HN ", v.hn), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: "var(--gray)", marginLeft: 8 } }, (_a = v.cc) == null ? void 0 : _a.slice(0, 25), ((_b = v.cc) == null ? void 0 : _b.length) > 25 ? "..." : "")), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray" }, thaiDate(v.date)));
  })), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 10 } }, "\u{1F4C5} \u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E17\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E08\u0E30\u0E21\u0E32\u0E16\u0E36\u0E07"), upcomingAppoints.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-gray text-sm" }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"), upcomingAppoints.map((a) => {
    var _a;
    return /* @__PURE__ */ React.createElement("div", { key: a.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--gray-light)" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 13 } }, a.patname), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, (_a = a.reason) == null ? void 0 : _a.slice(0, 30))), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray" }, thaiDate(a.date), " ", a.time));
  })), /* @__PURE__ */ React.createElement("div", { className: "card", style: { gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--danger)", marginBottom: 10 } }, "\u26A0\uFE0F \u0E22\u0E32\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07 (\u0E2A\u0E15\u0E4A\u0E2D\u0E01\u0E15\u0E48\u0E33 / \u0E43\u0E01\u0E25\u0E49\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38)"), medicines.filter((m) => m.stock <= m.minstock || (new Date(m.expire) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24) < 90).length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-gray text-sm" }, "\u0E17\u0E38\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E1B\u0E01\u0E15\u0E34"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 } }, medicines.filter((m) => m.stock <= m.minstock).map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id + "low", style: { background: "var(--danger-pale)", border: "1px solid var(--danger)", borderRadius: 6, padding: "5px 12px", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--danger)" } }, m.name), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gray)" } }, "\u0E40\u0E2B\u0E25\u0E37\u0E2D ", m.stock, " ", m.unit))), medicines.filter((m) => (new Date(m.expire) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24) < 90).map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id + "exp", style: { background: "var(--warning-pale)", border: "1px solid var(--warning)", borderRadius: 6, padding: "5px 12px", fontSize: 12 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--warning)" } }, m.name), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gray)" } }, "\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 ", thaiDate(m.expire)))))))));
}
function printQueueTicket(qNum, pat, cc) {
  const win = window.open("", "_blank", "width=320,height=420");
  const now = (/* @__PURE__ */ new Date()).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  win.document.write(`<!DOCTYPE html><html><head><title>\u0E1A\u0E31\u0E15\u0E23\u0E04\u0E34\u0E27</title>
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
    <div class="clinic"><img src="${CLINIC_LOGO}" alt="logo" style="height:28px;vertical-align:middle;margin-right:5px;"/>${CLINIC_NAME}</div>
    <div class="qlabel">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E34\u0E27 / QUEUE NO.</div>
    <div class="qnum">${qNum}</div>
    <div class="hn">HN: ${pat.hn}</div>
    <div class="name">${(pat.prefix || "") + pat.fname} ${pat.lname}</div>
    ${cc ? `<div class="cc-box"><div class="cc-label">\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E21\u0E32\u0E1E\u0E1A\u0E41\u0E1E\u0E17\u0E22\u0E4C</div><div class="cc-text">${cc}</div></div>` : ""}
    <div class="foot">${thaiDate(today())} \u0E40\u0E27\u0E25\u0E32 ${now} \u0E19.</div>
  </div>
  <div style="text-align:center;margin-top:8px;">
    <button onclick="window.print()" style="padding:7px 20px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-family:'Sarabun',sans-serif;font-weight:700;">\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E31\u0E15\u0E23\u0E04\u0E34\u0E27</button>
  </div></body></html>`);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}
function RegisterPage({ patients, savePatient, visits, saveVisit, nextHN, nextVID, setPage, getVisitsForHN, getPatient, treatmentServices }) {
  const [subpage, setSubpage] = useState("list");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    prefix: "\u0E19\u0E32\u0E22",
    fname: "",
    lname: "",
    gender: "\u0E0A\u0E32\u0E22",
    dob: "",
    idcard: "",
    tel: "",
    lineId: "",
    address: "",
    bloodtype: "",
    allergy: "",
    chronic: "",
    currentmed: "",
    email: "",
    occupation: "",
    emcontact: "",
    emtel: ""
  });
  const [intake, setIntake] = useState({ cc: "", temp: "", bp_sys: "", bp_dia: "", pr: "", rr: "", o2: "", weight: "", height: "", nurse: "" });
  const [lastRegistered, setLastRegistered] = useState(null);
  const [selectedPat, setSelectedPat] = useState(null);
  const fi = (k, v) => setIntake((prev) => ({ ...prev, [k]: v }));
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (p.fname || "").toLowerCase().includes(q) || (p.lname || "").toLowerCase().includes(q) || (p.hn || "").includes(q) || (p.idcard || "").includes(q) || (p.tel || "").includes(q);
  });
  const saveNewPatient = async () => {
    if (!form.fname.trim() || !form.lname.trim()) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E30\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25");
      return;
    }
    const hn = nextHN();
    const newP = { ...form, hn, created_at: (/* @__PURE__ */ new Date()).toISOString() };
    await savePatient(newP);
    const hasIntake = Object.values(intake).some((v) => v && String(v).trim());
    let visitId = null;
    if (hasIntake && saveVisit && nextVID) {
      const vid = nextVID();
      visitId = vid;
      await saveVisit({
        id: vid,
        hn,
        date: today(),
        cc: intake.cc || "",
        pi: "",
        pe: "",
        dx: "",
        tx: "",
        drugs: [],
        services: [],
        bp: `${intake.bp_sys || ""}${intake.bp_dia ? "/" + intake.bp_dia : ""}`,
        pr: intake.pr || "",
        rr: intake.rr || "",
        temp: intake.temp || "",
        o2: intake.o2 || "",
        weight: intake.weight || "",
        height: intake.height || "",
        nurse: intake.nurse || "",
        note: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E15\u0E2D\u0E19\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"
      });
    }
    const qNum = String(patients.length + 1).padStart(3, "0");
    setLastRegistered({ pat: newP, visitId, qNum, cc: intake.cc });
    setForm({ prefix: "\u0E19\u0E32\u0E22", fname: "", lname: "", gender: "\u0E0A\u0E32\u0E22", dob: "", idcard: "", tel: "", lineId: "", address: "", bloodtype: "", allergy: "", chronic: "", currentmed: "", email: "", occupation: "", emcontact: "", emtel: "" });
    setIntake({ cc: "", temp: "", bp_sys: "", bp_dia: "", pr: "", rr: "", o2: "", weight: "", height: "", nurse: "" });
    setSubpage("registered");
  };
  const age = (dob) => {
    if (!dob) return "-";
    return Math.floor((/* @__PURE__ */ new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1e3)) + " \u0E1B\u0E35";
  };
  const bmi = intake.weight && intake.height ? (intake.weight / (intake.height / 100) ** 2).toFixed(1) : null;
  const bmiLabel = bmi ? bmi < 18.5 ? "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E19\u0E49\u0E2D\u0E22" : bmi < 23 ? "\u0E1B\u0E01\u0E15\u0E34" : bmi < 25 ? "\u0E17\u0E49\u0E27\u0E21" : bmi < 30 ? "\u0E2D\u0E49\u0E27\u0E19" : "\u0E2D\u0E49\u0E27\u0E19\u0E21\u0E32\u0E01" : "";
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4CB} \u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setSubpage("list"), style: { background: subpage === "list" ? "var(--primary-pale)" : "" } }, "\u{1F4C2} \u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => {
    setSubpage("new");
    setSelectedPat(null);
    setLastRegistered(null);
  } }, "+ \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E43\u0E2B\u0E21\u0E48"))), subpage === "list" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("input", { placeholder: "\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E15\u0E32\u0E21\u0E0A\u0E37\u0E48\u0E2D \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 HN \u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19 \u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23", value: search, onChange: (e) => setSearch(e.target.value), style: { maxWidth: 440 } })), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "HN"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "\u0E40\u0E1E\u0E28/\u0E2D\u0E32\u0E22\u0E38"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "\u0E41\u0E1E\u0E49\u0E22\u0E32"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "Visit"), /* @__PURE__ */ React.createElement("th", { style: { padding: "10px 14px", textAlign: "left" } }, "\u0E08\u0E31\u0E14\u0E01\u0E32\u0E23"))), /* @__PURE__ */ React.createElement("tbody", null, filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: "20px", textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), filtered.map((p, i) => /* @__PURE__ */ React.createElement("tr", { key: p.hn, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)", cursor: "pointer" }, onClick: () => {
    setSelectedPat(p);
    setSubpage("detail");
  } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", fontWeight: 700, color: "var(--primary)" } }, p.hn), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", fontWeight: 600 } }, p.prefix, p.fname, " ", p.lname), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px" } }, p.gender, " / ", age(p.dob)), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", color: p.chronic && p.chronic !== "-" ? "var(--warning)" : "var(--gray)" } }, p.chronic || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", color: p.allergy && p.allergy !== "-" ? "var(--danger)" : "var(--gray)" } }, p.allergy || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px" } }, getVisitsForHN(p.hn).length, " \u0E04\u0E23\u0E31\u0E49\u0E07"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: (e) => {
    e.stopPropagation();
    setSelectedPat(p);
    setSubpage("detail");
  } }, "\u0E14\u0E39\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14")))))))), subpage === "new" && /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 15, color: "var(--primary)", marginBottom: 16 } }, "\u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E23\u0E32\u0E22\u0E43\u0E2B\u0E21\u0E48"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", border: "1.5px solid var(--primary-light)", borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13 } }, /* @__PURE__ */ React.createElement("b", null, "HN \u0E17\u0E35\u0E48\u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A:"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary)", fontWeight: 700, fontSize: 15 } }, nextHN()), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 16 } }, /* @__PURE__ */ React.createElement("b", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:"), " ", thaiDate(today()))), /* @__PURE__ */ React.createElement(PatientForm, { form, setForm }), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { background: "#fff3e0", border: "2px solid #e67e22", borderRadius: 10, padding: "12px 14px", marginBottom: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "#e67e22", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F534}"), " \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E0A\u0E35\u0E1E", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, fontSize: 11, color: "#888", marginLeft: 4 } }, "(\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25/\u0E40\u0E08\u0E49\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48 \u2014 \u0E01\u0E23\u0E2D\u0E01\u0E2B\u0E23\u0E37\u0E2D\u0E02\u0E49\u0E32\u0E21\u0E44\u0E14\u0E49)")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "CC. \u0E2D\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E19\u0E33\u0E21\u0E32\u0E1E\u0E1A\u0E41\u0E1E\u0E17\u0E22\u0E4C (Chief Complaint)"), /* @__PURE__ */ React.createElement("input", { value: intake.cc, onChange: (e) => fi("cc", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E02\u0E49 \u0E1B\u0E27\u0E14\u0E28\u0E35\u0E23\u0E29\u0E30 2 \u0E27\u0E31\u0E19, \u0E44\u0E2D\u0E21\u0E35\u0E40\u0E2A\u0E21\u0E2B\u0E30" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 8 } }, [
    ["\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 (\xB0C)", "temp", "36.5"],
    ["BP \u0E15\u0E31\u0E27\u0E1A\u0E19 (mmHg)", "bp_sys", "120"],
    ["BP \u0E15\u0E31\u0E27\u0E25\u0E48\u0E32\u0E07 (mmHg)", "bp_dia", "80"],
    ["\u0E0A\u0E35\u0E1E\u0E08\u0E23 (\u0E04\u0E23\u0E31\u0E49\u0E07/\u0E19\u0E32\u0E17\u0E35)", "pr", "80"],
    ["\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E01\u0E32\u0E23\u0E2B\u0E32\u0E22\u0E43\u0E08 (/\u0E19\u0E32\u0E17\u0E35)", "rr", "18"],
    ["SpO\u2082 (%)", "o2", "98"],
    ["\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 (\u0E01\u0E01.)", "weight", "60"],
    ["\u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 (\u0E0B\u0E21.)", "height", "165"],
    ["\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22", "nurse", ""]
  ].map(([lbl, key, ph]) => /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("label", null, lbl), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: intake[key],
      onChange: (e) => fi(key, e.target.value),
      placeholder: ph,
      type: key === "nurse" ? "text" : "number",
      step: key === "temp" || key === "weight" ? "0.1" : "1"
    }
  )))), bmi && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#666", background: "#fff", borderRadius: 5, padding: "4px 10px", display: "inline-block" } }, "BMI: ", /* @__PURE__ */ React.createElement("b", { style: { color: "#1a5276" } }, bmi), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "#888" } }, "(", bmiLabel, ")"))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: () => setSubpage("list") }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: saveNewPatient }, "\u{1F4BE} \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))), subpage === "registered" && lastRegistered && /* @__PURE__ */ React.createElement("div", { className: "card", style: { maxWidth: 500, margin: "0 auto", textAlign: "center", padding: 28 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 40, marginBottom: 8 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--accent)", marginBottom: 4 } }, "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, color: "var(--gray-dark)", marginBottom: 16 } }, lastRegistered.pat.prefix, lastRegistered.pat.fname, " ", lastRegistered.pat.lname, "\xA0|\xA0 ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary)" } }, "HN: ", lastRegistered.pat.hn)), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary)", color: "#fff", borderRadius: 12, padding: "12px 24px", marginBottom: 14, display: "inline-block", minWidth: 130 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.8, marginBottom: 2, letterSpacing: 2 } }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E34\u0E27"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 52, fontWeight: 800, lineHeight: 1 } }, lastRegistered.qNum)), lastRegistered.cc && /* @__PURE__ */ React.createElement("div", { style: { background: "#fff8e1", border: "1px solid #f39c12", borderRadius: 6, padding: "6px 12px", marginBottom: 14, fontSize: 13 } }, /* @__PURE__ */ React.createElement("b", null, "CC:"), " ", lastRegistered.cc), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print", onClick: () => printQueueTicket(lastRegistered.qNum, lastRegistered.pat, lastRegistered.cc) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E31\u0E15\u0E23\u0E04\u0E34\u0E27"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: () => {
    setSubpage("new");
    setLastRegistered(null);
  } }, "+ \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E04\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: () => setSubpage("list") }, "\u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D"))), subpage === "detail" && selectedPat && /* @__PURE__ */ React.createElement(PatientDetail, { pat: selectedPat, visits: getVisitsForHN(selectedPat.hn), onBack: () => setSubpage("list"), patients, savePatient, treatmentServices, saveVisit, nextVID, allVisits: visits }));
}
function PatientForm({ form, setForm }) {
  const f = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--gray-pale)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--primary)", marginBottom: 10 } }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 110px" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E04\u0E33\u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E0A\u0E37\u0E48\u0E2D *"), /* @__PURE__ */ React.createElement("select", { value: form.prefix, onChange: (e) => f("prefix", e.target.value) }, ["\u0E19\u0E32\u0E22", "\u0E19\u0E32\u0E07", "\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", "\u0E40\u0E14\u0E47\u0E01\u0E0A\u0E32\u0E22", "\u0E40\u0E14\u0E47\u0E01\u0E2B\u0E0D\u0E34\u0E07", "\u0E14.\u0E0A.", "\u0E14.\u0E0D.", "\u0E1E.\u0E17.", "\u0E1E.\u0E0D.", "\u0E2D\u0E37\u0E48\u0E19\u0E46"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D *"), /* @__PURE__ */ React.createElement("input", { value: form.fname, onChange: (e) => f("fname", e.target.value), placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E08\u0E23\u0E34\u0E07" })), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 *"), /* @__PURE__ */ React.createElement("input", { value: form.lname, onChange: (e) => f("lname", e.target.value), placeholder: "\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25" })), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 90px" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1E\u0E28 *"), /* @__PURE__ */ React.createElement("select", { value: form.gender, onChange: (e) => f("gender", e.target.value) }, /* @__PURE__ */ React.createElement("option", null, "\u0E0A\u0E32\u0E22"), /* @__PURE__ */ React.createElement("option", null, "\u0E2B\u0E0D\u0E34\u0E07"), /* @__PURE__ */ React.createElement("option", null, "\u0E2D\u0E37\u0E48\u0E19\u0E46")))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E40\u0E01\u0E34\u0E14"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.dob, onChange: (e) => f("dob", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19 / Passport"), /* @__PURE__ */ React.createElement("input", { value: form.idcard, onChange: (e) => f("idcard", e.target.value), placeholder: "\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E14"), /* @__PURE__ */ React.createElement("select", { value: form.bloodtype, onChange: (e) => f("bloodtype", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "-\u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A-"), ["O", "A", "B", "AB"].map((b) => [/* @__PURE__ */ React.createElement("option", { key: b + "+" }, b, "+"), /* @__PURE__ */ React.createElement("option", { key: b + "-" }, b, "-")])))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C"), /* @__PURE__ */ React.createElement("input", { value: form.tel, onChange: (e) => f("tel", e.target.value), placeholder: "0x-xxxx-xxxx" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "Line ID"), /* @__PURE__ */ React.createElement("input", { value: form.lineId || "", onChange: (e) => f("lineId", e.target.value), placeholder: "\u0E44\u0E2D\u0E14\u0E35 Line" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2D\u0E35\u0E40\u0E21\u0E25"), /* @__PURE__ */ React.createElement("input", { value: form.email, onChange: (e) => f("email", e.target.value), placeholder: "email@..." })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2D\u0E32\u0E0A\u0E35\u0E1E"), /* @__PURE__ */ React.createElement("input", { value: form.occupation, onChange: (e) => f("occupation", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "form-group mt-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), /* @__PURE__ */ React.createElement("input", { value: form.address, onChange: (e) => f("address", e.target.value), placeholder: "\u0E1A\u0E49\u0E32\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E2B\u0E21\u0E39\u0E48\u0E17\u0E35\u0E48 \u0E16\u0E19\u0E19 \u0E15\u0E33\u0E1A\u0E25 \u0E2D\u0E33\u0E40\u0E20\u0E2D \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14 \u0E23\u0E2B\u0E31\u0E2A\u0E44\u0E1B\u0E23\u0E29\u0E13\u0E35\u0E22\u0E4C" })), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19"), /* @__PURE__ */ React.createElement("input", { value: form.emcontact, onChange: (e) => f("emcontact", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19"), /* @__PURE__ */ React.createElement("input", { value: form.emtel, onChange: (e) => f("emtel", e.target.value) })))), /* @__PURE__ */ React.createElement("div", { style: { background: "#fff8f0", borderRadius: 8, padding: "12px 14px", border: "1.5px solid #f0d9c0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--warning)", marginBottom: 10 } }, "\u26A0\uFE0F \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E2A\u0E33\u0E04\u0E31\u0E0D"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27 / \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E42\u0E23\u0E04\u0E2A\u0E33\u0E04\u0E31\u0E0D"), /* @__PURE__ */ React.createElement("textarea", { value: form.chronic, onChange: (e) => f("chronic", e.target.value), rows: 2, placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19 \u0E42\u0E23\u0E04\u0E2B\u0E31\u0E27\u0E43\u0E08 \u0E2B\u0E2D\u0E1A\u0E2B\u0E37\u0E14 \u0E2F\u0E25\u0E2F" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1C\u0E48\u0E32\u0E15\u0E31\u0E14"), /* @__PURE__ */ React.createElement("textarea", { value: form.surgery || "", onChange: (e) => f("surgery", e.target.value), rows: 2, placeholder: "\u0E1C\u0E48\u0E32\u0E15\u0E31\u0E14\u0E2D\u0E30\u0E44\u0E23 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E2B\u0E23\u0E48" }))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", { style: { color: "var(--danger)" } }, "\u{1F6AB} \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E41\u0E1E\u0E49\u0E22\u0E32 / \u0E41\u0E1E\u0E49\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E01\u0E32\u0E23)"), /* @__PURE__ */ React.createElement("input", { value: form.allergy, onChange: (e) => f("allergy", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E41\u0E1E\u0E49 Penicillin \u0E21\u0E35\u0E1C\u0E37\u0E48\u0E19, \u0E41\u0E1E\u0E49\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E30\u0E40\u0E25", style: { borderColor: form.allergy && form.allergy !== "-" ? "var(--danger)" : "" } })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E22\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E30\u0E08\u0E33"), /* @__PURE__ */ React.createElement("input", { value: form.currentmed, onChange: (e) => f("currentmed", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 Metformin 500mg 1x1 pc, Amlodipine 5mg 1x1 hs" })))));
}
function PatientDetail({ pat, visits, onBack, patients, savePatient, treatmentServices, saveVisit, nextVID, allVisits }) {
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...pat });
  const [showNewQueue, setShowNewQueue] = useState(false);
  const [intake, setIntake] = useState({ cc: "", temp: "", bp_sys: "", bp_dia: "", pr: "", rr: "", o2: "", weight: "", height: "", nurse: "" });
  const [newQueueResult, setNewQueueResult] = useState(null);
  const fi = (k, v) => setIntake((prev) => ({ ...prev, [k]: v }));
  const age = (dob) => {
    if (!dob) return "-";
    const d = /* @__PURE__ */ new Date() - new Date(dob);
    return Math.floor(d / (365.25 * 24 * 60 * 60 * 1e3)) + " \u0E1B\u0E35";
  };
  const save = async () => {
    await savePatient(form);
    setEditing(false);
    alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
  };
  const VISITS_PER_PAGE = 3;
  const [visitPage, setVisitPage] = useState(1);
  const [editingVisit, setEditingVisit] = useState(null);
  const [editVform, setEditVform] = useState(null);
  const sortedVisits = [...visits].sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.id || "").localeCompare(a.id || ""));
  const totalVisitPages = Math.max(1, Math.ceil(sortedVisits.length / VISITS_PER_PAGE));
  const pagedVisits = sortedVisits.slice((visitPage - 1) * VISITS_PER_PAGE, visitPage * VISITS_PER_PAGE);
  const startEditVisit = (v) => {
    setEditingVisit(v.id);
    setEditVform({ ...v });
  };
  const cancelEditVisit = () => {
    setEditingVisit(null);
    setEditVform(null);
  };
  const saveEditVisit = async () => {
    if (!saveVisit) {
      alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E44\u0E14\u0E49");
      return;
    }
    await saveVisit(editVform);
    alert("\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
    setEditingVisit(null);
    setEditVform(null);
  };
  const todayStr = today();
  const todaysVisitsForPat = (allVisits || visits).filter((v) => v.hn === pat.hn && v.date === todayStr);
  const createNewQueue = async () => {
    if (!saveVisit || !nextVID) {
      alert("\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E34\u0E27\u0E43\u0E2B\u0E21\u0E48\u0E44\u0E14\u0E49\u0E43\u0E19\u0E02\u0E13\u0E30\u0E19\u0E35\u0E49");
      return;
    }
    const vid = nextVID();
    const v = {
      id: vid,
      hn: pat.hn,
      date: todayStr,
      cc: intake.cc || "",
      pi: "",
      pe: "",
      dx: "",
      tx: "",
      drugs: [],
      services: [],
      bp: `${intake.bp_sys || ""}${intake.bp_dia ? "/" + intake.bp_dia : ""}`,
      pr: intake.pr || "",
      rr: intake.rr || "",
      temp: intake.temp || "",
      o2: intake.o2 || "",
      weight: intake.weight || "",
      height: intake.height || "",
      nurse: intake.nurse || "",
      note: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E15\u0E2D\u0E19\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19 (Visit \u0E43\u0E2B\u0E21\u0E48)"
    };
    await saveVisit(v);
    const qNum = String(todaysVisitsForPat.length + 1).padStart(3, "0") + "-" + pat.hn.slice(-3);
    setNewQueueResult({ qNum, cc: intake.cc, visitId: vid });
    setIntake({ cc: "", temp: "", bp_sys: "", bp_dia: "", pr: "", rr: "", o2: "", weight: "", height: "", nurse: "" });
  };
  const bmi = intake.weight && intake.height ? (intake.weight / (intake.height / 100) ** 2).toFixed(1) : null;
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onBack }, "\u2190 \u0E01\u0E25\u0E31\u0E1A"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--primary)" } }, pat.prefix, pat.fname, " ", pat.lname), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary)", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 12, fontWeight: 700 } }, "HN: ", pat.hn), pat.allergy && pat.allergy !== "-" && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--danger-pale)", color: "var(--danger)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32: ", pat.allergy), todaysVisitsForPat.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--accent-pale)", color: "var(--accent)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 } }, "\u{1F4CB} \u0E21\u0E32\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49\u0E41\u0E25\u0E49\u0E27 ", todaysVisitsForPat.length, " \u0E04\u0E23\u0E31\u0E49\u0E07"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm", style: { marginLeft: "auto", background: "#e67e22", color: "#fff" }, onClick: () => {
    setShowNewQueue((v) => !v);
    setNewQueueResult(null);
  } }, showNewQueue ? "\u2715 \u0E1B\u0E34\u0E14" : "\u2795 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E34\u0E27\u0E15\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E21\u0E48 (Visit \u0E43\u0E2B\u0E21\u0E48)")), showNewQueue && /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14, background: "#fff3e0", border: "2px solid #e67e22" } }, !newQueueResult ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "#e67e22", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F534}"), " \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E34\u0E27\u0E15\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E21\u0E48\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E23\u0E32\u0E22\u0E19\u0E35\u0E49", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, fontSize: 11, color: "#888", marginLeft: 4 } }, "\u2014 \u0E43\u0E0A\u0E49\u0E01\u0E23\u0E13\u0E35\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E21\u0E32\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01\u0E0B\u0E49\u0E33\u0E43\u0E19\u0E27\u0E31\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E2D\u0E1A\u0E43\u0E2B\u0E21\u0E48")), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "CC. \u0E2D\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E19\u0E33\u0E21\u0E32\u0E1E\u0E1A\u0E41\u0E1E\u0E17\u0E22\u0E4C (Chief Complaint)"), /* @__PURE__ */ React.createElement("input", { value: intake.cc, onChange: (e) => fi("cc", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E02\u0E49 \u0E1B\u0E27\u0E14\u0E28\u0E35\u0E23\u0E29\u0E30 2 \u0E27\u0E31\u0E19, \u0E44\u0E2D\u0E21\u0E35\u0E40\u0E2A\u0E21\u0E2B\u0E30" })), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 8 } }, [
    ["\u0E2D\u0E38\u0E13\u0E2B\u0E20\u0E39\u0E21\u0E34 (\xB0C)", "temp", "36.5"],
    ["BP \u0E15\u0E31\u0E27\u0E1A\u0E19 (mmHg)", "bp_sys", "120"],
    ["BP \u0E15\u0E31\u0E27\u0E25\u0E48\u0E32\u0E07 (mmHg)", "bp_dia", "80"],
    ["\u0E0A\u0E35\u0E1E\u0E08\u0E23 (\u0E04\u0E23\u0E31\u0E49\u0E07/\u0E19\u0E32\u0E17\u0E35)", "pr", "80"],
    ["\u0E2D\u0E31\u0E15\u0E23\u0E32\u0E01\u0E32\u0E23\u0E2B\u0E32\u0E22\u0E43\u0E08 (/\u0E19\u0E32\u0E17\u0E35)", "rr", "18"],
    ["SpO\u2082 (%)", "o2", "98"],
    ["\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 (\u0E01\u0E01.)", "weight", "60"],
    ["\u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 (\u0E0B\u0E21.)", "height", "165"],
    ["\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22", "nurse", ""]
  ].map(([lbl, key, ph]) => /* @__PURE__ */ React.createElement("div", { key }, /* @__PURE__ */ React.createElement("label", null, lbl), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: intake[key],
      onChange: (e) => fi(key, e.target.value),
      placeholder: ph,
      type: key === "nurse" ? "text" : "number",
      step: key === "temp" || key === "weight" ? "0.1" : "1"
    }
  )))), bmi && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#666", background: "#fff", borderRadius: 5, padding: "4px 10px", display: "inline-block", marginBottom: 10 } }, "BMI: ", /* @__PURE__ */ React.createElement("b", { style: { color: "#1a5276" } }, bmi)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => setShowNewQueue(false) }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm", style: { background: "#e67e22", color: "#fff" }, onClick: createNewQueue }, "\u{1F4BE} \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E34\u0E27\u0E41\u0E25\u0E30\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))) : /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", padding: "10px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, marginBottom: 6 } }, "\u2705"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--accent)", marginBottom: 10 } }, "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E34\u0E27\u0E43\u0E2B\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08!"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary)", color: "#fff", borderRadius: 10, padding: "10px 20px", display: "inline-block", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, opacity: 0.8 } }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E04\u0E34\u0E27"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 32, fontWeight: 800 } }, newQueueResult.qNum)), newQueueResult.cc && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("b", null, "CC:"), " ", newQueueResult.cc), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", onClick: () => printQueueTicket(newQueueResult.qNum, pat, newQueueResult.cc) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E1A\u0E31\u0E15\u0E23\u0E04\u0E34\u0E27"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => {
    setShowNewQueue(false);
    setNewQueueResult(null);
    setTab("visits");
  } }, "\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19")))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, ["info", "visits"].map((t) => /* @__PURE__ */ React.createElement("button", { key: t, className: `btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`, onClick: () => setTab(t) }, t === "info" ? "\u{1F464} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22" : "\u{1F4CB} \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32 (" + visits.length + " \u0E04\u0E23\u0E31\u0E49\u0E07)")), tab === "info" && !editing && /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", style: { marginLeft: "auto" }, onClick: () => doPrint(`patient-info-${pat.hn}`, "\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19 " + pat.prefix + pat.fname + " " + pat.lname) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), tab === "info" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-accent", style: { marginLeft: tab === "info" && !editing ? 0 : "auto" }, onClick: () => editing ? save() : setEditing(true) }, editing ? "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" : "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), tab === "info" && (editing ? /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(PatientForm, { form, setForm }), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => setEditing(false) }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", style: { marginLeft: 8 }, onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))) : /* @__PURE__ */ React.createElement("div", { className: "card", id: `patient-info-${pat.hn}` }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 } }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 } }, [["HN", pat.hn], ["\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25", pat.prefix + pat.fname + " " + pat.lname], ["\u0E40\u0E1E\u0E28", pat.gender], ["\u0E2D\u0E32\u0E22\u0E38", age(pat.dob)], ["\u0E27\u0E31\u0E19\u0E40\u0E01\u0E34\u0E14", thaiDate(pat.dob)], ["\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E14", pat.bloodtype || "-"], ["\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19", pat.idcard || "-"], ["\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23", pat.tel || "-"], ["Line ID", pat.lineId || "-"], ["\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48", pat.address || "-"], ["\u0E2D\u0E32\u0E0A\u0E35\u0E1E", pat.occupation || "-"]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { padding: "5px 0", borderBottom: "1px solid var(--gray-light)" } }, /* @__PURE__ */ React.createElement("span", { className: "text-gray" }, k, ": "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, v)))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--danger)", fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32/\u0E2D\u0E32\u0E2B\u0E32\u0E23: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: pat.allergy && pat.allergy !== "-" ? "var(--danger)" : "var(--gray)" } }, pat.allergy || "-")), /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--warning)", fontWeight: 700 } }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.chronic || "-")), /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0", gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement("span", { className: "text-gray" }, "\u0E22\u0E32\u0E1B\u0E23\u0E30\u0E08\u0E33: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.currentmed || "-"))))), tab === "visits" && /* @__PURE__ */ React.createElement("div", null, sortedVisits.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", color: "var(--gray)", padding: 30 } }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32"), sortedVisits.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--gray-dark)", fontWeight: 600 } }, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary)" } }, "(", sortedVisits.length, " \u0E04\u0E23\u0E31\u0E49\u0E07)"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 10, fontSize: 12, color: "var(--gray)" } }, "\u0E2B\u0E19\u0E49\u0E32 ", visitPage, "/", totalVisitPages)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", disabled: visitPage <= 1, onClick: () => setVisitPage((p) => Math.max(1, p - 1)), style: { opacity: visitPage <= 1 ? 0.4 : 1 } }, "\u2190 \u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"), Array.from({ length: totalVisitPages }, (_, i) => /* @__PURE__ */ React.createElement("button", { key: i, className: `btn btn-sm ${visitPage === i + 1 ? "btn-primary" : "btn-outline"}`, onClick: () => setVisitPage(i + 1) }, i + 1)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", disabled: visitPage >= totalVisitPages, onClick: () => setVisitPage((p) => Math.min(totalVisitPages, p + 1)), style: { opacity: visitPage >= totalVisitPages ? 0.4 : 1 } }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \u2192"))), pagedVisits.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "card", style: { marginBottom: 12 }, id: `visit-card-${v.id}` }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--primary)", fontSize: 14 } }, "Visit: ", v.id), v.queueNo && /* @__PURE__ */ React.createElement("span", { style: { background: "var(--primary)", color: "#fff", borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 700 } }, "\u0E04\u0E34\u0E27 ", v.queueNo), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--gray)", fontSize: 13 } }, thaiDate(v.date)), v.status === "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08" && /* @__PURE__ */ React.createElement("span", { className: "tag tag-orange" }, "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08"), v.status === "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08" && /* @__PURE__ */ React.createElement("span", { className: "tag tag-green" }, "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08"), !v.status && !v.dx && !v.pe && v.date === today() && /* @__PURE__ */ React.createElement("span", { className: "tag tag-orange" }, "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, saveVisit && (editingVisit === v.id ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm no-print", onClick: cancelEditVisit }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm no-print", onClick: saveEditVisit }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")) : /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm no-print", onClick: () => startEditVisit(v) }, "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02")), /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint(`visit-card-${v.id}`, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 Visit " + v.id) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C"))), editingVisit === v.id && editVform ? /* @__PURE__ */ React.createElement(VisitRecord, { v: editVform, setV: setEditVform, pat, readOnly: false, treatmentServices }) : /* @__PURE__ */ React.createElement(VisitRecord, { v, pat, readOnly: true, treatmentServices }))), totalVisitPages > 1 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "center", gap: 6, marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", disabled: visitPage <= 1, onClick: () => setVisitPage((p) => Math.max(1, p - 1)), style: { opacity: visitPage <= 1 ? 0.4 : 1 } }, "\u2190 \u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E19\u0E49\u0E32"), Array.from({ length: totalVisitPages }, (_, i) => /* @__PURE__ */ React.createElement("button", { key: i, className: `btn btn-sm ${visitPage === i + 1 ? "btn-primary" : "btn-outline"}`, onClick: () => setVisitPage(i + 1) }, i + 1)), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", disabled: visitPage >= totalVisitPages, onClick: () => setVisitPage((p) => Math.min(totalVisitPages, p + 1)), style: { opacity: visitPage >= totalVisitPages ? 0.4 : 1 } }, "\u0E16\u0E31\u0E14\u0E44\u0E1B \u2192"))));
}
function ExaminePage({ patients, visits, saveVisit, nextVID, getPatient, getVisitsForHN, setCertModal, setReceiptModal, setAppointModal, medicines, patchMedicineStock, treatmentServices, receipts, saveReceipt, nextRID }) {
  const today2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pat, setPat] = useState(null);
  const [vform, setVform] = useState(null);
  const [saved, setSaved] = useState(false);
  const [lastVisit, setLastVisit] = useState(null);
  const doSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E01\u0E23\u0E2D\u0E01\u0E04\u0E33\u0E04\u0E49\u0E19\u0E2B\u0E32");
      return;
    }
    const results = patients.filter(
      (p) => (p.hn || "").includes(q) || (p.fname || "").toLowerCase().includes(q) || (p.lname || "").toLowerCase().includes(q) || ((p.fname || "") + " " + (p.lname || "")).toLowerCase().includes(q) || (p.idcard || "").includes(q)
    );
    if (results.length === 0) {
      alert('\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A "' + query + '"');
      return;
    }
    if (results.length === 1) {
      loadPatient(results[0]);
      return;
    }
    setSearchResults(results);
  };
  const loadVisit = (p, v) => {
    setSearchResults([]);
    setPat(p);
    setVform({ ...v, drugs: v.drugs || [], services: v.services || [] });
    setSaved(false);
  };
  const loadPatient = (p) => {
    setSearchResults([]);
    setPat(p);
    const todaysVisits = visits.filter((v) => v.hn === p.hn && v.date === today2).sort((a, b) => (a.queueNo || a.id || "").localeCompare(b.queueNo || b.id || ""));
    const pendingQueue = todaysVisits.find((v) => v.status === "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08" || !v.status && !v.dx && !v.pe);
    if (pendingQueue) {
      setVform({ ...pendingQueue, drugs: pendingQueue.drugs || [], services: pendingQueue.services || [] });
    } else {
      setVform({
        id: nextVID(),
        hn: p.hn,
        date: today2,
        cc: "",
        pi: "",
        pe: "",
        dx: "",
        tx: "",
        drugs: [],
        services: [],
        bp: "",
        pr: "",
        rr: "",
        temp: "",
        o2: "",
        weight: "",
        height: "",
        nurse: "",
        note: "",
        status: "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08"
      });
    }
    setSaved(false);
  };
  const todayQueue = visits.filter((v) => v.date === today2 && (v.status === "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08" || !v.status && !v.dx && !v.pe)).sort((a, b) => (a.queueNo || a.id || "").localeCompare(b.queueNo || b.id || "")).map((v) => ({ visit: v, pat: getPatient(v.hn) })).filter((q) => q.pat);
  const todayQueueDone = visits.filter((v) => v.date === today2 && (v.status === "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08" || !v.status && (v.dx || v.pe))).sort((a, b) => (b.id || "").localeCompare(a.id || "")).map((v) => ({ visit: v, pat: getPatient(v.hn) })).filter((q) => q.pat);
  const save = async () => {
    const completed = { ...vform, status: "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08" };
    await saveVisit(completed);
    setVform(completed);
    setSaved(true);
    setLastVisit(completed);
    alert('\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\n\u0E22\u0E49\u0E32\u0E22\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E44\u0E1B\u0E17\u0E35\u0E48 "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27" \u0E41\u0E25\u0E49\u0E27');
  };
  const issueReceiptOnly = async () => {
    const drugItems = (vform.drugs || []).map((d) => ({
      desc: d.name,
      qty: d.qty,
      unit: d.unit,
      price: d.price,
      type: "drug",
      medId: d.medId
    }));
    const svcItems = (vform.services || []).map((s) => ({
      desc: s.name,
      qty: s.qty || 1,
      unit: s.unit || "\u0E04\u0E23\u0E31\u0E49\u0E07",
      price: s.price,
      type: "service"
    }));
    const allItems = [...svcItems, ...drugItems];
    const r = {
      id: nextRID(),
      hn: pat.hn,
      visitId: vform.id,
      patname: pat.prefix + pat.fname + " " + pat.lname,
      date: today2,
      items: allItems.length > 0 ? allItems : [{ desc: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 300, type: "service" }],
      discount: 0,
      paid: "",
      status: "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"
    };
    await saveReceipt(r);
    if (vform.drugs && vform.drugs.length > 0) {
      for (const med of medicines) {
        const ordered = vform.drugs.filter((d) => d.medId === med.id);
        if (ordered.length === 0) continue;
        await patchMedicineStock(med.id, Math.max(0, med.stock - ordered.reduce((s, d) => s + Number(d.qty), 0)));
      }
    }
    const completed = { ...vform, status: "\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08" };
    await saveVisit(completed);
    setVform(completed);
    setSaved(true);
    setLastVisit(completed);
    alert(`\u2705 \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 ${r.id} \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30 "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"
\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21: ${r.items.reduce((s, i) => s + i.qty * i.price, 0).toLocaleString()} \u0E1A\u0E32\u0E17

\u0E01\u0E23\u0E38\u0E13\u0E32\u0E41\u0E08\u0E49\u0E07\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E44\u0E1B\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32 "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"`);
  };
  const age = (dob) => {
    if (!dob) return "-";
    return Math.floor((/* @__PURE__ */ new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1e3)) + " \u0E1B\u0E35";
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)", marginBottom: 16 } }, "\u{1FA7A} \u0E2B\u0E19\u0E49\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--gray-dark)", marginBottom: 8 } }, "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "var(--gray)" } }, "(\u0E0A\u0E37\u0E48\u0E2D / \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 / HN / \u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19)")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 HN \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19", style: { maxWidth: 320 }, onKeyDown: (e) => e.key === "Enter" && doSearch() }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary", onClick: doSearch }, "\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32"), pat && /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setCertModal({ pat, visit: lastVisit || vform }) }, "\u{1F4C4} \u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setAppointModal({ pat, visit: lastVisit || vform }) }, "\u{1F4C5} \u0E43\u0E1A\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: () => setReceiptModal({ pat, visit: lastVisit || vform }) }, "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"))), searchResults.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, border: "1.5px solid var(--primary-light)", borderRadius: 8, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "var(--primary)" } }, "\u0E1E\u0E1A ", searchResults.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), searchResults.map((p) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: p.hn,
      onClick: () => loadPatient(p),
      style: { padding: "9px 12px", cursor: "pointer", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 },
      onMouseEnter: (e) => e.currentTarget.style.background = "#f5f9fc",
      onMouseLeave: (e) => e.currentTarget.style.background = "#fff"
    },
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary)" } }, p.hn), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 10, fontWeight: 600 } }, p.prefix, p.fname, " ", p.lname)),
    /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, p.gender, " / ", age(p.dob), " ", p.idcard ? "| \u0E1A\u0E31\u0E15\u0E23: " + p.idcard : "")
  )))), /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: "var(--primary)" } }, "\u{1F4CB} \u0E04\u0E34\u0E27\u0E15\u0E23\u0E27\u0E08\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), /* @__PURE__ */ React.createElement("span", { className: "tag tag-orange" }, "\u0E23\u0E2D\u0E15\u0E23\u0E27\u0E08 ", todayQueue.length), todayQueueDone.length > 0 && /* @__PURE__ */ React.createElement("span", { className: "tag tag-green" }, "\u0E15\u0E23\u0E27\u0E08\u0E41\u0E25\u0E49\u0E27 ", todayQueueDone.length)), todayQueue.length === 0 && todayQueueDone.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--gray)", padding: "8px 0" } }, '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E34\u0E27\u0E15\u0E23\u0E27\u0E08\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 \u2014 \u0E04\u0E34\u0E27\u0E08\u0E30\u0E16\u0E39\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E08\u0E32\u0E01\u0E2B\u0E19\u0E49\u0E32 "\u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"'), todayQueue.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, todayQueue.map(({ visit, pat: qp }, idx) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: visit.id,
      onClick: () => loadVisit(qp, visit),
      style: { display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", background: (vform == null ? void 0 : vform.id) === visit.id ? "#fff3e0" : "#fffaf0", border: `1.5px solid ${(vform == null ? void 0 : vform.id) === visit.id ? "#e67e22" : "#fde3c4"}`, borderRadius: 8, cursor: "pointer" }
    },
    /* @__PURE__ */ React.createElement("div", { style: { width: 36, height: 36, borderRadius: "50%", background: "#e67e22", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 } }, idx + 1),
    /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--gray-dark)" } }, qp.prefix, qp.fname, " ", qp.lname, " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "var(--gray)", fontSize: 11 } }, "(HN: ", qp.hn, ")")), visit.cc && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#915c00", marginTop: 2 } }, "CC: ", visit.cc)),
    /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm", style: { background: "#e67e22", color: "#fff" }, onClick: (e) => {
      e.stopPropagation();
      loadVisit(qp, visit);
    } }, "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E23\u0E27\u0E08")
  )))), /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14, border: "2px solid #1e8449" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: todayQueueDone.length > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, fontSize: 13, color: "#1e8449" } }, "\u2705 \u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), /* @__PURE__ */ React.createElement("span", { className: "tag tag-green" }, todayQueueDone.length, " \u0E23\u0E32\u0E22"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--gray)", marginLeft: 4 } }, "\u0E04\u0E25\u0E34\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E1B\u0E34\u0E14/\u0E41\u0E01\u0E49\u0E44\u0E02\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08")), todayQueueDone.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, color: "var(--gray)", padding: "4px 0" } }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49"), todayQueueDone.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 8 } }, todayQueueDone.map(({ visit: dv, pat: dp }, idx) => {
    const isActive = (vform == null ? void 0 : vform.id) === dv.id;
    const receipt = typeof receipts !== "undefined" ? receipts == null ? void 0 : receipts.find((r) => r.visitId === dv.id) : null;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: dv.id,
        onClick: () => loadVisit(dp, dv),
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 12px",
          background: isActive ? "#e8f8f0" : "#f4fbf7",
          border: `1.5px solid ${isActive ? "#1e8449" : "#d5f0e0"}`,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.15s"
        },
        onMouseEnter: (e) => !isActive && (e.currentTarget.style.background = "#e8f8f0"),
        onMouseLeave: (e) => !isActive && (e.currentTarget.style.background = "#f4fbf7")
      },
      /* @__PURE__ */ React.createElement("div", { style: { width: 32, height: 32, borderRadius: "50%", background: "#1e8449", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 } }, dv.queueNo || String(idx + 1).padStart(2, "0")),
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--gray-dark)" } }, dp.prefix, dp.fname, " ", dp.lname, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "var(--gray)", fontSize: 11, marginLeft: 6 } }, "HN:", dp.hn)), dv.cc && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555", marginTop: 1 } }, "CC: ", dv.cc.slice(0, 40), dv.cc.length > 40 ? "..." : ""), dv.dx && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#1e8449", fontWeight: 600, marginTop: 1 } }, "Dx: ", dv.dx.slice(0, 40)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { className: "tag tag-green", style: { fontSize: 10 } }, "\u2705 \u0E15\u0E23\u0E27\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08"), receipt && /* @__PURE__ */ React.createElement("span", { className: `tag ${receipt.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "tag-green" : "tag-orange"}`, style: { fontSize: 10 } }, "\u{1F9FE} ", receipt.status)))
    );
  }))), pat && vform && /* @__PURE__ */ React.createElement("div", { className: "card", id: "examine-printarea" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 } }, "\u0E43\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: "10px 24px", fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary)", fontWeight: 700 } }, pat.hn)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25:"), " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.prefix, pat.fname, " ", pat.lname)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E40\u0E1E\u0E28:"), " ", pat.gender), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E2D\u0E32\u0E22\u0E38:"), " ", age(pat.dob)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:"), " ", thaiDate(vform.date)), pat.allergy && pat.allergy !== "-" && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--danger)", fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32: ", pat.allergy), pat.chronic && pat.chronic !== "-" && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--warning)", fontWeight: 600 } }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: ", pat.chronic)), /* @__PURE__ */ React.createElement(VisitRecord, { v: vform, setV: setVform, pat, readOnly: false, medicines, treatmentServices }), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint("examine-printarea", "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 " + pat.prefix + pat.fname + " " + pat.lname) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent", onClick: issueReceiptOnly }, "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 (\u0E2A\u0E48\u0E07\u0E44\u0E1B\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C)")), saved && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, background: "var(--accent-pale)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--accent)" } }, "\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D:"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setCertModal({ pat, visit: vform }) }, "\u{1F4C4} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setAppointModal({ pat, visit: vform }) }, "\u{1F4C5} \u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-accent", onClick: () => setReceiptModal({ pat, visit: vform }) }, "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
}
const MED_INSTRUCTIONS = [
  // Quick-number shortcuts
  { code: "1", short: "1\xD72 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32\u0E41\u0E25\u0E30\u0E40\u0E22\u0E47\u0E19" },
  { code: "2", short: "1\xD71 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 1 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32" },
  { code: "3", short: "1\xD73 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32 \u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 \u0E40\u0E22\u0E47\u0E19" },
  { code: "4", short: "1\xD73 \u0E01\u0E48\u0E2D\u0E19\u0E19\u0E2D\u0E19", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 1 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E01\u0E48\u0E2D\u0E19\u0E19\u0E2D\u0E19" },
  { code: "5", short: "2\xD73 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 2 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32 \u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 \u0E40\u0E22\u0E47\u0E19" },
  { code: "6", short: "1\xD73 \u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E0A\u0E49\u0E32 \u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19 \u0E40\u0E22\u0E47\u0E19" },
  { code: "7", short: "1\xD74 \u0E17\u0E38\u0E01 6 \u0E0A\u0E21.", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E17\u0E38\u0E01 6 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23" },
  { code: "8", short: "PRN \u0E1B\u0E27\u0E14/\u0E44\u0E02\u0E49", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E1B\u0E27\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E35\u0E44\u0E02\u0E49 \u0E17\u0E38\u0E01 4-6 \u0E0A\u0E31\u0E48\u0E27\u0E42\u0E21\u0E07 \u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19 4 \u0E04\u0E23\u0E31\u0E49\u0E07/\u0E27\u0E31\u0E19" },
  // Oral other
  { code: "ac", short: "\u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23 30 \u0E19\u0E32\u0E17\u0E35", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E01\u0E48\u0E2D\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23 30 \u0E19\u0E32\u0E17\u0E35 \u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07" },
  { code: "pc", short: "\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E31\u0E19\u0E17\u0E35", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E31\u0E19\u0E17\u0E35 \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07" },
  { code: "hs", short: "\u0E01\u0E48\u0E2D\u0E19\u0E19\u0E2D\u0E19", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E01\u0E48\u0E2D\u0E19\u0E19\u0E2D\u0E19" },
  { code: "od", short: "\u0E27\u0E31\u0E19\u0E25\u0E30\u0E04\u0E23\u0E31\u0E49\u0E07", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 1 \u0E04\u0E23\u0E31\u0E49\u0E07" },
  { code: "bid", short: "\u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E0A\u0E49\u0E32-\u0E40\u0E22\u0E47\u0E19" },
  { code: "tid", short: "\u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E0A\u0E49\u0E32-\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19-\u0E40\u0E22\u0E47\u0E19" },
  { code: "qid", short: "\u0E27\u0E31\u0E19\u0E25\u0E30 4 \u0E04\u0E23\u0E31\u0E49\u0E07", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E40\u0E21\u0E47\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 4 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E0A\u0E49\u0E32-\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19-\u0E40\u0E22\u0E47\u0E19-\u0E01\u0E48\u0E2D\u0E19\u0E19\u0E2D\u0E19" },
  // Syrup
  { code: "sy1", short: "\u0E19\u0E49\u0E33\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21 1 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 1 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32 (5 \u0E21\u0E25.) \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23" },
  { code: "sy2", short: "\u0E19\u0E49\u0E33\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21 2 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32", full: "\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E30\u0E17\u0E32\u0E19 2 \u0E0A\u0E49\u0E2D\u0E19\u0E0A\u0E32 (10 \u0E21\u0E25.) \u0E27\u0E31\u0E19\u0E25\u0E30 3 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E32\u0E2B\u0E32\u0E23" },
  // Injection
  { code: "im", short: "\u0E09\u0E35\u0E14 IM \u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27", full: "\u0E09\u0E35\u0E14\u0E40\u0E02\u0E49\u0E32\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D (IM) \u0E04\u0E23\u0E31\u0E49\u0E07\u0E25\u0E30 1 \u0E2B\u0E25\u0E2D\u0E14 \u0E04\u0E23\u0E31\u0E49\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27" },
  { code: "iv", short: "\u0E43\u0E2B\u0E49\u0E17\u0E32\u0E07 IV", full: "\u0E43\u0E2B\u0E49\u0E17\u0E32\u0E07\u0E2B\u0E25\u0E2D\u0E14\u0E40\u0E25\u0E37\u0E2D\u0E14\u0E14\u0E33 (IV) \u0E15\u0E32\u0E21\u0E41\u0E1C\u0E19\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32" },
  { code: "sc", short: "\u0E09\u0E35\u0E14 SC", full: "\u0E09\u0E35\u0E14\u0E40\u0E02\u0E49\u0E32\u0E43\u0E15\u0E49\u0E1C\u0E34\u0E27\u0E2B\u0E19\u0E31\u0E07 (SC) \u0E15\u0E32\u0E21\u0E41\u0E1C\u0E19\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32" },
  { code: "im2", short: "\u0E09\u0E35\u0E14 IM \u0E27\u0E31\u0E19\u0E40\u0E27\u0E49\u0E19\u0E27\u0E31\u0E19", full: "\u0E09\u0E35\u0E14\u0E40\u0E02\u0E49\u0E32\u0E01\u0E25\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D (IM) \u0E27\u0E31\u0E19\u0E40\u0E27\u0E49\u0E19\u0E27\u0E31\u0E19" },
  // External
  { code: "cr", short: "\u0E17\u0E32\u0E04\u0E23\u0E35\u0E21/\u0E02\u0E35\u0E49\u0E1C\u0E36\u0E49\u0E07", full: "\u0E17\u0E32\u0E1A\u0E23\u0E34\u0E40\u0E27\u0E13\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23 \u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E0A\u0E49\u0E32-\u0E40\u0E22\u0E47\u0E19" },
  { code: "eye", short: "\u0E2B\u0E22\u0E2D\u0E14\u0E15\u0E32", full: "\u0E2B\u0E22\u0E2D\u0E14\u0E15\u0E32 \u0E02\u0E49\u0E32\u0E07\u0E25\u0E30 1-2 \u0E2B\u0E22\u0E14 \u0E27\u0E31\u0E19\u0E25\u0E30 3-4 \u0E04\u0E23\u0E31\u0E49\u0E07" },
  { code: "nh", short: "\u0E1E\u0E48\u0E19\u0E08\u0E21\u0E39\u0E01", full: "\u0E1E\u0E48\u0E19\u0E08\u0E21\u0E39\u0E01 \u0E02\u0E49\u0E32\u0E07\u0E25\u0E30 1-2 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E27\u0E31\u0E19\u0E25\u0E30 2 \u0E04\u0E23\u0E31\u0E49\u0E07 \u0E40\u0E0A\u0E49\u0E32-\u0E40\u0E22\u0E47\u0E19" }
];
function InstructionField({ value, onChange }) {
  const [q, setQ] = useState(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    setQ(value || "");
  }, [value]);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const matches = q.trim().length > 0 ? MED_INSTRUCTIONS.filter(
    (t) => t.code.toLowerCase().startsWith(q.toLowerCase()) || t.short.toLowerCase().includes(q.toLowerCase()) || t.full.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8) : MED_INSTRUCTIONS.slice(0, 8);
  const pick = (tpl) => {
    setQ(tpl.full);
    onChange(tpl.full);
    setOpen(false);
  };
  return /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", flex: 1 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        onChange(e.target.value);
        setOpen(true);
      },
      onFocus: () => setOpen(true),
      placeholder: '\u0E1E\u0E34\u0E21\u0E1E\u0E4C "1" "2" \u0E2B\u0E23\u0E37\u0E2D "tid" "im" \u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E40\u0E2D\u0E07...',
      style: { width: "100%", fontSize: 12, padding: "7px 10px" }
    }
  ), open && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #1a5276", borderRadius: 6, zIndex: 600, boxShadow: "0 4px 18px rgba(0,0,0,0.13)", maxHeight: 220, overflowY: "auto" } }, matches.map((t, i) => /* @__PURE__ */ React.createElement(
    "div",
    {
      key: i,
      onClick: () => pick(t),
      style: { padding: "7px 11px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "flex-start" },
      onMouseEnter: (e) => e.currentTarget.style.background = "#e8f0fc",
      onMouseLeave: (e) => e.currentTarget.style.background = "#fff"
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#1a5276", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 } }, t.code),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, fontWeight: 600, color: "#1a5276" } }, t.short), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#666", marginTop: 1 } }, t.full))
  )), matches.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px", color: "#888", fontSize: 12 } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E17\u0E35\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19")));
}
function DrugConfirmModal({ med, allergyList, onConfirm, onCancel }) {
  const [qty, setQty] = useState(10);
  const [freq, setFreq] = useState("");
  const isAllergic = allergyList && allergyList !== "-" && allergyList.toLowerCase().split(/[\s,;/]+/).filter((a) => a.length > 2).some((a) => med.name.toLowerCase().includes(a));
  const isLow = med.stock <= med.minstock;
  const confirm = () => {
    if (!freq.trim()) {
      alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E22\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19");
      return;
    }
    onConfirm({ name: med.name, qty, unit: med.unit, freq, price: med.price, medId: med.id, stock: med.stock });
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2e3, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
      onClick: (e) => {
        if (e.target === e.currentTarget) onCancel();
      }
    },
    /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.22)", width: "100%", maxWidth: 520, padding: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 40, height: 40, background: "#1e8449", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 } }, "\u{1F48A}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "#1a5276" } }, "\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07\u0E22\u0E32"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#666", marginTop: 1 } }, "\u0E01\u0E23\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E22\u0E32\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23")), /* @__PURE__ */ React.createElement("button", { onClick: onCancel, style: { marginLeft: "auto", background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#999", lineHeight: 1 } }, "\xD7")), /* @__PURE__ */ React.createElement("div", { style: { background: "#f0faf5", border: "1.5px solid #a8d5c8", borderRadius: 8, padding: "10px 14px", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "#1a5276" } }, med.name), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, marginTop: 4, fontSize: 12, color: "#555", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2B\u0E21\u0E27\u0E14: ", med.category), /* @__PURE__ */ React.createElement("span", null, "\u0E23\u0E32\u0E04\u0E32: ", /* @__PURE__ */ React.createElement("b", { style: { color: "#1e8449" } }, med.price, "\u0E3F/", med.unit)), /* @__PURE__ */ React.createElement("span", { style: { color: isLow ? "#c0392b" : "#1e8449" } }, "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D: ", /* @__PURE__ */ React.createElement("b", null, med.stock, " ", med.unit), isLow ? " \u26A0\uFE0F \u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E15\u0E48\u0E33" : "")), isAllergic && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, background: "#fff0f0", border: "1.5px solid #e74c3c", borderRadius: 6, padding: "7px 10px", fontSize: 12, color: "#c0392b", fontWeight: 600 } }, "\u26A0\uFE0F \u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19: \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E41\u0E1E\u0E49\u0E22\u0E32\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E08\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07 (", allergyList, ") \u2014 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E01\u0E48\u0E2D\u0E19\u0E2A\u0E31\u0E48\u0E07\u0E22\u0E32"), isLow && !isAllergic && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8, background: "#fff8e1", border: "1px solid #f39c12", borderRadius: 6, padding: "6px 10px", fontSize: 11.5, color: "#d35400" } }, "\u26A0\uFE0F \u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E22\u0E32\u0E15\u0E48\u0E33\u0E01\u0E27\u0E48\u0E32\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 (", med.stock, " \u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E08\u0E32\u0E01 minimum ", med.minstock, ") \u2014 \u0E22\u0E31\u0E07\u0E2A\u0E31\u0E48\u0E07\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E1B\u0E01\u0E15\u0E34")), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, fontSize: 12, color: "#2c3e50", marginBottom: 5, display: "block" } }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E48\u0E07 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#c0392b" } }, "*")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ React.createElement("button", { onClick: () => setQty((q) => Math.max(1, q - 1)), style: { width: 32, height: 32, border: "1.5px solid #1a5276", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#1a5276" } }, "\u2212"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        value: qty,
        onChange: (e) => setQty(Math.max(1, Number(e.target.value))),
        style: { width: 80, textAlign: "center", fontSize: 15, fontWeight: 700, padding: "6px" }
      }
    ), /* @__PURE__ */ React.createElement("button", { onClick: () => setQty((q) => q + 1), style: { width: 32, height: 32, border: "1.5px solid #1a5276", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#1a5276" } }, "+"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: "#666" } }, med.unit), [7, 10, 14, 20, 28, 30].map((n) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: n,
        onClick: () => setQty(n),
        style: { padding: "4px 8px", border: `1.5px solid ${qty === n ? "#1a5276" : "#ddd"}`, borderRadius: 5, background: qty === n ? "#1a5276" : "#fff", color: qty === n ? "#fff" : "#555", cursor: "pointer", fontSize: 11, fontWeight: 600 }
      },
      n
    )))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, fontSize: 12, color: "#2c3e50", marginBottom: 5, display: "block" } }, "\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E22\u0E32 ", /* @__PURE__ */ React.createElement("span", { style: { color: "#c0392b" } }, "*"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "#888", marginLeft: 6, fontSize: 11 } }, '\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02 (1-8) \u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E2B\u0E31\u0E2A \u0E40\u0E0A\u0E48\u0E19 "tid", "im" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08')), /* @__PURE__ */ React.createElement(InstructionField, { value: freq, onChange: setFreq }), !freq.trim() && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#e74c3c", marginTop: 3 } }, "\u26A0\uFE0F \u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E1A\u0E38\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19")), freq.trim() && /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fff8", border: "1.5px solid #2ecc71", borderRadius: 7, padding: "8px 12px", marginBottom: 14, fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#1e8449", marginBottom: 3 } }, "\u{1F4CB} \u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E09\u0E25\u0E32\u0E01\u0E22\u0E32"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, med.name), " \u2014 \u0E08\u0E33\u0E19\u0E27\u0E19 ", qty, " ", med.unit), /* @__PURE__ */ React.createElement("div", { style: { color: "#1a5276", marginTop: 2 } }, freq)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { onClick: onCancel, className: "btn btn-gray btn-sm" }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: confirm,
        style: { padding: "8px 22px", background: freq.trim() ? "#1e8449" : "#aaa", color: "#fff", border: "none", borderRadius: 6, cursor: freq.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }
      },
      "\u2705 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E22\u0E32\u0E43\u0E19\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2A\u0E31\u0E48\u0E07"
    )))
  );
}
function DrugAutocomplete({ medicines, onAdd, allergyList }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const ref = useRef(null);
  const isAllergic = (name) => {
    if (!allergyList || allergyList === "-") return false;
    return allergyList.toLowerCase().split(/[\s,;/]+/).filter((a) => a.length > 2).some((a) => name.toLowerCase().includes(a));
  };
  const matches = q.trim().length > 0 ? medicines.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())).slice(0, 12) : [];
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selectMed = (med) => {
    setOpen(false);
    setQ("");
    setPending(med);
  };
  const confirmAdd = (drug) => {
    onAdd(drug);
    setPending(null);
  };
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { ref, style: { background: "#f0faf8", border: "1.5px solid #a8d5c8", borderRadius: 8, padding: "10px 12px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: "#1e8449", marginBottom: 8 } }, "\u{1F48A} \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E22\u0E32\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u0E22\u0E32", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, color: "#888", marginLeft: 8, fontSize: 11 } }, "\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E22\u0E32 \u2192 \u0E23\u0E30\u0E1A\u0E38\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49 \u2192 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19")), /* @__PURE__ */ React.createElement("div", { style: { position: "relative" } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: q,
      onChange: (e) => {
        setQ(e.target.value);
        setOpen(true);
      },
      onFocus: () => setOpen(true),
      placeholder: "\u{1F50D} \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32: amoxy, augm, para, omep, lorat...",
      style: { fontSize: 13, width: "100%", paddingRight: 32 }
    }
  ), q && /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setQ("");
    setOpen(false);
  }, style: { position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16, lineHeight: 1 } }, "\xD7"), open && matches.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "drug-dropdown" }, matches.map((m) => {
    const isLow = m.stock <= m.minstock;
    const allergic = isAllergic(m.name);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: m.id,
        className: `drug-item${allergic ? " drug-allergy-row" : ""}`,
        onClick: () => selectMed(m)
      },
      /* @__PURE__ */ React.createElement("div", { style: { flex: 1 } }, allergic && /* @__PURE__ */ React.createElement("span", { style: { color: "#c0392b", fontWeight: 700, marginRight: 4 } }, "\u26A0\uFE0F"), /* @__PURE__ */ React.createElement("b", { style: { fontSize: 13 } }, m.name), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "#888", marginLeft: 6 } }, m.category)),
      /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, textAlign: "right", whiteSpace: "nowrap", display: "flex", gap: 8, alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "#1e8449", fontWeight: 600 } }, m.price, "\u0E3F/", m.unit), /* @__PURE__ */ React.createElement("span", { style: { background: isLow ? "#ffeaea" : "#e8f8f0", color: isLow ? "#c0392b" : "#1e8449", borderRadius: 4, padding: "1px 6px", fontWeight: 600 } }, isLow ? "\u26A0\uFE0F " : "", "\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D ", m.stock))
    );
  })), open && q.trim().length > 0 && matches.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "drug-dropdown" }, /* @__PURE__ */ React.createElement("div", { style: { padding: "10px 12px", color: "#888", fontSize: 12 } }, '\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E22\u0E32\u0E43\u0E19\u0E04\u0E25\u0E31\u0E07 "', q, '"')))), pending && /* @__PURE__ */ React.createElement(
    DrugConfirmModal,
    {
      med: pending,
      allergyList,
      onConfirm: confirmAdd,
      onCancel: () => setPending(null)
    }
  ));
}
function printMedLabel(drug, pat, visitDate) {
  const win = window.open("", "_blank", "width=400,height=320");
  win.document.write(`<!DOCTYPE html><html><head><title>\u0E09\u0E25\u0E32\u0E01\u0E22\u0E32</title>
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
      <img src="${CLINIC_LOGO}" alt="logo" style="height:30px;display:block;margin:0 auto 3px;"/>
      <div class="clinic">${CLINIC_NAME}</div>
      <div class="addr">${CLINIC_ADDRESS} \u0E42\u0E17\u0E23.${CLINIC_TEL}</div>
    </div>
    <div class="drug">\u{1F48A} ${drug.name}</div>
    <div class="row"><span>\u0E08\u0E33\u0E19\u0E27\u0E19:</span><span><b>${drug.qty} ${drug.unit}</b></span></div>
    <div class="freq">\u{1F4CB} ${drug.freq || "-"}</div>
    <div style="height:4px;"></div>
    <div class="row"><span>\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22:</span><span><b>${pat ? pat.prefix + pat.fname + " " + pat.lname : "\u2014"}</b></span></div>
    <div class="row"><span>HN:</span><span>${(pat == null ? void 0 : pat.hn) || "\u2014"}</span></div>
    <div class="row"><span>\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22\u0E22\u0E32:</span><span>${thaiDate(visitDate || today())}</span></div>
    <div class="footer">
      <div>\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E1C\u0E39\u0E49\u0E2A\u0E31\u0E48\u0E07: ${DOCTOR_NAME} (${DOCTOR_LICENSE})</div>
      <div style="margin-top:2px;color:#c0392b;font-size:9px;">\u26A0\uFE0F \u0E42\u0E1B\u0E23\u0E14\u0E2D\u0E48\u0E32\u0E19\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E43\u0E2B\u0E49\u0E04\u0E23\u0E1A\u0E16\u0E49\u0E27\u0E19 \u0E2B\u0E32\u0E01\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34\u0E2B\u0E22\u0E38\u0E14\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32\u0E41\u0E1E\u0E17\u0E22\u0E4C</div>
    </div>
  </div>
  <div style="text-align:center;margin-top:8px;">
    <button onclick="window.print()" style="padding:6px 18px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-family:'Sarabun',sans-serif;">\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E09\u0E25\u0E32\u0E01\u0E22\u0E32</button>
  </div>
  </body></html>`);
  win.document.close();
}
function TreatmentOrderBox({ services, onServicesChange, treatmentServices, readOnly }) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);
  const svcCats = [...new Set((treatmentServices || []).filter((s) => s.active).map((s) => s.category))];
  const filtered = (treatmentServices || []).filter((s) => s.active && (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())));
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const addService = (svc) => {
    const existing = services.find((s) => s.serviceId === svc.id);
    if (existing) {
      onServicesChange(services.map((s) => s.serviceId === svc.id ? { ...s, qty: (s.qty || 1) + 1 } : s));
    } else {
      onServicesChange([...services, { serviceId: svc.id, name: svc.name, qty: 1, unit: svc.unit, price: svc.price, category: svc.category }]);
    }
    setSearch("");
    setShowDropdown(false);
  };
  const rmService = (i) => onServicesChange(services.filter((_, idx) => idx !== i));
  const updService = (i, k, v) => onServicesChange(services.map((s, idx) => idx === i ? { ...s, [k]: k === "qty" || k === "price" ? Number(v) : v } : s));
  const total = services.reduce((s, i) => s + (i.qty || 1) * i.price, 0);
  return /* @__PURE__ */ React.createElement("div", { style: { background: "linear-gradient(135deg,#e8f8f0,#f0fff8)", border: "2px solid #1e8449", borderRadius: 10, padding: "12px 14px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 28, height: 28, background: "#1e8449", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 } }, "\u{1F3E5}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "#1e8449" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08 \u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23 \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E15\u0E48\u0E32\u0E07\u0E46 (\u0E44\u0E21\u0E48\u0E2B\u0E31\u0E01\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E22\u0E32)"))), !readOnly && total > 0 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#1e8449" } }, "\u0E23\u0E27\u0E21: ", total.toLocaleString(), "\u0E3F")), !readOnly && /* @__PURE__ */ React.createElement("div", { ref, style: { position: "relative", marginBottom: services.length > 0 ? 10 : 0 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: search,
      onChange: (e) => {
        setSearch(e.target.value);
        setShowDropdown(true);
      },
      onFocus: () => setShowDropdown(true),
      placeholder: "\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23: \u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08 \u0E09\u0E35\u0E14\u0E22\u0E32 \u0E1E\u0E31\u0E19\u0E41\u0E1C\u0E25 EKG ...",
      style: { width: "100%", fontSize: 13, borderColor: "#1e8449" }
    }
  ), showDropdown && /* @__PURE__ */ React.createElement("div", { style: { position: "absolute", top: "calc(100%+2px)", left: 0, right: 0, background: "#fff", border: "1.5px solid #1e8449", borderRadius: 6, zIndex: 500, boxShadow: "0 4px 18px rgba(0,0,0,0.12)", maxHeight: 260, overflowY: "auto" } }, svcCats.map((cat) => {
    const catItems = filtered.filter((s) => s.category === cat);
    if (catItems.length === 0) return null;
    return /* @__PURE__ */ React.createElement("div", { key: cat }, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 12px", fontSize: 11, fontWeight: 700, color: "#1a5276", background: "#eef6ff", letterSpacing: 0.5 } }, cat), catItems.map((svc) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: svc.id,
        onClick: () => addService(svc),
        style: { padding: "8px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f0f5f0", fontSize: 13 },
        onMouseEnter: (e) => e.currentTarget.style.background = "#e8f8f0",
        onMouseLeave: (e) => e.currentTarget.style.background = "#fff"
      },
      /* @__PURE__ */ React.createElement("span", null, svc.name),
      /* @__PURE__ */ React.createElement("span", { style: { color: "#1e8449", fontWeight: 700, fontSize: 12 } }, svc.price > 0 ? svc.price.toLocaleString() + "\u0E3F/" + svc.unit : "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07")
    )));
  }), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { style: { padding: "12px", color: "#888", fontSize: 12, textAlign: "center" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E04\u0E49\u0E19\u0E2B\u0E32"))), services.length > 0 && /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#1e8449", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "left", width: 80 } }, "\u0E2B\u0E21\u0E27\u0E14"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "center", width: 50 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "right", width: 80 } }, "\u0E23\u0E32\u0E04\u0E32"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "right", width: 70 } }, "\u0E23\u0E27\u0E21"), !readOnly && /* @__PURE__ */ React.createElement("th", { style: { width: 26 } }))), /* @__PURE__ */ React.createElement("tbody", null, services.map((s, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: i % 2 === 0 ? "#fff" : "#f0faf5" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", fontWeight: 600, color: "#1a5276" } }, s.name), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px" } }, /* @__PURE__ */ React.createElement("span", { className: "tag tag-green", style: { fontSize: 10 } }, s.category)), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "center" } }, readOnly ? /* @__PURE__ */ React.createElement("b", null, s.qty || 1) : /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: s.qty || 1,
      onChange: (e) => updService(i, "qty", e.target.value),
      style: { width: 44, textAlign: "center", fontSize: 11, padding: "2px 3px" }
    }
  )), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "right" } }, readOnly ? s.price.toLocaleString() : /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "number",
      value: s.price,
      onChange: (e) => updService(i, "price", e.target.value),
      style: { width: 70, textAlign: "right", fontSize: 11, padding: "2px 4px" }
    }
  ), "\u0E3F"), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "right", fontWeight: 700, color: "#1e8449" } }, ((s.qty || 1) * s.price).toLocaleString(), "\u0E3F"), !readOnly && /* @__PURE__ */ React.createElement("td", { style: { padding: "3px" } }, /* @__PURE__ */ React.createElement("button", { onClick: () => rmService(i), style: { background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 13 } }, "\u2715")))), /* @__PURE__ */ React.createElement("tr", { style: { background: "#d5f5e3", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("td", { colSpan: readOnly ? 3 : 3, style: { padding: "5px 8px", textAlign: "right", fontSize: 12 } }, "\u0E23\u0E27\u0E21\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("td", { colSpan: readOnly ? 2 : 2, style: { padding: "5px 8px", textAlign: "right", fontSize: 13, color: "#1e8449" } }, total.toLocaleString(), "\u0E3F"), !readOnly && /* @__PURE__ */ React.createElement("td", null)))), services.length === 0 && readOnly && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#888", padding: "4px 0" } }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23"));
}
function VisitRecord({ v, setV, pat, readOnly, medicines, treatmentServices }) {
  const f = (k, val) => setV && setV((prev) => ({ ...prev, [k]: val }));
  const drugs = v.drugs || [];
  const services = v.services || [];
  const addDrug = (d) => f("drugs", [...drugs, { ...d }]);
  const rmDrug = (i) => f("drugs", drugs.filter((_, idx) => idx !== i));
  const updDrug = (i, k, val) => f("drugs", drugs.map((d, idx) => idx === i ? { ...d, [k]: val } : d));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--gray-pale)", borderRadius: 8, padding: "10px 14px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: "var(--primary)", marginBottom: 8 } }, "\u{1F534} \u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E0A\u0E35\u0E1E (Vital Signs)"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 } }, [["BP (mmHg)", "bp"], ["PR (bpm)", "pr"], ["RR (/min)", "rr"], ["Temp (\xB0C)", "temp"], ["O\u2082 Sat (%)", "o2"], ["\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01 (kg)", "weight"], ["\u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E39\u0E07 (cm)", "height"]].map(([l, k]) => /* @__PURE__ */ React.createElement("div", { key: k }, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11 } }, l), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 14 } }, v[k] || "-") : /* @__PURE__ */ React.createElement("input", { value: v[k] || "", onChange: (e) => f(k, e.target.value), style: { padding: "5px 8px" } }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11 } }, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E42\u0E14\u0E22"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, fontSize: 13 } }, v.nurse || "-") : /* @__PURE__ */ React.createElement("input", { value: v.nurse || "", onChange: (e) => f("nurse", e.target.value), style: { padding: "5px 8px" } })))), /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: 8, border: "1.5px solid var(--gray-light)", padding: "12px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "CC. (\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E19\u0E33\u0E21\u0E32\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01)"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0" } }, v.cc || "-") : /* @__PURE__ */ React.createElement("input", { value: v.cc || "", onChange: (e) => f("cc", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E02\u0E49 \u0E1B\u0E27\u0E14\u0E28\u0E35\u0E23\u0E29\u0E30 2 \u0E27\u0E31\u0E19" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "DX. (\u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22)"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0" } }, v.dx || "-") : /* @__PURE__ */ React.createElement("input", { value: v.dx || "", onChange: (e) => f("dx", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 URI (J069), Gastritis (K29.7)" }))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "PI. (\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E48\u0E27\u0E22\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19)"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0", whiteSpace: "pre-wrap" } }, v.pi || "-") : /* @__PURE__ */ React.createElement("textarea", { value: v.pi || "", onChange: (e) => f("pi", e.target.value), rows: 3, placeholder: "Onset, \u0E23\u0E30\u0E22\u0E30\u0E40\u0E27\u0E25\u0E32, \u0E2D\u0E32\u0E01\u0E32\u0E23\u0E23\u0E48\u0E27\u0E21, \u0E1B\u0E31\u0E08\u0E08\u0E31\u0E22\u0E17\u0E35\u0E48\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E14\u0E35\u0E02\u0E36\u0E49\u0E19/\u0E41\u0E22\u0E48\u0E25\u0E07 \u0E2F\u0E25\u0E2F", style: { resize: "vertical" } })), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "PE. (\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22)"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0", whiteSpace: "pre-wrap" } }, v.pe || "-") : /* @__PURE__ */ React.createElement("textarea", { value: v.pe || "", onChange: (e) => f("pe", e.target.value), rows: 4, placeholder: "General appearance:\nHEENT:\nLung:\nHeart:\nAbdomen:\nExtremities:", style: { resize: "vertical" } })), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "TX. (\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32 / \u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32)"), !readOnly && medicines && /* @__PURE__ */ React.createElement(DrugAutocomplete, { medicines, onAdd: addDrug, allergyList: pat == null ? void 0 : pat.allergy }), drugs.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#f4fbf7", border: "1.5px solid #aeddc8", borderRadius: 7, padding: "8px 10px", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 12, color: "#1e8449", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", null, "\u{1F48A} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32\u0E17\u0E35\u0E48\u0E2A\u0E31\u0E48\u0E07 (", drugs.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)"), !readOnly && /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 400, fontSize: 11, color: "#888" } }, "\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E41\u0E01\u0E49\u0E44\u0E02\u0E08\u0E33\u0E19\u0E27\u0E19/\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E43\u0E19\u0E15\u0E32\u0E23\u0E32\u0E07")), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#1e8449", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left" } }, "\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "center", width: 60 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left", width: 50 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left", minWidth: 200 } }, "\u0E27\u0E34\u0E18\u0E35\u0E43\u0E0A\u0E49"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 75 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 70 } }, "\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 4px", width: readOnly ? 90 : 60 }, className: "no-print" }, readOnly ? "\u0E09\u0E25\u0E32\u0E01\u0E22\u0E32" : ""))), /* @__PURE__ */ React.createElement("tbody", null, drugs.map((d, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: i % 2 === 0 ? "#fff" : "#f0faf5", verticalAlign: "top" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", fontWeight: 700, color: "#1a5276" } }, d.name, d.stock <= d.minstock && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 9.5, color: "#e67e22", fontWeight: 400 } }, "\u26A0\uFE0F \u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E15\u0E48\u0E33")), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 8px", textAlign: "center" } }, readOnly ? /* @__PURE__ */ React.createElement("b", null, d.qty) : /* @__PURE__ */ React.createElement("input", { type: "number", value: d.qty, onChange: (e) => updDrug(i, "qty", Math.max(1, Number(e.target.value))), style: { width: 50, textAlign: "center", fontSize: 12, padding: "3px 4px" } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", color: "#555" } }, d.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 8px" } }, readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#1a5276", fontWeight: 600, lineHeight: 1.5 } }, d.freq || "-") : /* @__PURE__ */ React.createElement(InstructionField, { value: d.freq || "", onChange: (val) => updDrug(i, "freq", val) })), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", textAlign: "right", color: "#1e8449" } }, d.price, "\u0E3F"), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 8px", textAlign: "right", fontWeight: 700 } }, (d.qty * d.price).toLocaleString(), "\u0E3F"), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 4px", textAlign: "center" }, className: "no-print" }, readOnly ? /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => printMedLabel(d, pat, v.date),
      style: { padding: "4px 7px", background: "#6c3483", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10.5, fontWeight: 700, whiteSpace: "nowrap", fontFamily: "inherit" }
    },
    "\u{1F3F7}\uFE0F \u0E09\u0E25\u0E32\u0E01\u0E22\u0E32"
  ) : /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 3 } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => printMedLabel(d, pat, v.date),
      style: { padding: "3px 6px", background: "#6c3483", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, fontFamily: "inherit", whiteSpace: "nowrap" }
    },
    "\u{1F3F7}\uFE0F \u0E09\u0E25\u0E32\u0E01\u0E22\u0E32"
  ), /* @__PURE__ */ React.createElement("button", { onClick: () => rmDrug(i), style: { padding: "3px 6px", background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10, fontFamily: "inherit" } }, "\u2715 \u0E25\u0E1A")))))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#e8f8f0", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "6px 8px", textAlign: "right", fontSize: 12 } }, "\u0E23\u0E27\u0E21\u0E04\u0E48\u0E32\u0E22\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 8px", textAlign: "right", fontSize: 14, color: "#1e8449" } }, drugs.reduce((s, d) => s + d.qty * d.price, 0).toLocaleString(), "\u0E3F"), /* @__PURE__ */ React.createElement("td", { className: "no-print" }))))), /* @__PURE__ */ React.createElement(
    TreatmentOrderBox,
    {
      services,
      onServicesChange: (val) => f("services", val),
      treatmentServices,
      readOnly
    }
  ), /* @__PURE__ */ React.createElement("label", { style: { fontSize: 11.5, color: "var(--gray)", marginBottom: 3, display: "block" } }, "\u0E04\u0E33\u0E2A\u0E31\u0E48\u0E07\u0E23\u0E31\u0E01\u0E29\u0E32\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 / \u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0", whiteSpace: "pre-wrap" } }, v.tx || "-") : /* @__PURE__ */ React.createElement("textarea", { value: v.tx || "", onChange: (e) => f("tx", e.target.value), rows: 3, placeholder: "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33, follow-up, \u0E2D\u0E37\u0E48\u0E19\u0E46", style: { resize: "vertical" } })), !readOnly && /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: 700, color: "var(--gray-dark)" } }, "Note (\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21)"), readOnly ? /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, padding: "4px 0" } }, v.note || "-") : /* @__PURE__ */ React.createElement("textarea", { value: v.note || "", onChange: (e) => f("note", e.target.value), rows: 2, placeholder: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38\u0E2D\u0E37\u0E48\u0E19\u0E46", style: { resize: "vertical" } }))));
}
const CERT_DISEASES_5 = [
  { key: "d1", label: "(1) \u0E27\u0E31\u0E13\u0E42\u0E23\u0E04\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E41\u0E1E\u0E23\u0E48\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22\u0E40\u0E0A\u0E37\u0E49\u0E2D" },
  { key: "d2", label: "(2) \u0E42\u0E23\u0E04\u0E40\u0E17\u0E49\u0E32\u0E0A\u0E49\u0E32\u0E07\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E07\u0E40\u0E01\u0E35\u0E22\u0E08\u0E41\u0E01\u0E48\u0E2A\u0E31\u0E07\u0E04\u0E21" },
  { key: "d3", label: "(3) \u0E42\u0E23\u0E04\u0E15\u0E34\u0E14\u0E2A\u0E32\u0E23\u0E40\u0E2A\u0E1E\u0E15\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E42\u0E17\u0E29" },
  { key: "d4", label: "(4) \u0E42\u0E23\u0E04\u0E1E\u0E34\u0E29\u0E2A\u0E38\u0E23\u0E32\u0E40\u0E23\u0E37\u0E49\u0E2D\u0E23\u0E31\u0E07" },
  { key: "d5", label: "(5) \u0E42\u0E23\u0E04\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E23\u0E49\u0E32\u0E22\u0E41\u0E23\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E42\u0E23\u0E04\u0E40\u0E23\u0E37\u0E49\u0E2D\u0E23\u0E31\u0E07\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E14\u0E48\u0E19\u0E0A\u0E31\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E15\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E43\u0E19\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E15\u0E32\u0E21\u0E17\u0E35\u0E48 \u0E01.\u0E1E. \u0E01\u0E33\u0E2B\u0E19\u0E14" }
];
function CertPage({ patients, visits, getPatient }) {
  var _a;
  const [type, setType] = useState("sick");
  const [hn, setHn] = useState("");
  const [pat, setPat] = useState(null);
  const [certNo, setCertNo] = useState("");
  const [examDate, setExamDate] = useState(today());
  const [certDate, setCertDate] = useState(today());
  const [diagText, setDiagText] = useState("");
  const [restDays, setRestDays] = useState("");
  const [fromDate, setFromDate] = useState(today());
  const [toDate, setToDate] = useState("");
  const [doctorNote, setDoctorNote] = useState("");
  const [d5results, setD5results] = useState({ d1: "none", d2: "none", d3: "none", d4: "none", d5: "none" });
  const [d5notes, setD5notes] = useState({ d1: "", d2: "", d3: "", d4: "", d5: "" });
  const [d6note, setD6note] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [drvBookNo, setDrvBookNo] = useState("");
  const [drvCertNo, setDrvCertNo] = useState("");
  const [drvAddr, setDrvAddr] = useState("");
  const [drvWeight, setDrvWeight] = useState("");
  const [drvHeight, setDrvHeight] = useState("");
  const [drvBP, setDrvBP] = useState("");
  const [drvPR, setDrvPR] = useState("");
  const [drvExamDate, setDrvExamDate] = useState(today());
  const [drvHist, setDrvHist] = useState({
    chronic: { has: false, detail: "" },
    accident: { has: false, detail: "" },
    hospital: { has: false, detail: "" },
    epilepsy: { has: false, detail: "" },
    other: { has: false, detail: "" }
  });
  const updDrvHist = (k, f, v) => setDrvHist((prev) => ({ ...prev, [k]: { ...prev[k], [f]: v } }));
  const [drvBodyResult, setDrvBodyResult] = useState("normal");
  const [drvBodyNote, setDrvBodyNote] = useState("");
  const [drvFitResult, setDrvFitResult] = useState("fit");
  const [drvFitReason, setDrvFitReason] = useState("");
  const [drvDiseases, setDrvDiseases] = useState([
    { key: "d1", label: "1. \u0E42\u0E23\u0E04\u0E40\u0E23\u0E37\u0E2D\u0E19\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D \u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E07\u0E40\u0E01\u0E35\u0E22\u0E08\u0E41\u0E01\u0E48\u0E2A\u0E31\u0E07\u0E04\u0E21", found: false, note: "" },
    { key: "d2", label: "2. \u0E27\u0E31\u0E13\u0E42\u0E23\u0E04\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22", found: false, note: "" },
    { key: "d3", label: "3. \u0E42\u0E23\u0E04\u0E40\u0E17\u0E49\u0E32\u0E0A\u0E49\u0E32\u0E07\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E23\u0E31\u0E07\u0E40\u0E01\u0E35\u0E22\u0E08\u0E41\u0E01\u0E48\u0E2A\u0E31\u0E07\u0E04\u0E21", found: false, note: "" },
    { key: "d4", label: "4. \u0E2D\u0E37\u0E48\u0E19 \u0E46 (\u0E16\u0E49\u0E32\u0E21\u0E35)", found: false, note: "" }
  ]);
  const updDrvDisease = (i, f, v) => setDrvDiseases((prev) => prev.map((d, idx) => idx === i ? { ...d, [f]: v } : d));
  const [drvConclusion, setDrvConclusion] = useState("");
  const searchPat = () => {
    const p = getPatient(hn.trim());
    if (!p) {
      alert("\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22");
      return;
    }
    setPat(p);
    setDrvAddr(p.address || "");
  };
  const calcAge = (dob) => {
    if (!dob) return "\u2014";
    return Math.floor((/* @__PURE__ */ new Date() - /* @__PURE__ */ new Date(dob + "T00:00:00")) / (365.25 * 24 * 60 * 60 * 1e3)) + " \u0E1B\u0E35";
  };
  const certTypes = [
    { k: "sick", l: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C (\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E48\u0E27\u0E22)" },
    { k: "group5", l: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C 5 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E42\u0E23\u0E04" },
    { k: "driving", l: "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C (\u0E43\u0E1A\u0E02\u0E31\u0E1A\u0E02\u0E35\u0E48)" }
  ];
  const DotLine = ({ w = "100%", style = {} }) => /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", borderBottom: "1px dotted #555", minWidth: w, ...style, verticalAlign: "bottom" } }, "\xA0");
  const FieldLine = ({ label, value, onChange, width = "100%", inline = false, type: type2 = "text" }) => inline ? /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13 } }, label, /* @__PURE__ */ React.createElement("input", { value, onChange: (e) => onChange(e.target.value), type: type2, style: { display: "inline-block", width, borderBottom: "1px dotted #555", border: "none", borderBottom: "1px dotted #888", outline: "none", fontSize: 13, padding: "0 4px", background: "transparent" } })) : /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, label, /* @__PURE__ */ React.createElement("input", { value, onChange: (e) => onChange(e.target.value), type: type2, style: { width, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, padding: "0 4px", background: "transparent", display: "inline-block" } }));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "no-print" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4C4} \u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), pat && /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", style: { marginLeft: "auto" }, onClick: () => doPrint("cert-doc-area", `\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C \u2014 ${pat.prefix}${pat.fname} ${pat.lname}`) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 A4")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 13 } }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17:"), certTypes.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.k, className: `btn btn-sm ${type === t.k ? "btn-primary" : "btn-outline"}`, onClick: () => setType(t.k) }, t.l))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { value: hn, onChange: (e) => setHn(e.target.value), placeholder: "\u0E01\u0E23\u0E2D\u0E01 HN \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22", style: { maxWidth: 200 }, onKeyDown: (e) => e.key === "Enter" && searchPat() }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: searchPat }, "\u{1F50D} \u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), pat && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--accent)" } }, "\u2705 ", pat.prefix, pat.fname, " ", pat.lname, " (HN: ", pat.hn, ")")))), /* @__PURE__ */ React.createElement("div", { id: "cert-doc-area", className: "card", style: { maxWidth: 720, margin: "0 auto", padding: "28px 36px", fontFamily: "'Sarabun',sans-serif", fontSize: 14, lineHeight: 1.9, background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", borderBottom: "2.5px solid #1a5276", paddingBottom: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("img", { src: CLINIC_LOGO, alt: "\u0E42\u0E25\u0E42\u0E01\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01", style: { width: 70, height: 70, objectFit: "contain", display: "block", margin: "0 auto 4px" } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#1a5276", letterSpacing: 0.5 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, CLINIC_ADDRESS), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, "\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C ", CLINIC_TEL, " \xA0|\xA0 \u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E34\u0E08\u0E01\u0E32\u0E23 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 17, letterSpacing: 2, marginBottom: 18 } }, type === "sick" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", type === "group5" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", type === "driving" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E02\u0E31\u0E1A\u0E23\u0E16)"), type !== "driving" && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 13, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08 "), /* @__PURE__ */ React.createElement("input", { value: CLINIC_NAME, readOnly: true, style: { width: 240, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", textAlign: "left" } }), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 "), /* @__PURE__ */ React.createElement("input", { value: certNo, onChange: (e) => setCertNo(e.target.value), placeholder: "\u2014", style: { width: 80, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", textAlign: "center" } }), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 12 } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 "), /* @__PURE__ */ React.createElement("input", { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value), style: { width: 150, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" } })), type !== "driving" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 6 } }, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32 \u0E19\u0E32\u0E22\u0E41\u0E1E\u0E17\u0E22\u0E4C/\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E2B\u0E0D\u0E34\u0E07 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, DOCTOR_NAME)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, DOCTOR_LICENSE)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 / \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33 \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48", /* @__PURE__ */ React.createElement("input", { value: CLINIC_NAME + " " + CLINIC_ADDRESS, readOnly: true, style: { width: "100%", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "block", marginTop: 2 } })), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", margin: "10px 0" } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22 \u0E19\u0E32\u0E22/\u0E19\u0E32\u0E07/\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pat ? pat.prefix + pat.fname + " " + pat.lname : "",
      onChange: () => {
      },
      placeholder: "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08",
      style: { width: "calc(100% - 220px)", marginLeft: 8, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "inline-block" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E25\u0E02\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2 } }, ((pat == null ? void 0 : pat.idcard) || "             ").replace(/-/g, "").split("").slice(0, 13).map((c, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { width: 22, height: 24, border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: "#f8f8f8" } }, c || "")), [...Array(Math.max(0, 13 - (((_a = pat == null ? void 0 : pat.idcard) == null ? void 0 : _a.replace(/-/g, "")) || "").length))].map((_, i) => /* @__PURE__ */ React.createElement("div", { key: "e" + i, style: { width: 22, height: 24, border: "1px solid #555", background: "#f8f8f8" } })))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49", /* @__PURE__ */ React.createElement(
    "input",
    {
      value: (pat == null ? void 0 : pat.address) || "",
      onChange: () => {
      },
      placeholder: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48",
      style: { width: "calc(100% - 200px)", marginLeft: 8, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "inline-block" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 2, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E41\u0E25\u0E49\u0E27 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value), style: { width: 160, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" } }), /* @__PURE__ */ React.createElement("span", null, "\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E27\u0E48\u0E32")), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", margin: "10px 0" } })), type === "sick" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 6 } }, "\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E48\u0E27\u0E22 / \u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22\u0E42\u0E23\u0E04:"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: diagText,
      onChange: (e) => setDiagText(e.target.value),
      rows: 3,
      style: { width: "100%", resize: "vertical", border: "1px solid #ccc", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "inherit" },
      placeholder: "\u0E2D\u0E32\u0E01\u0E32\u0E23 / \u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22 / ICD-10 code"
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E1E\u0E31\u0E01\u0E23\u0E31\u0E01\u0E29\u0E32\u0E15\u0E31\u0E27"), /* @__PURE__ */ React.createElement("input", { value: restDays, onChange: (e) => setRestDays(e.target.value), style: { width: 50, textAlign: "center", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent" }, placeholder: "0" }), /* @__PURE__ */ React.createElement("span", null, "\u0E27\u0E31\u0E19 \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), style: { width: 155, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent" } }), /* @__PURE__ */ React.createElement("span", null, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), style: { width: 155, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent" } })), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontWeight: 600 } }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E41\u0E19\u0E30\u0E19\u0E33\u0E02\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C:"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: doctorNote,
      onChange: (e) => setDoctorNote(e.target.value),
      rows: 3,
      style: { width: "100%", resize: "vertical", border: "1px solid #ccc", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "inherit" },
      placeholder: "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19 / \u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33"
    }
  )), type === "group5" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pat ? pat.prefix + pat.fname + " " + pat.lname : "",
      onChange: () => {
      },
      placeholder: "\u0E19\u0E32\u0E22/\u0E19\u0E32\u0E07/\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27...",
      style: { display: "inline-block", width: "60%", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" }
    }
  ), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 8 } }, "\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E42\u0E23\u0E04\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E19\u0E35\u0E49")), CERT_DISEASES_5.map((dis) => /* @__PURE__ */ React.createElement("div", { key: dis.key, style: { marginBottom: 8, paddingLeft: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: dis.key === "d5" ? 600 : 400, fontStyle: dis.key === "d5" ? "italic" : "" } }, dis.label), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, alignItems: "center", marginTop: 3, paddingLeft: 16 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: dis.key, checked: d5results[dis.key] === "none", onChange: () => setD5results((p) => ({ ...p, [dis.key]: "none" })) }), "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: dis.key, checked: d5results[dis.key] === "found", onChange: () => setD5results((p) => ({ ...p, [dis.key]: "found" })) }), "\u0E1E\u0E1A"), d5results[dis.key] === "found" && /* @__PURE__ */ React.createElement(
    "input",
    {
      value: d5notes[dis.key],
      onChange: (e) => setD5notes((p) => ({ ...p, [dis.key]: e.target.value })),
      placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14",
      style: { flex: 1, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12, background: "transparent", padding: "0 4px" }
    }
  )))), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 20, marginTop: 4 } }, /* @__PURE__ */ React.createElement("div", { style: { fontStyle: "italic", marginBottom: 4 } }, "(6) .............(\u0E16\u0E49\u0E32\u0E2B\u0E32\u0E01\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E27\u0E08\u0E2B\u0E32\u0E42\u0E23\u0E04\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E43\u0E2B\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E19\u0E35\u0E49)............"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: d6note,
      onChange: (e) => setD6note(e.target.value),
      rows: 2,
      style: { width: "100%", resize: "vertical", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: 12, fontFamily: "inherit", background: "transparent", padding: "2px 4px" },
      placeholder: "\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21 (\u0E16\u0E49\u0E32\u0E21\u0E35)"
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #bbb", marginTop: 12, paddingTop: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4 } }, "\u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E41\u0E19\u0E30\u0E19\u0E33\u0E02\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: conclusion,
      onChange: (e) => setConclusion(e.target.value),
      rows: 3,
      style: { width: "100%", resize: "vertical", border: "1px solid #ccc", borderRadius: 4, padding: "6px 8px", fontSize: 13, fontFamily: "inherit" },
      placeholder: "\u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C"
    }
  ))), type === "driving" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, /* @__PURE__ */ React.createElement("style", null, `#cert-doc-area .cert-main-title{display:none}`), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E25\u0E48\u0E21\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("input", { value: drvBookNo, onChange: (e) => setDrvBookNo(e.target.value), style: { width: 100, borderBottom: "1px dotted #888", border: "none", outline: "none", background: "transparent", fontSize: 12.5, padding: "0 4px" } })), /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("input", { value: drvCertNo, onChange: (e) => setDrvCertNo(e.target.value), style: { width: 100, borderBottom: "1px dotted #888", border: "none", outline: "none", background: "transparent", fontSize: 12.5, padding: "0 4px" } }))), /* @__PURE__ */ React.createElement("div", { style: { border: "2px solid #1a5276", borderRadius: 6, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#1a5276", color: "#fff", fontWeight: 700, fontSize: 13, padding: "5px 12px", borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { background: "#fff", color: "#1a5276", borderRadius: 3, padding: "1px 7px", fontWeight: 800, fontSize: 13 } }, "\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48 1"), "\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E"), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6 } }, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32 \u0E19\u0E32\u0E22/\u0E19\u0E32\u0E07/\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", /* @__PURE__ */ React.createElement(
    "input",
    {
      value: pat ? pat.prefix + pat.fname + " " + pat.lname : "",
      readOnly: true,
      style: { width: "calc(100% - 180px)", marginLeft: 8, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "inline-block" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 4 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 (\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49)", /* @__PURE__ */ React.createElement(
    "input",
    {
      value: drvAddr,
      onChange: (e) => setDrvAddr(e.target.value),
      style: { width: "calc(100% - 210px)", marginLeft: 8, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "inline-block" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 8 } }, /* @__PURE__ */ React.createElement(
    "input",
    {
      value: drvAddr,
      onChange: (e) => setDrvAddr(e.target.value),
      style: { width: "100%", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" }
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 1, alignItems: "center" } }, [1, 4, 5, 2].map((grpLen, gi) => {
    const offsets = [0, 1, 5, 10, 12];
    const start = offsets[gi];
    const end = offsets[gi] + grpLen;
    const idStr = ((pat == null ? void 0 : pat.idcard) || "").replace(/-/g, "");
    return /* @__PURE__ */ React.createElement("div", { key: gi, style: { display: "flex", gap: 1, alignItems: "center" } }, gi > 0 && /* @__PURE__ */ React.createElement("span", { style: { margin: "0 2px", fontWeight: 700 } }, "-"), Array.from({ length: grpLen }).map((_, ci) => /* @__PURE__ */ React.createElement("div", { key: ci, style: { width: 20, height: 22, border: "1px solid #555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: "#fafafa" } }, idStr[start + ci] || "")));
  }))), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 6, fontWeight: 600 } }, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32\u0E02\u0E2D\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E \u0E42\u0E14\u0E22\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E14\u0E31\u0E07\u0E19\u0E35\u0E49"), [
    { k: "chronic", l: "1. \u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27" },
    { k: "accident", l: "2. \u0E2D\u0E38\u0E1A\u0E31\u0E15\u0E34\u0E40\u0E2B\u0E15\u0E38 \u0E41\u0E25\u0E30 \u0E1C\u0E48\u0E32\u0E15\u0E31\u0E14" },
    { k: "hospital", l: "3. \u0E40\u0E04\u0E22\u0E40\u0E02\u0E49\u0E32\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E43\u0E19\u0E42\u0E23\u0E07\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25" },
    { k: "epilepsy", l: "4. \u0E42\u0E23\u0E04\u0E25\u0E21\u0E0A\u0E31\u0E01 *" },
    { k: "other", l: "5. \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E2D\u0E37\u0E48\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E33\u0E04\u0E31\u0E0D" }
  ].map((item) => /* @__PURE__ */ React.createElement("div", { key: item.k, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 220, flexShrink: 0 } }, item.l), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 3, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: `drh_${item.k}`, checked: !drvHist[item.k].has, onChange: () => updDrvHist(item.k, "has", false) }), " \u0E44\u0E21\u0E48\u0E21\u0E35"), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 3, fontWeight: 400, cursor: "pointer", marginLeft: 8 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: `drh_${item.k}`, checked: drvHist[item.k].has, onChange: () => updDrvHist(item.k, "has", true) }), " \u0E21\u0E35 (\u0E23\u0E30\u0E1A\u0E38)"), drvHist[item.k].has && /* @__PURE__ */ React.createElement(
    "input",
    {
      value: drvHist[item.k].detail,
      onChange: (e) => updDrvHist(item.k, "detail", e.target.value),
      style: { flex: 1, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12, background: "transparent", padding: "0 4px" },
      placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"
    }
  ), !drvHist[item.k].has && /* @__PURE__ */ React.createElement("span", { style: { flex: 1, borderBottom: "1px dotted #ccc", display: "inline-block" } }, "\xA0"))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555", marginTop: 4, fontStyle: "italic", paddingLeft: 8 } }, "* \u0E43\u0E19\u0E01\u0E23\u0E13\u0E35\u0E21\u0E35\u0E42\u0E23\u0E04\u0E25\u0E21\u0E0A\u0E31\u0E01 \u0E43\u0E2B\u0E49\u0E19\u0E33\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E08\u0E32\u0E01\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E01\u0E29\u0E32\u0E27\u0E48\u0E32\u0E17\u0E48\u0E32\u0E19\u0E1B\u0E25\u0E2D\u0E14\u0E08\u0E32\u0E01\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E0A\u0E31\u0E01\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32 1 \u0E1B\u0E35 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E43\u0E2B\u0E49\u0E02\u0E31\u0E1A\u0E23\u0E16\u0E44\u0E14\u0E49"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D "), /* @__PURE__ */ React.createElement("span", { style: { display: "inline-block", width: 180, borderBottom: "1px solid #888" } }, "\xA0"), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 12 } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 "), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: drvExamDate,
      onChange: (e) => setDrvExamDate(e.target.value),
      style: { width: 150, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12, background: "transparent" }
    }
  ))))), /* @__PURE__ */ React.createElement("div", { style: { border: "2px solid #1a5276", borderRadius: 6 } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#1a5276", color: "#fff", fontWeight: 700, fontSize: 13, padding: "5px 12px", borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { background: "#fff", color: "#1a5276", borderRadius: 3, padding: "1px 7px", fontWeight: 800, fontSize: 13 } }, "\u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48 2"), "\u0E02\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement("div", { style: { padding: "12px 16px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 6, flexWrap: "wrap", fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08"), /* @__PURE__ */ React.createElement("input", { value: CLINIC_NAME, readOnly: true, style: { flex: 2, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent", padding: "0 4px" } }), /* @__PURE__ */ React.createElement("span", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: drvExamDate, onChange: (e) => setDrvExamDate(e.target.value), style: { width: 155, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } })), /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 4, fontSize: 12.5 } }, "(1) \u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32 \u0E19\u0E32\u0E22\u0E41\u0E1E\u0E17\u0E22\u0E4C/\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E2B\u0E0D\u0E34\u0E07 ", /* @__PURE__ */ React.createElement("b", null, DOCTOR_NAME)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 2 } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("b", null, DOCTOR_LICENSE), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 10 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E1E\u0E22\u0E32\u0E1A\u0E32\u0E25\u0E0A\u0E37\u0E48\u0E2D ", /* @__PURE__ */ React.createElement("b", null, CLINIC_NAME))), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 2 } }, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 ", /* @__PURE__ */ React.createElement("input", { value: CLINIC_ADDRESS, readOnly: true, style: { width: "80%", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent", padding: "0 4px" } })), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 2 } }, "\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22 \u0E19\u0E32\u0E22/\u0E19\u0E32\u0E07/\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27 ", /* @__PURE__ */ React.createElement("b", null, pat ? pat.prefix + pat.fname + " " + pat.lname : "................................")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 8 } }, "\u0E41\u0E25\u0E49\u0E27\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("input", { type: "date", value: drvExamDate, onChange: (e) => setDrvExamDate(e.target.value), style: { width: 155, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } }), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 16 } }, "\u0E21\u0E35\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E14\u0E31\u0E07\u0E19\u0E35\u0E49")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 12.5, marginBottom: 8, background: "#f0f6ff", borderRadius: 5, padding: "7px 10px" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E19\u0E49\u0E33\u0E2B\u0E19\u0E31\u0E01\u0E15\u0E31\u0E27 ", /* @__PURE__ */ React.createElement("input", { value: drvWeight, onChange: (e) => setDrvWeight(e.target.value), style: { width: 50, textAlign: "center", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } }), " \u0E01\u0E01."), /* @__PURE__ */ React.createElement("span", null, "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E39\u0E07 ", /* @__PURE__ */ React.createElement("input", { value: drvHeight, onChange: (e) => setDrvHeight(e.target.value), style: { width: 50, textAlign: "center", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } }), " \u0E40\u0E0B\u0E19\u0E15\u0E34\u0E40\u0E21\u0E15\u0E23"), /* @__PURE__ */ React.createElement("span", null, "\u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19\u0E42\u0E25\u0E2B\u0E34\u0E15 ", /* @__PURE__ */ React.createElement("input", { value: drvBP, onChange: (e) => setDrvBP(e.target.value), style: { width: 70, textAlign: "center", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } }), " \u0E21\u0E21.\u0E1B\u0E23\u0E2D\u0E17"), /* @__PURE__ */ React.createElement("span", null, "\u0E0A\u0E35\u0E1E\u0E08\u0E23 ", /* @__PURE__ */ React.createElement("input", { value: drvPR, onChange: (e) => setDrvPR(e.target.value), style: { width: 50, textAlign: "center", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent" } }), " \u0E04\u0E23\u0E31\u0E49\u0E07/\u0E19\u0E32\u0E17\u0E35")), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, marginBottom: 4 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2A\u0E20\u0E32\u0E1E\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E40\u0E01\u0E13\u0E11\u0E4C"), /* @__PURE__ */ React.createElement("label", { style: { marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "drvbody", checked: drvBodyResult === "normal", onChange: () => setDrvBodyResult("normal") }), " \u0E1B\u0E01\u0E15\u0E34"), /* @__PURE__ */ React.createElement("label", { style: { marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "drvbody", checked: drvBodyResult === "abnormal", onChange: () => setDrvBodyResult("abnormal") }), " \u0E1C\u0E34\u0E14\u0E1B\u0E01\u0E15\u0E34 (\u0E23\u0E30\u0E1A\u0E38)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: drvBodyNote,
      onChange: (e) => setDrvBodyNote(e.target.value),
      style: { marginLeft: 8, width: 200, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12.5, background: "transparent", display: "inline-block" },
      placeholder: "\u0E23\u0E30\u0E1A\u0E38..."
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12.5, lineHeight: 1.8, marginBottom: 8, paddingLeft: 12, borderLeft: "3px solid #1a5276" } }, "\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E27\u0E48\u0E32 \u0E1A\u0E38\u0E04\u0E04\u0E25\u0E14\u0E31\u0E07\u0E01\u0E25\u0E48\u0E32\u0E27 \u0E44\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E17\u0E38\u0E1E\u0E1E\u0E25\u0E20\u0E32\u0E1E\u0E08\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49 \u0E44\u0E21\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E42\u0E23\u0E04\u0E08\u0E34\u0E15 \u0E2B\u0E23\u0E37\u0E2D\u0E08\u0E34\u0E15\u0E1F\u0E31\u0E48\u0E19\u0E40\u0E1F\u0E37\u0E2D\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E31\u0E0D\u0E0D\u0E32\u0E2D\u0E48\u0E2D\u0E19 \u0E44\u0E21\u0E48\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E15\u0E34\u0E14\u0E22\u0E32\u0E40\u0E2A\u0E1E\u0E15\u0E34\u0E14\u0E43\u0E2B\u0E49\u0E42\u0E17\u0E29 \u0E41\u0E25\u0E30\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E07\u0E42\u0E23\u0E04\u0E1E\u0E34\u0E29\u0E2A\u0E38\u0E23\u0E32\u0E40\u0E23\u0E37\u0E49\u0E2D\u0E23\u0E31\u0E07 \u0E41\u0E25\u0E30\u0E44\u0E21\u0E48 \u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E02\u0E2D\u0E07\u0E42\u0E23\u0E04\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E19\u0E35\u0E49"), drvDiseases.map((dis, i) => /* @__PURE__ */ React.createElement("div", { key: dis.key, style: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5, paddingLeft: 16, fontSize: 12.5 } }, /* @__PURE__ */ React.createElement("span", { style: { flex: 1, lineHeight: 1.6 } }, dis.label), i < 3 && /* @__PURE__ */ React.createElement("span", { style: { color: "#555", fontStyle: "italic", fontSize: 11, whiteSpace: "nowrap" } }, dis.found ? "\u0E1E\u0E1A" : "\u0E44\u0E21\u0E48\u0E1E\u0E1A"), i === 3 && /* @__PURE__ */ React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", gap: 6 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 400, cursor: "pointer" } }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: dis.found, onChange: (e) => updDrvDisease(i, "found", e.target.checked) }), " \u0E21\u0E35"), /* @__PURE__ */ React.createElement(
    "input",
    {
      value: dis.note,
      onChange: (e) => updDrvDisease(i, "note", e.target.value),
      style: { flex: 1, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 12, background: "transparent" },
      placeholder: "\u0E23\u0E30\u0E1A\u0E38..."
    }
  )))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 12, padding: "10px 14px", background: "#f0f6ff", borderRadius: 6, border: "1px solid #aac6d8" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 8, color: "#1a5276" } }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21\u0E43\u0E19\u0E01\u0E32\u0E23\u0E02\u0E31\u0E1A\u0E23\u0E16"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 400 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "drvfit", checked: drvFitResult === "fit", onChange: () => setDrvFitResult("fit"), style: { width: 14, height: 14 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#1e8449", fontWeight: 600 } }, "\u2705 \u0E21\u0E35\u0E2A\u0E38\u0E02\u0E20\u0E32\u0E1E\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21\u0E43\u0E19\u0E01\u0E32\u0E23\u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E02\u0E31\u0E1A\u0E23\u0E16")), /* @__PURE__ */ React.createElement("label", { style: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 400 } }, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "drvfit", checked: drvFitResult === "notfit", onChange: () => setDrvFitResult("notfit"), style: { width: 14, height: 14 } }), /* @__PURE__ */ React.createElement("span", { style: { color: "#c0392b", fontWeight: 600 } }, "\u274C \u0E44\u0E21\u0E48\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E21 \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01"))), drvFitResult === "notfit" && /* @__PURE__ */ React.createElement(
    "input",
    {
      value: drvFitReason,
      onChange: (e) => setDrvFitReason(e.target.value),
      style: { width: "100%", borderBottom: "1.5px solid #c0392b", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "2px 4px" },
      placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25..."
    }
  )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600, marginBottom: 4, fontSize: 12.5 } }, "(2) \u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E41\u0E19\u0E30\u0E19\u0E33\u0E02\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: drvConclusion,
      onChange: (e) => setDrvConclusion(e.target.value),
      rows: 2,
      style: { width: "100%", resize: "vertical", border: "none", borderBottom: "1px solid #ccc", outline: "none", fontSize: 12.5, fontFamily: "inherit", background: "transparent" },
      placeholder: "\u0E2A\u0E23\u0E38\u0E1B\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21..."
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px dotted #888", marginTop: 4 } }, "\xA0")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 20 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", minWidth: 260 } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #888", height: 40, marginBottom: 4 } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13 } }, "\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D .................................................. \u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E1C\u0E39\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, marginTop: 4 } }, DOCTOR_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#555" } }, DOCTOR_TITLE), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#555" } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE))))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1.5px solid #bbb", marginTop: 16, paddingTop: 10, fontSize: 11, color: "#444", lineHeight: 1.8 } }, /* @__PURE__ */ React.createElement("b", null, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 14 } }, "(1) \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E0B\u0E36\u0E48\u0E07\u0E44\u0E14\u0E49\u0E02\u0E36\u0E49\u0E19\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 14 } }, "(2) \u0E43\u0E2B\u0E49\u0E41\u0E2A\u0E14\u0E07\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E43\u0E14 \u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49 1 \u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E19\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 14 } }, "(3) \u0E04\u0E33\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E19\u0E35\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E27\u0E34\u0E19\u0E34\u0E08\u0E31\u0E22\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E15\u0E49\u0E19 \u0E41\u0E25\u0E30\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E19\u0E35\u0E49\u0E43\u0E0A\u0E49\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E02\u0E31\u0E1A\u0E23\u0E16\u0E41\u0E25\u0E30\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E23\u0E16 \u0E41\u0E1A\u0E1A\u0E1F\u0E2D\u0E23\u0E4C\u0E21\u0E19\u0E35\u0E49\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E08\u0E32\u0E01\u0E04\u0E13\u0E30\u0E01\u0E23\u0E23\u0E21\u0E01\u0E32\u0E23\u0E41\u0E1E\u0E17\u0E22\u0E2A\u0E20\u0E32\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E38\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48 2/2564 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 4 \u0E01\u0E38\u0E21\u0E20\u0E32\u0E1E\u0E31\u0E19\u0E18\u0E4C 2564"))), type !== "driving" && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49 \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "date",
      value: certDate,
      onChange: (e) => setCertDate(e.target.value),
      style: { width: 160, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" }
    }
  )), type !== "driving" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 32, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", minWidth: 250 } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #888", height: 44, marginBottom: 4 } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, "\u0E25\u0E07\u0E0A\u0E37\u0E48\u0E2D .................................................."), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginTop: 2 } }, DOCTOR_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#555" } }, DOCTOR_TITLE), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#555" } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "#555" } }, "\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E1C\u0E39\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22"))), type !== "driving" && /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1.5px solid #bbb", marginTop: 16, paddingTop: 10, fontSize: 11.5, color: "#444", lineHeight: 1.7 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 16 } }, "(1) \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E0B\u0E36\u0E48\u0E07\u0E44\u0E14\u0E49\u0E02\u0E36\u0E49\u0E19\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21"), /* @__PURE__ */ React.createElement("div", { style: { paddingLeft: 16 } }, "(2) \u0E43\u0E2B\u0E49\u0E41\u0E2A\u0E14\u0E07\u0E27\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E39\u0E49\u0E21\u0E35\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E43\u0E14 \u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E32\u0E01\u0E08\u0E32\u0E01\u0E42\u0E23\u0E04\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E2B\u0E15\u0E38\u0E43\u0E2B\u0E49\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E32\u0E0A\u0E01\u0E32\u0E23 \u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E09\u0E1A\u0E31\u0E1A\u0E19\u0E35\u0E49\u0E43\u0E2B\u0E49\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49 1 \u0E40\u0E14\u0E37\u0E2D\u0E19 \u0E19\u0E31\u0E1A\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }, className: "no-print" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print", onClick: () => doPrint("cert-doc-area", `\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C${type === "driving" ? " (\u0E43\u0E1A\u0E02\u0E31\u0E1A\u0E02\u0E35\u0E48)" : ""} \u2014 ${pat ? pat.prefix + pat.fname + " " + pat.lname : ""}`) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C (A4)"))));
}
function CertModal({ data, onClose, getPatient }) {
  const { pat, visit } = data;
  const [type, setType] = useState("sick");
  const [form, setForm] = useState({ diagText: (visit == null ? void 0 : visit.dx) || "", restDays: "", fromDate: today(), toDate: "", doctorNote: "", certDate: today(), certNo: "" });
  const f = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const certTypes = [{ k: "sick", l: "\u0E2D\u0E32\u0E01\u0E32\u0E23\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E48\u0E27\u0E22" }, { k: "group5", l: "5 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E42\u0E23\u0E04" }, { k: "driving", l: "\u0E43\u0E1A\u0E02\u0E31\u0E1A\u0E02\u0E35\u0E48" }];
  const age = (pat == null ? void 0 : pat.dob) ? Math.floor((/* @__PURE__ */ new Date() - new Date(pat.dob)) / (365.25 * 24 * 60 * 60 * 1e3)) + " \u0E1B\u0E35" : "";
  return /* @__PURE__ */ React.createElement(Modal, { title: "\u{1F4C4} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", onClose, width: 720 }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, certTypes.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.k, className: `btn btn-sm ${type === t.k ? "btn-primary" : "btn-outline"}`, onClick: () => setType(t.k) }, t.l))), /* @__PURE__ */ React.createElement("div", { id: "cert-modal-doc" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 15, color: "var(--primary)", margin: "8px 0" } }, "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", type === "group5" ? " (5 \u0E01\u0E25\u0E38\u0E48\u0E21\u0E42\u0E23\u0E04)" : type === "driving" ? " (\u0E43\u0E1A\u0E02\u0E31\u0E1A\u0E02\u0E35\u0E48)" : ""), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 12 } }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48: ", /* @__PURE__ */ React.createElement("input", { value: form.certNo, onChange: (e) => f("certNo", e.target.value), style: { display: "inline", width: 90, fontSize: 12, padding: "2px 6px" } })), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, lineHeight: 1.9 } }, /* @__PURE__ */ React.createElement("div", null, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32 ", /* @__PURE__ */ React.createElement("b", null, DOCTOR_NAME), " \u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("b", null, DOCTOR_LICENSE), " \u0E02\u0E2D\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E27\u0E48\u0E32\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px 20px", flexWrap: "wrap", background: "var(--gray-pale)", borderRadius: 6, padding: "7px 10px", margin: "8px 0", fontSize: 12 } }, /* @__PURE__ */ React.createElement("div", null, "\u0E0A\u0E37\u0E48\u0E2D: ", /* @__PURE__ */ React.createElement("b", null, pat == null ? void 0 : pat.prefix, pat == null ? void 0 : pat.fname, " ", pat == null ? void 0 : pat.lname)), /* @__PURE__ */ React.createElement("div", null, "\u0E40\u0E1E\u0E28: ", /* @__PURE__ */ React.createElement("b", null, pat == null ? void 0 : pat.gender)), /* @__PURE__ */ React.createElement("div", null, "\u0E2D\u0E32\u0E22\u0E38: ", /* @__PURE__ */ React.createElement("b", null, age)), /* @__PURE__ */ React.createElement("div", null, "\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19: ", /* @__PURE__ */ React.createElement("b", null, (pat == null ? void 0 : pat.idcard) || "..........."))), /* @__PURE__ */ React.createElement("div", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08: ", /* @__PURE__ */ React.createElement("b", null, thaiDate(today()))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), type === "sick" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, "\u0E21\u0E35\u0E2D\u0E32\u0E01\u0E32\u0E23 / \u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22:"), /* @__PURE__ */ React.createElement("textarea", { value: form.diagText, onChange: (e) => f("diagText", e.target.value), rows: 2, style: { width: "100%", resize: "vertical", marginBottom: 6 }, placeholder: "\u0E2D\u0E32\u0E01\u0E32\u0E23 / \u0E01\u0E32\u0E23\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 13 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E04\u0E27\u0E23\u0E1E\u0E31\u0E01\u0E23\u0E31\u0E01\u0E29\u0E32\u0E15\u0E31\u0E27"), /* @__PURE__ */ React.createElement("input", { value: form.restDays, onChange: (e) => f("restDays", e.target.value), style: { width: 50, textAlign: "center" } }), /* @__PURE__ */ React.createElement("span", null, "\u0E27\u0E31\u0E19 \u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.fromDate, onChange: (e) => f("fromDate", e.target.value), style: { width: 150 } }), /* @__PURE__ */ React.createElement("span", null, "\u0E16\u0E36\u0E07"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.toDate, onChange: (e) => f("toDate", e.target.value), style: { width: 150 } }))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E41\u0E1E\u0E17\u0E22\u0E4C:"), /* @__PURE__ */ React.createElement("textarea", { value: form.doctorNote, onChange: (e) => f("doctorNote", e.target.value), rows: 3, style: { width: "100%", resize: "vertical" } }), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 8 } }, "\u0E2D\u0E2D\u0E01\u0E43\u0E2B\u0E49 \u0E13 \u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("b", null, thaiDate(form.certDate)))), /* @__PURE__ */ React.createElement(DoctorSignature, null)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 14, display: "flex", gap: 10, justifyContent: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print", onClick: () => doPrint("cert-modal-doc", "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C") }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: onClose }, "\u0E1B\u0E34\u0E14")));
}
function ReceiptPage({ receipts, saveReceipt, updateReceipt, deleteReceipt, patients, visits, nextRID, getPatient, medicines, patchMedicineStock }) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newForm, setNewForm] = useState(null);
  const filtered = receipts.filter((r) => {
    const q = search.trim().toLowerCase();
    const pat = getPatient(r.hn);
    const fullname = (((pat == null ? void 0 : pat.fname) || "") + " " + ((pat == null ? void 0 : pat.lname) || "")).toLowerCase();
    const nameMatch = !q || (r.hn || "").toLowerCase().includes(q) || (r.id || "").toLowerCase().includes(q) || fullname.includes(q) || ((pat == null ? void 0 : pat.fname) || "").toLowerCase().includes(q) || ((pat == null ? void 0 : pat.lname) || "").toLowerCase().includes(q) || (r.patname || "").toLowerCase().includes(q);
    const dateMatch = (!filterFrom || r.date >= filterFrom) && (!filterTo || r.date <= filterTo);
    const statusMatch = statusFilter === "all" || statusFilter === "pending" && r.status !== "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" || statusFilter === "paid" && r.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27";
    return nameMatch && dateMatch && statusMatch;
  }).sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.id || "").localeCompare(a.id || ""));
  const totalFiltered = filtered.reduce((s, r) => s + r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount, 0);
  const pendingCount = receipts.filter((r) => r.status !== "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27").length;
  const [detail, setDetail] = useState(null);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F9FE} \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"), pendingCount > 0 && /* @__PURE__ */ React.createElement("span", { className: "tag tag-orange" }, "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30 ", pendingCount, " \u0E43\u0E1A"), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "list" ? "btn-primary" : "btn-outline"}`, onClick: () => {
    setTab("list");
    setDetail(null);
  } }, "\u{1F4CB} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "summary" ? "btn-primary" : "btn-outline"}`, onClick: () => setTab("summary") }, "\u{1F4CA} \u0E2A\u0E23\u0E38\u0E1B\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A"))), tab === "list" && /* @__PURE__ */ React.createElement("div", null, !detail && /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", { style: { flex: "1 1 240px" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E04\u0E49\u0E19\u0E2B\u0E32 (HN / \u0E0A\u0E37\u0E48\u0E2D / \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 / \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08)"), /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\u0E1E\u0E34\u0E21\u0E1E\u0E4C HN, \u0E0A\u0E37\u0E48\u0E2D, \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 \u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08", style: { width: "100%" } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: filterFrom, onChange: (e) => setFilterFrom(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: filterTo, onChange: (e) => setFilterTo(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("select", { value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), style: { width: 140 } }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14"), /* @__PURE__ */ React.createElement("option", { value: "pending" }, "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"), /* @__PURE__ */ React.createElement("option", { value: "paid" }, "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27"))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => {
    setSearch("");
    setFilterFrom("");
    setFilterTo("");
    setStatusFilter("all");
  } }, "\u0E25\u0E49\u0E32\u0E07")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 13, color: "var(--accent)", fontWeight: 600 } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07: ", filtered.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 | \u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A: ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, totalFiltered.toLocaleString()), " \u0E1A\u0E32\u0E17")), detail ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm no-print", onClick: () => setDetail(null), style: { marginBottom: 12 } }, "\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement(ReceiptPaymentPanel, { r: detail, pat: getPatient(detail.hn), updateReceipt, deleteReceipt, onDeleted: () => setDetail(null), onUpdated: (updated) => setDetail(updated), medicines, patchMedicineStock })) : /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "HN / \u0E0A\u0E37\u0E48\u0E2D"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "right" } }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 (\u0E1A.)"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E0A\u0E33\u0E23\u0E30\u0E42\u0E14\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px" } }))), /* @__PURE__ */ React.createElement("tbody", null, filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), filtered.map((r, i) => {
    const total = r.items.reduce((s, it) => s + it.qty * it.price, 0) - r.discount;
    const pat = getPatient(r.hn);
    const isPending = r.status !== "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27";
    return /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { background: isPending ? "#fffaf0" : i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", fontWeight: 700, color: "var(--primary)" } }, r.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, "HN ", r.hn), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, pat == null ? void 0 : pat.prefix, pat == null ? void 0 : pat.fname, " ", pat == null ? void 0 : pat.lname)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, thaiDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "right", fontWeight: 700 } }, total.toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, r.paid || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("span", { className: `tag ${r.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "tag-green" : "tag-orange"}` }, r.status)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", display:"flex", gap:4, flexWrap:"wrap" } }, /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${isPending ? "btn-accent" : "btn-outline"}`, onClick: () => setDetail(r) }, isPending ? "\u{1F4B0} \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30" : "\u0E14\u0E39/\u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-danger", style: {fontSize:11,padding:"4px 8px"}, onClick: (e) => { e.stopPropagation(); if(window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 " + r.id + "?\n\n\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19: \u0E01\u0E32\u0E23\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E08\u0E30\u0E44\u0E21\u0E48\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E15\u0E48\u0E2D\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22")) { deleteReceipt(r.id); if(detail && detail.id===r.id) setDetail(null); } } }, "\u{1F5D1}\uFE0F \u0E25\u0E1A")));
  }))))), tab === "summary" && /* @__PURE__ */ React.createElement(ReceiptSummary, { receipts }));
}
function ReceiptPaymentPanel({ r, pat, updateReceipt, deleteReceipt, onDeleted, onUpdated, medicines, patchMedicineStock }) {
  const [paid, setPaid] = useState(r.paid || "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14");
  const [discount, setDiscount] = useState(r.discount || 0);
  const [items, setItems] = useState(r.items || []);
  const isPending = r.status !== "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27";
  const total = items.reduce((s, it) => s + it.qty * it.price, 0) - Number(discount);
  const updItem = (i, k, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: k === "qty" || k === "price" ? Number(v) : v } : it));
  const confirmPayment = async () => {
    if (!window.confirm(`\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19 ${total.toLocaleString()} \u0E1A\u0E32\u0E17
\u0E27\u0E34\u0E18\u0E35\u0E0A\u0E33\u0E23\u0E30: ${paid}

\u0E01\u0E14\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25`)) return;
    const updated = { ...r, items, discount: Number(discount), paid, status: "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" };
    await updateReceipt(updated);
    onUpdated(updated);
    alert("\u2705 \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \u2014 \u0E1B\u0E34\u0E14\u0E1A\u0E34\u0E25\u0E41\u0E25\u0E49\u0E27");
  };
  const docId = `receipt-doc-${r.id}`;
  return /* @__PURE__ */ React.createElement("div", null, isPending && /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14, background: "#fff8e1", border: "2px solid #f39c12" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "#915c00", marginBottom: 10 } }, "\u{1F4B0} \u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19 \u2014 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#1a5276", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "center", width: 55 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "right", width: 80 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "5px 8px", textAlign: "right", width: 80 } }, "\u0E23\u0E27\u0E21"))), /* @__PURE__ */ React.createElement("tbody", null, items.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: i % 2 === 0 ? "#fff" : "#fdf6e8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px" } }, it.type === "drug" ? "\u{1F48A} " : "\u{1F3E5} ", it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.qty, onChange: (e) => updItem(i, "qty", e.target.value), style: { width: 50, textAlign: "center", fontSize: 11, padding: "2px 4px" } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "right" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.price, onChange: (e) => updItem(i, "price", e.target.value), style: { width: 70, textAlign: "right", fontSize: 11, padding: "2px 4px" } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "5px 8px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()))))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", null, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14: ", /* @__PURE__ */ React.createElement("input", { type: "number", value: discount, onChange: (e) => setDiscount(e.target.value), style: { width: 90, fontSize: 12 } }), " \u0E1A\u0E32\u0E17"), /* @__PURE__ */ React.createElement("div", null, "\u0E27\u0E34\u0E18\u0E35\u0E0A\u0E33\u0E23\u0E30:", /* @__PURE__ */ React.createElement("select", { value: paid, onChange: (e) => setPaid(e.target.value), style: { fontSize: 13, width: 150, marginLeft: 6 } }, ["\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14", "\u0E42\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19", "\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15", "\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E14\u0E1A\u0E34\u0E15", "QR Code", "\u0E2D\u0E37\u0E48\u0E19\u0E46"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", fontWeight: 800, fontSize: 20, color: "var(--accent)" } }, total.toLocaleString(), " \u0E1A\u0E32\u0E17")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent", style: { fontSize: 14, padding: "10px 24px" }, onClick: confirmPayment }, "\u2705 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E23\u0E31\u0E1A\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19"))), /* @__PURE__ */ React.createElement(ReceiptDoc, { r: { ...r, items, discount: Number(discount), paid }, pat, deleteReceipt, onDeleted }));
}
function ReceiptSummary({ receipts }) {
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState((/* @__PURE__ */ new Date()).getFullYear() + "");
  const [month, setMonth] = useState(String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const filtered = receipts.filter((r) => {
    if (period === "month") return r.date.startsWith(`${year}-${month}`);
    if (period === "year") return r.date.startsWith(year);
    return (!fromDate || r.date >= fromDate) && (!toDate || r.date <= toDate);
  });
  const totalIncome = filtered.reduce((s, r) => s + r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount, 0);
  const byDate = filtered.reduce((acc, r) => {
    const d = r.date;
    if (!acc[d]) acc[d] = { income: 0, count: 0 };
    acc[d].income += r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount;
    acc[d].count++;
    return acc;
  }, {});
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React.createElement("select", { value: period, onChange: (e) => setPeriod(e.target.value), style: { width: 130 } }, /* @__PURE__ */ React.createElement("option", { value: "month" }, "\u0E23\u0E32\u0E22\u0E40\u0E14\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React.createElement("option", { value: "year" }, "\u0E23\u0E32\u0E22\u0E1B\u0E35"), /* @__PURE__ */ React.createElement("option", { value: "custom" }, "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07"))), (period === "month" || period === "year") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E1B\u0E35 (\u0E04.\u0E28.)"), /* @__PURE__ */ React.createElement("input", { value: year, onChange: (e) => setYear(e.target.value), style: { width: 90 } })), period === "month" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E14\u0E37\u0E2D\u0E19 (01-12)"), /* @__PURE__ */ React.createElement("input", { value: month, onChange: (e) => setMonth(e.target.value), style: { width: 80 } })), period === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E16\u0E36\u0E07"), /* @__PURE__ */ React.createElement("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), style: { width: 160 } }))))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: "var(--accent)" } }, totalIncome.toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E23\u0E27\u0E21 (\u0E1A\u0E32\u0E17)")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: "var(--primary)" } }, filtered.length), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 24, fontWeight: 700, color: "var(--warning)" } }, filtered.length > 0 ? (totalIncome / filtered.length).toFixed(0) : 0), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "\u0E40\u0E09\u0E25\u0E35\u0E48\u0E22\u0E15\u0E48\u0E2D\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 (\u0E1A\u0E32\u0E17)"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "center" } }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "right" } }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A (\u0E1A\u0E32\u0E17)"))), /* @__PURE__ */ React.createElement("tbody", null, Object.keys(byDate).length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 3, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([d, v], i) => /* @__PURE__ */ React.createElement("tr", { key: d, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, thaiDate(d)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "center" } }, v.count), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "right", fontWeight: 600 } }, v.income.toLocaleString()))), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary-pale)", fontWeight: 700 } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, "\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "center" } }, filtered.length), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "right" } }, totalIncome.toLocaleString()))))));
}
function ReceiptDoc({ r, pat, deleteReceipt, onDeleted }) {
  const total = r.items.reduce((s, i) => s + i.qty * i.price, 0);
  const net = total - r.discount;
  const docId = `receipt-doc-${r.id}`;
  const svcItems = r.items.filter((i) => i.type !== "drug");
  const drugItems = r.items.filter((i) => i.type === "drug");
  return /* @__PURE__ */ React.createElement("div", { className: "card", id: docId }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 15, color: "var(--primary)", margin: "6px 0 2px" } }, "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 / Receipt"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray)", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary)" } }, r.id)), /* @__PURE__ */ React.createElement("div", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ", /* @__PURE__ */ React.createElement("b", null, thaiDate(r.date)))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--gray-pale)", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23:"), " ", pat == null ? void 0 : pat.prefix, pat == null ? void 0 : pat.fname, " ", pat == null ? void 0 : pat.lname), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", r.hn, " ", /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 16 } }, /* @__PURE__ */ React.createElement("b", null, "Visit:"), " ", r.visitId))), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "center", width: 55 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", width: 50 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "right", width: 80 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "right", width: 80 } }, "\u0E23\u0E27\u0E21"))), /* @__PURE__ */ React.createElement("tbody", null, svcItems.length > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "5px 10px", background: "#e8f8f0", fontWeight: 700, fontSize: 11, color: "#1e8449" } }, "\u{1F3E5} \u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23")), svcItems.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "s" + i, style: { background: "#f4fbf7" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()))), drugItems.length > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "5px 10px", background: "#f0f6ff", fontWeight: 700, fontSize: 11, color: "#1a5276" } }, "\u{1F48A} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32")), drugItems.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "d" + i, style: { background: i % 2 === 0 ? "#f5faff" : "#eef5ff" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()))), r.items.filter((i) => !i.type).map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "l" + i, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString())))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "7px 10px", textAlign: "right", fontWeight: 600 } }, "\u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E31\u0E01"), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", fontWeight: 600 } }, total.toLocaleString())), r.discount > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "7px 10px", textAlign: "right", color: "var(--danger)" } }, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14"), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", color: "var(--danger)" } }, "-", r.discount.toLocaleString())), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 14 } }, "\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 14 } }, net.toLocaleString())))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E0A\u0E33\u0E23\u0E30\u0E42\u0E14\u0E22:"), " ", r.paid), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `tag ${r.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "tag-green" : "tag-orange"}` }, r.status))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", paddingTop: 10, fontSize: 11, color: "var(--gray)", textAlign: "center" } }, CLINIC_NAME, " \u2014 ", CLINIC_ADDRESS, " \u2014 \u0E42\u0E17\u0E23. ", CLINIC_TEL), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 14, display:"flex", gap:8, justifyContent:"center" }, className: "no-print" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", onClick: () => doPrint(docId, "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 " + r.id) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), deleteReceipt && /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => { if(window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 " + r.id + "?\n\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E08\u0E30\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E01\u0E23\u0E30\u0E17\u0E1A")) { deleteReceipt(r.id); if(onDeleted) onDeleted(); } } }, "\u{1F5D1}\uFE0F \u0E25\u0E1A\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08")));
}
function ReceiptQuickModal({ data, onClose, getPatient, nextRID, receipts, saveReceipt, medicines, patchMedicineStock }) {
  var _a, _b;
  const { pat, visit } = data;
  const buildItems = () => {
    const svcItems = ((visit == null ? void 0 : visit.services) || []).map((s) => ({ desc: s.name, qty: s.qty || 1, unit: s.unit || "\u0E04\u0E23\u0E31\u0E49\u0E07", price: s.price, type: "service" }));
    const drugItems = ((visit == null ? void 0 : visit.drugs) || []).map((d) => ({ desc: d.name, qty: d.qty, unit: d.unit, price: d.price, type: "drug", medId: d.medId }));
    const all = [...svcItems, ...drugItems];
    return all.length > 0 ? all : [{ desc: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 300, type: "service" }];
  };
  const [items, setItems] = useState(buildItems);
  const [discount, setDiscount] = useState(0);
  const addItem = () => setItems((prev) => [...prev, { desc: "", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 0, type: "service" }]);
  const updItem = (i, k, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: k === "qty" || k === "price" ? Number(v) : v } : it));
  const rmItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const total = items.reduce((s, it) => s + it.qty * it.price, 0) - Number(discount);
  const save = async () => {
    const r = { id: nextRID(), hn: pat.hn, visitId: (visit == null ? void 0 : visit.id) || "", patname: pat.prefix + pat.fname + " " + pat.lname, date: today(), items, discount: Number(discount), paid: "", status: "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30" };
    await saveReceipt(r);
    for (const it of items) {
      if (it.type === "drug") {
        const med = it.medId ? medicines.find((m) => m.id === it.medId) : medicines.find((m) => it.desc.includes(m.name));
        if (med) await patchMedicineStock(med.id, Math.max(0, med.stock - it.qty));
      }
    }
    alert(`\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 ${r.id} \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \u2014 \u0E2A\u0E16\u0E32\u0E19\u0E30 "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"

\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22\u0E01\u0E23\u0E38\u0E13\u0E32\u0E44\u0E1B\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08`);
    onClose();
  };
  const drugTotal = items.filter((i) => i.type === "drug").reduce((s, i) => s + i.qty * i.price, 0);
  const svcTotal = items.filter((i) => i.type !== "drug").reduce((s, i) => s + i.qty * i.price, 0);
  return /* @__PURE__ */ React.createElement(Modal, { title: "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 (\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E0A\u0E33\u0E23\u0E30)", onClose, width: 720 }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff8e1", border: "1px solid #f39c12", borderRadius: 6, padding: "7px 12px", marginBottom: 12, fontSize: 12, color: "#915c00" } }, "\u2139\uFE0F \u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E41\u0E04\u0E48\u0E2D\u0E2D\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 \u2014 \u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E0A\u0E33\u0E23\u0E30\u0E40\u0E07\u0E34\u0E19\u0E41\u0E25\u0E30\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E27\u0E34\u0E18\u0E35\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E33\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E49\u0E32 ", /* @__PURE__ */ React.createElement("b", null, '"\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"'), " \u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22:"), " ", pat.prefix, pat.fname, " ", pat.lname, " \xA0|\xA0 ", /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", pat.hn), visit && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "Visit: ", visit.id, " | ", thaiDate(visit.date))), (((_a = visit == null ? void 0 : visit.drugs) == null ? void 0 : _a.length) > 0 || ((_b = visit == null ? void 0 : visit.services) == null ? void 0 : _b.length) > 0) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" } }, svcTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#e8f8f0", border: "1px solid #a8d5c8", borderRadius: 5, padding: "4px 10px", fontSize: 12, color: "#1e8449" } }, "\u{1F3E5} \u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23: ", /* @__PURE__ */ React.createElement("b", null, svcTotal.toLocaleString(), "\u0E3F")), drugTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#f0f8ff", border: "1px solid #a8c8e8", borderRadius: 5, padding: "4px 10px", fontSize: 12, color: "#1a5276" } }, "\u{1F48A} \u0E04\u0E48\u0E32\u0E22\u0E32: ", /* @__PURE__ */ React.createElement("b", null, drugTotal.toLocaleString(), "\u0E3F"))), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 6px", textAlign: "center", width: 30 } }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "center", width: 60 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left", width: 60 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 90 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 80 } }, "\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("th", { style: { width: 28 } }))), /* @__PURE__ */ React.createElement("tbody", null, items.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: it.type === "drug" ? "#f0f8ff" : i % 2 === 0 ? "#fff" : "#f8fff8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { value: it.desc, onChange: (e) => updItem(i, "desc", e.target.value), style: { fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 4px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10 } }, it.type === "drug" ? "\u{1F48A}" : "\u{1F3E5}")), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.qty, onChange: (e) => updItem(i, "qty", e.target.value), style: { textAlign: "center", fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { value: it.unit, onChange: (e) => updItem(i, "unit", e.target.value), style: { fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.price, onChange: (e) => updItem(i, "price", e.target.value), style: { textAlign: "right", fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { onClick: () => rmItem(i), style: { background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 14 } }, "\u2715")))))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: addItem }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 10, fontSize: 13, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", null, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14: ", /* @__PURE__ */ React.createElement("input", { type: "number", value: discount, onChange: (e) => setDiscount(e.target.value), style: { width: 80, fontSize: 12 } })), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", fontWeight: 700, fontSize: 16, color: "var(--accent)" } }, "\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34: ", total.toLocaleString(), " \u0E1A\u0E32\u0E17")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onClose }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: save }, "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 (\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30\u0E17\u0E35\u0E48\u0E40\u0E04\u0E32\u0E19\u0E4C\u0E40\u0E15\u0E2D\u0E23\u0E4C)")));
}
function AppointPage({ appointments, saveAppointment, deleteAppointment, patients, nextAID, getPatient, today: today2 }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [edit, setEdit] = useState(null);
  const [newForm, setNewForm] = useState(null);
  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const match = a.hn.includes(q) || a.patname.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    if (tab === "today") return match && a.date === today2;
    if (tab === "upcoming") return match && a.date >= today2;
    return match;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const todayCount = appointments.filter((a) => a.date === today2).length;
  const upCount = appointments.filter((a) => a.date > today2).length;
  const save = async (f) => {
    const appt = f.id ? f : { ...f, id: nextAID() };
    await saveAppointment(appt);
    setEdit(null);
    setNewForm(null);
  };
  const del = async (id) => {
    if (window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E19\u0E35\u0E49?")) await deleteAppointment(id);
  };
  const printAppointSlip = (a) => {
    const pat = getPatient(a.hn);
    const win = window.open("", "_blank", "width=380,height=480");
    win.document.write(`<!DOCTYPE html><html><head><title>\u0E43\u0E1A\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22</title>
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
        <div class="clinic-name">\u{1F3E5} ${CLINIC_NAME}</div>
        <div class="clinic-addr">${CLINIC_ADDRESS}<br/>\u0E42\u0E17\u0E23. ${CLINIC_TEL}</div>
      </div>
      <div class="title">\u0E43\u0E1A\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22</div>
      <div class="row"><span class="label">\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14</span><b>${a.id}</b></div>
      <div class="row"><span class="label">\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25</span><b>${a.patname}</b></div>
      <div class="row"><span class="label">HN</span><b>${a.hn}</b></div>
      <div class="datetime">
        <div class="d">${thaiDate(a.date)}</div>
        <div class="t">${a.time} \u0E19.</div>
      </div>
      <div class="row"><span class="label">\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E19\u0E31\u0E14</span><b>${a.reason || "-"}</b></div>
      ${a.note ? `<div class="row"><span class="label">\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38</span><b>${a.note}</b></div>` : ""}
      <div class="note">\u0E01\u0E23\u0E38\u0E13\u0E32\u0E21\u0E32\u0E01\u0E48\u0E2D\u0E19\u0E40\u0E27\u0E25\u0E32\u0E19\u0E31\u0E14 15 \u0E19\u0E32\u0E17\u0E35<br/>\u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E21\u0E32\u0E44\u0E14\u0E49\u0E15\u0E32\u0E21\u0E19\u0E31\u0E14 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E42\u0E17\u0E23\u0E41\u0E08\u0E49\u0E07\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32</div>
    </div>
    <div style="text-align:center;margin-top:12px;">
      <button onclick="window.print()" style="padding:8px 22px;background:#1a5276;color:#fff;border:none;border-radius:5px;cursor:pointer;font-size:13px;font-family:'Sarabun',sans-serif;font-weight:700;">\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E19\u0E31\u0E14</button>
    </div></body></html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4C5} \u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", style: { marginLeft: "auto" }, onClick: () => setNewForm({ hn: "", patname: "", date: "", time: "", reason: "", status: "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", note: "" }) }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14")), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 } }, [{ label: "\u0E19\u0E31\u0E14\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49", val: todayCount, color: "var(--primary)" }, { label: "\u0E19\u0E31\u0E14\u0E17\u0E35\u0E48\u0E01\u0E33\u0E25\u0E31\u0E07\u0E08\u0E30\u0E21\u0E32\u0E16\u0E36\u0E07", val: upCount, color: "var(--accent)" }, { label: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", val: appointments.length, color: "var(--gray)" }].map((s) => /* @__PURE__ */ React.createElement("div", { key: s.label, className: "card", style: { textAlign: "center", padding: "14px 10px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: s.color } }, s.val), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, s.label)))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32 HN / \u0E0A\u0E37\u0E48\u0E2D / \u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25", style: { maxWidth: 260 } }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6 } }, [{ k: "all", l: "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" }, { k: "today", l: `\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49 (${todayCount})` }, { k: "upcoming", l: "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E08\u0E30\u0E21\u0E32\u0E16\u0E36\u0E07" }].map((t) => /* @__PURE__ */ React.createElement("button", { key: t.k, className: `btn btn-sm ${tab === t.k ? "btn-primary" : "btn-outline"}`, onClick: () => setTab(t.k) }, t.l))))), (edit || newForm) && /* @__PURE__ */ React.createElement(AppointForm, { form: edit || newForm, onSave: save, onCancel: () => {
    setEdit(null);
    setNewForm(null);
  }, patients }), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E40\u0E25\u0E02\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "HN / \u0E0A\u0E37\u0E48\u0E2D"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 / \u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px" } }))), /* @__PURE__ */ React.createElement("tbody", null, filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), filtered.map((a, i) => /* @__PURE__ */ React.createElement("tr", { key: a.id, style: { background: a.date === today2 ? "#e8f5e9" : i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", fontWeight: 700, color: "var(--primary)" } }, a.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, "HN ", a.hn), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12 } }, a.patname)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, thaiDate(a.date), " ", /* @__PURE__ */ React.createElement("b", null, a.time)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", color: "var(--gray-dark)" } }, a.reason), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("span", { className: `tag ${a.status === "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27" ? "tag-blue" : a.status === "\u0E21\u0E32\u0E15\u0E32\u0E21\u0E19\u0E31\u0E14" ? "tag-green" : "tag-orange"}` }, a.status)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", fontSize: 12, color: "var(--gray)" } }, a.note), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", display: "flex", gap: 4, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", onClick: () => printAppointSlip(a) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setEdit({ ...a }) }, "\u0E41\u0E01\u0E49\u0E44\u0E02"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => del(a.id) }, "\u0E25\u0E1A"))))))));
}
function AppointForm({ form, onSave, onCancel, patients }) {
  const [f, setF] = useState({ ...form });
  const up = (k, v) => setF((prev) => ({ ...prev, [k]: v }));
  const searchPat = (hn) => {
    const p = patients.find((x) => x.hn === hn);
    if (p) up("patname", p.prefix + p.fname + " " + p.lname);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14, background: "var(--primary-pale)", border: "1.5px solid var(--primary-light)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--primary)", marginBottom: 10 } }, f.id ? "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22" : "\u{1F4C5} \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E43\u0E2B\u0E21\u0E48"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "HN \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("input", { value: f.hn, onChange: (e) => {
    up("hn", e.target.value);
    searchPat(e.target.value);
  }, placeholder: "000001" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25"), /* @__PURE__ */ React.createElement("input", { value: f.patname, onChange: (e) => up("patname", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14 *"), /* @__PURE__ */ React.createElement("input", { type: "date", value: f.date, onChange: (e) => up("date", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E27\u0E25\u0E32 *"), /* @__PURE__ */ React.createElement("input", { type: "time", value: f.time, onChange: (e) => up("time", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("select", { value: f.status, onChange: (e) => up("status", e.target.value) }, ["\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", "\u0E21\u0E32\u0E15\u0E32\u0E21\u0E19\u0E31\u0E14", "\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E19\u0E31\u0E14", "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o))))), /* @__PURE__ */ React.createElement("div", { className: "form-group mt-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("input", { value: f.reason, onChange: (e) => up("reason", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), /* @__PURE__ */ React.createElement("input", { value: f.note, onChange: (e) => up("note", e.target.value) })), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onCancel }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: () => onSave(f) }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")));
}
function AppointQuickModal({ data, onClose, getPatient, appointments, saveAppointment, nextAID }) {
  const { pat } = data;
  const [form, setForm] = useState({ hn: pat.hn, patname: pat.prefix + pat.fname + " " + pat.lname, date: "", time: "09:00", reason: "", status: "\u0E19\u0E31\u0E14\u0E41\u0E25\u0E49\u0E27", note: "" });
  const f = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const slipId = "appoint-slip-" + pat.hn;
  const save = async () => {
    await saveAppointment({ ...form, id: nextAID() });
    alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
    onClose();
  };
  return /* @__PURE__ */ React.createElement(Modal, { title: "\u{1F4C5} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22", onClose, width: 540 }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13 } }, /* @__PURE__ */ React.createElement("b", null, pat.prefix, pat.fname, " ", pat.lname), " \u2014 HN: ", pat.hn), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.date, onChange: (e) => f("date", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E27\u0E25\u0E32"), /* @__PURE__ */ React.createElement("input", { type: "time", value: form.time, onChange: (e) => f("time", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "form-group mt-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("input", { value: form.reason, onChange: (e) => f("reason", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "form-group" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38"), /* @__PURE__ */ React.createElement("input", { value: form.note, onChange: (e) => f("note", e.target.value) })), form.date && /* @__PURE__ */ React.createElement("div", { id: slipId, style: { border: "1px dashed #aaa", borderRadius: 6, padding: "12px 16px", marginTop: 10, fontSize: 13 } }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 10, letterSpacing: 1 } }, "\u0E43\u0E1A\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", fontSize: 13, borderCollapse: "collapse" } }, /* @__PURE__ */ React.createElement("tbody", null, [
    ["\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25", pat.prefix + pat.fname + " " + pat.lname],
    ["HN", pat.hn],
    ["\u0E27\u0E31\u0E19\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22", thaiDate(form.date) + " \u0E40\u0E27\u0E25\u0E32 " + form.time + " \u0E19."],
    ["\u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E19\u0E31\u0E14", form.reason || "\u0E15\u0E34\u0E14\u0E15\u0E32\u0E21\u0E2D\u0E32\u0E01\u0E32\u0E23"],
    form.note ? ["\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38", form.note] : null
  ].filter(Boolean).map(([k, v]) => /* @__PURE__ */ React.createElement("tr", { key: k }, /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 0", color: "#666", width: 120 } }, k, ":"), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 0", fontWeight: 600 } }, v))))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", marginTop: 12, paddingTop: 8, fontSize: 11, color: "#888", textAlign: "center" } }, "\u0E01\u0E23\u0E38\u0E13\u0E32\u0E21\u0E32\u0E15\u0E32\u0E21\u0E19\u0E31\u0E14 \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E2A\u0E30\u0E14\u0E27\u0E01\u0E42\u0E1B\u0E23\u0E14\u0E41\u0E08\u0E49\u0E07\u0E25\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E49\u0E32 \u2014 ", CLINIC_NAME, " \u0E42\u0E17\u0E23. ", CLINIC_TEL), /* @__PURE__ */ React.createElement(DoctorSignature, null)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" } }, form.date && /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", onClick: () => doPrint(slipId, "\u0E43\u0E1A\u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22 " + pat.prefix + pat.fname + " " + pat.lname) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E19\u0E31\u0E14"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onClose }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E19\u0E31\u0E14")));
}
const EXP_CATS = ["\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", "\u0E04\u0E48\u0E32\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E39\u0E1B\u0E42\u0E20\u0E04", "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48", "\u0E40\u0E07\u0E34\u0E19\u0E40\u0E14\u0E37\u0E2D\u0E19/\u0E04\u0E48\u0E32\u0E08\u0E49\u0E32\u0E07", "\u0E2D\u0E38\u0E1B\u0E01\u0E23\u0E13\u0E4C\u0E01\u0E32\u0E23\u0E41\u0E1E\u0E17\u0E22\u0E4C", "\u0E04\u0E48\u0E32\u0E0B\u0E48\u0E2D\u0E21\u0E1A\u0E33\u0E23\u0E38\u0E07", "\u0E04\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E25\u0E32\u0E14/\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C", "\u0E20\u0E32\u0E29\u0E35", "\u0E04\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E08\u0E48\u0E32\u0E22\u0E17\u0E31\u0E48\u0E27\u0E44\u0E1B", "\u0E2D\u0E37\u0E48\u0E19\u0E46"];
const INIT_EXPENSES = [
  { id: "X001", date: "2025-06-01", category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", desc: "\u0E0B\u0E37\u0E49\u0E2D\u0E22\u0E32 Paracetamol 500mg x1000 \u0E40\u0E21\u0E47\u0E14", amount: 1e3 },
  { id: "X002", date: "2025-06-02", category: "\u0E04\u0E48\u0E32\u0E2A\u0E32\u0E18\u0E32\u0E23\u0E13\u0E39\u0E1B\u0E42\u0E20\u0E04", desc: "\u0E04\u0E48\u0E32\u0E44\u0E1F\u0E1F\u0E49\u0E32\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E1E\u0E24\u0E29\u0E20\u0E32\u0E04\u0E21", amount: 2500 },
  { id: "X003", date: "2025-06-05", category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", desc: "\u0E0B\u0E37\u0E49\u0E2D\u0E22\u0E32 Amoxicillin 500mg x200 \u0E41\u0E04\u0E1B\u0E0B\u0E39\u0E25", amount: 800 },
  { id: "X004", date: "2025-06-10", category: "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48", desc: "\u0E04\u0E48\u0E32\u0E40\u0E0A\u0E48\u0E32\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E21\u0E34\u0E16\u0E38\u0E19\u0E32\u0E22\u0E19", amount: 8e3 }
];
function AccountingPage({ receipts, today: today2 }) {
  const [expenses, setExpenses] = useState(INIT_EXPENSES);
  const nextXID = () => `X${pad(expenses.length + 1, 3)}`;
  const [showType, setShowType] = useState("both");
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState((/* @__PURE__ */ new Date()).getFullYear().toString());
  const [month, setMonth] = useState(String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [addForm, setAddForm] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const getRange = () => {
    const d = /* @__PURE__ */ new Date();
    if (period === "today") return [today2, today2];
    if (period === "week") return getWeekBounds(d);
    if (period === "month") return [`${year}-${month}-01`, `${year}-${month}-31`];
    if (period === "quarter") return getQuarterBounds(d);
    if (period === "year") return [`${year}-01-01`, `${year}-12-31`];
    return [fromDate || "2000-01-01", toDate || "2099-12-31"];
  };
  const [r0, r1] = getRange();
  const inRange = (d) => d >= r0 && d <= r1;
  const filtIncome = receipts.filter((r) => inRange(r.date));
  const filtExp = expenses.filter((e) => inRange(e.date));
  const totalIncome = filtIncome.reduce((s, r) => s + r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount, 0);
  const totalExpense = filtExp.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const saveExp = (f) => {
    if (f.id && expenses.find((e) => e.id === f.id)) {
      setExpenses((prev) => prev.map((e) => e.id === f.id ? f : e));
    } else {
      setExpenses((prev) => [...prev, { ...f, id: nextXID() }]);
    }
    setAddForm(null);
    setEditForm(null);
  };
  const delExp = (id) => {
    if (window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49?")) setExpenses((prev) => prev.filter((e) => e.id !== id));
  };
  const PERIODS = [
    { k: "today", l: "\u0E27\u0E31\u0E19\u0E19\u0E35\u0E49" },
    { k: "week", l: "\u0E2A\u0E31\u0E1B\u0E14\u0E32\u0E2B\u0E4C\u0E19\u0E35\u0E49" },
    { k: "month", l: "\u0E40\u0E14\u0E37\u0E2D\u0E19\u0E19\u0E35\u0E49" },
    { k: "quarter", l: "\u0E44\u0E15\u0E23\u0E21\u0E32\u0E2A\u0E19\u0E35\u0E49" },
    { k: "year", l: "\u0E1B\u0E35\u0E19\u0E35\u0E49" },
    { k: "custom", l: "\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E40\u0E2D\u0E07" }
  ];
  const allRows = [];
  if (showType !== "expense") filtIncome.forEach((r) => {
    const tot = r.items.reduce((s, i) => s + i.qty * i.price, 0) - r.discount;
    allRows.push({ type: "income", date: r.date, id: r.id, desc: `\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 ${r.id} \u2014 ${r.patname || "HN:" + r.hn}`, category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", income: tot, expense: 0 });
  });
  if (showType !== "income") filtExp.forEach((e) => {
    allRows.push({ type: "expense", date: e.date, id: e.id, desc: e.desc, category: e.category, income: 0, expense: e.amount, expObj: e });
  });
  allRows.sort((a, b) => b.date.localeCompare(a.date));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4BC} \u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A-\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint("accounting-report", "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A-\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22") }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: () => setAddForm({ date: today2, category: "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E22\u0E32", desc: "", amount: 0 }) }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22"))), /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 13 } }, "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32:"), PERIODS.map((p) => /* @__PURE__ */ React.createElement("button", { key: p.k, className: `btn btn-sm ${period === p.k ? "btn-primary" : "btn-outline"}`, onClick: () => setPeriod(p.k) }, p.l))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, (period === "month" || period === "year") && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E1B\u0E35 (\u0E04.\u0E28.)"), /* @__PURE__ */ React.createElement("input", { value: year, onChange: (e) => setYear(e.target.value), style: { width: 90 } })), period === "month" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E14\u0E37\u0E2D\u0E19 (01-12)"), /* @__PURE__ */ React.createElement("input", { value: month, onChange: (e) => setMonth(e.target.value.padStart(2, "0")), style: { width: 80 } })), period === "custom" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), style: { width: 160 } }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E41\u0E2A\u0E14\u0E07"), /* @__PURE__ */ React.createElement("select", { value: showType, onChange: (e) => setShowType(e.target.value), style: { width: 180 } }, /* @__PURE__ */ React.createElement("option", { value: "both" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22"), /* @__PURE__ */ React.createElement("option", { value: "income" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"), /* @__PURE__ */ React.createElement("option", { value: "expense" }, "\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27"))))), (addForm || editForm) && /* @__PURE__ */ React.createElement("div", { className: "card no-print", style: { marginBottom: 14, background: "#fff8f0", border: "1.5px solid var(--warning)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--warning)", marginBottom: 10 } }, editForm ? "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22" : "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E43\u0E2B\u0E21\u0E48"), (() => {
    const ef = editForm || addForm;
    const setEf = editForm ? setEditForm : setAddForm;
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: ef.date, onChange: (e) => setEf((p) => ({ ...p, date: e.target.value })) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), /* @__PURE__ */ React.createElement("select", { value: ef.category, onChange: (e) => setEf((p) => ({ ...p, category: e.target.value })) }, EXP_CATS.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "span 2" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), /* @__PURE__ */ React.createElement("input", { value: ef.desc, onChange: (e) => setEf((p) => ({ ...p, desc: e.target.value })) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: ef.amount, onChange: (e) => setEf((p) => ({ ...p, amount: Number(e.target.value) })) }))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => {
      setAddForm(null);
      setEditForm(null);
    } }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm", style: { background: "var(--warning)", color: "#fff" }, onClick: () => saveExp(ef) }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")));
  })()), /* @__PURE__ */ React.createElement("div", { id: "accounting-report" }, /* @__PURE__ */ React.createElement("div", { style: { display: "none" }, className: "print-only" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, marginBottom: 4 } }, "\u0E23\u0E32\u0E22\u0E07\u0E32\u0E19\u0E1A\u0E31\u0E0D\u0E0A\u0E35\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A-\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontSize: 12, color: "#666", marginBottom: 12 } }, r0 === r1 ? thaiDate(r0) : `${thaiDate(r0)} \u2014 ${thaiDate(r1)}`)), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 } }, showType !== "expense" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", border: "2px solid var(--accent)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 } }, "\u{1F4B0} \u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "var(--accent)" } }, totalIncome.toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, "\u0E1A\u0E32\u0E17 (", filtIncome.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)")), showType !== "income" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", border: "2px solid var(--danger)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--danger)", fontWeight: 700, marginBottom: 4 } }, "\u{1F4B8} \u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: "var(--danger)" } }, totalExpense.toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, "\u0E1A\u0E32\u0E17 (", filtExp.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)")), showType === "both" && /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", border: `2.5px solid ${netProfit >= 0 ? "var(--accent)" : "var(--danger)"}` } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: netProfit >= 0 ? "var(--accent)" : "var(--danger)", fontWeight: 700, marginBottom: 4 } }, netProfit >= 0 ? "\u{1F4C8}" : "\u{1F4C9}", " \u0E01\u0E33\u0E44\u0E23\u0E2A\u0E38\u0E17\u0E18\u0E34"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 22, fontWeight: 700, color: netProfit >= 0 ? "var(--accent)" : "var(--danger)" } }, netProfit.toLocaleString()), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, "\u0E1A\u0E32\u0E17"))), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 100 } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 70 } }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 130 } }, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), showType !== "expense" && /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "right", width: 110 } }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A (\u0E3F)"), showType !== "income" && /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "right", width: 110 } }, "\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22 (\u0E3F)"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 8px", width: 80 }, className: "no-print" }))), /* @__PURE__ */ React.createElement("tbody", null, allRows.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01")), allRows.map((row, i) => /* @__PURE__ */ React.createElement("tr", { key: row.id + i, style: { background: row.type === "income" ? "#f0fdf4" : i % 2 === 0 ? "#fff8f7" : "#fff2f2" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", fontSize: 12 } }, thaiDate(row.date)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px" } }, row.type === "income" ? /* @__PURE__ */ React.createElement("span", { className: "tag tag-green" }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A") : /* @__PURE__ */ React.createElement("span", { className: "tag tag-red" }, "\u0E23\u0E32\u0E22\u0E08\u0E48\u0E32\u0E22")), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", fontSize: 12 } }, row.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "tag tag-blue" }, row.category)), showType !== "expense" && /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", textAlign: "right", fontWeight: row.income > 0 ? 700 : 400, color: row.income > 0 ? "var(--accent)" : "#ccc" } }, row.income > 0 ? row.income.toLocaleString() : "-"), showType !== "income" && /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", textAlign: "right", fontWeight: row.expense > 0 ? 700 : 400, color: row.expense > 0 ? "var(--danger)" : "#ccc" } }, row.expense > 0 ? row.expense.toLocaleString() : "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 8px" }, className: "no-print" }, row.type === "expense" && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 3 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", style: { padding: "3px 8px", fontSize: 11 }, onClick: () => setEditForm({ ...row.expObj }) }, "\u0E41\u0E01\u0E49"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", style: { padding: "3px 8px", fontSize: 11 }, onClick: () => delExp(row.id) }, "\u0E25\u0E1A")))))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#1a5276", color: "#fff", fontWeight: 700, fontSize: 13 } }, /* @__PURE__ */ React.createElement("td", { colSpan: showType === "both" ? 3 : 3, style: { padding: "9px 12px" } }, "\u0E23\u0E27\u0E21\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 (", allRows.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23)"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 12px" } }), showType !== "expense" && /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 12px", textAlign: "right" } }, totalIncome.toLocaleString()), showType !== "income" && /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 12px", textAlign: "right" } }, totalExpense.toLocaleString()), showType === "both" && /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 8px", textAlign: "right", fontSize: 11 }, className: "no-print" }, "\u0E01\u0E33\u0E44\u0E23: ", netProfit.toLocaleString()), showType !== "both" && /* @__PURE__ */ React.createElement("td", { className: "no-print" })))))));
}
function PharmacyPage({ medicines, saveMedicine, deleteMedicine, receipts, treatmentServices, saveTreatmentService, deleteTreatmentService }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14");
  const [tab, setTab] = useState("stock");
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newMed, setNewMed] = useState({ name: "", unit: "\u0E40\u0E21\u0E47\u0E14", stock: 0, price: 0, cost: 0, expire: "", category: "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E1B\u0E27\u0E14/\u0E25\u0E14\u0E44\u0E02\u0E49", minstock: 50 });
  const [svcEdit, setSvcEdit] = useState(null);
  const [svcAdding, setSvcAdding] = useState(false);
  const SVC_CATS = ["\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08", "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E40\u0E28\u0E29", "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", "\u0E2D\u0E37\u0E48\u0E19\u0E46"];
  const saveService = async (f) => {
    const svc = f.id ? f : { ...f, id: "S" + pad((treatmentServices || []).length + 1, 3), active: true };
    await saveTreatmentService(svc);
    setSvcEdit(null);
    setSvcAdding(false);
  };
  const delService = async (id) => {
    if (window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23?")) await deleteTreatmentService(id);
  };
  const toggleActive = async (id) => {
    const svc = (treatmentServices || []).find((s) => s.id === id);
    if (svc) await saveTreatmentService({ ...svc, active: !svc.active });
  };
  const cats = ["\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14", ...new Set(medicines.map((m) => m.category))];
  const filtered = medicines.filter((m) => {
    const q = search.toLowerCase();
    const match = m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    const catMatch = cat === "\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14" || m.category === cat;
    return match && catMatch;
  });
  const lowStock = medicines.filter((m) => m.stock <= m.minstock);
  const expireSoon = medicines.filter((m) => (new Date(m.expire) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24) < 90);
  const saveMed = async (f) => {
    const med = f.id ? f : { ...f, id: "M" + pad(medicines.length + 1, 3) };
    await saveMedicine(med);
    setEdit(null);
    setAdding(false);
  };
  const delMed = async (id) => {
    if (window.confirm("\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E25\u0E1A?")) await deleteMedicine(id);
  };
  const consumed = {};
  receipts.forEach((r) => r.items.forEach((it) => {
    const med = medicines.find((m) => it.desc.includes(m.name));
    if (med) {
      if (!consumed[med.id]) consumed[med.id] = { name: med.name, qty: 0, revenue: 0 };
      consumed[med.id].qty += it.qty;
      consumed[med.id].revenue += it.qty * it.price;
    }
  }));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F48A} \u0E04\u0E25\u0E31\u0E07\u0E22\u0E32\u0E41\u0E25\u0E30\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C"), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "stock" ? "btn-primary" : "btn-outline"}`, onClick: () => setTab("stock") }, "\u{1F4E6} \u0E2A\u0E15\u0E4A\u0E2D\u0E01\u0E22\u0E32"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setTab("services"),
      style: { padding: "5px 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: tab === "services" ? "#1e8449" : "transparent", color: tab === "services" ? "#fff" : "#1e8449", boxShadow: tab === "services" ? "none" : "inset 0 0 0 1.5px #1e8449" }
    },
    "\u{1F3E5} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23"
  ), /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "report" ? "btn-primary" : "btn-outline"}`, onClick: () => setTab("report") }, "\u{1F4CA} \u0E23\u0E32\u0E22\u0E07\u0E32\u0E19"), tab === "stock" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: () => setAdding(true) }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32"), tab === "services" && /* @__PURE__ */ React.createElement("button", { onClick: () => setSvcAdding(true), style: { padding: "5px 12px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: "#1e8449", color: "#fff" } }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23"))), (lowStock.length > 0 || expireSoon.length > 0) && /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12, background: "#fff8f0", border: "1.5px solid var(--warning)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--warning)", marginBottom: 8 } }, "\u26A0\uFE0F \u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, lowStock.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id + "l", style: { background: "var(--danger-pale)", borderRadius: 5, padding: "3px 10px", fontSize: 12, color: "var(--danger)" } }, /* @__PURE__ */ React.createElement("b", null, m.name), " \u0E40\u0E2B\u0E25\u0E37\u0E2D ", m.stock, " ", m.unit, " (min: ", m.minstock, ")")), expireSoon.map((m) => /* @__PURE__ */ React.createElement("div", { key: m.id + "e", style: { background: "var(--warning-pale)", borderRadius: 5, padding: "3px 10px", fontSize: 12, color: "var(--warning)" } }, /* @__PURE__ */ React.createElement("b", null, m.name), " \u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38 ", thaiDate(m.expire))))), tab === "stock" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" } }, /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E22\u0E32", style: { maxWidth: 220 } }), /* @__PURE__ */ React.createElement("select", { value: cat, onChange: (e) => setCat(e.target.value), style: { width: 180 } }, cats.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c))))), (adding || edit && !edit.id) && /* @__PURE__ */ React.createElement(MedForm, { form: adding ? newMed : edit, onSave: saveMed, onCancel: () => {
    setAdding(false);
    setEdit(null);
  }, isNew: adding }), edit && edit.id && /* @__PURE__ */ React.createElement(MedForm, { form: edit, onSave: saveMed, onCancel: () => setEdit(null) }), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "left" } }, "\u0E23\u0E2B\u0E31\u0E2A"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "left" } }, "\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32/\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "left" } }, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "center" } }, "\u0E2A\u0E15\u0E4A\u0E2D\u0E01"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "center" } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "right" } }, "\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "right" } }, "\u0E23\u0E32\u0E04\u0E32\u0E17\u0E38\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px", textAlign: "left" } }, "\u0E27\u0E31\u0E19\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 10px" } }))), /* @__PURE__ */ React.createElement("tbody", null, filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 9, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), filtered.map((m, i) => {
    const expDays = (new Date(m.expire) - /* @__PURE__ */ new Date()) / (1e3 * 60 * 60 * 24);
    const isLow = m.stock <= m.minstock;
    const isExp = expDays < 90;
    return /* @__PURE__ */ React.createElement("tr", { key: m.id, style: { background: isLow ? "#fff0f0" : isExp ? "#fffaf0" : i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", fontWeight: 700, color: "var(--primary)" } }, m.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", fontWeight: 600 } }, m.name), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px" } }, /* @__PURE__ */ React.createElement("span", { className: "tag tag-blue" }, m.category)), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "center", fontWeight: 700, color: isLow ? "var(--danger)" : "var(--accent)" } }, m.stock, " ", isLow && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10 } }, "\u26A0\uFE0F")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "center" } }, m.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right" } }, m.price.toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", color: "var(--gray)" } }, m.cost.toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", color: isExp ? "var(--warning)" : "" } }, thaiDate(m.expire), isExp && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10 } }, " \u26A0\uFE0F")), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setEdit({ ...m }) }, "\u0E41\u0E01\u0E49\u0E44\u0E02"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => delMed(m.id) }, "\u0E25\u0E1A")));
  }))))), tab === "services" && /* @__PURE__ */ React.createElement("div", null, (svcAdding || svcEdit) && /* @__PURE__ */ React.createElement(
    ServiceForm,
    {
      form: svcEdit || { name: "", category: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08", price: 300, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", active: true },
      isNew: !svcEdit,
      cats: SVC_CATS,
      onSave: saveService,
      onCancel: () => {
        setSvcAdding(false);
        setSvcEdit(null);
      }
    }
  ), /* @__PURE__ */ React.createElement("div", { style: { background: "#e8f8f0", border: "1px solid #a8d5c8", borderRadius: 8, padding: "8px 14px", marginBottom: 12, fontSize: 12, color: "#1e8449" } }, "\u{1F4A1} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("b", null, "\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"), " \u0E08\u0E30\u0E41\u0E2A\u0E14\u0E07\u0E43\u0E19\u0E01\u0E25\u0E48\u0E2D\u0E07\u0E2A\u0E31\u0E48\u0E07\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23\u0E15\u0E2D\u0E19\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32 | \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 ", /* @__PURE__ */ React.createElement("b", null, "\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19"), " \u0E08\u0E30\u0E0B\u0E48\u0E2D\u0E19\u0E44\u0E27\u0E49\u0E41\u0E15\u0E48\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E25\u0E1A\u0E2D\u0E2D\u0E01"), /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "#1e8449", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 70 } }, "\u0E23\u0E2B\u0E31\u0E2A"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left" } }, "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 110 } }, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "right", width: 90 } }, "\u0E23\u0E32\u0E04\u0E32 (\u0E3F)"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "left", width: 60 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", textAlign: "center", width: 95 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 12px", width: 110 } }))), /* @__PURE__ */ React.createElement("tbody", null, (treatmentServices || []).length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: 24, textAlign: "center", color: "var(--gray)" } }, '\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u0E01\u0E14\u0E1B\u0E38\u0E48\u0E21 "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19')), (treatmentServices || []).map((s, i) => /* @__PURE__ */ React.createElement("tr", { key: s.id, style: { background: !s.active ? "#f8f8f8" : i % 2 === 0 ? "#fff" : "#f4fbf7", opacity: s.active ? 1 : 0.65 } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", fontWeight: 700, color: "#1e8449", fontSize: 12 } }, s.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", fontWeight: 600 } }, s.name), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px" } }, /* @__PURE__ */ React.createElement("span", { className: "tag tag-green", style: { fontSize: 11 } }, s.category)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1a5276" } }, (s.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", fontSize: 12, color: "#666" } }, s.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", textAlign: "center" } }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => toggleActive(s.id),
      style: { padding: "3px 10px", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit", background: s.active ? "#d5f5e3" : "#eee", color: s.active ? "#1e8449" : "#999", transition: "all 0.15s" }
    },
    s.active ? "\u2705 \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49" : "\u23F8 \u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49"
  )), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 12px", display: "flex", gap: 4 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setSvcEdit({ ...s }) }, "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-danger btn-sm", onClick: () => delService(s.id) }, "\u0E25\u0E1A")))))))), tab === "report" && /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 } }, "\u{1F4CA} \u0E2A\u0E23\u0E38\u0E1B\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E22\u0E32 (\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14)"), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "center" } }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E08\u0E48\u0E32\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "right" } }, "\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "center" } }, "\u0E2A\u0E15\u0E4A\u0E2D\u0E01\u0E04\u0E07\u0E40\u0E2B\u0E25\u0E37\u0E2D"))), /* @__PURE__ */ React.createElement("tbody", null, Object.values(consumed).length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), Object.values(consumed).sort((a, b) => b.revenue - a.revenue).map((c, i) => {
    const med = medicines.find((m) => m.name === c.name);
    return /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", fontWeight: 600 } }, c.name), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "center" } }, c.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "right", color: "var(--accent)", fontWeight: 600 } }, c.revenue.toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "center" } }, (med == null ? void 0 : med.stock) || 0, " ", (med == null ? void 0 : med.unit) || ""));
  })))));
}
function MedForm({ form, onSave, onCancel, isNew }) {
  const [f, setF] = useState({ ...form });
  const up = (k, v) => setF((prev) => ({ ...prev, [k]: k === "stock" || k === "price" || k === "cost" || k === "minstock" ? Number(v) : v }));
  const cats = ["\u0E22\u0E32\u0E41\u0E01\u0E49\u0E1B\u0E27\u0E14/\u0E25\u0E14\u0E44\u0E02\u0E49", "\u0E22\u0E32\u0E1B\u0E0F\u0E34\u0E0A\u0E35\u0E27\u0E19\u0E30", "\u0E22\u0E32\u0E41\u0E01\u0E49\u0E41\u0E1E\u0E49", "\u0E22\u0E32\u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E32\u0E2B\u0E32\u0E23", "\u0E22\u0E32\u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19", "\u0E22\u0E32\u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19", "\u0E22\u0E32\u0E2B\u0E31\u0E27\u0E43\u0E08", "\u0E27\u0E34\u0E15\u0E32\u0E21\u0E34\u0E19/\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E40\u0E2A\u0E23\u0E34\u0E21", "\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C/\u0E27\u0E31\u0E2A\u0E14\u0E38\u0E2A\u0E34\u0E49\u0E19\u0E40\u0E1B\u0E25\u0E37\u0E2D\u0E07", "\u0E2D\u0E37\u0E48\u0E19\u0E46"];
  return /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 12, background: "var(--accent-pale)", border: "1.5px solid var(--accent)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "var(--accent)", marginBottom: 10 } }, isNew ? "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32\u0E43\u0E2B\u0E21\u0E48" : "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E22\u0E32"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E22\u0E32/\u0E40\u0E27\u0E0A\u0E20\u0E31\u0E13\u0E11\u0E4C *"), /* @__PURE__ */ React.createElement("input", { value: f.name, onChange: (e) => up("name", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("input", { value: f.unit, onChange: (e) => up("unit", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), /* @__PURE__ */ React.createElement("select", { value: f.category, onChange: (e) => up("category", e.target.value) }, cats.map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2A\u0E15\u0E4A\u0E2D\u0E01\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19"), /* @__PURE__ */ React.createElement("input", { type: "number", value: f.stock, onChange: (e) => up("stock", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2A\u0E15\u0E4A\u0E2D\u0E01\u0E02\u0E31\u0E49\u0E19\u0E15\u0E48\u0E33 (\u0E41\u0E08\u0E49\u0E07\u0E40\u0E15\u0E37\u0E2D\u0E19)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: f.minstock, onChange: (e) => up("minstock", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E23\u0E32\u0E04\u0E32\u0E02\u0E32\u0E22 (\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: f.price, onChange: (e) => up("price", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E23\u0E32\u0E04\u0E32\u0E17\u0E38\u0E19 (\u0E1A\u0E32\u0E17/\u0E2B\u0E19\u0E48\u0E27\u0E22)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: f.cost, onChange: (e) => up("cost", e.target.value) })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E2B\u0E21\u0E14\u0E2D\u0E32\u0E22\u0E38"), /* @__PURE__ */ React.createElement("input", { type: "date", value: f.expire, onChange: (e) => up("expire", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onCancel }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: () => onSave(f) }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01")));
}
function ServiceForm({ form, onSave, onCancel, isNew, cats }) {
  const [f, setF] = useState({ ...form });
  const up = (k, v) => setF((prev) => ({ ...prev, [k]: k === "price" ? Number(v) : v }));
  return /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14, background: "#e8f8f0", border: "2px solid #1e8449" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, color: "#1e8449", marginBottom: 12, fontSize: 14 } }, isNew ? "\u2795 \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E21\u0E48" : "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { gridColumn: "span 2" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 / \u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22 ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--danger)" } }, "*")), /* @__PURE__ */ React.createElement("input", { value: f.name, onChange: (e) => up("name", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32 OPD, \u0E04\u0E48\u0E32\u0E09\u0E35\u0E14\u0E22\u0E32 1 \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48"), /* @__PURE__ */ React.createElement("select", { value: f.category, onChange: (e) => up("category", e.target.value) }, (cats || ["\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08", "\u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23", "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E1E\u0E34\u0E40\u0E28\u0E29", "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", "\u0E2D\u0E37\u0E48\u0E19\u0E46"]).map((c) => /* @__PURE__ */ React.createElement("option", { key: c }, c)))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E23\u0E32\u0E04\u0E32\u0E1B\u0E01\u0E15\u0E34 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: f.price, onChange: (e) => up("price", e.target.value), min: 0 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("input", { value: f.unit || "\u0E04\u0E23\u0E31\u0E49\u0E07", onChange: (e) => up("unit", e.target.value), placeholder: "\u0E04\u0E23\u0E31\u0E49\u0E07, \u0E09\u0E1A\u0E31\u0E1A, \u0E0A\u0E38\u0E14..." }))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 12, display: "flex", gap: 8, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onCancel }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        if (!f.name.trim()) {
          alert("\u0E01\u0E23\u0E38\u0E13\u0E32\u0E43\u0E2A\u0E48\u0E0A\u0E37\u0E48\u0E2D\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23");
          return;
        }
        onSave(f);
      },
      style: { padding: "6px 18px", background: "#1e8449", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }
    },
    "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"
  )));
}
function ClinicHeader() {
  return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 10, paddingBottom: 10, borderBottom: "2px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("img", { src: CLINIC_LOGO, alt: "\u0E42\u0E25\u0E42\u0E01\u0E04\u0E25\u0E34\u0E19\u0E34\u0E01", style: { width: 70, height: 70, objectFit: "contain", display: "block", margin: "0 auto 4px" } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--primary)", letterSpacing: 0.5 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)", marginTop: 2 } }, CLINIC_ADDRESS), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, "\u0E42\u0E17\u0E23. ", CLINIC_TEL));
}
function DoctorSignature() {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", minWidth: 220 } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #999", marginBottom: 4, height: 40 } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, DOCTOR_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, DOCTOR_TITLE), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE)));
}
function Modal({ title, onClose, children, width = 600 }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) onClose();
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: "12px", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", padding: 24, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--primary)" } }, title), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--gray)", lineHeight: 1 } }, "\xD7")), children));
}
