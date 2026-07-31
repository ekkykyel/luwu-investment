/**
 * Helper formatting for Indonesian Rupiah
 */
export function formatNumber(value: number): string {
  if (!value && value !== 0) return '0';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("en") ? "en-US" : "id-ID";
  return new Intl.NumberFormat(locale).format(Math.round(value));
}

export function formatRupiah(value: number): string {
  if (!value && value !== 0) return 'Rp 0';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("en") ? "en-US" : "id-ID";
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(value));
}

export function formatRupiahSingkat(value: number): string {
  if (!value && value !== 0) return 'Rp 0';
  
  const abs = Math.abs(value);
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const isZh = lang.startsWith("zh");
  const isEn = lang.startsWith("en");
  
  if (abs >= 1_000_000_000_000) {
    const t = value / 1_000_000_000_000;
    const numStr = (Number.isInteger(t) ? t : t.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 万亿' : isEn ? ' T' : ' T';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000_000) {
    const m = value / 1_000_000_000;
    const numStr = (Number.isInteger(m) ? m : m.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 十亿' : isEn ? ' B' : ' M';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000) {
    const j = value / 1_000_000;
    const numStr = (Number.isInteger(j) ? j : j.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 百万' : isEn ? ' M' : ' Jt';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000) {
    const rb = value / 1_000;
    const numStr = (Number.isInteger(rb) ? rb : rb.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 千' : isEn ? ' K' : ' Rb';
    return 'Rp ' + finalNum + suffix;
  }
  
  const locale = isZh ? "zh-CN" : isEn ? "en-US" : "id-ID";
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(value));
}

export function formatInputRupiah(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '');
  if (!digits) return '';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("en") ? "en-US" : "id-ID";
  return new Intl.NumberFormat(locale).format(Number(digits));
}

export function parseInputRupiah(formattedValue: string): number {
  if (!formattedValue) return 0;
  // This supports parsing strings with dots and ignores Rp prefix if any
  const digits = formattedValue.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '');
  return Number(digits) || 0;
}
