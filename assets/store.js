/*
 * Opslaglaag van het klantdashboard.
 * - Demo-modus (geen Supabase ingesteld in config.js): verzonnen klanten, opgeslagen in de eigen browser.
 * - Live-modus (Supabase ingesteld): inloggen, rollen en live bijwerken via Supabase.
 */
(function () {
  var CFG = window.APP_CONFIG || {};
  var LIVE = !!(CFG.supabaseUrl && CFG.supabaseKey && window.supabase);
  var JAAR = CFG.jaar || 2026;

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
  var VG = { cq2: 'controle_q2', cq3: 'controle_q3', c25: 'controle_vj', jw25: 'jaarwerk_vj', ib25: 'ib_vj', notities: 'notities' };

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
    v = v || {};
    c.months = []; c.mna = [];
    for (var i = 1; i <= 12; i++) { var m = v['m' + i]; c.months.push(!!m); c.mna.push(m === null || m === undefined); }
    c.btw = []; c.bna = [];
    for (var q = 1; q <= 4; q++) { var b = v['btw' + q]; c.btw.push(!!b); c.bna.push(b === null || b === undefined); }
    Object.keys(VG).forEach(function (f) { var x = v[VG[f]]; c[f] = x === undefined ? null : x; });
    c.notities = v.notities || '';
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
    return { kl: kl, vg: vg };
  }

  var S = { live: LIVE, jaar: JAAR, me: null, conn: 'offline' };
  window.STORE = S;
  if (!LIVE) return;

  var hash = location.hash || '';
  var wantNewPw = /type=(invite|recovery)/.test(hash);
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  S.client = sb;

  function err(e) { return (e && (e.message || e.error_description)) || String(e); }
  function must(r) { if (r.error) throw new Error(err(r.error)); return r.data; }

  S.init = function (cb) {
    var started = false;
    function handle(session) {
      if (!session) { S.me = null; cb({ type: 'signedOut' }); return; }
      if (wantNewPw) { cb({ type: 'newPassword' }); return; }
      sb.from('profielen').select('naam, rol').eq('id', session.user.id).maybeSingle().then(function (r) {
        if (r.error || !r.data) { cb({ type: 'noProfile', email: session.user.email }); return; }
        S.me = { id: session.user.id, naam: r.data.naam, rol: r.data.rol, email: session.user.email };
        cb({ type: 'signedIn', me: S.me });
      });
    }
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') { wantNewPw = true; cb({ type: 'newPassword' }); return; }
      if (event === 'SIGNED_OUT') { S.me = null; cb({ type: 'signedOut' }); return; }
      if (event === 'INITIAL_SESSION') { started = true; handle(session); return; }
      if (event === 'SIGNED_IN' && started && !S.me) handle(session);
    });
  };

  S.signIn = function (email, pw) {
    return sb.auth.signInWithPassword({ email: email, password: pw }).then(function (r) { if (r.error) throw new Error('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.'); });
  };
  S.signOut = function () { return sb.auth.signOut(); };
  S.resetPw = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }).then(function (r) { if (r.error) throw new Error(err(r.error)); });
  };
  S.setPw = function (pw) {
    return sb.auth.updateUser({ password: pw }).then(function (r) {
      if (r.error) throw new Error(err(r.error));
      wantNewPw = false;
      history.replaceState(null, '', location.pathname);
      return sb.auth.getSession();
    }).then(function (r) {
      var session = r.data && r.data.session;
      return sb.from('profielen').select('naam, rol').eq('id', session.user.id).maybeSingle().then(function (p) {
        if (!p.data) throw new Error('Je account heeft nog geen profiel. Vraag de beheerder dit toe te voegen.');
        S.me = { id: session.user.id, naam: p.data.naam, rol: p.data.rol, email: session.user.email };
        return S.me;
      });
    });
  };

  S.loadAll = function () {
    return Promise.all([
      sb.from('klanten').select('*').order('naam').range(0, 4999),
      sb.from('voortgang').select('*').eq('jaar', JAAR).range(0, 4999)
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
    sb.channel('klantdashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'klanten' }, bump)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voortgang' }, bump)
      .subscribe(function (status) { S.conn = status === 'SUBSCRIBED' ? 'live' : (status === 'CLOSED' ? 'offline' : 'connecting'); onConn(S.conn); });
  };

  function log(id, text) {
    return sb.from('historie').insert({ klant_id: id, wie: S.me ? S.me.naam : '?', wat: text }).then(function (r) { if (r.error) console.warn(r.error); });
  }

  S.persist = function (o, n, text) {
    var d = diff(o, n), jobs = [];
    if (Object.keys(d.kl).length) jobs.push(sb.from('klanten').update(d.kl).eq('id', n.id).then(must));
    if (Object.keys(d.vg).length) {
      var row = Object.assign({ klant_id: n.id, jaar: JAAR }, d.vg);
      jobs.push(sb.from('voortgang').upsert(row, { onConflict: 'klant_id,jaar' }).then(must));
    }
    return Promise.all(jobs).then(function () { return log(n.id, text); });
  };

  S.create = function (c, text) {
    var row = {};
    Object.keys(KL).forEach(function (f) { row[KL[f]] = toDb(f, c[f]); });
    return sb.from('klanten').insert(row).select('id').single().then(function (r) {
      var id = must(r).id, vg = { klant_id: id, jaar: JAAR };
      for (var i = 0; i < 12; i++) vg['m' + (i + 1)] = c.mna && c.mna[i] ? null : !!c.months[i];
      for (var q = 0; q < 4; q++) vg['btw' + (q + 1)] = c.bna && c.bna[q] ? null : !!c.btw[q];
      vg.controle_q2 = false; vg.controle_q3 = false;
      vg.controle_vj = null; vg.jaarwerk_vj = null; vg.ib_vj = null;
      return sb.from('voortgang').insert(vg).then(must).then(function () { return log(id, text); }).then(function () { return id; });
    });
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
