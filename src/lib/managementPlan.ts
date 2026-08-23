import type { Disease, ManagementPlan, RiskLevel, WeatherRisk } from '@/data/types';

/**
 * Given the top diagnosis + a weather-risk score, build a structured
 * 4-section implementation plan for the farmer. Re-uses fields already
 * present on the Disease object (organicTreatment, chemicalTreatment,
 * prevention) and adds immediate + monitoring actions generated from
 * severity + risk.
 */
export function buildManagementPlan(
  disease: Disease,
  risk: WeatherRisk
): ManagementPlan {
  // Cultural = first half of prevention (field-practice items)
  // Biological = organicTreatment
  // Chemical = chemicalTreatment
  // Prevention = full prevention list
  const half = Math.ceil(disease.prevention.length / 2);
  const cultural = disease.prevention.slice(0, half);
  const biological = [...disease.organicTreatment];
  const chemical = [...disease.chemicalTreatment];
  const prevention = [...disease.prevention];

  const immediate = buildImmediate(disease.severity, risk.level, risk.reasons);
  const monitoring = buildMonitoring(disease, risk.level);
  const followUpDays = followUpInterval(disease.severity, risk.level);

  return {
    immediate,
    cultural,
    biological,
    chemical,
    prevention,
    monitoring,
    followUpDays,
  };
}

function buildImmediate(
  severity: Disease['severity'],
  level: RiskLevel,
  riskReasons: string[]
): string[] {
  const out: string[] = [];

  // Universal hygiene
  out.push('Wash hands, tools and footwear before moving to other fields.');

  if (severity === 'severe' || level === 'severe') {
    out.push('Within 24 hours: remove and destroy the most severely affected plants/leaves (do not compost).');
    out.push('Isolate the affected patch — avoid walking through it and restrict equipment movement.');
  } else if (severity === 'high' || level === 'high') {
    out.push('Within 48 hours: prune and destroy visibly infected leaves and fruit.');
  } else {
    out.push('Within 48 hours: mark affected plants and start a daily walk-through to track spread.');
  }

  if (level === 'severe' || level === 'high') {
    out.push('Pause overhead irrigation; switch to drip or flood-furrow to keep foliage dry.');
  }

  // Weather-driven adds
  for (const r of riskReasons) {
    if (/wet|humid|rain/i.test(r)) {
      out.push('Improve field drainage and reduce canopy humidity — wider spacing or light pruning.');
      break;
    }
  }

  return out;
}

function buildMonitoring(disease: Disease, level: RiskLevel): string[] {
  const out: string[] = [
    `Re-inspect the same plants every 2–3 days for the next two weeks.`,
    `Photograph any new symptoms and re-run the scan to compare progression.`,
  ];
  if (level === 'severe' || level === 'high') {
    out.push('Check neighbouring fields and adjacent rows — many of these diseases spread from the edge inward.');
  }
  if (disease.pathogen.toLowerCase().includes('insect')) {
    out.push('Set up pheromone / yellow / blue sticky traps to track adult population.');
  }
  if (disease.affectedParts.includes('fruit') || disease.affectedParts.includes('flower')) {
    out.push('Inspect flowers and young fruit at each visit; note any drop or distortion.');
  }
  return out;
}

function followUpInterval(severity: Disease['severity'], level: RiskLevel): number {
  if (severity === 'severe' || level === 'severe') return 3;
  if (severity === 'high' || level === 'high') return 5;
  if (severity === 'moderate' || level === 'moderate') return 7;
  return 10;
}
