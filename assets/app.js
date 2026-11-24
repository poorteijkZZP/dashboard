var MONTHS = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
var ADMINS = ['Jeroen','Gea','Marco','Yassir'];
var KENM = [['pers','Personenauto'],['best','Bestelauto'],['km','KM-registratie'],['uzgb','Verklaring UZGB'],['motor','Motor'],['fiets','Fiets']];
var KSHORT = { pers:'Personenauto', best:'Bestelauto', km:'KM', uzgb:'UZGB', motor:'Motor', fiets:'Fiets' };
var FACT = { 'ZZP basis':250, 'ZZP plus':250, 'BV holding':150, 'BV werkmaatschappij':250 };
var JAAR = (window.APP_CONFIG && window.APP_CONFIG.jaar) || 2026;
var DEMO_KEY = 'poorteijk-dashboard-demo-v1';
var DEMO_INST = 'poorteijk-dashboard-demo-v1-inst';
// Onthoud per tabblad waar je was, zodat verversen je niet terugstuurt naar de startpagina
var UI_KEY = 'pz-ui', UI_VELDEN = ['page', 'scope', 'bankF', 'adminF', 'sort', 'filter', 'q', 'sel', 'tab', 'bsub', 'werkWie', 'role', 'openQ', 'jwF', 'jwWie'];
function uiLaden() { try { return JSON.parse(sessionStorage.getItem(UI_KEY) || '{}') || {}; } catch (x) { return {}; } }
var VANDAAG = new Date();
var PEIL_HANDMATIG = null;
function vj() { return JAAR - 1; }
function peil() {
  if (PEIL_HANDMATIG !== null && PEIL_HANDMATIG !== undefined && PEIL_HANDMATIG !== '' && !isNaN(parseInt(PEIL_HANDMATIG, 10))) return parseInt(PEIL_HANDMATIG, 10);
  var n = (VANDAAG.getFullYear() - JAAR) * 12 + VANDAAG.getMonth();
  return Math.max(0, Math.min(12, n));
}
function peilLabel() { var p = peil(); return p ? 't/m ' + MONTHS[p - 1] : 'nog geen maand'; }
function btwDeadline(q) { return new Date(JAAR + (q === 3 ? 1 : 0), (q * 3 + 3) % 12, q === 0 ? 30 : 31, 23, 59); }
function kwartaalVoorbij(q) { return VANDAAG >= new Date(JAAR, q * 3 + 3, 1); }
function btwDlLabel(q) { var d = btwDeadline(q); return 'uiterlijk ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (q === 3 ? ' ' + d.getFullYear() : ''); }
function dagenTot(d) { return Math.ceil((d - VANDAAG) / 86400000); }
function wk(c, key) { return !!(c.wacht && c.wacht[key]); }
function vandaagIso() { var d = VANDAAG; return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function slug(t) { return String(t).replace(/[^A-Za-z0-9\u00C0-\u017F ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function vanLabel(c) { return c.vanY ? c.vanY + (c.vanQ != null && c.vanQ !== '' && !isNaN(c.vanQ) ? ' Q' + (parseInt(c.vanQ, 10) + 1) : '') : 'onbekend'; }
var COLS = [['naam','Naam onderneming'],['voornaam','Voornaam'],['achternaam','Achternaam'],['email','E-mailadres'],['btwnr','Btw-nummer'],['btwid','Btw-ID'],['admin','Administrateur'],['rechtsvorm','Rechtsvorm'],['bank','Bank'],['software','Boekhoudpakket']];

function nowLabel() { var d = new Date(); var p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); }
function nlDate(s) { if (!s) return ''; var a = s.split('-'); return parseInt(a[2], 10) + ' ' + MONTHS[parseInt(a[1], 10) - 1] + ' ' + a[0]; }
var INIT = { Jeroen:'JB', Gea:'GW', Marco:'MK', Yassir:'YO' };
function initial(n) { return INIT[n] || (n || '?').slice(0, 2).toUpperCase(); }
var M2 = ['JA','FE','MR','AP','ME','JN','JL','AU','SE','OK','NO','DE'];
var BTWM = false; // btw per maand: alleen als label bij de klant, geen aparte afvinklogica
// Lopend kwartaal: feb t/m apr = Q1, mei t/m jul = Q2, aug t/m okt = Q3, nov t/m jan = Q4
function winQ() { var n = (VANDAAG.getFullYear() - JAAR) * 12 + VANDAAG.getMonth() - 1; return Math.max(0, Math.min(3, Math.floor(n / 3))); }
var CTRL = ['cq1', 'cq2', 'cq3'];
function emptyForm() {
  return { naam:'', admin:'Jeroen', pakket:'ZZP basis', facturen:'250', vanY:String(new Date().getFullYear()), vanQ:String(Math.floor(new Date().getMonth() / 3)), freq:'maand', bank:'BK', software:'AFAS SB', up:true, rechtsvorm:'Eenmanszaak', regime:'Normaal', pand:'', btwMaand:false, pers:false, best:false, km:false, uzgb:false, motor:false, fiets:false, review:false, voornaam:'', achternaam:'', email:'', btwnr:'', btwid:'', bijz:'' };
}
function C(o) {
  var c = Object.assign({ status:'Actief', freq:'maand', software:'AFAS SB', up:true, rechtsvorm:'Eenmanszaak', regime:'Normaal', pand:'', btwMaand:false, pers:false, best:false, km:false, uzgb:false, motor:false, fiets:false, bijz:'', notities:'', m:9, btw:[1,1,0,0], cq1:1, cq2:1, cq3:0, c25:1, jw25:1, ib25:0, j25na:false, pakket:'ZZP plus', facturen:'', review:false, btwnr:'', btwid:'', vanY:2022, vanQ:0, einde:null, log:[] }, o);
  var ms = [];
  for (var i = 0; i < 12; i++) ms.push(i < c.m);
  c.months = ms;
  c.btw = c.btw.map(function (x) { return !!x; });
  var bmIdx = o.btwm || []; c.btwm = []; for (var b = 0; b < 12; b++) c.btwm.push(bmIdx.indexOf(b) >= 0);
  c.vanY = parseInt(c.vanY, 10); c.vanQ = parseInt(c.vanQ, 10);
  if (!c.btwid && c.btwnr) c.btwid = c.btwnr.replace('NL0000', 'NL0040').replace('B01', 'B23');
  if (FACT[c.pakket]) c.facturen = FACT[c.pakket];
  return c;
}
var SEED = [
  C({ id:1, naam:'Van Dijk Timmerwerken', admin:'Jeroen', bank:'BK', best:true, uzgb:true, bijz:'Investering cirkelzaag in mei: KIA meenemen bij jaarwerk.', ib25:1, voornaam:'Ruben', achternaam:'van Dijk', email:'ruben@voorbeeldmail.nl', btwnr:'NL000000011B01', facturen:250, review:true, vanY:2021, vanQ:1,
     log:[{wie:'Jeroen', wat:'sep afgevinkt', wanneer:'8 okt 2026 10:14'}, {wie:'Jeroen', wat:'IB 2025 afgevinkt', wanneer:'22 sep 2026 15:40'}] }),
  C({ id:2, naam:'Studio Lindeboom', admin:'Gea', bank:'BK', m:8, bijz:'Alle klantontvangsten lopen via Mollie: boeken op tussenrekening. Per kwartaal omzetoverzicht Mollie opvragen.', notities:'Lotte is tot eind oktober op vakantie, sep daarna oppakken. (Gea)', voornaam:'Lotte', achternaam:'Lindeboom', email:'lotte@voorbeeldmail.nl', btwnr:'NL000000022B01', pakket:'ZZP basis', facturen:120, vanY:2023, vanQ:0,
     log:[{wie:'Gea', wat:'aug afgevinkt', wanneer:'30 sep 2026 11:02'}] }),
  C({ id:3, naam:'Kraan Installatietechniek', admin:'Marco', bank:'camt.053', rechtsvorm:'Werkmaatschappij BV', btwMaand:true, pers:true, best:true, km:true, pand:'Koop', btw:[1,1,1,0], btwm:[9], cq3:1, ib25:1, bijz:'Arbeid en materialen altijd op aparte omzetrekeningen boeken.', voornaam:'Mark', achternaam:'Kraan', email:'mark@voorbeeldmail.nl', btwnr:'NL000000033B01', pakket:'BV werkmaatschappij', facturen:600, review:true, vanY:2019, vanQ:2,
     log:[{wie:'Marco', wat:'Btw Q3 afgevinkt', wanneer:'10 okt 2026 14:20'}] }),
  C({ id:4, naam:'Verbeek IT Consultancy', admin:'Jeroen', bank:'camt.053', freq:'kwartaal', m:6, pers:true, km:true, rechtsvorm:'Holding BV', software:'Trifact/Profit', up:false, jw25:0, ib25:0, voornaam:'Sander', achternaam:'Verbeek', email:'sander@voorbeeldmail.nl', btwnr:'NL000000044B01', pakket:'Prijsafspraak', facturen:24, vanY:2020, vanQ:0,
     log:[{wie:'Jeroen', wat:'apr afgevinkt (Q2)', wanneer:'20 jul 2026 08:55'}] }),
  C({ id:5, naam:'Groen & Zo Hoveniers', admin:'Yassir', bank:'BK', best:true, km:true, m:6, btw:[1,0,0,0], cq2:0, bijz:'Pas aan het eind van de maand aanschrijven, eerder reageert hij niet.', voornaam:'Bas', achternaam:'Groen', email:'bas@voorbeeldmail.nl', btwnr:'NL000000055B01', pakket:'ZZP basis', facturen:90, vanY:2022, vanQ:2,
     log:[{wie:'Marco', wat:'jun afgevinkt', wanneer:'12 aug 2026 16:45'}] }),
  C({ id:6, naam:'Fysiotherapie Mertens', admin:'Gea', bank:'BK', freq:'kwartaal', m:7, up:false, fiets:true, pand:'Huur', regime:'Vrijgesteld', btw:[0,0,0,0], cq2:1, cq3:1, bijz:'Btw-vrijgesteld (medisch). Jaarlijks checken of er belaste omzet is.', voornaam:'Eva', achternaam:'Mertens', email:'eva@voorbeeldmail.nl', btwnr:'NL000000066B01', pakket:'ZZP basis', facturen:400, review:true, vanY:2024, vanQ:1,
     log:[{wie:'Gea', wat:'jul afgevinkt (Q3)', wanneer:'7 okt 2026 13:12'}] }),
  C({ id:7, naam:'Schildersbedrijf Kok', admin:'Marco', bank:'MT940', rechtsvorm:'VOF', best:true, uzgb:true, bijz:'VOF: ook IB-aangifte van de vennoot via ons.', voornaam:'Tim', achternaam:'Kok', email:'tim@voorbeeldmail.nl', btwnr:'NL000000077B01', facturen:180, review:true, vanY:2018, vanQ:0,
     log:[{wie:'Marco', wat:'sep afgevinkt', wanneer:'9 okt 2026 10:03'}] }),
  C({ id:8, naam:'Atelier Noor', admin:'Jeroen', bank:'geen', freq:'kwartaal', m:6, up:false, regime:'KOR', btw:[0,0,0,0], cq2:1, bijz:'KOR sinds 2025: omzetgrens in de gaten houden.', voornaam:'Noor', achternaam:'Hendriks', email:'noor@voorbeeldmail.nl', btwnr:'NL000000088B01', pakket:'ZZP basis', facturen:30, vanY:2025, vanQ:0, ib25:1,
     log:[{wie:'Jeroen', wat:'apr afgevinkt (Q2)', wanneer:'3 aug 2026 15:27'}] }),
  C({ id:9, naam:'De Wit Klusservice', admin:'Gea', bank:'BK', best:true, motor:true, notities:'Partner Anja belt regelmatig namens hem en mag informatie ontvangen. (Jeroen)', voornaam:'Kees', achternaam:'de Wit', email:'kees@voorbeeldmail.nl', btwnr:'NL000000099B01', facturen:140, vanY:2023, vanQ:2,
     log:[{wie:'Gea', wat:'sep afgevinkt', wanneer:'10 okt 2026 09:44'}] }),
  C({ id:10, naam:'Bouwadvies Smit', admin:'Yassir', bank:'MT940', freq:'kwartaal', m:6, up:false, pers:true, rechtsvorm:'Holding BV', pakket:'BV holding', voornaam:'Iris', achternaam:'Smit', email:'iris@voorbeeldmail.nl', btwnr:'NL000000101B01', facturen:150, vanY:2021, vanQ:3,
     log:[{wie:'Marco', wat:'apr afgevinkt (Q2)', wanneer:'18 jul 2026 12:10'}] }),
  C({ id:11, naam:'Koeriersdienst Yildiz', admin:'Marco', bank:'geen', btwMaand:true, best:true, km:true, m:7, bijz:'Brandstofbonnen per maand laten aanleveren. Bankafschriften als PDF opvragen.', voornaam:'Emre', achternaam:'Yildiz', email:'emre@voorbeeldmail.nl', btwnr:'NL000000112B01', pakket:'ZZP basis', facturen:60, vanY:2024, vanQ:0,
     log:[{wie:'Marco', wat:'jul afgevinkt', wanneer:'2 okt 2026 11:30'}] }),
  C({ id:12, naam:'Klusbedrijf Bakker', admin:'Jeroen', bank:'camt.053', best:true, uzgb:true, ib25:1, status:'Opgezegd', einde:{ datum:'31 dec 2026', reden:'Omgezet naar BV', adm:11, btw:3, jw26:true, ib26:true }, voornaam:'Joost', achternaam:'Bakker', email:'joost@voorbeeldmail.nl', btwnr:'NL000000123B01', facturen:210, vanY:2022, vanQ:1,
     log:[{wie:'Jeroen', wat:'Opgezegd per 31 dec 2026 (Omgezet naar BV)', wanneer:'1 okt 2026 09:00'}] }),
  C({ id:13, naam:'Hair & Beauty Sanne', admin:'Gea', bank:'BK', freq:'kwartaal', m:6, up:false, pand:'Huur', ib25:0, voornaam:'Sanne', achternaam:'Visser', email:'sanne@voorbeeldmail.nl', btwnr:'NL000000145B01', pakket:'ZZP basis', facturen:80, vanY:2025, vanQ:2,
     log:[{wie:'Gea', wat:'Btw Q2 afgevinkt', wanneer:'25 jul 2026 14:05'}] }),
  C({ id:14, naam:'Fotografie Jansen', admin:'Jeroen', bank:'BK', status:'Gestopt', m:6, einde:{ datum:'30 jun 2026', reden:'In loondienst', adm:5, btw:1, jw26:false, ib26:false }, ib25:1, voornaam:'Fleur', achternaam:'Jansen', email:'fleur@voorbeeldmail.nl', btwnr:'NL000000134B01', pakket:'ZZP basis', facturen:50, vanY:2020, vanQ:0,
     log:[{wie:'Jeroen', wat:'Definitief afgesloten', wanneer:'20 jul 2026 09:15'}] })
];


function demoLoad() { try { var x = localStorage.getItem(DEMO_KEY); if (x) return JSON.parse(x); } catch (e) {} return SEED; }
function sIdx(c) { return !c.vanY || c.vanQ == null || c.vanQ === '' || isNaN(c.vanQ) || parseInt(c.vanY, 10) < JAAR ? 0 : (parseInt(c.vanY, 10) === JAAR ? parseInt(c.vanQ, 10) * 3 : 12); }
function mNa(c, i) { return (!!c.mna && c.mna[i]) || i < sIdx(c) || (!!c.einde && i > c.einde.adm) || (c.freq === 'kwartaal' && i % 3 !== 0); }
function btwNa(c, q) { return (!!c.bna && c.bna[q]) || c.regime !== 'Normaal' || (q * 3 + 2) < sIdx(c) || (!!c.einde && q > c.einde.btw); }
function lopend(c) { return c.status !== 'Gestopt'; }
function mLate(c, i) {
  if (!lopend(c) || mNa(c, i) || c.months[i] || wk(c, 'm' + (i + 1))) return false;
  return c.freq === 'kwartaal' ? i + 3 <= peil() : i < peil();
}
function mDue(c, i) { return lopend(c) && c.freq === 'kwartaal' && !mNa(c, i) && !c.months[i] && !wk(c, 'm' + (i + 1)) && !mLate(c, i) && kwartaalVoorbij(Math.floor(i / 3)); }
// btw per maand: de maanden worden afgevinkt, het kwartaal volgt daaruit (een al gedaan kwartaal telt als drie gedane maanden)
function bmOn(c, i) { return !!(c.btwm && c.btwm[i]) || !!c.btw[Math.floor(i / 3)]; }
function bmNa(c, i) { return btwNa(c, Math.floor(i / 3)) || i < sIdx(c); }
function bmDeadline(i) { return new Date(JAAR, i + 2, 0, 23, 59); }
function bmDlLabel(i) { var d = bmDeadline(i); return 'uiterlijk ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (i === 11 ? ' ' + d.getFullYear() : ''); }
function maandVoorbij(i) { return VANDAAG >= new Date(JAAR, i + 1, 1); }
function bmLate(c, i) { return lopend(c) && !bmNa(c, i) && !bmOn(c, i) && !wk(c, 'bm' + (i + 1)) && VANDAAG > bmDeadline(i); }
function bmDue(c, i) { return lopend(c) && !bmNa(c, i) && !bmOn(c, i) && !wk(c, 'bm' + (i + 1)) && maandVoorbij(i) && !bmLate(c, i); }
function bmWacht(c, i) { return !bmOn(c, i) && wk(c, 'bm' + (i + 1)); }
function qMaanden(c, q) { return [0, 1, 2].map(function (k) { return q * 3 + k; }).filter(function (i) { return !bmNa(c, i); }); }
function bmDone(c, q) { var ms = qMaanden(c, q); return ms.length > 0 && ms.every(function (i) { return bmOn(c, i); }); }
function bmStatus(c, i) { return bmOn(c, i) ? 'gedaan' : bmWacht(c, i) ? 'wacht op klant' : bmLate(c, i) ? 'deadline verstreken' : bmDue(c, i) ? 'nu doen, ' + bmDlLabel(i) : 'open'; }
function bOn(c, q) { return BTWM && c.btwMaand ? bmDone(c, q) : c.btw[q]; }
function bWacht(c, q) { return BTWM && c.btwMaand ? qMaanden(c, q).some(function (i) { return bmWacht(c, i); }) : wk(c, 'btw' + (q + 1)) && !c.btw[q]; }
function bLate(c, q) {
  if (BTWM && c.btwMaand) return !btwNa(c, q) && qMaanden(c, q).some(function (i) { return bmLate(c, i); });
  return lopend(c) && !btwNa(c, q) && !c.btw[q] && !wk(c, 'btw' + (q + 1)) && VANDAAG > btwDeadline(q);
}
function bDue(c, q) {
  if (BTWM && c.btwMaand) return !btwNa(c, q) && !bLate(c, q) && qMaanden(c, q).some(function (i) { return bmDue(c, i); });
  return lopend(c) && !btwNa(c, q) && !c.btw[q] && !wk(c, 'btw' + (q + 1)) && kwartaalVoorbij(q) && !bLate(c, q);
}
function heeftWacht(c) { if (!lopend(c) || !c.wacht) return false; for (var k in c.wacht) if (c.wacht[k]) return true; return false; }
var WLBL = { cq1:'controle Q1', cq2:'controle Q2', cq3:'controle Q3', c25:'controle jaar', jw25:'jaarwerk', ib25:'IB' };
function wachtLabels(c) { var out = []; Object.keys(WLBL).forEach(function (k) { if (wk(c, k) && !c[k]) out.push(WLBL[k]); }); for (var i = 0; i < 12; i++) if (wk(c, 'm' + (i + 1)) && !c.months[i]) out.push(MONTHS[i]); if (BTWM && c.btwMaand) { for (var j = 0; j < 12; j++) if (bmWacht(c, j) && !bmNa(c, j)) out.push('Btw ' + MONTHS[j]); } else for (var q = 0; q < 4; q++) if (wk(c, 'btw' + (q + 1)) && !c.btw[q]) out.push('Btw Q' + (q + 1)); return out; }
function lateLabels(c) { var out = []; for (var i = 0; i < 12; i++) if (mLate(c, i)) out.push(c.freq === 'kwartaal' ? 'Q' + (Math.floor(i / 3) + 1) : MONTHS[i]); return out; }
function btwOpenNu(c) { for (var q = 0; q < 4; q++) if (bLate(c, q) || bDue(c, q)) return true; return false; }
function isAchter(c) {
  if (!lopend(c)) return false;
  for (var i = 0; i < 12; i++) if (mLate(c, i)) return true;
  return false;
}
function jwOpen(c) { return lopend(c) && !c.j25na && c.jw25 !== null && !c.jw25; }
function ibOpen(c) { return lopend(c) && !c.j25na && c.ib25 !== null && !c.ib25; }
function bijLabel(c) {
  var last = -1;
  for (var i = 0; i < 12; i++) { if (mNa(c, i)) continue; if (!c.months[i]) break; last = i; }
  if (last < 0) return 'nog niets';
  return c.freq === 'kwartaal' ? 't/m Q' + (Math.floor(last / 3) + 1) : 't/m ' + MONTHS[last];
}

function getFilters() { return [
  { id:'alles', label:'Alle lopende klanten', kpi:'Klanten', sub:'actieve klanten', f:lopend },
  { id:'btw', label:'Btw-aangifte open', kpi:'Btw open', sub:'periode voorbij, nog niet gedaan', f:btwOpenNu },
  { id:'achter', label:'Achterstand', kpi:'Achterstand', sub:'administratie niet bij ' + peilLabel(), f:isAchter },
  { id:'wacht', label:'Wacht op klant', kpi:'Wacht op klant', sub:'stukken nog niet binnen', f:heeftWacht },
  { id:'jw', label:'Jaarwerk ' + vj() + ' nog open', kpi:'Jaarwerk ' + vj() + ' open', sub:'jaarrekening', f:jwOpen },
  { id:'ib', label:'IB-aangifte ' + vj() + ' nog open', kpi:'IB ' + vj() + ' open', sub:'aangifte IB', f:ibOpen },
  { id:'opgezegd', label:'Opgezegd, werk loopt nog', kpi:'Opgezegd', sub:'loopt af', f:function (c) { return c.status === 'Opgezegd'; } },
  { id:'gestopt', label:'Gestopt (archief)', kpi:'Gestopt', sub:'archief', f:function (c) { return c.status === 'Gestopt'; } }
]; }

function emptySf() { return { status:'lopend', admin:'alle', bank:'alle', freq:'alle', btw3:'alle', achter:'alle', jw:'alle', ib:'alle', ctrl:'alle', up:'alle', kenm:[], kenmMode:'alle', regime:'alle', rechtsvorm:'alle', review:'alle', wacht:'alle' }; }
var KENMSEL = [['pers','Personenauto'],['best','Bestelauto'],['bestZonder','Bestelauto zonder UZGB'],['km','KM-registratie'],['uzgb','Verklaring UZGB'],['kmuzgb','KM/UZGB nog splitsen'],['motor','Motor'],['fiets','Fiets'],['pandKoop','Pand (koop)'],['pandHuur','Pand (huur)'],['btwMaand','Btw per maand']];
function kenmHeeft(c, k) {
  if (k === 'bestZonder') return !!(c.best && !c.uzgb);
  if (k === 'pandKoop') return c.pand === 'Koop';
  if (k === 'pandHuur') return c.pand === 'Huur';
  return !!c[k];
}
function htmlEsc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sfMatch(c, f) {
  if (f.status === 'lopend' ? !lopend(c) : c.status !== f.status) return false;
  if (f.admin !== 'alle' && c.admin !== f.admin) return false;
  if (f.bank === 'geenBK' ? c.bank === 'BK' : (f.bank !== 'alle' && c.bank !== f.bank)) return false;
  if (f.freq !== 'alle' && c.freq !== f.freq) return false;
  if (f.btw3 === 'open' && !btwOpenNu(c)) return false;
  if (f.btw3 === 'klaar' && btwOpenNu(c)) return false;
  if (f.wacht === 'ja' && !heeftWacht(c)) return false;
  if (f.wacht === 'nee' && heeftWacht(c)) return false;
  if (f.achter === 'ja' && !isAchter(c)) return false;
  if (f.achter === 'nee' && isAchter(c)) return false;
  if (f.jw === 'open' && !jwOpen(c)) return false;
  if (f.jw === 'klaar' && !c.jw25) return false;
  if (f.ib === 'open' && !ibOpen(c)) return false;
  if (f.ib === 'klaar' && !c.ib25) return false;
  var ks = Array.isArray(f.kenm) ? f.kenm : (f.kenm && f.kenm !== 'alle' ? [f.kenm] : []);
  if (ks.length) {
    var hits = ks.filter(function (k) { return kenmHeeft(c, k); }).length;
    if (f.kenmMode === 'een' ? hits === 0 : hits < ks.length) return false;
  }
  if (f.ctrl === 'open' && !(c.c25 !== null && c.c25 !== undefined && !c.c25 && !c.j25na)) return false;
  if (f.ctrl === 'klaar' && !c.c25) return false;
  if (f.up === 'ja' && !c.up) return false;
  if (f.up === 'nee' && c.up) return false;
  if (f.regime !== 'alle' && c.regime !== f.regime) return false;
  if (f.rechtsvorm !== 'alle' && c.rechtsvorm !== f.rechtsvorm) return false;
  if (f.review === 'ja' && !c.review) return false;
  if (f.review === 'nee' && c.review) return false;
  return true;
}
var PRESETS = [
  { l:'Actief zonder Google review', f:{ status:'Actief', review:'nee' }, cols:['naam','voornaam','email'] },
  { l:'Wacht op klant (herinnering)', f:{ wacht:'ja' }, cols:['naam','voornaam','email','admin'], tpl:'aanlevering' },
  { l:'Geen BK en btw open', f:{ bank:'geenBK', btw3:'open' }, cols:['naam','voornaam','email','admin'] },
  { l:'IB vorig jaar open, actief', f:{ status:'Actief', ib:'open' }, cols:['naam','voornaam','email','admin'], tpl:'ib' },
  { l:'Bestelauto zonder UZGB', f:{ kenm:['bestZonder'] }, cols:['naam','voornaam','email'] }
];
var MAILT = {
  aanlevering: { s:'Graag je stukken over {periode} aanleveren', b:'Hoi,\n\nWe willen je administratie over {periode} graag verwerken, maar we missen nog stukken van je. Wil je je facturen, bonnen en eventuele bankafschriften uiterlijk {uiterlijk} aanleveren? Dan kunnen we alles op tijd verwerken en je btw-aangifte verzorgen.\n\nHeb je vragen? Laat het gerust weten.\n\nGroet,\n{naam}\nPoortEijk ZZP' },
  ib: { s:'Je aangifte inkomstenbelasting {vj}', b:'Hoi,\n\nWe gaan aan de slag met je aangifte inkomstenbelasting over {vj}. Wil je ons uiterlijk {uiterlijk} laten weten of er iets is veranderd in je privésituatie, zoals een verhuizing, een nieuwe hypotheek of een wijziging in je gezin? Dan kunnen we je aangifte goed en op tijd indienen.\n\nHeb je vragen? Laat het gerust weten.\n\nGroet,\n{naam}\nPoortEijk ZZP' },
  review: { s:'Wil je ons een Google-review geven?', b:'Hoi,\n\nFijn dat we je administratie mogen verzorgen. Ben je tevreden over onze dienstverlening? Dan zouden we het erg waarderen als je een korte Google-review achterlaat. Dat helpt andere ondernemers om ons te vinden.\n\n[link naar jullie Google-reviewpagina]\n\nAlvast bedankt!\n\nGroet,\n{naam}\nPoortEijk ZZP' },
  vrij: { s:'', b:'' }
};
function standaardPeriode() { var d = new Date(VANDAAG.getFullYear(), VANDAAG.getMonth() - 1, 1); return ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][d.getMonth()] + ' ' + d.getFullYear(); }
function standaardUiterlijk() { var d = new Date(VANDAAG.getTime() + 14 * 86400000); return d.getDate() + ' ' + ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'][d.getMonth()]; }
function vulMail(t, periode, uiterlijk, naam) {
  var m = MAILT[t] || MAILT.vrij;
  var f = function (x) { return x.replace(/\{periode\}/g, periode).replace(/\{uiterlijk\}/g, uiterlijk).replace(/\{naam\}/g, naam || 'Team PoortEijk ZZP').replace(/\{vj\}/g, String(vj())); };
  return { s: f(m.s), b: f(m.b) };
}
function mailtoLink(adressen, onderwerp, tekst) {
  return 'mailto:?bcc=' + adressen.join(',') + (onderwerp ? '&subject=' + encodeURIComponent(onderwerp) : '') + (tekst ? '&body=' + encodeURIComponent(tekst) : '');
}
function stTekst(done, na, w, late) { return na ? 'n.v.t.' : done ? 'Gedaan' : w ? 'Wacht op klant' : late ? 'Achterstand' : 'Open'; }
function colSet(list) { var o = {}; COLS.forEach(function (c) { o[c[0]] = list.indexOf(c[0]) >= 0; }); return o; }

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = {
      phase: STORE.live ? 'loading' : 'app', me:null, auth:{ email:'', pw:'', pw2:'' }, authMode:'login', authMsg:'', authOk:false, conn:'connecting', logs:{}, demoAsk:false, saveErr:'',
      role:'Jeroen', page:'werk', menu:null, ownNotes:{}, ownDraft:{}, openQ:{}, jwF:'open', jwWie:null, jaar:JAAR, jaren:[JAAR], klikMode:'gedaan', werkWie:null, code:'', onth:true, mfa:null, jaarAsk:false, jaarMsg:'', mailT:'vrij', mailS:'', mailB:'', mailPeriode:standaardPeriode(), mailUiterlijk:standaardUiterlijk(), copiedTxt:false, scope:'alle', bankF:'alle', adminF:'alle', sort:{ k:'naam', d:1 }, filter:'alles', q:'', sel:null, tab:'over', clients:STORE.live ? [] : demoLoad(), notes:{},
      bsub:'nieuw', form:emptyForm(), editId:null, err:'',
      mq:'', mutSel:null, mutMode:'menu', mut:{ admin:'Jeroen' }, mutMsg:'',
      stop:{ datum:JAAR + '-12-31', reden:'Bedrijf gestopt', adm:'11', btw:'3', jw26:true, ib26:true },
      sf:emptySf(), cols:colSet(['naam','voornaam','email','admin']), saveName:'', saved:[{ l:'Herinnering IB', f:Object.assign(emptySf(), { status:'Actief', ib:'open' }) }], copied:false
    };
    var ui = uiLaden(), st = this.state;
    UI_VELDEN.forEach(function (k) { if (ui[k] !== undefined) st[k] = ui[k]; });
    st.klikMode = 'gedaan';
    st.bankF = 'alle';
    if (st.bsub === 'sel') { st.bsub = 'nieuw'; if (st.page === 'beheer') st.page = 'sel'; }
  }

  componentDidMount() {
    var self = this;
    var sluit = function () { if (self.state.menu) self.setState({ menu:null }); };
    document.addEventListener('click', sluit);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') sluit(); });
    window.addEventListener('scroll', sluit, true);
    window.addEventListener('resize', sluit);
    if (!STORE.live) {
      try { var inst = JSON.parse(localStorage.getItem(DEMO_INST) || '{}'); if (inst.jaar) { JAAR = inst.jaar; } if (inst.peil !== undefined) PEIL_HANDMATIG = inst.peil; this.setState({ jaar:JAAR, jaren:[JAAR] }); } catch (x) {}
      window.addEventListener('storage', function (e) {
        if (e.key !== DEMO_KEY) return;
        var cl = demoLoad();
        self.__saved = cl;
        self.setState({ clients: cl });
      });
      return;
    }
    STORE.init(function (ev) {
      if (ev.type === 'signedOut') self.setState({ phase:'auth', authMode:'login', me:null, clients:[] });
      else if (ev.type === 'newPassword') self.setState({ phase:'auth', authMode:'newpw', authMsg:'' });
      else if (ev.type === 'noProfile') self.setState({ phase:'auth', authMode:'login', authOk:false, authMsg:'Je bent ingelogd als ' + ev.email + ', maar je account is nog niet gekoppeld aan een naam en rol. Vraag de beheerder dit te doen.' });
      else if (ev.type === 'signedIn') self.startLive(ev.me);
      else if (ev.type === 'mfa') self.setState({ phase:'auth', authMode:'mfa', mfa:{ factorId:ev.factorId }, code:'', authMsg:'' });
      else if (ev.type === 'enroll') {
        self.setState({ phase:'auth', authMode:'enroll', mfa:null, code:'', authMsg:'QR-code wordt gemaakt...', authOk:true });
        STORE.enroll().then(function (m) { self.setState({ mfa:m, authMsg:'' }); }).catch(function (e) { self.setState({ authMsg:'Koppelen lukt niet: ' + e.message, authOk:false }); });
      }
      else if (ev.type === 'error') self.setState({ phase:'auth', authMode:'login', authMsg:ev.msg, authOk:false });
    });
  }

  startLive(me) {
    var self = this;
    var ui = uiLaden();
    if (ui.role && ui.role !== me.naam) ui = {};
    var herstel = { me:me, role:me.naam, phase:'loading', werkWie: ui.werkWie !== undefined ? ui.werkWie : null };
    if (me.rol !== 'beheer' && (this.state.page === 'beheer')) herstel.page = 'werk';
    this.setState(herstel);
    STORE.loadSettings().then(function (st) {
      if (st.huidig_jaar) JAAR = parseInt(st.huidig_jaar, 10);
      self.setState({ jaar:JAAR });
      return STORE.loadYears().then(function (ys) { if (ys.indexOf(JAAR) < 0) ys.push(JAAR); self.setState({ jaren:ys.sort() }); });
    }).catch(function () {}).then(function () { return STORE.loadOwnNotes().then(function (o) { self.setState({ ownNotes:o }); }).catch(function () {}); }).then(function () { return self.reload(); }).then(function () {
      self.setState({ phase:'app' });
      if (!self.__subscribed) {
        self.__subscribed = true;
        STORE.subscribe(function () { self.reload(); }, function (st) { self.setState({ conn:st }); });
        // Vangnet: bij terugkomen in het tabblad, en elke minuut als de live-verbinding hapert, opnieuw ophalen
        var laatst = Date.now();
        var opnieuw = function () { if (self.state.phase !== 'app' || Date.now() - laatst < 5000) return; laatst = Date.now(); self.reload(); };
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') opnieuw(); });
        window.addEventListener('focus', opnieuw);
        setInterval(function () { if (document.visibilityState === 'visible' && self.state.conn !== 'live') opnieuw(); }, 60000);
      }
      if (self.state.sel) self.loadLog(self.state.sel);
    });
  }

  reload() {
    var self = this;
    return STORE.loadSettings().then(function (st) { PEIL_HANDMATIG = st.peil === undefined ? null : st.peil; }).catch(function () {}).then(function () { return STORE.loadAll(self.state.jaar); }).then(function (cl) {
      self.setState({ clients: cl, saveErr:'' });
      if (self.state.sel) self.loadLog(self.state.sel);
    }).catch(function (e) { self.setState({ saveErr:'Gegevens laden mislukt: ' + e.message, phase:'app' }); });
  }

  loadLog(id) {
    var self = this;
    if (!STORE.live) return;
    STORE.loadLog(id).then(function (log) { var l = Object.assign({}, self.state.logs); l[id] = log; self.setState({ logs:l }); }).catch(function () {});
  }

  openClient(id) {
    this.setState({ sel:id, tab:'over' });
    this.loadLog(id);
  }

  afterRender() {
    var s0 = this.state, ui = {};
    UI_VELDEN.forEach(function (k) { ui[k] = s0[k]; });
    var uj = JSON.stringify(ui);
    if (uj !== this.__ui) { this.__ui = uj; try { sessionStorage.setItem(UI_KEY, uj); } catch (x) {} }
    if (STORE.live) return;
    var cl = this.state.clients, self = this;
    if (cl === this.__saved) return;
    this.__saved = cl;
    clearTimeout(this.__t);
    this.__t = setTimeout(function () { try { localStorage.setItem(DEMO_KEY, JSON.stringify(self.state.clients)); } catch (x) {} }, 300);
  }

  upd(id, fn, text) {
    var self = this, role = this.state.role, old = null, neu = null;
    var clients = this.state.clients.map(function (c) {
      if (c.id !== id) return c;
      var n = Object.assign({}, c, { months:c.months.slice(), btw:c.btw.slice(), mna:c.mna ? c.mna.slice() : null, bna:c.bna ? c.bna.slice() : null, wacht:Object.assign({}, c.wacht || {}), btwm:(c.btwm || []).slice() });
      fn(n);
      n.log = [{ wie:role, wat:text, wanneer:nowLabel() }].concat(c.log || []);
      old = c; neu = n;
      return n;
    });
    this.setState({ clients:clients });
    if (STORE.live && old) {
      var l = Object.assign({}, this.state.logs); l[id] = [{ wie:role, wat:text, wanneer:'zojuist' }].concat(l[id] || []); this.setState({ logs:l });
      STORE.persist(old, neu, text, this.state.jaar).catch(function (e) { self.setState({ saveErr:'Opslaan mislukt: ' + e.message + '. De gegevens worden opnieuw geladen.' }); self.reload(); });
    }
  }

  toggle(c, key, idx, label) {
    if (key === 'btw' && BTWM && c.btwMaand) {
      var ms = qMaanden(c, idx);
      if (!ms.length) return;
      if (this.state.klikMode === 'wacht') {
        var wachtend = ms.filter(function (i) { return bmWacht(c, i); });
        if (wachtend.length) {
          this.upd(c.id, function (n) { wachtend.forEach(function (i) { delete n.wacht['bm' + (i + 1)]; }); }, 'Btw ' + wachtend.map(function (i) { return MONTHS[i]; }).join(', ') + ': wacht op klant opgeheven');
          return;
        }
      }
      var open = ms.filter(function (i) { return !bmOn(c, i); });
      if (this.state.klikMode === 'wacht' && !open.length) return;
      var target = open.length ? open[0] : ms[ms.length - 1];
      this.toggle(c, 'bm', target, 'Btw ' + MONTHS[target]);
      return;
    }
    if (key === 'bm') {
      var q = Math.floor(idx / 3), bk = 'bm' + (idx + 1);
      var zet = function (n, v) {
        if (n.btw[q]) { for (var k = 0; k < 3; k++) n.btwm[q * 3 + k] = true; n.btw[q] = false; }
        n.btwm[idx] = v;
        n.btw[q] = bmDone(n, q);
      };
      if (this.state.klikMode === 'wacht') {
        var nwm = !wk(c, bk);
        this.upd(c.id, function (n) { if (nwm) { n.wacht[bk] = true; zet(n, false); } else delete n.wacht[bk]; }, label + (nwm ? ' op wacht op klant gezet' : ': wacht op klant opgeheven'));
        return;
      }
      var nvm = !bmOn(c, idx);
      this.upd(c.id, function (n) { zet(n, nvm); if (nvm) delete n.wacht[bk]; }, label + (nvm ? ' afgevinkt' : ' teruggezet naar open'));
      return;
    }
    var wkey = key === 'm' ? 'm' + (idx + 1) : key === 'btw' ? 'btw' + (idx + 1) : null;
    if (this.state.klikMode === 'wacht' && wkey) {
      var nw = !wk(c, wkey);
      this.upd(c.id, function (n) {
        if (nw) { n.wacht[wkey] = true; if (key === 'm') n.months[idx] = false; else n.btw[idx] = false; }
        else delete n.wacht[wkey];
      }, label + (nw ? ' op wacht op klant gezet' : ': wacht op klant opgeheven'));
      return;
    }
    var cur = key === 'm' ? c.months[idx] : key === 'btw' ? c.btw[idx] : !!c[key];
    var nv = !cur;
    this.upd(c.id, function (n) {
      if (key === 'm') n.months[idx] = nv; else if (key === 'btw') n.btw[idx] = nv; else n[key] = nv ? 1 : 0;
      if (nv) delete n.wacht[wkey || key];
    }, label + (nv ? ' afgevinkt' : ' teruggezet naar open'));
  }

  setStatus(c, key, idx, st, label) {
    var wkey = key === 'm' ? 'm' + (idx + 1) : key === 'btw' ? 'btw' + (idx + 1) : key;
    this.upd(c.id, function (n) {
      var v = st === 'gedaan';
      if (key === 'm') n.months[idx] = v; else if (key === 'btw') n.btw[idx] = v; else n[key] = v;
      if (wkey) { if (st === 'wacht') n.wacht[wkey] = true; else delete n.wacht[wkey]; }
    }, label + (st === 'gedaan' ? ' gedaan' : st === 'wacht' ? ' op wacht op klant gezet' : ' teruggezet naar open'));
  }

  openMenu(ev, c, key, idx, label) {
    ev.preventDefault();
    ev.stopPropagation();
    var x = Math.min(ev.clientX, window.innerWidth - 220), y = Math.min(ev.clientY, window.innerHeight - 170);
    this.setState({ menu:{ x:x, y:y, cid:c.id, key:key, idx:idx, label:label, wacht:true } });
  }

  startJaar() {
    var self = this, next = this.state.jaar + 1;
    if (STORE.live) {
      this.setState({ jaarMsg:'Bezig met aanmaken...' });
      STORE.startYear(this.state.clients, next).then(function (n) {
        JAAR = next;
        self.setState({ jaar:next, jaren:self.state.jaren.concat([next]).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(), jaarAsk:false, jaarMsg:'Jaar ' + next + ' gestart voor ' + n + ' klanten. ' + (next - 1) + ' blijft in te zien via de jaarkeuze bovenin.' });
        return self.reload();
      }).catch(function (e) { self.setState({ jaarMsg:'Starten mislukt: ' + e.message, jaarAsk:false }); });
      return;
    }
    var cl = this.state.clients.map(function (c) {
      if (c.status === 'Gestopt') return c;
      var row = STORE.nieuwJaarRij(c, next), n = Object.assign({}, c);
      n.months = []; n.mna = []; for (var i = 1; i <= 12; i++) { n.months.push(!!row['m' + i]); n.mna.push(row['m' + i] === null); }
      n.btw = []; n.bna = []; for (var q = 1; q <= 4; q++) { n.btw.push(!!row['btw' + q]); n.bna.push(row['btw' + q] === null); }
      n.btwm = []; n.cq1 = row.controle_q1; n.cq2 = row.controle_q2; n.cq3 = row.controle_q3; n.c25 = row.controle_vj; n.jw25 = row.jaarwerk_vj; n.ib25 = row.ib_vj; n.wacht = {}; n.j25na = false;
      return n;
    });
    JAAR = next;
    try { var inst = JSON.parse(localStorage.getItem(DEMO_INST) || '{}'); inst.jaar = next; localStorage.setItem(DEMO_INST, JSON.stringify(inst)); } catch (x) {}
    this.setState({ clients:cl, jaar:next, jaren:[next], jaarAsk:false, jaarMsg:'Demo: jaar ' + next + ' gestart. In de demo wordt het vorige jaar niet bewaard.' });
  }

  zetPeil(v) {
    PEIL_HANDMATIG = v === 'auto' ? null : parseInt(v, 10);
    if (STORE.live) STORE.setSetting('peil', PEIL_HANDMATIG).catch(function () {});
    else { try { var inst = JSON.parse(localStorage.getItem(DEMO_INST) || '{}'); inst.peil = PEIL_HANDMATIG; localStorage.setItem(DEMO_INST, JSON.stringify(inst)); } catch (x) {} }
    this.forceUpdate();
  }

  kiesJaar(j) {
    j = parseInt(j, 10);
    if (j === this.state.jaar) return;
    JAAR = j;
    this.setState({ jaar:j, sel:null });
    if (STORE.live) this.reload();
  }

  saveForm() {
    var f = this.state.form;
    if (!f.naam.trim()) { this.setState({ err:'Vul in elk geval de naam van de onderneming in.' }); return; }
    var role = this.state.role;
    if (this.state.editId) {
      var id = this.state.editId;
      this.upd(id, function (n) { Object.keys(f).forEach(function (k) { n[k] = f[k]; }); n.vanY = parseInt(f.vanY, 10); n.vanQ = parseInt(f.vanQ, 10); }, 'Klantgegevens gewijzigd');
      this.setState({ mutMode:'menu', editId:null, err:'', mutMsg:'Gegevens opgeslagen.' });
      return;
    }
    var nid = this.state.clients.reduce(function (m, c) { return Math.max(m, c.id); }, 0) + 1;
    var nc = C(Object.assign({}, f, { id:nid, m:0, btw:[0,0,0,0], cq2:0, cq3:0, c25:0, jw25:0, ib25:0, j25na:parseInt(f.vanY, 10) >= JAAR,
      log:[{ wie:role, wat:'Klant aangemaakt (klant vanaf ' + f.vanY + ' Q' + (parseInt(f.vanQ, 10) + 1) + '). Voortgangsregel ' + JAAR + ' automatisch toegevoegd.', wanneer:nowLabel() }] }));
    if (STORE.live) {
      var self = this;
      this.setState({ err:'Bezig met opslaan...' });
      STORE.create(nc, 'Klant aangemaakt (klant vanaf ' + vanLabel(nc) + ')', this.state.jaar).then(function (newId) {
        return self.reload().then(function () { self.setState({ page:'klanten', sel:newId, tab:'over', filter:'alles', scope:'alle', q:'', err:'', form:emptyForm() }); self.loadLog(newId); });
      }).catch(function (e) { self.setState({ err:'Opslaan mislukt: ' + e.message }); });
      return;
    }
    this.setState(function (s) { return { clients:[nc].concat(s.clients), page:'klanten', sel:nid, tab:'over', filter:'alles', scope:'alle', q:'', err:'', form:emptyForm() }; });
  }

  demoOwn(role) {
    if (STORE.live || this.__ownRole === role) return;
    this.__ownRole = role;
    var o = {}; try { o = JSON.parse(localStorage.getItem('pz-eigen-' + role) || '{}'); } catch (x) {}
    this.state.ownNotes = o; this.state.ownDraft = {};
  }

  renderVals() {
    var FILTERS = getFilters();
    this.demoOwn(this.state.role);
    var self = this, s = this.state, role = STORE.live ? (s.me ? s.me.naam : '') : s.role, beheer = STORE.live ? !!(s.me && s.me.rol === 'beheer') : role === 'Jeroen', all = s.clients;

    var inBase = function (c) { return (s.scope === 'alle' || c.admin === role) && (s.bankF === 'alle' || c.bank === s.bankF); };
    var inScope = function (c) { return inBase(c) && (s.adminF === 'alle' || c.admin === s.adminF); };
    var cur = FILTERS.filter(function (f) { return f.id === s.filter; })[0];
    if (['alles', 'btw', 'achter', 'wacht'].indexOf(cur.id) < 0) cur = FILTERS[0];
    var q = s.q.trim().toLowerCase();
    var BANKORD = { 'BK':0, 'camt.053':1, 'MT940':2, 'geen':3, 'overig':4 };
    var progress = function (c) { var n = 0; for (var i = 0; i < 12; i++) { if (mNa(c, i)) continue; if (!c.months[i]) break; n = i + 1; } return n; };
    var openBtw = function (c) { var n = 0; for (var qi = 0; qi < 4; qi++) if (bLate(c, qi) || bDue(c, qi)) n++; return n; };
    var SK = {
      naam: function (c) { return c.naam.toLowerCase(); },
      freq: function (c) { return c.freq === 'kwartaal' ? 0 : 1; },
      admin: function (c) { return c.admin || 'zzz'; },
      bank: function (c) { return BANKORD[c.bank] != null ? BANKORD[c.bank] : 9; },
      adm: function (c) { return progress(c); },
      btw: function (c) { return -openBtw(c); },
      y25: function (c) { return -((jwOpen(c) ? 1 : 0) + (ibOpen(c) ? 1 : 0)); }
    };
    var sk = SK[s.sort.k] || SK.naam, sd = s.sort.d;
    var list = all.filter(function (c) { return inScope(c) && cur.f(c) && (!q || c.naam.toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { var x = sk(a), y = sk(b); if (x < y) return -sd; if (x > y) return sd; return a.naam.localeCompare(b.naam); });
    var sortBy = {}, arrow = {};
    Object.keys(SK).forEach(function (k) {
      sortBy[k] = function () { self.setState({ sort:{ k:k, d: s.sort.k === k ? -s.sort.d : 1 } }); };
      arrow[k] = s.sort.k === k ? (s.sort.d === 1 ? '↑' : '↓') : '';
    });
    var viewTitleTxt = (s.scope === 'mijn' ? 'Mijn klanten: ' : (s.adminF !== 'alle' ? s.adminF + ': ' : 'Alle klanten: ')) + cur.label.charAt(0).toLowerCase() + cur.label.slice(1) + (s.bankF !== 'alle' ? ' (bank ' + s.bankF + ')' : '');
    var vis = FILTERS.filter(function (f) { return ['alles', 'btw', 'achter', 'wacht'].indexOf(f.id) >= 0; });
    var kpis = vis.map(function (f) {
      var nOp = f.id === 'alles' ? all.filter(function (c) { return inScope(c) && c.status === 'Opgezegd'; }).length : 0;
      return { label:f.kpi, sub: nOp ? 'waarvan ' + nOp + ' opgezegd' : f.sub, value: all.filter(function (c) { return inScope(c) && f.f(c); }).length, cls: cur.id === f.id ? 'kpi on' : 'kpi', pick:function () { self.setState({ filter:f.id }); } };
    });
    var baseList = all.filter(function (c) { return inBase(c) && cur.f(c) && (!q || c.naam.toLowerCase().indexOf(q) >= 0); });
    var breakdown = s.scope === 'alle' ? ADMINS.map(function (a) { var on = s.adminF === a; return { admin:initial(a), n: baseList.filter(function (c) { return c.admin === a; }).length, cls: on ? 'chip chipbtn on' : 'chip chipbtn', t: on ? 'Klik om weer iedereen te tonen' : 'Alleen klanten van ' + a, pick: function () { self.setState({ adminF: on ? 'alle' : a }); } }; }).filter(function (b) { return b.n > 0 || s.adminF === b.admin; }) : [];

    var pillCls = function (on, na, late, due, w) { return na ? 'pill na' : on ? 'pill done' : w ? 'pill wacht' : late ? 'pill late' : due ? 'pill due' : 'pill'; };
    var kenmList = function (c) {
      var out = [];
      KENM.forEach(function (k) { if (c[k[0]]) out.push({ l:KSHORT[k[0]], cls:'mini' }); });
      if (c.pand) out.push({ l:'Pand (' + c.pand.toLowerCase() + ')', cls:'mini' });
      if (c.kmuzgb) out.push({ l:'KM/UZGB?', cls:'mini o' });
      else if (c.best && !c.uzgb && !c.km) out.push({ l:'Geen UZGB/KM', cls:'mini o' });
      if (c.regime !== 'Normaal') out.push({ l:c.regime, cls:'mini o' });
      return out;
    };
    // ---- Lopend kwartaal en eerdere kwartalen
    var WQ = winQ();
    var tegel = function (c, key, idx, l, title) {
      var on, na, late = false, due = false, w = false;
      if (key === 'm') { on = c.months[idx]; na = mNa(c, idx); late = mLate(c, idx); due = mDue(c, idx); w = wk(c, 'm' + (idx + 1)) && !on; }
      else if (key === 'btw') { on = c.btw[idx]; na = btwNa(c, idx) || !lopend(c); late = bLate(c, idx); due = bDue(c, idx); w = wk(c, 'btw' + (idx + 1)) && !on; }
      else { on = !!c[key]; na = c[key] === null || c[key] === undefined || (c.j25na && (key === 'c25' || key === 'jw25' || key === 'ib25')); w = wk(c, key) && !on; }
      var cls = 'tt ' + (na ? 'n' : on ? 'd' : w ? 'w' : late ? 'l' : due ? 'u' : 'o');
      var stTxt = na ? 'n.v.t.' : on ? 'gedaan' : w ? 'wacht op klant' : late ? 'achterstand' : due ? 'nu doen' : 'open';
      return { isTile:true, isSep:false, kind: key === 'm' ? 'adm' : key === 'btw' ? 'btw' : 'ctrl', l:l, cls:cls, na:na, st: na ? 'n' : on ? 'd' : w ? 'w' : late ? 'l' : 'o',
        t: title + ': ' + stTxt + (na ? '' : ' (klik: gedaan aan/uit, rechtsklik: meer)'),
        click: function () { if (!na) self.toggle(c, key, idx, title); },
        menu: function (ev) { if (na) { ev.preventDefault(); return; } self.openMenu(ev, c, key, idx, title); } };
    };
    var blok = function (c, qi) {
      var tiles = [];
      if (qi > 0) { var ct = tegel(c, CTRL[qi - 1], 0, 'ctrl Q' + qi, 'Controle Q' + qi); ct.cls += ' ct'; tiles.push(ct); tiles.push({ isSep:true, isTile:false }); }
      if (c.freq === 'kwartaal') { var kt = tegel(c, 'm', qi * 3, MONTHS[qi * 3] + '-' + MONTHS[qi * 3 + 2], 'Administratie Q' + (qi + 1)); kt.cls += ' kw'; tiles.push(kt); }
      else for (var k = 0; k < 3; k++) tiles.push(tegel(c, 'm', qi * 3 + k, MONTHS[qi * 3 + k], MONTHS[qi * 3 + k]));
      tiles.push({ isSep:true, isTile:false });
      tiles.push(tegel(c, 'btw', qi, 'btw', 'Btw Q' + (qi + 1)));
      var echte = tiles.filter(function (t) { return t.isTile && t.st !== 'n'; });
      var open = echte.filter(function (t) { return t.st !== 'd'; });
      return { l:'Q' + (qi + 1), tiles:tiles, nOpen:open.length, late: open.some(function (t) { return t.st === 'l'; }), wacht: open.some(function (t) { return t.st === 'w'; }), cur: qi === WQ };
    };
    var vorigeQ = function (c) {
      var out = [];
      for (var qi = 0; qi < WQ; qi++) (function (qi) {
        var b = blok(c, qi);
        var dicht = !(s.openQ && s.openQ[qi]);
        out.push({ isChip:dicht, isBlok:!dicht, blk:b,
          chipL: b.nOpen ? 'Q' + (qi + 1) + ' · ' + b.nOpen + ' open' : 'Q' + (qi + 1) + ' ✓',
          chipCls: 'qchip ' + (!b.nOpen ? 'k' : b.late ? 'l' : b.wacht ? 'w' : 'o'),
          chipT: b.nOpen ? 'Klik om Q' + (qi + 1) + ' open te klappen' : 'Q' + (qi + 1) + ' is helemaal klaar. Klik om open te klappen.',
          wissel: function () { var o = Object.assign({}, s.openQ || {}); o[qi] = !o[qi]; self.setState({ openQ:o }); } });
      })(qi);
      return out;
    };
    var tmInfo = function (c) {
      var p = peil(), lbl = bijLabel(c), achter, eenheid;
      if (c.freq === 'kwartaal') {
        var qd = 0; for (var qi = 0; qi < 4; qi++) { if (mNa(c, qi * 3) || c.months[qi * 3]) qd = qi + 1; else break; }
        achter = Math.max(0, Math.floor(p / 3) - qd); eenheid = achter === 1 ? 'kwartaal' : 'kwartalen';
      } else {
        var md = 0; for (var i = 0; i < 12; i++) { if (mNa(c, i) || c.months[i]) md = i + 1; else break; }
        achter = Math.max(0, p - md); eenheid = achter === 1 ? 'maand' : 'maanden';
      }
      if (!lopend(c)) return { lbl:lbl, bdg:'', bcls:'' };
      if (heeftWacht(c)) return { lbl:lbl, bdg:'wacht op klant', bcls:'bdg bw' };
      if (!achter) return { lbl:lbl, bdg:'bij', bcls:'bdg bg' };
      return { lbl:lbl, bdg:achter + ' ' + eenheid + ' achter', bcls: achter === 1 && c.freq !== 'kwartaal' ? 'bdg bo' : 'bdg br' };
    };
    var rows = list.map(function (c) {
      var ti = tmInfo(c);
      var tags = [];
      if (c.status !== 'Actief') tags.push({ l:c.status.toLowerCase(), cls:'ntag z' });
      if (c.btwMaand && c.regime === 'Normaal') tags.push({ l:'btw p/m', cls:'ntag o' });
      return {
        tags:tags, tmL:ti.lbl, tmB:ti.bdg, tmCls:ti.bcls, hasTmB: !!ti.bdg,
        cur: blok(c, WQ), prev: vorigeQ(c), hasPrev: WQ > 0,
        naam:c.naam, admin:c.admin, init:initial(c.admin), bank:c.bank,
        hasBijz: !!c.bijz, hasStatus: c.status !== 'Actief', status:c.status,
        cls: s.sel === c.id ? 'row sel' : 'row',
        isKw: c.freq === 'kwartaal',
        dots: c.months.map(function (d, i) {
          var na = mNa(c, i), late = mLate(c, i), due = mDue(c, i), w = wk(c, 'm' + (i + 1));
          return { cls: na ? 'dot na' : d ? 'dot done' : w ? 'dot wacht' : late ? 'dot late' : due ? 'dot due' : 'dot', na: na, t: MONTHS[i] + ': ' + (na ? 'n.v.t.' : d ? 'gedaan' : w ? 'wacht op klant' : late ? 'achterstand' : 'open') + (na ? '' : s.klikMode === 'wacht' ? ' (klik: wacht op klant aan/uit)' : ' (klik: gedaan aan/uit)'), toggle: function () { if (!na) self.toggle(c, 'm', i, MONTHS[i]); } };
        }),
        bij: bijLabel(c),
        btwM: !!c.btwMaand && c.regime === 'Normaal',
        btw: [0,1,2,3].map(function (qi) {
          var bna = btwNa(c, qi), bw = bWacht(c, qi), on = bOn(c, qi), fr = '', t;
          if (c.btwMaand && !bna) {
            var ms = qMaanden(c, qi), nd = ms.filter(function (i) { return bmOn(c, i); }).length;
            if (nd > 0 && nd < ms.length) fr = nd + '/' + ms.length;
            t = 'Btw per maand Q' + (qi + 1) + ': ' + ms.map(function (i) { return MONTHS[i] + ' ' + bmStatus(c, i); }).join(', ') + (s.klikMode === 'wacht' ? ' (klik: wacht op klant)' : ' (klik: volgende maand afvinken)');
          } else t = 'Btw Q' + (qi + 1) + ': ' + (bna ? 'n.v.t.' : on ? 'gedaan' : bw ? 'wacht op klant' : bLate(c, qi) ? 'deadline verstreken' : bDue(c, qi) ? 'nu doen, ' + btwDlLabel(qi) : 'open');
          return { l:'Q' + (qi + 1), fr:fr, hasFr: !!fr, na: bna, cls: pillCls(on, bna, bLate(c, qi), bDue(c, qi), bw), t:t, toggle: function () { if (!bna) self.toggle(c, 'btw', qi, 'Btw Q' + (qi + 1)); } };
        }),
        jw: pillCls(!!c.jw25, c.j25na || c.jw25 === null, false, lopend(c)), ib: pillCls(!!c.ib25, c.j25na || c.ib25 === null, false, lopend(c)),
        jwNa: c.j25na || c.jw25 === null, ibNa: c.j25na || c.ib25 === null,
        jwT: 'Jaarwerk ' + vj() + ': ' + (c.jw25 === null ? 'n.v.t.' : c.jw25 ? 'gedaan' : 'open, klik om af te vinken'), ibT: 'IB ' + vj() + ': ' + (c.ib25 === null ? 'n.v.t.' : c.ib25 ? 'gedaan' : 'open, klik om af te vinken'),
        jwToggle: function () { if (!(c.j25na || c.jw25 === null)) self.toggle(c, 'jw25', 0, 'Jaarwerk ' + vj()); }, ibToggle: function () { if (!(c.j25na || c.ib25 === null)) self.toggle(c, 'ib25', 0, 'IB ' + vj()); },
        jwMenu: function (ev) { if (c.j25na || c.jw25 === null) { ev.preventDefault(); return; } self.openMenu(ev, c, 'jw25', 0, 'Jaarwerk ' + vj()); },
        ibMenu: function (ev) { if (c.j25na || c.ib25 === null) { ev.preventDefault(); return; } self.openMenu(ev, c, 'ib25', 0, 'IB ' + vj()); },
        hasAdmin: !!c.admin,
        freqLabel: c.freq === 'kwartaal' ? 'Per kwartaal' : 'Per maand', freqCls: c.freq === 'kwartaal' ? 'mini o' : 'mini',
        kenm: kenmList(c),
        open: function () { self.openClient(c.id); }
      };
    });

    var verloop = (function () {
      var g = { adm:[0, 0], ctrl:[0, 0], btw:[0, 0] };
      rows.forEach(function (r) { r.cur.tiles.forEach(function (t) {
        if (!t.isTile || t.st === 'n') return;
        var k = t.kind; g[k][1]++; if (t.st === 'd') g[k][0]++;
      }); });
      var regel = function (l, x) { var pct = x[1] ? Math.round(x[0] / x[1] * 100) : 100; return { l:l, tekst: (x[1] - x[0]) + ' te doen van ' + x[1], pct: pct + '%', bar:'width: ' + pct + '%', toon: x[1] > 0 }; };
      var out = [regel('Administratie', g.adm)];
      if (WQ > 0) out.push(regel('Controle Q' + WQ, g.ctrl));
      out.push(regel('Btw Q' + (WQ + 1), g.btw));
      return out.filter(function (x) { return x.toon; });
    })();

    var selC = all.filter(function (c) { return c.id === s.sel; })[0] || null;
    var d = { kenm:[], quarters:[], year:[], gegevens:[], log:[] };
    if (selC) {
      var c = selC;
      var tog = function (on, na, late, due, w) { return na ? 'tog na' : on ? 'tog on' : w ? 'tog wacht' : late ? 'tog late' : due ? 'tog due' : 'tog'; };
      var sub = function (on, na, late, due, w) { return na ? 'n.v.t.' : on ? 'gedaan' : w ? 'wacht klant' : late ? 'achter' : due ? 'nu doen' : 'open'; };
      var kenm = [{ l:'Btw-aangifte', on:c.btwMaand, off:!c.btwMaand, v: c.btwMaand ? 'Per maand' : 'Per kwartaal', cls: c.btwMaand ? 'kt hi' : 'kt' }];
      KENM.forEach(function (k) { var on = !!c[k[0]]; kenm.push({ l:k[1], on:on, off:!on, v: on ? 'Ja' : 'Nee', cls: on ? 'kt on' : 'kt' }); });
      if (c.kmuzgb) kenm.push({ l:'KM of UZGB', on:true, off:false, v:'Nog splitsen', cls:'kt hi' });
      kenm.push({ l:'Pand', on:!!c.pand, off:!c.pand, v: c.pand || 'Nee', cls: c.pand ? 'kt on' : 'kt' });
      var rOn = c.regime !== 'Normaal';
      kenm.push({ l:'Btw-regime', on:rOn, off:!rOn, v:c.regime, cls: rOn ? 'kt on' : 'kt' });

      var quarters = [0,1,2,3].map(function (qi) {
        var items = [0,1,2].map(function (k) {
          var i = qi * 3 + k, on = c.months[i], na = mNa(c, i), late = mLate(c, i), due = mDue(c, i), w = wk(c, 'm' + (i + 1));
          return { l:MONTHS[i], on:on, na:na, cls:tog(on, na, late, due, w), sub:sub(on, na, late, due, w), toggle:function () { if (!na) self.toggle(c, 'm', i, MONTHS[i]); } };
        });
        var bna = btwNa(c, qi), bon = bOn(c, qi), blate = bLate(c, qi), bdue = bDue(c, qi), bw = bWacht(c, qi);
        var maandBtw = BTWM && !!c.btwMaand && !bna, bmItems = [], bfr = '';
        if (maandBtw) {
          var qms = qMaanden(c, qi), qnd = qms.filter(function (i) { return bmOn(c, i); }).length;
          bfr = qnd + '/' + qms.length;
          bmItems = [0,1,2].map(function (k) {
            var i = qi * 3 + k, mna = bmNa(c, i), mon = bmOn(c, i), ml = bmLate(c, i), mdu = bmDue(c, i), mw = bmWacht(c, i);
            return { l:'Btw ' + MONTHS[i], on:mon, na:mna, cls:tog(mon, mna, ml, mdu, mw), sub: mna ? 'n.v.t.' : mon ? 'gedaan' : mw ? 'wacht klant' : ml ? 'te laat' : mdu ? 'vóór ' + bmDeadline(i).getDate() + ' ' + MONTHS[bmDeadline(i).getMonth()] : 'open', toggle:function () { if (!mna) self.toggle(c, 'bm', i, 'Btw ' + MONTHS[i]); } };
          });
        }
        var ctrlKey = qi === 1 ? 'cq2' : qi === 2 ? 'cq3' : null, ctrl = null;
        if (ctrlKey) { var con = !!c[ctrlKey], cna = c[ctrlKey] === null; ctrl = { l:'Controle t/m Q' + (qi + 1), on:con, cls:(cna ? 'tog na' : con ? 'tog on' : 'tog') + ' wide', sub: cna ? 'n.v.t.' : con ? 'gedaan' : 'open', toggle:function () { self.toggle(c, ctrlKey, 0, 'Controle t/m Q' + (qi + 1)); } }; }
        return { label:'Q' + (qi + 1), dl: c.regime !== 'Normaal' ? 'geen btw-aangifte' : maandBtw ? 'Btw per maand' : 'Btw ' + btwDlLabel(qi), items:items, hasBm: maandBtw, bm: bmItems,
          btw:{ on:bon, na:bna, cls:tog(bon, bna, blate, bdue, bw), sub: maandBtw && !bon ? bfr : sub(bon, bna, blate, bdue, bw), toggle:function () { if (!bna) self.toggle(c, 'btw', qi, 'Btw Q' + (qi + 1)); } },
          hasCtrl: !!ctrl, ctrl: ctrl || { l:'', on:false, cls:'tog', sub:'', toggle:function () {} } };
      });
      var year = [['c25','Controle ' + vj()],['jw25','Jaarwerk ' + vj()],['ib25','IB ' + vj()]].map(function (p) {
        var on = !!c[p[0]], na = c.j25na || c[p[0]] === null;
        return { l:p[1], on:on, na:na, cls:tog(on, na, false, false) + ' wide', sub:sub(on, na, false, false), toggle:function () { if (!na) self.toggle(c, p[0], 0, p[1]); } };
      });
      var e = c.einde;
      var eindScope = e ? ('Wij doen nog: administratie ' + (e.adm < 0 ? 'niets meer' : 't/m ' + MONTHS[e.adm]) + ', btw ' + (e.btw < 0 ? 'geen' : 't/m Q' + (e.btw + 1)) + ', jaarwerk ' + JAAR + ' ' + (e.jw26 ? 'ja' : 'nee') + ', IB ' + JAAR + ' ' + (e.ib26 ? 'ja' : 'nee') + '.') : '';
      var draft = s.notes[c.id] !== undefined ? s.notes[c.id] : c.notities;
      var geg = [
        { k:'Contactpersoon', v:(c.voornaam + ' ' + c.achternaam).trim() || 'onbekend' },
        { k:'E-mailadres', v:c.email || 'onbekend' },
        { k:'Btw-nummer', v:c.btwnr || 'onbekend' },
        { k:'Btw-ID', v:c.btwid || 'onbekend' }
      ];
      geg = geg.concat([
        { k:'Rechtsvorm', v:c.rechtsvorm },
        { k:'Pakket', v:c.pakket },
        { k:'Facturen per jaar', v:String(c.facturen || 'onbekend') },
        { k:'Boekhoudpakket', v:c.software },
        { k:'Bank', v:c.bank },
        { k:'Verwerking', v: c.freq === 'maand' ? 'Per maand' : 'Per kwartaal' },
        { k:'Altijd up2date', v: c.up ? 'Ja, levert minimaal 1x per maand aan' : 'Nee' },
        { k:'Google review', v:c.review ? 'Ja, geplaatst' : 'Nog niet' },
        { k:'Klant vanaf', v:vanLabel(c) },
        { k:'Klant t/m', v: e ? e.datum + ' (' + e.reden + ')' : 'Actief' }
      ]);
      // Snel overzicht: alleen wat van toepassing is
      var snel = [{ k:'Rechtsvorm', v:c.rechtsvorm }, { k:'Verwerking', v: c.freq === 'maand' ? 'Per maand' : 'Per kwartaal' }];
      snel.push({ k:'btw', v: c.regime === 'Normaal' ? (c.btwMaand ? 'Aangifte per maand' : 'Aangifte per kwartaal') : c.regime });
      var auto = [];
      if (c.pers) auto.push('personenauto');
      if (c.best) auto.push('bestelauto' + (c.uzgb ? ' (UZGB)' : '') + (c.km ? ' (km-registratie)' : ''));
      if (!c.best && c.pers && c.km) auto[0] += ' (km-registratie)';
      if (auto.length) snel.push({ k:'Auto', v: auto.join(' en ').replace(/^./, function (x) { return x.toUpperCase(); }) });
      if (c.kmuzgb) snel.push({ k:'Let op', v:'KM/UZGB nog splitsen' });
      snel.push({ k:'Bank', v: c.bank === 'BK' ? 'Bankkoppeling (BK)' : c.bank === 'geen' ? 'Geen koppeling' : c.bank });
      if (c.up) snel.push({ k:'Up2date', v:'Levert minimaal 1x per maand aan' });
      snel.push({ k:'Software', v:c.software });
      var alleKenm = [{ k:'Btw-aangifte', v: c.btwMaand ? 'Per maand' : 'Per kwartaal' }, { k:'Btw-regime', v:c.regime }];
      KENM.forEach(function (k) { alleKenm.push({ k:k[1], v: c[k[0]] ? 'Ja' : 'Nee' }); });
      alleKenm.push({ k:'KM/UZGB nog splitsen', v: c.kmuzgb ? 'Ja' : 'Nee' }, { k:'Pand', v: c.pand || 'Nee' });
      var ownSaved = s.ownNotes[c.id] || '', ownDraft = s.ownDraft[c.id] !== undefined ? s.ownDraft[c.id] : ownSaved;
      d = {
        snel:snel, blokken:[0,1,2,3].map(function (qi) { var b = blok(c, qi); b.cls = qi === WQ ? 'qb cur' : 'qb'; if (qi === 0) b.tiles = [{ isGap:true, isTile:false, isSep:false }, { isSep:true, isTile:false, verborgen:true }].concat(b.tiles); return b; }),
        jaarTegels:[tegel(c, 'c25', 0, 'controle', 'Controle ' + vj()), tegel(c, 'jw25', 0, 'jaarwerk', 'Jaarwerk ' + vj()), tegel(c, 'ib25', 0, 'IB', 'IB-aangifte ' + vj())],
        ownDraft: ownDraft, ownInfo: s.ownDraft[c.id] !== undefined && s.ownDraft[c.id] !== ownSaved ? 'Niet opgeslagen' : (ownSaved ? 'Alleen voor jou zichtbaar' : ''),
        ownBtnCls: s.ownDraft[c.id] !== undefined && s.ownDraft[c.id] !== ownSaved ? 'btn primary' : 'btn',
        gegevens2: alleKenm,
        naam:c.naam, admin:c.admin, rechtsvorm:c.rechtsvorm, freq: c.freq === 'maand' ? 'Verwerking per maand' : 'Verwerking per kwartaal',
        freqUitleg: c.freq === 'maand' ? 'per maand verwerken' : 'per kwartaal: alleen jan, apr, jul en okt afvinken',
        vanaf: vanLabel(c),
        hasEinde: !!e, status:c.status, eindDatum: e ? e.datum : '', eindReden: e ? e.reden : '', eindScope:eindScope,
        hasBijz: !!c.bijz, bijz:c.bijz, kenm:kenm,
        werk: 'Bank: ' + c.bank + ' · ' + c.software + ' · ' + (c.up ? 'Altijd up2date (levert minimaal 1x per maand aan)' : 'Niet altijd up2date') + ' · Pakket ' + c.pakket,
        bij:bijLabel(c), quarters:quarters, year:year,
        noteDraft: draft, noteInfo: s.notes[c.id] !== undefined && s.notes[c.id] !== c.notities ? 'Niet opgeslagen' : (c.notities ? 'Zichtbaar voor het hele team' : ''),
        gegevens: geg,
        log: (STORE.live ? (s.logs[c.id] || []) : c.log).map(function (l) { return { wie:l.wie, wat:l.wat, wanneer:l.wanneer, init:initial(l.wie) }; })
      };
    }

    // ---- Werkvoorraad
    var wie = s.werkWie || (ADMINS.indexOf(role) >= 0 ? role : 'alle');
    var mijn = all.filter(function (c) { return lopend(c) && (wie === 'alle' || c.admin === wie); }).sort(function (a, b) { return a.naam.localeCompare(b.naam); });
    var openKl = function (c) { return function () { self.setState({ page:'klanten', sel:c.id, tab:'over' }); self.loadLog(c.id); }; };
    var wBtw = [];
    var vorm = function (c, w, late, dl, dlLabel, pillL, toggle) {
      var dg = dagenTot(dl);
      return { naam:c.naam, admin:initial(c.admin), toonAdmin: wie === 'alle', open:openKl(c), hasPill:true, pillL:pillL, pillCls: w ? 'pill wacht' : late ? 'pill late' : 'pill due', pillT:'Klik om af te vinken (volgens de klikstand)', toggle:toggle,
        info: w ? 'wacht op klant' : late ? 'deadline ' + (-dg) + (-dg === 1 ? ' dag' : ' dagen') + ' verstreken' : 'nog ' + dg + (dg === 1 ? ' dag' : ' dagen') + ', ' + dlLabel, sv: w ? 9e15 : dl.getTime(), email:c.email };
    };
    mijn.filter(function (c) { return BTWM && c.btwMaand && c.regime === 'Normaal'; }).forEach(function (c) { for (var i = 0; i < 12; i++) (function (i) {
      if (bmNa(c, i)) return;
      var w = bmWacht(c, i), late = bmLate(c, i), due = bmDue(c, i);
      if (!(late || due || w)) return;
      wBtw.push(vorm(c, w, late, bmDeadline(i), bmDlLabel(i), MONTHS[i], function () { self.toggle(c, 'bm', i, 'Btw ' + MONTHS[i]); }));
    })(i); });
    mijn.filter(function (c) { return !(BTWM && c.btwMaand); }).forEach(function (c) { [0,1,2,3].forEach(function (q) {
      var w = wk(c, 'btw' + (q + 1)) && !c.btw[q] && !btwNa(c, q), late = bLate(c, q), due = bDue(c, q);
      if (!(late || due || w)) return;
      var dl = btwDeadline(q), dg = dagenTot(dl);
      wBtw.push({ tiles:[], hasTiles:false, menu:function (ev) { self.openMenu(ev, c, 'btw', q, 'Btw Q' + (q + 1)); }, naam:c.naam, admin:initial(c.admin), toonAdmin: wie === 'alle', open:openKl(c), hasPill:true, pillL:'Q' + (q + 1), pillCls: w ? 'pill wacht' : late ? 'pill late' : 'pill due', pillT:'Klik om af te vinken (volgens de klikstand)', toggle:function () { self.toggle(c, 'btw', q, 'Btw Q' + (q + 1)); },
        info: w ? 'wacht op klant' : late ? 'deadline ' + (-dg) + (-dg === 1 ? ' dag' : ' dagen') + ' verstreken' : 'nog ' + dg + (dg === 1 ? ' dag' : ' dagen') + ', ' + btwDlLabel(q), sv: w ? 9e15 : dl.getTime(), email:c.email });
    }); });
    wBtw.sort(function (a, b) { return a.sv - b.sv || a.naam.localeCompare(b.naam); });
    var item = function (c, info, pill) {
      var o = { naam:c.naam, admin:initial(c.admin), toonAdmin: wie === 'alle', open:openKl(c), hasPill:!!pill, info:info, email:c.email, pillL:'', pillCls:'', pillT:'', toggle:function () {}, menu:function (ev) { ev.preventDefault(); }, tiles:[], hasTiles:false };
      if (pill) { o.pillL = pill.l; o.pillCls = pill.cls; o.pillT = pill.t; o.toggle = pill.click; o.menu = pill.menu; }
      return o;
    };
    var wAchter = mijn.filter(function (c) { return lateLabels(c).length; }).map(function (c) {
      var o = item(c, '');
      var tl = [];
      for (var i = 0; i < 12; i++) if (mLate(c, i)) {
        var t = c.freq === 'kwartaal' ? tegel(c, 'm', i, MONTHS[i] + '-' + MONTHS[Math.min(11, i + 2)], 'Administratie Q' + (Math.floor(i / 3) + 1)) : tegel(c, 'm', i, MONTHS[i], MONTHS[i]);
        if (c.freq === 'kwartaal') t.cls += ' kw';
        tl.push(t);
      }
      o.tiles = tl; o.hasTiles = true; o.info = tl.length + (c.freq === 'kwartaal' ? (tl.length === 1 ? ' kwartaal' : ' kwartalen') : (tl.length === 1 ? ' maand' : ' maanden')) + ' open';
      return o;
    });
    var wWacht = mijn.filter(heeftWacht).map(function (c) { return item(c, 'wacht op: ' + wachtLabels(c).join(', ')); });
    var veldOpen = function (c, k) { var v = c[k]; return v !== null && v !== undefined && !v && !(c.j25na && (k === 'c25' || k === 'jw25' || k === 'ib25')); };
    var veldToep = function (c, k) { var v = c[k]; return v !== null && v !== undefined && !(c.j25na && (k === 'c25' || k === 'jw25' || k === 'ib25')); };
    var lijstVeld = function (k, l, info) {
      return mijn.filter(function (c) { return veldOpen(c, k); }).map(function (c) { var t = tegel(c, k, 0, l, info); return item(c, wk(c, k) ? 'wacht op klant' : info + ' open', { l:t.l, cls:t.cls, t:t.t, click:t.click, menu:t.menu }); });
    };
    var ctrlKeys = []; for (var cq = 1; cq <= WQ; cq++) ctrlKeys.push(CTRL[cq - 1]);
    var wCtrl = [];
    ctrlKeys.forEach(function (k, n) { wCtrl = wCtrl.concat(lijstVeld(k, 'ctrl Q' + (n + 1), 'Controle Q' + (n + 1))); });
    var wC25 = lijstVeld('c25', 'controle', 'Controle ' + vj());
    var wJw = lijstVeld('jw25', 'jaarwerk', 'Jaarwerk ' + vj());
    var wIb = lijstVeld('ib25', 'IB', 'IB-aangifte ' + vj());
    wBtw.forEach(function (x) { if (!x.menu) x.menu = function (ev) { ev.preventDefault(); }; });
    var mePlain = STORE.live ? (s.me ? s.me.naam : '') : role;
    var herinnering = vulMail('aanlevering', standaardPeriode(), standaardUiterlijk(), mePlain);
    var wachtMails = wWacht.map(function (x) { return x.email; }).filter(Boolean);
    var vl = function (open, tot) { var pct = tot ? Math.round((tot - open) / tot * 100) : 100; return { vt: open + ' te doen van ' + tot, vpct: pct + '%', vbar: 'width: ' + pct + '%' }; };
    var telToep = function (f) { return mijn.filter(f).length; };
    var nCtrlTot = 0; ctrlKeys.forEach(function (k) { nCtrlTot += telToep(function (c) { return veldToep(c, k); }); });
    var btwKl = {}; wBtw.forEach(function (x) { btwKl[x.naam] = 1; });
    var sectie = function (id, titel, sub, items, leeg, v, actie) { return Object.assign({ id:id, titel:titel, sub:sub, n:items.length, items:items, hasItems:items.length > 0, leegTonen:items.length === 0, leeg:leeg, hasActie: !!actie && items.length > 0, actie: actie || {} }, v); };
    var werkSecties = [
      sectie('achter', '1. Administratie verwerken', 'achterstand ' + peilLabel(), wAchter, 'Alles verwerkt ' + peilLabel() + '.', vl(wAchter.length, mijn.length)),
      sectie('ctrl', '2. Kwartaalcontrole', ctrlKeys.length ? 'controle t/m Q' + WQ + ' nog open' : 'nog geen kwartaal om te controleren', wCtrl, 'Alle kwartaalcontroles zijn gedaan.', vl(wCtrl.length, nCtrlTot)),
      sectie('btw', '3. btw-aangiften', 'periode voorbij, op deadline gesorteerd', wBtw, 'Geen openstaande btw-aangiften.', vl(Object.keys(btwKl).length, telToep(function (c) { return c.regime === 'Normaal'; }))),
      sectie('c25', '4. Controle ' + vj(), 'jaarcontrole nog open', wC25, 'Alle jaarcontroles zijn gedaan.', vl(wC25.length, telToep(function (c) { return veldToep(c, 'c25'); }))),
      sectie('jw', '5. Jaarwerk ' + vj(), 'jaarrekening nog open', wJw, 'Alle jaarrekeningen zijn klaar.', vl(wJw.length, telToep(function (c) { return veldToep(c, 'jw25'); }))),
      sectie('ib', '6. IB-aangifte ' + vj(), 'aangifte nog open', wIb, 'Alle IB-aangiften zijn gedaan.', vl(wIb.length, telToep(function (c) { return veldToep(c, 'ib25'); }))),
      sectie('wacht', 'Wacht op klant', 'stukken nog niet aangeleverd', wWacht, 'Bij niemand wachten we op stukken.', vl(wWacht.length, mijn.length), { l:'Herinnering mailen (BCC)', href: mailtoLink(wachtMails, herinnering.s, herinnering.b), t: wachtMails.length + ' e-mailadressen' })
    ];
    werkSecties[werkSecties.length - 1].vt = wWacht.length + ' klanten';
    werkSecties[werkSecties.length - 1].geenBalk = true;
    werkSecties.forEach(function (x) { x.toonBalk = !x.geenBalk; });
    var teamM = [['n','Klanten'],['achter','Achterstand'],['ctrl','Kw.controle open'],['btwLaat','Btw te laat'],['c25','Controle ' + vj()],['jw','Jaarwerk ' + vj()],['ib','IB ' + vj()],['wacht','Wacht op klant']];
    var teamRaw = ADMINS.map(function (a) {
      var kl = all.filter(function (c) { return lopend(c) && c.admin === a; });
      var cnt = function (f) { return kl.filter(f).length; };
      return { ctrl:cnt(function (c) { return ctrlKeys.some(function (k) { return veldOpen(c, k); }); }), c25:cnt(function (c) { return veldOpen(c, 'c25'); }), a:a, n:kl.length, achter:cnt(isAchter), btwLaat:cnt(function (c) { return [0,1,2,3].some(function (q) { return bLate(c, q); }); }), btwNu:cnt(function (c) { return [0,1,2,3].some(function (q) { return bDue(c, q); }); }), wacht:cnt(heeftWacht), jw:cnt(function (c) { return veldOpen(c, 'jw25'); }), ib:cnt(function (c) { return veldOpen(c, 'ib25'); }) };
    });
    var teamMax = {}; teamM.forEach(function (m) { teamMax[m[0]] = Math.max(1, Math.max.apply(null, teamRaw.map(function (r) { return r[m[0]]; }))); });
    var team = teamRaw.map(function (r) { return { a:r.a, init:initial(r.a), pick:function () { self.setState({ werkWie:r.a }); }, cls: wie === r.a ? 'teamrow on' : 'teamrow', cells: teamM.map(function (m) { return { v:r[m[0]], bar:'width: ' + Math.round(r[m[0]] / teamMax[m[0]] * 100) + '%; background: ' + (m[0] === 'n' ? '#D9D9D9' : m[0] === 'wacht' ? '#7FA3D6' : m[0] === 'btwLaat' || m[0] === 'achter' ? '#C0392B' : '#FF8000') }; }) }; });
    var exportWerk = function () {
      var sh = werkSecties.map(function (sc) { return { name:sc.titel, rows:[['Klant','Administrateur','Wat']].concat(sc.items.map(function (x) { return [x.naam, x.admin, (x.pillL ? x.pillL + ': ' : '') + x.info]; })) }; });
      if (beheer) sh.unshift({ name:'Team', rows:[['Collega'].concat(teamM.map(function (m) { return m[1]; }))].concat(teamRaw.map(function (r) { return [r.a].concat(teamM.map(function (m) { return r[m[0]]; })); })) });
      downloadXlsx('Werkvoorraad ' + (wie === 'alle' ? 'iedereen' : wie) + ' ' + vandaagIso() + '.xlsx', sh);
    };
    var exportKlanten = function () {
      var kop = ['Klant','Status','Verwerking','Administrateur','Bank'].concat(MONTHS).concat(['Btw-aangifte','Btw Q1','Btw Q2','Btw Q3','Btw Q4']).concat(['Controle t/m Q2','Controle t/m Q3','Controle ' + vj(),'Jaarwerk ' + vj(),'IB ' + vj(),'Achterstand','Wacht op klant','Kenmerken','Pakket','Facturen per jaar','Rechtsvorm','Boekhoudpakket','E-mailadres','Voornaam','Achternaam','Btw-nummer','Bijzonderheden','Teamnotities']);
      var yn = function (v) { return v === null ? 'n.v.t.' : v ? 'Gedaan' : 'Open'; };
      var rijen = list.map(function (c) {
        return [c.naam, c.status, c.freq === 'kwartaal' ? 'Per kwartaal' : 'Per maand', c.admin, c.bank]
          .concat(c.months.map(function (d, i) { return stTekst(d, mNa(c, i), wk(c, 'm' + (i + 1)), mLate(c, i)); }))
          .concat([c.regime !== 'Normaal' ? 'Geen' : c.btwMaand ? 'Per maand' : 'Per kwartaal'])
          .concat([0,1,2,3].map(function (q) { return stTekst(bOn(c, q), btwNa(c, q), bWacht(c, q), bLate(c, q)); }))
          .concat([yn(c.cq2), yn(c.cq3), yn(c.c25), yn(c.jw25), yn(c.ib25), isAchter(c) ? 'Ja' : 'Nee', heeftWacht(c) ? wachtLabels(c).join(', ') : '',
            kenmList(c).map(function (k) { return k.l; }).join(', '), c.pakket, c.facturen === '' ? '' : Number(c.facturen), c.rechtsvorm, c.software, c.email, c.voornaam, c.achternaam, c.btwnr, c.bijz, c.notities]);
      });
      downloadXlsx('Klanten ' + slug(viewTitleTxt) + ' ' + JAAR + ' ' + vandaagIso() + '.xlsx', [{ name:'Klanten ' + JAAR, rows:[kop].concat(rijen) }]);
    };
    var mailVul = function (t) { var m = vulMail(t, s.mailPeriode, s.mailUiterlijk, mePlain); self.setState({ mailT:t, mailS:m.s, mailB:m.b, copiedTxt:false }); };

    // ---- Jaarwerk
    var jwWie = s.jwWie || (ADMINS.indexOf(role) >= 0 ? role : 'alle');
    var jwBasis = all.filter(function (c) { return (lopend(c) || c.status === 'Opgezegd') && !c.j25na && (c.jw25 !== null || c.ib25 !== null || c.c25 !== null); });
    var jwVan = jwBasis.filter(function (c) { return jwWie === 'alle' || c.admin === jwWie; });
    var isOpen = function (v) { return v !== null && v !== undefined && !v; };
    var jwOpenF = function (c) { return isOpen(c.c25) || isOpen(c.jw25) || isOpen(c.ib25); };
    var jwPas = { alles:function () { return true; }, open:jwOpenF, klaar:function (c) { return !jwOpenF(c); }, ctrl:function (c) { return isOpen(c.c25); }, jw:function (c) { return isOpen(c.jw25); }, ib:function (c) { return isOpen(c.ib25); } };
    var jwLijst = jwVan.filter(jwPas[s.jwF] || jwOpenF).sort(function (x, y) { return x.naam.localeCompare(y.naam); });
    var telK = function (lst, k) { var n = lst.filter(function (c) { return c[k] !== null && c[k] !== undefined; }); return { klaar: n.filter(function (c) { return !!c[k]; }).length, tot: n.length }; };
    var jwStat = [['c25', 'Controle ' + vj()], ['jw25', 'Jaarwerk ' + vj()], ['ib25', 'IB-aangifte ' + vj()]].map(function (x) {
      var t = telK(jwVan, x[0]), pct = t.tot ? Math.round(t.klaar / t.tot * 100) : 100;
      return { l:x[1], v:t.klaar + ' van ' + t.tot, pct:pct + '%', bar:'width: ' + pct + '%' };
    });
    var jwRows = jwLijst.map(function (c) {
      return { naam:c.naam, init:initial(c.admin), open:function () { self.setState({ page:'klanten', sel:c.id, tab:'over' }); self.loadLog(c.id); },
        tiles:[tegel(c, 'c25', 0, 'Controle', 'Controle ' + vj()), tegel(c, 'jw25', 0, 'Jaarwerk', 'Jaarwerk ' + vj()), tegel(c, 'ib25', 0, 'IB', 'IB-aangifte ' + vj())],
        status: c.status !== 'Actief' ? c.status : '', hasStatus: c.status !== 'Actief', notitie: c.notities || '' };
    });
    var jwSeg = function (id) { return s.jwF === id ? 'seg on' : 'seg'; };

    // ---- Rechtsklikmenu
    var mn = s.menu, menuC = mn ? all.filter(function (c) { return c.id === mn.cid; })[0] : null;
    var menuItems = [];
    if (mn && menuC) {
      menuItems.push({ l:'Gedaan', dot:'mdot d', pick:function () { self.setStatus(menuC, mn.key, mn.idx, 'gedaan', mn.label); self.setState({ menu:null }); } });
      if (mn.wacht) menuItems.push({ l:'Wacht op klant', dot:'mdot w', pick:function () { self.setStatus(menuC, mn.key, mn.idx, 'wacht', mn.label); self.setState({ menu:null }); } });
      menuItems.push({ l:'Terug naar open', dot:'mdot o', pick:function () { self.setStatus(menuC, mn.key, mn.idx, 'open', mn.label); self.setState({ menu:null }); } });
    }

    var ef = emptyForm();
    var setF = function (k, chk) { return function (ev) { var v = chk ? ev.target.checked : ev.target.value; self.setState(function (st) { var f = Object.assign({}, st.form); f[k] = v; return { form:f }; }); }; };
    var on = {};
    Object.keys(ef).forEach(function (k) { on[k] = setF(k, typeof ef[k] === 'boolean'); });
    on.pakket = function (ev) { var v = ev.target.value; self.setState(function (st) { var f = Object.assign({}, st.form); f.pakket = v; f.facturen = FACT[v] ? String(FACT[v]) : ''; return { form:f }; }); };
    var setSub = function (obj, k, chk) { return function (ev) { var v = chk ? ev.target.checked : ev.target.value; self.setState(function (st) { var o = Object.assign({}, st[obj]); o[k] = v; var r = {}; r[obj] = o; if (obj === 'sf') r.copied = false; return r; }); }; };
    var onMut = { admin:setSub('mut', 'admin') };
    var onStop = { datum:setSub('stop', 'datum'), reden:setSub('stop', 'reden'), adm:setSub('stop', 'adm'), btw:setSub('stop', 'btw'), jw26:setSub('stop', 'jw26', true), ib26:setSub('stop', 'ib26', true) };
    var onSf = {}; Object.keys(emptySf()).forEach(function (k) { onSf[k] = setSub('sf', k); });

    var mq = s.mq.trim().toLowerCase();
    var mlist = all.filter(function (c) { return !mq || c.naam.toLowerCase().indexOf(mq) >= 0; }).sort(function (a, b) { return a.naam.localeCompare(b.naam); })
      .map(function (c) { return { naam:c.naam, info:c.admin + ' · ' + c.status, cls: s.mutSel === c.id ? 'pick on' : 'pick', pick:function () { self.setState({ mutSel:c.id, mutMode:'menu', mutMsg:'', editId:null }); } }; });
    var mC = all.filter(function (c) { return c.id === s.mutSel; })[0] || null;
    var m = { naam:'', info:'' };
    if (mC) {
      var open25 = [];
      if (!mC.j25na && mC.jw25 === false) open25.push('jaarwerk ' + vj());
      if (!mC.j25na && mC.ib25 === false) open25.push('IB-aangifte ' + vj());
      m = { naam:mC.naam, info:mC.admin + ' · ' + mC.rechtsvorm + ' · ' + mC.status + ' · klant sinds ' + vanLabel(mC) + (mC.einde ? ' · einde ' + mC.einde.datum : ''),
        kanStoppen: mC.status === 'Actief', isOpgezegd: mC.status === 'Opgezegd', kanTerug: mC.status !== 'Actief',
        hasOpen25: open25.length > 0, open25: open25.join(' en ') + ' staat nog open en blijft gewoon in de overzichten staan tot het is afgevinkt.' };
    }
    var isEdit = s.bsub === 'muteren' && s.mutMode === 'edit';

    var selList = all.filter(function (c) { return sfMatch(c, s.sf); }).sort(function (a, b) { return a.naam.localeCompare(b.naam); });
    var mails = selList.map(function (c) { return c.email; }).filter(Boolean);
    var activeCols = COLS.filter(function (cl) { return s.cols[cl[0]]; });
    if (!activeCols.length) activeCols = [COLS[0]];
    var prevCells = activeCols.map(function (cl) { return { v:cl[1], cls:'hcell' }; });
    selList.forEach(function (c) { activeCols.forEach(function (cl) { prevCells.push({ v:String(c[cl[0]] || ''), cls:'cell' }); }); });

    var bCls = function (id) { return s.bsub === id ? 'sub on' : 'sub'; };
    var goSub = function (id) { return function () { self.setState({ bsub:id, mutMode:'menu', editId:null, err:'', mutMsg:'', form: id === 'nieuw' ? emptyForm() : s.form }); }; };

    var ANA = [], ACTIEF = [];
    for (var yy = JAAR - 4; yy <= JAAR; yy++) ANA.push({ y: String(yy) + (yy === JAAR ? '*' : ''), yr: yy, n: all.filter(function (c) { return c.vanY == yy; }).length, s: all.filter(function (c) { return c.stopY == yy; }).length });
    var actNu = all.filter(lopend).length;
    ACTIEF.unshift({ y: 'nu', v: actNu });
    for (var ai = ANA.length - 1; ai >= 0; ai--) ACTIEF.unshift({ y: String(ANA[ai].yr - 1), v: ACTIEF[0].v - ANA[ai].n + ANA[ai].s });
    var maxV = Math.max(5, Math.max.apply(null, ANA.map(function (a) { return Math.max(a.n, a.s); }))) * 1.1;
    var ana = ANA.map(function (a) {
      var net = a.n - a.s;
      return { y:a.y, n:a.n, s:a.s, net:(net > 0 ? '+' : '') + net,
        hN:'height: ' + Math.round(a.n / maxV * 200) + 'px; background: #FF8000', hS:'height: ' + Math.max(2, Math.round(a.s / maxV * 200)) + 'px; background: #6B6B6B',
        tN: a.y + ': ' + a.n + ' nieuwe klanten', tS: a.y + ': ' + a.s + ' gestopt' };
    });
    var maxA = Math.max(5, Math.max.apply(null, ACTIEF.map(function (a) { return a.v; }))) * 1.1;
    var act = ACTIEF.map(function (a, i) { var g = i ? a.v - ACTIEF[i - 1].v : null; return { y:a.y, v:a.v, g: g === null ? '' : (g >= 0 ? '+' : '') + g, h:'height: ' + Math.round(a.v / maxA * 200) + 'px; background: #2B2B2B', t: a.y + ': ' + a.v + ' actieve klanten' }; });
    var sumN = ANA.reduce(function (t, a) { return t + a.n; }, 0), sumS = ANA.reduce(function (t, a) { return t + a.s; }, 0);
    // Start- en einddatum per klant
    var startD = function (c) { var y = parseInt(c.vanY, 10); if (!y) return null; var q = parseInt(c.vanQ, 10); return new Date(y, (isNaN(q) ? 0 : q) * 3, 1); };
    var stopD = function (c) {
      if (c.einde && c.einde.datum) { var d = new Date(c.einde.datum); if (!isNaN(d)) return d; }
      if (c.status === 'Gestopt') { var y = parseInt(c.stopY, 10); return y ? new Date(y, 11, 31, 23, 59) : new Date(1900, 0, 1); }
      return null;
    };
    var actiefOp = function (dt) { return all.filter(function (c) { var sd = startD(c), ed = stopD(c); return (!sd || sd <= dt) && (!ed || ed > dt); }).length; };
    var eersteJaar = Math.max(2015, Math.min.apply(null, all.map(function (c) { return parseInt(c.vanY, 10) || 9999; }).concat([2020])));
    var punten = [];
    for (var py = eersteJaar; py <= 2025; py++) punten.push({ l:String(py), v:actiefOp(new Date(py, 11, 31, 23, 59)) });
    var kwRijen = [];
    for (var ky = 2026; ky <= VANDAAG.getFullYear(); ky++) for (var kq = 0; kq < 4; kq++) {
      var kb = new Date(ky, kq * 3, 1), ke = new Date(ky, kq * 3 + 3, 0, 23, 59);
      if (kb > VANDAAG) break;
      var lopendQ = ke > VANDAAG, peilD = lopendQ ? VANDAAG : ke;
      var nNieuw = all.filter(function (c) { var sd = startD(c); return sd && sd >= kb && sd <= ke; }).length;
      var nStop = all.filter(function (c) { var ed = stopD(c); return ed && ed >= kb && ed <= ke && ed <= VANDAAG && ed.getFullYear() > 1900; }).length;
      var nAct = actiefOp(peilD);
      punten.push({ l:'Q' + (kq + 1) + ' ' + String(ky).slice(2), v:nAct });
      kwRijen.push({ p:'Q' + (kq + 1) + ' ' + ky + (lopendQ ? '*' : ''), n:nNieuw, s:nStop, net:(nNieuw - nStop > 0 ? '+' : '') + (nNieuw - nStop), a:nAct });
    }
    var lijnSvg = (function () {
      if (punten.length < 2) return '';
      var W = 900, H = 280, L = 44, R = 20, T = 34, B = 44;
      var vs = punten.map(function (p) { return p.v; }), mx = Math.max.apply(null, vs), mn = Math.min.apply(null, vs);
      var rng = Math.max(4, mx - mn), stap = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500].filter(function (s2) { return rng / s2 <= 4; })[0] || 1000;
      var lo = Math.max(0, Math.floor(mn / stap) * stap - (mn - Math.floor(mn / stap) * stap < stap / 2 ? stap : 0)), hi = Math.ceil(mx / stap) * stap + stap;
      var x = function (i) { return L + i * (W - L - R) / (punten.length - 1); }, y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
      var g = '';
      for (var gv = lo; gv <= hi + 0.001; gv += stap) { var gy = y(gv); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" stroke="#EEEAE5"/><text x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="#8E8E8E">' + Math.round(gv) + '</text>'; }
      var splits = punten.findIndex(function (p) { return p.l.charAt(0) === 'Q'; });
      if (splits > 0) { var sx = (x(splits - 1) + x(splits)) / 2; g += '<line x1="' + sx + '" x2="' + sx + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#D0CCC6" stroke-dasharray="4 4"/><text x="' + (sx + 6) + '" y="' + (T - 14) + '" font-size="11" fill="#8E8E8E">vanaf 2026 per kwartaal</text><text x="' + (sx - 6) + '" y="' + (T - 14) + '" font-size="11" fill="#8E8E8E" text-anchor="end">per jaareinde</text>'; }
      var pts = punten.map(function (p, i) { return x(i) + ',' + y(p.v); }).join(' ');
      g += '<polyline points="' + pts + '" fill="none" stroke="#FF8000" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
      punten.forEach(function (p, i) { g += '<circle cx="' + x(i) + '" cy="' + y(p.v) + '" r="4.5" fill="#fff" stroke="#FF8000" stroke-width="2.5"/><text x="' + x(i) + '" y="' + (y(p.v) - 11) + '" text-anchor="middle" font-size="12" font-weight="700" fill="#2B2B2B">' + p.v + '</text><text x="' + x(i) + '" y="' + (H - B + 20) + '" text-anchor="middle" font-size="11.5" font-weight="600" fill="#5E5E5E">' + p.l + '</text>'; });
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" font-family="Plus Jakarta Sans, Arial, sans-serif">' + g + '</svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    })();

    return {
      isDemo: !STORE.live, isLive: STORE.live,
      showAuth: STORE.live && s.phase === 'auth', showLoading: STORE.live && s.phase === 'loading', showApp: s.phase === 'app',
      loadingText: 'Gegevens laden...',
      connCls: s.conn === 'live' ? 'mini' : 'mini o', connLabel: s.conn === 'live' ? 'Live' : (s.conn === 'offline' ? 'Geen verbinding' : 'Verbinden...'),
      connTitle: s.conn === 'live' ? 'Wijzigingen van collega’s verschijnen automatisch' : 'Ververs de pagina als dit zo blijft',
      userLabel: s.me ? s.me.naam + (s.me.rol === 'beheer' ? ' · beheer' : '') : '',
      logout: function () { STORE.signOut(); },
      hasSaveErr: !!s.saveErr, saveErr: s.saveErr,
      demoResetLabel: s.demoAsk ? 'Klik nogmaals: demo terugzetten' : 'Demogegevens terugzetten',
      demoReset: function () { if (!s.demoAsk) { self.setState({ demoAsk:true }); return; } try { localStorage.removeItem(DEMO_KEY); } catch (x) {} self.setState({ clients:SEED, demoAsk:false, sel:null, mutSel:null }); },
      auth: s.auth,
      onAuth: { email: function (ev) { self.setState({ auth:Object.assign({}, self.state.auth, { email:ev.target.value }) }); }, pw: function (ev) { self.setState({ auth:Object.assign({}, self.state.auth, { pw:ev.target.value }) }); }, pw2: function (ev) { self.setState({ auth:Object.assign({}, self.state.auth, { pw2:ev.target.value }) }); } },
      authTitle: s.authMode === 'newpw' ? 'Kies je wachtwoord' : s.authMode === 'forgot' ? 'Wachtwoord vergeten' : s.authMode === 'mfa' ? 'Code invoeren' : s.authMode === 'enroll' ? 'Tweestapsverificatie instellen' : 'Inloggen',
      authSub: s.authMode === 'newpw' ? 'Minimaal 10 tekens. Je gebruikt dit wachtwoord voortaan om in te loggen.' : s.authMode === 'forgot' ? 'Je ontvangt een mail met een link om een nieuw wachtwoord te kiezen.' : s.authMode === 'mfa' ? 'Open je authenticator-app en vul de code van 6 cijfers in.' : s.authMode === 'enroll' ? 'Eenmalig: koppel je telefoon. Scan de QR-code met Microsoft Authenticator of Google Authenticator en vul de code in die de app toont.' : 'Klantdashboard PoortEijk ZZP',
      authAskEmail: s.authMode === 'login' || s.authMode === 'forgot', authAskPw: s.authMode === 'login' || s.authMode === 'newpw', authAskPw2: s.authMode === 'newpw',
      authAskOnth: s.authMode === 'login', onth: s.onth, onOnth: function (ev) { self.setState({ onth:ev.target.checked }); },
      authAskCode: s.authMode === 'mfa' || (s.authMode === 'enroll' && !!s.mfa), code: s.code, onCode: function (ev) { self.setState({ code:ev.target.value.replace(/\D/g, '').slice(0, 6) }); },
      authShowQr: s.authMode === 'enroll' && !!s.mfa, mfaQr: s.mfa && s.mfa.qr ? s.mfa.qr : '', mfaSecret: s.mfa && s.mfa.secret ? s.mfa.secret : '',
      authPwLabel: s.authMode === 'newpw' ? 'Nieuw wachtwoord' : 'Wachtwoord', authPwAuto: s.authMode === 'newpw' ? 'new-password' : 'current-password',
      authBtn: s.authMode === 'newpw' ? 'Wachtwoord opslaan' : s.authMode === 'forgot' ? 'Stuur mail' : s.authMode === 'mfa' ? 'Bevestigen' : s.authMode === 'enroll' ? 'Koppelen en inloggen' : 'Inloggen',
      hasAuthMsg: !!s.authMsg, authMsg: s.authMsg, authMsgStyle: s.authOk ? 'background: #F1EFEC; color: #2B2B2B' : 'background: #FFF2E5; color: #8A3F00',
      authCanForgot: s.authMode !== 'newpw', authForgotLabel: s.authMode === 'forgot' ? 'Terug naar inloggen' : (s.authMode === 'mfa' || s.authMode === 'enroll') ? 'Uitloggen' : 'Wachtwoord vergeten?',
      authForgot: function () { if (s.authMode === 'mfa' || s.authMode === 'enroll') { STORE.signOut(); return; } self.setState({ authMode: s.authMode === 'forgot' ? 'login' : 'forgot', authMsg:'' }); },
      authSubmit: function (ev) {
        ev.preventDefault();
        var a = self.state.auth;
        if (s.authMode === 'login') {
          self.setState({ authMsg:'Bezig...', authOk:true });
          STORE.signIn(a.email.trim(), a.pw, s.onth).then(function () { self.setState({ authMsg:'', auth:{ email:a.email, pw:'', pw2:'' } }); }).catch(function (e) { self.setState({ authMsg:e.message, authOk:false }); });
        } else if (s.authMode === 'mfa' || s.authMode === 'enroll') {
          if (!s.mfa || !s.mfa.factorId) return;
          if (s.code.length !== 6) { self.setState({ authMsg:'Vul de code van 6 cijfers in.', authOk:false }); return; }
          self.setState({ authMsg:'Bezig...', authOk:true });
          STORE.verify(s.mfa.factorId, s.code).then(function () { self.setState({ code:'', authMsg:'' }); }).catch(function (e) { self.setState({ authMsg:e.message, authOk:false, code:'' }); });
        } else if (s.authMode === 'forgot') {
          STORE.resetPw(a.email.trim()).then(function () { self.setState({ authMsg:'Als dit e-mailadres bekend is, staat er een mail met een link in je inbox.', authOk:true }); }).catch(function (e) { self.setState({ authMsg:e.message, authOk:false }); });
        } else {
          if (a.pw.length < 10) { self.setState({ authMsg:'Kies een wachtwoord van minimaal 10 tekens.', authOk:false }); return; }
          if (a.pw !== a.pw2) { self.setState({ authMsg:'De twee wachtwoorden zijn niet gelijk.', authOk:false }); return; }
          STORE.setPw(a.pw).then(function () { self.setState({ auth:{ email:'', pw:'', pw2:'' }, authMsg:'' }); }).catch(function (e) { self.setState({ authMsg:e.message, authOk:false }); });
        }
      },
      isBeheer: beheer,
      roleInitial: initial(role),
      jaarLabel: String(JAAR), vjLabel: String(vj()),
      jaren: s.jaren.map(function (y) { return { v:String(y), l:String(y) }; }), jaarSel: String(s.jaar), onJaar: function (ev) { self.kiesJaar(ev.target.value); },
      noop: function (ev) { ev.stopPropagation(); },
      hasMenu: !!(mn && menuC), menuPos: mn ? 'left: ' + mn.x + 'px; top: ' + mn.y + 'px' : '', menuTitel: mn && menuC ? menuC.naam + ' · ' + mn.label : '', menuItems: menuItems,
      wqLabel: 'Q' + (WQ + 1) + ' ' + JAAR, wqSub: (WQ > 0 ? 'controle Q' + WQ + ' · ' : '') + 'administratie · btw Q' + (WQ + 1) + ' ' + btwDlLabel(WQ),
      prevKop: WQ > 0 ? 'Eerdere kwartalen' : '', hasPrevKol: WQ > 0,
      prevAllesOpen: function () { var o = {}, alles = true; for (var i = 0; i < WQ; i++) if (!(s.openQ && s.openQ[i])) alles = false; for (var j = 0; j < WQ; j++) o[j] = !alles; self.setState({ openQ:o }); },
      prevAllesLabel: (function () { for (var i = 0; i < WQ; i++) if (!(s.openQ && s.openQ[i])) return 'alles openklappen'; return 'alles dichtklappen'; })(),
      navJwCls: s.page === 'jaarwerk' ? 'ri on' : 'ri', goJw: function () { self.setState({ page:'jaarwerk' }); }, pageJw: s.page === 'jaarwerk',
      navSelCls: s.page === 'sel' ? 'ri on' : 'ri', goSel: function () { self.setState({ page:'sel' }); }, pageSel: s.page === 'sel',
      jwTitel: 'Jaarwerk en IB ' + vj(), jwStat: jwStat, jwRows: jwRows, jwLeeg: jwRows.length === 0, jwCount: jwRows.length + ' klanten',
      jwWie: jwWie, onJwWie: function (ev) { self.setState({ jwWie:ev.target.value }); },
      jwKnoppen: [['ctrl','Controle open'],['jw','Jaarwerk open'],['ib','IB open'],['open','Alles wat open is'],['klaar','Klaar'],['alles','Alle klanten']].map(function (x) { return { l:x[0] === 'alles' || x[0] === 'open' || x[0] === 'klaar' ? x[1] : x[1], n: jwVan.filter(jwPas[x[0]]).length, cls: s.jwF === x[0] ? 'jwknop on' : 'jwknop', pick:function () { self.setState({ jwF:x[0] }); } }; }),
      jwSegOpen: jwSeg('open'), jwSegKlaar: jwSeg('klaar'), jwSegAlles: jwSeg('alles'),
      jwOpen: function () { self.setState({ jwF:'open' }); }, jwKlaar: function () { self.setState({ jwF:'klaar' }); }, jwAlles: function () { self.setState({ jwF:'alles' }); },
      kmGedaanCls: s.klikMode === 'gedaan' ? 'seg on' : 'seg', kmWachtCls: s.klikMode === 'wacht' ? 'seg on blauw' : 'seg',
      kmGedaan: function () { self.setState({ klikMode:'gedaan' }); }, kmWacht: function () { self.setState({ klikMode:'wacht' }); },
      navWerkCls: s.page === 'werk' ? 'ri on' : 'ri', goWerk: function () { self.setState({ page:'werk' }); }, pageWerk: s.page === 'werk',
      werkWie: wie, onWerkWie: function (ev) { self.setState({ werkWie:ev.target.value }); },
      werkTitel: wie === 'alle' ? 'Werkvoorraad van iedereen' : (wie === role ? 'Mijn werkvoorraad' : 'Werkvoorraad van ' + wie),
      werkSub: mijn.length + ' lopende klanten · administratie telt als achterstand ' + peilLabel() + ' · ' + JAAR,
      werkSecties: werkSecties, exportWerk: exportWerk, exportKlanten: exportKlanten,
      team: team, teamKop: teamM.map(function (m) { return { l:m[1] }; }), toonTeam: beheer,
      bJaarCls: bCls('jaar'), bJaar: goSub('jaar'), showJaar: s.bsub === 'jaar',
      volgendJaar: String(s.jaar + 1), huidigJaar: String(s.jaar),
      jaarBtn: s.jaarAsk ? 'Klik nogmaals om ' + (s.jaar + 1) + ' echt te starten' : 'Jaar ' + (s.jaar + 1) + ' starten',
      jaarStart: function () { if (!s.jaarAsk) { self.setState({ jaarAsk:true, jaarMsg:'' }); return; } self.startJaar(); },
      hasJaarMsg: !!s.jaarMsg, jaarMsg: s.jaarMsg,
      peilSel: PEIL_HANDMATIG === null || PEIL_HANDMATIG === undefined ? 'auto' : String(PEIL_HANDMATIG),
      onPeil: function (ev) { self.zetPeil(ev.target.value); },
      peilNu: peilLabel(), peilAuto: PEIL_HANDMATIG === null || PEIL_HANDMATIG === undefined,
      roles: ADMINS.map(function (a) { return { l: a === 'Jeroen' ? 'Jeroen · beheer' : a, cls: role === a ? 'seg on' : 'seg', pick:function () { self.setState(a === 'Jeroen' ? { role:a, werkWie:null } : { role:a, werkWie:null, page: s.page === 'beheer' ? 'werk' : s.page }); } }; }),
      bankF: s.bankF, onBankF: function (ev) { self.setState({ bankF:ev.target.value }); },
      adminF: s.adminF, onAdminF: function (ev) { self.setState({ adminF:ev.target.value, scope:'alle' }); },
      sortBy: sortBy, arrow: arrow,
      navKlantCls: s.page === 'klanten' ? 'ri on' : 'ri', navBeheerCls: s.page === 'beheer' ? 'ri on' : 'ri',
      goKlanten: function () { self.setState({ page:'klanten' }); }, goBeheer: function () { self.setState({ page:'beheer' }); },
      pageKlanten: s.page === 'klanten', pageBeheer: beheer && s.page === 'beheer',

      scopeAllCls: s.scope === 'alle' ? 'seg sterk on' : 'seg sterk', scopeMijnCls: s.scope === 'mijn' ? 'seg sterk on' : 'seg sterk', scopeTekst: s.scope === 'mijn' ? 'Je ziet: alleen jouw klanten' : 'Je ziet: alle klanten van iedereen',
      scopeAllN: all.filter(function (c) { return lopend(c) && (s.bankF === 'alle' || c.bank === s.bankF); }).length, scopeMijnN: all.filter(function (c) { return lopend(c) && c.admin === role && (s.bankF === 'alle' || c.bank === s.bankF); }).length,
      scopeAll: function () { self.setState({ scope:'alle' }); }, scopeMijn: function () { self.setState({ scope:'mijn', adminF:'alle' }); },
      q:s.q, onQ:function (ev) { self.setState({ q:ev.target.value }); },
      kpis:kpis, breakdown:breakdown, verloop:verloop, verloopTitel: 'Lopend kwartaal Q' + (WQ + 1) + ' voor deze ' + list.length + ' klanten',
      viewTitle: viewTitleTxt,
      viewCount: list.length + (list.length === 1 ? ' klant' : ' klanten'),
      rows:rows, noRows: rows.length === 0,
      showEmpty: !selC, showDetail: !!selC, hasSel: !!selC, d:d,
      tOver: s.tab === 'over', tGeg: s.tab === 'geg', tHist: s.tab === 'hist',
      tabOverCls: s.tab === 'over' ? 'ptab on' : 'ptab', tabGegCls: s.tab === 'geg' ? 'ptab on' : 'ptab', tabHistCls: s.tab === 'hist' ? 'ptab on' : 'ptab',
      tabOver:function () { self.setState({ tab:'over' }); }, tabGeg:function () { self.setState({ tab:'geg' }); }, tabHist:function () { self.setState({ tab:'hist' }); },
      closePanel:function () { self.setState({ sel:null }); },
      onNote:function (ev) { var v = ev.target.value; self.setState(function (st) { var n = Object.assign({}, st.notes); n[st.sel] = v; return { notes:n }; }); },
      noteBtnCls: selC && s.notes[selC.id] !== undefined && s.notes[selC.id] !== selC.notities ? 'btn primary' : 'btn',
      onOwn:function (ev) { var v = ev.target.value; self.setState(function (st) { var n = Object.assign({}, st.ownDraft); n[st.sel] = v; return { ownDraft:n }; }); },
      saveOwn:function () {
        if (!selC || s.ownDraft[selC.id] === undefined) return;
        var id = selC.id, v = s.ownDraft[id];
        var done = function () { self.setState(function (st) { var o = Object.assign({}, st.ownNotes), dr = Object.assign({}, st.ownDraft); if (v) o[id] = v; else delete o[id]; delete dr[id]; return { ownNotes:o, ownDraft:dr }; }); };
        if (STORE.live) STORE.saveOwnNote(id, v).then(done).catch(function (e) { self.setState({ saveErr:'Eigen notitie opslaan mislukt: ' + e.message }); });
        else { try { var all2 = JSON.parse(localStorage.getItem('pz-eigen-' + role) || '{}'); if (v) all2[id] = v; else delete all2[id]; localStorage.setItem('pz-eigen-' + role, JSON.stringify(all2)); } catch (x) {} done(); }
      },
      saveNote:function () {
        if (!selC || s.notes[selC.id] === undefined) return;
        var v = s.notes[selC.id], id = selC.id;
        self.upd(id, function (n) { n.notities = v; }, 'Teamnotitie bijgewerkt');
        self.setState(function (st) { var n = Object.assign({}, st.notes); delete n[id]; return { notes:n }; });
      },
      muteerSel:function () { if (selC) self.setState({ page:'beheer', bsub:'muteren', mutSel:selC.id, mutMode:'menu', mutMsg:'' }); },

      bNieuwCls:bCls('nieuw'), bMutCls:bCls('muteren'), bSelCls:bCls('sel'), bAnaCls:bCls('ana'),
      bNieuw:goSub('nieuw'), bMut:goSub('muteren'), bSel:goSub('sel'), bAna:goSub('ana'),
      showForm: s.bsub === 'nieuw' || isEdit, isEdit:isEdit,
      factLocked: !!FACT[s.form.pakket], factStyle: FACT[s.form.pakket] ? 'background: #F1EFEC' : '',
      factHint: FACT[s.form.pakket] ? 'Vast bij pakket ' + s.form.pakket : 'Zelf invullen bij ' + s.form.pakket.toLowerCase(),
      formTitle: isEdit ? 'Gegevens wijzigen: ' + (mC ? mC.naam : '') : 'Nieuwe klant toevoegen',
      formHint: isEdit ? 'De wijziging wordt met jouw naam in de historie vastgelegd.' : 'Na opslaan staat de klant direct in Voortgang ' + JAAR + ' bij de gekozen administrateur. Perioden vóór het startkwartaal worden niet van toepassing.',
      form:s.form, on:on, err:s.err, hasErr: !!s.err, saveForm:function () { self.saveForm(); },

      showMut: s.bsub === 'muteren' && !isEdit, mq:s.mq, onMq:function (ev) { self.setState({ mq:ev.target.value }); }, mlist:mlist,
      noMutSel: !mC, hasMutSel: !!mC, m:m,
      mMenu: s.mutMode === 'menu', mAdminOpen: s.mutMode === 'admin', mStopOpen: s.mutMode === 'stop',
      hasMutMsg: !!s.mutMsg && s.mutMode === 'menu', mutMsg:s.mutMsg,
      backMenu:function () { self.setState({ mutMode:'menu', editId:null, err:'' }); },
      mEdit:function () {
        if (!mC) return;
        var f = emptyForm();
        Object.keys(f).forEach(function (k) { if (mC[k] !== undefined) f[k] = typeof f[k] === 'string' ? String(mC[k]) : mC[k]; });
        self.setState({ mutMode:'edit', form:f, editId:mC.id, err:'', mutMsg:'' });
      },
      mAdmin:function () { if (mC) self.setState({ mutMode:'admin', mut:{ admin:mC.admin }, mutMsg:'' }); },
      mStop:function () { self.setState({ mutMode:'stop', mutMsg:'', stop:{ datum:JAAR + '-12-31', reden:'Bedrijf gestopt', adm:'11', btw:'3', jw26:true, ib26:true } }); },
      mut:s.mut, onMut:onMut, stop:s.stop, onStop:onStop,
      doAdmin:function () {
        if (!mC || s.mut.admin === mC.admin) { self.setState({ mutMode:'menu' }); return; }
        var oud = mC.admin, nw = s.mut.admin;
        self.upd(mC.id, function (n) { n.admin = nw; }, 'Overgedragen van ' + oud + ' naar ' + nw);
        self.setState({ mutMode:'menu', mutMsg:'Klant overgedragen aan ' + nw + '.' });
      },
      doStop:function () {
        if (!mC) return;
        var st = s.stop, e = { datum:nlDate(st.datum), reden:st.reden, adm:parseInt(st.adm, 10), btw:parseInt(st.btw, 10), jw26:st.jw26, ib26:st.ib26 };
        self.upd(mC.id, function (n) { n.status = 'Opgezegd'; n.einde = e; }, 'Opgezegd per ' + e.datum + ' (' + e.reden + ')');
        self.setState({ mutMode:'menu', mutMsg:'Vastgelegd. De klant staat nu op Opgezegd tot het resterende werk klaar is.' });
      },
      mDefinitief:function () { if (mC) { self.upd(mC.id, function (n) { n.status = 'Gestopt'; n.stopY = new Date().getFullYear(); }, 'Definitief afgesloten'); self.setState({ mutMsg:'Klant staat nu in het archief (Gestopt).' }); } },
      mTerug:function () { if (mC) { self.upd(mC.id, function (n) { n.status = 'Actief'; n.einde = null; n.stopY = null; }, 'Opnieuw geactiveerd'); self.setState({ mutMsg:'Klant is weer actief.' }); } },

      showSel: true, sf:s.sf, onSf:onSf,
      presets: PRESETS.map(function (p) { return { l:p.l, pick:function () { self.setState({ sf:Object.assign(emptySf(), p.f), cols:colSet(p.cols), copied:false }); if (p.tpl) mailVul(p.tpl); } }; }),
      selCount: selList.length + (selList.length === 1 ? ' klant geselecteerd' : ' klanten geselecteerd'),
      selEmpty: selList.length === 0,
      colsUI: COLS.map(function (cl) { return { l:cl[1], on: !!s.cols[cl[0]], toggle:function () { self.setState(function (st) { var o = Object.assign({}, st.cols); o[cl[0]] = !o[cl[0]]; return { cols:o }; }); } }; }),
      prevGrid: 'display: grid; grid-template-columns: repeat(' + activeCols.length + ', minmax(150px, 1fr)); min-width: ' + (activeCols.length * 150) + 'px',
      prevCells: prevCells,
      expCls: selList.length ? 'btn dark' : 'btn dark off',
      exportSel: function () { downloadXlsx('Selectie ' + vandaagIso() + '.xlsx', [{ name:'Selectie', rows:[activeCols.map(function (cl) { return cl[1]; })].concat(selList.map(function (c) { return activeCols.map(function (cl) { return c[cl[0]] == null ? '' : c[cl[0]]; }); })) }]); },
      mailHref: mailtoLink(mails, s.mailS, s.mailB), mailCls: mails.length ? 'btn primary' : 'btn primary off',
      mailTeLang: mailtoLink(mails, s.mailS, s.mailB).length > 1900,
      mailT: s.mailT, onMailT: function (ev) { mailVul(ev.target.value); },
      mailS: s.mailS, onMailS: function (ev) { self.setState({ mailS:ev.target.value, copiedTxt:false }); },
      mailB: s.mailB, onMailB: function (ev) { self.setState({ mailB:ev.target.value, copiedTxt:false }); },
      mailPeriode: s.mailPeriode, onMailPeriode: function (ev) { self.setState({ mailPeriode:ev.target.value }); },
      mailUiterlijk: s.mailUiterlijk, onMailUiterlijk: function (ev) { self.setState({ mailUiterlijk:ev.target.value }); },
      mailOpnieuw: function () { mailVul(s.mailT); },
      mailHeeftPeriode: s.mailT === 'aanlevering' || s.mailT === 'ib',
      copyTxtLabel: s.copiedTxt ? 'Gekopieerd, plak in Outlook' : 'Kopieer tekst (Manrope 10)',
      copyTxt: function () {
        var html = '<div style="font-family:Manrope,Arial,sans-serif;font-size:10pt;line-height:1.45">' + htmlEsc(s.mailB).replace(/\n/g, '<br>') + '</div>';
        var klaar = function () { self.setState({ copiedTxt:true }); };
        try {
          if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type:'text/html' }), 'text/plain': new Blob([s.mailB], { type:'text/plain' }) })]).then(klaar, klaar);
            return;
          }
        } catch (x) {}
        var div = document.createElement('div'); div.innerHTML = html; div.style.position = 'fixed'; div.style.left = '-9999px'; document.body.appendChild(div);
        var r = document.createRange(); r.selectNodeContents(div); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        try { document.execCommand('copy'); } catch (y) {}
        sel.removeAllRanges(); div.remove(); klaar();
      },
      sfKenm: KENMSEL.map(function (k) { var ks = Array.isArray(s.sf.kenm) ? s.sf.kenm : []; var on = ks.indexOf(k[0]) >= 0; return { l:k[1], cls: on ? 'kchip on' : 'kchip', pick:function () { var n = ks.filter(function (x) { return x !== k[0]; }); if (!on) n.push(k[0]); self.setState({ sf:Object.assign({}, s.sf, { kenm:n }), copied:false }); } }; }),
      kenmAlleCls: s.sf.kenmMode !== 'een' ? 'seg on' : 'seg', kenmEenCls: s.sf.kenmMode === 'een' ? 'seg on' : 'seg',
      kenmAlle: function () { self.setState({ sf:Object.assign({}, s.sf, { kenmMode:'alle' }) }); }, kenmEen: function () { self.setState({ sf:Object.assign({}, s.sf, { kenmMode:'een' }) }); },
      kenmLeeg: function () { self.setState({ sf:Object.assign({}, s.sf, { kenm:[] }) }); },
      copyLabel: s.copied ? 'Gekopieerd' : 'Kopieer e-mailadressen',
      copyMails:function () { try { navigator.clipboard.writeText(mails.join('; ')); } catch (x) {} self.setState({ copied:true }); },
      saveName:s.saveName, onSaveName:function (ev) { self.setState({ saveName:ev.target.value }); },
      saveView:function () { var n = s.saveName.trim(); if (!n) return; self.setState(function (st) { return { saved:st.saved.concat([{ l:n, f:Object.assign({}, st.sf), cols:Object.assign({}, st.cols) }]), saveName:'' }; }); },
      hasSaved: s.saved.length > 0,
      saved: s.saved.map(function (v) { return { l:v.l, pick:function () { self.setState({ sf:Object.assign({}, v.f), cols: v.cols ? Object.assign({}, v.cols) : s.cols, copied:false }); } }; }),

      showAna: s.bsub === 'ana', ana:ana, act:act, lijnSvg:lijnSvg, hasLijn: !!lijnSvg, kwRijen:kwRijen, hasKw: kwRijen.length > 0,
      anaKpi: [{ l:'Nieuwe klanten ' + (JAAR - 4) + ' t/m ' + JAAR, v:sumN }, { l:'Gestopt ' + (JAAR - 4) + ' t/m ' + JAAR, v:sumS }, { l:'Netto groei', v:(sumN - sumS >= 0 ? '+' : '') + (sumN - sumS) }]
    };
  }
}

mountDC(Component, document.getElementById('tpl'), document.getElementById('app'));
