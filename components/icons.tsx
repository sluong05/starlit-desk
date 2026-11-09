import type { ReactNode } from "react";

/** Small line icons used around the call. */
const make = (children: ReactNode) =>
  function Icon({ size = 20 }: { size?: number }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
      </svg>
    );
  };

export const MicIcon = make(
  <>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
  </>,
);
export const MicOffIcon = make(
  <>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M2 2l20 20" />
  </>,
);
export const CamIcon = make(
  <>
    <rect x="2" y="6" width="14" height="12" rx="3" />
    <path d="m16 10 6-3v10l-6-3" />
  </>,
);
export const CamOffIcon = make(
  <>
    <path d="M10.7 6H13a3 3 0 0 1 3 3v1l6-3v10M16 16a3 3 0 0 1-3 2H5a3 3 0 0 1-3-3V9a3 3 0 0 1 2-2.8M2 2l20 20" />
  </>,
);
export const ScreenIcon = make(
  <>
    <rect x="2" y="4" width="20" height="13" rx="2" />
    <path d="M8 21h8M12 17v4M12 13V8m-2.5 2.5L12 8l2.5 2.5" />
  </>,
);
export const SmileIcon = make(
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M8 14.5s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01" />
  </>,
);
export const HandIcon = make(<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5v-1a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a7 7 0 0 1-5.4-2.6L3.3 15a1.6 1.6 0 0 1 2.4-2.1L8 15" />);
export const DiceIcon = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01" strokeWidth={2.6} />
  </>,
);
export const LockIcon = make(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);
export const GearIcon = make(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.900 2.900l-.1-.1a1.7 1.7 0 0 0-1.800-.3 1.7 1.7 0 0 0-1 1.500V21a2 2 0 0 1-4 0v-.1a1.700 1.700 0 0 0-1-1.500 1.700 1.700 0 0 0-1.800.3l-.1.1a2 2 0 1 1-2.900-2.900l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 0 1 0-4h.1a1.700 1.700 0 0 0 1.500-1 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.900-2.900l.1.1a1.700 1.700 0 0 0 1.800.3h.1a1.700 1.700 0 0 0 1-1.500V3a2 2 0 0 1 4 0v.1a1.700 1.700 0 0 0 1 1.500 1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.900 2.900l-.1.1a1.700 1.700 0 0 0-.3 1.800v.1a1.700 1.700 0 0 0 1.500 1H21a2 2 0 0 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1Z" />
  </>,
);
export const LeaveIcon = make(<path d="M3.5 14.5c-1-3 2.500-6 8.500-6s9.500 3 8.500 6l-.4 1.200a1.500 1.500 0 0 1-1.900.9l-2.600-.9a1.500 1.500 0 0 1-1-1.400v-1.500a12 12 0 0 0-5.200 0v1.500a1.500 1.500 0 0 1-1 1.400l-2.600.9a1.500 1.500 0 0 1-1.900-.9Z" />);
export const LinkIcon = make(<path d="M10 14a5 5 0 0 0 7.100 0l3-3a5 5 0 0 0-7.100-7.100l-1 1M14 10a5 5 0 0 0-7.100 0l-3 3a5 5 0 0 0 7.100 7.100l1-1" />);
export const ExpandIcon = make(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
export const ShrinkIcon = make(<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />);
export const FullscreenIcon = make(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
