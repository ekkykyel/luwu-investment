/**
 * Helper formatting for Indonesian Rupiah
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return '0';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("en") ? "en-US" : "id-ID";
  return new Intl.NumberFormat(locale).format(Math.round(num));
}

export function formatRupiah(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'Rp 0';
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(num)) return 'Rp 0';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const locale = lang.startsWith("zh") ? "zh-CN" : lang.startsWith("en") ? "en-US" : "id-ID";
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(num));
}

export function formatRupiahSingkat(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'Rp 0';
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned) || 0;
  }
  if (isNaN(num) || num === 0) return 'Rp 0';

  const abs = Math.abs(num);
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const isZh = lang.startsWith("zh");
  const isEn = lang.startsWith("en");

  if (abs >= 1_000_000_000_000) {
    const t = num / 1_000_000_000_000;
    const numStr = (Number.isInteger(t) ? t : t.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 万亿' : isEn ? ' Trillion' : ' Triliun';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000_000) {
    const m = num / 1_000_000_000;
    const numStr = (Number.isInteger(m) ? m : m.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 十亿' : isEn ? ' Billion' : ' Miliar';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000) {
    const j = num / 1_000_000;
    const numStr = (Number.isInteger(j) ? j : j.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 百万' : isEn ? ' Million' : ' Juta';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000) {
    const rb = num / 1_000;
    const numStr = (Number.isInteger(rb) ? rb : rb.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? ' 千' : isEn ? ' Thousand' : ' Ribu';
    return 'Rp ' + finalNum + suffix;
  }

  const locale = isZh ? "zh-CN" : isEn ? "en-US" : "id-ID";
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(num));
}

/**
 * Ultra-compact Rupiah format for tight mobile cards & dashboards
 * Prevents text clipping (e.g. "Rp 1,1 Mili..." -> "Rp 1,1 M", "Rp -749,2 J..." -> "Rp -749 Jt")
 */
export function formatRupiahKompak(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return 'Rp 0';
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const cleaned = String(value).replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned) || 0;
  }
  if (isNaN(num) || num === 0) return 'Rp 0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const lang = (typeof window !== "undefined" && localStorage.getItem("i18nextLng")) || "id";
  const isZh = lang.startsWith("zh");
  const isEn = lang.startsWith("en");

  if (abs >= 1_000_000_000_000) {
    const t = abs / 1_000_000_000_000;
    const numStr = (t >= 10 ? t.toFixed(0) : t.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? '万亿' : isEn ? 'T' : ' T';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000_000_000) {
    const m = abs / 1_000_000_000;
    const numStr = (m >= 10 ? m.toFixed(0) : m.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? '十亿' : isEn ? 'B' : ' M';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000_000) {
    const j = abs / 1_000_000;
    const numStr = (j >= 100 ? j.toFixed(0) : j.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? '百万' : isEn ? 'M' : ' Jt';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000) {
    const rb = abs / 1_000;
    const numStr = (rb >= 100 ? rb.toFixed(0) : rb.toFixed(1)).toString();
    const finalNum = isEn || isZh ? numStr : numStr.replace('.', ',');
    const suffix = isZh ? '千' : isEn ? 'K' : ' Rb';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  return `Rp ${sign}${Math.round(abs)}`;
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

export function formatJarakMeter(jarakMeter: number): string {
  if (jarakMeter == null || isNaN(jarakMeter) || jarakMeter === 0) return "0 Meter";
  
  const absJarak = Math.abs(jarakMeter);
  
  if (absJarak < 1000) {
    // Show in Meters with max 1 decimal point if not integer
    const meters = Number(absJarak.toFixed(1));
    return `${meters} Meter`;
  }
  
  // Show in Kilometers with 2 decimal points
  const km = absJarak / 1000;
  return `${km.toFixed(2)} KM`;
}

export { calculateDistanceMeters, calculateDistanceKm } from '../utils/geoUtils';

