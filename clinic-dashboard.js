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
  services: Array.isArray(r.services) ? r.services : r.services ? JSON.parse(r.services) : []
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
  services: v.services || []
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
const CLINIC_ADDRESS = "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 123 \u0E16\u0E19\u0E19\u0E2A\u0E32\u0E22\u0E2B\u0E25\u0E31\u0E01 \u0E15\u0E33\u0E1A\u0E25\u0E40\u0E27\u0E35\u0E22\u0E07 \u0E2D\u0E33\u0E40\u0E20\u0E2D\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E41\u0E2A\u0E19 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14\u0E40\u0E0A\u0E35\u0E22\u0E07\u0E23\u0E32\u0E22 57150";
const CLINIC_TEL = "053-777-XXX";
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
  const nextVID = () => `V${pad(visits.length + 1, 3)}`;
  const nextRID = () => `R${pad(receipts.length + 1, 3)}`;
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
  return /* @__PURE__ */ React.createElement("div", { style: { minHeight: "100vh", background: "#eef2f7", fontFamily: "'Sarabun','Noto Sans Thai',sans-serif" } }, /* @__PURE__ */ React.createElement("style", null, globalStyles), loading && /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(26,82,118,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 48, marginBottom: 16 } }, "\u{1F3E5}"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 18, marginBottom: 8 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 14, opacity: 0.85, marginBottom: 24 } }, "\u0E01\u0E33\u0E25\u0E31\u0E07\u0E42\u0E2B\u0E25\u0E14\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E08\u0E32\u0E01\u0E10\u0E32\u0E19\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25..."), /* @__PURE__ */ React.createElement("div", { style: { width: 200, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("div", { style: { width: "60%", height: "100%", background: "#2ecc71", borderRadius: 2, animation: "pulse 1.5s ease-in-out infinite" } })), /* @__PURE__ */ React.createElement("style", null, `@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}`)), !loading && (dbError === "SANDBOX_BLOCK" ? /* @__PURE__ */ React.createElement("div", { style: { background: "#e67e22", color: "#fff", fontSize: 12, padding: "6px 16px", textAlign: "center", lineHeight: 1.6 } }, "\u26A0\uFE0F ", /* @__PURE__ */ React.createElement("b", null, "Claude Artifact \u0E44\u0E21\u0E48\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E43\u0E2B\u0E49\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D internet"), " \u2014 \u0E23\u0E30\u0E1A\u0E1A\u0E17\u0E33\u0E07\u0E32\u0E19\u0E1B\u0E01\u0E15\u0E34\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48 sync DB \xA0|\xA0 \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19\u0E08\u0E23\u0E34\u0E07\u0E01\u0E31\u0E1A Supabase: \u0E40\u0E1B\u0E34\u0E14\u0E44\u0E1F\u0E25\u0E4C\u0E43\u0E19 ", /* @__PURE__ */ React.createElement("b", null, "Netlify Drop"), " \u0E2B\u0E23\u0E37\u0E2D ", /* @__PURE__ */ React.createElement("b", null, "CodeSandbox"), " \u0E41\u0E17\u0E19") : /* @__PURE__ */ React.createElement("div", { style: { background: dbError ? "#e74c3c" : dbReady ? "#1e8449" : "#e67e22", color: "#fff", fontSize: 11, padding: "3px 16px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 } }, dbError ? /* @__PURE__ */ React.createElement("span", null, "\u26A0\uFE0F DB Error: ", dbError) : dbReady ? /* @__PURE__ */ React.createElement("span", null, "\u2705 \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D Supabase \u0E41\u0E25\u0E49\u0E27 \u2014 \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E2D\u0E31\u0E15\u0E42\u0E19\u0E21\u0E31\u0E15\u0E34") : /* @__PURE__ */ React.createElement("span", null, "\u23F3 \u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D..."))), /* @__PURE__ */ React.createElement("div", { style: { background: `linear-gradient(135deg,#1a5276,#2e86c1)`, color: "#fff", padding: "0 0 0 0", boxShadow: "0 2px 12px rgba(26,82,118,0.25)" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 0" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { width: 48, height: 48, background: "rgba(255,255,255,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 } }, "\u{1F3E5}"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 17, letterSpacing: 0.3 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, opacity: 0.8, marginTop: 1 } }, CLINIC_ADDRESS))), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 12, opacity: 0.85 } }, /* @__PURE__ */ React.createElement("div", null, thaiDateFull(today())), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 2 } }, "\u0E42\u0E17\u0E23. ", CLINIC_TEL))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 2, padding: "10px 16px 0", overflowX: "auto", flexWrap: "nowrap" }, className: "scroll-thin" }, NAV.map((n) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: n.key,
      onClick: () => setPage(n.key),
      style: { background: page === n.key ? "rgba(255,255,255,0.22)" : "transparent", color: "#fff", border: "none", borderRadius: "8px 8px 0 0", padding: "8px 14px", cursor: "pointer", fontSize: 12.5, fontWeight: page === n.key ? 700 : 400, whiteSpace: "nowrap", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, borderBottom: page === n.key ? "2.5px solid #fff" : "2.5px solid transparent", transition: "all 0.15s" }
    },
    /* @__PURE__ */ React.createElement("span", null, n.icon),
    n.label
  )))), /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 20px 40px", maxWidth: 1200, margin: "0 auto" } }, page === "dashboard" && /* @__PURE__ */ React.createElement(DashboardPage, { todayVisits, todayAppoints, lowStock, monthRevenue, patients, visits, appointments, medicines, today: todayStr }), page === "register" && /* @__PURE__ */ React.createElement(RegisterPage, { patients, savePatient, visits, saveVisit, nextHN, nextVID, setPage, getVisitsForHN, getPatient, treatmentServices }), page === "examine" && /* @__PURE__ */ React.createElement(ExaminePage, { patients, visits, saveVisit, nextVID, getPatient, getVisitsForHN, setCertModal, setReceiptModal, setAppointModal, medicines, patchMedicineStock, treatmentServices, receipts, saveReceipt, nextRID }), page === "cert" && /* @__PURE__ */ React.createElement(CertPage, { patients, visits, getPatient }), page === "receipt" && /* @__PURE__ */ React.createElement(ReceiptPage, { receipts, saveReceipt, patients, visits, nextRID, getPatient, medicines, patchMedicineStock }), page === "appoint" && /* @__PURE__ */ React.createElement(AppointPage, { appointments, saveAppointment, deleteAppointment, patients, nextAID, getPatient, today: todayStr }), page === "accounting" && /* @__PURE__ */ React.createElement(AccountingPage, { receipts, today: todayStr }), page === "pharmacy" && /* @__PURE__ */ React.createElement(PharmacyPage, { medicines, saveMedicine, deleteMedicine, receipts, treatmentServices, saveTreatmentService, deleteTreatmentService })), certModal && /* @__PURE__ */ React.createElement(CertModal, { data: certModal, onClose: () => setCertModal(null), getPatient }), receiptModal && /* @__PURE__ */ React.createElement(ReceiptQuickModal, { data: receiptModal, onClose: () => setReceiptModal(null), getPatient, nextRID, receipts, saveReceipt, medicines, patchMedicineStock }), appointModal && /* @__PURE__ */ React.createElement(AppointQuickModal, { data: appointModal, onClose: () => setAppointModal(null), getPatient, appointments, saveAppointment, nextAID }));
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
    <div class="clinic">\u{1F3E5} ${CLINIC_NAME}</div>
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
    setForm({ prefix: "\u0E19\u0E32\u0E22", fname: "", lname: "", gender: "\u0E0A\u0E32\u0E22", dob: "", idcard: "", tel: "", address: "", bloodtype: "", allergy: "", chronic: "", currentmed: "", email: "", occupation: "", emcontact: "", emtel: "" });
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
  } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", fontWeight: 700, color: "var(--primary)" } }, p.hn), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", fontWeight: 600 } }, p.prefix, p.fname, " ", p.lname), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px" } }, p.gender, " / ", age(p.dob)), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", color: p.chronic && p.chronic !== "-" ? "var(--warning)" : "var(--gray)" } }, p.chronic || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px", color: p.allergy && p.allergy !== "-" ? "var(--danger)" : "var(--gray)" } }, p.allergy || "-"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px" } }, getVisitsForHN(p.hn).length, " \u0E04\u0E23\u0E31\u0E49\u0E07"), /* @__PURE__ */ React.createElement("td", { style: { padding: "9px 14px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: (e) => {
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
  } }, "+ \u0E25\u0E07\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E04\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: () => setSubpage("list") }, "\u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E0A\u0E37\u0E48\u0E2D"))), subpage === "detail" && selectedPat && /* @__PURE__ */ React.createElement(PatientDetail, { pat: selectedPat, visits: getVisitsForHN(selectedPat.hn), onBack: () => setSubpage("list"), patients, savePatient, treatmentServices }));
}
function PatientForm({ form, setForm }) {
  const f = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--gray-pale)", borderRadius: 8, padding: "12px 14px", marginBottom: 12 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--primary)", marginBottom: 10 } }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 110px" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E04\u0E33\u0E19\u0E33\u0E2B\u0E19\u0E49\u0E32\u0E0A\u0E37\u0E48\u0E2D *"), /* @__PURE__ */ React.createElement("select", { value: form.prefix, onChange: (e) => f("prefix", e.target.value) }, ["\u0E19\u0E32\u0E22", "\u0E19\u0E32\u0E07", "\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", "\u0E40\u0E14\u0E47\u0E01\u0E0A\u0E32\u0E22", "\u0E40\u0E14\u0E47\u0E01\u0E2B\u0E0D\u0E34\u0E07", "\u0E14.\u0E0A.", "\u0E14.\u0E0D.", "\u0E1E.\u0E17.", "\u0E1E.\u0E0D.", "\u0E2D\u0E37\u0E48\u0E19\u0E46"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D *"), /* @__PURE__ */ React.createElement("input", { value: form.fname, onChange: (e) => f("fname", e.target.value), placeholder: "\u0E0A\u0E37\u0E48\u0E2D\u0E08\u0E23\u0E34\u0E07" })), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25 *"), /* @__PURE__ */ React.createElement("input", { value: form.lname, onChange: (e) => f("lname", e.target.value), placeholder: "\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25" })), /* @__PURE__ */ React.createElement("div", { style: { flex: "0 0 90px" } }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1E\u0E28 *"), /* @__PURE__ */ React.createElement("select", { value: form.gender, onChange: (e) => f("gender", e.target.value) }, /* @__PURE__ */ React.createElement("option", null, "\u0E0A\u0E32\u0E22"), /* @__PURE__ */ React.createElement("option", null, "\u0E2B\u0E0D\u0E34\u0E07"), /* @__PURE__ */ React.createElement("option", null, "\u0E2D\u0E37\u0E48\u0E19\u0E46")))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E27\u0E31\u0E19\u0E40\u0E01\u0E34\u0E14"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.dob, onChange: (e) => f("dob", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19 / Passport"), /* @__PURE__ */ React.createElement("input", { value: form.idcard, onChange: (e) => f("idcard", e.target.value), placeholder: "\u0E40\u0E25\u0E02 13 \u0E2B\u0E25\u0E31\u0E01" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E14"), /* @__PURE__ */ React.createElement("select", { value: form.bloodtype, onChange: (e) => f("bloodtype", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "" }, "-\u0E44\u0E21\u0E48\u0E17\u0E23\u0E32\u0E1A-"), ["O", "A", "B", "AB"].map((b) => [/* @__PURE__ */ React.createElement("option", { key: b + "+" }, b, "+"), /* @__PURE__ */ React.createElement("option", { key: b + "-" }, b, "-")])))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C"), /* @__PURE__ */ React.createElement("input", { value: form.tel, onChange: (e) => f("tel", e.target.value), placeholder: "0x-xxxx-xxxx" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2D\u0E35\u0E40\u0E21\u0E25"), /* @__PURE__ */ React.createElement("input", { value: form.email, onChange: (e) => f("email", e.target.value), placeholder: "email@..." })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E2D\u0E32\u0E0A\u0E35\u0E1E"), /* @__PURE__ */ React.createElement("input", { value: form.occupation, onChange: (e) => f("occupation", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "form-group mt-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48"), /* @__PURE__ */ React.createElement("input", { value: form.address, onChange: (e) => f("address", e.target.value), placeholder: "\u0E1A\u0E49\u0E32\u0E19\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 \u0E2B\u0E21\u0E39\u0E48\u0E17\u0E35\u0E48 \u0E16\u0E19\u0E19 \u0E15\u0E33\u0E1A\u0E25 \u0E2D\u0E33\u0E40\u0E20\u0E2D \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14 \u0E23\u0E2B\u0E31\u0E2A\u0E44\u0E1B\u0E23\u0E29\u0E13\u0E35\u0E22\u0E4C" })), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E0A\u0E37\u0E48\u0E2D\u0E1C\u0E39\u0E49\u0E15\u0E34\u0E14\u0E15\u0E48\u0E2D\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19"), /* @__PURE__ */ React.createElement("input", { value: form.emcontact, onChange: (e) => f("emcontact", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E09\u0E38\u0E01\u0E40\u0E09\u0E34\u0E19"), /* @__PURE__ */ React.createElement("input", { value: form.emtel, onChange: (e) => f("emtel", e.target.value) })))), /* @__PURE__ */ React.createElement("div", { style: { background: "#fff8f0", borderRadius: 8, padding: "12px 14px", border: "1.5px solid #f0d9c0" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13, color: "var(--warning)", marginBottom: 10 } }, "\u26A0\uFE0F \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E32\u0E07\u0E01\u0E32\u0E23\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E2A\u0E33\u0E04\u0E31\u0E0D"), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("div", { className: "col-2" }, /* @__PURE__ */ React.createElement("label", null, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27 / \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E42\u0E23\u0E04\u0E2A\u0E33\u0E04\u0E31\u0E0D"), /* @__PURE__ */ React.createElement("textarea", { value: form.chronic, onChange: (e) => f("chronic", e.target.value), rows: 2, placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E40\u0E1A\u0E32\u0E2B\u0E27\u0E32\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E14\u0E31\u0E19 \u0E42\u0E23\u0E04\u0E2B\u0E31\u0E27\u0E43\u0E08 \u0E2B\u0E2D\u0E1A\u0E2B\u0E37\u0E14 \u0E2F\u0E25\u0E2F" })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E1C\u0E48\u0E32\u0E15\u0E31\u0E14"), /* @__PURE__ */ React.createElement("textarea", { value: form.surgery || "", onChange: (e) => f("surgery", e.target.value), rows: 2, placeholder: "\u0E1C\u0E48\u0E32\u0E15\u0E31\u0E14\u0E2D\u0E30\u0E44\u0E23 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E2B\u0E23\u0E48" }))), /* @__PURE__ */ React.createElement("div", { className: "row mt-2" }, /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", { style: { color: "var(--danger)" } }, "\u{1F6AB} \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E41\u0E1E\u0E49\u0E22\u0E32 / \u0E41\u0E1E\u0E49\u0E2D\u0E32\u0E2B\u0E32\u0E23 (\u0E23\u0E30\u0E1A\u0E38\u0E0A\u0E37\u0E48\u0E2D\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E01\u0E32\u0E23)"), /* @__PURE__ */ React.createElement("input", { value: form.allergy, onChange: (e) => f("allergy", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 \u0E41\u0E1E\u0E49 Penicillin \u0E21\u0E35\u0E1C\u0E37\u0E48\u0E19, \u0E41\u0E1E\u0E49\u0E2D\u0E32\u0E2B\u0E32\u0E23\u0E17\u0E30\u0E40\u0E25", style: { borderColor: form.allergy && form.allergy !== "-" ? "var(--danger)" : "" } })), /* @__PURE__ */ React.createElement("div", { className: "col-1" }, /* @__PURE__ */ React.createElement("label", null, "\u0E22\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1B\u0E23\u0E30\u0E08\u0E33"), /* @__PURE__ */ React.createElement("input", { value: form.currentmed, onChange: (e) => f("currentmed", e.target.value), placeholder: "\u0E40\u0E0A\u0E48\u0E19 Metformin 500mg 1x1 pc, Amlodipine 5mg 1x1 hs" })))));
}
function PatientDetail({ pat, visits, onBack, patients, savePatient, treatmentServices }) {
  const [tab, setTab] = useState("info");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...pat });
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: 14 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onBack }, "\u2190 \u0E01\u0E25\u0E31\u0E1A"), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--primary)" } }, pat.prefix, pat.fname, " ", pat.lname), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary)", color: "#fff", borderRadius: 20, padding: "3px 14px", fontSize: 12, fontWeight: 700 } }, "HN: ", pat.hn), pat.allergy && pat.allergy !== "-" && /* @__PURE__ */ React.createElement("div", { style: { background: "var(--danger-pale)", color: "var(--danger)", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32: ", pat.allergy)), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 14 } }, ["info", "visits"].map((t) => /* @__PURE__ */ React.createElement("button", { key: t, className: `btn btn-sm ${tab === t ? "btn-primary" : "btn-outline"}`, onClick: () => setTab(t) }, t === "info" ? "\u{1F464} \u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22" : "\u{1F4CB} \u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32 (" + visits.length + " \u0E04\u0E23\u0E31\u0E49\u0E07)")), tab === "info" && !editing && /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", style: { marginLeft: "auto" }, onClick: () => doPrint(`patient-info-${pat.hn}`, "\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19 " + pat.prefix + pat.fname + " " + pat.lname) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), tab === "info" && /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-accent", style: { marginLeft: tab === "info" && !editing ? 0 : "auto" }, onClick: () => editing ? save() : setEditing(true) }, editing ? "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01" : "\u270F\uFE0F \u0E41\u0E01\u0E49\u0E44\u0E02\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), tab === "info" && (editing ? /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement(PatientForm, { form, setForm }), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 12 } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => setEditing(false) }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", style: { marginLeft: 8 }, onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01"))) : /* @__PURE__ */ React.createElement("div", { className: "card", id: `patient-info-${pat.hn}` }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 } }, "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E27\u0E0A\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 } }, [["HN", pat.hn], ["\u0E0A\u0E37\u0E48\u0E2D-\u0E19\u0E32\u0E21\u0E2A\u0E01\u0E38\u0E25", pat.prefix + pat.fname + " " + pat.lname], ["\u0E40\u0E1E\u0E28", pat.gender], ["\u0E2D\u0E32\u0E22\u0E38", age(pat.dob)], ["\u0E27\u0E31\u0E19\u0E40\u0E01\u0E34\u0E14", thaiDate(pat.dob)], ["\u0E2B\u0E21\u0E39\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E14", pat.bloodtype || "-"], ["\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E1B\u0E23\u0E30\u0E0A\u0E32\u0E0A\u0E19", pat.idcard || "-"], ["\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23", pat.tel || "-"], ["\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48", pat.address || "-"], ["\u0E2D\u0E32\u0E0A\u0E35\u0E1E", pat.occupation || "-"]].map(([k, v]) => /* @__PURE__ */ React.createElement("div", { key: k, style: { padding: "5px 0", borderBottom: "1px solid var(--gray-light)" } }, /* @__PURE__ */ React.createElement("span", { className: "text-gray" }, k, ": "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, v)))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--danger)", fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32/\u0E2D\u0E32\u0E2B\u0E32\u0E23: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: pat.allergy && pat.allergy !== "-" ? "var(--danger)" : "var(--gray)" } }, pat.allergy || "-")), /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0" } }, /* @__PURE__ */ React.createElement("span", { style: { color: "var(--warning)", fontWeight: 700 } }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.chronic || "-")), /* @__PURE__ */ React.createElement("div", { style: { padding: "5px 0", gridColumn: "1/-1" } }, /* @__PURE__ */ React.createElement("span", { className: "text-gray" }, "\u0E22\u0E32\u0E1B\u0E23\u0E30\u0E08\u0E33: "), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.currentmed || "-"))))), tab === "visits" && /* @__PURE__ */ React.createElement("div", null, visits.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "card", style: { textAlign: "center", color: "var(--gray)", padding: 30 } }, "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E21\u0E35\u0E1B\u0E23\u0E30\u0E27\u0E31\u0E15\u0E34\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32"), visits.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "card", style: { marginBottom: 12 }, id: `visit-card-${v.id}` }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700, color: "var(--primary)", fontSize: 14 } }, "Visit: ", v.id), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 10, color: "var(--gray)", fontSize: 13 } }, thaiDate(v.date))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint(`visit-card-${v.id}`, "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 Visit " + v.id) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C")), /* @__PURE__ */ React.createElement(VisitRecord, { v, pat, readOnly: true, treatmentServices })))));
}
function ExaminePage({ patients, visits, saveVisit, nextVID, getPatient, getVisitsForHN, setCertModal, setReceiptModal, setAppointModal, medicines, patchMedicineStock, treatmentServices, receipts, saveReceipt, nextRID }) {
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
  const loadPatient = (p) => {
    setSearchResults([]);
    setPat(p);
    const today_ = today();
    const existing = visits.find((v) => v.hn === p.hn && v.date === today_);
    if (existing) {
      setVform({ ...existing, drugs: existing.drugs || [], services: existing.services || [] });
    } else {
      const latest = visits.filter((v) => v.hn === p.hn).sort((a, b) => b.date.localeCompare(a.date))[0];
      setVform({
        id: nextVID(),
        hn: p.hn,
        date: today_,
        cc: (latest == null ? void 0 : latest.cc) || "",
        pi: "",
        pe: "",
        dx: "",
        tx: "",
        drugs: [],
        services: [],
        bp: (latest == null ? void 0 : latest.date) === today_ ? latest.bp : "",
        pr: (latest == null ? void 0 : latest.date) === today_ ? latest.pr : "",
        rr: (latest == null ? void 0 : latest.date) === today_ ? latest.rr : "",
        temp: (latest == null ? void 0 : latest.date) === today_ ? latest.temp : "",
        o2: (latest == null ? void 0 : latest.date) === today_ ? latest.o2 : "",
        weight: (latest == null ? void 0 : latest.date) === today_ ? latest.weight : "",
        height: (latest == null ? void 0 : latest.date) === today_ ? latest.height : "",
        nurse: (latest == null ? void 0 : latest.date) === today_ ? latest.nurse : "",
        note: ""
      });
    }
    setSaved(false);
  };
  const save = async () => {
    if (vform.drugs && vform.drugs.length > 0) {
      for (const med of medicines) {
        const ordered = vform.drugs.filter((d) => d.medId === med.id);
        if (ordered.length === 0) continue;
        const totalQty = ordered.reduce((s, d) => s + Number(d.qty), 0);
        await patchMedicineStock(med.id, Math.max(0, med.stock - totalQty));
      }
    }
    await saveVisit(vform);
    setSaved(true);
    setLastVisit(vform);
    alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27\n\n\u{1F48A} \u0E23\u0E30\u0E1A\u0E1A\u0E2B\u0E31\u0E01\u0E2A\u0E15\u0E47\u0E2D\u0E01\u0E22\u0E32\u0E08\u0E32\u0E01\u0E04\u0E25\u0E31\u0E07\u0E41\u0E25\u0E49\u0E27");
  };
  const confirmAndBill = async () => {
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
      date: today(),
      items: allItems.length > 0 ? allItems : [{ desc: "\u0E04\u0E48\u0E32\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 300, type: "service" }],
      discount: 0,
      paid: "\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14",
      status: "\u0E23\u0E2D\u0E0A\u0E33\u0E23\u0E30"
    };
    await saveReceipt(r);
    if (!saved && vform.drugs && vform.drugs.length > 0) {
      for (const med of medicines) {
        const ordered = vform.drugs.filter((d) => d.medId === med.id);
        if (ordered.length === 0) continue;
        await patchMedicineStock(med.id, Math.max(0, med.stock - ordered.reduce((s, d) => s + Number(d.qty), 0)));
      }
    }
    if (!saved) {
      await saveVisit(vform);
    }
    setSaved(true);
    setLastVisit(vform);
    alert(`\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08 ${r.id} \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22
\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21: ${r.items.reduce((s, i) => s + i.qty * i.price, 0).toLocaleString()} \u0E1A\u0E32\u0E17

\u0E44\u0E1B\u0E17\u0E35\u0E48 "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19" \u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30`);
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
  )))), pat && vform && /* @__PURE__ */ React.createElement("div", { className: "card", id: "examine-printarea" }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 14, color: "var(--primary)", marginBottom: 12 } }, "\u0E43\u0E1A\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E23\u0E31\u0E01\u0E29\u0E32"), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: "10px 24px", fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", /* @__PURE__ */ React.createElement("span", { style: { color: "var(--primary)", fontWeight: 700 } }, pat.hn)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E0A\u0E37\u0E48\u0E2D-\u0E2A\u0E01\u0E38\u0E25:"), " ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600 } }, pat.prefix, pat.fname, " ", pat.lname)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E40\u0E1E\u0E28:"), " ", pat.gender), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E2D\u0E32\u0E22\u0E38:"), " ", age(pat.dob)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48:"), " ", thaiDate(vform.date)), pat.allergy && pat.allergy !== "-" && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--danger)", fontWeight: 700 } }, "\u26A0\uFE0F \u0E41\u0E1E\u0E49\u0E22\u0E32: ", pat.allergy), pat.chronic && pat.chronic !== "-" && /* @__PURE__ */ React.createElement("div", { style: { color: "var(--warning)", fontWeight: 600 } }, "\u0E42\u0E23\u0E04\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E15\u0E31\u0E27: ", pat.chronic)), /* @__PURE__ */ React.createElement(VisitRecord, { v: vform, setV: setVform, pat, readOnly: false, medicines, treatmentServices }), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm no-print", onClick: () => doPrint("examine-printarea", "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08 " + pat.prefix + pat.fname + " " + pat.lname) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray", onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent", onClick: confirmAndBill }, "\u2705 \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08")), saved && /* @__PURE__ */ React.createElement("div", { style: { marginTop: 14, background: "var(--accent-pale)", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, color: "var(--accent)" } }, "\u2705 \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 \u2014 \u0E40\u0E25\u0E37\u0E2D\u0E01\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D:"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setCertModal({ pat, visit: vform }) }, "\u{1F4C4} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: () => setAppointModal({ pat, visit: vform }) }, "\u{1F4C5} \u0E19\u0E31\u0E14\u0E2B\u0E21\u0E32\u0E22"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-accent", onClick: () => setReceiptModal({ pat, visit: vform }) }, "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"))));
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
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "no-print" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F4C4} \u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C"), pat && /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", style: { marginLeft: "auto" }, onClick: () => doPrint("cert-doc-area", `\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C \u2014 ${pat.prefix}${pat.fname} ${pat.lname}`) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07 A4")), /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 600, fontSize: 13 } }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17:"), certTypes.map((t) => /* @__PURE__ */ React.createElement("button", { key: t.k, className: `btn btn-sm ${type === t.k ? "btn-primary" : "btn-outline"}`, onClick: () => setType(t.k) }, t.l))), /* @__PURE__ */ React.createElement("div", { className: "divider" }), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("input", { value: hn, onChange: (e) => setHn(e.target.value), placeholder: "\u0E01\u0E23\u0E2D\u0E01 HN \u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22", style: { maxWidth: 200 }, onKeyDown: (e) => e.key === "Enter" && searchPat() }), /* @__PURE__ */ React.createElement("button", { className: "btn btn-primary btn-sm", onClick: searchPat }, "\u{1F50D} \u0E14\u0E36\u0E07\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22"), pat && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, fontWeight: 600, color: "var(--accent)" } }, "\u2705 ", pat.prefix, pat.fname, " ", pat.lname, " (HN: ", pat.hn, ")")))), /* @__PURE__ */ React.createElement("div", { id: "cert-doc-area", className: "card", style: { maxWidth: 720, margin: "0 auto", padding: "28px 36px", fontFamily: "'Sarabun',sans-serif", fontSize: 14, lineHeight: 1.9, background: "#fff" } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", borderBottom: "2.5px solid #1a5276", paddingBottom: 12, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#1a5276", letterSpacing: 0.5 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, CLINIC_ADDRESS), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#555" } }, "\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C ", CLINIC_TEL, " \xA0|\xA0 \u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E34\u0E08\u0E01\u0E32\u0E23 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE)), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 17, letterSpacing: 2, marginBottom: 18 } }, type === "sick" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", type === "group5" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C", type === "driving" && "\u0E43\u0E1A\u0E23\u0E31\u0E1A\u0E23\u0E2D\u0E07\u0E41\u0E1E\u0E17\u0E22\u0E4C (\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E02\u0E31\u0E1A\u0E23\u0E16)"), type !== "driving" && /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", fontSize: 13, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("span", null, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E15\u0E23\u0E27\u0E08 "), /* @__PURE__ */ React.createElement("input", { value: CLINIC_NAME, readOnly: true, style: { width: 240, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", textAlign: "left" } }), /* @__PURE__ */ React.createElement("br", null), /* @__PURE__ */ React.createElement("span", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 "), /* @__PURE__ */ React.createElement("input", { value: certNo, onChange: (e) => setCertNo(e.target.value), placeholder: "\u2014", style: { width: 80, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", textAlign: "center" } }), /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 12 } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48 "), /* @__PURE__ */ React.createElement("input", { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value), style: { width: 150, borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px" } })), type !== "driving" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 6 } }, "\u0E02\u0E49\u0E32\u0E1E\u0E40\u0E08\u0E49\u0E32 \u0E19\u0E32\u0E22\u0E41\u0E1E\u0E17\u0E22\u0E4C/\u0E41\u0E1E\u0E17\u0E22\u0E4C\u0E2B\u0E0D\u0E34\u0E07 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, DOCTOR_NAME)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, DOCTOR_LICENSE)), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 / \u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E07\u0E32\u0E19\u0E1B\u0E23\u0E30\u0E08\u0E33 \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48", /* @__PURE__ */ React.createElement("input", { value: CLINIC_NAME + " " + CLINIC_ADDRESS, readOnly: true, style: { width: "100%", borderBottom: "1px dotted #888", border: "none", outline: "none", fontSize: 13, background: "transparent", padding: "0 4px", display: "block", marginTop: 2 } })), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", margin: "10px 0" } }), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 4 } }, "\u0E44\u0E14\u0E49\u0E15\u0E23\u0E27\u0E08\u0E23\u0E48\u0E32\u0E07\u0E01\u0E32\u0E22 \u0E19\u0E32\u0E22/\u0E19\u0E32\u0E07/\u0E19\u0E32\u0E07\u0E2A\u0E32\u0E27", /* @__PURE__ */ React.createElement(
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
function ReceiptPage({ receipts, saveReceipt, patients, visits, nextRID, getPatient, medicines, patchMedicineStock }) {
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [newForm, setNewForm] = useState(null);
  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    const pat = getPatient(r.hn);
    const nameMatch = ((pat == null ? void 0 : pat.fname) + " " + (pat == null ? void 0 : pat.lname)).toLowerCase().includes(q) || r.hn.includes(q) || r.id.toLowerCase().includes(q);
    const dateMatch = (!filterFrom || r.date >= filterFrom) && (!filterTo || r.date <= filterTo);
    return nameMatch && dateMatch;
  });
  const totalFiltered = filtered.reduce((s, r) => s + r.items.reduce((t, i) => t + i.qty * i.price, 0) - r.discount, 0);
  const [detail, setDetail] = useState(null);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontWeight: 700, fontSize: 18, color: "var(--primary)" } }, "\u{1F9FE} \u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19"), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "list" ? "btn-primary" : "btn-outline"}`, onClick: () => setTab("list") }, "\u{1F4CB} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("button", { className: `btn btn-sm ${tab === "summary" ? "btn-primary" : "btn-outline"}`, onClick: () => setTab("summary") }, "\u{1F4CA} \u0E2A\u0E23\u0E38\u0E1B\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A"))), tab === "list" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card", style: { marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E04\u0E49\u0E19\u0E2B\u0E32"), /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "HN / \u0E0A\u0E37\u0E48\u0E2D / \u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08", style: { width: 220 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E15\u0E31\u0E49\u0E07\u0E41\u0E15\u0E48\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: filterFrom, onChange: (e) => setFilterFrom(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", null, "\u0E16\u0E36\u0E07\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("input", { type: "date", value: filterTo, onChange: (e) => setFilterTo(e.target.value), style: { width: 160 } })), /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => {
    setSearch("");
    setFilterFrom("");
    setFilterTo("");
  } }, "\u0E25\u0E49\u0E32\u0E07")), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, fontSize: 13, color: "var(--accent)", fontWeight: 600 } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E41\u0E2A\u0E14\u0E07: ", filtered.length, " \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 | \u0E23\u0E27\u0E21\u0E23\u0E32\u0E22\u0E23\u0E31\u0E1A: ", /* @__PURE__ */ React.createElement("span", { style: { fontSize: 15 } }, totalFiltered.toLocaleString()), " \u0E1A\u0E32\u0E17")), detail ? /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: () => setDetail(null), style: { marginBottom: 12 } }, "\u2190 \u0E01\u0E25\u0E31\u0E1A\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement(ReceiptDoc, { r: detail, pat: getPatient(detail.hn) })) : /* @__PURE__ */ React.createElement("div", { className: "card", style: { padding: 0, overflow: "hidden" } }, /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 13 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E40\u0E25\u0E02\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "HN / \u0E0A\u0E37\u0E48\u0E2D"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "right" } }, "\u0E22\u0E2D\u0E14\u0E23\u0E27\u0E21 (\u0E1A.)"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E0A\u0E33\u0E23\u0E30\u0E42\u0E14\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px", textAlign: "left" } }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"), /* @__PURE__ */ React.createElement("th", { style: { padding: "9px 14px" } }))), /* @__PURE__ */ React.createElement("tbody", null, filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 7, style: { padding: 20, textAlign: "center", color: "var(--gray)" } }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), filtered.map((r, i) => {
    const total = r.items.reduce((s, it) => s + it.qty * it.price, 0) - r.discount;
    const pat = getPatient(r.hn);
    return /* @__PURE__ */ React.createElement("tr", { key: r.id, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", fontWeight: 700, color: "var(--primary)" } }, r.id), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 600 } }, "HN ", r.hn), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, pat == null ? void 0 : pat.prefix, pat == null ? void 0 : pat.fname, " ", pat == null ? void 0 : pat.lname)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, thaiDate(r.date)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px", textAlign: "right", fontWeight: 700 } }, total.toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, r.paid), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("span", { className: `tag ${r.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "tag-green" : "tag-orange"}` }, r.status)), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 14px" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-outline btn-sm", onClick: () => setDetail(r) }, "\u0E14\u0E39/\u0E1E\u0E34\u0E21\u0E1E\u0E4C")));
  }))))), tab === "summary" && /* @__PURE__ */ React.createElement(ReceiptSummary, { receipts }));
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
function ReceiptDoc({ r, pat }) {
  const total = r.items.reduce((s, i) => s + i.qty * i.price, 0);
  const net = total - r.discount;
  const docId = `receipt-doc-${r.id}`;
  const svcItems = r.items.filter((i) => i.type !== "drug");
  const drugItems = r.items.filter((i) => i.type === "drug");
  return /* @__PURE__ */ React.createElement("div", { className: "card", id: docId }, /* @__PURE__ */ React.createElement(ClinicHeader, null), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", fontWeight: 700, fontSize: 15, color: "var(--primary)", margin: "6px 0 2px" } }, "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 / Receipt"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--gray)", marginBottom: 8 } }, /* @__PURE__ */ React.createElement("div", null, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48: ", /* @__PURE__ */ React.createElement("b", { style: { color: "var(--primary)" } }, r.id)), /* @__PURE__ */ React.createElement("div", null, "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48: ", /* @__PURE__ */ React.createElement("b", null, thaiDate(r.date)))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--gray-pale)", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 13 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E1C\u0E39\u0E49\u0E23\u0E31\u0E1A\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23:"), " ", pat == null ? void 0 : pat.prefix, pat == null ? void 0 : pat.fname, " ", pat == null ? void 0 : pat.lname), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", r.hn, " ", /* @__PURE__ */ React.createElement("span", { style: { marginLeft: 16 } }, /* @__PURE__ */ React.createElement("b", null, "Visit:"), " ", r.visitId))), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "center", width: 55 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "left", width: 50 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "right", width: 80 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "7px 10px", textAlign: "right", width: 80 } }, "\u0E23\u0E27\u0E21"))), /* @__PURE__ */ React.createElement("tbody", null, svcItems.length > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "5px 10px", background: "#e8f8f0", fontWeight: 700, fontSize: 11, color: "#1e8449" } }, "\u{1F3E5} \u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23 / \u0E04\u0E48\u0E32\u0E1A\u0E23\u0E34\u0E01\u0E32\u0E23")), svcItems.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "s" + i, style: { background: "#f4fbf7" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()))), drugItems.length > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 5, style: { padding: "5px 10px", background: "#f0f6ff", fontWeight: 700, fontSize: 11, color: "#1a5276" } }, "\u{1F48A} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E32")), drugItems.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "d" + i, style: { background: i % 2 === 0 ? "#f5faff" : "#eef5ff" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()))), r.items.filter((i) => !i.type).map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: "l" + i, style: { background: i % 2 === 0 ? "#fff" : "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.desc), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "center" } }, it.qty), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px" } }, it.unit), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right" } }, (it.price || 0).toLocaleString()), /* @__PURE__ */ React.createElement("td", { style: { padding: "6px 10px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString())))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--gray-pale)" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "7px 10px", textAlign: "right", fontWeight: 600 } }, "\u0E23\u0E27\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E2B\u0E31\u0E01"), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", fontWeight: 600 } }, total.toLocaleString())), r.discount > 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "7px 10px", textAlign: "right", color: "var(--danger)" } }, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14"), /* @__PURE__ */ React.createElement("td", { style: { padding: "7px 10px", textAlign: "right", color: "var(--danger)" } }, "-", r.discount.toLocaleString())), /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("td", { colSpan: 4, style: { padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 14 } }, "\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34 (\u0E1A\u0E32\u0E17)"), /* @__PURE__ */ React.createElement("td", { style: { padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 14 } }, net.toLocaleString())))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 14 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E0A\u0E33\u0E23\u0E30\u0E42\u0E14\u0E22:"), " ", r.paid), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: `tag ${r.status === "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" ? "tag-green" : "tag-orange"}` }, r.status))), /* @__PURE__ */ React.createElement("div", { style: { borderTop: "1px dashed #ccc", paddingTop: 10, fontSize: 11, color: "var(--gray)", textAlign: "center" } }, CLINIC_NAME, " \u2014 ", CLINIC_ADDRESS, " \u2014 \u0E42\u0E17\u0E23. ", CLINIC_TEL), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginTop: 14 }, className: "no-print" }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-print btn-sm", onClick: () => doPrint(docId, "\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 " + r.id) }, "\u{1F5A8}\uFE0F \u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08")));
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
  const [paid, setPaid] = useState("\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14");
  const addItem = () => setItems((prev) => [...prev, { desc: "", qty: 1, unit: "\u0E04\u0E23\u0E31\u0E49\u0E07", price: 0, type: "service" }]);
  const updItem = (i, k, v) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: k === "qty" || k === "price" ? Number(v) : v } : it));
  const rmItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const total = items.reduce((s, it) => s + it.qty * it.price, 0) - Number(discount);
  const save = async () => {
    const r = { id: nextRID(), hn: pat.hn, visitId: (visit == null ? void 0 : visit.id) || "", patname: pat.prefix + pat.fname + " " + pat.lname, date: today(), items, discount: Number(discount), paid, status: "\u0E0A\u0E33\u0E23\u0E30\u0E41\u0E25\u0E49\u0E27" };
    await saveReceipt(r);
    for (const it of items) {
      if (it.type === "drug") {
        const med = it.medId ? medicines.find((m) => m.id === it.medId) : medicines.find((m) => it.desc.includes(m.name));
        if (med) await patchMedicineStock(med.id, Math.max(0, med.stock - it.qty));
      }
    }
    alert("\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22\u0E41\u0E25\u0E49\u0E27");
    onClose();
  };
  const drugTotal = items.filter((i) => i.type === "drug").reduce((s, i) => s + i.qty * i.price, 0);
  const svcTotal = items.filter((i) => i.type !== "drug").reduce((s, i) => s + i.qty * i.price, 0);
  return /* @__PURE__ */ React.createElement(Modal, { title: "\u{1F9FE} \u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E23\u0E31\u0E1A\u0E40\u0E07\u0E34\u0E19", onClose, width: 720 }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--primary-pale)", borderRadius: 6, padding: "8px 12px", marginBottom: 12, fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("b", null, "\u0E1C\u0E39\u0E49\u0E1B\u0E48\u0E27\u0E22:"), " ", pat.prefix, pat.fname, " ", pat.lname, " \xA0|\xA0 ", /* @__PURE__ */ React.createElement("b", null, "HN:"), " ", pat.hn), visit && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "Visit: ", visit.id, " | ", thaiDate(visit.date))), (((_a = visit == null ? void 0 : visit.drugs) == null ? void 0 : _a.length) > 0 || ((_b = visit == null ? void 0 : visit.services) == null ? void 0 : _b.length) > 0) && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" } }, svcTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#e8f8f0", border: "1px solid #a8d5c8", borderRadius: 5, padding: "4px 10px", fontSize: 12, color: "#1e8449" } }, "\u{1F3E5} \u0E04\u0E48\u0E32\u0E2B\u0E31\u0E15\u0E16\u0E01\u0E32\u0E23: ", /* @__PURE__ */ React.createElement("b", null, svcTotal.toLocaleString(), "\u0E3F")), drugTotal > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: "#f0f8ff", border: "1px solid #a8c8e8", borderRadius: 5, padding: "4px 10px", fontSize: 12, color: "#1a5276" } }, "\u{1F48A} \u0E04\u0E48\u0E32\u0E22\u0E32: ", /* @__PURE__ */ React.createElement("b", null, drugTotal.toLocaleString(), "\u0E3F"))), /* @__PURE__ */ React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { style: { background: "var(--primary)", color: "#fff" } }, /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left" } }, "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 6px", textAlign: "center", width: 30 } }, "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "center", width: 60 } }, "\u0E08\u0E33\u0E19\u0E27\u0E19"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "left", width: 60 } }, "\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 90 } }, "\u0E23\u0E32\u0E04\u0E32/\u0E2B\u0E19\u0E48\u0E27\u0E22"), /* @__PURE__ */ React.createElement("th", { style: { padding: "6px 8px", textAlign: "right", width: 80 } }, "\u0E23\u0E27\u0E21"), /* @__PURE__ */ React.createElement("th", { style: { width: 28 } }))), /* @__PURE__ */ React.createElement("tbody", null, items.map((it, i) => /* @__PURE__ */ React.createElement("tr", { key: i, style: { background: it.type === "drug" ? "#f0f8ff" : i % 2 === 0 ? "#fff" : "#f8fff8" } }, /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { value: it.desc, onChange: (e) => updItem(i, "desc", e.target.value), style: { fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 4px", textAlign: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 10 } }, it.type === "drug" ? "\u{1F48A}" : "\u{1F3E5}")), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.qty, onChange: (e) => updItem(i, "qty", e.target.value), style: { textAlign: "center", fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { value: it.unit, onChange: (e) => updItem(i, "unit", e.target.value), style: { fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px" } }, /* @__PURE__ */ React.createElement("input", { type: "number", value: it.price, onChange: (e) => updItem(i, "price", e.target.value), style: { textAlign: "right", fontSize: 12 } })), /* @__PURE__ */ React.createElement("td", { style: { padding: "4px 6px", textAlign: "right", fontWeight: 600 } }, (it.qty * it.price).toLocaleString()), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("button", { onClick: () => rmItem(i), style: { background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 14 } }, "\u2715")))))), /* @__PURE__ */ React.createElement("button", { className: "btn btn-sm btn-outline", onClick: addItem }, "+ \u0E40\u0E1E\u0E34\u0E48\u0E21\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center", marginTop: 10, fontSize: 13, flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", null, "\u0E2A\u0E48\u0E27\u0E19\u0E25\u0E14: ", /* @__PURE__ */ React.createElement("input", { type: "number", value: discount, onChange: (e) => setDiscount(e.target.value), style: { width: 80, fontSize: 12 } })), /* @__PURE__ */ React.createElement("div", null, "\u0E0A\u0E33\u0E23\u0E30\u0E42\u0E14\u0E22: ", /* @__PURE__ */ React.createElement("select", { value: paid, onChange: (e) => setPaid(e.target.value), style: { fontSize: 12, width: 120 } }, ["\u0E40\u0E07\u0E34\u0E19\u0E2A\u0E14", "\u0E42\u0E2D\u0E19\u0E40\u0E07\u0E34\u0E19", "\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15", "\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E14\u0E1A\u0E34\u0E15", "QR Code", "\u0E2D\u0E37\u0E48\u0E19\u0E46"].map((o) => /* @__PURE__ */ React.createElement("option", { key: o }, o)))), /* @__PURE__ */ React.createElement("div", { style: { marginLeft: "auto", fontWeight: 700, fontSize: 16, color: "var(--accent)" } }, "\u0E22\u0E2D\u0E14\u0E2A\u0E38\u0E17\u0E18\u0E34: ", total.toLocaleString(), " \u0E1A\u0E32\u0E17")), /* @__PURE__ */ React.createElement("div", { style: { textAlign: "right", marginTop: 14, display: "flex", gap: 10, justifyContent: "flex-end" } }, /* @__PURE__ */ React.createElement("button", { className: "btn btn-gray btn-sm", onClick: onClose }, "\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /* @__PURE__ */ React.createElement("button", { className: "btn btn-accent btn-sm", onClick: save }, "\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E41\u0E25\u0E30\u0E2D\u0E2D\u0E01\u0E43\u0E1A\u0E40\u0E2A\u0E23\u0E47\u0E08")));
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
  return /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", marginBottom: 10, paddingBottom: 10, borderBottom: "2px solid var(--primary)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--primary)", letterSpacing: 0.5 } }, CLINIC_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)", marginTop: 2 } }, CLINIC_ADDRESS), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--gray)" } }, "\u0E42\u0E17\u0E23. ", CLINIC_TEL));
}
function DoctorSignature() {
  return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: 24 } }, /* @__PURE__ */ React.createElement("div", { style: { textAlign: "center", minWidth: 220 } }, /* @__PURE__ */ React.createElement("div", { style: { borderBottom: "1px solid #999", marginBottom: 4, height: 40 } }), /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 13 } }, DOCTOR_NAME), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, DOCTOR_TITLE), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--gray)" } }, "\u0E43\u0E1A\u0E2D\u0E19\u0E38\u0E0D\u0E32\u0E15\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E27\u0E34\u0E0A\u0E32\u0E0A\u0E35\u0E1E\u0E40\u0E27\u0E0A\u0E01\u0E23\u0E23\u0E21 \u0E40\u0E25\u0E02\u0E17\u0E35\u0E48 ", DOCTOR_LICENSE)));
}
function Modal({ title, onClose, children, width = 600 }) {
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1e3, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }, onClick: (e) => {
    if (e.target === e.currentTarget) onClose();
  } }, /* @__PURE__ */ React.createElement("div", { style: { background: "#fff", borderRadius: "12px", boxShadow: "0 8px 40px rgba(0,0,0,0.25)", width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", padding: 24, position: "relative" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700, fontSize: 15, color: "var(--primary)" } }, title), /* @__PURE__ */ React.createElement("button", { onClick: onClose, style: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--gray)", lineHeight: 1 } }, "\xD7")), children));
}
