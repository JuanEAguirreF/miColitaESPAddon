const fs = require('fs');

const f = [
  "createElement",
  "addEventListener",
  "removeEventListener",
  "querySelector",
  "querySelectorAll",
  "dispatchEvent",
  "createDocumentFragment",
  "createElementNS",
  "getElementById",
  "getElementsByTagName",
  "currentScript",
  "readyState",
  "body",
  "document",
  "iframe",
  "style",
  "display",
  "none",
  "parentNode",
  "head",
  "cloneNode",
  "innerHTML",
  "<iframe src=\"about:blank\" style=\"display:none\"></iframe>",
  "firstChild",
  "remove",
  "html",
  "appendChild",
  "contentWindow",
  "configurable",
  "Object",
  "defineProperty",
  "String",
  "fromCharCode",
  "Math",
  "random",
  "toString",
  "slice",
  "replace",
  "",
  "forEach",
  "apply",
  "get",
  "createTextNode",
  "RegExp",
  "atob",
  "XGI=",
  "concat",
  "(document)",
  "g",
  "call",
  "localStorage",
  "_data",
  "setItem",
  "getItem",
  "removeItem",
  "clear",
  "decodeURIComponent",
  "bind",
  "btoa",
  "eval",
  "JSON",
  "Date",
  "Array",
  "Promise",
  "parseInt",
  "navigator",
  "encodeURI",
  "Uint8Array",
  "setTimeout",
  "setInterval",
  "ArrayBuffer",
  "clearTimeout",
  "clearInterval",
  "MessageChannel",
  "BroadcastChannel",
  "encodeURIComponent",
  "TypeError",
  "Event",
  "Error",
  "Image",
  "sessionStorage"
];

// Let's load the obfuscated script from player page C:\Users\wayla\.gemini\antigravity\brain\b3286a35-775a-41b0-9244-ede516352260\.system_generated\steps\384\content.md
const html = fs.readFileSync('C:\\Users\\wayla\\.gemini\\antigravity\\brain\\b3286a35-775a-41b0-9244-ede516352260\\.system_generated\\steps\\384\\content.md', 'utf8');

// The obfuscated script starts after the line "@import ..." and is inside <script data-cfasync="false" type="text/javascript">
const match = html.match(/<script data-cfasync="false" type="text\/javascript">([\s\S]*?)<\/script>/);
if (match) {
  let js = match[1];
  console.log("Obfuscated JS length:", js.length);
  
  // Let's replace references like f[0], f[1], etc.
  // We can do it by matching f\[(\d+)\]
  js = js.replace(/f\[(\d+)\]/g, (m, index) => {
    const val = f[parseInt(index)];
    return JSON.stringify(val);
  });
  
  fs.writeFileSync('scratch/player_deobfuscated.js', js);
  console.log("Deobfuscated JS written to scratch/player_deobfuscated.js");
} else {
  console.log("Could not find script match in player page content.");
}
