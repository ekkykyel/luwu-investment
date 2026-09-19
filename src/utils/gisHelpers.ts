/**
 * Mengambil label yang aman dari object GIS untuk ditampilkan di UI
 * Menghindari React Error #31 karena object dirender sebagai children
 */
export function getDesaLabel(desa: any): string {
  if (!desa) return "";
  if (typeof desa === "string") return desa;
  if (typeof desa === "number") return String(desa);
  return (
    desa.nama_desa ||
    desa.desa ||
    desa.name ||
    desa.nama ||
    String(desa.id || "")
  );
}

export function getKecamatanLabel(kec: any): string {
  if (!kec) return "";
  if (typeof kec === "string") return kec;
  if (typeof kec === "number") return String(kec);
  return (
    kec.nama_kecamatan ||
    kec.kecamatan ||
    kec.name ||
    kec.nama ||
    String(kec.id || "")
  );
}

export function getDesaId(desa: any): string {
  if (!desa) return "";
  if (typeof desa === "string") return desa;
  if (typeof desa === "number") return String(desa);
  return String(desa.id || desa.ID_DESA || desa.desa || desa.name || "");
}

export function getKecamatanId(kec: any): string {
  if (!kec) return "";
  if (typeof kec === "string") return kec;
  if (typeof kec === "number") return String(kec);
  return String(kec.id || kec.id_kecamatan || kec.ID_KEC || kec.kecamatan || kec.name || "");
}

/**
 * Sanitasi array data GIS — pastikan tidak ada object tersisa sebagai value atau children
 */
export function sanitizeGisOptions<T extends Record<string, any>>(
  items: T[],
  idKey = "id",
  labelKey = "name"
): Array<{ id: string; label: string; raw: T }> {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item !== null && item !== undefined && typeof item === "object")
    .map((item) => {
      const rawId = item[idKey] ?? item.id ?? item.id_kecamatan ?? item.ID_DESA ?? item.ID_KEC ?? item.name ?? "";
      const rawLabel =
        item[labelKey] ||
        item.nama_desa ||
        item.desa ||
        item.nama_kecamatan ||
        item.kecamatan ||
        item.name ||
        item.nama ||
        rawId ||
        "";

      const cleanLabel = typeof rawLabel === "string" ? rawLabel : (typeof rawLabel === "number" ? String(rawLabel) : "");
      const cleanId = typeof rawId === "string" ? rawId : String(rawId || "");

      return {
        id: cleanId,
        label: cleanLabel,
        raw: item,
      };
    })
    .filter((item) => item.id !== "" || item.label !== "");
}
