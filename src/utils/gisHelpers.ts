/**
 * Konversi ID/String Kecamatan mentah menjadi Nama Resmi Kecamatan di Kab. Luwu
 * Misal: "dist_bua_ponrang" -> "Bua Ponrang"
 */
export function formatDistrictName(districtInput: any): string {
  if (!districtInput && districtInput !== 0) return "";
  
  let raw = "";
  if (typeof districtInput === "string") {
    raw = districtInput;
  } else if (typeof districtInput === "number") {
    raw = String(districtInput);
  } else if (typeof districtInput === "object") {
    const props = districtInput.properties || districtInput;
    raw = props.nama_kecamatan || props.kecamatan || props.name || props.nama || props.districtName || props.KECAMATAN || props.NAMA_KECAMATAN || (props.id !== undefined && isNaN(Number(props.id)) ? String(props.id) : "") || "";
  } else {
    raw = String(districtInput);
  }

  raw = raw.trim();
  if (!raw) return "";

  // Strip prefixes if user passed "Kec. dist_bua_ponrang" or "Kecamatan dist_bua_ponrang"
  raw = raw.replace(/^(kecamatan|kec\.?)\s+/i, "").trim();

  // Strip dist_ or district_
  const cleanKey = raw.toLowerCase().replace(/^(dist_|district_)/i, "").replace(/_/g, " ").trim();

  // District Mapping Table
  const districtMap: Record<string, string> = {
    "bua ponrang": "Bua Ponrang",
    "bua_ponrang": "Bua Ponrang",
    "bupon": "Bua Ponrang",
    "bua": "Bua",
    "ponrang": "Ponrang",
    "ponrang selatan": "Ponrang Selatan",
    "kamanre": "Kamanre",
    "belopa": "Belopa",
    "belopa utara": "Belopa Utara",
    "bajo": "Bajo",
    "bajo barat": "Bajo Barat",
    "suli": "Suli",
    "suli barat": "Suli Barat",
    "larompong": "Larompong",
    "larompong selatan": "Larompong Selatan",
    "walenrang": "Walenrang",
    "walenrang barat": "Walenrang Barat",
    "walenrang timur": "Walenrang Timur",
    "walenrang utara": "Walenrang Utara",
    "lamasi": "Lamasi",
    "lamasi timur": "Lamasi Timur",
    "bastem": "Bastem (Bassesangtempe)",
    "bassesangtempe": "Bastem (Bassesangtempe)",
    "bastinggala": "Bastem (Bassesangtempe)",
    "bastem utara": "Bastem Utara",
    "latimojong": "Latimojong"
  };

  if (districtMap[cleanKey]) {
    return districtMap[cleanKey];
  }

  // Fallback: Capitalize words
  return cleanKey.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Konversi ID/String Desa mentah menjadi Nama Resmi Desa/Kelurahan di Kab. Luwu
 * Misal: "Karang-Karangan", "Desa Tiromanda", { properties: { nama_desa: "Wara" } }
 */
export function formatVillageName(villageInput: any, defaultDistrict?: string): string {
  if (!villageInput && villageInput !== 0) return "";

  let raw = "";
  if (typeof villageInput === "string") {
    raw = villageInput;
  } else if (typeof villageInput === "number") {
    raw = String(villageInput);
  } else if (typeof villageInput === "object") {
    const props = villageInput.properties || villageInput;
    raw = props.nama_desa || props.desa || props.name || props.nama || props.villageName || props.DESA || props.NAMA_DESA || props.NAME || (props.id !== undefined && isNaN(Number(props.id)) ? String(props.id) : "") || "";
  } else {
    raw = String(villageInput);
  }

  raw = raw.trim();
  if (!raw) return "";

  // Clean prefixes if user passed "Desa 161" or "Kelurahan Noling"
  raw = raw.replace(/^(desa|kelurahan|kel\.?)\s+/i, "").trim();

  // Strip desa_ or village_
  const cleanKey = raw.toLowerCase().replace(/^(desa_|village_)/i, "").replace(/_/g, " ").trim();

  // Known Village Numeric ID & Key Mapping
  const villageMap: Record<string, string> = {
    "161": "Noling",
    "noling": "Noling",
    "162": "Senga",
    "senga": "Senga",
    "163": "Senga Selatan",
    "senga selatan": "Senga Selatan",
    "164": "Karang-Karangan",
    "karang karangan": "Karang-Karangan",
    "karangkarangan": "Karang-Karangan",
    "165": "Pelalan",
    "pelalan": "Pelalan",
    "166": "Padang Sappa",
    "padang sappa": "Padang Sappa",
    "167": "Barowa",
    "barowa": "Barowa",
    "168": "Saluinduk",
    "saluinduk": "Saluinduk",
    "169": "Ranteballa",
    "ranteballa": "Ranteballa",
    "170": "Buntu Ballu",
    "buntu ballu": "Buntu Ballu",
    "171": "Mendele",
    "mendele": "Mendele",
    "172": "Tanarigella",
    "tanarigella": "Tanarigella",
    "173": "Pabbaresseng",
    "pabbaresseng": "Pabbaresseng",
    "174": "Sampa",
    "sampa": "Sampa",
    "175": "To'pondo",
    "topondo": "To'Pondo",
    "to pondo": "To'Pondo",
    "176": "Saga",
    "saga": "Saga",
    "177": "Lumaring",
    "lumaring": "Lumaring",
    "178": "Temmapadua",
    "temmapadua": "Temmapadua",
    "179": "Kaddoraddang",
    "kaddoraddang": "Kaddoraddang",
    "180": "Kadong-Kadong",
    "kadong kadong": "Kadong-Kadong"
  };

  if (villageMap[cleanKey]) {
    return villageMap[cleanKey];
  }

  // Fallback: Capitalize words
  return cleanKey.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/**
 * Mengambil label yang aman dari object GIS untuk ditampilkan di UI
 * Menghindari React Error #31 karena object dirender sebagai children
 */
export function getDesaLabel(desa: any): string {
  if (!desa && desa !== 0) return "";
  return formatVillageName(desa);
}

export function getKecamatanLabel(kec: any): string {
  if (!kec) return "";
  return formatDistrictName(kec);
}

export function getDesaId(desa: any): string {
  if (!desa && desa !== 0) return "";
  if (typeof desa === "string") return desa;
  if (typeof desa === "number") return String(desa);
  const props = desa.properties || desa;
  return String(props.id ?? props.ID_DESA ?? props.id_desa ?? props.desa_id ?? desa.id ?? props.name ?? props.nama_desa ?? "");
}

export function getKecamatanId(kec: any): string {
  if (!kec && kec !== 0) return "";
  if (typeof kec === "string") return kec;
  if (typeof kec === "number") return String(kec);
  const props = kec.properties || kec;
  return String(props.id_kecamatan ?? props.id ?? props.ID_KEC ?? props.kecamatan_id ?? props.district_id ?? kec.id ?? props.name ?? props.kecamatan ?? "");
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
