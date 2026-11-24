/* Mini-runtime: interpreteert de ontwerp-template ({{holes}}, sc-if, sc-for) en patcht de DOM. */
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function evalAttr(str, scope) {
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(str);
    if (m) return lookup(scope, m[1]);
    return str.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); });
  }
  function build(node, scope, out) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (!t.trim() && t.indexOf('\n') >= 0) return;
      out.push({ text: t.replace(HOLE, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); }) });
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    if (tag === 'sc-if') {
      if (evalAttr(node.getAttribute('value') || '', scope)) for (var i = 0; i < node.childNodes.length; i++) build(node.childNodes[i], scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var list = evalAttr(node.getAttribute('list') || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var k = 0; k < list.length; k++) {
        var sc = Object.create(scope); sc[as] = list[k]; sc.$index = k;
        for (var j = 0; j < node.childNodes.length; j++) build(node.childNodes[j], sc, out);
      }
      return;
    }
    var v = { tag: tag, ns: node.namespaceURI, attrs: {}, props: {}, events: {}, kids: [] };
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], name = at.name;
      if (name.indexOf('hint-') === 0) continue;
      var val = evalAttr(at.value, scope);
      if (name.indexOf('on') === 0 && name.length > 2) {
        var ev = name.slice(2).toLowerCase();
        if (ev === 'change' && (tag === 'textarea' || (tag === 'input' && ['checkbox', 'radio'].indexOf((node.getAttribute('type') || '').toLowerCase()) < 0))) ev = 'input';
        if (typeof val === 'function') v.events[ev] = val;
        continue;
      }
      var lname = name.toLowerCase();
      if (lname === 'value' || lname === 'checked' || lname === 'disabled' || lname === 'readonly') { v.props[lname] = val; continue; }
      if (val === false || val == null) continue;
      v.attrs[name] = val === true ? '' : String(val);
    }
    var src = tag === 'template' ? node.content : node;
    for (var c = 0; c < src.childNodes.length; c++) build(src.childNodes[c], scope, v.kids);
    out.push(v);
  }
  function create(v) {
    if (v.text !== undefined) return document.createTextNode(v.text);
    var el = v.ns === SVGNS ? document.createElementNS(SVGNS, v.tag) : document.createElement(v.tag);
    el.__ev = {};
    update(el, v);
    return el;
  }
  function same(el, v) {
    if (v.text !== undefined) return el.nodeType === 3;
    return el.nodeType === 1 && el.localName === v.tag && el.namespaceURI === v.ns;
  }
  function patchKids(el, kids) {
    for (var i = 0; i < kids.length; i++) {
      var cur = el.childNodes[i];
      if (!cur) el.appendChild(create(kids[i]));
      else if (!same(cur, kids[i])) el.replaceChild(create(kids[i]), cur);
      else if (kids[i].text !== undefined) { if (cur.nodeValue !== kids[i].text) cur.nodeValue = kids[i].text; }
      else update(cur, kids[i]);
    }
    while (el.childNodes.length > kids.length) el.removeChild(el.lastChild);
  }
  function update(el, v) {
    var old = el.__attrs || {};
    for (var n in old) if (!(n in v.attrs)) el.removeAttribute(n);
    for (var m in v.attrs) if (old[m] !== v.attrs[m]) el.setAttribute(m, v.attrs[m]);
    el.__attrs = v.attrs;
    if (!el.__ev) el.__ev = {};
    var evs = ['click', 'input', 'change', 'submit', 'contextmenu'];
    evs.forEach(function (e) {
      var fn = v.events[e];
      if (fn) {
        if (!el.__ev[e]) { el.__ev[e] = true; el.addEventListener(e, function (ev) { var h = el.__h && el.__h[e]; if (h) h(ev); }); }
      }
    });
    el.__h = v.events;
    patchKids(el, v.kids);
    var p = v.props;
    if ('value' in p) { var sv = p.value == null ? '' : String(p.value); if (el.value !== sv) el.value = sv; }
    if ('checked' in p) { if (el.checked !== !!p.checked) el.checked = !!p.checked; }
    if ('disabled' in p) { if (el.disabled !== !!p.disabled) el.disabled = !!p.disabled; }
    if ('readonly' in p) { if (el.readOnly !== !!p.readonly) el.readOnly = !!p.readonly; }
  }
  var pending = false;
  window.DCLogic = function (props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (u) {
    var part = typeof u === 'function' ? u(this.state) : u;
    this.state = Object.assign({}, this.state, part || {});
    var self = this;
    if (!pending) { pending = true; Promise.resolve().then(function () { pending = false; self.__render(); }); }
  };
  window.DCLogic.prototype.forceUpdate = function () { this.setState({}); };
  window.mountDC = function (Comp, tplEl, root) {
    var inst = new Comp({});
    inst.__render = function () {
      var vals = inst.renderVals();
      var out = [];
      for (var i = 0; i < tplEl.content.childNodes.length; i++) build(tplEl.content.childNodes[i], vals, out);
      patchKids(root, out);
      if (inst.afterRender) inst.afterRender();
    };
    inst.__render();
    if (inst.componentDidMount) inst.componentDidMount();
    return inst;
  };
})();
