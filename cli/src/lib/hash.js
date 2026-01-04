import crypto from "node:crypto";

export function fileStemHash(input) {
  const h = crypto.createHash("sha1").update(input).digest("hex");
  return h.slice(0, 12);
}
