import argon2 from "argon2";

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: bun run hash-password <password>");
  process.exit(1);
}

const hash = await argon2.hash(pw, { type: argon2.argon2id });
// Bun's .env loader expands $VAR refs even inside quotes; only \$ escapes.
const escaped = hash.replaceAll("$", "\\$");

console.log("");
console.log("Paste this line into your .env (backslash escapes the $ refs):");
console.log("");
console.log(`ADMIN_PASSWORD_HASH=${escaped}`);
console.log("");
