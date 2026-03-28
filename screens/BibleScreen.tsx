import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { callAnthropicProxy, extractAnthropicText } from '../services/api';

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
  {
    reference: '로마서 8:28',
    text: '우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
    theme: '섭리',
    emoji: '✨',
  },
  {
    reference: '마태복음 11:28',
    text: '수고하고 무거운 짐 진 자들은 다 내게로 오라 내가 너희를 쉬게 하리라',
    theme: '안식',
    emoji: '☁️',
  },
  {
    reference: '시편 46:1',
    text: '하나님은 우리의 피난처시요 힘이시니 환난 중에 만날 큰 도움 이시로다',
    theme: '피난',
    emoji: '🛡️',
  },
  {
    reference: '고린도후서 12:9',
    text: '내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라',
    theme: '은혜',
    emoji: '💛',
  },
];

const MOOD_CHIPS = [
  { id: 'anxiety', label: '불안' },
  { id: 'thanks', label: '감사' },
  { id: 'petition', label: '간구' },
  { id: 'repentance', label: '회개' },
  { id: 'peace', label: '평안' },
];

function hashDateYmd(d: Date): number {
  const s = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function BibleScreen() {
  const todayVerse = useMemo(() => {
    const idx = hashDateYmd(new Date()) % DAILY_VERSES.length;
    return DAILY_VERSES[idx];
  }, []);

  const [moodIds, setMoodIds] = useState<string[]>([]);
  const [situation, setSituation] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'verse' | 'input' | 'result'>('verse');

  const toggleMood = (id: string) => {
    setMoodIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const moodLabels = useMemo(
    () =>
      MOOD_CHIPS.filter(m => moodIds.includes(m.id))
        .map(m => m.label)
        .join(', '),
    [moodIds]
  );

  const getInterpretation = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setStep('result');

    const moodLine = moodLabels
      ? `오늘의 기분/무드: ${moodLabels}`
      : '특별히 고른 무드 없음';

    try {
      const prompt = `오늘의 성경 말씀: "${todayVerse.reference}" - "${todayVerse.text}"

사용자의 현재 상황: "${situation}"
${moodLine}

위 성경 말씀을 사용자의 현재 상황에 맞게 따뜻하고 영적으로 깊이 있게 해석해 주세요.
형식:
1. 말씀의 핵심 의미 (2-3문장)
2. 오늘 당신의 상황에 주시는 하나님의 메시지 (3-4문장)
3. 오늘 하루를 위한 한 줄 묵상

한국어로, 따뜻하고 위로가 되는 목사님의 설교 톤으로 작성해주세요.`;

      const data = await callAnthropicProxy({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });
      setInterpretation(extractAnthropicText(data));
    } catch {
      setInterpretation(
        '말씀 해석을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
          <Text style={styles.headerTitle}>오늘의 말씀</Text>
        </View>

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

        {step === 'verse' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>나의 상황에 맞게 해석받기</Text>
            <Text style={styles.sectionSub}>오늘의 무드(선택)와 상황을 나눠주세요</Text>
            <View style={styles.moodRow}>
              {MOOD_CHIPS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodChip,
                    moodIds.includes(m.id) && styles.moodChipActive,
                  ]}
                  onPress={() => toggleMood(m.id)}
                >
                  <Text
                    style={[
                      styles.moodChipText,
                      moodIds.includes(m.id) && styles.moodChipTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.inputButton} onPress={() => setStep('input')}>
              <Text style={styles.inputButtonText}>✍️ 나의 상황 입력하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'input' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>오늘 나의 상황</Text>
            <View style={styles.moodRow}>
              {MOOD_CHIPS.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.moodChip,
                    moodIds.includes(m.id) && styles.moodChipActive,
                  ]}
                  onPress={() => toggleMood(m.id)}
                >
                  <Text
                    style={[
                      styles.moodChipText,
                      moodIds.includes(m.id) && styles.moodChipTextActive,
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
                    <Text style={styles.situationTagText}>
                      나의 상황: {situation}
                      {moodLabels ? `\n무드: ${moodLabels}` : ''}
                    </Text>
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
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  moodChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    backgroundColor: THEME.card,
  },
  moodChipActive: {
    borderColor: THEME.gold,
    backgroundColor: 'rgba(201, 169, 110, 0.12)',
  },
  moodChipText: { fontSize: 12, color: THEME.textMuted, fontWeight: '500' },
  moodChipTextActive: { color: THEME.gold },
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
