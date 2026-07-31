import re
import json

def update_json(filepath, lang):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    if "mapControls" not in data:
        data["mapControls"] = {}
    if "common" not in data:
        data["common"] = {}
    if "pwa" not in data:
        data["pwa"] = {}
        
    data["mapControls"].update({
        "mapControl": "Map Control" if lang == "en" else ("地图控制" if lang == "zh" else "Kontrol Peta"),
        "analytics": "Analytics" if lang == "en" else ("分析" if lang == "zh" else "Analitik"),
        "spatialMasterLayer": "Spatial Master Layer" if lang == "en" else ("空间主图层" if lang == "zh" else "Master Layer Spasial"),
        "loadingRoadData": "Loading road data..." if lang == "en" else ("正在加载道路数据..." if lang == "zh" else "Memuat data jalan..."),
        "closeSidebar": "Close Sidebar" if lang == "en" else ("关闭侧边栏" if lang == "zh" else "Tutup Sidebar"),
        "closeMapMenu": "Close Map Menu" if lang == "en" else ("关闭地图菜单" if lang == "zh" else "Tutup Menu Peta"),
        "investorAnalyticsHub": "Investor Analytics Hub" if lang == "en" else ("投资者分析中心" if lang == "zh" else "Hub Analitik Berbasis Investor"),
        "loadingSpatialData": "Loading Spatial Data..." if lang == "en" else ("正在加载空间数据..." if lang == "zh" else "Memuat Data Spasial..."),
        "layerGroups": {
            "administration": "Administration" if lang == "en" else ("行政管理" if lang == "zh" else "Administrasi"),
            "environment": "Environment" if lang == "en" else ("环境" if lang == "zh" else "Lingkungan"),
            "potential": "Potential & Commodities" if lang == "en" else ("潜力和商品" if lang == "zh" else "Potensi & Komoditas"),
            "others": "Others" if lang == "en" else ("其他" if lang == "zh" else "Lainnya")
        }
    })
    
    data["pwa"].update({
        "title": "🚨 FULL SCREEN MAIN PORTAL (PWA)" if lang == "en" else ("🚨 全屏主门户 (PWA)" if lang == "zh" else "🚨 PORTAL UTAMA LAYAR PENUH (PWA)"),
        "description": "Install the application to your Home Screen to enable **Automatic Fullscreen** without the Chrome browser bar, just like a native Android app!" if lang == "en" else ("将应用程序安装到主屏幕，无需Chrome浏览器栏即可启用**自动全屏**，就像原生Android应用程序一样！" if lang == "zh" else "Instal aplikasi ke Layar Utama HP Anda untuk mengaktifkan **Layar Penuh (Fullscreen) Otomatis** tanpa bilah browser Chrome, layaknya aplikasi Android asli!")
    })
    
    data["common"]["close"] = "Close" if lang == "en" else ("关闭" if lang == "zh" else "Tutup")
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

update_json('src/locales/id.json', 'id')
update_json('src/locales/en.json', 'en')
update_json('src/locales/zh.json', 'zh')

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure useTranslation is imported and initialized
# It might already be. App.tsx usually has it.
# Let's do replacements
content = content.replace('"Kontrol Peta"', 't("mapControls.mapControl", "Kontrol Peta")')
content = content.replace('>Kontrol Peta<', '>{t("mapControls.mapControl", "Kontrol Peta")}<')
content = content.replace('>Analitik<', '>{t("mapControls.analytics", "Analitik")}<')
content = content.replace('>Master Layer Spasial<', '>{t("mapControls.spatialMasterLayer", "Master Layer Spasial")}<')
content = content.replace('>Memuat data jalan...<', '>{t("mapControls.loadingRoadData", "Memuat data jalan...")}<')
content = content.replace('"Tutup Sidebar"', 't("mapControls.closeSidebar", "Tutup Sidebar")')
content = content.replace('"Tutup Menu Peta"', 't("mapControls.closeMapMenu", "Tutup Menu Peta")')
content = content.replace('>Hub Analitik Berbasis Investor<', '>{t("mapControls.investorAnalyticsHub", "Hub Analitik Berbasis Investor")}<')
content = content.replace('>Memuat Data Spasial...<', '>{t("mapControls.loadingSpatialData", "Memuat Data Spasial...")}<')
content = content.replace("{ name: 'Administrasi', layers: adminLayers }", "{ name: t('mapControls.layerGroups.administration', 'Administrasi'), layers: adminLayers }")
content = content.replace("{ name: 'Lingkungan', layers: envLayers }", "{ name: t('mapControls.layerGroups.environment', 'Lingkungan'), layers: envLayers }")
content = content.replace("{ name: 'Potensi & Komoditas', layers: potLayers }", "{ name: t('mapControls.layerGroups.potential', 'Potensi & Komoditas'), layers: potLayers }")
content = content.replace("{ name: 'Lainnya', layers: otherLayers }", "{ name: t('mapControls.layerGroups.others', 'Lainnya'), layers: otherLayers }")
content = content.replace('>🚨 PORTAL UTAMA LAYAR PENUH (PWA)<', '>{t("pwa.title", "🚨 PORTAL UTAMA LAYAR PENUH (PWA)")}<')
content = content.replace('>Instal aplikasi ke Layar Utama HP Anda untuk mengaktifkan **Layar Penuh (Fullscreen) Otomatis** tanpa bilah browser Chrome, layaknya aplikasi Android asli!<', '>{t("pwa.description", "Instal aplikasi ke Layar Utama HP Anda untuk mengaktifkan **Layar Penuh (Fullscreen) Otomatis** tanpa bilah browser Chrome, layaknya aplikasi Android asli!")}<')

with open('src/App.tsx', 'w') as f:
    f.write(content)
