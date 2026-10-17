export type GeoCoordinates = {
  latitude: number;
  longitude: number;
};

export type MapPosition = {
  x: number;
  y: number;
};

const MAP_SIZE_PX = 12000;
const DEGREES_TO_RADIANS = Math.PI / 180;

// The source artwork was calibrated against 23 labeled cities on the map.
const STANDARD_PARALLEL_1 = 25 * DEGREES_TO_RADIANS;
const STANDARD_PARALLEL_2 = 47 * DEGREES_TO_RADIANS;
const CENTRAL_MERIDIAN = 105 * DEGREES_TO_RADIANS;
const PROJECTION_N =
  (Math.sin(STANDARD_PARALLEL_1) + Math.sin(STANDARD_PARALLEL_2)) / 2;
const PROJECTION_C =
  Math.cos(STANDARD_PARALLEL_1) ** 2 +
  2 * PROJECTION_N * Math.sin(STANDARD_PARALLEL_1);
const ORIGIN_RHO = Math.sqrt(PROJECTION_C) / PROJECTION_N;

const X_SCALE = 11465.575718998523;
const X_SKEW = 10.014984658313551;
const X_OFFSET = 5995.6754702259;
const Y_SKEW = 0.40394171577463567;
const Y_SCALE = -11409.890430993219;
const Y_OFFSET = 12451.389608397714;

export function latLngToMapPosition({
  latitude,
  longitude
}: GeoCoordinates): MapPosition {
  const latitudeRadians = latitude * DEGREES_TO_RADIANS;
  const longitudeRadians = longitude * DEGREES_TO_RADIANS;
  const rho =
    Math.sqrt(
      PROJECTION_C - 2 * PROJECTION_N * Math.sin(latitudeRadians)
    ) / PROJECTION_N;
  const theta = PROJECTION_N * (longitudeRadians - CENTRAL_MERIDIAN);
  const projectedX = rho * Math.sin(theta);
  const projectedY = ORIGIN_RHO - rho * Math.cos(theta);
  const pixelX = X_SCALE * projectedX + X_SKEW * projectedY + X_OFFSET;
  const pixelY = Y_SKEW * projectedX + Y_SCALE * projectedY + Y_OFFSET;

  return {
    x: (pixelX / MAP_SIZE_PX) * 100,
    y: (pixelY / MAP_SIZE_PX) * 100
  };
}
