import zlib from "zlib";

/**
 * Validates whether a signature data URL is a valid, non-blank PNG with actual drawing content.
 * Rejects:
 * - null / undefined / non-string
 * - strings not starting with data:image/png;base64,
 * - short corrupted payloads (< 100 bytes)
 * - completely blank/transparent canvas exports (which only contain row filter bytes, <= 200 non-zero bytes)
 */
export function isSignatureValid(signatureData: string | null | undefined): boolean {
  if (!signatureData || typeof signatureData !== "string") return false;
  const trimmed = signatureData.trim();
  if (!trimmed.startsWith("data:image/png;base64,")) return false;

  try {
    const b64 = trimmed.slice("data:image/png;base64,".length);
    const buf = Buffer.from(b64, "base64");
    if (buf.length < 100) return false;

    // Fast parse IDAT chunks
    const idatChunks: Buffer[] = [];
    let offset = 8;
    while (offset < buf.length - 4) {
      const length = buf.readUInt32BE(offset);
      const type = buf.toString("ascii", offset + 4, offset + 8);
      if (type === "IDAT") {
        idatChunks.push(buf.subarray(offset + 8, offset + 8 + length));
      }
      offset += 8 + length + 4;
    }
    if (idatChunks.length === 0) return false;

    const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
    // Blank canvas (e.g. 160 scanlines) contains only 160 row filter bytes.
    // Real ink strokes generate thousands of non-zero pixel bytes.
    let nonZero = 0;
    for (let i = 0; i < decompressed.length; i++) {
      if (decompressed[i] !== 0) {
        nonZero++;
        if (nonZero > 350) return true;
      }
    }
    return nonZero > 350;
  } catch {
    return false;
  }
}
