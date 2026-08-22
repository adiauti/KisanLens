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
