const s1 = 'cDI3Q25sMng4M2RlSm00aUR2WmJGaFRNVnFxZnlBWHc5b1NlYkRBLzgveVZwN1pRNnRrPQ==';
const s2 = 'Y0RJM1EyeHNNbmc0TTNSbFNtMDBhVVJ2Wm1KaFJGTVZkeEZ6ZWxCWGVENTFiR1JCTHpndmVWWndOMWhSTjZ0clBRPT0=';
const s3 = 'Y0RJM1EyNXNNbmc0TTJSbFNtMDBhVVIyV21KR2FGUk5WbkZ4Wm5sQldIYzViMU5sWWtSQkx6Z3ZlVlp3TjFwUk5uUnJQUT09';

console.log("s1 length:", s1.length, "contains &:", s1.includes('&'), "contains &amp;:", s1.includes('&amp;'));
console.log("s2 length:", s2.length, "contains &:", s2.includes('&'), "contains &amp;:", s2.includes('&amp;'));
console.log("s3 length:", s3.length, "contains &:", s3.includes('&'), "contains &amp;:", s3.includes('&amp;'));

console.log("\nDecoded s2:", Buffer.from(s2, 'base64').toString('utf8'));
console.log("Decoded s3:", Buffer.from(s3, 'base64').toString('utf8'));
