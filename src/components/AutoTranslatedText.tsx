import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Global in-memory cache to prevent redundant API calls during a session
const translationCache: Record<string, string> = {};
const pendingRequests: Record<string, Promise<any>> = {};

// Local static dictionary for instant high-frequency geospasial, utility and commercial terms
const LOCAL_DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    "Datar": "Flat",
    "Berbukit": "Hilly",
    "Datar (Topografi Prima)": "Flat (Prime Topography)",
    "Jalan Provinsi": "Provincial Road",
    "Jalan Kabupaten": "Regency Road",
    "Jalan Nasional": "National Highway",
    "Tersedia Jaringan PLN": "PLN Grid Available",
    "PDAM": "Municipal Water (PDAM)",
    "PDAM / Air Tanah Bersih": "PDAM / Clean Ground Water",
    "Sinyal 4G/5G Kuat": "Strong 4G/5G Signal",
    "Fiber Optic / Sinyal 4G Kuat": "Fiber Optic / Strong 4G Signal",
    "Joint Venture / Kemitraan Swasta": "Joint Venture / Private Partnership",
    "Pembebasan Lahan / Beli Putus": "Land Acquisition / Direct Purchase",
    "PMDN / PMA Global": "Domestic / Global Foreign Investment",
    "Dinas Penanaman Modal Luwu": "Luwu Investment Board",
    "PIC Hubungan Investor": "Investor Relations PIC",
    "PMDN (Nasional)": "Domestic Investment (National)",
    "PMA (Asing / Global)": "Foreign Investment (Global)",
    "Sektor": "Sector",
    "Draft": "Draft",
    "Kecamatan": "Sub-district",
    "Kabupaten Luwu": "Luwu Regency",
    "Pertanian": "Agriculture",
    "Perikanan": "Fisheries",
    "Perkebunan": "Plantation",
    "Pertambangan": "Mining",
    "Pariwisata": "Tourism",
    "Industri": "Industrial",
    "Infrastruktur": "Infrastructure",
    "Energi": "Energy",
    "Sertifikat": "Land Certificate / Title",
    "Sertifikat Hak Milik": "Freehold Land Title (SHM)",
    "Sertifikat Hak Guna Bangunan": "Building Rights Title (SHGB)",
    "HGU (Hak Guna Usaha)": "Cultivation Rights Title (HGU)",
    "Sewa Lahan": "Land Lease",
    "Kerjasama Pemda": "Local Govt Partnership",
    "Sertifikat (Clean & Clear)": "Land Certificate (Clean & Clear)",
    "Batas Administrasi Kecamatan": "Sub-district Administrative Boundaries",
    "Batas Administrasi Kelurahan": "Village/Kelurahan Administrative Boundaries",
    "Jaringan Jalan Utama": "Main Road Network",
    "Titik Lokasi Prospek Investasi": "Prospective Investment Locations",
    "Lahan Sawah Dilindungi (LSD)": "Protected Paddy Fields (LSD)",
    "Hutan Mangrove": "Mangrove Forest Area",
    "Kawasan Rawan Banjir": "Flood Prone Areas",
    "Kawasan Rawan Longsor": "Landslide Prone Areas",
    "Rencana Tata Ruang Wilayah (RTRW)": "Spatial Plan (RTRW)",
    "Kawasan Pertanian": "Agricultural Development Zone",
    "Hutan Lindung": "Protected Forest Conservation Zone",
    "Kawasan Perikanan": "Aquaculture & Fishery Zone",
    "Infrastruktur Jalan Regional": "Regional Road Infrastructure",
    "Infrastruktur Listrik & Air": "Utility Infrastructure (Power & Water)",
    "Kawasan Perairan & Kelautan": "Marine & Waters Area",
    "Kawasan Perkebunan": "Plantation & Estate Zone",
    "Kawasan Pertambangan": "Mining & Mineral Zone",
    "Kawasan Pariwisata": "Tourism Development Zone",
    "Lahan Sawah": "Paddy Fields",
    "Tambak": "Ponds / Fishponds",
    "Mangrove": "Mangrove",
    "Tanah Kering Sekunder": "Secondary Dry Land",
    "Tanah Kering Primer": "Primary Dry Land",
    "Batas administratif resmi kecamatan di Kabupaten Luwu.": "Official administrative boundaries of sub-districts in Luwu Regency.",
    "Batas administratif kelurahan/desa Kabupaten Luwu.": "Official administrative boundaries of villages/kelurahans in Luwu Regency.",
    "Jalur transportasi darat strategis penghubung sentra logistik.": "Strategic land transportation routes connecting logistics hubs.",
    "Delineasi spasial zona wilayah prospektif investasi.": "Spatial delineation of prospective investment zones.",
    "Lahan Sawah Dilindungi (LSD) untuk menjaga ketahanan pangan.": "Protected Paddy Fields (LSD) to maintain food security.",
    "Kawasan ekosistem hutan mangrove pelindung abrasi pesisir.": "Mangrove forest ecosystem area protecting coastal erosion.",
    "Zona risiko genangan banjir berdasarkan topografi wilayah.": "Flood inundation risk zones based on local topography.",
    "Wilayah kerentanan tinggi gerakan tanah di lereng pegunungan.": "Areas of high vulnerability to soil movement on mountain slopes.",
    "Rencana Tata Ruang Wilayah (RTRW) peruntukan ruang Luwu.": "Spatial plan allocation of Luwu Regency.",
    "Lahan sawah aktif dan kawasan pertanian pangan berkelanjutan.": "Active paddy fields and sustainable food agriculture areas.",
    "Kawasan konservasi hutan lindung penyangga ekologi Kabupaten Luwu.": "Protected forest conservation zone supporting Luwu's ecology.",
    "Sentra budidaya perikanan air payau dan darat.": "Aquaculture center for brackish water and freshwater fisheries.",
    "Jaringan infrastruktur transportasi darat regional.": "Regional land transportation infrastructure network.",
    "Simpul prasarana penunjang aktivitas ekonomi utama.": "Infrastructure nodes supporting major economic activities.",
    "Zona maritim potensial untuk sektor kelautan dan perikanan.": "Potential maritime zones for marine and fisheries sector.",
    "Area pengembangan budidaya komoditas pertanian unggulan.": "Development area for superior agricultural commodity cultivation.",
    "Delineasi wilayah potensi mineral dan komoditas tambang.": "Delineation of areas with mineral and mining commodity potential.",
    "Destinasi wisata alam, budaya, atau bahari Kabupaten Luwu.": "Natural, cultural, or marine tourism destinations of Luwu Regency.",
    "Lahan sawah aktif dan kawasan pertanian pangan.": "Active paddy fields and food agriculture areas."
  },
  "zh": {
    "Datar": "平坦",
    "Berbukit": "丘陵 / 山地",
    "Datar (Topografi Prima)": "平坦 (极佳地形)",
    "Jalan Provinsi": "省道",
    "Jalan Kabupaten": "县道",
    "Jalan Nasional": "国道",
    "Tersedia Jaringan PLN": "可用国电 (PLN) 电网",
    "PDAM": "自来水公司 (PDAM)",
    "PDAM / Air Tanah Bersih": "自来水 / 清洁地下水",
    "Sinyal 4G/5G Kuat": "4G/5G 信号强",
    "Fiber Optic / Sinyal 4G Kuat": "光纤 / 4G 信号强",
    "Joint Venture / Kemitraan Swasta": "合资 / 私人合伙",
    "Pembebasan Lahan / Beli Putus": "土地征收 / 一次性买断",
    "PMDN / PMA Global": "国内投资 / 全球外资",
    "Dinas Penanaman Modal Luwu": "鲁乌县投资局",
    "PIC Hubungan Investor": "投资者关系负责人",
    "PMDN (Nasional)": "国内投资 (全国)",
    "PMA (Asing / Global)": "外商直接投资 (全球)",
    "Sektor": "部门 / 行业",
    "Draft": "草稿",
    "Kecamatan": "镇/区",
    "Kabupaten Luwu": "鲁乌县",
    "Pertanian": "农业",
    "Perikanan": "渔业",
    "Perkebunan": "种植业",
    "Pertambangan": "矿业",
    "Pariwisata": "旅游业",
    "Industri": "工业",
    "Infrastruktur": "基础设施",
    "Energi": "能源",
    "Sertifikat": "土地所有权证书",
    "Sertifikat Hak Milik": "永久产权证书 (SHM)",
    "Sertifikat Hak Guna Bangunan": "建筑使用权证书 (SHGB)",
    "HGU (Hak Guna Usaha)": "农业/商业经营权 (HGU)",
    "Sewa Lahan": "土地租赁",
    "Kerjasama Pemda": "地方政府合作",
    "Sertifikat (Clean & Clear)": "土地产权证 (无纠纷)",
    "Batas Administrasi Kecamatan": "乡镇行政边界",
    "Batas Administrasi Kelurahan": "村/社区行政边界",
    "Jaringan Jalan Utama": "主要道路网络",
    "Titik Lokasi Prospek Investasi": "意向投资项目点位",
    "Lahan Sawah Dilindungi (LSD)": "基本农田保护区 (LSD)",
    "Hutan Mangrove": "红树林生态区",
    "Kawasan Rawan Banjir": "易涝洪涝隐患区",
    "Kawasan Rawan Longsor": "山体滑坡地质灾害隐患区",
    "Rencana Tata Ruang Wilayah (RTRW)": "国土空间总体规划 (RTRW)",
    "Kawasan Pertanian": "农业种植与产业区",
    "Hutan Lindung": "水源涵养与防护林区",
    "Kawasan Perikanan": "水产养殖与渔业区",
    "Infrastruktur Jalan Regional": "区域公路网基础设施",
    "Infrastruktur Listrik & Air": "市政公用设施 (水电网)",
    "Kawasan Perairan & Kelautan": "海洋渔业与水域区",
    "Kawasan Perkebunan": "经作与特产种植区",
    "Kawasan Pertambangan": "矿产开采与储备区",
    "Kawasan Pariwisata": "文旅生态与观光区",
    "Lahan Sawah": "稻田",
    "Tambak": "鱼塘 / 虾塘",
    "Mangrove": "红树林",
    "Tanah Kering Sekunder": "次生旱地",
    "Tanah Kering Primer": "原生旱地",
    "Batas administratif resmi kecamatan di Kabupaten Luwu.": "鲁乌县各乡镇官方行政区划边界。",
    "Batas administratif kelurahan/desa Kabupaten Luwu.": "鲁乌县各村庄/社区官方行政边界。",
    "Jalur transportasi darat strategis penghubung sentra logistik.": "连接各物流枢纽的关键陆路交通通道。",
    "Delineasi spasial zona wilayah prospektif investasi.": "极具投资潜力的重点项目空间范围圈定。",
    "Lahan Sawah Dilindungi (LSD) untuk menjaga ketahanan pangan.": "旨在维护粮食安全的国家受保护水田面积 (LSD)。",
    "Kawasan ekosistem hutan mangrove pelindung abrasi pesisir.": "用于防止海岸线侵蚀的红树林湿地生态屏障。",
    "Zona risiko genangan banjir berdasarkan topografi wilayah.": "基于地形推演计算出的强降雨洪涝淹没隐患区。",
    "Wilayah kerentanan tinggi gerakan tanah di lereng pegunungan.": "山地丘陵地带易发生滑坡、崩塌等地质灾害的高风险区。",
    "Rencana Tata Ruang Wilayah (RTRW) peruntukan ruang Luwu.": "鲁乌县国土空间规划三区三线红图。",
    "Lahan sawah aktif dan kawasan pertanian pangan berkelanjutan.": "高效、集约型现代农业持续稳产区。",
    "Kawasan konservasi hutan lindung penyangga ekologi Kabupaten Luwu.": "作为鲁乌县重要生态屏障的国家级生态保护红线林区。",
    "Sentra budidaya perikanan air payau dan darat.": "现代内陆淡水与沿海咸淡水水产高效养殖带。",
    "Jaringan infrastruktur transportasi darat regional.": "横贯鲁乌县的重要区域交通干线。",
    "Simpul prasarana penunjang aktivitas ekonomi utama.": "保障全县商贸、工业等生产性活动的水电气枢纽。",
    "Zona maritim potensial untuk sektor kelautan dan perikanan.": "包含近海捕捞和港口物流等在内的海洋经济带。",
    "Area pengembangan budidaya komoditas pertanian unggulan.": "主要特色高附加值经济作物大宗种植基地。",
    "Delineasi wilayah potensi mineral dan komoditas tambang.": "国家战略性矿产资源富集与绿色开采规划区。",
    "Destinasi wisata alam, budaya, atau bahari Kabupaten Luwu.": "集森林康养、民俗体验及海岛观光于一体的文旅圣地。",
    "Lahan sawah aktif dan kawasan pertanian pangan.": "现役水稻种植与现代农业粮食生产核心区。"
  }
};

interface AutoTranslatedTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function AutoTranslatedText({ text, className = "", inline = false }: AutoTranslatedTextProps) {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If text is empty, reset and return
    if (!text || !text.trim()) {
      setTranslatedText("");
      return;
    }

    const checkAndTranslate = async () => {
      const stored = localStorage.getItem("autoTranslate");
      const autoTranslateEnabled = stored === null ? true : stored === "true";
      const targetLang = i18n.language;

      // Only translate if auto-translate is enabled, and the target language is not Indonesian
      if (!autoTranslateEnabled || targetLang === "id") {
        setTranslatedText(text);
        return;
      }

      // Check local static dictionary first for instant zero-latency match
      const cleanKey = text.trim();
      if (LOCAL_DICTIONARY[targetLang] && LOCAL_DICTIONARY[targetLang][cleanKey]) {
        setTranslatedText(LOCAL_DICTIONARY[targetLang][cleanKey]);
        return;
      }

      // Check cache first
      const cacheKey = `${targetLang}:${text}`;
      if (translationCache[cacheKey]) {
        if (translationCache[cacheKey] === "_FAILED_") {
          setTranslatedText(text);
        } else {
          setTranslatedText(translationCache[cacheKey]);
        }
        return;
      }
      
      if (pendingRequests[cacheKey]) {
        setIsLoading(true);
        try {
          const data = await pendingRequests[cacheKey];
          if (data && data.translatedText) {
            setTranslatedText(data.translatedText);
          } else {
            setTranslatedText(text);
          }
        } catch (e) {
          setTranslatedText(text);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Fetch from API
      setIsLoading(true);
      
      const fetchPromise = fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      }).then(async (response) => {
        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return await response.json();
          }
        } else if (response.status === 404 || response.status === 429 || response.status >= 500) {
          return { _failed: true };
        }
        return null;
      }).catch(() => {
        return { _failed: true };
      });
      
      pendingRequests[cacheKey] = fetchPromise;

      try {
        const data = await fetchPromise;
        if (data && data.translatedText) {
          translationCache[cacheKey] = data.translatedText;
          setTranslatedText(data.translatedText);
        } else {
          translationCache[cacheKey] = "_FAILED_";
          setTranslatedText(text);
        }
      } catch {
        translationCache[cacheKey] = "_FAILED_";
        setTranslatedText(text);
      } finally {
        delete pendingRequests[cacheKey];
        setIsLoading(false);
      }
    };

    checkAndTranslate();

    // Listen to custom events for settings changes
    const handleSettingsChange = () => {
      checkAndTranslate();
    };

    window.addEventListener("autoTranslateChange", handleSettingsChange);
    window.addEventListener("languagechange", handleSettingsChange);

    return () => {
      window.removeEventListener("autoTranslateChange", handleSettingsChange);
      window.removeEventListener("languagechange", handleSettingsChange);
    };
  }, [text, i18n.language]);

  const Tag = inline ? "span" : "p";

  return (
    <Tag className={`${className} transition-opacity duration-350 ${isLoading ? "opacity-60" : "opacity-100"}`}>
      {translatedText}
    </Tag>
  );
}
