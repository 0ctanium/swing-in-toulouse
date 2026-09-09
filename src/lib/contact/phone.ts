const FRENCH_LOCAL_PHONE = /^0[1-9]\d{8}$/;
const E164_PHONE = /^\+[1-9]\d{6,14}$/;

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Normalize a public or notify phone number to E.164, or return null. */
export function normalizePhoneNumber(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/[\s.()/-]/g, "");

  if (E164_PHONE.test(compact)) {
    return compact;
  }

  if (compact.startsWith("00") && compact.length > 4) {
    const e164 = `+${compact.slice(2)}`;
    return E164_PHONE.test(e164) ? e164 : null;
  }

  if (FRENCH_LOCAL_PHONE.test(compact)) {
    return `+33${compact.slice(1)}`;
  }

  if (/^33[1-9]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }

  return null;
}

/** French display like `06 12 34 56 78` for +33 numbers; otherwise the E.164 form. */
export function formatPhoneForDisplay(e164: string) {
  if (e164.startsWith("+33") && e164.length === 12) {
    const local = `0${e164.slice(3)}`;
    return local.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }

  return e164;
}

export function whatsappMeUrl(e164: string, text?: string) {
  const url = new URL(`https://wa.me/${digitsOnly(e164)}`);
  if (text) {
    url.searchParams.set("text", text);
  }
  return url.toString();
}
