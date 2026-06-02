function decrypt(str) {
  if (typeof str !== 'string') return str;
  return str.split("").map(i => {
    let x = i.charCodeAt(0);
    if (x >= 65 && x <= 90) {
      return String.fromCharCode((x - 65 + 26 - 12) % 26 + 65);
    } else if (x >= 97 && x <= 122) {
      return String.fromCharCode((x - 97 + 26 - 12) % 26 + 97);
    } else {
      return i;
    }
  }).join("");
}

const encoded = {
  x:"AzOxuow",
  r:"Bget zafuruomfuaz (TFFB)",
  K:"Bget zafuruomfuaz (TFFBE)",
  j:"Bget zafuruomfuaz (Pagnxq Fms)",
  k:"Uzfqdefufumx",
  M:"Zmfuhq",
  b:"Uz-Bmsq Bget",
  E:"azoxuow",
  Y:"zmfuhq",
  S:"bgetqd-gzuhqdemx",
  g:"qz",
  C:"rd",
  G:"pq",
  h:"",
  v:null,
  O:"e",
  W:"o",
  c:"v",
  p:"k",
  B:"b",
  Q:"j",
  V:2,
  H:"oxuow",
  n:"fagot",
  u:"7.0.10",
  z:"lrsbdajktffb",
  a:"lrsradymfe",
  X:0,
  J:1,
  U:"\r\n",
  d:",",
  Z:"F",
  i:":",
  w:"yqeemsq",
  I:"yspn9a79sh",
  l:"q5qedx1ekg5",
  s:"g",
  D:"Fawqz",
  A:"Rmhuoaz",
  e:"Oazfqzf-Fkbq",
  t:"fqjf/bxmuz",
  y:"mbbxuomfuaz/veaz",
  L:"veaz",
  N:"nxan",
  F:"SQF",
  q:"BAEF",
  R:"TQMP",
  m:"mbbxuomfuaz/j-iii-rady-gdxqzoapqp; otmdeqf=GFR-8",
  o:"Mooqbf-Xmzsgmsq",
  T:"j-mbbxuomfuaz-wqk",
  P:"j-mbbxuomfuaz-fawqz",
  f:"__PX_EQEEUAZ_",
  xr:"lrspxbabgb",
  rr:"xuzw",
  Kr:"efkxqetqqf",
  jr:"mzazkyage",
  kr:"fqjf/oee",
  Mr:"zdm8od49pds",
  br:"r",
  Er:"gzwzaiz",
  Yr:"f4wp70p8osq",
  Sr:"gwtrajlpasc",
  gr:"wmtityzzu",
  Cr:"buzs",
  Gr:"bazs",
  hr:"dqcgqef",
  vr:"dqcgqef_mooqbfqp",
  Or:"dqcgqef_rmuxqp",
  Wr:"dqebazeq",
  cr:1e4,
  pr:"radQmot",
  Br:4,
  Qr:5,
  Vr:3,
  Hr:6,
  nr:7,
  ur:"fdkFab",
  zr:"sqfBmdqzfZapq",
  ar:"dmzpay",
  Xr:"fuyqe",
  Jr:"ogddqzf",
  Ur:"dqmpk",
  dr:"pmfq",
  Zr:"fxp",
  ir:"dmi",
  wr:"mppQhqzfXuefqzqd",
  Ir:"PQXUHQDK_VE",
  lr:"PQXUHQDK_OEE",
  sr:"BDAJK_VE",
  Dr:"BDAJK_OEE",
  Ar:"BDAJK_BZS",
  er:"BDAJK_JTD",
  tr:"ogddqzfEodubf",
  // Let's add the other entries from the entries call
  // ...
};

console.log("Decrypted values:");
for (const [key, val] of Object.entries(encoded)) {
  console.log(`${key}: "${decrypt(val)}"`);
}
