export const actionFilters = ["全部", "直接助农", "公众行动", "产业观察"] as const;

export type ActionFilter = (typeof actionFilters)[number];
export type ActionType = Exclude<ActionFilter, "全部">;
export type NodeType = "direct_support" | "public_action" | "industry_observation";
export type CoordinateAccuracy = "township" | "county" | "regional";
export type ImpactStatus = "continuing" | "observational";
export type VerificationStatus = "verified" | "partially_verified";

export const nodeTypeLabels: Record<NodeType, ActionType> = {
  direct_support: "直接助农",
  public_action: "公众行动",
  industry_observation: "产业观察"
};

export const coordinateAccuracyLabels: Record<CoordinateAccuracy, string> = {
  township: "乡镇级锚点",
  county: "县级锚点",
  regional: "区域示意锚点"
};

export const impactStatusLabels: Record<ImpactStatus, string> = {
  continuing: "持续推进",
  observational: "持续观察"
};

export const verificationStatusLabels: Record<VerificationStatus, string> = {
  verified: "已核验",
  partially_verified: "部分核验"
};

export type ProjectSource = {
  label: string;
  url: string;
};

export type HejiLocation = {
  id: string;
  name: string;
  mapLabel: string;
  nodeType: NodeType;
  region: string;
  coordinates: { latitude: number; longitude: number };
  compactOffset?: { x: number; y: number };
  coordinateAccuracy: CoordinateAccuracy;
  program: string;
  focusTargets: string;
  problem: string;
  action: string;
  participation: string;
  quote?: string;
  result: string;
  verificationNotes?: string;
  impactStatus: ImpactStatus;
  verificationStatus: VerificationStatus;
  sources: ProjectSource[];
  sourceNotes: string;
  lastVerified: string;
  verificationDateLabel?: string;
};

export const locations: HejiLocation[] = [
  {
    id: "ZDB-L001",
    name: "民勤治沙行动｜请到民勤种棵树",
    mapLabel: "民勤治沙行动",
    nodeType: "public_action",
    region: "甘肃省武威市民勤县\n收成镇兴隆村、昌宁镇等治沙基地",
    coordinates: { latitude: 38.6248, longitude: 103.0937 },
    compactOffset: { x: 20, y: -18 },
    coordinateAccuracy: "county",
    program: "《种地吧》S2 民勤篇（第19—22期）；节目后续公益行动",
    focusTargets: "民勤治沙一线、当地村庄、治沙团队及长期参与防沙治沙的公益力量。\n代表人物：仲麟；\n消费助农：民勤当地人参果种植户及产业合作方。",
    problem: "民勤处于巴丹吉林、腾格里两大沙漠之间，需要长期防沙治沙、植被恢复和公众持续参与。",
    action: "与仲麟及当地治沙人员共同种植约18万穴梭梭，占地超500亩；节目播出后，越来越多禾伙人和青年志愿者赴民勤参与治沙。\n同时了解民勤人参果产业并开展助农直播，将地方农产品推广与治沙行动衔接。",
    participation: "线下种树——\n微信搜索小程序「民勤种树吧」，在官方开放期内预约登记。\n线上——\n购买助农治沙：购买民勤当地农产品（如人参果），支持当地农户与治沙相关团队。优先选择已核实主体的官方渠道；小仲沙漠变绿洲（全平台）等其他民勤电商账号。",
    result: "季节性开放。2026春季活动已于4月25日结束；截至原表2026-09-03核验时，未检索到秋季正式开放公告。自2025年活动开展以来已完成公益造林1.5万亩，成活率80%以上；2026年线上报名曾超5万人。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    sources: [
      {
        label: "国家林草局",
        url: "https://www.forestry.gov.cn/lyj/1/kjzrjy/20260508/670031.html"
      },
      {
        label: "央广网",
        url: "https://gs.cnr.cn/gsxw/kx/20260330/t20260330_527567394.shtml"
      },
      {
        label: "中国绿化基金会",
        url: "https://www.cgf.org.cn/cgforgcn/contents/bwsl/202503101099.html?don_object=0&project_id=6e8b89ac-71f2-4700-8ec9-db19d63fedbd"
      },
      {
        label: "数据库转引",
        url: "https://www.iqiyi.com/a_wbm9c2d5c9.html"
      },
      {
        label: "pages.iqiyi.com",
        url: "https://pages.iqiyi.com/p/zbs/news2024031302.html"
      }
    ],
    sourceNotes: "国家林草局/人民日报：https://www.forestry.gov.cn/lyj/1/kjzrjy/20260508/670031.html\n央广网：https://gs.cnr.cn/gsxw/kx/20260330/t20260330_527567394.shtml\n中国绿化基金会：https://www.cgf.org.cn/cgforgcn/contents/bwsl/202503101099.html?don_object=0&project_id=6e8b89ac-71f2-4700-8ec9-db19d63fedbd\n最后核验：2026-09-03\n补充依据：提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E003；助农事件明细:EV017\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n人参果合并依据：助农实体库E004、助农事件明细EV002、农产品与渠道P001。\n数据库转引：https://www.iqiyi.com/a_wbm9c2d5c9.html\nhttps://pages.iqiyi.com/p/zbs/news2024031302.html\n合并整理：2026-10-09；原资料口径不变。",
    lastVerified: "2026-09-03"
  },
  {
    id: "ZDB-L002",
    name: "民勤昌宁镇四方墩生态林基地｜青梭公益",
    mapLabel: "四方墩生态林基地",
    nodeType: "public_action",
    region: "甘肃省武威市民勤县昌宁镇四方墩生态林基地",
    coordinates: { latitude: 38.62015, longitude: 102.50274 },
    compactOffset: { x: -20, y: 18 },
    coordinateAccuracy: "township",
    program: "民勤治沙衍生公益节点；与《种地吧》民勤线处于同一区域",
    focusTargets: "四方墩生态林基地、长期治沙团队、志愿者及参与生态农产品项目的当地农户。\n代表人物：马哥",
    problem: "荒漠化治理需要长期压沙、补植和资金支持，公益行动还需要稳定的志愿者组织与农产品反哺机制。",
    action: "《种地吧》民勤线扩大了公众对当地治沙的关注。该基地由甘肃青梭公益长期组织行动；目前没有可靠证据表明十个勤天直接参与该基地，需与仲麟行动分开表述。",
    participation: "通过青梭公益官网或其官方账号了解志愿活动与生态农产品信息：https://www.qingsuo.cn/\n报名和购买前核对活动主体、开放日期及基地位置。",
    result: "持续进行。当前坐标为昌宁镇级锚点；具体活动安排以青梭公益官方发布为准。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "青梭公益",
        url: "https://www.qingsuo.cn/"
      },
      {
        label: "青梭公益 B站",
        url: "https://space.bilibili.com/1836821327/"
      }
    ],
    sourceNotes: "青梭公益官网：https://www.qingsuo.cn/\nB站机构账号：https://space.bilibili.com/1836821327/\n资料库最后核验：2026-07-30",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L003",
    name: "囊谦芫根助农｜玉树州藏医药职业学校",
    mapLabel: "囊谦芫根助农",
    nodeType: "direct_support",
    region: "青海省玉树藏族自治州囊谦县\n公开地址线索：G214沿线",
    coordinates: { latitude: 32.2, longitude: 96.48 },
    compactOffset: { x: -28, y: -24 },
    coordinateAccuracy: "county",
    program: "《种地吧》S3、S4；S3芫根直播与产品迭代；S4跨季回访",
    focusTargets: "更确木兰校长、学校师生、芫根种植及加工参与者。",
    problem: "学校通过芫根加工收入支持公益教育，但产品需要市场验证、加工升级和稳定销售渠道。",
    action: "开展芫根助农直播，3万件产品上架后快速售罄、销售额超过190万元；随后带回新口味，参与原料清洗和恢复生产，并在后续回访产业进展。\n人物事件补充：数据库EV019记录S3第40期木兰校长首次在爱侬直播间带货，十个勤天现场教授直播要点。",
    participation: "线上——\n购买助农：全平台「伞目慈」；\n产品：青稞脆片、芫根饮料、自研饮品；\n\n线下——\n禾勤久久等数十粉丝公益捐助；十个勤天互助",
    result: "可参与购买，长期关注。公开报道显示芫根直播销售收入持续增长；当前坐标仅为囊谦县级锚点，学校精确门址和坐标仍待核准。\n补充自主销售能力培训线索；培训后的持续经营结果仍需追踪。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    sources: [
      {
        label: "中新网青海",
        url: "https://www.qh.chinanews.com.cn/sh/news/2025/0321/133704.html"
      },
      {
        label: "北京援青",
        url: "https://fgw.beijing.gov.cn/fzggzl/zyhz/gzdt/yq/xggz/202604/t20260403_4573789.htm"
      }
    ],
    sourceNotes: "中新网青海：https://www.qh.chinanews.com.cn/sh/news/2025/0321/133704.html\n北京援青：https://fgw.beijing.gov.cn/fzggzl/zyhz/gzdt/yq/xggz/202604/t20260403_4573789.htm\n原表最后核验：2026-09-03\n补充依据：提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E009；助农事件明细:EV019\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n渠道补充（2026-10-09）：用户截图与确认，「伞目慈」全平台同名，产品为青稞脆片、芫根饮料；主页及主体对应关系待补充。",
    lastVerified: "2026-09-03"
  },
  {
    id: "ZDB-L004",
    name: "囊谦白扎盐场｜红盐与白盐",
    mapLabel: "囊谦白扎盐场",
    nodeType: "direct_support",
    region: "青海省玉树藏族自治州囊谦县白扎乡",
    coordinates: { latitude: 32.07551, longitude: 96.51612 },
    compactOffset: { x: 28, y: -12 },
    coordinateAccuracy: "township",
    program: "《种地吧》S3、S4；S3产地采购；S4第18期跨季回访",
    focusTargets: "江羊巴桑、白扎盐场盐工、当地村集体及传统制盐参与者。",
    problem: "传统制盐需要兼顾技艺传承、产能提升和外部销路，盐工收入需要稳定渠道支撑。",
    action: "首访盐场并达成红盐、白盐采购合作；将产品纳入节目助农供应链；S4回访核验产量、收入和周边带动情况。",
    participation: "线上——\n在淘宝平台搜索「囊谦红盐」；\n产品：红颜热敷护腰护膝、牙膏等。\n\n线下——\n囊谦白扎乡盐场旅游参观",
    result: "持续进行，已形成跨季闭环。S4回访报道：白扎盐场年产盐量增加约100吨，农户户均增收约1万至2万元，周边盐场亦被带动。坐标不是盐田精确边界。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "中国农业大学转载报道",
        url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
      },
      {
        label: "青海日报渠道线索",
        url: "https://finance.sina.com.cn/jjxw/2026-01-04/doc-inhfafpf3344514.shtml"
      }
    ],
    sourceNotes: "中国农业大学转载报道：https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm\n青海日报渠道线索：https://finance.sina.com.cn/jjxw/2026-01-04/doc-inhfafpf3344514.shtml\n原表最后核验：2026-09-03",
    lastVerified: "2026-09-03"
  },
  {
    id: "ZDB-L005",
    name: "囊谦娘麦村水培大棚｜高原蔬菜",
    mapLabel: "娘麦村水培大棚",
    nodeType: "direct_support",
    region: "青海省玉树藏族自治州囊谦县娘拉乡娘麦村",
    coordinates: { latitude: 32.04123, longitude: 96.84253 },
    compactOffset: { x: 32, y: 34 },
    coordinateAccuracy: "township",
    program: "《种地吧》S3、S4；S3第17—20期改造；S4第18期回访",
    focusTargets: "成林、巴金、娘麦村种植户及高原蔬菜供应相关群体。",
    problem: "高原大棚存在用水、用电和种植方式不适配问题，需要可持续的水培技术与本地技术人员。",
    action: "返回娘拉乡改造水培大棚，铺设水培设施并提供种植支持；后续回访确认成林成为当地水培技术指导，带动其他农户。",
    participation: "当前以关注项目进展和传播可靠信息为主。暂无经核验的公开参访或项目直购入口，不建议自行前往大棚。",
    result: "持续进行，技术已在当地扩散，水果彩椒等种植成功，并向学校、食堂和居民供应蔬菜。大棚精确坐标仍待核准。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    sources: [
      {
        label: "中国青年报",
        url: "https://m.cyol.com/gb/articles/2025-08/23/content_PbeKQaux0B.html"
      },
      {
        label: "中国农业大学转载报道",
        url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
      }
    ],
    sourceNotes: "中国青年报：https://m.cyol.com/gb/articles/2025-08/23/content_PbeKQaux0B.html\n中国农业大学转载报道：https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm\n资料库最后核验：2026-07-30",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L006",
    name: "东北助农｜林口沙棘及特色农产品",
    mapLabel: "东北特色农产品助农",
    nodeType: "direct_support",
    region: "主要产地：黑龙江省牡丹江市林口县。\n现有地图锚点：建堂镇东兴村沙棘项目。\n粉条及其他产品的具体经营地址待补充。",
    coordinates: { latitude: 45.68014, longitude: 130.04726 },
    coordinateAccuracy: "township",
    program: "《种地吧》S3；沙棘采收加工、特色农产品展销、乡村合伙人、爱侬日与自主直播",
    focusTargets: "沙棘：高克新（高叔）、张婶及当地种植加工参与者；沙棘工厂杜总。\n粉条：康玉霞（用户补充；官博另列粉条厂康姐）。\n林口展销伙伴：大鹅餐饮公司邵姐、松子加工厂刘总、鲜食玉米加工厂曲叔、梅花鹿养殖场孙总。",
    problem: "沙棘项目：沙棘种植前期投入时间长、冬季就业有限，原料需要深加工产品和稳定销售能力。",
    action: "沙棘项目：参与零下采收，将沙棘开发为沙棘皂；通过早市、展销和乡村合伙人计划推动销售与分红；后期培训高叔、高婶自主直播。\n人物事件补充：数据库EV018记录S3第40期高叔、高婶首次在爱侬直播间带货，并接受十个勤天现场直播教学。\n其他产品与事件补充：爱奇艺S3第3期下（2025-03-07）分集简介记载少年们卖出采收的沙棘，并向杜老板了解沙棘汁等产品。节目官博2025-03-30确认林口展销会涉及沙棘、粉条、大鹅、松子、鲜食玉米及梅花鹿养殖产业；鹿类具体展销商品待补充。",
    participation: "购买助农（抖音）：\n「建堂高叔」—沙棘皂；\n「康玉霞奎山粉条」—土豆粉条。\n以上为用户提供渠道，统一归入东北助农。\n沙棘人物微博「建堂镇高克新」：https://www.sina.cn/media/7999580873\n店铺主页及经营主体待补充。\n新增产品渠道检索（2026-10-10）：沙棘汁、大鹅、松子、鲜食玉米、梅花鹿相关产品均未查得可确认对应节目人物的店铺主页或下单链接。企业候选线索收录在「待核验」，暂不列为直接购买入口。",
    result: "沙棘项目：持续进行。项目从采收帮忙延伸至产品研发、合伙人利益机制和自主销售能力；加工点精确坐标与持续销量仍待补充。\n数据库EV008、R005另记载乡村合伙人展销后分红；具体金额、人数及后续执行情况仍待补充。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    sources: [
      {
        label: "公开报道",
        url: "https://www.sohu.com/a/897694912_121106822"
      },
      {
        label: "爱侬日资料",
        url: "https://pages.iqiyi.com/p/zbs/news20250715.html"
      },
      {
        label: "节目官博人物及展销名单",
        url: "https://www.sina.cn/news/detail/5149869032867081.html"
      },
      {
        label: "沙棘汁节目依据",
        url: "https://www.iq.com/play/become-a-farmer-s3-2025-3-7-1kxi3x22fko?lang=en_us&user=lishan"
      },
      {
        label: "高克新微博",
        url: "https://www.sina.cn/media/7999580873"
      }
    ],
    sourceNotes: "公开报道：https://www.sohu.com/a/897694912_121106822\n爱侬日资料：https://pages.iqiyi.com/p/zbs/news20250715.html\n资料库最后核验：2026-07-30\n补充依据：提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E006；助农实体库:E007；助农事件明细:EV008；助农事件明细:EV018\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n渠道补充（2026-10-09）：用户截图与确认，抖音「建堂高叔」—沙棘皂；「康玉霞奎山粉条」—土豆粉条。按用户意见统一归入东北助农；现有坐标仅对应沙棘项目，粉条地点、事件与经营主体待补充。\n东北产品补查：2026-10-10。\n节目官博人物及展销名单：https://www.sina.cn/news/detail/5149869032867081.html\n沙棘汁节目依据：https://www.iq.com/play/become-a-farmer-s3-2025-3-7-1kxi3x22fko?lang=en_us&user=lishan\n以上确认节目产品与事件，未确认当前在售及店铺。",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L007",
    name: "宁乡草冲村花猪助农｜贺大姐",
    mapLabel: "宁乡花猪助农",
    nodeType: "direct_support",
    region: "湖南省长沙市宁乡市流沙河镇草冲村",
    coordinates: { latitude: 27.94, longitude: 112.1 },
    coordinateAccuracy: "township",
    program: "《种地吧》S3；花猪节、市场走访、品牌合作与爱侬日",
    focusTargets: "贺桂香（贺大姐）、宁乡花猪养殖户及相关监测户。",
    problem: "宁乡花猪养殖成本较高，成熟渠道存在供应链壁垒，需要核算成本、寻找分割销售方案和稳定合作品牌。",
    action: "体验养殖并走访市场和合作品牌，协助寻找长线销售方案；项目后续延伸至赠送猪苗、技术指导和保底回收。",
    participation: "淘宝芭芭农场：查找贺大姐宁乡花猪相关助农信息（用户说明截图中的“农场”应指此入口）；具体活动页与购买入口待补充。\n也可关注抖音「宁乡花猪养殖-贺桂香」：https://www.douyin.com/user/MS4wLjABAAAAvVi2KbhK2yt5G9NM67RZs5uUHUm2KZ1DJU7O3kFusa75M89BeGhflNnb5QIYksx8",
    result: "持续进行。公开资料称项目拓宽了花猪销路，爱侬日相关库存快速售罄；养殖场精确位置、带动农户和存栏数据仍待核准。\n人物关系补充：数据库R007与S3逐期表记录贺大姐等伙伴在S3第39期再次来到后陡门；持续销售与养殖收益仍待追踪。",
    impactStatus: "continuing",
    verificationStatus: "verified",
    sources: [
      {
        label: "湖南日报 / 新湖南",
        url: "https://www.hunantoday.cn/news/xhn/202605/32741255.html"
      },
      {
        label: "爱侬日资料",
        url: "https://pages.iqiyi.com/p/zbs/news20250715.html"
      },
      {
        label: "贺桂香抖音",
        url: "https://www.douyin.com/user/MS4wLjABAAAAvVi2KbhK2yt5G9NM67RZs5uUHUm2KZ1DJU7O3kFusa75M89BeGhflNnb5QIYksx8"
      }
    ],
    sourceNotes: "湖南日报/新湖南：https://www.hunantoday.cn/news/xhn/202605/32741255.html\n节目资料：https://pages.iqiyi.com/p/zbs/news20250715.html\n资料库最后核验：2026-07-30\n补充依据：提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E012；助农事件明细:EV015\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n渠道补充（2026-10-09）：用户截图与说明，宁乡花猪所列“农场”应为淘宝芭芭农场；具体活动页与购买入口待补充。",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L008",
    name: "西藏墨脱农业助农｜茶叶、辣椒与林下石斛产业",
    mapLabel: "墨脱特色农业",
    nodeType: "direct_support",
    region: "西藏自治区林芝市墨脱县",
    coordinates: { latitude: 29.32841, longitude: 95.33088 },
    compactOffset: { x: -26, y: 20 },
    coordinateAccuracy: "county",
    program: "《种地吧》S4第1—6期；产区调研、生产参与与农产品推介会",
    focusTargets: "墨脱茶农、特色农业种植户。\n墨脱县宣传部副部长张达；\n玛迪村驻村第一书记李英；\n格当乡副乡长张洋（辣椒）；\n帮辛乡农牧服务中心农艺师马雄（石斛基地）；\n农学院博士牟思维（金钗石斛）；\n德兴乡香蕉林扎巴叔；\n加热萨乡干部德吉曲珍（石锅，灵芝）；\n甘登乡格林村副队长刘鹏翼（茶叶）；\n巴登村妇联主席白玛布赤（白肉枇杷）；\n德兴乡农牧综合服务中心主任桑杰多吉（香蕉）；",
    problem: "特色农产品丰富，但种植规模、产品品牌知名度和外部产业连接仍不足，长期销售效果需要持续观察。",
    action: "走访茶叶、辣椒、香蕉、枇杷、石斛等产业：\n德兴乡香蕉林单轨索道：为农户扎巴叔 70 亩陡坡香蕉园搭建约 200 米单轨运输索道，解决陡坡香蕉人工背运难题，大幅减少人力搬运成本。\n墨脱好物推介会「美丽墨脱 好物天成」：\n和丁真珍珠、张泉灵联合举办，只推介、不上链接售卖。重点展示墨脱香蕉、香橼、石斛、白肉灵芝、茶叶、门巴辣椒等。\n雨林石斛林打卡地标：\n在不破坏雨林生态前提下，设置纪念木牌（刻有 “相信土地的力量” 及藏语版本），作为文旅打卡点，带动游客关注林下经济、公益种植。",
    participation: "线下文旅：\n【玛迪村】自驾游，香蕉等时鲜水果；鲜果为保证品质，优先推荐线下购买。\n【石斛林】纪念木牌（刻有 “相信土地的力量” 及藏语版本）打卡，金钗石斛购买等。地址：西藏林芝市墨脱县帮辛乡肯肯村 林下金钗石斛基地。\n【219国道】沿线农家乐石锅鸡、白肉灵芝。\n【德尔贡村兰花保育基地】墨脱兰花，广招人才。\n\n线上购买：\n【墨脱好物】品牌推广，各平台墨脱产业小店，包含墨脱特色茶叶、皂石石锅、白肉灵芝、格当乡辣椒、竹编等。\n天猫【十个勤天旗舰店】、抖音十个勤天-香橼红茶吸吸冻、石斛红枣吸吸冻、灵芝桂圆吸吸冻",
    quote: "这里是边境，边境是老百姓守的。\n全世界独一份的就是这条通往墨脱的路。\n抬头看见雪山，而人在雨林里。\n世界只有一个墨脱，墨脱拥有整个世界。\n墨脱的农业发展之路，远且阻；但我们会一起慢慢走、好好走。",
    result: "持续观察。推介会已完成，节目与直播带来曝光和订单线索，但公开资料尚不足以确认长期销量和产业效果。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "央视网",
        url: "https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml"
      },
      {
        label: "中新网",
        url: "https://www.chinanews.com.cn/cul/2026/05-28/10630451.shtml"
      }
    ],
    sourceNotes: "央视网：https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml\n中新网：https://www.chinanews.com.cn/cul/2026/05-28/10630451.shtml\n资料库最后核验：2026-07-30",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L011",
    name: "西藏墨脱“背夫的故事”",
    mapLabel: "墨脱背夫的故事",
    nodeType: "public_action",
    region: "西藏自治区林芝市墨脱县；具体访谈地点待核验。",
    coordinates: { latitude: 29.32841, longitude: 95.33088 },
    compactOffset: { x: 26, y: -30 },
    coordinateAccuracy: "county",
    program: "S4第1期下",
    focusTargets: "地东村老书记高荣书记；\n德兴农牧综合服务中心主任桑杰多吉；\n玛迪村村民；帮辛村村民；格林村村民",
    problem: "2013年之前，墨脱由于地质等各种因素不通公路，需要通过每一个背夫翻越雪山搬运物资。孩子的成人礼是完成一次背夫的使命。",
    action: "聆听并通过节目呈现当地村民的背夫经历，记录年少负重、翻山运输与家庭生计的往事。\n结合墨脱修路史，展现从人背马驮到公路联通的生活变化，让观众认识当地人的历史与今天的农业发展。",
    participation: "文化传播：观看节目及可靠口述史资料，分享背夫故事与墨脱生活变迁。\n消费支持：关注墨脱茶叶、水果等当地农产品，通过核实经营主体的渠道购买。\n本条未查得背夫群体专属募捐或购买入口。",
    quote: "记住翻山的人，也看见他们今天的生活。\n（编辑拟写，非节目原话）",
    result: "2013年10月31日波墨公路正式通车，墨脱结束县城不通公路的历史。\n此后交通改善，带动茶叶、水果、林下产业与乡村旅游发展。背夫故事已被节目记录；受访者个人近况及本条直接增收结果待核验。",
    verificationNotes: "坐标沿用墨脱农业项目的县级锚点，非受访者家址或访谈位置。人物姓名、职务及“成人礼”依据整理记录，待节目字幕或时间码复核；金句为原创编辑文案。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "《种地吧》官博话题页",
        url: "https://weibo.com/a/hot/94cd1e5cac87ca32_0.html?type=grab"
      },
      {
        label: "文艺报 · 杨长岭",
        url: "https://wyb.chinawriter.com.cn/Pad/content/202605/22/content83931.html"
      },
      {
        label: "新华社 · 那山·那路·那城",
        url: "https://www.xinhuanet.com/2023-11/02/c_1129955062.htm"
      }
    ],
    sourceNotes: "外部核验：2026-10-14。\n节目官博：当地村民讲述年少翻山背运物资的经历（话题页内“种地吧”原帖）。\nhttps://weibo.com/a/hot/94cd1e5cac87ca32_0.html?type=grab\n总导演杨长岭《将镜头对准守护土地、坚韧奋进的普通人》，文艺报，2026-05-22：背夫群像及前两期围绕“路”的叙事。\nhttps://wyb.chinawriter.com.cn/Pad/content/202605/22/content83931.html\n新华社《那山·那路·那城》，2023-11-02：通车日期、背运历史及产业变化。\nhttps://www.xinhuanet.com/2023-11/02/c_1129955062.htm\n坐标沿用本表墨脱农业项目的县级锚点，非受访者家址或访谈位置。人物姓名、职务及“成人礼”沿用用户记录，待字幕或时间码复核；K栏为原创编辑文案。",
    lastVerified: "2026-10-14"
  },
  {
    id: "ZDB-L009",
    name: "于田沙漠玫瑰与锁边工程｜荒漠农业",
    mapLabel: "于田荒漠农业",
    nodeType: "direct_support",
    region: "新疆维吾尔自治区和田地区于田县\n关联地：沙漠玫瑰种植区、加依村治沙项目",
    coordinates: { latitude: 36.8573, longitude: 81.6771 },
    compactOffset: { x: 20, y: -16 },
    coordinateAccuracy: "county",
    program: "《种地吧》S4第7—13期及同季回访",
    focusTargets: "买吐地、买哈扑司汗、加依村村民和治沙农户。",
    problem: "沙漠边缘农业面临风沙、供水、供能和产品加工问题，玫瑰种植与锁边工程需要基础设施和后续产业支持。",
    action: "参与沙漠推平、阻沙带建设、打井铺管、光伏设施和沙枣苗种植；共同种植沙漠玫瑰并考察加工方向。",
    participation: "购买助农：淘宝搜索「新疆蜜饯干果食品」，查找沙漠玫瑰产品（用户提供渠道）。\n店铺经营主体及与具体种植户的关系待核验；公开参访、捐助入口仍待补充。",
    result: "持续进行。同季回访看到玫瑰抽芽，约100亩区域完成平整并出现沙枣苗和光伏设施；村级项目边界和精确坐标仍待核准。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "央视网",
        url: "https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml"
      },
      {
        label: "中国农业大学转载报道",
        url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
      }
    ],
    sourceNotes: "央视网：https://ghrp.cctv.com/2026/05/22/ARTIzhIxW0OUmBAMpeZM46y5260522.shtml\n中国农业大学转载报道：https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm\n资料库最后核验：2026-07-30\n用户提供助农渠道截图（2026-10-09）：淘宝「新疆蜜饯干果食品」—沙漠玫瑰；店铺主体及与具体农户的对应关系待补充。",
    lastVerified: "2026-07-30"
  },
  {
    id: "ZDB-L010",
    name: "策勒治沙红枣｜沙漠种枣人",
    mapLabel: "策勒治沙红枣",
    nodeType: "direct_support",
    region: "新疆维吾尔自治区和田地区策勒县\n关联地：策勒乡阿日希村；新疆沙漠枣业有限公司",
    coordinates: { latitude: 37.002, longitude: 80.801 },
    compactOffset: { x: -20, y: 16 },
    coordinateAccuracy: "county",
    program: "《种地吧》S4第14—18期；库存诊断、产品研发、助农直播与回访",
    focusTargets: "李鹏团队、新疆沙漠枣业有限公司、策勒县智慧果业农民专业合作社及当地枣农。",
    problem: "治沙植枣形成产业后，原枣深加工和销售能力不足；节目考察时存在超过300吨红枣库存压力。",
    action: "参加县级产业讨论，研究红枣果丹皮等年轻化产品，讲述17年治沙种枣故事，并开展零佣金助农直播。",
    participation: "购买助农：淘宝搜索「沙漠枣业企业店」，购买红枣（用户提供渠道）；原资料另提供「沙漠种枣人」「新疆沙漠玉枣骏枣」作为搜索线索。\n企业主体参考：https://shamozaoye.gys.cn/\n店铺主页链接及经营主体对应凭证待补充。",
    result: "现在可参与购买。节目直播1小时售出约94吨，后续报道显示企业店累计售出超过200吨。当前坐标为策勒县级锚点，不是阿日希村精确点。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "中国农业大学转载报道",
        url: "https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm"
      },
      {
        label: "中新网新疆",
        url: "https://www.xj.chinanews.com.cn/dizhou/2026-04-18/detail-ihfcqyyi3995813.shtml"
      },
      {
        label: "商品核验页",
        url: "https://tao.hooos.com/goods_2Ver3RaFotgNG6MWyOCaKoUDtD-k5v00Gf8bKzzeYRT3.html"
      },
      {
        label: "企业主体",
        url: "https://shamozaoye.gys.cn/"
      }
    ],
    sourceNotes: "中国农业大学转载报道：https://news.cau.edu.cn/mtndnew/294c5976e377445787bf1e30a9bcd010.htm\n中新网新疆：https://www.xj.chinanews.com.cn/dizhou/2026-04-18/detail-ihfcqyyi3995813.shtml\n商品核验页：https://tao.hooos.com/goods_2Ver3RaFotgNG6MWyOCaKoUDtD-k5v00Gf8bKzzeYRT3.html\n原表最后核验：2026-09-03\n用户提供助农渠道截图（2026-10-09）：淘宝「沙漠枣业企业店」—红枣；店铺主页及经营主体对应凭证待补充。",
    lastVerified: "2026-09-03"
  },
  {
    id: "ZDB-L012",
    name: "爱侬日全国助农平台｜新农人交流与自主直播",
    mapLabel: "爱侬日全国助农平台",
    nodeType: "public_action",
    region: "全国多地农人参与，活动交流节点为浙江杭州后陡门；属于平台型事件，不是单一受助地点",
    coordinates: { latitude: 30.323, longitude: 120.083 },
    compactOffset: { x: 20, y: -15 },
    coordinateAccuracy: "township",
    program: "《种地吧》S2爱侬日、S3全国联动及第40期直播培训；数据库EV004、EV016、EV018、EV019，E013、R008\n前期供应链实践：S2第26、32期草莓采购（E001、EV003、P002）。",
    focusTargets: "各地新农人、农文旅经营者及农产品合作方；培训对象包括高克新、高婶和更确木兰校长。\n供应链相关帮助对象：后陡门周边草莓种植户，具体农户姓名待补充。",
    problem: "分散农人缺少集中展示与渠道连接；合作方需要逐步掌握自主销售能力。\n周边果农的草莓销路与加工原料需求，也是前期供应链实践的问题。",
    action: "组织新农人论坛、研讨和助农直播；S3开展“1+N”全国联动，并由十个勤天现场教授农友直播技巧。\nS2曾向后陡门周边果农采购草莓，用于草莓酱加工。",
    participation: "关注节目和活动官方公告。数据库未提供当前开放报名或统一选品购买入口，暂不设置可直接参与的报名或购买链接。\n购买助农：关注爱侬日官方选品与活动信息，核对农产品来源和生产主体后参与购买。",
    result: "数据库记录S3联动15家直播间、展销300余款产品、全平台累计观看超过1.4亿，并有农友自主直播培训。观看量属于传播指标；平台成果不与各单项项目销量重复相加。\n草莓采购与加工已有数据库记录；采购规模、农户收益及与爱侬日具体商品的对应关系仍待核验。",
    verificationNotes: "原表未提供数字坐标。地图暂沿用项目资料库中的杭州三墩镇后陡门乡镇级锚点，仅表示平台交流节点，非全国各受助项目的位置，也不是活动场地的精确门址。",
    impactStatus: "continuing",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "爱侬日资料",
        url: "https://pages.iqiyi.com/p/zbs/news20250715.html"
      },
      {
        label: "www.iq.com",
        url: "https://www.iq.com/play/%E7%A7%8D%E5%9C%B0%E5%90%A7%E7%AC%AC2%E5%AD%A3-2024-6-28-1rb60qzyins?lang=zh_cn"
      },
      {
        label: "数据库转引",
        url: "https://pages.iqiyi.com/p/zbs/news20240223.html"
      }
    ],
    sourceNotes: "提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E013；助农事件明细:EV004；助农事件明细:EV016；助农事件明细:EV018；助农事件明细:EV019；农产品与渠道:P008\n原始来源（数据库转引，未重新访问）：\nhttps://pages.iqiyi.com/p/zbs/news20250715.html\nhttps://www.iq.com/play/%E7%A7%8D%E5%9C%B0%E5%90%A7%E7%AC%AC2%E5%AD%A3-2024-6-28-1rb60qzyins?lang=zh_cn\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n草莓采购合并依据：助农实体库E001、助农事件明细EV003、农产品与渠道P002。\n数据库转引：https://pages.iqiyi.com/p/zbs/news20240223.html\n合并整理：2026-10-09；原资料口径不变。",
    lastVerified: "2026-09-03",
    verificationDateLabel: "资料口径"
  },
  {
    id: "ZDB-L013",
    name: "西双版纳水果助销",
    mapLabel: "西双版纳水果助销",
    nodeType: "direct_support",
    region: "云南省西双版纳傣族自治州；具体受灾村庄、果园、灾情发生日期及经营主体待核验",
    coordinates: { latitude: 22, longitude: 100.8 },
    compactOffset: { x: -26, y: 20 },
    coordinateAccuracy: "regional",
    program: "数据库标记《种地吧》S4第29期；播出与行动日期待复核；EV030、E018、P013",
    focusTargets: "西双版纳受灾水果种植户及合作方；涉及芒果、菠萝、百香果等，未提供可靠人物姓名。",
    problem: "数据库记录水果受灾、芒果等出现低价，产地面临集中销售压力；受灾范围和损失待核验。",
    action: "实地了解果品、灾情与价格，与当地农户或合作方讨论水果助销办法。",
    participation: "购买助农：抖音搜索「版纳联农」，查找应季水果（用户提供渠道）。\n店铺主页、经营主体及与具体果农的关系待补充；历史助销事件的销量与履约结果仍待核验。",
    result: "助销推进情况待核验：数据库已记录产地调研与助销对策讨论；最终采购、渠道落地、销量和履约结果仍待补充。",
    verificationNotes: "原表缺少数字坐标。地图暂以西双版纳景洪区域内约北纬22°、东经100.8°作为示意锚点，非受灾村庄、果园或店铺的精确位置。区域归属参考中国天气网景洪城市介绍，具体项目位置仍待核验。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "www.iqiyi.com",
        url: "https://www.iqiyi.com/a_vnn1du4wil.html"
      },
      {
        label: "中国天气网 · 景洪区域范围",
        url: "https://www.weather.com.cn/cityintro/101291601.shtml"
      }
    ],
    sourceNotes: "提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E018；助农事件明细:EV030；农产品与渠道:P013\n原始来源（数据库转引，未重新访问）：\nhttps://www.iqiyi.com/a_vnn1du4wil.html\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。\n用户提供助农渠道截图（2026-10-09）：抖音「版纳联农」—应季水果；店铺主页及与具体果农的对应关系待补充。",
    lastVerified: "2026-09-03",
    verificationDateLabel: "资料口径"
  },
  {
    id: "ZDB-L014",
    name: "云南橡胶产业调研",
    mapLabel: "云南橡胶产业调研",
    nodeType: "industry_observation",
    region: "云南省，数据库关联西双版纳等橡胶产区；具体村庄、胶园和企业待核验",
    coordinates: { latitude: 22, longitude: 100.8 },
    compactOffset: { x: 26, y: -30 },
    coordinateAccuracy: "regional",
    program: "数据库标记《种地吧》S4第21、30期；期数待复核；EV031、E019、P014",
    focusTargets: "云南胶工、胶农及产业合作方",
    problem: "数据库以初级原料产业的劳动价值、品牌和规模经营作为调研议题；具体农户经营诉求待核验。",
    action: "学习割胶、理解胶工劳动与产业链；数据库记载鹭卓提出当地规模化品牌的设想。",
    participation: "当前仅保留产业观察线索；暂无可核验的品牌合作、购买、志愿或捐助入口。",
    result: "产业调研／待观察：目前仅有劳动体验、传播与方案设想，无证据确认品牌已成立、销售渠道已落地或胶农已增收，不标为已完成直接助农。",
    verificationNotes: "原表没有数字坐标，仅注明补充西双版纳地理坐标。地图暂以西双版纳景洪区域内约北纬22°、东经100.8°作为示意锚点，非节目胶园、农户住址或企业位置。区域归属参考中国天气网景洪城市介绍；具体到访地、合作及增收结果仍待核验。",
    impactStatus: "observational",
    verificationStatus: "partially_verified",
    sources: [
      {
        label: "www.iqiyi.com",
        url: "https://www.iqiyi.com/a_vnn1du4wil.html"
      },
      {
        label: "pages.iqiyi.com",
        url: "https://pages.iqiyi.com/p/zbs/63x0avhv.html"
      },
      {
        label: "中国天气网 · 景洪区域范围",
        url: "https://www.weather.com.cn/cityintro/101291601.shtml"
      }
    ],
    sourceNotes: "提取自：种地吧全四季_助农关系数据库_升级版.xlsx\n助农实体库:E019；助农事件明细:EV031；农产品与渠道:P014\n原始来源（数据库转引，未重新访问）：\nhttps://www.iqiyi.com/a_vnn1du4wil.html\nhttps://pages.iqiyi.com/p/zbs/63x0avhv.html\n资料提取：2026-10-09；数据库口径截至2026-09-03，非本次外部核验。",
    lastVerified: "2026-09-03",
    verificationDateLabel: "资料口径"
  }
];

export function filterLocations(
  source: HejiLocation[],
  filter: ActionFilter
): HejiLocation[] {
  if (filter === "全部") return source;
  return source.filter(
    (location) => nodeTypeLabels[location.nodeType] === filter
  );
}
