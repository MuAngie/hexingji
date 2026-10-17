"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Sprout,
  Wheat,
  X
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
  coordinateAccuracyLabels,
  filterLocations,
  type HejiLocation,
  impactStatusLabels,
  locations,
  nodeTypeLabels,
  verificationStatusLabels
} from "@/data/projects";
import { latLngToMapPosition } from "@/data/mapProjection";
import monthlyCropManifest from "../../public/markers/monthly-v2/manifest.json";

const directSupportCount = locations.filter(
  (location) => location.nodeType === "direct_support"
).length;
const publicActionCount = locations.filter(
  (location) => location.nodeType === "public_action"
).length;
const industryObservationCount = locations.filter(
  (location) => location.nodeType === "industry_observation"
).length;
const verifiedLocationCount = locations.filter(
  (location) => location.verificationStatus === "verified"
).length;

const mapStats = [
  ["助农与公益项目", String(locations.length)],
  ["直接助农", String(directSupportCount)],
  ["公众行动", String(publicActionCount)],
  ["产业观察", String(industryObservationCount)],
  ["已核验项目", String(verifiedLocationCount)]
];

function BrandBlock() {
  return (
    <div className="brand-block glass-surface fixed left-5 top-5 z-30 flex items-center gap-3 rounded-full px-4 py-3">
      <div className="grid size-11 place-items-center rounded-full bg-[#5f8f3e] text-[#fff8e8] shadow-inner">
        <Sprout size={24} strokeWidth={2.4} />
      </div>
      <div>
        <div className="text-xl font-semibold text-[#4a321d]">禾迹</div>
        <div className="text-xs text-[#7a603f]">
          把每一次奔赴，种进真实的土地里。
        </div>
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
  markerImageSrc,
  rotation,
  selected,
  onSelect
}: {
  location: HejiLocation;
  markerImageSrc: string | null;
  rotation: number;
  selected: boolean;
  onSelect: (location: HejiLocation) => void;
}) {
  const position = latLngToMapPosition(location.coordinates);
  const swayIndex = locations.findIndex((point) => point.id === location.id);
  const sharedCoordinate = locations.some(
    (point) => point.id !== location.id &&
      point.coordinates.latitude === location.coordinates.latitude &&
      point.coordinates.longitude === location.coordinates.longitude
  );

  return (
    <div
      className={`location-anchor ${
        selected ? "location-anchor-active" : ""
      }`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: "scale(var(--marker-inverse-scale, 1))",
        transformOrigin: "0 0",
        willChange: "transform"
      }}
    >
      <motion.button
        layout
        style={
          {
            "--compact-offset-x": `${sharedCoordinate
              ? Math.sign(location.compactOffset?.x ?? 0) * 12
              : (location.compactOffset?.x ?? 0) * 0.4}px`,
            "--compact-offset-y": `${sharedCoordinate
              ? 0
              : (location.compactOffset?.y ?? 0) * 0.4}px`,
            "--marker-root-offset": `${(monthlyCropManifest.anchor.y - 0.5) * 32}px`,
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
              width={32}
              height={32}
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

function StorySection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="story-detail">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}

function LocationStoryCard({
  location,
  onShowDetails
}: {
  location: HejiLocation;
  onShowDetails: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="story-card-overlay glass-surface"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="story-card-header">
        <div className="min-w-0">
          <div className="flex items-start gap-2 text-lg font-bold leading-6 text-[#4a321d]">
            <Wheat size={19} className="text-[#d5a333]" />
            <span>{location.name}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="type-pill">
              {nodeTypeLabels[location.nodeType]}
            </span>
          </div>
        </div>
        <MapPin className="mt-1 text-[#6f9b4b]" size={24} />
      </div>
      <div className="story-card-scroll">
        <StorySection title="面对的问题">{location.problem}</StorySection>
        <StorySection title="参与方式">{location.participation}</StorySection>
        <StorySection title="关注对象">
          {location.focusTargets}
        </StorySection>
      </div>

      <div className="story-card-footer">
        <button className="story-more-button" onClick={onShowDetails}>
          查看完整资料 <ChevronRight size={16} />
        </button>
        <button className="primary-button">记录我的禾迹</button>
      </div>
    </motion.div>
  );
}

function LocationDetailSheet({
  location,
  onClose
}: {
  location: HejiLocation;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="project-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${location.name}完整资料`}
        className="project-detail-sheet glass-surface"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="project-detail-heading">
          <div>
            <div className="project-detail-eyebrow">项目资料 · {location.id}</div>
            <h2>{location.name}</h2>
          </div>
          <button className="project-detail-close" onClick={onClose} aria-label="关闭完整资料">
            <X size={20} />
          </button>
        </div>
        <div className="project-detail-scroll">
          <div className="project-detail-meta">
            <div className="flex flex-wrap gap-1.5">
              <span className="type-pill">{nodeTypeLabels[location.nodeType]}</span>
              <span className="type-pill">{coordinateAccuracyLabels[location.coordinateAccuracy]}</span>
              <span className="type-pill">{verificationStatusLabels[location.verificationStatus]}</span>
            </div>
            <p>{location.region}</p>
            <div className="project-detail-coordinates">
              <span>坐标 {location.coordinates.latitude.toFixed(5)}, {location.coordinates.longitude.toFixed(5)}</span>
              <span>{location.verificationDateLabel ?? "最近核验"} {location.lastVerified}</span>
            </div>
          </div>
          <StorySection title="节目节点">{location.program}</StorySection>
          <StorySection title="关注对象">
            {location.focusTargets}
          </StorySection>
          <StorySection title="面对的问题">{location.problem}</StorySection>
          <StorySection title="十个勤天做了什么">{location.action}</StorySection>
          <StorySection title="参与方式">{location.participation}</StorySection>
          {location.quote ? (
            <StorySection title="金句文案">{location.quote}</StorySection>
          ) : null}
          <StorySection title="当前状态与后续结果">{location.result}</StorySection>
          {location.verificationNotes ? (
            <StorySection title="核验说明">{location.verificationNotes}</StorySection>
          ) : null}
          <div className="story-sources">
            <h3>资料来源</h3>
            <div className="flex flex-wrap gap-2">
              {location.sources.map((source) => (
                <a
                  key={source.url}
                  className="source-link"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.label}
                  <ExternalLink size={12} />
                </a>
              ))}
            </div>
          </div>
          <StorySection title="来源与核验记录">{location.sourceNotes}</StorySection>
          <p className="project-detail-status">
            {verificationStatusLabels[location.verificationStatus]} · {impactStatusLabels[location.impactStatus]}
          </p>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function FilterBar({
  active,
  onChange
}: {
  active: ActionFilter;
  onChange: (filter: ActionFilter) => void;
}) {
  return (
    <div className="glass-surface fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-full p-2">
      {actionFilters.map((filter) => (
        <button
          key={filter}
          className={`filter-chip ${active === filter ? "filter-chip-active" : ""}`}
          onClick={() => onChange(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function PersonalCard() {
  return (
    <div className="glass-surface fixed bottom-6 left-5 z-30 w-60 rounded-[24px] p-4">
      <div className="text-base font-bold text-[#4a321d]">助农地图资料库</div>
      <div className="mt-1 text-xs text-[#7a603f]">
        《种地吧》项目汇总 · v3
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["项目地点", String(locations.length)],
          ["直接助农", String(directSupportCount)],
          ["公众行动", String(publicActionCount)]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white/20 px-2 py-3">
            <div className="text-lg font-bold text-[#4f8b3f]">{value}</div>
            <div className="mt-1 text-[11px] text-[#7a603f]">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-[#7a603f]">
        产业观察 {industryObservationCount} 项
      </div>
      <div className="mt-4 rounded-full bg-white/20 px-3 py-2 text-center text-xs font-bold text-[#7a603f]">
        WGS-84 · 表格同步于 2026-10-14
      </div>
    </div>
  );
}

function MapControls({
  rotation,
  setRotation
}: {
  rotation: number;
  setRotation: (rotation: number) => void;
}) {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="glass-surface fixed bottom-6 right-5 z-30 grid gap-2 rounded-[24px] p-2">
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
      <button
        className="control-button"
        aria-label="向左旋转"
        onClick={() => setRotation(rotation - 12)}
      >
        <RotateCcw size={19} />
      </button>
      <button
        className="control-button"
        aria-label="向右旋转"
        onClick={() => setRotation(rotation + 12)}
      >
        <RotateCw size={19} />
      </button>
    </div>
  );
}

export function HejiMapApp() {
  const [activeFilter, setActiveFilter] = useState<ActionFilter>("全部");
  const [markerImageSrc, setMarkerImageSrc] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<HejiLocation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rotation, setRotation] = useState(0);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const mapScaleRef = useRef(1);

  const visibleLocations = useMemo(
    () => filterLocations(locations, activeFilter),
    [activeFilter]
  );

  useEffect(() => {
    const month = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Shanghai",
      month: "numeric"
    }).format(new Date()));
    setMarkerImageSrc(`/markers/monthly-v2/${monthlyCropManifest.months[month - 1].png}`);
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
        initialScale={1}
        minScale={0.8}
        maxScale={6}
        centerOnInit
        smooth
        onTransform={(_ref, state) => {
          mapScaleRef.current = state.scale;
          mapStageRef.current?.style.setProperty(
            "--marker-inverse-scale",
            String(1 / state.scale)
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
                    markerImageSrc={markerImageSrc}
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
        <MapControls rotation={rotation} setRotation={setRotation} />
      </TransformWrapper>

      <BrandBlock />
      <TopActions />
      <AnimatePresence>
        {selectedLocation && !showDetails &&
        visibleLocations.some(
          (location) => location.id === selectedLocation.id
        ) ? (
          <LocationStoryCard
            key={selectedLocation.id}
            location={selectedLocation}
            onShowDetails={() => setShowDetails(true)}
          />
        ) : null}
      </AnimatePresence>
      <PersonalCard />
      <FilterBar active={activeFilter} onChange={(filter) => {
        setActiveFilter(filter);
        setSelectedLocation(null);
        setShowDetails(false);
      }} />
      <AnimatePresence>
        {selectedLocation && showDetails ? (
          <LocationDetailSheet
            key={selectedLocation.id}
            location={selectedLocation}
            onClose={() => setShowDetails(false)}
          />
        ) : null}
      </AnimatePresence>
    </main>
  );
}
