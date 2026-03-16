// 風格標籤與參考照片（拍攝前靈感用）

export const STYLE_TAGS = [
  { id: "人像攝影" },
  { id: "街拍" },
  { id: "風景攝影" },
  { id: "靜物攝影" },
  { id: "建築攝影" },
  { id: "美食攝影" },
  { id: "寵物攝影" },
  { id: "運動攝影" },
  { id: "黑白攝影" },
  { id: "長曝光" },
  { id: "微距攝影" },
  { id: "夜景攝影" },
];

export const TONE_TAGS = [
  { id: "日系清新" },
  { id: "韓系柔和" },
  { id: "復古膠片" },
  { id: "暗黑情緒" },
  { id: "高對比" },
  { id: "低飽和" },
  { id: "暖色調" },
  { id: "冷色調" },
  { id: "電影感" },
  { id: "夢幻風" },
];

export const TECHNIQUE_TAGS = [
  { id: "淺景深" },
  { id: "剪影" },
  { id: "逆光" },
  { id: "框架構圖" },
  { id: "引導線" },
  { id: "對稱構圖" },
  { id: "極簡主義" },
  { id: "動態捕捉" },
];

export const REFERENCE_PHOTOS = [
  { id: 1, title: "柔和逆光人像", description: "利用窗邊自然光營造溫暖氛圍", imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800", tags: ["人像攝影", "暖色調", "淺景深", "逆光"], settings: { aperture: "f/1.8 - f/2.8", shutter: "1/250s", iso: "400-800" }, tips: ["讓光線從窗戶照亮臉部側面", "稍微過曝 +0.3 到 +0.7 營造柔和感"], colorNotes: "暖黃色調，高光柔和", difficulty: "新手" },
  { id: 2, title: "拿鐵與手部特寫", description: "側窗光勾勒杯緣與蒸氣", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", tags: ["靜物攝影", "美食攝影", "暖色調", "逆光"], settings: { aperture: "f/2.0", shutter: "1/200s", iso: "400" }, tips: ["逆光拍蒸氣更明顯", "白桌反射補光"], colorNotes: "奶咖色、淺焦", difficulty: "新手" },
  { id: 3, title: "窗邊閱讀剪影", description: "大逆光輪廓與書本", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800", tags: ["人像攝影", "剪影", "逆光", "高對比"], settings: { aperture: "f/2.8", shutter: "1/500s", iso: "200" }, tips: ["對亮部測光壓暗主體"], colorNotes: "高對比、暖色輪廓", difficulty: "進階" },
  { id: 4, title: "雙人對坐對話感", description: "窗光從側面打亮兩人", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800", tags: ["人像攝影", "暖色調", "淺景深"], settings: { aperture: "f/2.2", shutter: "1/320s", iso: "500" }, tips: ["讓兩人與窗呈 45°"], colorNotes: "膚色暖、背景略虛", difficulty: "進階" },
  { id: 5, title: "咖啡拉花俯拍", description: "頂窗柔光減少反光", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", tags: ["靜物攝影", "美食攝影", "暖色調", "極簡主義"], settings: { aperture: "f/2.8", shutter: "1/160s", iso: "400" }, tips: ["正上方或 45° 俯拍"], colorNotes: "中性偏暖", difficulty: "新手" },
  { id: 6, title: "午後窗格光影", description: "窗框投影落在桌面與手", imageUrl: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800", tags: ["靜物攝影", "暖色調", "框架構圖"], settings: { aperture: "f/2.0", shutter: "1/250s", iso: "320" }, tips: ["下午斜射光線更戲劇化"], colorNotes: "明暗對比強、暖調", difficulty: "專業" },
  { id: 7, title: "獨行背影與長影", description: "黃昏拉長影子與孤獨感", imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800", tags: ["街拍", "剪影", "暖色調", "引導線"], settings: { aperture: "f/2.8", shutter: "1/500s", iso: "400" }, tips: ["低角度拍出長影"], colorNotes: "橙藍對比", difficulty: "進階" },
  { id: 8, title: "空蕩長椅", description: "金色時刻無人場景", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", tags: ["街拍", "風景攝影", "暖色調", "極簡主義"], settings: { aperture: "f/4", shutter: "1/200s", iso: "200" }, tips: ["樹影可入鏡"], colorNotes: "暖金、暗部偏藍", difficulty: "新手" },
  { id: 9, title: "車窗倒影與夕陽", description: "反射與實景疊加", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", tags: ["街拍", "暖色調", "電影感"], settings: { aperture: "f/2.0", shutter: "1/320s", iso: "250" }, tips: ["找有反光的玻璃或水窪"], colorNotes: "高光金、陰影冷藍", difficulty: "專業" },
  { id: 10, title: "雨後街道反光", description: "地面倒影與路燈初亮", imageUrl: "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800", tags: ["街拍", "夜景攝影", "冷色調", "暗黑情緒"], settings: { aperture: "f/2.8", shutter: "1/125s", iso: "800" }, tips: ["低角度貼近地面"], colorNotes: "冷暖混合", difficulty: "進階" },
  { id: 11, title: "行人剪影與建築", description: "對夕陽測光壓暗前景", imageUrl: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800", tags: ["街拍", "建築攝影", "剪影", "暖色調"], settings: { aperture: "f/4", shutter: "1/500s", iso: "200" }, tips: ["剪影輪廓要清楚"], colorNotes: "深橘、剪影黑", difficulty: "新手" },
  { id: 12, title: "黃昏煙霧與街燈", description: "薄霧柔化光線", imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800", tags: ["街拍", "夜景攝影", "夢幻風", "暖色調"], settings: { aperture: "f/2.8", shutter: "1/200s", iso: "400" }, tips: ["街燈與夕陽同框"], colorNotes: "朦朧、暖冷並存", difficulty: "專業" },
  { id: 13, title: "情侶剪影與太陽", description: "日落正下方人物剪影", imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", tags: ["人像攝影", "風景攝影", "剪影", "暖色調"], settings: { aperture: "f/5.6", shutter: "1/500s", iso: "100" }, tips: ["對太陽周邊測光"], colorNotes: "金橘海面、剪影黑", difficulty: "新手" },
  { id: 14, title: "浪花與金色反光", description: "慢速快門霧化海水", imageUrl: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800", tags: ["風景攝影", "長曝光", "暖色調", "電影感"], settings: { aperture: "f/11", shutter: "1/2s", iso: "100" }, tips: ["需腳架與 ND 鏡"], colorNotes: "絲綢海、暖色調", difficulty: "進階" },
  { id: 15, title: "逆光髮絲與海風", description: "側逆光打亮髮絲輪廓", imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800", tags: ["人像攝影", "逆光", "暖色調", "淺景深"], settings: { aperture: "f/2.0", shutter: "1/1000s", iso: "200" }, tips: ["太陽在側後方"], colorNotes: "金邊、膚色暖", difficulty: "進階" },
  { id: 16, title: "沙灘腳印與夕陽", description: "低角度腳印引導視線", imageUrl: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800", tags: ["風景攝影", "引導線", "暖色調"], settings: { aperture: "f/4", shutter: "1/250s", iso: "100" }, tips: ["腳印走向太陽"], colorNotes: "暖沙、藍天過渡", difficulty: "新手" },
  { id: 17, title: "雙人背影與海平線", description: "對稱構圖與金色時刻", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", tags: ["人像攝影", "風景攝影", "對稱構圖", "暖色調"], settings: { aperture: "f/4", shutter: "1/400s", iso: "200" }, tips: ["海平線置中或三分"], colorNotes: "金橘天空、剪影", difficulty: "進階" },
  { id: 18, title: "霓虹招牌與人潮", description: "多彩燈管與流動感", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", tags: ["街拍", "夜景攝影", "高對比", "電影感"], settings: { aperture: "f/2.0", shutter: "1/60s", iso: "3200" }, tips: ["略慢快門拍流動"], colorNotes: "粉紫紅藍混色", difficulty: "進階" },
  { id: 19, title: "食物與霓虹反射", description: "攤位燈光打在食物上", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800", tags: ["美食攝影", "夜景攝影", "高對比", "淺景深"], settings: { aperture: "f/1.8", shutter: "1/80s", iso: "1600" }, tips: ["找顏色統一的攤位"], colorNotes: "飽和、暖紅為主", difficulty: "新手" },
  { id: 20, title: "人像與霓虹光斑", description: "大光圈虛化背景燈", imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800", tags: ["人像攝影", "夜景攝影", "淺景深", "電影感"], settings: { aperture: "f/1.4", shutter: "1/125s", iso: "800" }, tips: ["人物靠近霓虹"], colorNotes: "彩色光斑", difficulty: "專業" },
  { id: 21, title: "攤位煙霧與燈條", description: "蒸氣與霓虹對比", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800", tags: ["街拍", "夜景攝影", "夢幻風"], settings: { aperture: "f/2.8", shutter: "1/100s", iso: "1600" }, tips: ["煙霧增加層次"], colorNotes: "暖煙、冷霓虹", difficulty: "進階" },
  { id: 22, title: "夜市俯瞰長曝", description: "人流軌跡與固定燈", imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800", tags: ["街拍", "夜景攝影", "長曝光", "動態捕捉"], settings: { aperture: "f/8", shutter: "2s", iso: "400" }, tips: ["腳架、高處或天橋"], colorNotes: "流動線條", difficulty: "專業" },
  { id: 23, title: "丁達爾光束", description: "晨霧中的光柱", imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", tags: ["風景攝影", "日系清新", "逆光", "夢幻風"], settings: { aperture: "f/8", shutter: "1/60s", iso: "400" }, tips: ["有霧或塵埃時明顯"], colorNotes: "冷綠、暖光柱", difficulty: "進階" },
  { id: 24, title: "葉片露珠特寫", description: "晨光打亮水珠", imageUrl: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800", tags: ["微距攝影", "日系清新", "極簡主義"], settings: { aperture: "f/2.8", shutter: "1/200s", iso: "200" }, tips: ["微距或長焦"], colorNotes: "綠黃、高光透亮", difficulty: "新手" },
  { id: 25, title: "林道縱深與晨霧", description: "引導線與層次", imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", tags: ["風景攝影", "日系清新", "引導線", "低飽和"], settings: { aperture: "f/5.6", shutter: "1/125s", iso: "320" }, tips: ["路徑或溪流做引導"], colorNotes: "青綠、柔和對比", difficulty: "新手" },
  { id: 26, title: "人物與透光葉片", description: "臉部在斑駁光下", imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", tags: ["人像攝影", "日系清新", "逆光", "淺景深"], settings: { aperture: "f/2.0", shutter: "1/250s", iso: "400" }, tips: ["避開過強光斑"], colorNotes: "自然膚色、綠背景", difficulty: "進階" },
  { id: 27, title: "苔蘚與散射光", description: "陰處柔光細節", imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", tags: ["微距攝影", "風景攝影", "日系清新", "低飽和"], settings: { aperture: "f/4", shutter: "1/80s", iso: "400" }, tips: ["陰天或樹蔭下"], colorNotes: "深綠、柔和", difficulty: "新手" },
  { id: 28, title: "床邊晨光", description: "窗簾與柔和晨光", imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800", tags: ["人像攝影", "韓系柔和", "暖色調", "淺景深"], settings: { aperture: "f/2.0", shutter: "1/200s", iso: "400" }, tips: ["薄窗簾柔化光線"], colorNotes: "奶白、暖灰", difficulty: "新手" },
  { id: 29, title: "書桌與咖啡", description: "側窗光與生活感", imageUrl: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800", tags: ["靜物攝影", "暖色調", "韓系柔和", "極簡主義"], settings: { aperture: "f/2.8", shutter: "1/160s", iso: "320" }, tips: ["書本或筆電可入鏡"], colorNotes: "暖木色", difficulty: "新手" },
  { id: 30, title: "沙發閱讀", description: "落地窗光從側面來", imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800", tags: ["人像攝影", "暖色調", "淺景深"], settings: { aperture: "f/2.2", shutter: "1/250s", iso: "400" }, tips: ["人物側對窗"], colorNotes: "居家暖調", difficulty: "進階" },
  { id: 31, title: "廚房窗台小物", description: "窗邊靜物與光影", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800", tags: ["靜物攝影", "暖色調", "極簡主義"], settings: { aperture: "f/2.8", shutter: "1/125s", iso: "400" }, tips: ["早晨或下午斜光"], colorNotes: "白與木、輕暖", difficulty: "新手" },
  { id: 32, title: "寵物與窗光", description: "毛孩在窗邊", imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", tags: ["寵物攝影", "逆光", "暖色調", "淺景深"], settings: { aperture: "f/2.0", shutter: "1/500s", iso: "800" }, tips: ["逆光毛髮輪廓"], colorNotes: "暖色、毛髮透光", difficulty: "進階" },
  { id: 33, title: "路燈下的長影", description: "單一光源與獨行", imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800", tags: ["街拍", "夜景攝影", "暗黑情緒", "冷色調"], settings: { aperture: "f/2.0", shutter: "1/60s", iso: "1600" }, tips: ["路燈做主光"], colorNotes: "暖燈、冷環境", difficulty: "進階" },
  { id: 34, title: "空蕩斑馬線", description: "夜間無人街道", imageUrl: "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=800", tags: ["街拍", "夜景攝影", "長曝光", "冷色調"], settings: { aperture: "f/2.8", shutter: "1/30s", iso: "3200" }, tips: ["長曝可拉車燈軌"], colorNotes: "冷藍、點狀暖光", difficulty: "專業" },
  { id: 35, title: "便利店窗光", description: "24h 店與孤獨對比", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", tags: ["街拍", "夜景攝影", "電影感", "高對比"], settings: { aperture: "f/1.8", shutter: "1/80s", iso: "2000" }, tips: ["人物在店外或剪影"], colorNotes: "冷暖對比強", difficulty: "進階" },
  { id: 36, title: "雨夜反光", description: "地面倒影與路燈", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", tags: ["街拍", "夜景攝影", "冷色調", "電影感"], settings: { aperture: "f/2.0", shutter: "1/50s", iso: "2500" }, tips: ["低角度拍反光"], colorNotes: "冷色、暖燈點綴", difficulty: "專業" },
  { id: 37, title: "巷弄盡頭一盞燈", description: "縱深與單一光源", imageUrl: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800", tags: ["街拍", "夜景攝影", "引導線", "暗黑情緒"], settings: { aperture: "f/2.8", shutter: "1/40s", iso: "1600" }, tips: ["引導線指向燈"], colorNotes: "暗調、暖燈心", difficulty: "進階" },
  { id: 38, title: "公車亭與候車", description: "封閉光區與等待", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", tags: ["街拍", "夜景攝影", "框架構圖", "冷色調"], settings: { aperture: "f/2.0", shutter: "1/60s", iso: "3200" }, tips: ["亭內亮、亭外暗"], colorNotes: "冷暖分明", difficulty: "新手" },
  { id: 39, title: "簡潔桌面與燈具", description: "點狀與面光結合", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800", tags: ["靜物攝影", "極簡主義", "低飽和"], settings: { aperture: "f/2.8", shutter: "1/100s", iso: "400" }, tips: ["色溫統一"], colorNotes: "中性、乾淨", difficulty: "新手" },
  { id: 40, title: "人像與環形燈", description: "眼中有眼神光", imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800", tags: ["人像攝影", "韓系柔和", "淺景深"], settings: { aperture: "f/2.0", shutter: "1/160s", iso: "400" }, tips: ["環形燈在正前方"], colorNotes: "膚色準、低陰影", difficulty: "進階" },
  { id: 41, title: "產品與柔光罩", description: "無影與高光控制", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800", tags: ["靜物攝影", "極簡主義", "低飽和"], settings: { aperture: "f/5.6", shutter: "1/125s", iso: "200" }, tips: ["柔光箱或白牆反射"], colorNotes: "白與灰、現代感", difficulty: "專業" },
  { id: 42, title: "螢幕與環境光", description: "螢幕作為主光源", imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800", tags: ["人像攝影", "冷色調", "電影感"], settings: { aperture: "f/2.0", shutter: "1/80s", iso: "800" }, tips: ["螢幕勿過曝"], colorNotes: "冷螢幕、暖環境", difficulty: "進階" },
  { id: 43, title: "線條與幾何", description: "建築感室內", imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800", tags: ["建築攝影", "極簡主義", "引導線", "對稱構圖"], settings: { aperture: "f/4", shutter: "1/100s", iso: "400" }, tips: ["對稱或引導線"], colorNotes: "中性、線條清晰", difficulty: "新手" },
  { id: 44, title: "遠山層次", description: "上午清晰空氣與景深", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", tags: ["風景攝影", "低飽和", "引導線"], settings: { aperture: "f/8", shutter: "1/250s", iso: "100" }, tips: ["順光或側光"], colorNotes: "藍綠山、白雲", difficulty: "新手" },
  { id: 45, title: "湖面倒影", description: "無風時的對稱", imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800", tags: ["風景攝影", "對稱構圖", "低飽和", "極簡主義"], settings: { aperture: "f/11", shutter: "1/125s", iso: "100" }, tips: ["清晨易無風"], colorNotes: "冷靜、低飽和", difficulty: "進階" },
  { id: 46, title: "雲海與山尖", description: "高海拔上午雲海", imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", tags: ["風景攝影", "夢幻風", "低飽和"], settings: { aperture: "f/8", shutter: "1/200s", iso: "200" }, tips: ["日出前後易有雲海"], colorNotes: "白雲、藍天、山灰", difficulty: "專業" },
  { id: 47, title: "步道與樹影", description: "林間步道引導", imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800", tags: ["風景攝影", "引導線", "日系清新"], settings: { aperture: "f/5.6", shutter: "1/80s", iso: "320" }, tips: ["步道做引導線"], colorNotes: "綠與褐、平和", difficulty: "新手" },
  { id: 48, title: "單人與遼闊景", description: "人物比例小、景大", imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", tags: ["人像攝影", "風景攝影", "極簡主義", "低飽和"], settings: { aperture: "f/5.6", shutter: "1/320s", iso: "200" }, tips: ["人物在三分點"], colorNotes: "自然、開闊", difficulty: "進階" },
  { id: 49, title: "街拍與陰影對比", description: "硬光與鮮明輪廓", imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800", tags: ["街拍", "高對比", "黑白攝影"], settings: { aperture: "f/2.8", shutter: "1/500s", iso: "200" }, tips: ["找陰影邊緣"], colorNotes: "高對比、鮮豔", difficulty: "進階" },
  { id: 50, title: "櫥窗與反射", description: "玻璃反射天空與人", imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", tags: ["街拍", "建築攝影", "框架構圖", "高對比"], settings: { aperture: "f/4", shutter: "1/320s", iso: "200" }, tips: ["反射可當主體"], colorNotes: "藍天、建築", difficulty: "專業" },
  { id: 51, title: "廣場與人群", description: "正午熱鬧氛圍", imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800", tags: ["街拍", "動態捕捉"], settings: { aperture: "f/5.6", shutter: "1/400s", iso: "200" }, tips: ["略高角度避雜亂"], colorNotes: "明亮、飽和", difficulty: "新手" },
  { id: 52, title: "冰品與陽光", description: "戶外座與光影", imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800", tags: ["美食攝影", "暖色調", "日系清新", "淺景深"], settings: { aperture: "f/2.8", shutter: "1/500s", iso: "200" }, tips: ["側光拍食物"], colorNotes: "鮮豔、夏日感", difficulty: "新手" },
  { id: 53, title: "跳躍或動態", description: "高速快門凝結", imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800", tags: ["人像攝影", "運動攝影", "動態捕捉", "高對比"], settings: { aperture: "f/2.0", shutter: "1/1000s", iso: "400" }, tips: ["連拍、快門優先"], colorNotes: "清晰、活力", difficulty: "進階" },
];

/** 依選中的標籤篩選：照片必須包含「所有」選中標籤 */
export function searchByTags(selectedTagIds) {
  if (!selectedTagIds || selectedTagIds.length === 0) return REFERENCE_PHOTOS;
  const set = new Set(selectedTagIds);
  return REFERENCE_PHOTOS.filter((photo) => set.every((tag) => photo.tags.includes(tag)));
}
