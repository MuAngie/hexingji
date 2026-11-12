import { describe, expect, it } from "vitest";
import { actionFilters, filterLocations, getProjectView, locations, type ProjectContent } from "./projects";
import { latLngToMapPosition } from "./mapProjection";
import content from "./heji-content.json";

describe("禾迹地点资料库", () => {
  it("includes all 14 workbook projects", () => {
    expect(filterLocations(locations, "全部")).toHaveLength(content.projects.length);
  });

  it("filters by participation categories and merges equivalent categories", () => {
    expect(filterLocations(locations, "购买助农")).toHaveLength(11);
    expect(filterLocations(locations, "线下志愿参与")).toHaveLength(3);
    expect(filterLocations(locations, "文旅参访")).toHaveLength(2);
    expect(filterLocations(locations, "纪实信息")).toHaveLength(2);
    expect(filterLocations(locations, "购买助农").some((location) => location.projectId === "HJ-001")).toBe(true);
    expect(filterLocations(locations, "购买助农").some((location) => location.projectId === "HJ-008")).toBe(true);
    for (const category of ["购买助农", "文旅参访", "人才参与"]) {
      expect(filterLocations(locations, category).some((location) => location.projectId === "HJ-008")).toBe(true);
    }
    const results = filterLocations(locations, "购买助农");
    expect(new Set(results.map((location) => location.id)).size).toBe(results.length);
  });

  it("keeps the source coordinates for representative locations", () => {
    expect(
      locations.find((location) => location.id === "ZDB-L001")?.coordinates
    ).toEqual({ latitude: 38.6248, longitude: 103.0937 });
    expect(
      locations.find((location) => location.id === "ZDB-L010")?.coordinates
    ).toEqual({ latitude: 37.002, longitude: 80.801 });
  });

  it("uses the latest source facts and associations for every project", () => {
    for (const location of locations) {
      const view = getProjectView(location.id);
      const project = content.projects.find((project) => project.id === location.projectId)!;
      expect(view.project).toEqual(project);
      expect(location.name).toBe(project.name);
      expect(view.people.map((person) => person.id)).toEqual(content.projectPeople
        .filter((person) => person.projectId === project.id && person.recordStatus !== "已归档")
        .map((person) => person.id));
      expect(view.options.every((option) => option.projectId === project.id)).toBe(true);
      expect(view.counts).toEqual({ objects: view.people.length, participationRecords: view.options.length });
    }
  });

  it("projects every documented coordinate inside the map canvas", () => {
    for (const location of locations) {
      const position = latLngToMapPosition(location.displayCoordinates);

      expect(position.x, location.id).toBeGreaterThanOrEqual(0);
      expect(position.x, location.id).toBeLessThanOrEqual(100);
      expect(position.y, location.id).toBeGreaterThanOrEqual(0);
      expect(position.y, location.id).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the documented filter labels available to the UI", () => {
    expect(actionFilters).toEqual(["全部", "线下志愿参与", "购买助农", "公益支持", "文旅参访", "纪实信息", "人才参与", "文化传播", "活动入口"]);
  });

  it("identifies provisional anchors and keeps rubber research separate from direct support", () => {
    for (const id of ["ZDB-L012", "ZDB-L013", "ZDB-L014"]) {
      const location = locations.find((point) => point.id === id)!;
      expect(location.coordinates).toBeNull();
      expect(location.isIllustrative).toBe(true);
      expect(location.displayCoordinates.latitude).toBeGreaterThan(0);
    }
    expect(locations.find((point) => point.id === "ZDB-L014")?.nodeType)
      .toBe("industry_observation");
  });

  it("uses the newly assigned people IDs and imports public accounts", () => {
    expect(new Set(content.projectPeople.map((person) => person.id)).size).toBe(content.projectPeople.length);
    const motuo = getProjectView("ZDB-L008");
    expect(motuo.people).toHaveLength(10);
    expect(motuo.people.some((person) => person.name === "墨脱茶农及特色农业种植户")).toBe(false);
    expect(getProjectView("ZDB-L006").people.find((person) => person.name === "杜总")?.publicAccount)
      .toBe("寒浆子乐逍遥（抖音）");
  });

  it("retains empty source values instead of borrowing content from another project", () => {
    expect(getProjectView("ZDB-L001").quoteLines).toEqual([]);
    expect(getProjectView("ZDB-L012").people).toEqual([]);
    expect(getProjectView("ZDB-L009").project.localFeatures).toContain("红柳+肉苁蓉");
    expect(content.projects.find((project) => project.id === "HJ-014")?.coordinateNotes)
      .toContain("增加西双版纳的地理坐标");
  });

  it("recounts archived records and keeps people in other projects separate", () => {
    const data: ProjectContent = structuredClone(content);
    const person = data.projectPeople.find((person) => person.projectId === "HJ-008")!;
    person.recordStatus = "已归档";
    data.projectPeople.push({ ...person, id: "PR-other", projectId: "HJ-009", recordStatus: "在册" });
    const option = data.participationOptions.find((option) => option.projectId === "HJ-008")!;
    option.recordStatus = "已归档";
    const before = getProjectView("ZDB-L008");
    const after = getProjectView("ZDB-L008", data);
    expect(after.counts.objects).toBe(before.counts.objects - 1);
    expect(after.counts.participationRecords).toBe(before.counts.participationRecords - 1);
    expect(after.people.some((person) => person.id === "PR-other")).toBe(false);
  });

  it("refreshes the last four program descriptions and removes maintenance wording in display text", () => {
    expect(getProjectView("ZDB-L010").programText).toBe("《种地吧》S4第14—18期\n库存诊断、产品研发、助农直播与回访");
    expect(getProjectView("ZDB-L012").programText).toBe("《种地吧》S2爱侬日、S3全国联动及第40期直播培训");
    expect(getProjectView("ZDB-L013").programText).toBe("《种地吧》S4第29期");
    expect(getProjectView("ZDB-L014").programText).toBe("《种地吧》S4第21、30期");
    expect(getProjectView("ZDB-L013").project.program).toBe("数据库标记《种地吧》S4第29期；");
  });
});
