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
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(num)).replace(/[\.,]+$/, '');
}

export const INDICATIVE_EXCHANGE_RATES = {
  USD: 16250, // 1 USD = Rp 16.250 (Kurs Indikatif Bank Indonesia 2026)
  CNY: 2240,  // 1 CNY = Rp 2.240 (Kurs Indikatif Bank Indonesia 2026)
  rateDate: "01 Oktober 2026"
};

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

  if (isZh) {
    // Kaidah akuntansi Sinofon (万 = 10^4, 亿 = 10^8)
    if (abs >= 100_000_000) {
      const yi = num / 100_000_000;
      const str = (Number.isInteger(yi) ? yi : yi.toFixed(1)).toString().replace(/\.0$/, '').replace(/[\.,]+$/, '');
      return `${str} 亿印尼盾`;
    }
    if (abs >= 10_000) {
      const wan = num / 10_000;
      const str = (Number.isInteger(wan) ? wan : wan.toFixed(1)).toString().replace(/\.0$/, '').replace(/[\.,]+$/, '');
      return `${str} 万印尼盾`;
    }
    return `${new Intl.NumberFormat("zh-CN").format(Math.round(num)).replace(/[\.,]+$/, '')} 印尼盾`;
  }

  if (abs >= 1_000_000_000_000) {
    const t = num / 1_000_000_000_000;
    const numStr = (Number.isInteger(t) ? t : t.toFixed(1)).toString().replace(/\.0$/, '');
    const finalNum = (isEn ? numStr : numStr.replace('.', ',')).replace(/[\.,]+$/, '');
    const suffix = isEn ? ' Trillion' : ' Triliun';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000_000) {
    const m = num / 1_000_000_000;
    const numStr = (Number.isInteger(m) ? m : m.toFixed(1)).toString().replace(/\.0$/, '');
    const finalNum = (isEn ? numStr : numStr.replace('.', ',')).replace(/[\.,]+$/, '');
    const suffix = isEn ? ' Billion' : ' Miliar';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000_000) {
    const j = num / 1_000_000;
    const numStr = (Number.isInteger(j) ? j : j.toFixed(1)).toString().replace(/\.0$/, '');
    const finalNum = (isEn ? numStr : numStr.replace('.', ',')).replace(/[\.,]+$/, '');
    const suffix = isEn ? ' Million' : ' Juta';
    return 'Rp ' + finalNum + suffix;
  }
  if (abs >= 1_000) {
    const rb = num / 1_000;
    const numStr = (Number.isInteger(rb) ? rb : rb.toFixed(1)).toString().replace(/\.0$/, '');
    const finalNum = (isEn ? numStr : numStr.replace('.', ',')).replace(/[\.,]+$/, '');
    const suffix = isEn ? ' Thousand' : ' Ribu';
    return 'Rp ' + finalNum + suffix;
  }

  const locale = isEn ? "en-US" : "id-ID";
  return 'Rp ' + new Intl.NumberFormat(locale).format(Math.round(num)).replace(/[\.,]+$/, '');
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

  if (isZh) {
    if (abs >= 100_000_000) {
      const yi = abs / 100_000_000;
      const str = (yi >= 10 ? yi.toFixed(0) : yi.toFixed(1)).toString();
      return `${sign}${str}亿`;
    }
    if (abs >= 10_000) {
      const wan = abs / 10_000;
      const str = (wan >= 10 ? wan.toFixed(0) : wan.toFixed(1)).toString();
      return `${sign}${str}万`;
    }
    return `${sign}${Math.round(abs)}`;
  }

  if (abs >= 1_000_000_000_000) {
    const t = abs / 1_000_000_000_000;
    const numStr = (t >= 10 ? t.toFixed(0) : t.toFixed(1)).toString();
    const finalNum = isEn ? numStr : numStr.replace('.', ',');
    const suffix = isEn ? 'T' : ' T';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000_000_000) {
    const m = abs / 1_000_000_000;
    const numStr = (m >= 10 ? m.toFixed(0) : m.toFixed(1)).toString();
    const finalNum = isEn ? numStr : numStr.replace('.', ',');
    const suffix = isEn ? 'B' : ' M';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000_000) {
    const j = abs / 1_000_000;
    const numStr = (j >= 100 ? j.toFixed(0) : j.toFixed(1)).toString();
    const finalNum = isEn ? numStr : numStr.replace('.', ',');
    const suffix = isEn ? 'M' : ' Jt';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  if (abs >= 1_000) {
    const rb = abs / 1_000;
    const numStr = (rb >= 100 ? rb.toFixed(0) : rb.toFixed(1)).toString();
    const finalNum = isEn ? numStr : numStr.replace('.', ',');
    const suffix = isEn ? 'K' : ' Rb';
    return `Rp ${sign}${finalNum}${suffix}`;
  }
  return `Rp ${sign}${Math.round(abs)}`;
}

/**
 * Sovereign Currency Formatter (IDR, USD, CNY) with verifiable exchange rates
 */
export function formatSovereignCurrency(
  value: number | string | undefined | null,
  options?: {
    locale?: string;
    currency?: 'IDR' | 'USD' | 'CNY';
    compact?: boolean;
    showRateDate?: boolean;
  }
): string {
  const num = typeof value === 'number' ? value : parseFloat(String(value || 0).replace(/[^\d.-]/g, '')) || 0;
  const targetCurrency = options?.currency || 'IDR';

  if (targetCurrency === 'USD') {
    const inUsd = num / INDICATIVE_EXCHANGE_RATES.USD;
    if (options?.compact) {
      if (inUsd >= 1_000_000) return `$${(inUsd / 1_000_000).toFixed(1)}M`;
      if (inUsd >= 1_000) return `$${(inUsd / 1_000).toFixed(1)}K`;
      return `$${Math.round(inUsd)}`;
    }
    return `$ ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(inUsd))}`;
  }

  if (targetCurrency === 'CNY') {
    const inCny = num / INDICATIVE_EXCHANGE_RATES.CNY;
    if (options?.compact) {
      if (inCny >= 100_000_000) return `¥${(inCny / 100_000_000).toFixed(1)}亿`;
      if (inCny >= 10_000) return `¥${(inCny / 10_000).toFixed(1)}万`;
      return `¥${Math.round(inCny)}`;
    }
    return `¥ ${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(Math.round(inCny))}`;
  }

  return options?.compact ? formatRupiahKompak(num) : formatRupiahSingkat(num);
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

