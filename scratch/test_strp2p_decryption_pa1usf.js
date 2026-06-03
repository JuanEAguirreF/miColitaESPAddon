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
    hash: "#pa1usf"
  }
};

const k = (...r) => String.fromCodePoint(...r);
const y = (r, o) => r.codePointAt(o) || 0;

const S = r => r ? new TextDecoder() : new TextEncoder();
const f = r => S().encode(r);

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

const R = (hostname, hash) => {
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

async function testId(hostname, id) {
  const url = `https://${hostname}/api/v1/video?id=${id}&w=1920&h=1080&r=tioplus.app`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': `https://${hostname}/`
  };
  
  console.log(`\nFetching: ${url}`);
  try {
    const response = await axios.get(url, { headers });
    const encHex = response.data.trim();
    
    const key = x();
    const iv = R(hostname, `#${id}`);
    
    const decryptedBuffer = decryptAES(encHex, key, iv);
    if (decryptedBuffer) {
      console.log("Decrypted raw buffer length:", decryptedBuffer.length);
      const fixedBuffer = Buffer.from(decryptedBuffer);
      
      const bodyStart = decryptedBuffer.slice(16, 60).toString('utf8');
      console.log("BodyStart:", bodyStart);
      
      // Generate all possible prefixes based on the JSON keys in the P2P API response
      const candidates = [
        '{"success":true,',
        '{"success":fals,',
        '{"version":"1779',
        '{"visitorCountry',
        '{"hlsVideoTiktok',
        '{"cf":"https://',
        '{"swarmId":"' + id.slice(0, 4),
        '{"videoId":"' + id.slice(0, 4),
        '{"torrentTracker',
        '{"iceServers":[{',
        '{"streamingConfi',
        '{"cfExpire":fals',
        '{"cfExpire":"121',
        '{"title":"tt0000',
        '{"title":"' + id.slice(0, 4),
        '{"thumbnail":"/5',
        '{"poster":"/aaaa',
        '{"subtitle":{"es',
        '{"userId":"png"',
        '{"userId":"rqz"',
        '{"session":{"ref',
        '{"source":"https',
        // player patterns
        '{"player":{"allo',
        '{"player":{"isPr',
        '{"player":{"id":',
        '{"player":{"logo',
        '{"player":{"tran',
        '{"player":{"rest',
        '{"player":{"defa',
        '{"player":{"pick',
        '{"player":{"user',
        '{"player":{"ui":',
        // metric patterns
        '{"metric":{"user',
        '{"metric":{"vide',
        '{"metric":{"play',
        '{"metric":{"os":',
        '{"metric":{"brow',
        '{"metric":{"coun',
        '{"metric":{"city',
        '{"metric":{"ipAd',
        '{"metric":{"impr',
        '{"metric":{"lang',
        '{"metric":{"time',
        '{"metric":{"scre',
        '{"metric":{"refe',
        '{"metric":{"stre',
        '{"metric":{"cfDo',
        '{"metric":{"plat'
      ];
      
      let parsed = null;
      let successfulPrefix = null;
      
      for (const prefix of candidates) {
        try {
          const testBuffer = Buffer.from(decryptedBuffer);
          Buffer.from(prefix).copy(testBuffer);
          const fixedString = testBuffer.toString('utf8');
          parsed = JSON.parse(fixedString);
          successfulPrefix = prefix;
          break;
        } catch (e) {
          // try next
        }
      }
      
      if (parsed) {
        console.log("Guessed block:", successfulPrefix);
        console.log("JSON parsed keys:", Object.keys(parsed));
        console.log("Video source URL:", parsed.source || parsed.cf || (parsed.session && (parsed.session.source || parsed.session.cf)));
      } else {
        console.error("All candidates failed to parse JSON!");
        console.log("BodyStart char codes:", bodyStart.split('').map(c => c.charCodeAt(0)).slice(0, 15).join(', '));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function run() {
  await testId("pelisplus.strp2p.com", "pa1usf");
  await testId("pelisplus.upns.pro", "9jxutq");
  await testId("pelisplus.rpmstream.live", "jbfsmh");
  await testId("pelisplus.strp2p.com", "yji51l");
  await testId("pelisplus.rpmstream.live", "18k3uv");
}

run();
