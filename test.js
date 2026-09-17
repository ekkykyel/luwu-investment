function normalizeDistrictName(name) {
  if (!name) return "";
  const cleaned = String(name)
    .toLowerCase()
    .replace(/^dist_/i, "")
    .replace(/kec\.\s*/gi, "")
    .replace(/kecamatan\s*/gi, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (cleaned === "bua ponrang" || cleaned === "buaponrang" || cleaned === "buapon") return "bua ponrang";
  return cleaned;
}
console.log(normalizeDistrictName("dist_bua"));
console.log(normalizeDistrictName("dist_bua_ponrang"));
console.log(normalizeDistrictName("Bua Ponrang"));
