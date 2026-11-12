import content from "./heji-content.json";

const options = content.participationOptions;

export type ParticipationOption = {
  id: string;
  projectId: string;
  category: string;
  platform: string | null;
  name: string;
  productsText: string | null;
  instructions: string | null;
  url: string | null;
  lastEditedAt: string | null;
  availabilityStatus: string | null;
  recordStatus: string | null;
  pendingNotes: string | null;
};

// Workbook numbering differs from the original map for these three projects.
export const maintenanceProjectIds: Record<string, string> = {
  "ZDB-L001": "HJ-001", "ZDB-L002": "HJ-002", "ZDB-L003": "HJ-003",
  "ZDB-L004": "HJ-004", "ZDB-L005": "HJ-005", "ZDB-L006": "HJ-006",
  "ZDB-L007": "HJ-007", "ZDB-L008": "HJ-008", "ZDB-L011": "HJ-009",
  "ZDB-L009": "HJ-010", "ZDB-L010": "HJ-011", "ZDB-L012": "HJ-012",
  "ZDB-L013": "HJ-013", "ZDB-L014": "HJ-014"
};

export function getParticipationGroups(legacyId: string, records: ParticipationOption[] = options) {
  const projectOptions = records.filter((option) =>
    option.projectId === maintenanceProjectIds[legacyId] && option.recordStatus !== "已归档"
  );
  return Array.from(new Set(projectOptions.map((option) => option.category))).map((category) => ({
    category,
    options: projectOptions.filter((option) => option.category === category)
  }));
}

export type ParticipationGroup = ReturnType<typeof getParticipationGroups>[number];

export function getParticipationFilterLabel(category: string) {
  if (category === "线上购买") return "购买助农";
  if (category === "线下参访" || category === "线下文旅") return "文旅参访";
  return category;
}

export function getParticipationFilters(records: ParticipationOption[] = options) {
  return ["全部", ...new Set(records.filter((option) => option.recordStatus !== "已归档")
    .map((option) => getParticipationFilterLabel(option.category)))];
}

export function getProjectCategories(legacyId: string, records: ParticipationOption[] = options) {
  return Array.from(new Set(getParticipationGroups(legacyId, records)
    .map((group) => getParticipationFilterLabel(group.category))));
}
