/**
 * Unit tests for AdvisoryEngine.ts
 *
 * Run with: npx jest (after `npm install` in the agrivoice directory)
 */

import { format, subDays, addDays } from "date-fns";
import {
  detectGrowthStage,
  getAdvisory,
  getStageProgress,
  parseVoiceCommand,
  getPestAdvisory,
  selectText,
} from "../services/AdvisoryEngine";

// Helper: ISO date string N days ago / ahead
const daysAgo = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");
const daysAhead = (n: number) => format(addDays(new Date(), n), "yyyy-MM-dd");

// ─── detectGrowthStage ────────────────────────────────────────────────────────

describe("detectGrowthStage — maize (90-day cycle)", () => {
  it("returns land_prep when planting is 10 days in the future", () => {
    expect(detectGrowthStage("maize", daysAhead(10))).toBe("land_prep");
  });

  it("returns planting when planted 3 days ago", () => {
    expect(detectGrowthStage("maize", daysAgo(3))).toBe("planting");
  });

  it("returns vegetative when planted 20 days ago", () => {
    expect(detectGrowthStage("maize", daysAgo(20))).toBe("vegetative");
  });

  it("returns flowering when planted 50 days ago", () => {
    expect(detectGrowthStage("maize", daysAgo(50))).toBe("flowering");
  });

  it("returns harvest when planted 88 days ago", () => {
    expect(detectGrowthStage("maize", daysAgo(88))).toBe("harvest");
  });
});

describe("detectGrowthStage — pineapple (540-day cycle, 6× scale)", () => {
  // pineapple scale = 540/90 = 6
  // vegetative startDayOffset = 8 * 6 = 48 days
  it("returns planting at 20 days", () => {
    expect(detectGrowthStage("pineapple", daysAgo(20))).toBe("planting");
  });

  it("returns vegetative at 60 days", () => {
    expect(detectGrowthStage("pineapple", daysAgo(60))).toBe("vegetative");
  });

  it("returns harvest at 520 days", () => {
    expect(detectGrowthStage("pineapple", daysAgo(520))).toBe("harvest");
  });
});

describe("detectGrowthStage — cassava (270-day cycle, 3× scale)", () => {
  // flowering startOffset = 46 * 3 = 138 days
  it("returns vegetative at 50 days", () => {
    expect(detectGrowthStage("cassava", daysAgo(50))).toBe("vegetative");
  });

  it("returns flowering at 150 days", () => {
    expect(detectGrowthStage("cassava", daysAgo(150))).toBe("flowering");
  });
});

// ─── getAdvisory ──────────────────────────────────────────────────────────────

describe("getAdvisory — maize", () => {
  it("returns a result with advice_en for the planting stage", () => {
    const result = getAdvisory("maize", daysAgo(3), "en");
    expect(result).not.toBeNull();
    expect(result!.stage).toBe("planting");
    expect(result!.advisory.advice_en).toBeTruthy();
    expect(result!.advisory.crop).toBe("maize");
  });

  it("returns Swahili text when language is sw", () => {
    const result = getAdvisory("maize", daysAgo(3), "sw");
    expect(result!.spokenText).toBe(result!.advisory.advice_sw);
  });

  it("returns Hausa text when language is ha", () => {
    const result = getAdvisory("maize", daysAgo(3), "ha");
    expect(result!.spokenText).toBe(result!.advisory.advice_ha);
  });

  it("returns daysSincePlanting close to 3", () => {
    const result = getAdvisory("maize", daysAgo(3), "en");
    expect(result!.daysSincePlanting).toBeGreaterThanOrEqual(2);
    expect(result!.daysSincePlanting).toBeLessThanOrEqual(4);
  });

  it("applies dry weather override for arid location at planting", () => {
    const dryLocation = {
      country: "Niger",
      region: "Sahel",
      climateZone: "arid" as const,
    };
    const normal = getAdvisory("maize", daysAgo(3), "en");
    const withOverride = getAdvisory("maize", daysAgo(3), "en", dryLocation);
    // Maize planting has a dry weatherTrigger — advice should differ
    expect(withOverride!.advisory.advice_en).not.toBe(normal!.advisory.advice_en);
  });

  it("returns null for an unknown crop", () => {
    // @ts-expect-error — testing runtime safety
    expect(getAdvisory("unknown_crop", daysAgo(3), "en")).toBeNull();
  });

  it("fetches pest_disease advisory via stageOverride", () => {
    const result = getAdvisory("maize", daysAgo(3), "en", undefined, "pest_disease");
    expect(result).not.toBeNull();
    expect(result!.stage).toBe("pest_disease");
    expect(result!.advisory.id).toBe("maize_pest_disease");
  });
});

describe("getAdvisory — all 5 crops return data", () => {
  const crops = ["maize", "rice", "cassava", "pineapple", "sorghum"] as const;

  crops.forEach((crop) => {
    it(`returns a non-null result for ${crop}`, () => {
      const result = getAdvisory(crop, daysAgo(5), "en");
      expect(result).not.toBeNull();
      expect(result!.advisory.crop).toBe(crop);
    });
  });
});

// ─── getStageProgress ─────────────────────────────────────────────────────────

describe("getStageProgress", () => {
  it("returns 0% complete for future planting", () => {
    const p = getStageProgress("maize", daysAhead(10));
    expect(p.percentComplete).toBe(0);
  });

  it("returns > 0% complete for established crop", () => {
    const p = getStageProgress("maize", daysAgo(40));
    expect(p.percentComplete).toBeGreaterThan(0);
  });

  it("caps at 100% for very old planting dates", () => {
    const p = getStageProgress("maize", daysAgo(200));
    expect(p.percentComplete).toBe(100);
  });

  it("returns correct stage index for vegetative stage", () => {
    const p = getStageProgress("maize", daysAgo(20));
    expect(p.currentStage).toBe("vegetative");
    expect(p.stageIndex).toBe(2); // land_prep=0, planting=1, vegetative=2
  });
});

// ─── parseVoiceCommand ────────────────────────────────────────────────────────

describe("parseVoiceCommand", () => {
  it("recognises 'advice' in English", () => {
    expect(parseVoiceCommand("give me advice")).toBe("get_advice");
  });

  it("recognises Swahili 'ushauri'", () => {
    expect(parseVoiceCommand("nataka ushauri")).toBe("get_advice");
  });

  it("recognises Hausa 'shawarar'", () => {
    expect(parseVoiceCommand("ina buƙatar shawarar")).toBe("get_advice");
  });

  it("recognises 'pest' intent", () => {
    expect(parseVoiceCommand("I see a pest")).toBe("identify_pest");
  });

  it("recognises 'wadudu' (Swahili pest)", () => {
    expect(parseVoiceCommand("kuna wadudu")).toBe("identify_pest");
  });

  it("recognises language change to Swahili", () => {
    expect(parseVoiceCommand("switch to kiswahili")).toBe("change_language_sw");
  });

  it("recognises language change to Hausa", () => {
    expect(parseVoiceCommand("speak hausa")).toBe("change_language_ha");
  });

  it("returns 'unknown' for empty string", () => {
    expect(parseVoiceCommand("")).toBe("unknown");
  });

  it("returns 'unknown' for unrecognised phrase", () => {
    expect(parseVoiceCommand("hello world xyz")).toBe("unknown");
  });
});

// ─── getPestAdvisory ──────────────────────────────────────────────────────────

describe("getPestAdvisory", () => {
  it("returns fall_armyworm data for maize", () => {
    const r = getPestAdvisory("maize", "fall_armyworm", "en");
    expect(r).not.toBeNull();
    expect(r!.pest.name_en).toContain("Armyworm");
    expect(r!.treatmentText).toBeTruthy();
    expect(r!.symptomsText).toBeTruthy();
  });

  it("returns Swahili treatment for stem_borer", () => {
    const r = getPestAdvisory("maize", "stem_borer", "sw");
    expect(r!.treatmentText).toBe(r!.pest.treatment_sw);
  });

  it("returns null for unknown pest label", () => {
    expect(getPestAdvisory("maize", "nonexistent_pest", "en")).toBeNull();
  });

  it("returns rice_blast for rice", () => {
    const r = getPestAdvisory("rice", "rice_blast", "en");
    expect(r).not.toBeNull();
    expect(r!.pest.name_en).toContain("Blast");
  });

  it("returns cassava_mosaic for cassava", () => {
    const r = getPestAdvisory("cassava", "cassava_mosaic", "ha");
    expect(r).not.toBeNull();
    expect(r!.treatmentText).toBe(r!.pest.treatment_ha);
  });
});

// ─── selectText ───────────────────────────────────────────────────────────────

describe("selectText", () => {
  const advisory = {
    advice_en: "English text",
    advice_sw: "Swahili text",
    advice_ha: "Hausa text",
  } as any;

  it("returns en text", () => expect(selectText(advisory, "en")).toBe("English text"));
  it("returns sw text", () => expect(selectText(advisory, "sw")).toBe("Swahili text"));
  it("returns ha text", () => expect(selectText(advisory, "ha")).toBe("Hausa text"));
});
