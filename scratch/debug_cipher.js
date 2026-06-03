const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'strp2p_bundle.js');
const code = fs.readFileSync(bundlePath, 'utf8');

const arrayRegex = /const\s+i\s*=\s*(\[[\s\S]+?\]);/m;
const match = code.match(arrayRegex);
const i_array = eval(match[1]);

function j(n) {
  return i_array[n - 131];
}

const window = {
  location: {
    protocol: "https:",
    hostname: "pelisplus.strp2p.com",
    hash: "#yji51l"
  }
};

const k = (...r) => {
  console.log("Calling fromCodePoint with:", r);
  return String.fromCodePoint(...r);
};
const y = (r, o) => {
  const val = r.codePointAt(o) || 0;
  console.log(`codePointAt on "${r}" at index ${o}: ${val}`);
  return val;
};
const f = r => Buffer.from(r, 'utf8');

const x = () => {
  const r = j, o = window.location.protocol, l = "10", m = 110, I = 1;
  let C = "";
  const v = y("ᵟ").toString().split("");
  console.log("v split:", v);
  for (let H = 0; H < v.length; H++) C += k(parseInt(l + v[H]));
  console.log("C after loop:", C);
  
  C += k(y(o, l / 10));
  console.log("C after protocol CP:", C);
  
  C += C.slice(1, 3);
  console.log("C after slice:", C);
  
  C += k(m, m - 1, m + 7);
  console.log("C after m, m-1, m+7:", C);
  
  console.log("j(280):", j(280));
  const M = j(280).split("");
  console.log("M split:", M);
  
  C += k(parseInt(M[3] + M[2]), parseInt(M[1] + M[2]));
  C += k(parseInt(M[0] * I + I + M[3]), parseInt(M[0] * I + I + M[3]));
  
  console.log("j(410):", j(410));
  C += k(parseInt(M[3] * l + M[3] * I), j(410).split("").reverse().join("").slice(0, 2));
  return f(C);
}

x();
