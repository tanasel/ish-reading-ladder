(function () {
  "use strict";

  const KEY = "ish-reading-ladder@1";
  let mem = null; // in-memory fallback if localStorage is blocked

  function read() {
    if (mem) return mem;
    try {
      const raw = window.localStorage.getItem(KEY);
      mem = raw ? JSON.parse(raw) : {};
    } catch {
      mem = {};
    }
    if (!mem || typeof mem !== "object") mem = {};
    return mem;
  }

  function write(obj) {
    mem = obj;
    try { window.localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* private mode — keep in memory */ }
  }

  function get(k, dflt) {
    const v = read()[k];
    return v === undefined ? dflt : v;
  }

  function set(k, v) {
    const o = read();
    o[k] = v;
    write(o);
  }

  window.EALStore = { get, set };
})();
