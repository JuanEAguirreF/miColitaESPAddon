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

const snippet = `
vn=async()=>{
const r=j;
document[r(219)].style[r(265)]=r(236);
const o=document.createElement(r(170));
o.id=r(177),o[r(345)]=r(288);
const l=document.createElement("div");
l.id="player-button",l[r(305)]=r(440),o[r(315)](l),document[r(219)][r(315)](o);
const[m,I]=await ve();
if(I){
xe(I);
return
}
if(m.superPlayer&&(_=!0),m.title&&(document.title=m[r(328)]),m[r(511)]&&(o[r(345)][r(458)]=r(312)+m[r(511)]+'")',window[r(137)]<=768?(o[r(345)][r(136)]="contain",o.style[r(510)]="no-repeat"):(o.style.backgroundSize=r(173),o[r(345)][r(403)]=r(269)),o[r(345)][r(403)]=r(269)),m[r(164)]&&(!_||le("sa"))){
const C=document[r(323)](r(291));
m[r(164)][r(434)](r(472))?C[r(331)]=m[r(164)]:C[r(256)]=m[r(164)],document.body.appendChild(C)
}
`;

// Find all r(\d+) or j(\d+) in the snippet and replace them with their translated string
const translated = snippet.replace(/(?:r|j)\((\d+)\)/g, (m, g) => {
  return JSON.stringify(j(parseInt(g)));
});

console.log(translated);
