const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const stringsMap = JSON.parse(fs.readFileSync(path.join(__dirname, 'strings_map_rotated_fixed.json'), 'utf8'));

function j(n) {
  return stringsMap[n];
}

const k = (...r) => String.fromCodePoint(...r);
const y = (r, o) => r.codePointAt(o) || 0;

const S = r => r ? new TextDecoder() : new TextEncoder();
const f = r => S().encode(r);
const h = r => S(true).decode(r);

const getX = () => {
  const r = j, o = "https:", l = "10", m = 110, I = 1;
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

const getR = (hostname, hash) => {
  const r = j, o = hostname, l = o + "//", m = hash, I = o.length * l.length, C = 1;
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

async function testHost(hostname, id) {
  const hash = `#${id}`;
  const url = `https://${hostname}/api/v1/video?id=${id}&w=1920&h=1080&r=tioplus.app`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': `https://${hostname}/`
  };
  
  console.log(`\n--------------------------------------------------`);
  console.log(`Testing host: ${hostname} (ID: ${id})`);
  console.log(`URL: ${url}`);
  console.log(`--------------------------------------------------`);
  
  try {
    const response = await axios.get(url, { headers });
    const encHex = response.data.trim();
    
    const key = getX();
    const iv = getR(hostname, hash);
    
    const decryptedBuffer = decryptAES(encHex, key, iv);
    if (decryptedBuffer) {
      console.log("Decrypted raw buffer length:", decryptedBuffer.length);
      
      // Analyze body starting from byte 16 to detect structure type
      const bodyStart = decryptedBuffer.slice(16, 60).toString('utf8');
      console.log(`Raw slice [16-60]: "${bodyStart}"`);
      
      let firstBlockStr = '{"success":true,'; // default fallback
      
      if (bodyStart.startsWith('":"\\/')) {
        firstBlockStr = '{"subtitle":{"es';
      } else if (bodyStart.startsWith('":"')) {
        firstBlockStr = '{"visitorCountry';
      } else if (bodyStart.startsWith('ession":') || bodyStart.startsWith('rerUrl":') || bodyStart.startsWith('ererUrl":')) {
        firstBlockStr = '{"session":{"ref';
      } else {
        const remainingId = id.slice(4);
        if (bodyStart.startsWith(remainingId + '","') || bodyStart.includes('torrentTrackers')) {
          firstBlockStr = '{"videoId":"' + id.slice(0, 4);
        }
      }
      
      console.log(`Guessed first block: "${firstBlockStr}"`);
      
      const fixedBuffer = Buffer.from(decryptedBuffer);
      Buffer.from(firstBlockStr).copy(fixedBuffer);
      
      const fixedString = fixedBuffer.toString('utf8');
      try {
        const parsed = JSON.parse(fixedString);
        console.log("JSON PARSED SUCCESSFULLY!");
        console.log("Keys:", Object.keys(parsed));
        const streamUrl = parsed.source || parsed.cf || (parsed.session && (parsed.session.source || parsed.session.cf));
        console.log("Video source URL:", streamUrl);
      } catch (jsonErr) {
        console.error("JSON Parse failed:", jsonErr.message);
        console.log("Fixed string preview:", fixedString.slice(0, 200));
      }
    }
  } catch (err) {
    console.error("Request error:", err.message);
  }
}

async function run() {
  // Test strp2p.com
  await testHost('pelisplus.strp2p.com', 'pa1usf');
  
  // Test upns.pro
  await testHost('pelisplus.upns.pro', '9jxutq');
  
  // Test 4meplayer.pro
  await testHost('pelisplusto.4meplayer.pro', 'x5yit');
  
  // Test rpmstream.live
  await testHost('pelisplus.rpmstream.live', 'jbfsmh');
}

run();
