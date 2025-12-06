import React, { useState, useEffect } from 'react';
import { TreatmentPlan, PatientData, RadiomicsData } from '../types';
import { generateClinicalReasoning } from '../services/geminiService';
import { fetchPolicy } from '../api';
import { CheckCircle, AlertTriangle, BrainCircuit, Loader2, Info } from 'lucide-react';

interface TreatmentViewProps {
  treatments: TreatmentPlan[];
  patient: PatientData;
  radiomics: RadiomicsData[];
  selectedPlan: TreatmentPlan;
  onSelectPlan: (plan: TreatmentPlan) => void;
}

const TreatmentView: React.FC<TreatmentViewProps> = ({ 
  treatments, 
  patient, 
  radiomics,
  selectedPlan,
  onSelectPlan 
}) => {
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [livePolicyProb, setLivePolicyProb] = useState<number | null>(null);

  // OPTIONAL: Re-fetch policy on mount to ensure we have the latest agent recommendation
  // This matches the requested logic to "call the policy" inside the view.
  useEffect(() => {
    async function getTreatmentPolicy() {
      if (patient.featureVector && patient.featureVector.length > 0) {
        try {
          const result = await fetchPolicy(patient.featureVector);
          if (result && result.probability) {
             setLivePolicyProb(result.probability);
             // If the API returns a specific recommended treatment, we could auto-select it here
             // onSelectPlan(result.treatment); 
          }
        } catch (e) {
          console.error("Failed to refresh policy", e);
        }
      }
    }
    getTreatmentPolicy();
  }, [patient.featureVector]);

  useEffect(() => {
    const fetchReasoning = async () => {
      setLoadingAi(true);
      const reasoning = await generateClinicalReasoning(patient, radiomics, selectedPlan);
      setAiReasoning(reasoning);
      setLoadingAi(false);
    };

    if (selectedPlan) {
      fetchReasoning();
    }
  }, [selectedPlan, patient, radiomics]);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="text-cyan-400" /> SAC & MAML Treatment Optimization
        </h2>
        <p className="text-slate-400 mt-1">Soft Actor-Critic agents optimize for survival while minimizing toxicity constraints.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Treatment List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Recommended Protocols</h3>
          {treatments.map((plan) => (
            <button
              key={plan.name}
              onClick={() => onSelectPlan(plan)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedPlan.name === plan.name 
                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`font-bold ${selectedPlan.name === plan.name ? 'text-cyan-400' : 'text-slate-200'}`}>
                  {plan.name}
                </span>
                <span className="bg-slate-900 text-slate-400 text-xs px-2 py-1 rounded-full font-mono">
                  {(plan.probability * 100).toFixed(1)}% Score
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full ${plan.probability > 0.8 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                  style={{ width: `${plan.probability * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{plan.description}</p>
            </button>
          ))}
          
          {/* Debug/Info for Live Agent */}
          {livePolicyProb && (
             <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-xs text-green-400">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
               Live Agent Confidence verified: {(livePolicyProb * 100).toFixed(2)}%
             </div>
          )}
        </div>

        {/* Detail & AI Reasoning */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-lg">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
               <div className="p-3 bg-cyan-500/20 rounded-full">
                 <BrainCircuit className="w-6 h-6 text-cyan-400" />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-100">AI Clinical Justification</h3>
                 <p className="text-sm text-slate-500">Generated by Gemini 3.0 Pro (Reasoning Mode)</p>
               </div>
             </div>

             <div className="min-h-[150px]">
               {loadingAi ? (
                 <div className="flex flex-col items-center justify-center h-full space-y-3 py-10">
                   <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                   <span className="text-sm text-slate-400">Analyzing radiomics & synthesizing treatment logic...</span>
                 </div>
               ) : (
                 <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                      {aiReasoning}
                    </p>
                 </div>
               )}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Projected Benefits
              </h4>
              <div className="text-3xl font-bold text-slate-100 mb-1">
                +{selectedPlan.survivalRateIncrease}%
              </div>
              <p className="text-sm text-slate-500">Estimated increase in 5-year survival rate compared to standard of care.</p>
            </div>

             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> Toxicity Risks
              </h4>
              <ul className="space-y-2">
                {selectedPlan.sideEffects.map((effect, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                    {effect}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentView;