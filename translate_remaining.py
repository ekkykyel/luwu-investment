import re
import json

def update_json(filepath, lang):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    if "dashboard" not in data:
        data["dashboard"] = {}
    if "map" not in data:
        data["map"] = {}
        
    data["dashboard"].update({
        "sectorFiltered": "📍 Sector: Dynamically Filtered" if lang == "en" else ("📍 部门：动态过滤" if lang == "zh" else "📍 Sektor: Terfilter Dinamis"),
        "filterSummary": "Filter Results Summary" if lang == "en" else ("过滤结果摘要" if lang == "zh" else "Ringkasan Hasil Filter"),
        "avgScaleEnterprise": "💼 Avg Scale: Enterprise" if lang == "en" else ("💼 平均规模：企业" if lang == "zh" else "💼 Rata-rata Skala: Enterprise"),
        "pa": "p.a" if lang == "en" else ("每年" if lang == "zh" else "p.a"),
        "fold": "Fold" if lang == "en" else ("倍" if lang == "zh" else "Lipat"),
        "arcModule": "ARC-WEB GIS MODULE" if lang == "en" else ("ARC-WEB GIS模块" if lang == "zh" else "ARC-WEB GIS MODULE")
    })
    
    data["map"].update({
        "aligningBasemap": "Aligning Spatial Basemap..." if lang == "en" else ("正在对齐空间底图..." if lang == "zh" else "Menyelaraskan Basemap Spasial...")
    })
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

update_json('src/locales/id.json', 'id')
update_json('src/locales/en.json', 'en')
update_json('src/locales/zh.json', 'zh')

with open('src/components/InvestorDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('>📍 Sektor: Terfilter Dinamis<', '>{t("dashboard.sectorFiltered", "📍 Sektor: Terfilter Dinamis")}<')
content = content.replace('>Ringkasan Hasil Filter<', '>{t("dashboard.filterSummary", "Ringkasan Hasil Filter")}<')
content = content.replace('>💼 Rata-rata Skala: Enterprise<', '>{t("dashboard.avgScaleEnterprise", "💼 Rata-rata Skala: Enterprise")}<')
content = content.replace('>p.a<', '>{t("dashboard.pa", "p.a")}<')
content = content.replace('>Lipat<', '>{t("dashboard.fold", "Lipat")}<')
content = content.replace('>ARC-WEB GIS MODULE<', '>{t("dashboard.arcModule", "ARC-WEB GIS MODULE")}<')

with open('src/components/InvestorDashboard.tsx', 'w') as f:
    f.write(content)


with open('src/components/MaplibreComponent.tsx', 'r') as f:
    content = f.read()

content = content.replace('>Menyelaraskan Basemap Spasial...<', '>{t("map.aligningBasemap", "Menyelaraskan Basemap Spasial...")}<')

with open('src/components/MaplibreComponent.tsx', 'w') as f:
    f.write(content)
