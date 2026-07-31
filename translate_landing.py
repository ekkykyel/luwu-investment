import re
import json

def update_json(filepath, lang):
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    if "landing" not in data:
        data["landing"] = {}
        
    data["landing"].update({
        "commandCenter": "Command Center & Executive Dashboard" if lang == "en" else ("指挥中心与执行仪表板" if lang == "zh" else "Pusat Komando & Dashboard Eksekutif"),
        "home": "Home" if lang == "en" else ("首页" if lang == "zh" else "Beranda"),
        "login": "Login" if lang == "en" else ("登录" if lang == "zh" else "Masuk"),
        "register": "Register" if lang == "en" else ("注册" if lang == "zh" else "Daftar"),
        "potential": "Potential" if lang == "en" else ("潜力" if lang == "zh" else "Potensi"),
        "gisMap": "GIS Map" if lang == "en" else ("GIS地图" if lang == "zh" else "Peta GIS"),
        "annualRoi": "Annual ROI" if lang == "en" else ("年投资回报率" if lang == "zh" else "ROI Tahunan"),
        "netProfit": "Net Profit" if lang == "en" else ("净利润" if lang == "zh" else "Net Profit"),
        "perYearNet": "Net per year" if lang == "en" else ("每年净收益" if lang == "zh" else "Per tahun bersih"),
        "live": "Live" if lang == "en" else ("实时" if lang == "zh" else "Live"),
        "spatialDistribution": "Spatial Distribution:" if lang == "en" else ("空间分布：" if lang == "zh" else "Persebaran Spasial:"),
        "dataAreaNotAvailable": "Area size data not yet available" if lang == "en" else ("面积数据暂不可用" if lang == "zh" else "Data luasan area per area belum tersedia"),
        "dataSpatialNotAvailable": "Spatial composition data not yet available" if lang == "en" else ("空间组成数据暂不可用" if lang == "zh" else "Data komposisi spasial belum tersedia"),
        "dataCommodityNotAvailable": "Commodity data per district not yet available" if lang == "en" else ("各区商品数据暂不可用" if lang == "zh" else "Data komoditas per kecamatan belum tersedia"),
        "people": "People" if lang == "en" else ("人" if lang == "zh" else "Jiwa"),
        "screening": "Screening & Verification of Interest (LoI)" if lang == "en" else ("兴趣筛选与验证 (LoI)" if lang == "zh" else "Penjaringan & Verifikasi Minat (LoI)"),
        "siteVisit": "Site Visit Escort & Land Mediation" if lang == "en" else ("现场考察护送与土地调解" if lang == "zh" else "Kawal Site Visit & Mediasi Lahan"),
        "legalExecution": "Legality Execution & OSS-RBA" if lang == "en" else ("合法性执行与OSS-RBA" if lang == "zh" else "Eksekusi Legalitas & OSS-RBA"),
        "gateway": "Gateway" if lang == "en" else ("门户" if lang == "zh" else "Gateway"),
        "hub": "Hub" if lang == "en" else ("枢纽" if lang == "zh" else "Hub"),
        "twentyFourSeven": "24/7 Active" if lang == "en" else ("全天候服务" if lang == "zh" else "24/7 Aktif"),
        "infrastructureEcosystem": "Infrastructure & Ecosystem" if lang == "en" else ("基础设施与生态系统" if lang == "zh" else "Infrastruktur & Ekosistem"),
        "poweredByAI": "Powered by AI & Spatial Logic" if lang == "en" else ("由人工智能与空间逻辑驱动" if lang == "zh" else "Powered by AI & Spatial Logic"),
        "mppBannerTag": "Integrated Licensing" if lang == "en" else ("综合许可" if lang == "zh" else "Perizinan Terpadu")
    })
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)

update_json('src/locales/id.json', 'id')
update_json('src/locales/en.json', 'en')
update_json('src/locales/zh.json', 'zh')

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('>Pusat Komando & Dashboard Eksekutif<', '>{t("landing.commandCenter", "Pusat Komando & Dashboard Eksekutif")}<')
content = content.replace('>Beranda<', '>{t("landing.home", "Beranda")}<')
content = content.replace('>Masuk<', '>{t("landing.login", "Masuk")}<')
content = content.replace('>Daftar<', '>{t("landing.register", "Daftar")}<')
content = content.replace('>Potensi<', '>{t("landing.potential", "Potensi")}<')
content = content.replace('>Peta GIS<', '>{t("landing.gisMap", "Peta GIS")}<')
content = content.replace('>ROI Tahunan<', '>{t("landing.annualRoi", "ROI Tahunan")}<')
content = content.replace('>Net Profit<', '>{t("landing.netProfit", "Net Profit")}<')
content = content.replace('>Per tahun bersih<', '>{t("landing.perYearNet", "Per tahun bersih")}<')
content = content.replace('>Live<', '>{t("landing.live", "Live")}<')
content = content.replace('>Persebaran Spasial:<', '>{t("landing.spatialDistribution", "Persebaran Spasial:")}<')
content = content.replace('>Data luasan area per area belum tersedia<', '>{t("landing.dataAreaNotAvailable", "Data luasan area per area belum tersedia")}<')
content = content.replace('>Data komposisi spasial belum tersedia<', '>{t("landing.dataSpatialNotAvailable", "Data komposisi spasial belum tersedia")}<')
content = content.replace('>Data komoditas per kecamatan belum tersedia<', '>{t("landing.dataCommodityNotAvailable", "Data komoditas per kecamatan belum tersedia")}<')
content = content.replace('>Jiwa<', '>{t("landing.people", "Jiwa")}<')
content = content.replace('Jiwa (89.4%)', '{t("landing.people", "Jiwa")} (89.4%)')
content = content.replace('Jiwa (10.6%)', '{t("landing.people", "Jiwa")} (10.6%)')
content = content.replace('>Penjaringan & Verifikasi Minat (LoI)<', '>{t("landing.screening", "Penjaringan & Verifikasi Minat (LoI)")}<')
content = content.replace('>Kawal Site Visit & Mediasi Lahan<', '>{t("landing.siteVisit", "Kawal Site Visit & Mediasi Lahan")}<')
content = content.replace('>Eksekusi Legalitas & OSS-RBA<', '>{t("landing.legalExecution", "Eksekusi Legalitas & OSS-RBA")}<')
content = content.replace('>Gateway<', '>{t("landing.gateway", "Gateway")}<')
content = content.replace('>Hub<', '>{t("landing.hub", "Hub")}<')
content = content.replace('>24/7 Aktif<', '>{t("landing.twentyFourSeven", "24/7 Aktif")}<')
content = content.replace('>Infrastruktur & Ekosistem<', '>{t("landing.infrastructureEcosystem", "Infrastruktur & Ekosistem")}<')
content = content.replace('>Powered by AI & Spatial Logic<', '>{t("landing.poweredByAI", "Powered by AI & Spatial Logic")}<')

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
