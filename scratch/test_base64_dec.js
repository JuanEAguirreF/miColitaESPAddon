const servers = [
  "cDI3Q25sMng4M2RlSm00aUR2WmJGaFRNVnFxZnlBWHc5b1NlYkRBLzgveVZwN1pRNnRrPQ==", // Earnvids - Option 1
  "cDI3Q25sMng4M2ROSW40L0ZmQlJFQkhkQytlVHlrZXJyNTJLSlQ4cHFQTEErdTRSdmR3PQ==", // TioPlus - Option 2
  "cDI3Q25sMng4M2RZS21ZakZPSlNFd3VYVnZDTzExcXZyc2lFZVNkdXJLWEFvS2Rl",        // P2P - Option 3
  "cDI3Q25sMng4M2RZS21ZakZPSlNFd3VYVVBTUzFFYXY4c1RFTjJBaSsrVERxdz09",        // UPFAST - Option 4
  "cDI3Q25sMng4M2RZS21ZakZPSlNFd3ZOU3FySXlnMnY3TXFTY1hwanV1YVo1ZnhNdmROZ2RRPT0=" // PLAYER - Option 5
];

for (const s of servers) {
  const dec = Buffer.from(s, 'base64').toString('utf8');
  console.log(`${s} -> ${dec}`);
}
