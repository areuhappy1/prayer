# Grace — 크리스천 기도 앱

말씀 묵상 · 개인화 기도문 · 중보기도 커뮤니티를 하나의 앱에서.

## 폴더 구조

```
├── App.tsx
├── app.json
├── server/index.mjs          # Anthropic API 프록시 (로컬/배포)
├── constants/theme.ts
├── services/
│   ├── api.ts                # EXPO_PUBLIC_API_URL 로 프록시 호출
│   ├── storage.ts            # AsyncStorage (무료 1회, 기도 일기, 구독 플래그)
│   ├── purchases.ts          # RevenueCat(선택) + 개발용 폴백
│   └── intercessory.ts       # 중보 피드 샘플 데이터 (추후 API 교체)
├── screens/
│   ├── HomeScreen.tsx        # saju-kid 스타일 홈 · 서비스 카드
│   ├── BibleScreen.tsx
│   ├── PrayerScreen.tsx
│   └── IntercessoryScreen.tsx
└── types/
```

## 설치 및 실행

```bash
npm install
```

### 1) Anthropic 프록시 서버

앱은 **클라이언트에 API 키를 넣지 않습니다.** 루트에 `.env`를 만들고 서버 전용 키를 설정합니다.

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

```bash
npm run server
```

### 2) 앱 환경 변수

`.env` (Expo가 `EXPO_PUBLIC_*` 로 주입):

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
# Android 에뮬레이터에서 PC 로컬호스트: http://10.0.2.2:3001
# 선택: RevenueCat 공개 키 (네이티브 빌드)
# EXPO_PUBLIC_REVENUECAT_API_KEY=
# 선택: 이용약관 URL
# EXPO_PUBLIC_TERMS_URL=https://your-domain.com/terms
```

```bash
npx expo start
```

## 주요 기능

- **홈**: 배너 + 서비스 카드, 헌금 안내 문구
- **오늘의 말씀**: 날짜 시드 기준 오늘 구절, 무드 칩, 상황별 AI 해석
- **기도문**: 무드·대상·톤·시간대 반영, JSON 구조 응답(말씀 인용 + 기도), 1회 무료·구독 페이월, 기도 일기, TTS, 텍스트/이미지 공유·앨범 저장
- **중보기도방**: 카테고리 탭, 카드 피드, 「함께 기도했습니다」 버튼·카운트·애니메이션
- **구독**: `react-native-purchases` + 개발 시 `__DEV__` 에서 구매 버튼 폴백(자세한 내용은 `services/purchases.ts`)

## 검증

```bash
npx tsc --noEmit
```
