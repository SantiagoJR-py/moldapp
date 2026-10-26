import { router, usePathname } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/pressable-scale';
import { isActive, tabsForRole, type NavItem } from '@/constants/navigation';
import { motion, palette, radius } from '@/constants/theme';
import { useGateAlerts } from '@/context/gate-alerts';
import { useSession } from '@/context/session';

/** Barra de pestañas del celular, como la de una app de iPhone: destinos, nunca acciones. */
export function TabBar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user } = useSession();
  const { pending } = useGateAlerts();

  const tabs = tabsForRole(user?.role?.name);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: palette.ink700,
        backgroundColor: palette.ink900,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingHorizontal: 4,
      }}
    >
      {tabs.map((item) => (
        <Tab
          key={item.key}
          item={item}
          active={isActive(item, pathname)}
          count={item.badge === 'alerts' ? pending.length : 0}
        />
      ))}
    </View>
  );
}

function Tab({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  const label = item.tabLabel ?? item.label;
  const color = active ? palette.accent400 : palette.steel500;

  return (
    <View style={{ flex: 1 }}>
      <PressableScale
        accessibilityLabel={count ? `${label}, ${count} pendientes` : label}
        depth={0.92}
        onPress={() => item.href && router.navigate(item.href)}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 3 }}
      >
        <View>
          <Icon size={23} color={color} />
          {count > 0 ? (
            <Animated.View
              entering={ZoomIn.duration(motion.base).springify().damping(14)}
              exiting={ZoomOut.duration(motion.fast)}
              style={{
                position: 'absolute',
                top: -5,
                left: 14,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.pill,
                borderWidth: 2,
                borderColor: palette.ink900,
                backgroundColor: palette.danger,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  color: palette.ink950,
                  fontSize: 10,
                  fontWeight: '800',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {count > 99 ? '99+' : count}
              </Text>
            </Animated.View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: active ? '600' : '500',
            color: active ? palette.accent200 : palette.steel400,
          }}
        >
          {label}
        </Text>
      </PressableScale>
    </View>
  );
}
