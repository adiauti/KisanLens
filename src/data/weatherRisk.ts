import type { CropId, Condition, Disease, WeatherId, WeatherRisk } from './types';

/**
 * Map a Disease.conditions + the selected WeatherId onto the disease's
 * preferred environment. Each disease is more or less active in:
 *   - 'wet'  (rainy / humid)
 *   - 'cold' (cool_dry)
 *   - 'dry'  (hot_dry)
 *   - 'pestsNearby'
 *   - 'monoculture'
 *   - 'poorDrainage'
 */
const WEATHER_AFFINITY: Record<WeatherId, Condition[]> = {
  humid: ['wet', 'pestsNearby', 'poorDrainage'],
  rainy: ['wet', 'poorDrainage'],
  hot_dry: ['dry', 'pestsNearby'],
  cool_dry: ['cold'],
  normal: [],
};

/** Current month as 1-12. */
function currentMonth(): number {
  return new Date().getMonth() + 1;
}

function cropBestSeasonMonths(crop: CropId, month: number): { inSeason: boolean; weight: number } {
  // Re-use the same sowing/harvest heuristic that the disease bestSeason uses.
  // Kharif = Jun-Oct (6-10), Rabi = Nov-Mar (11,12,1,2,3), Zaid = Mar-Jun (3,4,5,6).
  const kharif = [6, 7, 8, 9, 10];
  const rabi = [11, 12, 1, 2, 3];
  const zaid = [3, 4, 5, 6];
  if (kharif.includes(month)) return { inSeason: true, weight: 0.6 };
  if (rabi.includes(month)) return { inSeason: true, weight: 0.6 };
  if (zaid.includes(month)) return { inSeason: true, weight: 0.4 };
  return { inSeason: false, weight: 0 };
}

function levelFromScore(score: number): WeatherRisk['level'] {
  if (score >= 0.75) return 'severe';
  if (score >= 0.5) return 'high';
  if (score >= 0.25) return 'moderate';
  return 'low';
}

/**
 * Compute a 0-1 risk score given the user's selected weather and the
 * top-matched disease. Higher = more urgent.
 *
 * The score combines:
 *  - Whether the selected weather matches disease-favouring conditions (40%)
 *  - Whether the current month is in the crop's typical disease window (20%)
 *  - The disease's own severity (20%)
 *  - Number of user-selected conditions that match (20%)
 */
export function computeWeatherRisk(
  crop: CropId,
  disease: Disease,
  conditions: Condition[],
  weather: WeatherId | null
): WeatherRisk {
  const reasons: string[] = [];
  let score = 0;

  // (1) Weather affinity
  const affinity = WEATHER_AFFINITY[weather ?? 'normal'];
  let affinityHits = 0;
  for (const c of affinity) {
    if (disease.conditions.includes(c)) {
      affinityHits++;
      reasons.push(`Weather favours ${humanCondition(c)}.`);
    }
  }
  const affinityScore = Math.min(1, affinityHits / 2); // 2+ matches = max
  score += affinityScore * 0.4;

  // (2) Seasonal timing for the crop
  const month = currentMonth();
  const season = cropBestSeasonMonths(crop, month);
  if (season.inSeason) {
    score += season.weight * 0.2;
    reasons.push('Current month is within the active crop-disease window.');
  }

  // (3) Disease severity
  const severityWeight: Record<Disease['severity'], number> = {
    low: 0.1,
    moderate: 0.4,
    high: 0.7,
    severe: 1,
  };
  score += severityWeight[disease.severity] * 0.2;
  if (disease.severity === 'severe' || disease.severity === 'high') {
    reasons.push(`Disease severity is ${disease.severity}.`);
  }

  // (4) User-selected conditions that also appear on the disease
  const userCondHits = conditions.filter((c) => disease.conditions.includes(c)).length;
  const condScore = Math.min(1, userCondHits / 2);
  score += condScore * 0.2;
  if (userCondHits > 0) {
    reasons.push(`${userCondHits} field condition${userCondHits > 1 ? 's' : ''} match the disease profile.`);
  }

  const clamped = Math.max(0, Math.min(1, score));
  return {
    score: clamped,
    level: levelFromScore(clamped),
    reasons: reasons.length > 0 ? reasons : ['No major risk multipliers active.'],
  };
}

function humanCondition(c: Condition): string {
  switch (c) {
    case 'wet':
      return 'wet, humid weather';
    case 'dry':
      return 'dry, hot conditions';
    case 'cold':
      return 'cool weather';
    case 'pestsNearby':
      return 'local pest activity';
    case 'monoculture':
      return 'continuous cropping';
    case 'poorDrainage':
      return 'waterlogged soil';
  }
}
