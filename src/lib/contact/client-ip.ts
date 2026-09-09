export function clientIpFromHeaders(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return headerList.get("x-real-ip")?.trim() || "unknown";
}
