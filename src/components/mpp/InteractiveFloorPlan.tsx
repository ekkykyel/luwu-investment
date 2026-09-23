import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, Building2, Armchair, Baby, 
  Store, Moon, Laptop, BookOpen, HeartHandshake, 
  ChevronRight, Compass, Sparkles, CheckCircle2, Clock, 
  ArrowUpRight, Accessibility, Search, Navigation, 
  Footprints, Shield, Info, MapPin, X
} from 'lucide-react';

export interface RoomZone {
  id: string;
  floor: number;
  name: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  coordinates: { x: number; y: number; w: number; h: number };
  hours: string;
  services: string[];
  capacity: string;
  image: string;
  deskHeight: string;
  wheelchairAccessible: boolean;
  wayfindingRoute: string[];
}

export function InteractiveFloorPlan({ isDark = false }: { isDark?: boolean }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'id';
  const isEn = currentLang.startsWith('en');
  const isZh = currentLang.startsWith('zh');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWheelchairFilterActive, setIsWheelchairFilterActive] = useState<boolean>(false);

  const zonesData: RoomZone[] = useMemo(() => {
    if (isZh) {
      return [
        {
          id: 'l1-frontoffice',
          floor: 1,
          name: '前台、接待处与在线取号 E-Kiosk',
          category: '公共设施',
          description: '来访登记中心、人体工程学高度触控屏数字取号机及综合服务初始咨询处。',
          icon: Laptop,
          color: 'from-blue-500 to-indigo-600',
          coordinates: { x: 10, y: 15, w: 25, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['数字门票签到', '材料要求咨询', '自助表格填报协助', '免费轮椅借用'],
          capacity: '15 人',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
          deskHeight: '低矮服务台 75 cm（轮椅友好）',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '起点：辛普鲁西亚政务服务中心正门大门',
            '通过自动感应玻璃门及坡度 6% 的平缓坡道',
            '在线取号 E-Kiosk 和接待台位于入口正前方 5 米处'
          ]
        },
        {
          id: 'l1-kependudukan',
          floor: 1,
          name: '户籍与身份登记服务区 (Disdukcapil)',
          category: '服务窗口',
          description: '鲁乌县民政局综合窗口，提供电子身份证 (e-KTP) 采集与打印、户口簿、儿童身份卡 (KIA)、出生证明及户口迁移办理。',
          icon: Building2,
          color: 'from-emerald-500 to-teal-600',
          coordinates: { x: 40, y: 15, w: 30, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['电子身份证 (e-KTP) 快速采集与打印', '儿童身份卡 (KIA)', '出生与死亡证明', '数字户籍身份 (IKD) 激活'],
          capacity: '20 人',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: '01号低矮窗口 75 cm（老年人与残障人士优先）',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从前台出发，顺着黄色无障碍盲道直行 12 米',
            '在 1 楼东翼右转',
            '01-04 号 Disdukcapil 窗口位于右侧，紧邻 KTP 照片采集室'
          ]
        },
        {
          id: 'l1-perizinan-oss',
          floor: 1,
          name: '商业许可 (OSS) 与建筑工程服务区 (DPMPTSP & PUPTR)',
          category: '服务窗口',
          description: 'PBG 建筑物批准、环保许可、商业经营许可 (NIB)、卫生许可及跨部门技术推荐核验中心。',
          icon: Building2,
          color: 'from-blue-500 to-teal-600',
          coordinates: { x: 55, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['建筑物批准 (PBG SIMBG)', '大中型企业 NIB 核发', '药房/诊所执业许可', '环境文件核验 (AMDAL/UKL-UPL)'],
          capacity: '25 人',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: '半私密咨询服务台',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从前台出发，顺着主走廊向北直行 15 米',
            'OSS & PBG 许可大厅位于 1 楼中央明亮的大玻璃厅内'
          ]
        },
        {
          id: 'l1-pajak-bank',
          floor: 1,
          name: '地方税收 (Bapenda) 与 Sulselbar 银行服务区',
          category: '服务窗口',
          description: '地方税费缴纳服务（PBB-P2、BPHTB、行政规费）及官方银行出纳窗口，无需在楼外排队。',
          icon: Store,
          color: 'from-amber-500 to-orange-600',
          coordinates: { x: 75, y: 15, w: 20, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['PBB 房产税缴纳与 BPHTB 审核', 'Bank Sulselbar 银行出纳窗口', '地方税收与企业税费咨询', '自动取款机 ATM'],
          capacity: '12 人',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
          deskHeight: '低矮出纳台与轮椅专属排队通道',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从前台出发，左转沿 1 楼西侧走廊直行 15 米',
            'Bank Sulselbar 窗口和 Bapenda 税务窗口位于走廊尽头左侧',
            '配有 ATM 机和无障碍出纳窗口'
          ]
        },
        {
          id: 'l1-investor-lounge',
          floor: 1,
          name: 'VIP 投资者贵宾厅与绿色通道 (DPMPTSP)',
          category: 'VIP 投资者',
          description: '专为投资者提供的综合咨询贵宾室，配备 DPMPTSP 专人协助、鲁乌投资地图 GIS 空间系统及地方优惠政策解读。',
          icon: Armchair,
          color: 'from-emerald-500 to-cyan-600',
          coordinates: { x: 10, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['技术团队一对一 VIP 咨询', 'ROI 投资回报模拟与 RTRW GIS 系统', 'OSS-RBA 与 PKKPR 办理协助', '特级鲁乌咖啡招待'],
          capacity: '15 名 VIP 投资者',
          image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
          deskHeight: '人体工程学会议桌与宽敞进出通道',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从 1 楼大厅入口右侧进入 VIP 走廊直行 10 米',
            'VIP 投资者休息室位于 1 楼东翼双开玻璃门处'
          ]
        },
        {
          id: 'l1-ruang-mediasi',
          floor: 1,
          name: '调解室与检察院法律咨询处',
          category: '法律咨询',
          description: '隔音会议室，用于行政许可争议解决、鲁乌县地方检察院免费法律咨询及 SP4N-LAPOR 投诉受理。',
          icon: HeartHandshake,
          color: 'from-slate-600 to-slate-800',
          coordinates: { x: 10, y: 55, w: 35, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['地方检察院民事行政免费法律门诊', '土地与许可纠纷调解', 'SP4N-LAPOR 现场投诉通道', '残障人士法律援助咨询'],
          capacity: '12 人',
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
          deskHeight: '声学隔音无障碍会议室',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从 1 楼西侧走廊向南直行 10 米',
            '调解室位于挂有 "综合法律诊所" 门牌的隔音门处'
          ]
        },
        {
          id: 'l1-laktasi-kids',
          floor: 1,
          name: '母婴室与儿童益智游乐区',
          category: '无障碍设施',
          description: '清洁、卫生、配有中央空调的母婴友好设施，配备私密哺乳沙发、消毒水槽及 SNI 认证益智玩具。',
          icon: Baby,
          color: 'from-rose-500 to-pink-600',
          coordinates: { x: 10, y: 55, w: 25, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['私密清洁哺乳沙发', '奶瓶消毒器与温水洗手池', '小型儿童游乐场与绘本', '母乳专用储存冰箱'],
          capacity: '10 名儿童与母亲',
          image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800',
          deskHeight: '90 cm 无障碍宽门（婴儿车无障碍）',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从前台出发，向南走廊走向主等候区',
            '母婴室入口位于公共卫生间前的左侧',
            '配备带有儿童友好按键的自动平移门'
          ]
        },
        {
          id: 'l1-lounge-baca',
          floor: 1,
          name: '行政等候休息室与数字阅读角',
          category: '公共设施',
          description: '铺设地毯的舒适沙发等候区，配有高速 Wi-Fi、免费充电站、数字图书馆平板及免费饮用水。',
          icon: BookOpen,
          color: 'from-purple-500 to-violet-600',
          coordinates: { x: 40, y: 55, w: 55, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['高速 Wi-Fi 100 Mbps', '数字图书馆平板屏与纸质图书', '免费茶水咖啡服务', 'FIDS 叫号大屏'],
          capacity: '50 人',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
          deskHeight: '轮椅专属停靠区及电源充电插座',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '位于 1 楼大厅正中央',
            '四周环绕 LED 叫号显示屏，视角清晰'
          ]
        },
        {
          id: 'l1-musholla-vip',
          floor: 1,
          name: 'Al-Mabrur 祈祷室与无障碍洗礼处',
          category: '公共设施',
          description: '宽敞、清洁、舒适的祈祷设施，配备空调、干净礼拜用品以及专为老年人和残障人士设计的坐式小净池。',
          icon: Moon,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 50, y: 55, w: 45, h: 35 },
          hours: '全营业时间开放',
          services: ['清洁的礼拜毯与用具', '凉爽空调', '残障/老年人专用坐式小净池', 'CCTV 监控'],
          capacity: '30 人',
          image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
          deskHeight: '平整地面，配有专用祈祷椅子',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '在 1 楼，顺着绿色圆顶指示牌前往东侧走廊',
            '位于东侧走廊尽头，紧邻楼宇花园'
          ]
        },
        {
          id: 'l1-toilet-difabel',
          floor: 1,
          name: '无障碍卫生间与主无障碍坡道',
          category: '无障碍设施',
          description: '符合公共工程部标准的无障碍卫生间，配备 90 cm 移门、不锈钢扶手、SOS 紧急呼叫按钮及低矮洗手池。',
          icon: Accessibility,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 75, y: 55, w: 20, h: 35 },
          hours: '全营业时间开放',
          services: ['100 cm 宽平移门', '结实不锈钢安全扶手', '直通值班人员的 SOS 呼叫按钮', '防滑地板'],
          capacity: '1 名申请人 + 1 名陪同',
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
          deskHeight: '马桶高度 45-50 cm 符合轮椅 standard',
          wheelchairAccessible: true,
          wayfindingRoute: [
            '从 1 楼东侧走廊出发，顺着国际残疾人标识指示',
            '位于 1 楼东翼走廊右侧'
          ]
        }
      ];
    } else if (isEn) {
      return [
        {
          id: 'l1-frontoffice',
          floor: 1,
          name: 'Front Office, Reception & Digital Queue E-Kiosk',
          category: 'Public Facilities',
          description: 'Arrival check-in center, touch-screen digital queue kiosk with ergonomic height, and initial one-stop service information.',
          icon: Laptop,
          color: 'from-blue-500 to-indigo-600',
          coordinates: { x: 10, y: 15, w: 25, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Digital Ticket Check-in', 'Document Requirement Info', 'Self-Form Assistance', 'Free Wheelchair Rental'],
          capacity: '15 Applicants',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Low Desk 75 cm (Wheelchair Accessible)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Starting Point: Main Entrance Gate of Simpurusiang MPP',
            'Enter through automatic sensor glass doors and 6% gentle slope ramp',
            'E-Kiosk and Reception Desk are located 5 meters straight ahead'
          ]
        },
        {
          id: 'l1-kependudukan',
          floor: 1,
          name: 'Civil Registration Cluster (Disdukcapil)',
          category: 'Service Counters',
          description: 'Integrated counters for e-KTP photo & print, Family Cards, Child Identity Cards (KIA), Birth Certificates, and Domicile Moves.',
          icon: Building2,
          color: 'from-emerald-500 to-teal-600',
          coordinates: { x: 40, y: 15, w: 30, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Express e-KTP Recording & Printing', 'Child Identity Card (KIA)', 'Birth & Death Certificate', 'Digital ID Activation (IKD)'],
          capacity: '20 Applicants',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Counter 01 Low Desk 75 cm (Elderly & Disabled Priority)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From Front Office, follow yellow tactile guiding blocks straight for 12 meters',
            'Turn right at East Wing Floor 1',
            'Counters 01-04 Disdukcapil are on the right next to photo booths'
          ]
        },
        {
          id: 'l1-perizinan-oss',
          floor: 1,
          name: 'Business Licensing Cluster (OSS) & PUPTR Sectoral',
          category: 'Service Counters',
          description: 'Building Approvals (PBG), Environmental Permits, Business Licenses, Health Permits, and cross-department technical recommendations.',
          icon: Building2,
          color: 'from-blue-500 to-teal-600',
          coordinates: { x: 55, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Building Approval (PBG SIMBG)', 'Medium & Large NIB Issuance', 'Pharmacy / Clinic Operational Permits', 'Environmental Document Verification'],
          capacity: '25 Applicants',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Semi-Private Consultation Counter',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From Front Office, follow main corridor North for 15 meters',
            'OSS & PBG Licensing Cluster is located inside the central hall of Floor 1'
          ]
        },
        {
          id: 'l1-pajak-bank',
          floor: 1,
          name: 'Regional Revenue (Bapenda) & Bank Sulselbar Cluster',
          category: 'Service Counters',
          description: 'Local tax payments (PBB-P2, BPHTB, Retributions) and official teller counters without outdoor queues.',
          icon: Store,
          color: 'from-amber-500 to-orange-600',
          coordinates: { x: 75, y: 15, w: 20, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['PBB Payment & BPHTB Validation', 'Bank Sulselbar Teller Counter', 'Local Tax & Business Consultation', 'Cash ATM Machine'],
          capacity: '12 Applicants',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Low Teller Desk & Wheelchair Queue Lane',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From Front Office, turn left along West Corridor Floor 1 for 15 meters',
            'Bank Sulselbar Counter & Bapenda Tax Desk are at the end on the left',
            'ATM machines and accessible counters available'
          ]
        },
        {
          id: 'l1-investor-lounge',
          floor: 1,
          name: 'VIP Investor Lounge & Fast-Track Desk (DPMPTSP)',
          category: 'VIP Investor',
          description: 'Exclusive consultation lounge for investors with personal DPMPTSP assistance, Luwu GIS spatial investment mapping, and regional incentives.',
          icon: Armchair,
          color: 'from-emerald-500 to-cyan-600',
          coordinates: { x: 10, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['One-on-One Technical Team Consultation', 'ROI Simulation & Luwu Spatial GIS', 'OSS-RBA & PKKPR Assistance', 'Luwu Specialty Coffee Hospitality'],
          capacity: '15 VIP Investors',
          image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Ergonomic Meeting Table & Wide Doorway',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From Floor 1 Entrance, walk 10 meters along the East Wing corridor',
            'VIP Investor Lounge is at the double glass doors on the right side of Floor 1'
          ]
        },
        {
          id: 'l1-ruang-mediasi',
          floor: 1,
          name: 'Mediation Room & Legal Consultation Desk',
          category: 'Consultation',
          description: 'Soundproof meeting room for licensing dispute resolution, free legal consultation by Luwu State Prosecutor, and SP4N-LAPOR complaints.',
          icon: HeartHandshake,
          color: 'from-slate-600 to-slate-800',
          coordinates: { x: 10, y: 55, w: 35, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Free Legal Clinic by State Prosecutor', 'Land & Permit Dispute Mediation', 'Face-to-Face SP4N-LAPOR Complaint Desk', 'Disability Legal Aid'],
          capacity: '12 Persons',
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Soundproof Acoustic Room Barrier-Free',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Walk into West Corridor Floor 1 for 10 meters',
            'Mediation Room is at the soundproof door labeled "Integrated Legal Clinic"'
          ]
        },
        {
          id: 'l1-laktasi-kids',
          floor: 1,
          name: 'Lactation Room & Kids Play Area',
          category: 'Accessibility Facilities',
          description: 'Clean, hygienic, air-conditioned mother & child facility equipped with private sofa, sterilizer sink, and SNI educational toys.',
          icon: Baby,
          color: 'from-rose-500 to-pink-600',
          coordinates: { x: 10, y: 55, w: 25, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Private Clean Lactation Sofa', 'Bottle Sterilizer & Warm Water Sink', 'Mini Playground & Children Storybooks', 'Breast Milk Storage Fridge'],
          capacity: '10 Kids & Mothers',
          image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800',
          deskHeight: '90 cm Wide Door (Stroller Friendly)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From Front Office, walk south towards the main waiting lounge',
            'Lactation Room door is on the left before the restrooms',
            'Automatic sliding door with accessible opening button'
          ]
        },
        {
          id: 'l1-lounge-baca',
          floor: 1,
          name: 'Executive Waiting Lounge & Digital Reading Corner',
          category: 'Public Facilities',
          description: 'Carpeted lounge with soft sofas, high-speed Wi-Fi, free charging stations, digital e-library tablets, and complimentary drinking water.',
          icon: BookOpen,
          color: 'from-purple-500 to-violet-600',
          coordinates: { x: 40, y: 55, w: 55, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['High-speed Wi-Fi 100 Mbps', 'Digital Library Tablet Screen & Books', 'Free Water & Coffee Station', 'FIDS Queue Calling Screen'],
          capacity: '50 Applicants',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Dedicated Wheelchair Parking with Power Outlets',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Located right in the center atrium of Floor 1',
            'Surrounded by LED queue displays visible from all angles'
          ]
        },
        {
          id: 'l1-musholla-vip',
          floor: 1,
          name: 'Al-Mabrur Prayer Room & Seated Ablution',
          category: 'Public Facilities',
          description: 'Spacious, clean prayer facility with AC, clean prayer rugs/garments, and seated ablution area for elderly and disabled visitors.',
          icon: Moon,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 50, y: 55, w: 45, h: 35 },
          hours: 'Open All Operational Hours',
          services: ['Clean Prayer Rugs & Attire', 'Cooling Air Conditioning', 'Seated Ablution Area for Disabled / Elderly', 'CCTV Security Camera'],
          capacity: '30 Worshippers',
          image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Flat Flooring with Special Prayer Chairs',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'On Floor 1, follow green dome signage to East corridor',
            'Located at the end of the east corridor next to the garden patio'
          ]
        },
        {
          id: 'l1-toilet-difabel',
          floor: 1,
          name: 'Accessible Restroom & Main Ramp',
          category: 'Accessibility Facilities',
          description: 'Ministry of Public Works compliant restroom with 90 cm sliding door, grab bars, SOS emergency button, and low sink.',
          icon: Accessibility,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 75, y: 55, w: 20, h: 35 },
          hours: 'Open All Operational Hours',
          services: ['100 cm Sliding Door', 'Sturdy Stainless Steel Grab Bars', 'SOS Emergency Alarm Button to Duty Staff', 'Anti-Slip Flooring'],
          capacity: '1 Applicant + 1 Assistant',
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Seat Height 45-50 cm Wheelchair Standard',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'From East Corridor Floor 1, follow international disability pictograms',
            'Located on the right side of the East corridor'
          ]
        }
      ];
    } else {
      // Indonesian Language Default
      return [
        {
          id: 'l1-frontoffice',
          floor: 1,
          name: 'Front Office, Meja Resepsionis & E-Kiosk Antrean',
          category: 'Fasilitas Umum',
          description: 'Pusat registrasi kedatangan, pengambilan tiket antrean digital layar sentuh dengan ketinggian ergonomis, dan informasi awal layanan terpadu.',
          icon: Laptop,
          color: 'from-blue-500 to-indigo-600',
          coordinates: { x: 10, y: 15, w: 25, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Check-in Tiket Digital', 'Informasi Persyaratan Berkas', 'Bantuan Pengisian Formulir Mandiri', 'Peminjaman Kursi Roda Gratis'],
          capacity: '15 Pemohon',
          image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Meja Rendah 75 cm (Aksesibel Kursi Roda)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Titik Awal: Pintu Masuk Utama Gerbang MPP Simpurusiang Lantai 1',
            'Masuk melewati pintu kaca sensor otomatis dan jalur ramp landai kelandaian 6%',
            'Mesin E-Kiosk dan Meja Resepsionis berada 5 meter lurus di depan pintu masuk'
          ]
        },
        {
          id: 'l1-kependudukan',
          floor: 1,
          name: 'Klaster Kependudukan & Pencatatan Sipil (Disdukcapil)',
          category: 'Loket Layanan',
          description: 'Layanan terpadu cetak KTP-el, Kartu Keluarga, Kartu Identitas Anak (KIA), Akta Kelahiran, dan Surat Pindah Domisili tanpa calo.',
          icon: Building2,
          color: 'from-emerald-500 to-teal-600',
          coordinates: { x: 40, y: 15, w: 30, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Perekaman & Cetak Cepat KTP-el', 'Penerbitan KIA', 'Akta Kelahiran & Kematian', 'Aktivasi Identitas Kependudukan Digital (IKD)'],
          capacity: '20 Pemohon',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Loket 01 Meja Rendah 75 cm (Prioritas Lansia & Difabel)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari Front Office, ikuti ubin pemandu kuning (guiding block) lurus 12 meter',
            'Belok kanan pada Sayap Timur Lantai 1',
            'Loket 01-04 Disdukcapil berada di sisi kanan berdampingan dengan bilik foto KTP'
          ]
        },
        {
          id: 'l1-perizinan-oss',
          floor: 1,
          name: 'Klaster Perizinan Berusaha (OSS) & Sektoral DPMPTSP / PUPTR',
          category: 'Loket Layanan',
          description: 'Pusat perizinan PBG, Lingkungan Hidup, Izin Usaha Perdagangan, Kesehatan, serta verifikasi rekomendasi teknis OPD lintas instansi.',
          icon: Building2,
          color: 'from-blue-500 to-teal-600',
          coordinates: { x: 55, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Persetujuan Bangunan Gedung (PBG SIMBG)', 'Penerbitan NIB Usaha Menengah-Besar', 'Izin Operasional Apotek / Klinik', 'Verifikasi Dokumen Lingkungan (AMDAL/UKL-UPL)'],
          capacity: '25 Pemohon',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Loket Meja Konsultasi Semi-Private',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari Front Office, ikuti lorong utama ke arah Utara Lantai 1 sejauh 15 meter',
            'Klaster Perizinan OSS & PBG berada di ruangan aula kaca berlampu terang'
          ]
        },
        {
          id: 'l1-pajak-bank',
          floor: 1,
          name: 'Klaster Pendapatan Daerah (Bapenda) & Bank Sulselbar',
          category: 'Loket Layanan',
          description: 'Layanan pembayaran PBB-P2, BPHTB, retribusi daerah, dan kasir teller resmi Bank Sulselbar tanpa perlu keluar gedung.',
          icon: Store,
          color: 'from-amber-500 to-orange-600',
          coordinates: { x: 75, y: 15, w: 20, h: 30 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Pembayaran PBB & Validasi BPHTB', 'Loket Kas Teller Bank Sulselbar', 'Konsultasi Pajak Daerah & Usaha', 'Mesin Tarik Tunai ATM'],
          capacity: '12 Pemohon',
          image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Meja Kasir Rendah & Jalur Antrean Kursi Roda',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari Front Office, belok kiri menyusuri koridor Barat Lantai 1 sejauh 15 meter',
            'Loket Bank Sulselbar dan Bapenda berada di ujung lorong sebelah kiri',
            'Tersedia mesin ATM dan teller ramah disabilitas'
          ]
        },
        {
          id: 'l1-investor-lounge',
          floor: 1,
          name: 'VIP Investor Lounge & Fast-Track DPMPTSP',
          category: 'VIP Investor',
          description: 'Ruang konsultasi eksklusif bagi investor dengan pendampingan personal DPMPTSP, GIS Peta Potensi Investasi Luwu, dan simulasi insentif fiskal.',
          icon: Armchair,
          color: 'from-emerald-500 to-cyan-600',
          coordinates: { x: 10, y: 15, w: 40, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Konsultasi VIP One-on-One Tim Teknis', 'Simulasi ROI & GIS Tata Ruang RTRW', 'Asistensi OSS-RBA & PKKPR', 'Hospitality Kopi Luwu Premium'],
          capacity: '15 Investor VIP',
          image: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Meja Rapat Ergonomis & Akses Pintu Lebar',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari pintu masuk Lantai 1, susuri koridor Sayap Timur sejauh 10 meter',
            'Ruang VIP Investor Lounge berada di pintu kaca berpintu ganda sebelah kanan Lantai 1'
          ]
        },
        {
          id: 'l1-ruang-mediasi',
          floor: 1,
          name: 'Ruang Mediasi & Konsultasi Hukum Kejaksaan',
          category: 'Konsultasi',
          description: 'Ruang rapat kedap suara untuk penyelesaian sengketa perizinan, konsultasi hukum gratis Kejaksaan Negeri Luwu, dan pengaduan SP4N-LAPOR.',
          icon: HeartHandshake,
          color: 'from-slate-600 to-slate-800',
          coordinates: { x: 10, y: 55, w: 35, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Klinik Hukum Gratis Datun Kejaksaan Negeri', 'Mediasi Masalah Lahan & Perizinan', 'Kanal Tatap Muka Pengaduan SP4N-LAPOR', 'Konsultasi Bantuan Hukum Difabel'],
          capacity: '12 Orang',
          image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Ruangan Akustik Kedap Suara Bebas Hambatan',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Susuri koridor Barat Lantai 1 sejauh 10 meter',
            'Ruang Mediasi berada di pintu kedap suara berlabel "Klinik Hukum Terpadu"'
          ]
        },
        {
          id: 'l1-laktasi-kids',
          floor: 1,
          name: 'Ruang Laktasi (Ibu Menyusui) & Arena Bermain Anak',
          category: 'Fasilitas Inklusif',
          description: 'Fasilitas ramah ibu dan anak yang bersih, higienis, ber-AC, dilengkapi sofa menyusui privat, wastafel sterilisasi, dan mainan edukatif SNI.',
          icon: Baby,
          color: 'from-rose-500 to-pink-600',
          coordinates: { x: 10, y: 55, w: 25, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Sofa Privat Menyusui Higienis', 'Wastafel Air Hangat & Alat Steril Botol', 'Playground Mini & Buku Cerita Anak', 'Kulkas Khusus Penyimpanan ASI'],
          capacity: '10 Anak & Ibu',
          image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Pintu Lebar 90 cm (Aksesibel Kereta Bayi/Stroller)',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari Front Office, berjalan ke arah lorong Selatan menuju area tunggu utama',
            'Pintu Ruang Laktasi berada di sebelah kiri sebelum toilet umum',
            'Pintu geser otomatis dengan tombol pembuka ramah anak'
          ]
        },
        {
          id: 'l1-lounge-baca',
          floor: 1,
          name: 'Executive Waiting Lounge & Pojok Baca Digital',
          category: 'Fasilitas Umum',
          description: 'Area tunggu nyaman berkarpet dengan sofa empuk, Wi-Fi berkecepatan tinggi, charging station gratis, tablet perpustakaan digital, dan air minum gratis.',
          icon: BookOpen,
          color: 'from-purple-500 to-violet-600',
          coordinates: { x: 40, y: 55, w: 55, h: 35 },
          hours: "07:30 - 16:00 WITA (Jumat s/d 16:30)",
          services: ['Wi-Fi 100 Mbps Kecepatan Tinggi', 'Tablet Layar Baca Digital & Buku Fisik', 'Stasiun Air Minum & Kopi Gratis', 'Layar Monitor Pemanggil Antrean FIDS'],
          capacity: '50 Pemohon',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Area Parkir Khusus Kursi Roda dengan Stopkontak Charger',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Terletak tepat di atrium tengah Lantai 1',
            'Dikelilingi layar LED display antrean yang terlihat dari semua sudut'
          ]
        },
        {
          id: 'l1-musholla-vip',
          floor: 1,
          name: 'Musholla Al-Mabrur & Tempat Wudhu Duduk',
          category: 'Fasilitas Umum',
          description: 'Sarana ibadah yang luas, bersih, dan sejuk dengan pendingin AC, mukena/sarung bersih, dan tempat wudhu khusus duduk untuk lansia dan difabel.',
          icon: Moon,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 50, y: 55, w: 45, h: 35 },
          hours: 'Buka Sepanjang Jam Operasional',
          services: ['Mukena & Sajadah Bersih Terawat', 'Pendingin Ruangan (AC) Dingin', 'Tempat Wudhu Duduk Khusus Disabilitas / Lansia', 'Kamera CCTV Keamanan'],
          capacity: '30 Jamaah',
          image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Lantai Rata Dilengkapi Kursi Sholat Khusus',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari Lantai 1, ikuti penunjuk arah kubah hijau ke koridor Timur',
            'Terletak di ujung koridor timur berdampingan dengan taman sejuk gedung'
          ]
        },
        {
          id: 'l1-toilet-difabel',
          floor: 1,
          name: 'Toilet Khusus Disabilitas & Ramp Utama',
          category: 'Fasilitas Inklusif',
          description: 'Toilet standar Kementerian PUPR dengan pintu geser 90 cm, pegangan tangan stainless, tombol alarm SOS darurat, dan wastafel rendah.',
          icon: Accessibility,
          color: 'from-teal-600 to-emerald-700',
          coordinates: { x: 75, y: 55, w: 20, h: 35 },
          hours: 'Buka Sepanjang Jam Operasional',
          services: ['Pintu Geser Lebar 100 cm', 'Handrail / Pegangan Kuat Stainless Steel', 'Tombol Alarm Darurat SOS ke Petugas Piket', 'Lantai Anti-Selip'],
          capacity: '1 Pemohon + 1 Pendamping',
          image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800',
          deskHeight: 'Ketinggian Kloset 45-50 cm Standar Kursi Roda',
          wheelchairAccessible: true,
          wayfindingRoute: [
            'Dari koridor Timur Lantai 1, ikuti rambu piktogram internasional disabilitas',
            'Terletak di sisi kanan koridor sayap timur Lantai 1'
          ]
        }
      ];
    }
  }, [isZh, isEn]);

  const [selectedZone, setSelectedZone] = useState<RoomZone | null>(null);

  // Sync selected zone on mount or language change
  useEffect(() => {
    if (selectedZone) {
      const updated = zonesData.find(z => z.id === selectedZone.id);
      if (updated) {
        setSelectedZone(updated);
        return;
      }
    }
    if (zonesData.length > 0) setSelectedZone(zonesData[0]);
  }, [zonesData]);

  // Filtered zones based on search query and accessibility mode
  const currentFloorZones = useMemo(() => {
    return zonesData.filter(z => {
      if (isWheelchairFilterActive && !z.wheelchairAccessible) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        z.name.toLowerCase().includes(q) ||
        z.description.toLowerCase().includes(q) ||
        z.services.some(s => s.toLowerCase().includes(q)) ||
        z.category.toLowerCase().includes(q)
      );
    });
  }, [zonesData, isWheelchairFilterActive, searchQuery]);

  return (
    <div className="w-full space-y-6">
      {/* Header & Wayfinding Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-bold tracking-tight font-sans text-slate-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{isEn ? 'Interactive Digital Wayfinding & Floor Plan' : isZh ? '数字大厅导航与互动平面图' : t("mppPortal.interactiveFloorPlan.title", "Digital Wayfinding & Denah Interaktif MPP")}</span>
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
              {isEn ? 'BARRIER-FREE ACCESSIBLE' : isZh ? '无障碍通行友好' : 'RAMAH DISABILITAS'}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed font-medium">
            {isEn ? 'All applicant services are unified on Floor 1 of MPP Simpurusiang with wheelchair accessibility routes. (Floor 2 is dedicated to DPMPTSP internal employee offices).' : isZh ? '辛普鲁西亚政务中心 1 楼一站式综合服务大厅导航平面图（2 楼为 DPMPTSP 内部办公区）。' : 'Peta denah navigasi Lantai 1 (Pusat Pelayanan Terpadu Satu Pintu Pemohon). Seluruh loket pelayanan berpusat di Lantai 1, sedangkan Lantai 2 khusus perkantoran pegawai DPMPTSP.'}
          </p>
        </div>

        {/* Floor Indicator & Accessibility Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wheelchair Accessibility Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsWheelchairFilterActive(!isWheelchairFilterActive)}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border active:scale-95 ${
              isWheelchairFilterActive
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/40'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title={isEn ? "Highlight Wheelchair Accessible Routes" : isZh ? "高亮显示无障碍与轮椅专属路线" : "Sorot Fasilitas & Rute Khusus Kursi Roda"}
          >
            <Accessibility className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="whitespace-nowrap">
              {isWheelchairFilterActive 
                ? (isEn ? 'Accessible Mode Active' : isZh ? '无障碍模式已开启' : 'Mode Difabel Aktif')
                : (isEn ? 'Wheelchair Route' : isZh ? '无障碍路线' : 'Rute Kursi Roda')}
            </span>
          </button>

          {/* Unified Floor Badge (Lantai 1 Pelayanan Terpadu) */}
          <div className={`flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-2xl border ${
            isDark ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
          }`}>
            <Layers className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-extrabold tracking-tight">
                {isEn ? 'Floor 1: Public Services' : isZh ? '1 楼: 一站式服务区' : 'Lantai 1: Layanan Pemohon'}
              </span>
              <span className="text-[9px] opacity-75 font-normal">
                {isEn ? 'L2: DPMPTSP Internal Offices' : isZh ? '2 楼为内部办公区' : 'L2: Kantor Internal Pegawai'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search & Filter Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isEn ? "Search booth or facility on floor plan (e.g. ID Office, Lactation, Tax, VIP Lounge, Wheelchair)..." : isZh ? "在平面图中搜索窗口或设施 (如: 户籍大厅, 母婴室, 税务, VIP厅, 轮椅)..." : "Cari loket atau fasilitas di denah (Contoh: Disdukcapil, Laktasi, Pajak, Musholla, Kursi Roda)..."}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-sans"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Floor Plan Layout & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Center: Visual Interactive Grid (7 Cols) */}
        <div className={`lg:col-span-7 p-4 sm:p-6 rounded-3xl border relative min-h-[420px] flex flex-col justify-between overflow-hidden ${
          isDark 
            ? 'bg-slate-950/80 border-slate-800 shadow-xl' 
            : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 shadow-xl shadow-slate-200/50'
        }`}>
          {/* Blueprint Grid Texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '12s' }} />
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                {isEn ? `MPP SIMPURUSIANG • ALL PUBLIC SERVICES (FLOOR 1)` : isZh ? `辛普鲁西亚政务中心 • 1 楼一站式服务全景` : `GEDUNG MPP SIMPURUSIANG • LANTAI 1 (PUSAT LAYANAN PEMOHON)`}
              </span>
            </div>

            {isWheelchairFilterActive && (
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Accessibility className="w-3.5 h-3.5" />
                <span>{isEn ? 'Displaying Wheelchair Accessible' : isZh ? '显示无障碍轮椅通道' : 'Menampilkan Akses Kursi Roda'}</span>
              </span>
            )}
          </div>

          {/* Interactive Zone Blocks Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
            {currentFloorZones.map((zone) => {
              const isSelected = selectedZone?.id === zone.id;
              const IconComp = zone.icon;
              return (
                <motion.button
                  key={zone.id}
                  type="button"
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/15 ring-2 ring-emerald-500/40'
                      : isDark
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${zone.color} text-white shadow-sm`}>
                      <IconComp className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1">
                      {zone.wheelchairAccessible && (
                        <span className="p-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20" title={isEn ? 'Wheelchair Accessible' : isZh ? '无障碍通行' : 'Akses Kursi Roda'}>
                          <Accessibility className="w-3 h-3" />
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {zone.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 font-sans leading-snug">
                      {zone.name}
                    </h4>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 mt-1 leading-snug font-medium">
                      {zone.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 min-h-[28px]">
                    <span className="flex items-center gap-1 font-mono font-medium">
                      <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" /> {zone.hours.split(' ')[0]}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      <span>{isEn ? 'Wayfinding Route' : isZh ? '查看指引路线' : 'Rute Petunjuk'}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="relative z-10 text-center text-[10px] text-slate-700 dark:text-slate-400 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-2 font-medium">
            <Footprints className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{isEn ? 'Yellow tactile guiding blocks installed along all Floor 1 corridors for visually impaired visitors.' : isZh ? '1 楼全楼道铺设黄色无障碍盲道引导地砖，便利视障人士安全通行。' : 'Guiding Block (ubin pemandu kuning) terpasang di seluruh koridor Lantai 1 untuk kenyamanan disabilitas.'}</span>
          </div>
        </div>

        {/* Right: Selected Zone Detail & Step-by-Step Wayfinding (5 Cols) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedZone && (
              <motion.div
                key={selectedZone.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-5 sm:p-6 rounded-3xl border h-full flex flex-col justify-between ${
                  isDark 
                    ? 'bg-slate-900/90 border-emerald-500/20 shadow-xl' 
                    : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
                }`}
              >
                <div>
                  {/* Photo Preview */}
                  <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden mb-4 border border-slate-200/50 dark:border-slate-700">
                    <img 
                      src={selectedZone.image} 
                      alt={selectedZone.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <span className="text-xs font-bold bg-emerald-600 px-2.5 py-1 rounded-lg">
                        {isEn ? 'Floor 1 (Public Area)' : isZh ? '1 楼 (服务区)' : 'Lantai 1 (Area Layanan)'}
                      </span>
                      <span className="text-xs font-semibold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg font-mono">
                        {isEn ? `Capacity: ${selectedZone.capacity}` : isZh ? `容纳人数: ${selectedZone.capacity}` : `Kapasitas: ${selectedZone.capacity}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {selectedZone.category}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold font-sans text-slate-900 dark:text-white">
                    {selectedZone.name}
                  </h3>

                  {/* Accessibility Badge Tag */}
                  <div className="mt-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{selectedZone.deskHeight}</span>
                  </div>

                  {/* Step-by-Step Wayfinding Guidance */}
                  <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{isEn ? 'Step-by-Step Route Guidance (Wayfinding):' : isZh ? '分步导航指引 (路线步骤):' : 'Panduan Langkah Rute (Wayfinding):'}</span>
                    </h5>
                    <div className="space-y-2">
                      {selectedZone.wayfindingRoute.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono border border-emerald-500/25">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed font-normal">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Facilities / Services */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
                      {isEn ? 'Services & Facilities Available:' : isZh ? '窗口服务与配套设施:' : 'Layanan & Fasilitas:'}
                    </h5>
                    <div className="space-y-1.5">
                      {selectedZone.services.map((srv, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-normal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{srv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="block font-bold text-slate-700 dark:text-slate-200">{isEn ? 'Operating Hours:' : isZh ? '办理服务时间:' : 'Jam Layanan:'}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{selectedZone.hours}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('smart-live-queue')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    <span>{isEn ? 'Get Counter Ticket' : isZh ? '在线取号取票' : 'Ambil Antrean Loket'}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
