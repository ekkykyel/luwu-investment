import re

with open('src/components/SmartInvestmentFormEngine.tsx', 'r') as f:
    code = f.read()

replacement = """      const supabasePayload = {
        name: formData.title || "Untitled",
        sector: formData.sector,
        sub_sector: formData.subSector,
        status: formData.status,
        district_id: formData.districtId ? String(formData.districtId) : null,
        village_id: formData.villageId ? String(formData.villageId) : null,
        id_kecamatan: formData.districtId ? Number(formData.districtId) : null,
        id_desa: formData.villageId ? Number(formData.villageId) : null,
        latitude: Number(formData.latitude) || 0,"""

code = re.sub(
r'      const supabasePayload = \{\n        name: formData\.title \|\| "Untitled",\n        sector: formData\.sector,\n        sub_sector: formData\.subSector,\n        status: formData\.status,\n        district_id: formData\.districtId,\n        village_id: formData\.villageId,\n        latitude: Number\(formData\.latitude\) \|\| 0,',
replacement,
code,
count=1
)

with open('src/components/SmartInvestmentFormEngine.tsx', 'w') as f:
    f.write(code)
