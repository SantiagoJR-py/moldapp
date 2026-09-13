import Svg, { Circle, Path } from 'react-native-svg';

import { palette } from '@/constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

function Line({ size = 20, color = palette.steel300, d }: IconProps & { d: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return <Line {...props} d="M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6" />;
}

export function LockIcon(props: IconProps) {
  return <Line {...props} d="M6.5 10.5h11v9h-11zM8.75 10.5V7.75a3.25 3.25 0 0 1 6.5 0v2.75M12 14v2.5" />;
}

export function UserIcon(props: IconProps) {
  return <Line {...props} d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20c0-3.5 3.36-5.5 7.5-5.5s7.5 2 7.5 5.5" />;
}

export function IdIcon(props: IconProps) {
  return <Line {...props} d="M3.5 5.5h17v13h-17zM9 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.8 16c.5-1.7 1.8-2.5 3.2-2.5s2.7.8 3.2 2.5M14.5 10h4M14.5 13.5h4" />;
}

export function ArrowLeftIcon(props: IconProps) {
  return <Line {...props} d="M19 12H5M11 6l-6 6 6 6" />;
}

export function CheckIcon(props: IconProps) {
  return <Line {...props} d="M4.5 12.5 9.5 17.5 19.5 7" />;
}

export function AlertIcon(props: IconProps) {
  return <Line {...props} d="M12 4.5 21 20H3zM12 10v4.5M12 17.2v.3" />;
}

export function InfoIcon(props: IconProps) {
  return <Line {...props} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5.5M12 7.8v.3" />;
}

export function EyeIcon({ size = 20, color = palette.steel400 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12S6 5.75 12 5.75 21.5 12 21.5 12 18 18.25 12 18.25 2.5 12 2.5 12Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={2.9} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function EyeOffIcon({ size = 20, color = palette.steel400 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12s3.4-6.25 8-6.25c1.3 0 2.5.4 3.5 1M20 12s-3.4 6.25-8 6.25c-1.3 0-2.5-.4-3.5-1M9.9 9.9a3 3 0 0 0 4.2 4.2M4 4l16 16"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
