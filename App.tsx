import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import AnalysisView from './components/AnalysisView';
import TreatmentView from './components/TreatmentView';
import DigitalTwin from './components/DigitalTwin';
import { ViewState, PatientData, RadiomicsData, TreatmentPlan, SimulationScenario } from './types';
import { setBaseUrl, fetchRadiomics, fetchPolicy, fetchSimulation } from './api';
import { generateClinicalReport } from './services/reportGenerator';
import { X, Server, Check, AlertTriangle, Loader2, Brain, Code, Copy, Terminal, Activity, FileText } from 'lucide-react';

// --- MOCK DATA FALLBACKS (Matching BraTS19_CBICA_ANG) ---
const MOCK_RADIOMICS: RadiomicsData[] = [
  { feature: "Sphericity", value: 0.36, actualValue: "0.368 (Low)" },
  { feature: "Surface Area", value: 0.90, actualValue: "33,126 mm²" },
  { feature: "Mean Intensity", value: 0.50, actualValue: "498.88" },
  { feature: "Entropy", value: 0.45, actualValue: "3.04 bits" }, 
  { feature: "Contrast", value: 0.40, actualValue: "4.67 (GLCM)" },
  { feature: "Homogeneity", value: 0.99, actualValue: "0.996 (High)" },
  { feature: "Max Diameter", value: 0.82, actualValue: "96.24 mm" }
];

const INITIAL_PATIENT: PatientData = {
  id: "BraTS19_CBICA_ANG",
  name: "Subject ANG",
  age: 60,
  gender: "M",
  diagnosis: "Glioblastoma",
  tumorGrade: "HGG",
  resectability: "Resectable",
  scanDate: "2024-05-15",
  radiomics: MOCK_RADIOMICS,
  phenotype: {
    volumeCm3: 3.8, // Vol_Whole
    midlineShiftMm: 2.97, // Midline_Dist_mm
    enhancingPercentage: 36.8, // Calculated
    nonEnhancingPercentage: 63.2,
    edemaVolumeCm3: 1.3, // Approx
    necrosisVolumeCm3: 1.1, // Vol_Core
    resectabilityScore: 99.7 // GTR high confidence
  },
  audit: {
    analysisTimestamp: new Date().toISOString(),
    modelVersion: "Ocora-MAML-v2.4.1 (FDA-Pending)",
    segmentationConfidence: 0.996,
    predictionConfidence: 0.982,
    executionId: "EXEC-8842-BRAIN-ANG"
  }
};

const MOCK_TREATMENTS: TreatmentPlan[] = [
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
];

const COLAB_SNIPPET = `# 🟢 STEP 1: INSTALL DEPENDENCIES
!pip install fastapi uvicorn pyngrok python-multipart nibabel matplotlib torch pandas

# 🟢 STEP 2: RUN SERVER CODE
import uvicorn
import io
import base64
import numpy as np
import nibabel as nib
import matplotlib.pyplot as plt
import torch
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pyngrok import ngrok

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 🧠 LOAD YOUR MODELS HERE ---
# Uncomment and update paths to your actual files
# policy_model = torch.load('policy_model.pt') 
# radiomics_df = pd.read_csv('radiomics.csv')

def process_nifti_to_base64(file_bytes):
    # Load NIfTI from bytes
    with open("temp.nii.gz", "wb") as f:
        f.write(file_bytes)
    
    img = nib.load("temp.nii.gz")
    data = img.get_fdata()
    
    # Get middle slice (axial)
    mid_slice_idx = data.shape[2] // 2
    mid_slice = data[:, :, mid_slice_idx]
    
    # Normalize and rotate for display
    mid_slice = np.rot90(mid_slice)
    
    # Save to buffer as PNG
    buf = io.BytesIO()
    plt.imsave(buf, mid_slice, cmap="gray")
    buf.seek(0)
    img_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"

class StateInput(BaseModel):
    state: list[float]

class SimInput(BaseModel):
    treatment: str
    state: list[float]

@app.post("/radiomics")
async def analyze(file: UploadFile = File(...)):
    print(f"Received file: {file.filename}")
    content = await file.read()
    
    # 1. Process Image for Frontend
    try:
        image_b64 = process_nifti_to_base64(content)
    except Exception as e:
        print(f"Image processing failed: {e}")
        image_b64 = None

    # 2. Extract Radiomics (Placeholder for your pyradiomics code)
    # features = extractor.execute("temp.nii.gz") 
    
    return {
        "radiomics": [
            {"name": "Entropy", "value": 0.85, "valueDisplay": "High"},
            {"name": "Contrast", "value": 0.72, "valueDisplay": "Moderate"}
        ], 
        "vector": [0.85, 0.72, 0.1, 0.9],
        "image": image_b64 
    }

@app.post("/policy")
async def get_policy(data: StateInput):
    # 🤖 USE YOUR LOADED MODEL HERE
    # tensor_state = torch.tensor(data.state)
    # action = policy_model(tensor_state)
    
    return {
        "treatments": [{
            "name": "Radiotherapy", 
            "probability": 0.30, 
            "description": "Recommended Protocol",
            "sideEffects": ["Fatigue"],
            "expectedSurvival": 59.16
        }]
    }

@app.post("/simulate")
async def simulate(data: SimInput):
    # 🧬 YOUR DIGITAL TWIN LOGIC
    return {"trajectory": [{"month": i, "tumorVolume": 50-i*2, "healthyTissueImpact": i} for i in range(12)]}

# Expose via Ngrok
port = 8000
public_url = ngrok.connect(port).public_url
print(f"👉 COPY THIS URL: {public_url}")

uvicorn.run(app, port=port)`;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.UPLOAD);
  const [hasData, setHasData] = useState(false);
  
  // Unified Patient Data State (includes radiomics & feature vector)
  const [patientData, setPatientData] = useState<PatientData>(INITIAL_PATIENT);
  
  // Treatment & Sim State
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>(MOCK_TREATMENTS);
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentPlan>(MOCK_TREATMENTS[0]);
  
  // API Config State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'connect' | 'code'>('connect');
  const [apiUrl, setApiUrl] = useState("https://unintermissive-cinda-operably.ngrok-free.dev");
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setBaseUrl(apiUrl);
    setIsApiConnected(true);
    setIsSettingsOpen(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(COLAB_SNIPPET);
    // Could add toast notification here
  };

  const handleExportReport = () => {
    generateClinicalReport(patientData, selectedTreatment);
  };

  const handleUploadComplete = async (data: { file: File; radiomics: any; featureVector: number[] }) => {
    const { file, radiomics, featureVector } = data;
    
    setIsProcessing(true);
    setApiError(null);
    
    // Create new patient profile
    const newPatientProfile: PatientData = {
      ...INITIAL_PATIENT,
      name: file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ") : "Patient Scan",
      scanDate: new Date().toISOString().split('T')[0],
      id: `PT-${Math.floor(Math.random() * 10000)}`,
      // MOCK LOGIC for demo purposes to assign grade/resection
      tumorGrade: Math.random() > 0.3 ? "HGG" : "LGG",
      resectability: Math.random() > 0.4 ? "Resectable" : "Non-Resectable",
      // Include Phenotype & Audit from Mock/Backend response in future
      phenotype: radiomics?.phenotype || INITIAL_PATIENT.phenotype,
      audit: radiomics?.audit || {
        ...INITIAL_PATIENT.audit,
        analysisTimestamp: new Date().toISOString()
      }
    };

    if (radiomics) {
        // Map radiomics features
        const featuresList = Array.isArray(radiomics) ? radiomics : (radiomics.features || radiomics.radiomics || []);
        
        if (featuresList.length > 0) {
           const mappedRadiomics: RadiomicsData[] = featuresList.map((f: any) => ({
             feature: f.name || f.feature,
             value: f.valueNormalized || (typeof f.value === 'number' && f.value <= 1 ? f.value : Math.random()),
             actualValue: f.valueDisplay || f.actualValue || (typeof f.value === 'number' ? f.value.toFixed(2) : String(f.value))
           }));
           newPatientProfile.radiomics = mappedRadiomics;
        }

        // Store Feature Vector for SAC/MAML
        if (featureVector && featureVector.length > 0) {
           newPatientProfile.featureVector = featureVector;

           // Try to fetch initial policy
           try {
               const policyRes = await fetchPolicy(featureVector);
               if (policyRes && policyRes.treatments) {
                   setTreatmentPlans(policyRes.treatments);
                   if (policyRes.treatments.length > 0) {
                     setSelectedTreatment(policyRes.treatments[0]);
                   }
               }
           } catch (err: any) {
               console.warn("Using default treatment plans (Backend offline)");
           }
        }
        
        // --- NEW: Handle Image from Backend ---
        if (radiomics.image) {
           newPatientProfile.imageUrl = radiomics.image;
        }
    } else {
        console.warn("No radiomics data received.");
    }

    // Small delay to ensure UI transition is smooth
    if (!radiomics) {
       await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setPatientData(newPatientProfile);
    setHasData(true);
    setIsProcessing(false);
    setCurrentView(ViewState.ANALYSIS);
  };

  const renderContent = () => {
    if (isProcessing) {
       return (
         <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
           <div className="relative">
             <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
               <Brain className="w-8 h-8 text-cyan-500 animate-pulse" />
             </div>
           </div>
           <div className="text-center space-y-2">
             <h2 className="text-2xl font-bold text-slate-100">Analyzing Tumor Microstructure</h2>
             <p className="text-slate-400">Running PyRadiomics extraction & Deep Learning segmentation...</p>
             {isApiConnected && <p className="text-xs text-green-500 font-mono">Connected to: {apiUrl}</p>}
           </div>
         </div>
       );
    }

    switch (currentView) {
      case ViewState.UPLOAD:
        return <UploadSection onUploadComplete={handleUploadComplete} />;
      case ViewState.ANALYSIS:
        return hasData ? (
          <AnalysisView 
            radiomics={patientData.radiomics || []} 
            patient={patientData} 
          />
        ) : <UploadSection onUploadComplete={handleUploadComplete} />;
      case ViewState.TREATMENT:
        return hasData ? (
          <TreatmentView 
            treatments={treatmentPlans} 
            patient={patientData} 
            radiomics={patientData.radiomics || []}
            selectedPlan={selectedTreatment}
            onSelectPlan={setSelectedTreatment}
          />
        ) : <UploadSection onUploadComplete={handleUploadComplete} />;
      case ViewState.DIGITAL_TWIN:
        return hasData ? (
          <DigitalTwin 
            patient={patientData}
            selectedTreatment={selectedTreatment}
          />
        ) : <UploadSection onUploadComplete={handleUploadComplete} />;
      default:
        return <UploadSection onUploadComplete={handleUploadComplete} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')]">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <main className="flex-1 ml-64 relative z-10 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-8 w-full z-10 shrink-0">
           <div className="flex items-center gap-4">
             <span className="text-slate-500 font-medium">Patient:</span>
             <span className="text-slate-200 font-bold tracking-wide">{hasData ? patientData.name : 'Waiting for Data...'}</span>
             {hasData && (
               <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${patientData.tumorGrade === 'HGG' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                    {patientData.tumorGrade}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {patientData.resectability}
                  </span>
               </div>
             )}
             {apiError && (
               <div className="flex items-center gap-1 text-xs text-orange-400 ml-4 animate-pulse">
                 <AlertTriangle size={12} />
                 <span>Offline Mode</span>
               </div>
             )}
           </div>
           
           <div className="flex items-center gap-4">
              {hasData && (
                <button 
                  onClick={handleExportReport}
                  className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border border-slate-700 hover:border-slate-500"
                >
                  <FileText size={14} />
                  Export Report
                </button>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-500">Dr. Sarah Jenning</p>
                <p className="text-[10px] text-cyan-500 font-medium">Neuro-Oncology Lead</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden ring-2 ring-slate-800">
                <img src="https://ui-avatars.com/api/?name=Sarah+Jenning&background=0891b2&color=fff" alt="Profile" />
              </div>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                  <Server className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Backend Connection</h3>
                  <p className="text-sm text-slate-400">Manage Colab / Ngrok Integration</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setSettingsTab('connect')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  settingsTab === 'connect' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                Connection
              </button>
              <button 
                onClick={() => setSettingsTab('code')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  settingsTab === 'code' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                Server Code
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {settingsTab === 'connect' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ngrok Public URL</label>
                    <input 
                      type="text" 
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      placeholder="https://xxxx-xx-xx-xx.ngrok-free.app"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Paste the URL generated by the Python script in Google Colab.
                    </p>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-yellow-500">Important</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Ensure your Colab runtime is active and the cell running <code className="bg-slate-900 px-1 rounded">uvicorn</code> is executing. The URL changes every time you restart the runtime.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-slate-300">FastAPI Setup (Python)</h4>
                    <button 
                      onClick={handleCopyCode}
                      className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Copy size={14} /> Copy Code
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto relative group">
                    <pre>{COLAB_SNIPPET}</pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {settingsTab === 'connect' && (
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Connect & Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;