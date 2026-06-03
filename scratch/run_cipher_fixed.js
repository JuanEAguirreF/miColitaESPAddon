const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load the rotated strings map
const stringsMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'strings_map_rotated_fixed.json'), 'utf8'));

function j(n) {
  return stringsMap[n];
}

// Mock window location
const window = {
  location: {
    protocol: "https:",
    hostname: "pelisplus.strp2p.com",
    hash: "#yji51l"
  }
};

const k = (...r) => String.fromCodePoint(...r);
const y = (r, o) => r.codePointAt(o) || 0;

const S = r => {
  return r ? new TextDecoder() : new TextEncoder();
};

const f = r => {
  return S().encode(r);
};

const h = r => {
  return S(true).decode(r);
};

const x = () => {
  const r = j, o = window.location.protocol, l = "10", m = 110, I = 1;
  let C = "";
  // y("ᵟ") -> "ᵟ".codePointAt(0)
  const v = y("ᵟ").toString().split("");
  for (let H = 0; H < v.length; H++) {
    C += k(parseInt(l + v[H]));
  }
  C += k(y(o, l / 10));
  C += C.slice(1, 3);
  C += k(m, m - 1, m + 7);
  const M = j(280).split("");
  C += k(parseInt(M[3] + M[2]), parseInt(M[1] + M[2]));
  C += k(parseInt(M[0] * I + I + M[3]), parseInt(M[0] * I + I + M[3]));
  // evaluate M[3] first, then reverse
  const m3_val = parseInt(M[3]);
  const first_val = m3_val * parseInt(l) + m3_val * I;
  M.reverse();
  const reversed_val = M.join("").slice(0, 2);
  C += k(first_val, parseInt(reversed_val));
  return f(C);
};

const R = () => {
  const r = j, o = window.location.hostname, l = o + "//", m = window.location.hash, I = o.length * l.length, C = 1;
  let v = "";
  for (let K = C; K < 10; K++) {
    v += k(K + I);
  }
  let M = "";
  M = C + M + C + M + C;
  const H = M.length * y(m);
  const de = parseInt(M) * C + o.length;
  const T = de + 4;
  const ee = y(o, C);
  const X = ee * C - 2;
  v += k(I, parseInt(M), H, de, T, ee, X);
  return f(v);
};

function decrypt(encHex) {
  const key = x();
  const iv = R();
  
  console.log("Raw Key String:", Buffer.from(key).toString('utf8'), "Length in bytes:", key.byteLength);
  console.log("Raw Key Hex:", Buffer.from(key).toString('hex'));
  console.log("Raw IV Length in bytes:", iv.byteLength);
  console.log("Raw IV Hex:", Buffer.from(iv).toString('hex'));
}

decrypt("dummy");
