import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';

const THEME = {
  bg: '#0A0C14',
  card: '#111420',
  cardBorder: '#1E2438',
  gold: '#C9A96E',
  goldLight: '#E8C98A',
  goldDim: '#8B6B3D',
  text: '#EEE8DC',
  textMuted: '#7A7F96',
  textSub: '#AAA5B8',
  accent: '#3B4A7A',
  accentLight: '#4D5F9E',
  purple: '#6B5BCD',
};

const DAILY_VERSES = [
  {
    reference: '빌립보서 4:6-7',
    text: '아무것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라. 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라.',
    theme: '평안',
    emoji: '🕊️',
  },
  {
    reference: '이사야 40:31',
    text: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달음박질하여도 곤비하지 아니하겠고 걸어가도 피곤하지 아니하리로다.',
    theme: '소망',
    emoji: '🦅',
  },
  {
    reference: '시편 23:1-3',
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다. 그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다.',
    theme: '인도',
    emoji: '🌿',
  },
];

const todayVerse = DAILY_VERSES[new Date().getDay() % DAILY_VERSES.length];

export default function BibleScreen() {
  const [situation, setSituation] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'verse' | 'input' | 'result'>('verse');

  const getInterpretation = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setStep('result');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `오늘의 성경 말씀: "${todayVerse.reference}" - "${todayVerse.text}"
              
사용자의 현재 상황: "${situation}"

위 성경 말씀을 사용자의 현재 상황에 맞게 따뜻하고 영적으로 깊이 있게 해석해 주세요.
형식:
1. 말씀의 핵심 의미 (2-3문장)
2. 오늘 당신의 상황에 주시는 하나님의 메시지 (3-4문장)
3. 오늘 하루를 위한 한 줄 묵상

한국어로, 따뜻하고 위로가 되는 목사님의 설교 톤으로 작성해주세요.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((c: any) => c.text || '').join('') || '';
      setInterpretation(text);
    } catch (e) {
      setInterpretation('말씀 해석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
            })}
          </Text>
          <Text style={styles.headerTitle}>오늘의 말씀</Text>
        </View>

        {/* Verse Card */}
        <View style={styles.verseCard}>
          <View style={styles.verseThemeRow}>
            <Text style={styles.verseEmoji}>{todayVerse.emoji}</Text>
            <Text style={styles.verseTheme}>{todayVerse.theme}</Text>
          </View>
          <Text style={styles.verseText}>{todayVerse.text}</Text>
          <View style={styles.referenceRow}>
            <View style={styles.referenceLine} />
            <Text style={styles.reference}>{todayVerse.reference}</Text>
            <View style={styles.referenceLine} />
          </View>
        </View>

        {/* My Situation Input */}
        {step === 'verse' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>나의 상황에 맞게 해석받기</Text>
            <Text style={styles.sectionSub}>오늘 당신의 마음과 상황을 나눠주세요</Text>
            <TouchableOpacity style={styles.inputButton} onPress={() => setStep('input')}>
              <Text style={styles.inputButtonText}>✍️ 나의 상황 입력하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'input' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>오늘 나의 상황</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="예: 오늘 중요한 발표가 있어서 많이 긴장됩니다. 하나님께서 함께해주시길 바랍니다."
              placeholderTextColor={THEME.textMuted}
              value={situation}
              onChangeText={setSituation}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[styles.primaryButton, !situation.trim() && styles.buttonDisabled]}
              onPress={getInterpretation}
              disabled={!situation.trim()}
            >
              <Text style={styles.primaryButtonText}>말씀 해석 받기 →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('verse')}>
              <Text style={styles.backText}>← 돌아가기</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'result' && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>📜 나를 위한 말씀 해석</Text>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={THEME.gold} size="large" />
                  <Text style={styles.loadingText}>말씀을 묵상하고 있습니다...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.situationTag}>
                    <Text style={styles.situationTagText}>나의 상황: {situation}</Text>
                  </View>
                  <Text style={styles.interpretationText}>{interpretation}</Text>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                      setStep('input');
                      setInterpretation('');
                    }}
                  >
                    <Text style={styles.resetButtonText}>↺ 다시 해석받기</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerDate: {
    fontSize: 12,
    color: THEME.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: -0.5,
  },
  verseCard: {
    margin: 16,
    padding: 24,
    backgroundColor: THEME.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    shadowColor: THEME.gold,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
  },
  verseThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  verseEmoji: { fontSize: 22, marginRight: 8 },
  verseTheme: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.gold,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  verseText: {
    fontSize: 17,
    lineHeight: 28,
    color: THEME.text,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referenceLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.cardBorder,
  },
  reference: {
    fontSize: 12,
    color: THEME.gold,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 16,
  },
  inputButton: {
    borderWidth: 1.5,
    borderColor: THEME.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
  },
  inputButtonText: {
    color: THEME.gold,
    fontSize: 15,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 14,
    padding: 16,
    color: THEME.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: THEME.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    color: '#0A0C14',
    fontSize: 16,
    fontWeight: '700',
  },
  backText: {
    color: THEME.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  resultCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.gold,
    marginBottom: 14,
  },
  situationTag: {
    backgroundColor: 'rgba(107, 91, 205, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: THEME.purple,
  },
  situationTagText: {
    color: THEME.textSub,
    fontSize: 13,
    lineHeight: 18,
  },
  interpretationText: {
    color: THEME.text,
    fontSize: 15,
    lineHeight: 26,
  },
  loadingRow: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  loadingText: {
    color: THEME.textMuted,
    fontSize: 14,
  },
  resetButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignItems: 'center',
  },
  resetButtonText: {
    color: THEME.textMuted,
    fontSize: 13,
  },
});
