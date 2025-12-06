import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import UploadSection from './components/UploadSection';
import AnalysisView from './components/AnalysisView';
import TreatmentView from './components/TreatmentView';
import DigitalTwin from './components/DigitalTwin';
import { ViewState, PatientData, RadiomicsData, TreatmentPlan, SimulationScenario } from './types';
import { setBaseUrl, fetchRadiomics, fetchPolicy, fetchSimulation } from './api';
import { X, Server, Check, AlertTriangle, Loader2, Brain } from 'lucide-react';

// --- MOCK DATA FALLBACKS ---
const MOCK_RADIOMICS: RadiomicsData[] = [
  { feature: "Sphericity", value: 0.65, actualValue: "0.65 (Irregular)" },
  { feature: "Contrast", value: 0.8, actualValue: "High Heterogeneity" },
  { feature: "Entropy", value: 0.9, actualValue: "7.42 bits" },
  { feature: "Correlation", value: 0.4, actualValue: "0.38 (Low)" },
  { feature: "Coarseness", value: 0.3, actualValue: "Fine Texture" },
  { feature: "Homogeneity", value: 0.2, actualValue: "0.18 (Low)" },
];

const INITIAL_PATIENT: PatientData = {
  id: "PT-2024-883",
  name: "Subject 883 (Waiting for Data)",
  age: 54,
  gender: "M",
  diagnosis: "Glioblastoma Multiforme (WHO Grade IV)",
  scanDate: "2024-05-15",
  radiomics: MOCK_RADIOMICS
};

const MOCK_TREATMENTS: TreatmentPlan[] = [
  {
    name: "Stupp Protocol + TTFields",
    probability: 0.88,
    description: "Standard radiochemotherapy with TMZ followed by adjuvant TMZ and Tumor Treating Fields.",
    sideEffects: ["Fatigue", "Skin Irritation", "Nausea", "Thrombocytopenia"],
    survivalRateIncrease: 14
  },
  {
    name: "Hypofractionated RT + Bevacizumab",
    probability: 0.65,
    description: "Targeted radiation therapy combined with anti-angiogenic therapy.",
    sideEffects: ["Hypertension", "Wound Healing Complications", "Fatigue"],
    survivalRateIncrease: 8
  },
  {
    name: "Lomustine (CCNU) Monotherapy",
    probability: 0.42,
    description: "Alkylating nitrosourea used for recurrent GBM.",
    sideEffects: ["Myelosuppression", "Pulmonary Fibrosis", "Nausea"],
    survivalRateIncrease: 4
  }
];

const MOCK_SIMULATION: SimulationScenario = {
  treatmentId: "Stupp Protocol + TTFields",
  data: [
    { month: 0, tumorVolume: 45.2, healthyTissueImpact: 0 },
    { month: 1, tumorVolume: 42.1, healthyTissueImpact: 2 },
    { month: 2, tumorVolume: 38.5, healthyTissueImpact: 5 },
    { month: 3, tumorVolume: 32.2, healthyTissueImpact: 8 },
    { month: 4, tumorVolume: 24.8, healthyTissueImpact: 10 },
    { month: 5, tumorVolume: 18.5, healthyTissueImpact: 11 },
    { month: 6, tumorVolume: 15.2, healthyTissueImpact: 12 },
    { month: 9, tumorVolume: 12.1, healthyTissueImpact: 11 },
    { month: 12, tumorVolume: 10.5, healthyTissueImpact: 10 },
  ]
};

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
  const [apiUrl, setApiUrl] = useState("https://<YOUR_NGROK_URL>");
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSaveSettings = () => {
    setBaseUrl(apiUrl);
    setIsApiConnected(true);
    setIsSettingsOpen(false);
  };

  const handleUploadComplete = async (data: { file: File; radiomics: any; featureVector: number[] }) => {
    const { file, radiomics, featureVector } = data;
    
    setIsProcessing(true);
    setApiError(null);
    
    // Create new patient profile
    const newPatientProfile: PatientData = {
      ...INITIAL_PATIENT,
      name: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
      scanDate: new Date().toISOString().split('T')[0],
      id: `PT-${Math.floor(Math.random() * 10000)}`
    };

    if (radiomics) {
        // Map radiomics features
        const featuresList = Array.isArray(radiomics) ? radiomics : (radiomics.features || []);
        
        if (featuresList.length > 0) {
           const mappedRadiomics: RadiomicsData[] = featuresList.map((f: any) => ({
             feature: f.name,
             value: f.valueNormalized || Math.random(),
             actualValue: f.valueDisplay || (typeof f.value === 'number' ? f.value.toFixed(2) : String(f.value))
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
               console.error("Policy fetch failed:", err);
               setApiError(err.message || "Failed to fetch treatment policy.");
           }
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
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                  {patientData.diagnosis}
                </span>
             )}
             {apiError && (
               <div className="flex items-center gap-1 text-xs text-orange-400 ml-4 animate-pulse">
                 <AlertTriangle size={12} />
                 <span>Offline Mode</span>
               </div>
             )}
           </div>
           <div className="flex items-center gap-4">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-500/10 rounded-xl">
                <Server className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Backend Connection</h3>
                <p className="text-sm text-slate-400">Configure Python/Colab API Endpoint</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">Ngrok URL</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://xxxx-xx-xx-xx.ngrok-free.app"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Paste the public URL from your Colab notebook here to enable real-time PyRadiomics extraction and SAC inference.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSaveSettings}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Check size={18} />
                  Connect & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;