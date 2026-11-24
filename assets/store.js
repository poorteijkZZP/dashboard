/*
 * Opslaglaag van het klantdashboard.
 * - Demo-modus (geen Supabase ingesteld in config.js, of ?demo in het adres): verzonnen klanten in de eigen browser.
 * - Live-modus: inloggen met wachtwoord + code uit een authenticator-app, rollen en live bijwerken via Supabase.
 */
(function () {
  var CFG = window.APP_CONFIG || {};
  var DEMO_URL = /[?&]demo\b/.test(location.search);
  var LIVE = !DEMO_URL && !!(CFG.supabaseUrl && CFG.supabaseKey && window.supabase);

  // modelveld -> kolom in tabel "klanten"
  var KL = {
    naam: 'naam', status: 'status', admin: 'administrateur', freq: 'verwerking', bank: 'bank', software: 'boekhoudpakket',
    up: 'altijd_up2date', rechtsvorm: 'rechtsvorm', pakket: 'pakket', facturen: 'facturen', regime: 'btw_regime',
    btwMaand: 'btw_per_maand', pers: 'personenauto', best: 'bestelauto', km: 'km_registratie', uzgb: 'verklaring_uzgb',
    kmuzgb: 'km_uzgb_splitsen', motor: 'motor', fiets: 'fiets', pand: 'pand', bijz: 'bijzonderheden', email: 'email',
    voornaam: 'voornaam', achternaam: 'achternaam', btwnr: 'btw_nummer', btwid: 'btw_id', review: 'google_review',
    vanY: 'vanaf_jaar', vanQ: 'vanaf_kwartaal', stopY: 'gestopt_jaar', einde: 'einde'
  };
  var BOOL = ['up', 'btwMaand', 'pers', 'best', 'km', 'uzgb', 'kmuzgb', 'motor', 'fiets', 'review'];
  // modelveld -> kolom in tabel "voortgang"
  var VG = { cq1: 'controle_q1', cq2: 'controle_q2', cq3: 'controle_q3', c25: 'controle_vj', jw25: 'jaarwerk_vj', ib25: 'ib_vj', notities: 'notities' };

  function toDb(f, v) {
    if (f === 'vanQ') return v === null || v === undefined || v === '' || isNaN(v) ? null : parseInt(v, 10) + 1;
    if (f === 'vanY' || f === 'stopY' || f === 'facturen') return v === '' || v === null || v === undefined || isNaN(parseInt(v, 10)) ? null : parseInt(v, 10);
    if (BOOL.indexOf(f) >= 0) return !!v;
    if (f === 'einde') return v || null;
    if (typeof v === 'string') return v.trim() === '' ? null : v;
    return v === undefined ? null : v;
  }

  function toClient(k, v) {
    var c = { id: k.id };
    Object.keys(KL).forEach(function (f) { var x = k[KL[f]]; c[f] = x === null || x === undefined ? '' : x; });
    BOOL.forEach(function (f) { c[f] = !!k[KL[f]]; });
    c.vanY = k.vanaf_jaar || null;
    c.vanQ = k.vanaf_kwartaal ? k.vanaf_kwartaal - 1 : null;
    c.stopY = k.gestopt_jaar || null;
    c.einde = k.einde || null;
    c.facturen = k.facturen === null || k.facturen === undefined ? '' : k.facturen;
    c.freq = c.freq === 'kwartaal' ? 'kwartaal' : 'maand';
    c.regime = c.regime || 'Normaal';
    c.status = c.status || 'Actief';
    c.heeftRij = !!v;
    v = v || {};
    c.months = []; c.mna = [];
    for (var i = 1; i <= 12; i++) { var m = v['m' + i]; c.months.push(!!m); c.mna.push(m === null || m === undefined); }
    c.btw = []; c.bna = [];
    for (var q = 1; q <= 4; q++) { var b = v['btw' + q]; c.btw.push(!!b); c.bna.push(b === null || b === undefined); }
    Object.keys(VG).forEach(function (f) { var x = v[VG[f]]; c[f] = x === undefined ? null : x; });
    c.notities = v.notities || '';
    c.wacht = v.wacht || {};
    var bm = v.btw_maand || {};
    c.btwm = []; for (var j = 1; j <= 12; j++) c.btwm.push(!!bm[j]);
    c.j25na = false;
    c.log = [];
    return c;
  }

  function diff(o, n) {
    var kl = {}, vg = {};
    Object.keys(KL).forEach(function (f) {
      if (JSON.stringify(o[f]) !== JSON.stringify(n[f])) kl[KL[f]] = toDb(f, n[f]);
    });
    for (var i = 0; i < 12; i++) if (o.months[i] !== n.months[i] || (o.mna && n.mna && o.mna[i] !== n.mna[i])) vg['m' + (i + 1)] = n.mna && n.mna[i] ? null : !!n.months[i];
    for (var q = 0; q < 4; q++) if (o.btw[q] !== n.btw[q] || (o.bna && n.bna && o.bna[q] !== n.bna[q])) vg['btw' + (q + 1)] = n.bna && n.bna[q] ? null : !!n.btw[q];
    Object.keys(VG).forEach(function (f) {
      if (o[f] !== n[f]) vg[VG[f]] = f === 'notities' ? (n[f] || null) : (n[f] === null ? null : !!n[f]);
    });
    if (JSON.stringify(o.wacht || {}) !== JSON.stringify(n.wacht || {})) vg.wacht = n.wacht || {};
    if (JSON.stringify(o.btwm || []) !== JSON.stringify(n.btwm || [])) { var bmo = {}; (n.btwm || []).forEach(function (x, i) { if (x) bmo[i + 1] = true; }); vg.btw_maand = bmo; }
    return { kl: kl, vg: vg };
  }

  // Lege voortgangsregel voor een nieuw jaar
  function nieuwJaarRij(c, jaar) {
    var row = { klant_id: c.id, jaar: jaar, wacht: {}, btw_maand: {}, notities: c.notities || null };
    var stopt = c.status === 'Opgezegd';
    for (var i = 1; i <= 12; i++) row['m' + i] = stopt ? null : (c.freq === 'kwartaal' ? ((i - 1) % 3 === 0 ? false : null) : false);
    for (var q = 1; q <= 4; q++) row['btw' + q] = stopt || c.regime !== 'Normaal' ? null : false;
    row.controle_q1 = stopt ? null : false;
    row.controle_q2 = stopt ? null : false;
    row.controle_q3 = stopt ? null : false;
    var e = c.einde || {};
    row.controle_vj = stopt && !e.jw26 ? null : false;
    row.jaarwerk_vj = stopt && !e.jw26 ? null : false;
    row.ib_vj = stopt && !e.ib26 ? null : false;
    return row;
  }

  var S = { live: LIVE, me: null, conn: 'offline', toClient: toClient, nieuwJaarRij: nieuwJaarRij };
  window.STORE = S;
  if (!LIVE) return;

  // ---- 30 dagen onthouden: sessie in localStorage (onthouden) of sessionStorage (tot browser sluit)
  var REM = 'pz-onthoud', TOT = 'pz-onthoud-tot';
  function ls(fn) { try { return fn(); } catch (e) { return null; } }
  function onthouden() { return ls(function () { return localStorage.getItem(REM) === '1'; }); }
  function wisSessies() {
    ls(function () { Object.keys(localStorage).forEach(function (k) { if (k.indexOf('sb-') === 0) localStorage.removeItem(k); }); });
    ls(function () { Object.keys(sessionStorage).forEach(function (k) { if (k.indexOf('sb-') === 0) sessionStorage.removeItem(k); }); });
  }
  if (onthouden()) {
    var tot = parseInt(ls(function () { return localStorage.getItem(TOT); }) || '0', 10);
    if (!tot || Date.now() > tot) { wisSessies(); ls(function () { localStorage.removeItem(REM); localStorage.removeItem(TOT); }); }
  }
  var opslag = {
    getItem: function (k) { return ls(function () { return (onthouden() ? localStorage : sessionStorage).getItem(k); }); },
    setItem: function (k, v) { ls(function () { (onthouden() ? localStorage : sessionStorage).setItem(k, v); }); },
    removeItem: function (k) { ls(function () { localStorage.removeItem(k); }); ls(function () { sessionStorage.removeItem(k); }); }
  };
  S.setOnthouden = function (aan) {
    ls(function () {
      if (aan) { localStorage.setItem(REM, '1'); localStorage.setItem(TOT, String(Date.now() + 30 * 24 * 3600 * 1000)); }
      else { localStorage.removeItem(REM); localStorage.removeItem(TOT); }
    });
  };
  S.onthouden = function () { return !!onthouden(); };

  var hash = location.hash || '';
  var wantNewPw = /type=(invite|recovery)/.test(hash);
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storage: opslag } });
  S.client = sb;

  function err(e) { return (e && (e.message || e.error_description)) || String(e); }
  function must(r) { if (r.error) throw new Error(err(r.error)); return r.data; }

  var cbAuth = function () {};
  // Na wachtwoord: tweestapsverificatie afdwingen, daarna profiel laden
  function naInloggen(session) {
    return sb.auth.mfa.getAuthenticatorAssuranceLevel().then(function (r) {
      var lv = r.data || {};
      if (lv.currentLevel === 'aal2') return laadProfiel(session);
      return sb.auth.mfa.listFactors().then(function (f) {
        var totp = (f.data && f.data.totp || []).filter(function (x) { return x.status === 'verified'; });
        if (totp.length) cbAuth({ type: 'mfa', factorId: totp[0].id });
        else cbAuth({ type: 'enroll' });
      });
    }).catch(function (e) { cbAuth({ type: 'error', msg: err(e) }); });
  }
  function laadProfiel(session) {
    return sb.from('profielen').select('naam, rol').eq('id', session.user.id).maybeSingle().then(function (r) {
      if (r.error || !r.data) { cbAuth({ type: 'noProfile', email: session.user.email }); return; }
      S.me = { id: session.user.id, naam: r.data.naam, rol: r.data.rol, email: session.user.email };
      cbAuth({ type: 'signedIn', me: S.me });
    });
  }

  S.init = function (cb) {
    cbAuth = cb;
    var started = false;
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') { wantNewPw = true; cb({ type: 'newPassword' }); return; }
      if (event === 'SIGNED_OUT') { S.me = null; cb({ type: 'signedOut' }); return; }
      if (event === 'INITIAL_SESSION') {
        started = true;
        if (!session) { cb({ type: 'signedOut' }); return; }
        if (wantNewPw) { cb({ type: 'newPassword' }); return; }
        setTimeout(function () { naInloggen(session); }, 0);
        return;
      }
      if (event === 'SIGNED_IN' && started && !S.me && !wantNewPw) setTimeout(function () { naInloggen(session); }, 0);
    });
  };

  S.signIn = function (email, pw, onth) {
    S.setOnthouden(onth);
    return sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) { if (r.error) throw new Error('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.'); });
  };
  S.signOut = function () { return sb.auth.signOut().then(function () { S.setOnthouden(false); wisSessies(); }); };
  S.resetPw = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) { if (r.error) throw new Error(err(r.error)); });
  };
  S.setPw = function (pw) {
    return sb.auth.updateUser({ password: pw }).then(function (r) {
      if (r.error) throw new Error(err(r.error));
      wantNewPw = false;
      history.replaceState(null, '', location.pathname);
      return sb.auth.getSession();
    }).then(function (r) { return naInloggen(r.data && r.data.session); });
  };

  // Authenticator-app koppelen
  S.enroll = function () {
    return sb.auth.mfa.listFactors().then(function (f) {
      var oud = (f.data && f.data.all || []).filter(function (x) { return x.factor_type === 'totp' && x.status !== 'verified'; });
      return Promise.all(oud.map(function (x) { return sb.auth.mfa.unenroll({ factorId: x.id }); }));
    }).then(function () {
      return sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Telefoon ' + new Date().toISOString().slice(0, 16) });
    }).then(function (r) {
      var d = must(r);
      return { factorId: d.id, qr: d.totp.qr_code, secret: d.totp.secret };
    });
  };
  S.verify = function (factorId, code) {
    return sb.auth.mfa.challengeAndVerify({ factorId: factorId, code: code }).then(function (r) {
      if (r.error) throw new Error('De code klopt niet of is verlopen. Probeer de nieuwste code uit de app.');
      return sb.auth.getSession();
    }).then(function (r) { return laadProfiel(r.data.session); });
  };

  // Instellingen (huidig jaar, peilmaand)
  S.loadSettings = function () {
    return sb.from('instellingen').select('sleutel, waarde').then(function (r) {
      var out = {};
      (r.data || []).forEach(function (x) { out[x.sleutel] = x.waarde; });
      return out;
    });
  };
  S.setSetting = function (k, v) {
    return sb.from('instellingen').upsert({ sleutel: k, waarde: v }, { onConflict: 'sleutel' }).then(must);
  };
  S.loadYears = function () {
    return sb.from('voortgang').select('jaar').range(0, 19999).then(function (r) {
      var ys = {};
      (must(r) || []).forEach(function (x) { ys[x.jaar] = 1; });
      return Object.keys(ys).map(Number).sort();
    });
  };

  S.loadAll = function (jaar) {
    return Promise.all([
      sb.from('klanten').select('*').order('naam').range(0, 4999),
      sb.from('voortgang').select('*').eq('jaar', jaar).range(0, 4999)
    ]).then(function (rs) {
      var kl = must(rs[0]), vg = must(rs[1]);
      var byId = {};
      vg.forEach(function (v) { byId[v.klant_id] = v; });
      return kl.map(function (k) { return toClient(k, byId[k.id]); });
    });
  };

  S.subscribe = function (onChange, onConn) {
    var t = null;
    function bump() { clearTimeout(t); t = setTimeout(onChange, 250); }
    // Live-verbinding altijd met het actuele toegangsbewijs (na de code uit de app), anders laat de database geen meldingen door
    function zetToken(s) { if (s && s.access_token && sb.realtime && sb.realtime.setAuth) sb.realtime.setAuth(s.access_token); }
    sb.auth.onAuthStateChange(function (ev, s) { if (ev === 'TOKEN_REFRESHED' || ev === 'MFA_CHALLENGE_VERIFIED' || ev === 'SIGNED_IN') zetToken(s); });
    sb.auth.getSession().then(function (r) { zetToken(r.data && r.data.session); start(); }).catch(start);
    function start() {
    sb.channel('klantdashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'klanten' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voortgang' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instellingen' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vraagposten' }, bump)
      .subscribe(function (status) { S.conn = status === 'SUBSCRIBED' ? 'live' : (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' ? 'offline' : 'connecting'); onConn(S.conn); });
    }
  };

  function log(id, text) {
    return sb.from('historie').insert({ klant_id: id, wie: S.me ? S.me.naam : '?', wat: text }).then(function (r) { if (r.error) console.warn(r.error); });
  }

  S.persist = function (o, n, text, jaar) {
    var d = diff(o, n), jobs = [];
    if (Object.keys(d.kl).length) jobs.push(sb.from('klanten').update(d.kl).eq('id', n.id).then(must));
    if (Object.keys(d.vg).length) {
      var row = Object.assign({ klant_id: n.id, jaar: jaar }, d.vg);
      jobs.push(sb.from('voortgang').upsert(row, { onConflict: 'klant_id,jaar' }).then(must));
    }
    return Promise.all(jobs).then(function () { return log(n.id, text); });
  };

  S.create = function (c, text, jaar) {
    var row = {};
    Object.keys(KL).forEach(function (f) { row[KL[f]] = toDb(f, c[f]); });
    return sb.from('klanten').insert(row).select('id').single().then(function (r) {
      var id = must(r).id, vg = { klant_id: id, jaar: jaar, wacht: {}, btw_maand: {} };
      for (var i = 0; i < 12; i++) vg['m' + (i + 1)] = c.mna && c.mna[i] ? null : !!c.months[i];
      for (var q = 0; q < 4; q++) vg['btw' + (q + 1)] = c.bna && c.bna[q] ? null : !!c.btw[q];
      vg.controle_q1 = false; vg.controle_q2 = false; vg.controle_q3 = false;
      vg.controle_vj = null; vg.jaarwerk_vj = null; vg.ib_vj = null;
      return sb.from('voortgang').insert(vg).then(must).then(function () { return log(id, text); }).then(function () { return id; });
    });
  };

  // Nieuw jaar: voortgangsregels aanmaken voor alle lopende klanten (bestaande regels blijven staan)
  S.startYear = function (clients, jaar) {
    var rows = clients.filter(function (c) { return c.status !== 'Gestopt'; }).map(function (c) { return nieuwJaarRij(c, jaar); });
    var parts = [];
    for (var i = 0; i < rows.length; i += 200) parts.push(rows.slice(i, i + 200));
    return parts.reduce(function (p, part) {
      return p.then(function () { return sb.from('voortgang').upsert(part, { onConflict: 'klant_id,jaar', ignoreDuplicates: true }).then(must); });
    }, Promise.resolve()).then(function () { return S.setSetting('huidig_jaar', jaar); }).then(function () { return rows.length; });
  };

  S.loadAfvinkLog = function () {
    return sb.from('historie').select('wat, wanneer').or('wat.ilike.%afgevinkt%,wat.ilike.% gedaan,wat.ilike.%teruggezet naar open%').order('wanneer', { ascending: false }).range(0, 49999).then(must);
  };
  S.loadVp = function () {
    return sb.from('vraagposten').select('*').order('wanneer', { ascending: false }).range(0, 19999).then(must);
  };
  S.addVp = function (klantId, aantal) {
    return sb.from('vraagposten').insert({ klant_id: klantId, jaar: new Date().getFullYear(), aantal: aantal, wie: S.me ? S.me.naam : '?' }).then(must)
      .then(function () { return log(klantId, 'Vraagposten geregistreerd: ' + aantal); });
  };
  S.updVp = function (row, aantal) {
    return sb.from('vraagposten').update({ aantal: aantal, gewijzigd_door: S.me ? S.me.naam : '?', gewijzigd_op: new Date().toISOString() }).eq('id', row.id).then(must)
      .then(function () { return log(row.klant_id, 'Vraagposten gecorrigeerd: ' + row.aantal + ' → ' + aantal); });
  };
  S.delVp = function (row) {
    return sb.from('vraagposten').delete().eq('id', row.id).then(must).then(function () { return log(row.klant_id, 'Vraagposten verwijderd: ' + row.aantal); });
  };

  S.loadOwnNotes = function () {
    return sb.from('eigen_notities').select('klant_id, tekst').then(function (r) {
      var out = {};
      (r.data || []).forEach(function (x) { if (x.tekst) out[x.klant_id] = x.tekst; });
      return out;
    });
  };
  S.saveOwnNote = function (id, tekst) {
    return sb.from('eigen_notities').upsert({ gebruiker: S.me.id, klant_id: id, tekst: tekst || null, gewijzigd_op: new Date().toISOString() }, { onConflict: 'gebruiker,klant_id' }).then(must);
  };

  S.loadLog = function (id) {
    return sb.from('historie').select('wie, wat, wanneer').eq('klant_id', id).order('wanneer', { ascending: false }).limit(100).then(function (r) {
      return must(r).map(function (l) {
        var d = new Date(l.wanneer);
        return { wie: l.wie, wat: l.wat, wanneer: d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) };
      });
    });
  };
})();
