import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';
import { THEME } from '../constants/theme';
import { INITIAL_POSTS, type PrayerPost } from '../services/intercessory';

const CATEGORIES = ['전체', '건강', '진로', '가족', '믿음', '감사', '나라/세계'];

export default function IntercessoryScreen() {
  const [activeCategory, setActiveCategory] = useState('전체');
  const [posts, setPosts] = useState<PrayerPost[]>(INITIAL_POSTS);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('건강');
  const [sparkles, setSparkles] = useState<{ [id: string]: boolean }>({});
  const scaleAnims = useRef<{ [id: string]: Animated.Value }>({});

  const getScale = (id: string) => {
    if (!scaleAnims.current[id]) {
      scaleAnims.current[id] = new Animated.Value(1);
    }
    return scaleAnims.current[id];
  };

  const filtered =
    activeCategory === '전체'
      ? posts
      : posts.filter(p => p.category === activeCategory);

  const handlePray = (id: string) => {
    setSparkles(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSparkles(prev => ({ ...prev, [id]: false })), 900);

    const scale = getScale(id);
    scale.setValue(1);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, friction: 4, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              hasPrayed: !p.hasPrayed,
              prayerCount: p.hasPrayed ? p.prayerCount - 1 : p.prayerCount + 1,
            }
          : p
      )
    );
  };

  const submitPost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const newPost: PrayerPost = {
      id: Date.now().toString(),
      author: '나',
      category: newCategory,
      title: newTitle,
      content: newContent,
      prayerCount: 0,
      hasPrayed: false,
      timeAgo: '방금',
      emoji: '🙏',
    };
    setPosts(prev => [newPost, ...prev]);
    setShowNewPost(false);
    setNewTitle('');
    setNewContent('');
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      건강: '#C0647A',
      진로: '#6B5BCD',
      가족: '#C9A96E',
      믿음: '#4A9B6F',
      감사: '#4A8B9B',
      '나라/세계': '#9B7A4A',
    };
    return map[cat] || THEME.textMuted;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>중보기도방</Text>
          <Text style={styles.headerSub}>함께 기도할 때 응답이 임합니다</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewPost(true)}>
          <Text style={styles.addBtnText}>+ 기도 올리기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.tab, activeCategory === cat && styles.tabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.tabText, activeCategory === cat && styles.tabTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map(post => (
          <View key={post.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.emoji}</Text>
                </View>
                <View>
                  <Text style={styles.author}>{post.author}</Text>
                  <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                </View>
              </View>
              <View
                style={[styles.catBadge, { backgroundColor: `${getCategoryColor(post.category)}20` }]}
              >
                <Text style={[styles.catBadgeText, { color: getCategoryColor(post.category) }]}>
                  {post.category}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardContent} numberOfLines={3}>
              {post.content}
            </Text>

            <View style={styles.cardFooter}>
              <Animated.View style={{ transform: [{ scale: getScale(post.id) }] }}>
                <TouchableOpacity
                  style={[styles.prayBtn, post.hasPrayed && styles.prayBtnActive]}
                  onPress={() => handlePray(post.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.prayBtnEmoji}>
                    {sparkles[post.id] ? '✨' : post.hasPrayed ? '💛' : '🙏'}
                  </Text>
                  <Text style={[styles.prayBtnText, post.hasPrayed && styles.prayBtnTextActive]}>
                    함께 기도했습니다
                  </Text>
                  <Text style={[styles.prayCount, post.hasPrayed && styles.prayCountActive]}>
                    {post.prayerCount}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🙏 기도 제목 올리기</Text>
              <TouchableOpacity onPress={() => setShowNewPost(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>카테고리</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}>
                {CATEGORIES.slice(1).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, newCategory === cat && styles.filterChipActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        newCategory === cat && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>제목</Text>
            <TextInput
              style={[styles.input, { color: THEME.text }]}
              placeholder="기도 제목을 입력해 주세요"
              placeholderTextColor={THEME.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.label}>내용</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, { color: THEME.text }]}
              placeholder="함께 기도해 주실 형제자매들에게 상황을 나눠주세요..."
              placeholderTextColor={THEME.textMuted}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.submitBtn, (!newTitle.trim() || !newContent.trim()) && styles.submitBtnDisabled]}
              onPress={submitPost}
              disabled={!newTitle.trim() || !newContent.trim()}
            >
              <Text style={styles.submitBtnText}>기도 제목 올리기 🙏</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: THEME.text },
  headerSub: { fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { color: '#0A0C14', fontSize: 12, fontWeight: '700' },
  tabScroll: { maxHeight: 48 },
  tabContainer: { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 6 },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  tabActive: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  tabText: { color: THEME.textMuted, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#0A0C14', fontWeight: '700' },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(201, 169, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 110, 0.2)',
  },
  avatarText: { fontSize: 18 },
  author: { fontSize: 14, fontWeight: '600', color: THEME.text },
  timeAgo: { fontSize: 11, color: THEME.textMuted, marginTop: 2 },
  catBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  cardContent: {
    fontSize: 13,
    color: THEME.textSub,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: { borderTopWidth: 1, borderTopColor: THEME.cardBorder, paddingTop: 12 },
  prayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  prayBtnActive: {
    backgroundColor: 'rgba(201, 169, 110, 0.12)',
    borderColor: 'rgba(201, 169, 110, 0.4)',
  },
  prayBtnEmoji: { fontSize: 16 },
  prayBtnText: { fontSize: 13, color: THEME.textMuted, fontWeight: '600' },
  prayBtnTextActive: { color: THEME.gold },
  prayCount: {
    fontSize: 13,
    color: THEME.textMuted,
    fontWeight: '700',
    marginLeft: 4,
  },
  prayCountActive: { color: THEME.gold },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111420',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.text },
  closeBtn: { fontSize: 18, color: THEME.textMuted, padding: 4 },
  label: { fontSize: 13, fontWeight: '600', color: THEME.textSub, marginBottom: 8 },
  input: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    marginBottom: 14,
  },
  inputMulti: { minHeight: 110, textAlignVertical: 'top' },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    backgroundColor: THEME.bg,
  },
  filterChipActive: { backgroundColor: THEME.gold, borderColor: THEME.gold },
  filterChipText: { color: THEME.textMuted, fontSize: 12, fontWeight: '500' },
  filterChipTextActive: { color: '#0A0C14', fontWeight: '700' },
  submitBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#0A0C14', fontSize: 16, fontWeight: '700' },
});
