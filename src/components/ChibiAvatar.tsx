const palettes = [
  { background: "oklch(93% 0.035 140)", clothes: "oklch(63% 0.085 140)", hair: "oklch(35% 0.035 65)" },
  { background: "oklch(94% 0.045 85)", clothes: "oklch(73% 0.095 85)", hair: "oklch(43% 0.045 60)" },
  { background: "oklch(93% 0.025 220)", clothes: "oklch(65% 0.06 220)", hair: "oklch(33% 0.025 70)" },
  { background: "oklch(93% 0.035 40)", clothes: "oklch(70% 0.075 40)", hair: "oklch(40% 0.04 55)" },
  { background: "oklch(93% 0.025 300)", clothes: "oklch(68% 0.055 300)", hair: "oklch(36% 0.025 60)" }
];
const skinTones = ["oklch(88% 0.055 65)", "oklch(81% 0.065 60)", "oklch(74% 0.07 58)"];
const hairstyles = [
  "M25 39C20 20 34 11 49 14C66 11 78 25 71 40L65 30L55 34L48 27L38 34L30 31Z",
  "M25 39C20 31 24 20 33 20C35 12 46 10 52 16C62 11 74 20 71 30L72 40L64 32L53 30L43 33L33 30Z",
  "M25 39C21 22 32 12 48 14C65 11 77 24 71 40L65 29C57 35 44 33 39 27L30 33Z"
];

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function Figure({ seed }: { seed: number }) {
  const palette = palettes[seed % palettes.length];
  const skin = skinTones[(seed >>> 4) % skinTones.length];
  const smilingEyes = (seed >>> 8) % 3 === 0;
  return <>
    <path d="M17 96V88C17 73 31 67 48 67S79 73 79 88V96Z" fill={palette.clothes} />
    <path d="M40 67L48 76L56 67" fill="none" stroke="oklch(96% 0.015 85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="24" cy="44" r="6" fill={skin} /><circle cx="72" cy="44" r="6" fill={skin} />
    <rect x="25" y="18" width="46" height="49" rx="22" fill={skin} />
    <path d={hairstyles[(seed >>> 6) % hairstyles.length]} fill={palette.hair} />
    <g fill="oklch(30% 0.025 60)" stroke="oklch(30% 0.025 60)" strokeWidth="2.3" strokeLinecap="round">
      {smilingEyes ? <><path d="M35 45Q39 40 43 45" fill="none" /><path d="M53 45Q57 40 61 45" fill="none" /></> :
        <><ellipse cx="39" cy="44" rx="1.6" ry="2" stroke="none" /><ellipse cx="57" cy="44" rx="1.6" ry="2" stroke="none" /></>}
      <path d="M43 54Q48 59 53 54" fill="none" strokeWidth="1.8" />
    </g>
    <ellipse cx="33" cy="51" rx="4" ry="2.3" fill="oklch(72% 0.1 35)" opacity="0.35" />
    <ellipse cx="63" cy="51" rx="4" ry="2.3" fill="oklch(72% 0.1 35)" opacity="0.35" />
    {(seed >>> 10) % 4 === 0 ? <g fill="none" stroke={palette.hair} strokeWidth="1.3">
      <rect x="32" y="38" width="14" height="12" rx="5" /><rect x="50" y="38" width="14" height="12" rx="5" /><path d="M46 43H50" />
    </g> : null}
  </>;
}

export function ChibiAvatar({ seed, group = false }: { seed: string; group?: boolean }) {
  const value = hashSeed(seed);
  return <svg className="motuo-person-avatar" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
    <circle cx="48" cy="48" r="48" fill={palettes[value % palettes.length].background} />
    {group ? <>
      <g transform="translate(-8 19) scale(.7)"><Figure seed={hashSeed(`${seed}-left`)} /></g>
      <g transform="translate(40 19) scale(.7)"><Figure seed={hashSeed(`${seed}-right`)} /></g>
      <g transform="translate(12 3) scale(.76)"><Figure seed={value} /></g>
    </> : <Figure seed={value} />}
  </svg>;
}
