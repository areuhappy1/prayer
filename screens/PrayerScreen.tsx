import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  Share,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Speech from 'expo-speech';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as Linking from 'expo-linking';
import { THEME } from '../constants/theme';
import { callAnthropicProxy, extractAnthropicText } from '../services/api';
import {
  getFreePrayerUsed,
  setFreePrayerUsed,
  getPrayerHistoryJson,
  setPrayerHistoryJson,
} from '../services/storage';
import {
  hasActiveSubscription,
  purchaseSubscription,
  restorePurchases,
} from '../services/purchases';
import type { PrayerHistoryItem, PrayerGenerationJson } from '../types/prayer';

const MOODS = [
  { id: 'anxiety', label: '불안', emoji: '😰' },
  { id: 'thanks', label: '감사', emoji: '🙌' },
  { id: 'petition', label: '간구', emoji: '🙏' },
  { id: 'repentance', label: '회개', emoji: '💧' },
  { id: 'praise', label: '찬양', emoji: '✨' },
  { id: 'peace', label: '평안', emoji: '🕊️' },
  { id: 'healing', label: '치유', emoji: '💊' },
  { id: 'guidance', label: '인도', emoji: '🧭' },
];

const PRAYER_TARGETS = [
  { id: 'me', label: '나를 위해', emoji: '👤' },
  { id: 'child', label: '자녀를 위해', emoji: '👶' },
  { id: 'family', label: '가족을 위해', emoji: '👨‍👩‍👧' },
  { id: 'other', label: '타인(중보)을 위해', emoji: '💞' },
];

const PRAYER_TONES = [
  { id: 'traditional', label: '전통적 / 격식', desc: '하나님 아버지, 오늘 저를...' },
  { id: 'modern', label: '현대적 / 친근한', desc: '주님, 제 마음이 오늘...' },
];

const MISSION_PERCENT = 30;
const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL || 'https://example.com/terms';

function parsePrayerJson(raw: string): PrayerGenerationJson | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(start, end + 1)) as PrayerGenerationJson;
    if (parsed.prayer) return parsed;
    return null;
  } catch {
    return null;
  }
}

export default function PrayerScreen() {
  const [step, setStep] = useState<'category' | 'input' | 'result' | 'paywall'>('category');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [situation, setSituation] = useState('');
  const [target, setTarget] = useState('me');
  const [tone, setTone] = useState('modern');
  const [verseReference, setVerseReference] = useState('');
  const [verseQuote, setVerseQuote] = useState('');
  const [prayerBody, setPrayerBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [usedFree, setUsedFree] = useState(false);
  const [history, setHistory] = useState<PrayerHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const cardShotRef = useRef<ViewShot | null>(null);
  const captureCard = () =>
    captureRef(cardShotRef, {
      format: 'png',
      quality: 0.92,
      result: 'tmpfile',
    });

  useEffect(() => {
    (async () => {
      const u = await getFreePrayerUsed();
      setUsedFree(u);
      const h = await getPrayerHistoryJson();
      if (h) {
        try {
          setHistory(JSON.parse(h) as PrayerHistoryItem[]);
        } catch {
          setHistory([]);
        }
      }
    })();
  }, []);

  const persistHistory = useCallback(async (items: PrayerHistoryItem[]) => {
    setHistory(items);
    await setPrayerHistoryJson(JSON.stringify(items));
  }, []);

  const toggleMood = (id: string) => {
    setSelectedMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const generatePrayer = async () => {
    const sub = await hasActiveSubscription();
    if (usedFree && !sub) {
      setStep('paywall');
      return;
    }

    setLoading(true);
    setStep('result');
    setVerseReference('');
    setVerseQuote('');
    setPrayerBody('');

    const targetLabel = PRAYER_TARGETS.find(t => t.id === target)?.label || '';
    const moodLabels = MOODS.filter(m => selectedMoods.includes(m.id))
      .map(m => m.label)
      .join(', ');
    const toneDesc =
      tone === 'traditional' ? '전통적이고 격식 있는 경어체' : '현대적이고 친근한 구어체';
    const hour = new Date().getHours();
    const timeContext =
      hour < 12 ? '아침(하루의 용기·새 출발)' : hour < 18 ? '낮(일과 중간의 집중)' : '저녁·밤(평안한 안식·감사)';

    const prompt = `크리스천 앱을 위한 개인화된 기도문을 작성해 주세요.

조건:
- 기도 대상: ${targetLabel}
- 기도자의 현재 감정/상태: ${moodLabels || '전반적인 기도'}
- 구체적 상황: ${situation || '특별히 기재하지 않음'}
- 문체: ${toneDesc}
- 시간대: ${timeContext}

구조: 찬양/감사 → 고백 → 간구 → 예수님의 이름으로 마침

요구사항:
1. 입력과 가장 잘 맞는 성경 구절 하나를 골라 verseReference(한글 역본 약칭)와 verseQuote(핵심 1~2문장)로 적어 주세요.
2. prayer 필드에 전체 기도문만 넣고, 300~500자 내외로 진심 어린 기도를 작성하세요.
3. 기도문 마지막은 "예수님의 이름으로 기도드립니다. 아멘." 으로 마쳐 주세요.

반드시 아래 JSON만 출력하세요. 다른 설명·마크다운·코드펜스 없이 JSON만:
{"verseReference":"...","verseQuote":"...","prayer":"..."}`;

    try {
      const data = await callAnthropicProxy({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });
      const raw = extractAnthropicText(data);
      const parsed = parsePrayerJson(raw);
      if (parsed) {
        setVerseReference(parsed.verseReference);
        setVerseQuote(parsed.verseQuote);
        setPrayerBody(parsed.prayer);
      } else {
        setPrayerBody(raw || '기도문을 가져오지 못했습니다.');
      }

      if (!usedFree) {
        await setFreePrayerUsed(true);
        setUsedFree(true);
      }

      const item: PrayerHistoryItem = {
        id: `${Date.now()}`,
        date: new Date().toLocaleDateString('ko-KR'),
        target: targetLabel,
        moods: moodLabels,
        verseReference: parsed?.verseReference || '',
        verseQuote: parsed?.verseQuote || '',
        prayer: parsed?.prayer || raw,
        answered: false,
      };
      setHistory(prev => {
        const next = [item, ...prev];
        void setPrayerHistoryJson(JSON.stringify(next));
        return next;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '오류';
      setPrayerBody(`기도문 생성 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const stopTts = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const playTts = () => {
    if (!prayerBody.trim()) return;
    if (speaking) {
      stopTts();
      return;
    }
    setSpeaking(true);
    const text = [verseReference && `말씀: ${verseReference}`, verseQuote, prayerBody]
      .filter(Boolean)
      .join('\n\n');
    Speech.speak(text, {
      language: 'ko-KR',
      pitch: 1,
      rate: 0.92,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const shareText = async () => {
    const text = [verseReference && `📖 ${verseReference}`, verseQuote && `「${verseQuote}」`, '', prayerBody]
      .filter(Boolean)
      .join('\n');
    try {
      await Share.share({ message: text, title: '나의 기도문' });
    } catch {
      Alert.alert('공유', '공유를 완료할 수 없습니다.');
    }
  };

  const saveCardImage = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('권한', '사진 저장을 위해 권한이 필요합니다.');
        return;
      }
      const uri = await captureCard();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('저장됨', '사진 보관함에 기도 카드가 저장되었습니다.');
    } catch {
      Alert.alert('저장', '이미지 저장에 실패했습니다.');
    }
  };

  const shareImage = async () => {
    try {
      const uri = await captureCard();
      const can = await Sharing.isAvailableAsync();
      if (can) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '기도문 카드' });
      } else {
        Alert.alert('공유', '이 기기에서는 이미지 공유를 지원하지 않습니다.');
      }
    } catch {
      Alert.alert('공유', '이미지 공유에 실패했습니다.');
    }
  };

  const reset = () => {
    stopTts();
    setStep('category');
    setSelectedMoods([]);
    setSituation('');
    setVerseReference('');
    setVerseQuote('');
    setPrayerBody('');
  };

  const toggleAnswered = (id: string) => {
    const next = history.map(h =>
      h.id === id ? { ...h, answered: !h.answered } : h
    );
    void persistHistory(next);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>기도문 생성</Text>
          <TouchableOpacity onPress={() => setShowHistory(true)}>
            <Text style={styles.historyBtn}>📔 기도 일기</Text>
          </TouchableOpacity>
        </View>

        {step === 'category' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>오늘 나의 상태</Text>
              <Text style={styles.sectionSub}>중복 선택 가능합니다</Text>
              <View style={styles.moodGrid}>
                {MOODS.map(mood => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodChip,
                      selectedMoods.includes(mood.id) && styles.moodChipActive,
                    ]}
                    onPress={() => toggleMood(mood.id)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text
                      style={[
                        styles.moodLabel,
                        selectedMoods.includes(mood.id) && styles.moodLabelActive,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기도 대상</Text>
              <View style={styles.targetRow}>
                {PRAYER_TARGETS.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.targetBtn, target === t.id && styles.targetBtnActive]}
                    onPress={() => setTarget(t.id)}
                  >
                    <Text style={styles.targetEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.targetLabel,
                        target === t.id && styles.targetLabelActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>기도의 톤</Text>
              {PRAYER_TONES.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.toneBtn, tone === t.id && styles.toneBtnActive]}
                  onPress={() => setTone(t.id)}
                >
                  <View style={[styles.toneRadio, tone === t.id && styles.toneRadioActive]}>
                    {tone === t.id && <View style={styles.toneRadioDot} />}
                  </View>
                  <View>
                    <Text style={[styles.toneName, tone === t.id && styles.toneNameActive]}>
                      {t.label}
                    </Text>
                    <Text style={styles.toneDesc}>{t.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                구체적 상황 <Text style={styles.optionalText}>(선택)</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={3}
                placeholder="오늘 중요한 회의가 있습니다, 가족의 건강이 걱정됩니다..."
                placeholderTextColor={THEME.textMuted}
                value={situation}
                onChangeText={setSituation}
                textAlignVertical="top"
              />
            </View>

            {!usedFree && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>✨ 첫 1회 무료 기도문 생성</Text>
              </View>
            )}

            <TouchableOpacity style={styles.generateBtn} onPress={generatePrayer}>
              <Text style={styles.generateBtnText}>🙏 나만의 기도문 생성하기</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'result' && (
          <View style={styles.section}>
            <ViewShot ref={cardShotRef} style={styles.shotWrap}>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>✨ 나만의 기도문</Text>
                {loading ? (
                  <View style={styles.loadingArea}>
                    <ActivityIndicator color={THEME.gold} size="large" />
                    <Text style={styles.loadingText}>기도문을 작성하고 있습니다...</Text>
                    <Text style={styles.loadingSubText}>잠시 묵상하며 기다려 주세요 🕊️</Text>
                  </View>
                ) : (
                  <>
                    {verseReference ? (
                      <View style={styles.verseBox}>
                        <Text style={styles.verseRef}>📖 {verseReference}</Text>
                        {verseQuote ? (
                          <Text style={styles.verseQuoteText}>「{verseQuote}」</Text>
                        ) : null}
                      </View>
                    ) : null}
                    <Text style={styles.prayerText}>{prayerBody}</Text>
                  </>
                )}
              </View>
            </ViewShot>

            {!loading && (
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={saveCardImage}>
                  <Text style={styles.actionBtnText}>🔖 저장</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={shareImage}>
                  <Text style={styles.actionBtnText}>🖼 공유</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={shareText}>
                  <Text style={styles.actionBtnText}>📤 텍스트</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={playTts}>
                  <Text style={styles.actionBtnText}>{speaking ? '⏹ 멈춤' : '🔊 듣기'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && (
              <TouchableOpacity style={styles.resetBtn} onPress={reset}>
                <Text style={styles.resetBtnText}>← 새 기도문 작성하기</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {step === 'paywall' && (
          <View style={styles.section}>
            <View style={styles.paywallCard}>
              <Text style={styles.paywallEmoji}>🙏</Text>
              <Text style={styles.paywallTitle}>기도문을 계속 받아보세요</Text>
              <Text style={styles.paywallSub}>
                무료 체험이 종료되었습니다.{'\n'}
                구독을 시작하시면 매일 새로운 기도문을 받으실 수 있습니다.
              </Text>

              <View style={styles.missionBox}>
                <Text style={styles.missionTitle}>💛 헌금의 뜻</Text>
                <Text style={styles.missionText}>
                  구독료의 {MISSION_PERCENT}%는 미자립 개척교회와{'\n'}
                  선교지를 위해 사용됩니다.{'\n'}
                  당신의 기도와 헌금이 땅 끝까지 전해집니다.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.subscribeBtn}
                onPress={async () => {
                  const ok = await purchaseSubscription();
                  if (ok) {
                    setStep('category');
                    Alert.alert('감사합니다', '구독이 활성화되었습니다.');
                  } else {
                    Alert.alert(
                      '안내',
                      '스토어 결제를 완료할 수 없습니다. RevenueCat 키·상품 설정을 확인하세요.'
                    );
                  }
                }}
              >
                <Text style={styles.subscribeBtnText}>월 4,900원으로 시작하기</Text>
                <Text style={styles.subscribeBtnSub}>언제든 해지 가능 · 스토어 약관 적용</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  const ok = await restorePurchases();
                  Alert.alert(
                    ok ? '복원 완료' : '복원 실패',
                    ok ? '구독이 확인되었습니다.' : '활성 구독을 찾지 못했습니다.'
                  );
                }}
              >
                <Text style={styles.restoreText}>구매 복원</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
                <Text style={styles.linkText}>이용약관 · 개인정보처리방침</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setStep('category')}>
                <Text style={styles.skipText}>나중에 구독하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      <Modal visible={showHistory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📔 기도 일기</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {history.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyText}>아직 기도 기록이 없습니다</Text>
                  <Text style={styles.emptySubText}>첫 기도문을 작성해보세요 🙏</Text>
                </View>
              ) : (
                history.map(item => (
                  <View key={item.id} style={styles.historyItem}>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyDate}>{item.date}</Text>
                      <Text style={styles.historyTarget}>{item.target}</Text>
                      {item.answered ? (
                        <Text style={styles.answeredBadge}>✅ 응답됨</Text>
                      ) : null}
                    </View>
                    {item.verseReference ? (
                      <Text style={styles.historyVerse} numberOfLines={1}>
                        📖 {item.verseReference}
                      </Text>
                    ) : null}
                    <Text style={styles.historyPreview} numberOfLines={3}>
                      {item.prayer}
                    </Text>
                    <TouchableOpacity
                      style={styles.answeredBtn}
                      onPress={() => toggleAnswered(item.id)}
                    >
                      <Text style={styles.answeredBtnText}>
                        {item.answered ? '✅ 응답 취소' : '🙌 기도 응답됨!'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: THEME.text },
  historyBtn: { fontSize: 13, color: THEME.gold },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 10 },
  sectionSub: { fontSize: 12, color: THEME.textMuted, marginBottom: 12 },
  optionalText: { color: THEME.textMuted, fontWeight: '400' },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    backgroundColor: THEME.card,
    gap: 6,
  },
  moodChipActive: {
    borderColor: THEME.gold,
    backgroundColor: 'rgba(201, 169, 110, 0.12)',
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: 13, color: THEME.textMuted, fontWeight: '500' },
  moodLabelActive: { color: THEME.gold },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  targetBtn: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    backgroundColor: THEME.card,
    gap: 6,
  },
  targetBtnActive: {
    borderColor: THEME.gold,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
  },
  targetEmoji: { fontSize: 22 },
  targetLabel: { fontSize: 12, color: THEME.textMuted, fontWeight: '500' },
  targetLabelActive: { color: THEME.gold },
  toneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    backgroundColor: THEME.card,
    marginBottom: 8,
    gap: 12,
  },
  toneBtnActive: { borderColor: THEME.gold },
  toneRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: THEME.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneRadioActive: { borderColor: THEME.gold },
  toneRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.gold },
  toneName: { fontSize: 14, fontWeight: '600', color: THEME.textSub },
  toneNameActive: { color: THEME.gold },
  toneDesc: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  textInput: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 14,
    padding: 14,
    color: THEME.text,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 90,
  },
  freeBadge: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(74, 155, 111, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 155, 111, 0.3)',
    marginBottom: 12,
  },
  freeBadgeText: { color: THEME.green, fontSize: 13, fontWeight: '600' },
  generateBtn: {
    marginHorizontal: 16,
    backgroundColor: THEME.gold,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  generateBtnText: { color: '#0A0C14', fontSize: 16, fontWeight: '700' },
  shotWrap: { borderRadius: 20, overflow: 'hidden' },
  resultCard: {
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  verseBox: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.cardBorder,
  },
  verseRef: { fontSize: 13, fontWeight: '700', color: THEME.gold, marginBottom: 6 },
  verseQuoteText: { fontSize: 13, color: THEME.textSub, lineHeight: 20, fontStyle: 'italic' },
  resultTitle: { fontSize: 16, fontWeight: '700', color: THEME.gold, marginBottom: 16 },
  prayerText: { color: THEME.text, fontSize: 15, lineHeight: 28, fontStyle: 'italic' },
  resultActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: '22%',
    paddingVertical: 10,
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  actionBtnText: { color: THEME.textSub, fontSize: 12 },
  resetBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.cardBorder,
  },
  resetBtnText: { color: THEME.textMuted, fontSize: 13 },
  loadingArea: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: THEME.text, fontSize: 15 },
  loadingSubText: { color: THEME.textMuted, fontSize: 13 },
  paywallCard: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignItems: 'center',
  },
  paywallEmoji: { fontSize: 48, marginBottom: 14 },
  paywallTitle: { fontSize: 22, fontWeight: '700', color: THEME.text, marginBottom: 10 },
  paywallSub: {
    fontSize: 14,
    color: THEME.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  missionBox: {
    backgroundColor: 'rgba(201, 169, 110, 0.08)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  missionTitle: { fontSize: 13, fontWeight: '700', color: THEME.gold, marginBottom: 8 },
  missionText: { fontSize: 13, color: THEME.textSub, lineHeight: 20, textAlign: 'center' },
  subscribeBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  subscribeBtnText: { color: '#0A0C14', fontSize: 16, fontWeight: '700' },
  subscribeBtnSub: { color: 'rgba(10,12,20,0.6)', fontSize: 11, marginTop: 4 },
  restoreText: { color: THEME.gold, fontSize: 13, paddingVertical: 8 },
  linkText: { color: THEME.textMuted, fontSize: 12, textDecorationLine: 'underline', marginBottom: 4 },
  skipText: { color: THEME.textMuted, fontSize: 13, paddingVertical: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111420',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.text },
  closeBtn: { fontSize: 18, color: THEME.textMuted, padding: 4 },
  emptyHistory: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: THEME.text, fontSize: 16, marginBottom: 8 },
  emptySubText: { color: THEME.textMuted, fontSize: 13 },
  historyItem: {
    backgroundColor: THEME.bg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  historyMeta: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' },
  historyDate: { fontSize: 11, color: THEME.textMuted },
  historyTarget: {
    fontSize: 11,
    color: THEME.gold,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  historyVerse: { fontSize: 12, color: THEME.gold, marginBottom: 6 },
  answeredBadge: { fontSize: 11, color: THEME.green },
  historyPreview: { color: THEME.textSub, fontSize: 13, lineHeight: 20, marginBottom: 10 },
  answeredBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 155, 111, 0.1)',
    alignItems: 'center',
  },
  answeredBtnText: { color: THEME.green, fontSize: 12 },
});
