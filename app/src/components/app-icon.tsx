import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import type { AppIconName } from '@/types/icons';

type Props = {
  name: AppIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function AppIcon({ name, size = 24, color = '#6C52E5', strokeWidth = 2.35 }: Props) {
  const shared = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth };
  let artwork: ReactNode;

  switch (name) {
    case 'path': artwork = <><Circle cx="7" cy="17" r="2.5" {...shared} /><Circle cx="17" cy="7" r="2.5" {...shared} /><Path d="M9 16c5 0 1-7 5.5-7" {...shared} /></>; break;
    case 'book': artwork = <><Path d="M4 5.5c3.2-.7 5.7.1 8 2.2v12c-2.3-2.1-4.8-2.9-8-2.2z" {...shared} /><Path d="M20 5.5c-3.2-.7-5.7.1-8 2.2v12c2.3-2.1 4.8-2.9 8-2.2z" {...shared} /></>; break;
    case 'review': artwork = <><Path d="M5.2 8.4A7.8 7.8 0 1 1 4.6 15" {...shared} /><Polyline points="4,4 4.8,8.8 9.4,8" {...shared} /><Path d="M12 8v4l2.8 1.8" {...shared} /></>; break;
    case 'user': artwork = <><Circle cx="12" cy="8" r="3.5" {...shared} /><Path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" {...shared} /></>; break;
    case 'search': artwork = <><Circle cx="10.5" cy="10.5" r="5.5" {...shared} /><Line x1="15" y1="15" x2="20" y2="20" {...shared} /></>; break;
    case 'close': artwork = <><Line x1="6" y1="6" x2="18" y2="18" {...shared} /><Line x1="18" y1="6" x2="6" y2="18" {...shared} /></>; break;
    case 'star': artwork = <Polygon points="12,3.8 14.5,9 20.2,9.8 16.1,13.8 17.1,19.6 12,16.8 6.9,19.6 7.9,13.8 3.8,9.8 9.5,9" {...shared} />; break;
    case 'flame': artwork = <><Path d="M13.6 2.2c.8 3.7-1.5 5.2-3 7.2-1.1-1.3-1.6-2.7-1.2-4.3C5.6 7.9 3.5 11.4 3.5 15.5 3.5 20.6 7.1 23 12 23s8.5-3.6 8.5-8.6c0-5-2.8-9.5-6.9-12.2Z" fill={color} /><Path d="M12.3 11.3c.3 1.9-.8 2.8-1.7 3.8-.6-.6-.9-1.4-.7-2.3-1.8 1.4-2.8 3.3-2.8 5.4 0 2.9 2.1 4.8 4.9 4.8s4.9-2 4.9-4.9c0-2.8-1.8-5.4-4.6-6.8Z" fill="#FFC83D" /></>; break;
    case 'heart': artwork = <Path d="M12 21s-8.5-4.8-8.5-11.2A5.3 5.3 0 0 1 12 5.6a5.3 5.3 0 0 1 8.5 4.2C20.5 16.2 12 21 12 21Z" fill={color} />; break;
    case 'gem': artwork = <><Polygon points="7,4 17,4 21,9 12,20 3,9" {...shared} /><Polyline points="3,9 21,9 17,4 12,9 7,4" {...shared} /></>; break;
    case 'bolt': artwork = <Polygon points="13.5,2.8 5.5,13 11.2,13 10.5,21.2 18.5,10.8 12.8,10.8" {...shared} />; break;
    case 'volume': artwork = <><Path d="M4 10v4h4l5 4V6l-5 4z" {...shared} /><Path d="M16 9a4 4 0 0 1 0 6M18.5 6.8a7.2 7.2 0 0 1 0 10.4" {...shared} /></>; break;
    case 'check': artwork = <Polyline points="5,12.5 10,17 19,7" {...shared} />; break;
    case 'lock': artwork = <><Rect x="5" y="10" width="14" height="10" rx="3" {...shared} /><Path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...shared} /></>; break;
    case 'chevron-left': artwork = <Polyline points="15,5 8,12 15,19" {...shared} />; break;
    case 'chevron-right': artwork = <Polyline points="9,5 16,12 9,19" {...shared} />; break;
    case 'external-link': artwork = <><Path d="M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" {...shared} /><Polyline points="13,4 20,4 20,11" {...shared} /><Line x1="20" y1="4" x2="11" y2="13" {...shared} /></>; break;
    case 'clock': artwork = <><Circle cx="12" cy="12" r="8.5" {...shared} /><Path d="M12 7v5l3.5 2" {...shared} /></>; break;
    case 'focus': artwork = <><Circle cx="12" cy="12" r="8" {...shared} /><Circle cx="12" cy="12" r="3" {...shared} /></>; break;
    case 'resume': artwork = <><Rect x="5" y="3" width="14" height="18" rx="2.5" {...shared} /><Line x1="9" y1="8" x2="15" y2="8" {...shared} /><Line x1="9" y1="12" x2="16" y2="12" {...shared} /><Line x1="9" y1="16" x2="14" y2="16" {...shared} /></>; break;
    case 'shield': artwork = <Path d="M12 3.5 19 6v5.5c0 4.6-2.8 7.6-7 9-4.2-1.4-7-4.4-7-9V6zM9 12l2 2 4-4" {...shared} />; break;
    case 'network': artwork = <><Circle cx="12" cy="5" r="2" {...shared} /><Circle cx="6" cy="18" r="2" {...shared} /><Circle cx="18" cy="18" r="2" {...shared} /><Path d="M11 7 7 16m6-9 4 9M8 18h8" {...shared} /></>; break;
    case 'message': artwork = <Path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-5 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM7 10h10M7 14h6" {...shared} />; break;
    case 'tune': artwork = <><Line x1="4" y1="7" x2="20" y2="7" {...shared} /><Circle cx="9" cy="7" r="2" fill={color} /><Line x1="4" y1="17" x2="20" y2="17" {...shared} /><Circle cx="15" cy="17" r="2" fill={color} /></>; break;
    case 'chart': artwork = <><Path d="M4 19V5M4 19h16" {...shared} /><Path d="m7 15 4-4 3 2 5-6" {...shared} /></>; break;
    case 'layers': artwork = <><Polygon points="12,4 21,9 12,14 3,9" {...shared} /><Polyline points="4.5,13 12,17 19.5,13" {...shared} /><Polyline points="4.5,17 12,21 19.5,17" {...shared} /></>; break;
    case 'target': artwork = <><Circle cx="12" cy="12" r="8.5" {...shared} /><Circle cx="12" cy="12" r="4" {...shared} /><Circle cx="12" cy="12" r="1" fill={color} /></>; break;
    case 'grid': artwork = <><Rect x="4" y="4" width="16" height="16" rx="3" {...shared} /><Line x1="12" y1="4" x2="12" y2="20" {...shared} /><Line x1="4" y1="12" x2="20" y2="12" {...shared} /></>; break;
    case 'scale': artwork = <><Line x1="12" y1="4" x2="12" y2="20" {...shared} /><Line x1="6" y1="7" x2="18" y2="7" {...shared} /><Path d="m6 7-3 6h6zM18 7l-3 6h6zM8 20h8" {...shared} /></>; break;
    case 'mask': artwork = <><Path d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5z" {...shared} /><Line x1="5" y1="4" x2="19" y2="20" {...shared} /></>; break;
    case 'split': artwork = <><Path d="M12 20V9M12 9 7 4M12 9l5-5" {...shared} /><Circle cx="7" cy="4" r="1.5" fill={color} /><Circle cx="17" cy="4" r="1.5" fill={color} /></>; break;
    case 'merge': artwork = <><Path d="M7 4v4c0 2 2 4 5 4s5 2 5 4v4M17 4v4c0 2-2 4-5 4s-5 2-5 4v4" {...shared} /></>; break;
    case 'sliders': artwork = <><Line x1="6" y1="4" x2="6" y2="20" {...shared} /><Line x1="18" y1="4" x2="18" y2="20" {...shared} /><Circle cx="6" cy="9" r="2" fill={color} /><Circle cx="18" cy="15" r="2" fill={color} /></>; break;
    case 'position': artwork = <><Path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11z" {...shared} /><Circle cx="12" cy="10" r="2" {...shared} /></>; break;
    case 'rotate': artwork = <><Path d="M19 8a8 8 0 1 0 1 6" {...shared} /><Polyline points="15,4 19,8 15,10" {...shared} /></>; break;
    case 'trend': artwork = <><Path d="M4 18 10 12l3 3 7-8" {...shared} /><Polyline points="15,7 20,7 20,12" {...shared} /></>; break;
    case 'expand': artwork = <><Polyline points="9,4 4,4 4,9" {...shared} /><Line x1="4" y1="4" x2="10" y2="10" {...shared} /><Polyline points="15,20 20,20 20,15" {...shared} /><Line x1="20" y1="20" x2="14" y2="14" {...shared} /></>; break;
    case 'gauge': artwork = <><Path d="M4 17a8 8 0 1 1 16 0" {...shared} /><Line x1="12" y1="17" x2="17" y2="9" {...shared} /><Circle cx="12" cy="17" r="1.5" fill={color} /></>; break;
    case 'encoder': artwork = <><Rect x="4" y="5" width="7" height="14" rx="2" {...shared} /><Path d="M13 8h7M17 5l3 3-3 3M13 16h7" {...shared} /></>; break;
    case 'decoder': artwork = <><Rect x="13" y="5" width="7" height="14" rx="2" {...shared} /><Path d="M4 8h7M7 5 4 8l3 3M4 16h7" {...shared} /></>; break;
    case 'flow': artwork = <><Rect x="3" y="7" width="6" height="10" rx="2" {...shared} /><Rect x="15" y="7" width="6" height="10" rx="2" {...shared} /><Path d="M10 12h4M12 9l3 3-3 3" {...shared} /></>; break;
    case 'cross': artwork = <><Path d="M4 7h16M4 17h16" {...shared} /><Path d="m8 4-4 3 4 3m8 4 4 3-4 3" {...shared} /></>; break;
    case 'play': artwork = <><Circle cx="12" cy="12" r="9" {...shared} /><Polygon points="10,8 17,12 10,16" fill={color} stroke="none" /></>; break;
    case 'database': artwork = <><EllipseShape color={color} strokeWidth={strokeWidth} /><Path d="M5 7v10c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5V7M5 12c0 2 3.1 3.5 7 3.5s7-1.5 7-3.5" {...shared} /></>; break;
    case 'branch': artwork = <><Circle cx="6" cy="6" r="2" {...shared} /><Circle cx="18" cy="6" r="2" {...shared} /><Circle cx="12" cy="18" r="2" {...shared} /><Path d="M6 8v2c0 2 2 3 6 3s6-1 6-3V8M12 13v3" {...shared} /></>; break;
  }

  return <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>{artwork}</Svg>;
}

function EllipseShape({ color, strokeWidth }: { color: string; strokeWidth: number }) {
  return <Path d="M5 7c0-2 3.1-3.5 7-3.5S19 5 19 7s-3.1 3.5-7 3.5S5 9 5 7z" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} />;
}
