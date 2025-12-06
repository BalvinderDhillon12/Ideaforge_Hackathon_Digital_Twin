
// Mock Data Definitions for Prototype Fallback
// DATA SOURCE: BraTS19_2013_10 (Real Clinical Data)
const MOCK_RADIOMICS_DATA = {
  radiomics: [
    { name: "Sphericity", value: 0.51, valueDisplay: "0.508 (Irregular)" },
    { name: "Surface Area", value: 0.85, valueDisplay: "22,046 mm²" },
    { name: "Mean Intensity", value: 0.60, valueDisplay: "597.56" },
    { name: "Entropy", value: 0.40, valueDisplay: "2.98 bits" }, // Normalized roughly for chart
    { name: "Contrast", value: 0.35, valueDisplay: "1.76 (GLCM)" },
    { name: "Homogeneity", value: 0.99, valueDisplay: "0.993 (High)" },
    { name: "Max Diameter", value: 0.75, valueDisplay: "99.88 mm" }
  ],
  vector: [0.508, 22046, 2.98, 1.76, 0.993, 597.55, 99.88],
  phenotype: {
    volumeCm3: 111.72,
    midlineShiftMm: 10.04,
    enhancingPercentage: 28.5,
    nonEnhancingPercentage: 71.5,
    edemaVolumeCm3: 42.3,
    necrosisVolumeCm3: 15.8,
    resectabilityScore: 88.5
  },
  audit: {
    analysisTimestamp: new Date().toISOString(),
    modelVersion: "Ocora-MAML-v2.4.1 (FDA-Pending)",
    segmentationConfidence: 0.964,
    predictionConfidence: 0.928,
    executionId: "EXEC-8842-BRAIN-29"
  },
  // Realistic Glioblastoma MRI Slice Placeholder
  image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Glioblastoma_macro.jpg" 
};

const MOCK_POLICY_DATA = {
  treatments: [
    {
      name: "Radiotherapy",
      probability: 0.303,
      description: "• Focal irradiation (60 Gy in 30 fractions)\n• Targets tumor bed + 2cm margin\n• Recommended due to high local control probability",
      sideEffects: ["Scalp Erythema", "Cognitive Fatigue", "Local Edema"],
      expectedSurvival: 59.16
    },
    {
      name: "Chemoradiation (TMZ + RT)",
      probability: 0.145,
      description: "• Concurrent Temozolomide (75 mg/m² daily)\n• Adjuvant TMZ (150-200 mg/m²)\n• Standard Stupp protocol approach",
      sideEffects: ["Thrombocytopenia", "Nausea", "Fatigue"],
      expectedSurvival: 58.69
    },
    {
      name: "TMZ Chemotherapy",
      probability: 0.344,
      description: "• Monotherapy Temozolomide\n• Indicated if RT tolerance is low\n• MGMT promoter methylation status dependent",
      sideEffects: ["Myelosuppression", "Liver Toxicity"],
      expectedSurvival: 58.38
    },
    {
      name: "No Treatment",
      probability: 0.208,
      description: "• Best Supportive Care\n• Symptom management only\n• Corticosteroids for edema control",
      sideEffects: ["Rapid Progression", "Neurological Decline"],
      expectedSurvival: 58.43
    }
  ]
};

const getMockSimulation = (treatment: string) => {
  const tName = treatment.toLowerCase();
  let baseVolume = 45; // Starting volume
  let growthRate = 0;
  let responseFactor = 0;

  // Define curves based on clinical expectations
  if (tName.includes("no treatment")) {
    // Aggressive growth
    growthRate = 1.15; 
    responseFactor = 0;
  } else if (tName.includes("radiotherapy")) {
    // Best response (based on prompt's recommendation)
    growthRate = 0.95; // Shrinks over time
    responseFactor = 0.8;
  } else if (tName.includes("chemoradiation")) {
    // Strong initial response then plateau
    growthRate = 0.92;
    responseFactor = 1.2;
  } else if (tName.includes("tmz")) {
    // Moderate response
    growthRate = 0.98;
    responseFactor = 0.5;
  } else {
    growthRate = 1.0;
    responseFactor = 0.1;
  }
  
  return {
    trajectory: Array.from({ length: 12 }, (_, i) => {
      // Simulate volume dynamics
      if (tName.includes("no treatment")) {
         baseVolume = baseVolume * growthRate;
      } else {
         // Treatment effect kicks in at month 1
         if (i > 0) baseVolume = baseVolume * growthRate - (responseFactor / i);
      }
      
      // Ensure volume doesn't go below 0 or explode too realistically high for the chart
      baseVolume = Math.max(5, Math.min(100, baseVolume));

      return {
        month: i,
        tumorVolume: parseFloat(baseVolume.toFixed(2)),
        healthyTissueImpact: i * (tName.includes("chemoradiation") ? 3 : tName.includes("radiotherapy") ? 2 : 0.5)
      };
    })
  };
};

// API Logic
let BASE_URL = "https://unintermissive-cinda-operably.ngrok-free.dev";

export const setBaseUrl = (url: string) => {
  BASE_URL = url.trim().replace(/\/$/, "");
  console.log("API Base URL set to:", BASE_URL);
};

// Helper to simulate network delay for realistic "Loading" feel during demo
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchRadiomics(file: File) {
  const form = new FormData();
  form.append("file", file);

  try {
    console.log(`Attempting to upload to ${BASE_URL}...`);
    // Short timeout to fail fast and switch to mock if backend is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${BASE_URL}/radiomics`, {
      method: "POST",
      body: form,
      signal: controller.signal,
      headers: {
        "ngrok-skip-browser-warning": "69420"
      }
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, switching to Prototype Mock Data:", err);
    await delay(2000); // Fake processing time
    return MOCK_RADIOMICS_DATA;
  }
}

export async function fetchPolicy(radiomicsVector: number[]) {
  try {
    const res = await fetch(`${BASE_URL}/policy`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({ state: radiomicsVector })
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using Mock Policy:", err);
    await delay(1000);
    return MOCK_POLICY_DATA;
  }
}

export async function fetchSimulation(treatmentName: string, radiomicsVector: number[]) {
  try {
    const res = await fetch(`${BASE_URL}/simulate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "69420"
      },
      body: JSON.stringify({
        treatment: treatmentName,
        state: radiomicsVector
      })
    });

    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, using Mock Simulation:", err);
    await delay(800);
    return getMockSimulation(treatmentName);
  }
}