import type { CSSProperties } from 'react';

export type IconName =
  | 'search'
  | 'heart'
  | 'arrow'
  | 'pin'
  | 'chevron'
  | 'filter'
  | 'grid'
  | 'apartment'
  | 'loft'
  | 'house'
  | 'bed'
  | 'area'
  | 'close'
  | 'check'
  | 'leaf'
  | 'sun'
  | 'key'
  | 'bath'
  | 'back';

const paths: Record<IconName, React.ReactNode> = {
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  heart: (
    <path d="M20.8 5.7a5.3 5.3 0 0 0-7.5 0L12 7l-1.3-1.3a5.3 5.3 0 0 0-7.5 7.5L12 22l8.8-8.8a5.3 5.3 0 0 0 0-7.5Z" />
  ),
  arrow: (
    <>
      <path d="M4 12h15M13 5l7 7-7 7" />
    </>
  ),
  back: (
    <>
      <path d="M20 12H5m6-7-7 7 7 7" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  filter: (
    <>
      <path d="M4 7h7m4 0h5M4 17h3m4 0h9" />
      <circle cx="13" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  apartment: (
    <>
      <path d="M5 21V4h14v17M3 21h18M9 8h1m4 0h1M9 12h1m4 0h1m-5 9v-5h4v5" />
    </>
  ),
  loft: (
    <>
      <path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8M7 10h10" />
    </>
  ),
  house: (
    <>
      <path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V8m18 10V8M3 14h18M3 19v2m18-2v2M5 14V7h14v7M7 11h3m4 0h3" />
    </>
  ),
  area: (
    <>
      <path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6M8 8h8v8H8z" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  leaf: (
    <>
      <path d="M20 3C8 3 3 8 5 15c7 5 15-1 15-12ZM4 21l11-11" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="5" />
      <path d="m12 12 9 9m-4-4 3-3m-6 0 3-3" />
    </>
  ),
  bath: (
    <>
      <path d="M3 12h18M5 12V5a3 3 0 0 1 6 0M4 12v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4M7 20v2m10-2v2" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className = '',
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 42 42" fill="none">
      <path
        d="m5 13 8-7 8 7m1 0 8-7 8 7M6 19v15h14V19m2 0v15h14V19"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
