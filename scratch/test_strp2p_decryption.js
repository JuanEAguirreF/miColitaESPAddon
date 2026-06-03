const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const stringsMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'strings_map_rotated_fixed.json'), 'utf8'));

function j(n) {
  return stringsMap[n];
}

const window = {
  location: {
    protocol: "https:",
    hostname: "pelisplus.strp2p.com",
    hash: "#yji51l"
  }
};

const k = (...r) => String.fromCodePoint(...r);
const y = (r, o) => r.codePointAt(o) || 0;

const S = r => r ? new TextDecoder() : new TextEncoder();
const f = r => S().encode(r);
const h = r => S(true).decode(r);

const x = () => {
  const r = j, o = window.location.protocol, l = "10", m = 110, I = 1;
  let C = "";
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

// Decrypt helper returning a Buffer
function decryptAES(encHex, keyBytes, ivBytes) {
  try {
    const iv16 = ivBytes.slice(0, 16);
    const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(keyBytes), Buffer.from(iv16));
    let decrypted = decipher.update(encHex, 'hex');
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted;
  } catch (err) {
    console.error("AES Decryption error:", err.message);
    return null;
  }
}

async function run() {
  const id = 'yji51l';
  const url = `https://pelisplus.strp2p.com/api/v1/video?id=${id}&w=1920&h=1080&r=tioplus.app`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://pelisplus.strp2p.com/'
  };
  
  console.log(`Fetching: ${url}`);
  try {
    const response = await axios.get(url, { headers });
    const encHex = response.data.trim();
    
    const key = x();
    const iv = R();
    
    const decryptedBuffer = decryptAES(encHex, key, iv);
    if (decryptedBuffer) {
      console.log("Decrypted raw buffer length:", decryptedBuffer.length);
      const fixedBuffer = Buffer.from(decryptedBuffer);
      
      const firstBlockStr = '{"session":{"ref';
      Buffer.from(firstBlockStr).copy(fixedBuffer);
      
      const fixedString = fixedBuffer.toString('utf8');
      try {
        const parsed = JSON.parse(fixedString);
        console.log("JSON PARSED SUCCESSFULLY!");
        console.log("Keys in parsed JSON:", Object.keys(parsed));
        console.log("Session Keys:", Object.keys(parsed.session));
        console.log("Video source URL:", parsed.source || parsed.cf || (parsed.session && (parsed.session.source || parsed.session.cf)));
      } catch (jsonErr) {
        console.error("JSON Parse failed:", jsonErr.message);
        console.log("Fixed string preview:", fixedString.slice(0, 200));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
