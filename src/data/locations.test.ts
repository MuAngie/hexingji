import { describe, expect, it } from "vitest";
import { actionFilters, filterLocations, locations } from "./projects";
import { latLngToMapPosition } from "./mapProjection";

describe("禾迹地点资料库", () => {
  it("includes all 14 workbook projects", () => {
    expect(filterLocations(locations, "全部")).toHaveLength(14);
  });

  it("filters locations by their documented node type", () => {
    expect(filterLocations(locations, "直接助农")).toHaveLength(9);
    expect(filterLocations(locations, "公众行动")).toHaveLength(4);
    expect(filterLocations(locations, "产业观察")).toHaveLength(1);
  });

  it("keeps the source coordinates for representative locations", () => {
    expect(
      locations.find((location) => location.id === "ZDB-L001")?.coordinates
    ).toEqual({ latitude: 38.6248, longitude: 103.0937 });
    expect(
      locations.find((location) => location.id === "ZDB-L010")?.coordinates
    ).toEqual({ latitude: 37.002, longitude: 80.801 });
  });

  it("keeps the project detail and source fields complete", () => {
    for (const location of locations) {
      expect(location.focusTargets, location.id).not.toBe("");
      expect(location.problem, location.id).not.toBe("");
      expect(location.action, location.id).not.toBe("");
      expect(location.participation, location.id).not.toBe("");
      expect(location.result, location.id).not.toBe("");
      expect(location.sources.length, location.id).toBeGreaterThan(0);
      expect(location.sourceNotes, location.id).not.toBe("");
    }
  });

  it("projects every documented coordinate inside the map canvas", () => {
    for (const location of locations) {
      const position = latLngToMapPosition(location.coordinates);

      expect(position.x, location.id).toBeGreaterThanOrEqual(0);
      expect(position.x, location.id).toBeLessThanOrEqual(100);
      expect(position.y, location.id).toBeGreaterThanOrEqual(0);
      expect(position.y, location.id).toBeLessThanOrEqual(100);
    }
  });

  it("keeps the documented filter labels available to the UI", () => {
    expect(actionFilters).toEqual(["全部", "直接助农", "公众行动", "产业观察"]);
  });

  it("identifies provisional anchors and keeps rubber research separate from direct support", () => {
    for (const id of ["ZDB-L012", "ZDB-L013", "ZDB-L014"]) {
      const location = locations.find((point) => point.id === id)!;
      expect(location.verificationStatus).toBe("partially_verified");
      expect(location.verificationNotes).toContain("非");
      expect(location.verificationDateLabel).toBe("资料口径");
    }
    expect(locations.find((point) => point.id === "ZDB-L014")?.nodeType)
      .toBe("industry_observation");
  });
});
