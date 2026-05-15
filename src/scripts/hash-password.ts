import argon2 from "argon2";

const pw = process.argv[2];
if (!pw) {
  console.error("Usage: bun run hash-password <password>");
  process.exit(1);
}

const hash = await argon2.hash(pw, { type: argon2.argon2id });
console.log(hash);
