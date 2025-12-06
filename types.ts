export enum ViewState {
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  TREATMENT = 'TREATMENT',
  DIGITAL_TWIN = 'DIGITAL_TWIN'
}

export interface RadiomicsData {
  feature: string;
  value: number; // Normalized 0-1 for radar chart
  actualValue: string;
}

export interface TumorPhenotype {
  volumeCm3: number;
  midlineShiftMm: number;
  enhancingPercentage: number;
  nonEnhancingPercentage: number;
  edemaVolumeCm3: number;
  necrosisVolumeCm3: number;
  resectabilityScore: number; // 0-100
}

export interface AnalysisAudit {
  analysisTimestamp: string;
  modelVersion: string;
  segmentationConfidence: number; // 0-1
  predictionConfidence: number; // 0-1
  executionId: string;
}

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  diagnosis: string;
  scanDate: string;
  tumorGrade?: 'HGG' | 'LGG';
  resectability?: 'Resectable' | 'Non-Resectable';
  radiomics?: RadiomicsData[];
  phenotype?: TumorPhenotype;
  audit?: AnalysisAudit;
  featureVector?: number[];
  imageUrl?: string; // Base64 string of the processed slice
}

export interface TreatmentPlan {
  name: string;
  probability: number;
  description: string; // Bullet points separated by newline
  sideEffects: string[];
  expectedSurvival: number; // in months
}

export interface TwinSimulationStep {
  month: number;
  tumorVolume: number; // cm3
  healthyTissueImpact: number; // %
}

export interface SimulationScenario {
  treatmentId: string;
  data: TwinSimulationStep[];
}