/**
 * 중보기도방 데이터 레이어.
 * 추후 REST/Supabase 등으로 교체할 때 이 파일의 fetch 함수만 구현하면 됩니다.
 */

export type PrayerPost = {
  id: string;
  author: string;
  category: string;
  title: string;
  content: string;
  prayerCount: number;
  hasPrayed: boolean;
  timeAgo: string;
  emoji: string;
};

export const INITIAL_POSTS: PrayerPost[] = [
  {
    id: '1',
    author: '은혜 집사',
    category: '건강',
    title: '어머니의 수술을 위해 기도 부탁드립니다',
    content:
      '다음 주 월요일 어머니의 무릎 수술이 있습니다. 하나님께서 의사 선생님의 손을 붙드시고 무사히 수술이 잘 이루어지도록, 그리고 빠른 회복을 위해 기도 부탁드립니다 🙏',
    prayerCount: 47,
    hasPrayed: false,
    timeAgo: '2시간 전',
    emoji: '💊',
  },
  {
    id: '2',
    author: '소망 집사',
    category: '진로',
    title: '취업 준비 중입니다 — 하나님의 인도하심을',
    content:
      '반년 째 취업 준비 중입니다. 낙담이 될 때도 있지만 주님께서 예비해 두신 곳이 있을 것을 믿고 나아갑니다. 기도로 함께해 주세요.',
    prayerCount: 82,
    hasPrayed: true,
    timeAgo: '5시간 전',
    emoji: '🧭',
  },
  {
    id: '3',
    author: '감사한 형제',
    category: '감사',
    title: '아들이 건강하게 태어났습니다! 🎉',
    content:
      '많은 분들이 함께 기도해 주셔서 3.5kg 건강한 아들이 태어났습니다. 하나님께 감사와 영광을 돌립니다! 함께 기도해 주신 모든 분들께 감사드립니다 ❤️',
    prayerCount: 134,
    hasPrayed: false,
    timeAgo: '1일 전',
    emoji: '🎉',
  },
  {
    id: '4',
    author: '믿음 권사',
    category: '가족',
    title: '남편의 회심을 위해 10년째 기도하고 있습니다',
    content:
      '오랜 시간 남편의 구원을 위해 기도해 왔습니다. 포기하고 싶을 때도 있지만 하나님의 때가 있음을 믿습니다. 함께 기도해 주시겠어요?',
    prayerCount: 213,
    hasPrayed: false,
    timeAgo: '1일 전',
    emoji: '💍',
  },
  {
    id: '5',
    author: '선교사 박 집사',
    category: '나라/세계',
    title: '전쟁 지역의 형제자매들을 위해',
    content:
      '분쟁 지역에서 사역하고 있습니다. 이곳의 어린이들과 피난민들을 위해, 그리고 평화를 위해 기도 부탁드립니다.',
    prayerCount: 389,
    hasPrayed: false,
    timeAgo: '2일 전',
    emoji: '🌍',
  },
];
