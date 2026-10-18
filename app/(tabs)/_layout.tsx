import { Tabs } from 'expo-router';
import { CalendarDays, House, MessageCircleHeart, Sparkles, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

const tabs = [
  { name: 'home', label: 'Accueil', icon: House },
  { name: 'moment', label: 'Moment', icon: Sparkles },
  { name: 'companion', label: 'Compagnon', icon: MessageCircleHeart },
  { name: 'planning', label: 'Planning', icon: CalendarDays },
  { name: 'profile', label: 'Profil', icon: UserRound },
];

type BloomTabBarProps = {
  state: { index: number; routes: { name: string }[] };
  navigation: { navigate: (name: string) => void };
};

function BloomTabBar({ state, navigation }: BloomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map(({ name, label, icon: Icon }) => {
        const routeIndex = state.routes.findIndex((route) => route.name === name);
        const active = state.index === routeIndex;
        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => navigation.navigate(name)}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, active && styles.activeIcon]}><Icon size={19} color={active ? colors.white : colors.muted} strokeWidth={active ? 2.4 : 1.9} /></View>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <BloomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="moment" options={{ title: 'Moment' }} />
      <Tabs.Screen name="companion" options={{ title: 'Compagnon' }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: '#EEE8F1', paddingTop: 8, paddingHorizontal: 5 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 55 },
  iconWrap: { width: 36, height: 29, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  activeIcon: { backgroundColor: colors.plum },
  label: { color: colors.muted, fontSize: 9, fontWeight: '600' },
  activeLabel: { color: colors.violet, fontWeight: '800' },
});
