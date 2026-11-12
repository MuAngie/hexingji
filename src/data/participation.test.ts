import { describe, expect, it } from "vitest";
import content from "./heji-content.json";
import { getParticipationFilters, getParticipationGroups, getProjectCategories, maintenanceProjectIds } from "./participation";

const options = content.participationOptions;

describe("updated participation records", () => {
  it("associates every record with its map project, including the three reordered IDs", () => {
    expect(maintenanceProjectIds["ZDB-L011"]).toBe("HJ-009");
    expect(maintenanceProjectIds["ZDB-L009"]).toBe("HJ-010");
    expect(maintenanceProjectIds["ZDB-L010"]).toBe("HJ-011");
    const displayed = Object.keys(maintenanceProjectIds).flatMap((legacyId) => {
      const records = getParticipationGroups(legacyId).flatMap((group) => group.options);
      expect(records.every((record) => record.projectId === maintenanceProjectIds[legacyId])).toBe(true);
      return records.map((record) => record.id);
    });
    expect(new Set(displayed)).toEqual(new Set(options.filter((option) => option.recordStatus !== "已归档").map((option) => option.id)));
  });

  it("includes the newly added records even when record status is blank", () => {
    const cele = getParticipationGroups("ZDB-L010").flatMap((group) => group.options);
    expect(cele.find((option) => option.name === "我在沙漠有棵树")?.recordStatus).toBeNull();
    expect(getParticipationGroups("ZDB-L006")[0].options.map((option) => option.name)).toContain("寒浆子（杜总的沙棘汁）");
    expect(getParticipationGroups("ZDB-L013")[0].options.map((option) => option.name)).toContain("版纳热情果种植户张余文");
  });

  it("excludes archived records without treating closed or ended information as deleted", () => {
    const records = structuredClone(options);
    records.find((option) => option.projectId === "HJ-003")!.recordStatus = "已归档";
    const displayed = getParticipationGroups("ZDB-L003", records).flatMap((group) => group.options);
    expect(displayed.map((option) => option.name)).toEqual(["粉丝公益捐助", "十个勤天互助"]);
    expect(displayed.map((option) => option.availabilityStatus)).toEqual(["暂时关闭", "已结束"]);
  });

  it("derives category filters from active records and accepts new workbook categories", () => {
    const records = structuredClone(options);
    records.find((option) => option.category === "人才参与")!.recordStatus = "已归档";
    records.push({ ...records[0], id: "PA-new", category: "环境教育" });
    const filters = getParticipationFilters(records);
    expect(filters).not.toContain("人才参与");
    expect(filters).toContain("环境教育");
    expect(filters).not.toContain("线上购买");
    expect(filters).not.toContain("线下参访");
    expect(getProjectCategories("ZDB-L008", records)).toEqual(["文旅参访", "购买助农"]);
  });
});
