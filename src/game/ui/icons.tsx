type P = { size?: number; color?: string }

export const StarIcon = ({ size = 20, color = '#f7c948' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2.6l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.5 6.4 19.6l1.3-6.2L3 9.1l6.3-.7z" fill={color} stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)
export const HeartIcon = ({ size = 20, color = '#f27aa6' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 20.5C5.2 15.8 2.5 12.4 2.5 8.8 2.5 6 4.6 4 7.2 4c1.8 0 3.5 1 4.8 2.8C13.3 5 15 4 16.8 4c2.6 0 4.7 2 4.7 4.8 0 3.6-2.7 7-9.5 11.7z" fill={color} />
  </svg>
)
export const PawIcon = ({ size = 20, color = '#f27aa6' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={color}>
    <ellipse cx="12" cy="15.5" rx="5" ry="4.2" />
    <circle cx="6" cy="10" r="2.2" />
    <circle cx="9.5" cy="6.3" r="2.2" />
    <circle cx="14.5" cy="6.3" r="2.2" />
    <circle cx="18" cy="10" r="2.2" />
  </svg>
)
export const MapIcon = ({ size = 22, color = 'currentColor' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round">
    <path d="M3.5 6.5l5-2.5 7 2.5 5-2.5v13.5l-5 2.5-7-2.5-5 2.5z" />
    <path d="M8.5 4v13.5M15.5 6.5V20" />
  </svg>
)
export const PauseIcon = ({ size = 22, color = 'currentColor' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={color}>
    <rect x="6.5" y="5" width="4" height="14" rx="1.6" />
    <rect x="13.5" y="5" width="4" height="14" rx="1.6" />
  </svg>
)
export const SoundIcon = ({ size = 22, on = true }: P & { on?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {on ? <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" /> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}
  </svg>
)
export const GiftIcon = ({ size = 20, color = '#f27aa6' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <rect x="3.5" y="9" width="17" height="11" rx="2" fill={color} />
    <rect x="2.5" y="6.5" width="19" height="4" rx="1.5" fill="#ffd9e7" />
    <rect x="10.8" y="6.5" width="2.4" height="13.5" fill="#fff" />
    <path d="M12 6.5C10 3 6.5 3.5 7.5 5.5S12 6.5 12 6.5zm0 0c2-3.5 5.5-3 4.5-1S12 6.5 12 6.5z" fill="#f7d774" />
  </svg>
)
export const ButterflyIcon = ({ size = 20, color = '#c8b4ff' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden fill={color}>
    <path d="M12 12C9 5 3 4 3 8.5S7 14 12 12zM12 12c3-7 9-8 9-3.5S17 14 12 12zM12 12c-3 3-7 4-6.5 7 .5 2.5 4.5 0 6.5-7zM12 12c3 3 7 4 6.5 7-.5 2.5-4.5 0-6.5-7z" />
    <rect x="11.3" y="7" width="1.4" height="11" rx="0.7" fill="#6d5560" />
  </svg>
)
export const ArrowIcon = ({ size = 22, color = '#d95b8b' }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 3l6.5 15.5L12 15l-6.5 3.5z" fill={color} />
  </svg>
)

export function ToastIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'heart': return <HeartIcon />
    case 'paw': return <PawIcon />
    case 'map': return <MapIcon color="#d95b8b" />
    case 'gift': return <GiftIcon />
    case 'butterfly': return <ButterflyIcon />
    default: return <StarIcon />
  }
}
