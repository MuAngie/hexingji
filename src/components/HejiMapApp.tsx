"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  HelpCircle,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Search
} from "lucide-react";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  TransformComponent,
  TransformWrapper,
  useControls
} from "react-zoom-pan-pinch";
import {
  actionFilters,
  type ActionFilter,
  filterLocations,
  type HejiLocation,
  locations
} from "@/data/projects";
import { latLngToMapPosition } from "@/data/mapProjection";
import monthlyCropManifest from "../../public/markers/monthly-v2/manifest.json";
import { ProjectDetail, ProjectStoryCard } from "./ProjectContent";

type MonthlyCrop = (typeof monthlyCropManifest.months)[number];
const initialMapScale = 1.4;

const mapStats = [
  ["助农与公益项目", String(locations.length)],
  ...actionFilters.filter((filter) => filter !== "全部")
    .map((filter) => [filter, String(filterLocations(locations, filter).length)])
];

function BrandBlock() {
  return (
    <div className="brand-block fixed left-5 top-5 z-30">
      <div className="brand-title text-xl font-semibold text-[#4a321d]">禾迹</div>
      <div className="brand-tagline mt-1 text-xs text-[#7a603f]">
        把每一次奔赴，种进真实的土地里。
      </div>
    </div>
  );
}

function TopActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="top-actions fixed right-5 top-5 z-40 flex items-start gap-3">
      <button className="icon-button" aria-label="搜索">
        <Search size={20} />
      </button>
      <div className="relative">
        <button
          className="icon-button"
          aria-label="地图说明"
          onClick={() => setOpen((value) => !value)}
        >
          <HelpCircle size={20} />
        </button>
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="glass-surface absolute right-0 mt-3 w-64 rounded-[22px] p-4"
            >
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#4a321d]">
                <MapPin size={16} />
                地图行动概况
              </div>
              <div className="grid gap-2">
                {mapStats.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl bg-white/20 px-3 py-2"
                  >
                    <span className="text-xs text-[#7a603f]">{label}</span>
                    <span className="font-semibold text-[#4f8b3f]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <button className="primary-button">记录我的禾迹</button>
    </div>
  );
}

function MapIllustration() {
  return (
    <img
      src="/maps/china-surroundings-6000.jpg"
      alt="中国和周边地区地形地图"
      className="map-basemap absolute inset-0 size-full select-none object-cover"
      draggable={false}
    />
  );
}
function LocationMarker({
  location,
  markerCrop,
  rotation,
  selected,
  onSelect
}: {
  location: HejiLocation;
  markerCrop: MonthlyCrop | null;
  rotation: number;
  selected: boolean;
  onSelect: (location: HejiLocation) => void;
}) {
  const markerImageSize = Math.max(64, 32 / (markerCrop?.heightRatio ?? 1));
  const markerVisibleHeight = markerImageSize * (markerCrop?.heightRatio ?? 1);
  const markerImageSrc = markerCrop ? `/markers/monthly-v2/${markerCrop.png}` : null;
  const position = latLngToMapPosition(location.displayCoordinates);
  const swayIndex = locations.findIndex((point) => point.id === location.id);
  const sharedCoordinate = locations.some(
    (point) => point.id !== location.id &&
      point.displayCoordinates.latitude === location.displayCoordinates.latitude &&
      point.displayCoordinates.longitude === location.displayCoordinates.longitude
  );

  return (
    <div
      className={`location-anchor ${
        selected ? "location-anchor-active" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "scale(calc(var(--marker-inverse-scale, 1) * var(--marker-zoom-scale, 1)))",
        transformOrigin: "0 0",
        willChange: "transform"
      }}
    >
      <motion.button
        layout
        style={
          {
            "--marker-size": `${markerImageSize}px`,
            "--marker-visible-height": `${markerVisibleHeight}px`,
            "--marker-image-anchor": `${monthlyCropManifest.anchor.y * 100}%`,
            "--compact-offset-x": `${sharedCoordinate
              ? Math.sign(location.compactOffset?.x ?? 0) * 12
              : (location.compactOffset?.x ?? 0) * 0.4}px`,
            "--compact-offset-y": `${sharedCoordinate
              ? 0
              : (location.compactOffset?.y ?? 0) * 0.4}px`,
            "--marker-root-offset": `${markerVisibleHeight / 2}px`,
            "--sway-duration": `${4.8 + (swayIndex % 4) * 0.45}s`,
            "--sway-delay": `${-swayIndex * 0.63}s`
          } as CSSProperties
        }
        initial={{ opacity: 0, scale: 0.88, rotate: -rotation }}
        animate={{ opacity: 1, scale: 1, rotate: -rotation }}
        exit={{ opacity: 0, scale: 0.88, rotate: -rotation }}
        whileHover={{ y: -4 }}
        className={`location-marker location-marker-${location.nodeType} ${
          selected ? "location-marker-active" : ""
        }`}
        data-shared-coordinate={sharedCoordinate || undefined}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(location);
        }}
      >
        <span className="marker-pin">
          {markerImageSrc ? (
            <img
              src={markerImageSrc}
              width={markerImageSize}
              height={markerImageSize}
              alt=""
              aria-hidden="true"
              draggable={false}
            />
          ) : null}
        </span>
        <span className="marker-label">{location.mapLabel}</span>
      </motion.button>
    </div>
  );
}

function FilterBar({
  active,
  onChange
}: {
  active: ActionFilter;
  onChange: (filter: ActionFilter) => void;
}) {
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = barRef.current!;
    const updateHeight = () => {
      bar.closest("main")?.style.setProperty("--filter-bar-height", `${bar.offsetHeight}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <nav ref={barRef} aria-label="按参与方式筛选项目" className="map-filter-bar glass-surface" style={{ "--filter-count": actionFilters.length } as CSSProperties}>
      {actionFilters.map((filter) => (
        <button
          key={filter}
          className={`filter-chip ${active === filter ? "filter-chip-active" : ""}`}
          aria-pressed={active === filter}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </nav>
  );
}

function MapControls({
  setRotation
}: {
  setRotation: (rotation: number) => void;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="map-controls glass-surface fixed right-5 z-30 grid gap-2 rounded-[24px] p-2">
      <button
        className="control-button"
        aria-label="放大"
        onClick={() => zoomIn(0.22, 320, "easeInOutCubic")}
      >
        <Plus size={19} />
      </button>
      <button
        className="control-button"
        aria-label="缩小"
        onClick={() => zoomOut(0.22, 320, "easeInOutCubic")}
      >
        <Minus size={19} />
      </button>
      <button
        className="control-button"
        aria-label="重置视角"
        onClick={() => {
          resetTransform(360, "easeInOutCubic");
          setRotation(0);
        }}
      >
        <RotateCcw size={19} />
      </button>
    </div>
  );
}

export function HejiMapApp() {
  const [activeFilter, setActiveFilter] = useState<ActionFilter>("全部");
  const [markerCrop, setMarkerCrop] = useState<MonthlyCrop | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<HejiLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rotation, setRotation] = useState(0);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapScaleRef = useRef(initialMapScale);

  const visibleLocations = useMemo(
    () => filterLocations(locations, activeFilter),
    [activeFilter]
  );

  useEffect(() => {
    const month = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      month: "numeric"
    }).format(new Date()));
    setMarkerCrop(monthlyCropManifest.months[month - 1]);
  }, []);

  useEffect(() => {
    if (!showDetails) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowDetails(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDetails]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[var(--map-background)] text-[#4a321d]">
      <TransformWrapper
        initialScale={initialMapScale}
        minScale={0.8}
        maxScale={24}
        centerOnInit
        smooth
        onTransform={(_ref, state) => {
          mapScaleRef.current = state.scale;
          mapStageRef.current?.style.setProperty(
            "--marker-inverse-scale",
            String(1 / state.scale)
          );
          mapStageRef.current?.style.setProperty(
            "--marker-zoom-scale",
            String(Math.min(1.5, Math.max(1, Math.sqrt(state.scale))))
          );
          if (mapStageRef.current) {
            mapStageRef.current.dataset.markerOffsets =
              state.scale < 1.6 ? "spread" : "exact";
          }
        }}
        wheel={{ step: 0.0035 }}
        pinch={{ step: 4 }}
        zoomAnimation={{
          size: 0.12,
          animationTime: 260,
          animationType: "easeOutCubic"
        }}
        panning={{
          velocityDisabled: false,
          excluded: ["location-anchor"]
        }}
        doubleClick={{ disabled: true }}
      >
        <div className="h-full w-full" onClick={() => {
          setSelectedLocation(null);
          setShowDetails(false);
        }}>
          <TransformComponent
            wrapperClass="!h-full !w-full"
          >
            <motion.div
              ref={mapStageRef}
              style={{
                "--marker-inverse-scale": 1 / initialMapScale,
                "--marker-zoom-scale": Math.sqrt(initialMapScale)
              } as CSSProperties}
              data-marker-density="compact"
              data-marker-offsets={
                mapScaleRef.current < 1.6 ? "spread" : "exact"
              }
              className="relative size-[100vmin] shrink-0 origin-center"
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            >
              <MapIllustration />
              <AnimatePresence>
                {visibleLocations.map((location) => (
                  <LocationMarker
                    key={location.id}
                    location={location}
                    markerCrop={markerCrop}
                    rotation={rotation}
                    selected={selectedLocation?.id === location.id}
                    onSelect={(location) => {
                      setSelectedLocation(location);
                      setShowDetails(false);
                    }}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </TransformComponent>
        </div>
        <MapControls setRotation={setRotation} />
      </TransformWrapper>

      <BrandBlock />
      <TopActions />
      <AnimatePresence>
        {selectedLocation && !showDetails &&
        visibleLocations.some(
          (location) => location.id === selectedLocation.id
        ) ? (
          <ProjectStoryCard
            key={selectedLocation.id}
            location={selectedLocation}
            onShowDetails={() => setShowDetails(true)}
            onClose={() => setSelectedLocation(null)}
          />
        ) : null}
      </AnimatePresence>
      <FilterBar active={activeFilter} onChange={(filter) => {
        setActiveFilter(filter);
        setSelectedLocation(null);
        setShowDetails(false);
      }} />
      <AnimatePresence>
        {selectedLocation && showDetails ? (
          <ProjectDetail
            key={selectedLocation.id}
            location={selectedLocation}
            onClose={() => setShowDetails(false)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}
