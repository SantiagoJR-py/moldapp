import Svg, { Circle, Path } from 'react-native-svg';

import { palette } from '@/constants/theme';

type IconProps = {
  size?: number;
  color?: string;
};

function Line({ size = 20, color = palette.steel300, d }: IconProps & { d: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return <Line {...props} d="M3.5 6.5h17v11h-17zM3.5 7l8.5 6 8.5-6" />;
}

export function LockIcon(props: IconProps) {
  return (
    <Line {...props} d="M6.5 10.5h11v9h-11zM8.75 10.5V7.75a3.25 3.25 0 0 1 6.5 0v2.75M12 14v2.5" />
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.5 20c0-3.5 3.36-5.5 7.5-5.5s7.5 2 7.5 5.5"
    />
  );
}

export function IdIcon(props: IconProps) {
  return (
    <Line
      {...props}
      d="M3.5 5.5h17v13h-17zM9 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5.8 16c.5-1.7 1.8-2.5 3.2-2.5s2.7.8 3.2 2.5M14.5 10h4M14.5 13.5h4"
    />
  );
}

export function PhoneIcon(props: IconProps) {
  return <Line {...props} d="M7.5 3.5h9v17h-9zM10.5 17.8h3" />;
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
  return <Line {...props} d="M9 4.5h6v2.5H9zM7 6h-2v14h14V6h-2M8.5 11h7M8.5 14.5h7M8.5 18h4" />;
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
  return (
    <Line {...props} d="M12 3.5 5 6v6c0 4 3 6.8 7 8.5 4-1.7 7-4.5 7-8.5V6zM9 12l2.2 2.2L15.2 10" />
  );
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

export function TrashIcon(props: IconProps) {
  return <Line {...props} d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 10.5v6M13.5 10.5v6" />;
}

export function PlusIcon(props: IconProps) {
  return <Line {...props} d="M12 5v14M5 12h14" />;
}

export function ChevronRightIcon(props: IconProps) {
  return <Line {...props} d="m9.5 5.5 6.5 6.5-6.5 6.5" />;
}

export function ChevronDownIcon(props: IconProps) {
  return <Line {...props} d="m5.5 9.5 6.5 6.5 6.5-6.5" />;
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

/** Flecha que entra por una puerta: ingreso a la institución. */
export function EntryIcon(props: IconProps) {
  return <Line {...props} d="M3.5 12h10M9.5 8l4 4-4 4M16.5 4.5h3.5v15h-3.5" />;
}

/** Flecha que sale por una puerta: salida de la institución. */
export function ExitIcon(props: IconProps) {
  return <Line {...props} d="M10 12h10.5M16.5 8l4 4-4 4M7.5 4.5H4v15h3.5" />;
}

/** Flecha que sube desde una bandeja: subir un archivo. */
export function UploadIcon(props: IconProps) {
  return <Line {...props} d="M12 15V4.5M7.5 9 12 4.5 16.5 9M4.5 14.5v5h15v-5" />;
}

/** Cámara de video: el monitor en vivo de portería. */
export function VideoIcon(props: IconProps) {
  return <Line {...props} d="M3.5 7h11.5v10H3.5zM15 10.5l5.5-3v9l-5.5-3" />;
}

export function BellIcon(props: IconProps) {
  return <Line {...props} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 20.5a2.2 2.2 0 0 0 4 0" />;
}

/** Esquinas de visor: apuntar la cámara del equipo a una placa. */
export function ScanIcon(props: IconProps) {
  return <Line {...props} d="M4 8.5V4h4.5M15.5 4H20v4.5M20 15.5V20h-4.5M8.5 20H4v-4.5M7.5 12h9" />;
}

/** Tarjeta de propiedad del vehículo. */
export function CardIcon(props: IconProps) {
  return <Line {...props} d="M3.5 6h17v12h-17zM3.5 9.5h17M6.5 13.5h5M6.5 15.5h3M15 13.5h2.5" />;
}

/** Controles deslizantes: ajustes de una cámara. */
export function SlidersIcon(props: IconProps) {
  return <Line {...props} d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" />;
}

/** Flecha que vuelve: restaurar algo quitado. */
export function RestoreIcon(props: IconProps) {
  return <Line {...props} d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" />;
}
