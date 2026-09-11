/** 只接受 http(s) 網址（擋掉 javascript:、data: 等可被濫用的協定） */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
