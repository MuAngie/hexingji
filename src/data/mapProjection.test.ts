import { describe, expect, it } from "vitest";
import { latLngToMapPosition } from "./mapProjection";

describe("禾迹底图经纬度校准", () => {
  it.each([
    ["杭州", 30.2741, 120.1551, 71.54, 54.13],
    ["拉萨", 29.6604, 91.1322, 30.23, 55.44],
    ["哈尔滨", 45.756, 126.6424, 74.73, 26.87]
  ])(
    "places %s near its labeled position",
    (_name, latitude, longitude, expectedX, expectedY) => {
      const position = latLngToMapPosition({ latitude, longitude });

      expect(position.x).toBeCloseTo(expectedX, 0);
      expect(position.y).toBeCloseTo(expectedY, 0);
    }
  );
});
