export type ChildAgeCategory = 
  | 'under_2'
  | '2_3'
  | '4_5'
  | '6_7'
  | '8_10'
  | '11_13'
  | '14_plus';

export type DailyScreenTimeOption = 
  | 'less_than_30m'
  | '30_60m'
  | '1_2h'
  | '2_3h'
  | '3_4h'
  | '4_6h'
  | '6h_plus'
  | 'not_sure';

export type ContentCategoryId =
  | 'nursery_rhymes'
  | 'educational'
  | 'creative_crafts'
  | 'cartoons_shows'
  | 'games_gaming'
  | 'comedy_memes_shorts'
  | 'general_entertainment'
  | 'scary_horror'
  | 'profanity_vulgar'
  | 'sexualized_content'
  | 'violence_fighting'
  | 'influencers_social'
  | 'not_sure'
  | 'something_else';

export type InappropriateExposureFrequency =
  | 'never'
  | 'rarely'
  | 'sometimes'
  | 'often'
  | 'very_often'
  | 'not_sure';

export type ScreenTimeTiming =
  | 'before_school'
  | 'after_school'
  | 'during_meals'
  | 'before_bedtime'
  | 'during_travel'
  | 'when_bored'
  | 'when_upset'
  | 'throughout_day';

export type TransitionReaction =
  | 'stops_easily'
  | 'asks_for_more'
  | 'becomes_frustrated'
  | 'gets_very_upset'
  | 'frequent_tantrums'
  | 'it_varies';

export type OffScreenActivity =
  | 'outdoor_play'
  | 'reading'
  | 'creative_activities'
  | 'social_family'
  | 'hobbies'
  | 'not_much_currently';

export type RiskLevel = 'low' | 'moderate' | 'elevated';

export interface DevelopmentalDomainRisk {
  domain: string;
  icon: string;
  level: RiskLevel;
  summary: string;
  researchBasis: string;
  evidenceType: 'Known Evidence' | 'Statistical Association' | 'Individual Risk Factor';
}

export interface ResearchCitation {
  id: string;
  title: string;
  source: string;
  year: number;
  keyFinding: string;
  url?: string;
}

export interface AssessmentAnswers {
  childName?: string;
  ageCategory: ChildAgeCategory | null;
  dailyScreenTime: DailyScreenTimeOption | null;
  estimatedHoursNumber: number; // resolved numeric estimate (e.g., 2.5)
  contentCategories: ContentCategoryId[];
  customContentText?: string;
  inappropriateExposure: InappropriateExposureFrequency | null;
  // Optional context
  usageTimings: ScreenTimeTiming[];
  transitionReaction: TransitionReaction | null;
  offScreenActivities: OffScreenActivity[];
}

export type MonsterTypeId = 
  | 'friendly_ghost'
  | 'shadow_monster'
  | 'friendly_vampire'
  | 'cozy_zombie'
  | 'cyber_alien'
  | 'star_dragon'
  | 'pumpkin_buddy'
  | 'custom_monster';

export interface MonsterProfile {
  id: MonsterTypeId;
  name: string;
  badge: string;
  emoji: string;
  color: string;
  description: string;
  soundEffect: string;
  dialogue: string;
}

export type SwitchOffStyleId = 
  | 'low_battery'
  | 'cooldown'
  | 'needs_rest'
  | 'battery_empty'
  | 'screen_fade'
  | 'power_off';

export interface SwitchOffProfile {
  id: SwitchOffStyleId;
  title: string;
  badge: string;
  icon: string;
  color: string;
  description: string;
  stages: string[];
}
