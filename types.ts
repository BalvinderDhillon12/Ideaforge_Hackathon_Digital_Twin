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

export interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  diagnosis: string;
  scanDate: string;
  radiomics?: RadiomicsData[];
  featureVector?: number[];
}

export interface TreatmentPlan {
  name: string;
  probability: number;
  description: string;
  sideEffects: string[];
  survivalRateIncrease: number;
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