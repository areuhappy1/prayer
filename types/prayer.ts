export type PrayerHistoryItem = {
  id: string;
  date: string;
  target: string;
  moods: string;
  verseReference: string;
  verseQuote: string;
  prayer: string;
  answered: boolean;
};

export type PrayerGenerationJson = {
  verseReference: string;
  verseQuote: string;
  prayer: string;
};
