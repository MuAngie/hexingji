import content from "./heji-content.json";
import { minqinAutumnNotice } from "./minqin-autumn-2026";
import { getParticipationFilters, getParticipationGroups, getProjectCategories, maintenanceProjectIds, type ParticipationOption } from "./participation";
import type { GeoCoordinates } from "./mapProjection";

export const actionFilters = getParticipationFilters();
export type ActionFilter = string;
export type NodeType = "direct_support" | "public_action" | "industry_observation";

export type Project = {
  id: string;
  name: string;
  region: string | null;
  program: string | null;
  problem: string | null;
  action: string | null;
  localFeatures: string | null;
  quote: string | null;
  result: string | null;
  coordinates: GeoCoordinates | null;
  coordinateAccuracyText: string | null;
  coordinateNotes: string | null;
  sourceNotes: string | null;
};

export type ProjectPerson = {
  id: string;
  projectId: string;
  name: string;
  publicAccount: string | null;
  objectType: string | null;
  role: string | null;
  recordStatus: string | null;
  lastVerifiedAt: string | null;
  pendingNotes: string | null;
};

export type ProjectContent = {
  projects: Project[];
  projectPeople: ProjectPerson[];
  participationOptions: ParticipationOption[];
};

export type HejiLocation = {
  id: string;
  projectId: string;
  name: string;
  mapLabel: string;
  nodeType: NodeType;
  region: string | null;
  coordinates: GeoCoordinates | null;
  displayCoordinates: GeoCoordinates;
  isIllustrative: boolean;
  compactOffset?: { x: number; y: number };
};

// Labels, categories and visual offsets belong to the illustrated map.
const mapConfig: Record<string, {
  mapLabel: string;
  nodeType: NodeType;
  compactOffset?: { x: number; y: number };
  displayCoordinates?: GeoCoordinates;
}> = {
  "ZDB-L001": { mapLabel: "民勤治沙行动", nodeType: "public_action", compactOffset: { x: 20, y: -18 } },
  "ZDB-L002": { mapLabel: "四方墩生态林基地", nodeType: "public_action", compactOffset: { x: -20, y: 18 } },
  "ZDB-L003": { mapLabel: "囊谦芫根助农", nodeType: "direct_support", compactOffset: { x: -28, y: -24 } },
  "ZDB-L004": { mapLabel: "囊谦白扎盐场", nodeType: "direct_support", compactOffset: { x: 28, y: -12 } },
  "ZDB-L005": { mapLabel: "娘麦村水培大棚", nodeType: "direct_support", compactOffset: { x: 32, y: 34 } },
  "ZDB-L006": { mapLabel: "东北特色农产品助农", nodeType: "direct_support" },
  "ZDB-L007": { mapLabel: "宁乡花猪助农", nodeType: "direct_support" },
  "ZDB-L008": { mapLabel: "墨脱特色农业", nodeType: "direct_support", compactOffset: { x: -26, y: 20 } },
  "ZDB-L011": { mapLabel: "墨脱背夫的故事", nodeType: "public_action", compactOffset: { x: 26, y: -30 } },
  "ZDB-L009": { mapLabel: "于田荒漠农业", nodeType: "direct_support", compactOffset: { x: 20, y: -16 } },
  "ZDB-L010": { mapLabel: "策勒治沙红枣", nodeType: "direct_support", compactOffset: { x: -20, y: 16 } },
  "ZDB-L012": { mapLabel: "爱侬日全国助农平台", nodeType: "public_action", compactOffset: { x: 20, y: -15 }, displayCoordinates: { latitude: 30.323, longitude: 120.083 } },
  "ZDB-L013": { mapLabel: "西双版纳水果助销", nodeType: "direct_support", compactOffset: { x: -26, y: 20 }, displayCoordinates: { latitude: 22, longitude: 100.8 } },
  "ZDB-L014": { mapLabel: "云南橡胶产业调研", nodeType: "industry_observation", compactOffset: { x: 26, y: -30 }, displayCoordinates: { latitude: 22, longitude: 100.8 } }
};

export const locations: HejiLocation[] = content.projects.map((project) => {
  const id = Object.keys(maintenanceProjectIds).find((key) => maintenanceProjectIds[key] === project.id);
  if (!id || !mapConfig[id]) throw new Error(`项目 ${project.id} 缺少地图展示配置`);
  const config = mapConfig[id];
  const displayCoordinates = project.coordinates ?? config.displayCoordinates;
  if (!displayCoordinates) throw new Error(`项目 ${project.id} 缺少地图位置`);
  return {
    id, projectId: project.id, name: project.name, region: project.region,
    ...config, coordinates: project.coordinates, displayCoordinates,
    isIllustrative: project.coordinates === null
  };
});

export function getProjectView(legacyId: string, data: ProjectContent = content) {
  const project = data.projects.find((item) => item.id === maintenanceProjectIds[legacyId])!;
  const regionText = project.id === minqinAutumnNotice.projectId ? minqinAutumnNotice.region : project.region;
  const people = data.projectPeople.filter((item) => item.projectId === project.id && item.recordStatus !== "已归档");
  const groups = getParticipationGroups(legacyId, data.participationOptions);
  const options = groups.flatMap((group) => group.options);
  const categories = getProjectCategories(legacyId, data.participationOptions);
  const programText = ["HJ-011", "HJ-012", "HJ-013", "HJ-014"].includes(project.id)
    ? project.program?.replace(/^数据库标记\s*/, "").replace(/[；;]\s*$/, "").split(/[；;]/).map((part) => part.trim()).filter(Boolean).join("\n") ?? null
    : project.program;
  const sourceLinks = Array.from(new Set(project.sourceNotes?.match(/https?:\/\/[^\s]+/g) ?? []))
    .map((url) => ({ url, label: new URL(url).hostname }));
  return {
    project, people, groups, options, sourceLinks, categories, programText, regionText,
    quoteLines: project.quote?.split(/\r?\n/).filter((line) => line.trim()) ?? [],
    quoteEmphasisIndex: project.id === "HJ-008" ? 3 : project.id === "HJ-010" ? 1 : 0,
    counts: { objects: people.length, participationRecords: options.length }
  };
}

export function filterLocations(source: HejiLocation[], filter: ActionFilter, records: ParticipationOption[] = content.participationOptions): HejiLocation[] {
  return filter === "全部" ? source : source.filter((location) => getProjectCategories(location.id, records).includes(filter));
}
