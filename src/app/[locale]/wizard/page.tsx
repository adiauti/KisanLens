"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Stethoscope,
  Check,
  Sprout,
  Bug,
  Eye,
  Cloud,
} from "lucide-react";
import { crops } from "@/data/crops";
import {
  diagnose,
  type DiagnosisInput,
  type DiagnosisResult,
} from "@/data/diagnosis";
import { regions } from "@/data/regions";
import { weatherOptions } from "@/data/weather";
import { fileToDataUrl, analyzeImage } from "@/lib/imageAnalysis";
import { computeWeatherRisk } from "@/data/weatherRisk";
import { buildManagementPlan } from "@/lib/managementPlan";
import type {
  ImageHint,
  WeatherId,
  WeatherRisk,
  ManagementPlan,
} from "@/data/types";
import type {
  CropId,
  PlantPart,
  SymptomType,
  Condition,
  Severity,
} from "@/data/types";
import { cn } from "@/lib/utils";

type Step =
  | "crop"
  | "parts"
  | "symptoms"
  | "conditions"
  | "image"
  | "region"
  | "weather"
  | "results";

const STEPS: Step[] = [
  "crop",
  "parts",
  "symptoms",
  "conditions",
  "image",
  "region",
  "weather",
  "results",
];

export default function WizardPage() {
  const t = useTranslations("wizard");
  const tCrops = useTranslations("crops");
  const tParts = useTranslations("plantParts");
  const tSymptoms = useTranslations("symptomTypes");
  const tConditions = useTranslations("conditions");

  const [step, setStep] = useState<Step>("crop");
  const [crop, setCrop] = useState<CropId | null>(null);
  const [parts, setParts] = useState<PlantPart[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomType[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageHint, setImageHint] = useState<ImageHint | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherId | null>(null);
  const [weatherRisk, setWeatherRisk] = useState<WeatherRisk | null>(null);
  const [plan, setPlan] = useState<ManagementPlan | null>(null);
  const [aiInfo, setAiInfo] = useState<{
    source: string;
    confidence?: number;
    reason?: string;
  } | null>(null);

  const results: DiagnosisResult[] = useMemo(() => {
    if (!crop) return [];
    return diagnose({
      crop,
      affectedParts: parts,
      symptomTypes: symptoms,
      conditions,
    } as DiagnosisInput);
  }, [crop, parts, symptoms, conditions]);

  useEffect(() => {
    if (step !== "results") return;
    if (!crop) return;

    let cancelled = false;

    async function runScan() {
      setAiInfo(null);
      setWeatherRisk(null);
      setPlan(null);

      const topLocal = results[0];

      // Try server AI route if we have an image
      if (imageDataUrl) {
        try {
          const resp = await fetch("/api/scan", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              imageDataUrl,
              crop,
              symptoms,
              parts,
              conditions,
              weather,
              state: region,
              locale: "en",
            }),
          });
          const json = await resp.json();
          if (json && json.ok && !cancelled) {
            setWeatherRisk(json.result.weatherRisk);
            setPlan(json.result.plan);
            setAiInfo({
              source: json.result.source,
              confidence: json.result.aiConfidence,
              reason: json.result.aiReasoning,
            });
            return;
          }
        } catch (e) {
          // fall through to local fallback
        }
      }

      // Local fallback
      if (topLocal) {
        const wr = computeWeatherRisk(
          crop!,
          topLocal.disease,
          conditions,
          weather ?? null,
        );
        const p = buildManagementPlan(topLocal.disease, wr);
        if (!cancelled) {
          setWeatherRisk(wr);
          setPlan(p);
          setAiInfo({ source: "fallback", reason: "heuristic" });
        }
      }
    }

    runScan();
    return () => {
      cancelled = true;
    };
  }, [
    step,
    imageDataUrl,
    crop,
    symptoms,
    parts,
    conditions,
    weather,
    region,
    results,
  ]);

  const stepIdx = STEPS.indexOf(step);
  const totalSteps = STEPS.length - 1; // exclude results from "of N" count

  const goNext = () => {
    if (step === "crop" && crop) setStep("parts");
    else if (step === "parts") setStep("symptoms");
    else if (step === "symptoms") setStep("conditions");
    else if (step === "conditions") setStep("image");
    else if (step === "image") setStep("region");
    else if (step === "region") setStep("weather");
    else if (step === "weather") setStep("results");
  };

  const goPrev = () => {
    if (step === "parts") setStep("crop");
    else if (step === "symptoms") setStep("parts");
    else if (step === "conditions") setStep("symptoms");
    else if (step === "image") setStep("conditions");
    else if (step === "region") setStep("image");
    else if (step === "weather") setStep("region");
    else if (step === "results") setStep("weather");
  };

  const reset = () => {
    setStep("crop");
    setCrop(null);
    setParts([]);
    setSymptoms([]);
    setConditions([]);
    setImageDataUrl(null);
    setImageHint(null);
    setRegion(null);
    setWeather(null);
    setWeatherRisk(null);
    setPlan(null);
    setAiInfo(null);
  };

  const canProceed = () => {
    if (step === "crop") return !!crop;
    if (step === "parts") return parts.length > 0;
    if (step === "symptoms") return symptoms.length > 0;
    if (step === "conditions") return true; // conditions optional
    if (step === "image") return true; // image optional
    if (step === "region") return !!region;
    if (step === "weather") return true; // weather optional
    return false;
  };

  const toggleParts = (p: PlantPart) =>
    setParts((arr) =>
      arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p],
    );
  const toggleSymptoms = (s: SymptomType) =>
    setSymptoms((arr) =>
      arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s],
    );
  const toggleConditions = (c: Condition) =>
    setConditions((arr) =>
      arr.includes(c) ? arr.filter((x) => x !== c) : [...arr, c],
    );

  return (
    <div className="container-narrow py-8 sm:py-12">
      {/* Header */}
      <header className="mb-8 text-center">
        <span className="grid place-items-center w-14 h-14 mx-auto rounded-2xl bg-leaf-600 text-white shadow-soft mb-4">
          <Stethoscope className="w-7 h-7" />
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-leaf-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-leaf-700 max-w-2xl mx-auto">{t("subtitle")}</p>
      </header>

      {/* Progress bar */}
      {step !== "results" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-leaf-700 font-medium">
              {t("step", { current: stepIdx + 1, total: totalSteps })}
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-leaf-600 hover:text-leaf-900 inline-flex items-center gap-1 text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("restart")}
            </button>
          </div>
          <div className="h-2 rounded-full bg-leaf-100 overflow-hidden">
            <div
              className="h-full bg-leaf-600 transition-all duration-500"
              style={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="card-static p-6 sm:p-8 mb-6 min-h-[320px]">
        {step === "crop" && (
          <StepShell
            icon={<Sprout className="w-5 h-5" />}
            title={t("selectCrop")}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {crops.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCrop(c.id)}
                  className={cn(
                    "p-4 rounded-2xl text-center transition-all ring-2",
                    crop === c.id
                      ? "bg-leaf-600 text-white ring-leaf-600 shadow-cardHover scale-[1.02]"
                      : "bg-white text-leaf-900 ring-leaf-100 hover:ring-leaf-300 hover:shadow-soft",
                  )}
                >
                  <span className="text-4xl block mb-2">{c.emoji}</span>
                  <span className="font-semibold text-sm">{tCrops(c.id)}</span>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === "parts" && (
          <StepShell
            icon={<Eye className="w-5 h-5" />}
            title={t("selectAffectedPart")}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {(
                [
                  "leaves",
                  "stem",
                  "root",
                  "fruit",
                  "flower",
                  "whole",
                ] as PlantPart[]
              ).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleParts(p)}
                  className={cn(
                    "p-4 rounded-2xl text-left transition-all ring-2 flex items-center gap-3",
                    parts.includes(p)
                      ? "bg-leaf-600 text-white ring-leaf-600 shadow-soft"
                      : "bg-white text-leaf-900 ring-leaf-100 hover:ring-leaf-300",
                  )}
                >
                  <span
                    className={cn(
                      "grid place-items-center w-7 h-7 rounded-full shrink-0",
                      parts.includes(p)
                        ? "bg-white/20"
                        : "bg-leaf-100 text-leaf-700",
                    )}
                  >
                    {parts.includes(p) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-leaf-400" />
                    )}
                  </span>
                  <span className="font-medium">{tParts(p)}</span>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === "symptoms" && (
          <StepShell
            icon={<Bug className="w-5 h-5" />}
            title={t("selectSymptomType")}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
              {(
                [
                  "spots",
                  "yellowing",
                  "wilting",
                  "rot",
                  "powder",
                  "pest",
                  "deformity",
                  "blight",
                ] as SymptomType[]
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptoms(s)}
                  className={cn(
                    "p-4 rounded-2xl text-center transition-all ring-2",
                    symptoms.includes(s)
                      ? "bg-leaf-600 text-white ring-leaf-600 shadow-soft"
                      : "bg-white text-leaf-900 ring-leaf-100 hover:ring-leaf-300",
                  )}
                >
                  <span className="font-semibold text-sm">{tSymptoms(s)}</span>
                </button>
              ))}
            </div>
          </StepShell>
        )}

        {step === "conditions" && (
          <StepShell
            icon={<Cloud className="w-5 h-5" />}
            title={t("selectConditions")}
          >
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {(
                [
                  "wet",
                  "dry",
                  "cold",
                  "pestsNearby",
                  "monoculture",
                  "poorDrainage",
                ] as Condition[]
              ).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleConditions(c)}
                  className={cn(
                    "p-4 rounded-2xl text-left transition-all ring-2 flex items-center gap-3",
                    conditions.includes(c)
                      ? "bg-leaf-600 text-white ring-leaf-600 shadow-soft"
                      : "bg-white text-leaf-900 ring-leaf-100 hover:ring-leaf-300",
                  )}
                >
                  <span
                    className={cn(
                      "grid place-items-center w-7 h-7 rounded-full shrink-0",
                      conditions.includes(c)
                        ? "bg-white/20"
                        : "bg-leaf-100 text-leaf-700",
                    )}
                  >
                    {conditions.includes(c) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-leaf-400" />
                    )}
                  </span>
                  <span className="font-medium">{tConditions(c)}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-leaf-600 mt-4 italic">
              ℹ️ Conditions are optional but help refine the diagnosis.
            </p>
          </StepShell>
        )}

        {step === "image" && (
          <StepShell
            icon={<Eye className="w-5 h-5" />}
            title={t("selectImage")}
          >
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.currentTarget.files?.[0];
                  if (!f) return;
                  try {
                    const data = await fileToDataUrl(f, 1024);
                    setImageDataUrl(data);
                    setAiInfo(null);
                    try {
                      const hint = await analyzeImage(data);
                      setImageHint(hint);
                    } catch {
                      setImageHint(null);
                    }
                  } catch {
                    setImageDataUrl(null);
                    setImageHint(null);
                  }
                }}
              />
              {imageDataUrl ? (
                <div className="w-full max-w-sm">
                  <img
                    src={imageDataUrl}
                    alt={t("selectImage")}
                    className="w-full rounded-md shadow-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(null)}
                      className="btn-secondary"
                    >
                      {t("imageRetake")}
                    </button>
                    {imageHint && (
                      <div className="text-xs text-leaf-600 ml-auto">
                        <div>Hue: {imageHint.hue}</div>
                        <div>Brown: {Math.round(imageHint.brown * 100)}%</div>
                        <div>Yellow: {Math.round(imageHint.yellow * 100)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-leaf-600">{t("imageHelp")}</p>
              )}
            </div>
          </StepShell>
        )}

        {step === "region" && (
          <StepShell
            icon={<Cloud className="w-5 h-5" />}
            title={t("selectRegion")}
          >
            <div>
              <label className="sr-only">{t("selectRegion")}</label>
              <select
                value={region ?? ""}
                onChange={(e) => setRegion(e.target.value || null)}
                className="w-full p-3 bg-white rounded-2xl ring-1 ring-leaf-100"
              >
                <option value="">— {t("searchRegion")} —</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameEn}
                  </option>
                ))}
              </select>
              <p className="text-xs text-leaf-600 mt-3">{t("regionHelp")}</p>
            </div>
          </StepShell>
        )}

        {step === "weather" && (
          <StepShell
            icon={<Cloud className="w-5 h-5" />}
            title={t("selectWeather")}
          >
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
              {weatherOptions.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWeather(w.id)}
                  className={cn(
                    "p-4 rounded-2xl text-center transition-all ring-2",
                    weather === w.id
                      ? "bg-leaf-600 text-white ring-leaf-600 shadow-soft"
                      : "bg-white text-leaf-900 ring-leaf-100 hover:ring-leaf-300",
                  )}
                >
                  <div className="text-2xl">{w.emoji}</div>
                  <div className="font-medium text-sm mt-1">
                    {t(`weather.${w.labelKey}`)}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-leaf-600 mt-4">{t("weatherHelp")}</p>
          </StepShell>
        )}

        {step === "results" && (
          <Results
            results={results}
            weatherRisk={weatherRisk}
            plan={plan}
            aiInfo={aiInfo}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={step === "crop"}
          className="btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("previous")}
        </button>
        {step !== "results" && (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed()}
            className="btn-primary"
          >
            {t("next")}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === "results" && (
          <button type="button" onClick={reset} className="btn-primary">
            <RotateCcw className="w-4 h-4" />
            {t("restart")}
          </button>
        )}
      </div>
    </div>
  );
}

function StepShell({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl font-bold text-leaf-900 mb-5 flex items-center gap-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-leaf-100 text-leaf-700">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Results({
  results,
  weatherRisk,
  plan,
  aiInfo,
}: {
  results: DiagnosisResult[];
  weatherRisk?: WeatherRisk | null;
  plan?: ManagementPlan | null;
  aiInfo?: { source: string; confidence?: number; reason?: string } | null;
}) {
  const t = useTranslations("wizard");

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="grid place-items-center w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 mb-4">
          <Bug className="w-8 h-8" />
        </div>
        <h2 className="font-display text-xl font-bold text-leaf-900 mb-2">
          {t("resultTitle")}
        </h2>
        <p className="text-leaf-700 max-w-md mx-auto">{t("resultEmpty")}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl sm:text-2xl font-bold text-leaf-900 mb-1">
        {t("resultTitle")}
      </h2>
      <p className="text-leaf-700 mb-6">{t("resultSubtitle")}</p>

      {/* Top match — featured */}
      <div className="mb-6">
        <ResultCard result={results[0]} featured />
      </div>

      {/* Weather risk + AI info */}
      {weatherRisk && (
        <div className="mb-4 p-4 rounded-lg bg-leaf-50">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{t("weatherRisk")}</div>
            <div className="text-sm">{t(`riskLevel.${weatherRisk.level}`)}</div>
          </div>
          <div className="text-xs text-leaf-600 mt-2">
            {weatherRisk.reasons.join(" ")}
          </div>
        </div>
      )}

      {aiInfo && (
        <div className="text-xs text-leaf-600 mb-3">
          {aiInfo.source === "vision"
            ? t("aiSource.vision")
            : t("aiSource.fallback", { reason: aiInfo.reason })}
        </div>
      )}

      {/* Management plan */}
      {plan && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">{t("planTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-white rounded-2xl shadow-card">
              <div className="font-medium text-sm mb-2">
                {t("planImmediate")}
              </div>
              <ul className="text-sm list-disc ml-4">
                {plan.immediate.map((p1, i) => (
                  <li key={i}>{p1}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-card">
              <div className="font-medium text-sm mb-2">
                {t("planCultural")}
              </div>
              <ul className="text-sm list-disc ml-4">
                {plan.cultural.map((p1, i) => (
                  <li key={i}>{p1}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div className="p-4 bg-white rounded-2xl shadow-card">
              <div className="font-medium text-sm mb-2">
                {t("planBiological")}
              </div>
              <ul className="text-sm list-disc ml-4">
                {plan.biological.map((p1, i) => (
                  <li key={i}>{p1}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-card">
              <div className="font-medium text-sm mb-2">
                {t("planChemical")}
              </div>
              <ul className="text-sm list-disc ml-4">
                {plan.chemical.map((p1, i) => (
                  <li key={i}>{p1}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <div className="font-medium">{t("planPrevention")}</div>
            <ul className="list-disc ml-4 mt-2">
              {plan.prevention.map((p1, i) => (
                <li key={i}>{p1}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-leaf-600">
              {t("planMonitoring")}
            </div>
            <ul className="list-disc ml-4 mt-2 text-sm">
              {plan.monitoring.map((p1, i) => (
                <li key={i}>{p1}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-leaf-600">
              {t("followUpIn", { days: plan.followUpDays })}
            </div>
          </div>
        </div>
      )}
      {/* Other matches */}
      {results.length > 1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.slice(1).map((r) => (
            <ResultCard key={r.disease.id} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  result,
  featured = false,
}: {
  result: DiagnosisResult;
  featured?: boolean;
}) {
  const t = useTranslations("wizard");
  const tCrops = useTranslations("crops");
  const tSeverity = useTranslations("severity");
  const pct = Math.round(result.score * 100);

  const SEVERITY_COLOR: Record<Severity, string> = {
    low: "bg-emerald-100 text-emerald-800",
    moderate: "bg-amber-100 text-amber-800",
    high: "bg-orange-100 text-orange-800",
    severe: "bg-red-100 text-red-800",
  };

  return (
    <Link
      href={`/library/${result.disease.id}`}
      className={cn(
        "block rounded-2xl ring-2 ring-leaf-100 hover:ring-leaf-400 transition-all overflow-hidden",
        featured ? "bg-white shadow-cardHover" : "bg-white shadow-card",
      )}
    >
      <div className={cn("p-5", featured && "border-b border-leaf-100")}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className={cn(
              "chip",
              SEVERITY_COLOR[result.disease.severity as Severity],
            )}
          >
            {tSeverity(result.disease.severity)}
          </span>
          <span className="text-xs text-leaf-600 font-medium">
            {tCrops(result.disease.crop)}
          </span>
        </div>

        <h3
          className={cn(
            "font-display font-bold text-leaf-900",
            featured ? "text-2xl" : "text-lg",
          )}
        >
          {result.disease.name}
        </h3>
        <p className="text-xs text-leaf-600 mt-1">{result.disease.pathogen}</p>
        <p className="mt-3 text-sm text-leaf-700 leading-relaxed">
          {result.disease.shortDesc}
        </p>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-leaf-600 font-medium">{t("confidence")}</span>
            <span className="font-bold text-leaf-700">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-leaf-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                pct >= 70
                  ? "bg-leaf-600"
                  : pct >= 40
                    ? "bg-amber-500"
                    : "bg-amber-300",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-leaf-700 font-medium flex items-center gap-1">
          {t("seeDetails")}
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </Link>
  );
}
