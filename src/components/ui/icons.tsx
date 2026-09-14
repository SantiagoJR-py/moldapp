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

export function PhoneIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M7.5 3.5h9v17h-9zM10.5 17.8h3"
    />
  );
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

export function HomeIcon(props: IconProps) {
  return <Line {...props} d="M4 10.5 12 4l8 6.5V20h-5.5v-5h-5v5H4z" />;
}

export function CarIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M3.5 16.5v-3l2-5h13l2 5v3M3.5 16.5h17M3.5 16.5v2h3v-2M20.5 16.5v2h-3v-2M7 13h2M15 13h2"
    />
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M9 4.5h6v2.5H9zM7 6h-2v14h14V6h-2M8.5 11h7M8.5 14.5h7M8.5 18h4"
    />
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M9.5 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM3 19.5c0-3 2.9-4.75 6.5-4.75s6.5 1.75 6.5 4.75M16 5.5a3.25 3.25 0 0 1 0 6.5M18 14.9c1.9.55 3 1.85 3 3.6"
    />
  );
}

export function ShieldIcon(props: IconProps) {
  return <Line {...props} d="M12 3.5 5 6v6c0 4 3 6.8 7 8.5 4-1.7 7-4.5 7-8.5V6zM9 12l2.2 2.2L15.2 10" />;
}

export function LogoutIcon(props: IconProps) {
  return <Line {...props} d="M15 4.5h3.5v15H15M11 12h-8M6.5 8 3 12l3.5 4" />;
}

export function MenuIcon(props: IconProps) {
  return <Line {...props} d="M4 7h16M4 12h16M4 17h11" />;
}

export function CloseIcon(props: IconProps) {
  return <Line {...props} d="M6 6l12 12M18 6 6 18" />;
}

export function CameraIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M3.5 8.5h3l1.5-2.5h8l1.5 2.5h3v10h-17zM12 16.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z"
    />
  );
}

export function PencilIcon(props: IconProps) {
  return <Line {...props} d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17zM15 6l3 3" />;
}

export function ChevronRightIcon(props: IconProps) {
  return <Line {...props} d="m9.5 5.5 6.5 6.5-6.5 6.5" />;
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
