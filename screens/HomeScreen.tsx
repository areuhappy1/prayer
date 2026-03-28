import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';

export type MainTabParamList = {
  홈: undefined;
  '오늘의 말씀': undefined;
  기도문: undefined;
  중보기도방: undefined;
};

type Props = BottomTabScreenProps<MainTabParamList, '홈'>;

const CARDS: {
  tab: '오늘의 말씀' | '기도문' | '중보기도방';
  title: string;
  sub: string;
  emoji: string;
  badge?: string;
}[] = [
  {
    tab: '오늘의 말씀',
    title: '오늘의 말씀',
    sub: '무료 · 나의 상황에 맞는 해석',
    emoji: '📖',
    badge: '무료',
  },
  {
    tab: '기도문',
    title: '기도문 생성',
    sub: '무드·대상·톤 맞춤 AI 기도',
    emoji: '🙏',
  },
  {
    tab: '중보기도방',
    title: '중보기도방',
    sub: '함께 기도하고 격려하기',
    emoji: '💞',
  },
];

export default function HomeScreen({ navigation }: Props) {
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Text style={styles.brand}>Grace</Text>
          <Text style={styles.tagline}>말씀 · 기도 · 중보를 한곳에</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>

        <TouchableOpacity
          style={styles.hero}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('오늘의 말씀')}
        >
          <Text style={styles.heroBadge}>오늘의 무료 말씀</Text>
          <Text style={styles.heroTitle}>오늘의 성경 말씀과{'\n'}나만의 해석</Text>
          <Text style={styles.heroCta}>바로 보기 →</Text>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>서비스</Text>
        <View style={styles.grid}>
          {CARDS.map(c => (
            <TouchableOpacity
              key={c.tab}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => navigation.navigate(c.tab)}
            >
              <View style={styles.cardRow}>
                <Text style={styles.cardEmoji}>{c.emoji}</Text>
                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    {c.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{c.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.cardSub}>{c.sub}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mission}>
          <Text style={styles.missionTitle}>헌금의 뜻</Text>
          <Text style={styles.missionBody}>
            유료 구독 시 일부 금액은 미자립 개척교회와 선교지를 돕는 데 쓰입니다.
          </Text>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  scroll: { flex: 1 },
  top: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 13, color: THEME.textMuted, marginTop: 4 },
  date: { fontSize: 12, color: THEME.textMuted, marginTop: 10 },
  hero: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 22,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: THEME.bg,
    backgroundColor: THEME.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    lineHeight: 28,
  },
  heroCta: { marginTop: 14, fontSize: 14, fontWeight: '700', color: THEME.gold },
  sectionLabel: {
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 1,
  },
  grid: { paddingHorizontal: 16, gap: 10 },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    padding: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardBody: { flex: 1 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardEmoji: { fontSize: 26 },
  badge: {
    backgroundColor: 'rgba(201, 169, 110, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: THEME.gold },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  cardSub: {
    marginTop: 6,
    fontSize: 13,
    color: THEME.textMuted,
    lineHeight: 19,
  },
  cardArrow: { fontSize: 22, fontWeight: '300', color: THEME.gold },
  mission: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  missionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.gold,
    marginBottom: 6,
  },
  missionBody: { fontSize: 12, color: THEME.textSub, lineHeight: 18 },
});
