export const actionFilters = [
  "全部",
  "直接助农",
  "公众行动",
  "农业游学",
  "行动发源地"
] as const;

export type ActionFilter = (typeof actionFilters)[number];
export type ActionType = Exclude<ActionFilter, "全部">;

export type NodeType =
  | "direct_support"
  | "public_action"
  | "agri_learning"
  | "origin";

export type CoordinateAccuracy = "township" | "county" | "city";
export type ImpactStatus = "continuing" | "observational";
export type VerificationStatus = "verified" | "partially_verified";

export const nodeTypeLabels: Record<NodeType, ActionType> = {
  direct_support: "直接助农",
  public_action: "公众行动",
  agri_learning: "农业游学",
  origin: "行动发源地"
};

export const coordinateAccuracyLabels: Record<
  CoordinateAccuracy,
  string
> = {
  township: "乡镇级坐标",
  county: "县级坐标",
  city: "市级坐标"
};

export const impactStatusLabels: Record<ImpactStatus, string> = {
  continuing: "持续推进",
  observational: "观察记录"
};

export const verificationStatusLabels: Record<
  VerificationStatus,
  string
> = {
  verified: "已核验",
  partially_verified: "部分核验"
};

export type HejiLocation = {
  id: string;
  name: string;
  nodeType: NodeType;
  region: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  compactOffset?: {
    x: number;
    y: number;
  };
  coordinateAccuracy: CoordinateAccuracy;
  program: string;
  representatives?: string;
  story: string;
  impactStatus: ImpactStatus;
  verificationStatus: VerificationStatus;
  source?: {
    label: string;
    url: string;
  };
};

const studySource = {
  label: "《你好，种地少年》地点汇总",
  url: "https://zh.wikipedia.org/zh-hans/%E4%BD%A0%E5%A5%BD%EF%BC%8C%E7%A7%8D%E5%9C%B0%E5%B0%91%E5%B9%B4"
};

export const locations: HejiLocation[] = [
  {
    id: "ZDB-L001",
    name: "甘肃民勤治沙行动",
    nodeType: "public_action",
    region: "甘肃省武威市民勤县",
    coordinates: { latitude: 38.6248, longitude: 103.0937 },
    compactOffset: { x: 18, y: -16 },
    coordinateAccuracy: "county",
    program: "《种地吧2》及后续公益行动",
    representatives: "仲麟",
    story:
      "十个勤天与当地团队栽植约18万穴梭梭，后续大量志愿者持续前往民勤，形成治沙、志愿服务与农产品销售结合的行动链条。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    source: {
      label: "环球人物",
      url: "https://www.globalpeople.com.cn/n4/2026/0504/c305917-21647511.html"
    }
  },
  {
    id: "ZDB-L002",
    name: "四方墩生态林基地",
    nodeType: "public_action",
    region: "甘肃省武威市民勤县昌宁镇",
    coordinates: { latitude: 38.62015, longitude: 102.50274 },
    compactOffset: { x: -18, y: 16 },
    coordinateAccuracy: "township",
    program: "民勤治沙衍生公益行动",
    representatives: "马俊河（马哥）",
    story:
      "甘肃青梭公益长期组织志愿者压沙、种植梭梭，并通过蜜瓜等农产品销售反哺治沙行动。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    source: {
      label: "青梭公益",
      url: "https://www.qingsuo.cn/"
    }
  },
  {
    id: "ZDB-L003",
    name: "玉树州藏医药职业学校",
    nodeType: "direct_support",
    region: "青海省玉树州囊谦县",
    coordinates: { latitude: 32.2, longitude: 96.48 },
    compactOffset: { x: -26, y: -22 },
    coordinateAccuracy: "county",
    program: "《种地吧3》《种地吧4》",
    representatives: "更确木兰（木兰校长）",
    story:
      "学校以芫根饮料加工收入补贴公益办学；节目相关直播销售额超过190万元，并继续推动加工厂复产、产品研发和地方产业链建设。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    source: {
      label: "中新网青海",
      url: "https://www.qh.chinanews.com.cn/sh/news/2025/0321/133704.html"
    }
  },
  {
    id: "ZDB-L004",
    name: "囊谦白扎盐场",
    nodeType: "direct_support",
    region: "青海省玉树州囊谦县白扎乡",
    coordinates: { latitude: 32.07551, longitude: 96.51612 },
    compactOffset: { x: 26, y: -10 },
    coordinateAccuracy: "township",
    program: "《种地吧3》《种地吧4》",
    representatives: "江羊巴桑",
    story:
      "围绕藏红盐、白盐及传统泉盐技艺进行推广，后续带动盐产品生产、农户收入和周边文旅产业。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    source: {
      label: "中国农业大学转载报道",
      url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
    }
  },
  {
    id: "ZDB-L005",
    name: "娘麦村温室大棚",
    nodeType: "direct_support",
    region: "青海省玉树州囊谦县娘拉乡娘麦村",
    coordinates: { latitude: 32.04123, longitude: 96.84253 },
    compactOffset: { x: 30, y: 32 },
    coordinateAccuracy: "township",
    program: "《种地吧3》《种地吧4》",
    representatives: "成林、巴金",
    story:
      "节目协助解决大棚用水、用电及水培技术问题，后续由当地技术指导带动村民种植，并向学校、食堂和居民供应蔬菜。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    source: {
      label: "中国青年报",
      url: "https://m.cyol.com/gb/articles/2025-08/23/content_PbeKQaux0B.html"
    }
  },
  {
    id: "ZDB-L006",
    name: "林口东兴村",
    nodeType: "direct_support",
    region: "黑龙江省牡丹江市林口县建堂镇东兴村",
    coordinates: { latitude: 45.68014, longitude: 130.04726 },
    coordinateAccuracy: "township",
    program: "《种地吧3》",
    representatives: "高克新（高叔）、张婶",
    story:
      "当地沙棘被开发为沙棘皂，并通过技术培训和乡村合伙人计划，为村民提供冬季加工就业与产品销售收入。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    source: {
      label: "相关公开报道",
      url: "https://www.sohu.com/a/897694912_121106822"
    }
  },
  {
    id: "ZDB-L007",
    name: "宁乡草冲村",
    nodeType: "direct_support",
    region: "湖南省长沙市宁乡市流沙河镇草冲村",
    coordinates: { latitude: 27.94, longitude: 112.1 },
    coordinateAccuracy: "township",
    program: "《种地吧3》",
    representatives: "贺桂香（贺大姐）",
    story:
      "节目帮助核算宁乡花猪养殖成本、寻找销售渠道；后续通过赠送猪苗、教授技术和保底回收带动监测户共同养殖。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    source: {
      label: "湖南日报／新湖南",
      url: "https://www.hunantoday.cn/news/xhn/202605/32741255.html"
    }
  },
  {
    id: "ZDB-L008",
    name: "墨脱茶叶与辣椒产业",
    nodeType: "direct_support",
    region: "西藏自治区林芝市墨脱县",
    coordinates: { latitude: 29.32841, longitude: 95.33088 },
    compactOffset: { x: -24, y: 18 },
    coordinateAccuracy: "county",
    program: "《种地吧4》",
    representatives: "墨脱茶农群体",
    story:
      "围绕墨脱高山茶、辣椒及林下产业进行推广，节目播出和直播为茶叶等地方产品带来订单增长。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    source: {
      label: "央视网",
      url: "https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml"
    }
  },
  {
    id: "ZDB-L009",
    name: "于田沙漠玫瑰",
    nodeType: "direct_support",
    region: "新疆维吾尔自治区和田地区于田县",
    coordinates: { latitude: 36.8573, longitude: 81.6771 },
    compactOffset: { x: 18, y: -14 },
    coordinateAccuracy: "county",
    program: "《种地吧4》",
    representatives: "买吐地、买哈扑司汗、肉孜",
    story:
      "围绕沙漠推平、阻沙带建设和玫瑰种植开展行动，并延伸至玫瑰花馕及玫瑰加工品推广。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    source: {
      label: "央视网",
      url: "https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml"
    }
  },
  {
    id: "ZDB-L010",
    name: "策勒红枣产业",
    nodeType: "direct_support",
    region: "新疆维吾尔自治区和田地区策勒县",
    coordinates: { latitude: 37.002, longitude: 80.801 },
    compactOffset: { x: -18, y: 14 },
    coordinateAccuracy: "county",
    program: "《种地吧4》",
    representatives: "李鹏、当地枣农",
    story:
      "围绕积压红枣研发果丹皮、糕点等深加工产品；助农直播一小时售出约94吨，后续店铺累计售出超过200吨。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    source: {
      label: "中国农业大学转载报道",
      url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
    }
  },
  {
    id: "ZDB-L011",
    name: "杭州后陡门",
    nodeType: "origin",
    region: "浙江省杭州市西湖区三墩镇",
    coordinates: { latitude: 30.323, longitude: 120.083 },
    compactOffset: { x: 20, y: -15 },
    coordinateAccuracy: "township",
    program: "《种地吧1—4》",
    representatives: "十个勤天、小佳等",
    story:
      "节目农业实践、农产品研发、直播销售和“爱侬日”的行动起点；该地点是行动发源地，不应被表述为受助地区。",
    impactStatus: "continuing",
    verificationStatus: "verified"
  },
  {
    id: "ZDB-L101",
    name: "江苏盱眙",
    nodeType: "agri_learning",
    region: "江苏省淮安市盱眙县",
    coordinates: { latitude: 33.005, longitude: 118.544 },
    compactOffset: { x: -28, y: 12 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "围绕小龙虾产业和渔业养殖展开农业游学与产业观察。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L102",
    name: "山东乳山",
    nodeType: "agri_learning",
    region: "山东省威海市乳山市",
    coordinates: { latitude: 36.921, longitude: 121.54 },
    compactOffset: { x: 18, y: -15 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "围绕生蚝养殖和海洋渔业展开农业游学与产业观察。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L103",
    name: "山东寿光",
    nodeType: "agri_learning",
    region: "山东省潍坊市寿光市",
    coordinates: { latitude: 36.857, longitude: 118.791 },
    compactOffset: { x: 18, y: 14 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "记录设施农业、蔬菜大棚及相关农业技术展示。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L104",
    name: "山东章丘",
    nodeType: "agri_learning",
    region: "山东省济南市章丘区",
    coordinates: { latitude: 36.713, longitude: 117.526 },
    compactOffset: { x: -18, y: 10 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "围绕章丘大葱及地方品种展开农产品文化展示。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L105",
    name: "内蒙古清水河县",
    nodeType: "agri_learning",
    region: "内蒙古自治区呼和浩特市清水河县",
    coordinates: { latitude: 39.92, longitude: 111.68 },
    compactOffset: { x: -12, y: 12 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "记录小米、谷物收割和丰收节相关农耕文化。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L106",
    name: "内蒙古乌兰察布",
    nodeType: "agri_learning",
    region: "内蒙古自治区乌兰察布市",
    coordinates: { latitude: 40.994, longitude: 113.133 },
    compactOffset: { x: 12, y: -12 },
    coordinateAccuracy: "city",
    program: "《你好，种地少年》",
    story: "围绕马铃薯和草原农牧业展开农业游学。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L107",
    name: "新疆特克斯县",
    nodeType: "agri_learning",
    region: "新疆伊犁哈萨克自治州特克斯县",
    coordinates: { latitude: 43.217, longitude: 81.836 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "围绕红花采摘和地方经济作物展开产业观察。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L108",
    name: "甘肃定西",
    nodeType: "agri_learning",
    region: "甘肃省定西市",
    coordinates: { latitude: 35.581, longitude: 104.626 },
    coordinateAccuracy: "city",
    program: "《你好，种地少年》",
    story: "记录马铃薯种植和滴灌技术展示。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  },
  {
    id: "ZDB-L109",
    name: "浙江诸暨",
    nodeType: "agri_learning",
    region: "浙江省绍兴市诸暨市",
    coordinates: { latitude: 29.709, longitude: 120.246 },
    compactOffset: { x: 20, y: 22 },
    coordinateAccuracy: "county",
    program: "《你好，种地少年》",
    story: "围绕淡水珍珠养殖展开特色农业游学。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    source: studySource
  }
];

export function filterLocations(
  source: HejiLocation[],
  filter: ActionFilter
): HejiLocation[] {
  if (filter === "全部") {
    return source;
  }

  return source.filter(
    (location) => nodeTypeLabels[location.nodeType] === filter
  );
}
