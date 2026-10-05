/**
 * Encode [lng, lat] pairs as a Google-format polyline string (the inverse of
 * decodePolyline in decode-polyline.ts).
 */
export function encodePolyline(coords: [number, number][]): string {
  let prevLat = 0
  let prevLng = 0
  let out = ''
  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63)
      v >>= 5
    }
    out += String.fromCharCode(v + 63)
  }
  for (const [lng, lat] of coords) {
    const latE5 = Math.round(lat * 1e5)
    const lngE5 = Math.round(lng * 1e5)
    encodeValue(latE5 - prevLat)
    encodeValue(lngE5 - prevLng)
    prevLat = latE5
    prevLng = lngE5
  }
  return out
}
