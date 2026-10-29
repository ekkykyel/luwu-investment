import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

replacement = """      // Helper function to map a raw village name or ID to the actual village ID from vilData
      const findVillageIdByName = (rawName?: string, distId?: string): string => {
        if (!rawName) return "";
        const sRaw = String(rawName).trim();

        // Check if raw name explicitly matches via stripped ID prefixes (e.g. v_real_102 -> 102)
        const strippedId = sRaw.replace(/^v_real_/i, "").replace(/^vil_/i, "");
        const exactIdMatch = vilData.find((v: any) => String(v.id).toLowerCase() === strippedId.toLowerCase() || String(v.id).toLowerCase() === sRaw.toLowerCase());
        if (exactIdMatch) return String(exactIdMatch.id);

        // Normalize string matching
        const normSearch = normalizeName(sRaw);
        if (!normSearch) return sRaw;

        const matched = vilData.find((v: any) => {
           // if we know the district, let's heavily prefer villages in that district!
           if (distId && String(v.districtId) !== String(distId)) return false;
           return normalizeName(v.name || v.rawName || v.DESA || "") === normSearch;
        });

        if (matched) return String(matched.id);

        // Fallback matching without district strictness
        const fallbackMatch = vilData.find((v: any) => normalizeName(v.name || v.rawName || v.DESA || "") === normSearch);
        return fallbackMatch ? String(fallbackMatch.id) : strippedId; // return strippedId directly so v_real_102 becomes 102
      };

      // 1. Masukkan data relasional dari tabel investments"""

code = re.sub(r'      // 1\. Masukkan data relasional dari tabel investments', replacement, code, count=1)

replacement2 = """          const rawDistId = item.districtId || item.district_id || item.kecamatan_id || "";
          const resolvedDistId = findDistrictIdByName(rawDistId);
          
          const rawVilId = item.villageId || item.village_id || item.desa_id || "";
          const resolvedVilId = findVillageIdByName(rawVilId, resolvedDistId);

          const normalizedItem = {
            ...item,
            districtId: resolvedDistId,
            district_id: resolvedDistId,
            villageId: resolvedVilId,
            village_id: resolvedVilId,"""

code = re.sub(r'          const rawDistId = item\.districtId \|\| item\.district_id \|\| item\.kecamatan_id \|\| "";\n          const resolvedDistId = findDistrictIdByName\(rawDistId\);\n          const normalizedItem = \{\n            \.\.\.item,\n            districtId: resolvedDistId,\n            district_id: resolvedDistId,\n            villageId: item\.villageId \|\| item\.village_id \|\| item\.desa_id \|\| "",\n            village_id: item\.village_id \|\| item\.villageId \|\| item\.desa_id \|\| "",', replacement2, code, count=1)

with open('src/App.tsx', 'w') as f:
    f.write(code)
