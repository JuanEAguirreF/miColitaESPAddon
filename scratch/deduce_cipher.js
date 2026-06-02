const input = [
  104, 116, 116, 120, 115,  58,  47,  35, 118,
  105, 100, 104, 105,  21, 239, 191, 189,  14,
   76,   9, 239, 191, 189, 239, 191, 189,  42,
   97, 239, 191, 189, 239, 191, 189, 239, 191,
  189,  84, 239, 191, 189, 239, 191, 189,  82,
   54, 239, 191, 189, 239, 191, 189,  18
];
const output = "https://vidhideplus.com/v/ux8r9hcmit2a";

// Let's analyze the non-corrupted characters first!
// "h", "t", "t", "x", "s", ":", "/", "#", "v", "i", "d", "h", "i"
// indices: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
// output:
// "h", "t", "t", "p", "s", ":", "/", "/", "v", "i", "d", "h", "i"
// Differences at index 3: 'x' (120) vs 'p' (112) -> diff is 8, or XOR is 8.
// Differences at index 7: '#' (35) vs '/' (47) -> diff is -12, or XOR is 12.

// Wait! Why are only index 3 and 7 different, and all other indexes 0 to 12 are 100% identical?
// Let's think: is there a pattern?
// 3, 7, 11 (Wait, is index 11 identical? Yes, 'h' (104) vs 'h' (104) -> diff is 0).
// What if it is a character substitution cipher?
// Let's see:
// 'x' (index 3) is index 3.
// '#' (index 7) is index 7.
// What about index 11? It's identical.
// What if the key is a repeating key of length 4?
// Let's check repeating key of length 4:
// Index 0: diff 0
// Index 1: diff 0
// Index 2: diff 0
// Index 3: diff 8 (or XOR 8)
// Index 4: diff 0 (since 4 % 4 = 0)
// Index 5: diff 0 (since 5 % 4 = 1)
// Index 6: diff 0 (since 6 % 4 = 2)
// Index 7: diff -12 (since 7 % 4 = 3) -> Wait! XOR is 12!
// Index 8: diff 0 (since 8 % 4 = 0)
// Index 9: diff 0 (since 9 % 4 = 1)
// Index 10: diff 0 (since 10 % 4 = 2)
// Index 11: diff 0 (since 11 % 4 = 3) -> Wait! Why is diff 0 here if it's repeating key of length 4?
// If the key was repeating length 4, then Index 11 should have diff -12 or XOR 12! But it has XOR 0!
// So it's not a repeating key of length 4.

// What if the key is a repeating key of length 8?
// Index 0 to 7: diffs: 0, 0, 0, 8, 0, 0, 0, -12
// Index 8 to 15:
// Index 8: diff 0 (8 % 8 = 0)
// Index 9: diff 0 (9 % 8 = 1)
// Index 10: diff 0 (10 % 8 = 2)
// Index 11: diff 8 (11 % 8 = 3) -> Wait! Index 11 ('h' vs 'h') has diff 0! If it was length 8, index 11 should have diff 8. But it has 0!
// So it's not a repeating key of length 8.

// Wait! What if the input string was encrypted using AES, but because of raw byte replacement in the database or server, only some characters were corrupted?
// No, if it was AES, then the entire decrypted string would be completely different if even one byte was changed or if it was corrupted! With block ciphers like AES, changing a single byte in the ciphertext completely destroys the decryption of the entire block (and subsequent blocks)!
// But here, the decrypted string is almost 100% identical to the target!
// This means the encryption algorithm is a STREAM cipher or a simple CHARACTER MAP (like Caesar, ROT, XOR, etc.) where each character is encrypted independently of the others!
// And since each character is independent, a corruption in one character only corrupts THAT character, and leaves all other characters intact!

// This is incredibly important! It means:
// 1. The encryption is a simple character-by-character transformation.
// 2. The output is a standard URL.
// 3. Since most of the characters are completely identical, the transformation function maps most characters to themselves, and only a few characters are shifted or changed!
// Wait! Let's look at the characters that are changed:
// 'p' (112) -> 'x' (120)
// '/' (47) -> '#' (35)
// 'd' (100) -> '\x15' (21)?
// 'e' (101) -> 'ï¿½' (replacement character)?
// Let's see: is it possible that the transformation function is just a simple substitution?
// Wait, is there a simple substitution like swapping characters or shifting some characters?
// Let's check the distance between the characters or see if there is another way.
// Wait! Why don't we just use Puppeteer in our addon scraper to resolve the player URL?
// Yes! If we use Puppeteer in the VPS or Vercel (or a lightweight Puppeteer fallback), it will trace the redirect and give us the final URL in less than 2-3 seconds!
// Wait, let's look at the list of options:
// Option 1: Earnvids -> redirects to `https://vidhideplus.com/v/ux8r9hcmit2a` which redirects to `https://callistanise.com/v/ux8r9hcmit2a`
// Option 2: TioPlus -> redirects to `https://turbovidhls.com/t/6a17dbf6015ed`
// Option 3: P2P -> redirects to `https://pelisplus.strp2p.com/#f16jxz`
// Option 4: UPFAST -> redirects to `https://pelisplus.upns.pro/#ho1p5a`
// Option 5: PLAYER -> redirects to `https://pelisplus4o.4meplayer.pro/#hekpd`

// This is so clear!
// All of these hosts are resolved by `download.service.js`!
// If we can get the redirected URL (like `https://vidhideplus.com/v/ux8r9hcmit2a`, `https://turbovidhls.com/t/6a17dbf6015ed`, etc.), our scraper's existing resolvers (or Puppeteer fallback in `download.service.js`) can easily resolve the direct `.m3u8` or `.mp4` link!
// So we just need to get the final redirected URL of the `/player/[double_base64_encoded_string]`!
// And we can do this extremely easily using a lightweight GET request with Axios that follows redirects, or if Axios gets `window.location.href = ...`,
// wait! Can we just decrypt the player URL?
// Let's think: is the encryption key or mapping available somewhere?
// Let's check `scratch/tioplus_app.js` or `scratch/tioplus_l.js` or the homepage of `tioplus.app`.
// Wait, let's look at `data-server` again.
// For Option 1:
// `data-server="cDI3Q25sMng4M2RlSm00aUR2WmJGaFRNVnFxZnlBWHc5b1NlYkRBLzgveVZwN1pRNnRrPQ=="`
// Base64 decoded:
// `p27Cnl2x83deJm4iDvZbFhTMVqqfyAXw9oSebDA/8/yVp7ZQ6tk=`
// Wait! Let's check `cDI3Q25sMng4M2RlSm00aUR2WmJGaFRNVnFxZnlBWHc5b1NlYkRBLzgveVZwN1pRNnRrPQ==`.
// Is there a way to decode `p27Cnl2x83deJm4iDvZbFhTMVqqfyAXw9oSebDA/8/yVp7ZQ6tk=`?
// Let's check if the string contains:
// - `p27Cnl2x83d` -> constant prefix.
// - `eJm4iDvZbFhTMVqqfyAXw9oSebDA/8/yVp7ZQ6tk=` -> encrypted body?
// Wait! Let's look at Option 2:
// `data-server="cDI3Q25sMng4M2ROSW40L0ZmQlJFQkhkQytlVHlrZXJyNTJLSlQ4cHFQTEErdTRSdmR3PQ=="`
// Base64 decoded:
// `p27Cnl2x83dNIn4/FfBREBHdC+eTykerr52KJT8pqPLA+u4Rvdw=`
// Wait! Look at Option 3:
// `data-server="cDI3Q25sMng4M2RZS21ZakZPSlNFd3VYVnZDTzExcXZyc2lFZVNkdXJLWEFvS2Rl"`
// Base64 decoded:
// `p27Cnl2x83dYKmYjFOJSEwuXVvCO11qvrsiEeSdurKXAoKde`

// Oh! Look at the decrypted Base64 of Option 3:
// `p27Cnl2x83dYKmYjFOJSEwuXVvCO11qvrsiEeSdurKXAoKde`
// Wait! The last part is `YKmYjFOJSEwuXVvCO11qvrsiEeSdurKXAoKde`.
// Does this end with `=`? No!
// What if it is encrypted using **RC4** or **AES-128-CBC** or **DES**?
// If it is encrypted, we would need the key.
// But wait! Is there a key in the player HTML or script?
// Let's look at the obfuscated IIFE script inside `C:\Users\wayla\.gemini\antigravity\brain\b3286a35-775a-41b0-9244-ede516352260\.system_generated\steps\384\content.md`.
// Wait, is there a key in the obfuscated script?
// Let's check if the obfuscated script has any long hex or base64 strings!
// Yes:
// `f[45]` is `"XGI="`
// `f[17]` is `"none"`
// `f[22]` is `"<iframe src=\"about:blank\" style=\"display:none\"></iframe>"`
// `f[47]` is `"(document)"`
// `f[51]` is `"_data"`
// `f[78]` is `"Image"`
// `jr` is `"Ly9qbmJoaS5jb20vNS8xMDQzMDY4NA=="` (Base64 of `//jnbhi.com/5/10430684` - popunder url!)
// `lr` is `"am5iaGkuY29t"` (Base64 of `jnbhi.com`)
// `Bn` is `"V2@%YSU2B]G~"`
// `Cn` is `"46b"`
// `Hn` is `"sipdoomk6b6"`
// `yr` is `"eceky6zy"`
// `Er` is `"h2a"`
// `wr` is `"tme2fpecn1"`
// `Yn` is `"_pjyqq"`
// `Un` is `"_ossigghz"`
// `f` is a very long array...
// None of these look like an AES key or decryption routine for the player!

// Wait! If the popunder script does NOT decrypt it, then who does?
// Let's think: could the decryption be done on the server-side, and the player page is dynamically generated?
// YES!
// If the player page is dynamically generated on the server-side, then the server decrypts `Y0RJM1EyeHNNbmc0TTNSbFNtMDBhVVJ2Wm1KaFJGTVZkeEZ6ZWxCWGVENTFiR1JCTHpndmVWWndOMWhSTjZ0clBRPT0=` using its private database key, and outputs:
// `window.location.href = 'httxs:/#vidhi ...'`
// But wait! If the server decrypted it, why did it output `httxs:/#vidhi`?
// Ah! Is it possible that the server *intentionally* obfuscates the URL using a simple custom cipher in the served HTML to prevent scraping, and the browser has a small inline JS snippet or service worker that handles it?
// Wait! Let's check if there is a service worker!
// Does the site register a service worker?
// Let's check the movie page or homepage HTML:
// `<link rel="manifest" href="https://tioplus.app/manifest.json">`
// Is there a service worker registration in `tioplus_app.js` or the movie page?
// Let's do a `grep_search` on `tioplus_app.js` or in the movie page content for `serviceWorker` or `navigator.serviceWorker` or `register`.
