// Domain types for crops, diseases, and the diagnosis wizard

export type CropId =
  | 'rice'
  | 'wheat'
  | 'maize'
  | 'cotton'
  | 'sugarcane'
  | 'tomato'
  | 'potato'
  | 'chili';

export type SymptomType =
  | 'spots'
  | 'yellowing'
  | 'wilting'
  | 'rot'
  | 'powder'
  | 'pest'
  | 'deformity'
  | 'blight';

export type PlantPart =
  | 'leaves'
  | 'stem'
  | 'root'
  | 'fruit'
  | 'flower'
  | 'whole';

export type Condition =
  | 'wet'
  | 'dry'
  | 'cold'
  | 'pestsNearby'
  | 'monoculture'
  | 'poorDrainage';

export type Season = 'kharif' | 'rabi' | 'zaid' | 'year-round';

export type Severity = 'low' | 'moderate' | 'high' | 'severe';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export type WeatherId = 'humid' | 'rainy' | 'hot_dry' | 'cool_dry' | 'normal';

export interface Region {
  id: string; // ISO-like slug, e.g. 'IN-MH'
  nameEn: string;
  nameHi: string;
}

export interface WeatherRisk {
  score: number; // 0-1
  level: RiskLevel;
  reasons: string[]; // short human-readable reasons in English
}

export interface ImageHint {
  /** Approximate brown-spot coverage (0-1) — typical of fungal lesions */
  brown: number;
  /** Approximate yellow / chlorotic coverage (0-1) */
  yellow: number;
  /** Approximate white / powdery coverage (0-1) */
  white: number;
  /** Average brightness 0-1 — proxy for "leaf vs background" */
  brightness: number;
  /** Dominant hue family: 'green' | 'yellow' | 'brown' | 'mixed' */
  hue: 'green' | 'yellow' | 'brown' | 'mixed';
}

export interface ManagementPlan {
  immediate: string[]; // do these within 24-48h
  cultural: string[]; // field-practice changes
  biological: string[]; // biocontrol / organic options
  chemical: string[]; // approved chemical options
  prevention: string[]; // next-season / ongoing prevention
  monitoring: string[]; // what to watch for in the next 7-14 days
  followUpDays: number; // suggested re-scan interval
}

export interface SeasonMonth {
  month: number; // 1-12
  tip: string;
}

export interface Disease {
  id: string;
  name: string; // English fallback
  crop: CropId;
  pathogen: string; // e.g. "Fungal", "Bacterial", "Viral", "Insect"
  severity: Severity;
  bestSeason: Season;
  affectedParts: PlantPart[];
  symptomTypes: SymptomType[];
  /** Conditions that increase likelihood */
  conditions: Condition[];
  /** Bullet points used both in checklist and on detail page */
  symptoms: string[];
  causes: string;
  organicTreatment: string[];
  chemicalTreatment: string[];
  prevention: string[];
  /** 1-2 sentence description used on cards */
  shortDesc: string;
}

export interface Crop {
  id: CropId;
  emoji: string;
  image: string;
  shortDesc: string;
  /** Typical sowing & harvest months for seasonal advisory */
  sowingMonths: number[];
  harvestMonths: number[];
  season: Season;
}
