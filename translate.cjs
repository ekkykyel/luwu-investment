const fs = require('fs');

const dictionaries = {
  id: {
    "placeholders": {
      "nik": "16 Digit NIK KTP",
      "phone": "08xxxxxxxxxx"
    },
    "tooltips": {
      "openAi": "Buka Asisten AI Tabe'",
      "notifications": "Pemberitahuan Layanan"
    },
    "ai": {
      "placeholder": "Tanyakan perizinan, antrean, atau MPP...",
      "voiceInput": "Input Suara (Segera Hadir)",
      "fast": "Cepat",
      "noQueue": "Tanpa antre",
      "transparent": "Transparan",
      "realtime": "Real-time",
      "integrated": "Terpadu",
      "oneRoof": "Satu Atap",
      "quickExample": "Contoh Cepat:"
    },
    "news": {
      "viewAll": "Lihat Semua Berita"
    },
    "map": {
      "openInteractive": "Buka Peta Interaktif (WebGIS)"
    },
    "status": {
      "systemActive": "Sistem Aktif",
      "activeQueue": "Antrean Aktif"
    },
    "helpdesk": {
      "open": "Buka Helpdesk",
      "topics": {
        "dpmptsp": "Perizinan Berusaha & Non-Berusaha (DPMPTSP)",
        "pbg": "Persetujuan Bangunan Gedung (PBG) & PKKPR",
        "disdukcapil": "KTP, KK, Akta Kelahiran (Disdukcapil)",
        "bapenda": "Pajak PBB & Retribusi Daerah (Bapenda)",
        "samsat": "SAMSAT Pajak Kendaraan & SKCK Polri",
        "other": "Lainnya / Pertanyaan Umum"
      }
    },
    "general": {
      "mppLuwu": "MPP Simpurusiang Kab. Luwu",
      "copied": "Tersalin!",
      "applicant": "Pemohon:",
      "agency": "Instansi:"
    },
    "contact": {
      "chatWhatsapp": "Chat di WhatsApp",
      "direct": "WhatsApp Direct"
    },
    "stats": {
      "time": {
        "mon": "Sen",
        "tue": "Sel",
        "wed": "Rab",
        "thu": "Kam",
        "fri": "Jum",
        "jan": "Jan",
        "mar": "Mar",
        "may": "Mei",
        "jul": "Jul",
        "sep": "Sep",
        "dec": "Des"
      }
    }
  },
  en: {
    "placeholders": {
      "nik": "16 Digit ID Number (NIK)",
      "phone": "08xxxxxxxxxx"
    },
    "tooltips": {
      "openAi": "Open Tabe' AI Assistant",
      "notifications": "Service Notifications"
    },
    "ai": {
      "placeholder": "Ask about permits, queues, or MPP...",
      "voiceInput": "Voice Input (Coming Soon)",
      "fast": "Fast",
      "noQueue": "No Queue",
      "transparent": "Transparent",
      "realtime": "Real-time",
      "integrated": "Integrated",
      "oneRoof": "One Roof",
      "quickExample": "Quick Example:"
    },
    "news": {
      "viewAll": "View All News"
    },
    "map": {
      "openInteractive": "Open Interactive Map (WebGIS)"
    },
    "status": {
      "systemActive": "System Active",
      "activeQueue": "Active Queue"
    },
    "helpdesk": {
      "open": "Open Helpdesk",
      "topics": {
        "dpmptsp": "Business & Non-Business Licensing (DPMPTSP)",
        "pbg": "Building Approval (PBG) & PKKPR",
        "disdukcapil": "ID Card, Family Card, Birth Certificate (Disdukcapil)",
        "bapenda": "Property Tax & Regional Retribution (Bapenda)",
        "samsat": "Vehicle Tax SAMSAT & Police Certificate",
        "other": "Other / General Questions"
      }
    },
    "general": {
      "mppLuwu": "Luwu Regency MPP Simpurusiang",
      "copied": "Copied!",
      "applicant": "Applicant:",
      "agency": "Agency:"
    },
    "contact": {
      "chatWhatsapp": "Chat on WhatsApp",
      "direct": "WhatsApp Direct"
    },
    "stats": {
      "time": {
        "mon": "Mon",
        "tue": "Tue",
        "wed": "Wed",
        "thu": "Thu",
        "fri": "Fri",
        "jan": "Jan",
        "mar": "Mar",
        "may": "May",
        "jul": "Jul",
        "sep": "Sep",
        "dec": "Dec"
      }
    }
  },
  zh: {
    "placeholders": {
      "nik": "16位身份证号 (NIK)",
      "phone": "08xxxxxxxxxx"
    },
    "tooltips": {
      "openAi": "打开 Tabe' AI 助手",
      "notifications": "服务通知"
    },
    "ai": {
      "placeholder": "询问有关许可证、排队或 MPP 的信息...",
      "voiceInput": "语音输入 (即将推出)",
      "fast": "快速",
      "noQueue": "无需排队",
      "transparent": "透明",
      "realtime": "实时",
      "integrated": "综合",
      "oneRoof": "一站式",
      "quickExample": "快速示例："
    },
    "news": {
      "viewAll": "查看所有新闻"
    },
    "map": {
      "openInteractive": "打开交互式地图 (WebGIS)"
    },
    "status": {
      "systemActive": "系统活跃",
      "activeQueue": "活跃队列"
    },
    "helpdesk": {
      "open": "打开服务台",
      "topics": {
        "dpmptsp": "商业与非商业许可 (DPMPTSP)",
        "pbg": "建筑审批 (PBG) 和 PKKPR",
        "disdukcapil": "身份证、户口本、出生证明 (Disdukcapil)",
        "bapenda": "财产税与地方税 (Bapenda)",
        "samsat": "车辆税 SAMSAT 与警察证明",
        "other": "其他 / 一般问题"
      }
    },
    "general": {
      "mppLuwu": "卢乌摄政 MPP Simpurusiang",
      "copied": "已复制！",
      "applicant": "申请人：",
      "agency": "机构："
    },
    "contact": {
      "chatWhatsapp": "在 WhatsApp 上聊天",
      "direct": "WhatsApp 直接联系"
    },
    "stats": {
      "time": {
        "mon": "周一",
        "tue": "周二",
        "wed": "周三",
        "thu": "周四",
        "fri": "周五",
        "jan": "一月",
        "mar": "三月",
        "may": "五月",
        "jul": "七月",
        "sep": "九月",
        "dec": "十二月"
      }
    }
  }
};

['id', 'en', 'zh'].forEach(lang => {
  const path = `src/locales/${lang}.json`;
  let data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (!data.mppPortal) data.mppPortal = {};
  
  // Merge the new translations
  Object.keys(dictionaries[lang]).forEach(key => {
    data.mppPortal[key] = { ...data.mppPortal[key], ...dictionaries[lang][key] };
  });
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
});

console.log("Locales updated!");
