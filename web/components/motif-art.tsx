import type { MotifVariant } from "@/lib/types";

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

type MotifArtProps = {
  id: string;
  variant: MotifVariant;
  colors: [string, string, string?];
  className?: string;
  seamless?: boolean;
};

export function MotifArt({ id, variant, colors, className = "", seamless = false }: MotifArtProps) {
  const key = safeId(id);
  const [primary, secondary, accent = "#d49a58"] = colors;
  const tile = seamless ? 112 : 150;

  if (variant === "mega-mendung") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Mega Mendung">
        <defs>
          <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={primary} />
            <stop offset="1" stopColor={accent} stopOpacity=".58" />
          </linearGradient>
          <pattern id={`cloud-${key}`} width={seamless ? 220 : 320} height={seamless ? 150 : 220} patternUnits="userSpaceOnUse">
            <g fill="none" stroke={secondary} strokeLinecap="round">
              <path d="M18 92c26-33 61-35 87-8 34-49 93-49 124-4 24-20 59-11 70 17-34-8-61 5-78 28H35C30 112 24 101 18 92Z" strokeWidth="8" opacity=".95" />
              <path d="M38 102c24-22 48-22 68-4 35-38 89-36 116 3 18-12 39-10 55 5" strokeWidth="5" opacity=".55" />
              <path d="M62 116c19-13 37-13 54-2 35-27 74-25 99 3 17-9 33-8 45 2" strokeWidth="3" opacity=".34" />
            </g>
          </pattern>
        </defs>
        <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
        <rect width="640" height="420" rx="32" fill={`url(#cloud-${key})`} />
        <path d="M0 355c112-36 195-13 289 10 123 30 232 12 351-30v85H0Z" fill={primary} opacity=".64" />
      </svg>
    );
  }

  if (variant === "buketan") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Buketan">
        <defs>
          <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={primary} />
            <stop offset="1" stopColor={secondary} />
          </linearGradient>
          <pattern id={`floral-${key}`} width={seamless ? 170 : 235} height={seamless ? 170 : 235} patternUnits="userSpaceOnUse">
            <g transform="translate(112 120)">
              <path d="M0 70C-8 25-40-5-73-42M-3 66C16 31 45 8 77-31" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
              <g stroke={accent} strokeWidth="3">
                {[0,72,144,216,288].map((degree) => (
                  <ellipse key={degree} rx="17" ry="31" transform={`rotate(${degree}) translate(0 -21)`} fill="#fff8e8" />
                ))}
                <circle r="9" fill={accent} />
              </g>
              <path d="M-26 31c-25-5-39 2-52 21 25 3 41-3 52-21Z" fill="#f5ead8" stroke={accent} strokeWidth="3" />
              <path d="M27 28c22-11 40-8 57 6-22 12-40 10-57-6Z" fill="#f5ead8" stroke={accent} strokeWidth="3" />
            </g>
          </pattern>
        </defs>
        <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
        <rect width="640" height="420" rx="32" fill={`url(#floral-${key})`} />
      </svg>
    );
  }

  if (variant === "kawung") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Kawung">
        <defs>
          <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={primary} />
            <stop offset="1" stopColor={accent} stopOpacity=".72" />
          </linearGradient>
          <pattern id={`kawung-${key}`} width={tile} height={tile} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <g transform={`translate(${tile / 2} ${tile / 2})`} fill="none" stroke={secondary} strokeWidth="5">
              <ellipse rx={tile * .17} ry={tile * .38} transform={`translate(0 ${-tile * .22})`} />
              <ellipse rx={tile * .17} ry={tile * .38} transform={`rotate(90) translate(0 ${-tile * .22})`} />
              <ellipse rx={tile * .17} ry={tile * .38} transform={`rotate(180) translate(0 ${-tile * .22})`} />
              <ellipse rx={tile * .17} ry={tile * .38} transform={`rotate(270) translate(0 ${-tile * .22})`} />
              <circle r={tile * .07} fill={accent} stroke="none" />
            </g>
          </pattern>
        </defs>
        <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
        <rect width="640" height="420" rx="32" fill={`url(#kawung-${key})`} />
      </svg>
    );
  }

  if (variant === "parang") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Parang">
        <defs>
          <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={primary} />
            <stop offset="1" stopColor={accent} stopOpacity=".7" />
          </linearGradient>
          <pattern id={`parang-${key}`} width={seamless ? 118 : 150} height={seamless ? 118 : 150} patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <path d="M-20 35C20-10 65-10 105 35s85 45 125 0" fill="none" stroke={secondary} strokeWidth="18" strokeLinecap="round" />
            <path d="M-20 35C20-10 65-10 105 35s85 45 125 0" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" />
            <circle cx="52" cy="34" r="10" fill={primary} stroke={secondary} strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
        <rect width="640" height="420" rx="32" fill={`url(#parang-${key})`} />
      </svg>
    );
  }

  if (variant === "sekar-jagad") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Sekar Jagad">
        <defs>
          <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={primary} />
            <stop offset="1" stopColor={secondary} />
          </linearGradient>
          <pattern id={`sekar-${key}`} width={seamless ? 190 : 245} height={seamless ? 180 : 225} patternUnits="userSpaceOnUse">
            <path d="M17 95C31 31 75 10 124 35c36-31 94-15 105 28 30 18 22 69-9 84-14 47-77 54-106 20-42 22-101-10-97-72Z" fill={accent} fillOpacity=".48" stroke="#fff4dc" strokeWidth="6" />
            <path d="M44 99c31-29 59-33 92-7 25-23 49-22 71 1" fill="none" stroke="#fff4dc" strokeWidth="5" strokeLinecap="round" />
            <circle cx="76" cy="69" r="14" fill={secondary} stroke="#fff4dc" strokeWidth="4" />
            <circle cx="169" cy="127" r="11" fill={primary} stroke="#fff4dc" strokeWidth="4" />
          </pattern>
        </defs>
        <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
        <rect width="640" height="420" rx="32" fill={`url(#sekar-${key})`} />
      </svg>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 640 420" className={className} role="img" aria-label="Motif Ceplok">
      <defs>
        <linearGradient id={`bg-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={primary} />
          <stop offset="1" stopColor={accent} stopOpacity=".72" />
        </linearGradient>
        <pattern id={`ceplok-${key}`} width={tile} height={tile} patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <g transform={`translate(${tile / 2} ${tile / 2})`} fill="none" stroke={secondary} strokeWidth="5">
            <circle r={tile * .31} opacity=".94" />
            <path d={`M0 ${-tile*.41} ${tile*.12} ${-tile*.17} ${tile*.39} ${-tile*.13} ${tile*.19} ${tile*.05} ${tile*.24} ${tile*.33} 0 ${tile*.2} ${-tile*.24} ${tile*.33} ${-tile*.19} ${tile*.05} ${-tile*.39} ${-tile*.13} ${-tile*.12} ${-tile*.17}Z`} />
            <circle r={tile * .11} fill={accent} stroke="none" />
          </g>
        </pattern>
      </defs>
      <rect width="640" height="420" rx="32" fill={`url(#bg-${key})`} />
      <rect width="640" height="420" rx="32" fill={`url(#ceplok-${key})`} />
    </svg>
  );
}

export function GarmentPreview({ id, variant, colors, className = "" }: MotifArtProps) {
  const key = safeId(`${id}-garment`);
  return (
    <svg width="100%" height="100%" viewBox="0 0 640 520" className={className} role="img" aria-label="Preview motif pada pakaian">
      <defs>
        <clipPath id={`shirt-${key}`}>
          <path d="M226 85 283 55h74l57 30 104 56-54 91-57-29v255H233V203l-57 29-54-91 104-56Z" />
        </clipPath>
      </defs>
      <rect width="640" height="520" rx="36" fill="#111214" />
      <g clipPath={`url(#shirt-${key})`}>
        <MotifArt id={`${key}-pattern`} variant={variant} colors={colors} className="h-full w-full" seamless />
      </g>
      <path d="M226 85 283 55h74l57 30 104 56-54 91-57-29v255H233V203l-57 29-54-91 104-56Z" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="5" />
      <path d="M283 56c11 44 63 44 74 0" fill="#111214" stroke="#fff" strokeOpacity=".4" strokeWidth="4" />
      <ellipse cx="320" cy="478" rx="155" ry="17" fill="#000" opacity=".45" />
    </svg>
  );
}

export function HumanPreview({ id, variant, colors, className = "", animated = false }: MotifArtProps & { animated?: boolean }) {
  const key = safeId(`${id}-human`);
  return (
    <svg width="100%" height="100%" viewBox="0 0 640 640" className={`${className} ${animated ? "model-motion" : ""}`} role="img" aria-label="Visualisasi model manusia memakai batik">
      <defs>
        <clipPath id={`body-${key}`}>
          <path d="M224 213c27-28 62-43 96-43s69 15 96 43l71 78-54 55-41-43v218H248V303l-41 43-54-55 71-78Z" />
        </clipPath>
        <linearGradient id={`skin-${key}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e2b189" />
          <stop offset="1" stopColor="#ad745b" />
        </linearGradient>
      </defs>
      <rect width="640" height="640" rx="36" fill="#101113" />
      <circle cx="320" cy="113" r="62" fill={`url(#skin-${key})`} />
      <path d="M261 102c8-63 105-87 123-14 5 20-2 43-13 58-5-36-17-58-48-66-18 24-39 34-62 36Z" fill="#1d1817" />
      <rect x="292" y="158" width="56" height="49" rx="18" fill={`url(#skin-${key})`} />
      <g clipPath={`url(#body-${key})`}>
        <MotifArt id={`${key}-pattern`} variant={variant} colors={colors} className="h-full w-full" seamless />
      </g>
      <path d="M224 213c27-28 62-43 96-43s69 15 96 43l71 78-54 55-41-43v218H248V303l-41 43-54-55 71-78Z" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="5" />
      <path d="M248 521h67v92h-86l19-92Zm77 0h67l19 92h-86v-92Z" fill="#24262b" />
      <ellipse cx="320" cy="618" rx="145" ry="15" fill="#000" opacity=".5" />
    </svg>
  );
}
