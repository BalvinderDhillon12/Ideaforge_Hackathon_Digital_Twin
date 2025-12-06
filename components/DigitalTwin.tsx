
import React, { useState, useEffect } from 'react';
import { SimulationScenario, PatientData, TreatmentPlan, TwinSimulationStep } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Pause, RefreshCw, MessageSquare, Dna, Send, Loader2, ChevronDown } from 'lucide-react';
import { chatWithTwin } from '../services/geminiService';
import { fetchSimulation } from '../api';

interface DigitalTwinProps {
  patient: PatientData;
  selectedTreatment: TreatmentPlan;
}

// Fallback data if API is not connected
const MOCK_DATA: TwinSimulationStep[] = [
  { month: 0, tumorVolume: 45.2, healthyTissueImpact: 0 },
  { month: 1, tumorVolume: 42.1, healthyTissueImpact: 2 },
  { month: 2, tumorVolume: 38.5, healthyTissueImpact: 5 },
  { month: 3, tumorVolume: 32.2, healthyTissueImpact: 8 },
  { month: 4, tumorVolume: 24.8, healthyTissueImpact: 10 },
  { month: 5, tumorVolume: 18.5, healthyTissueImpact: 11 },
  { month: 6, tumorVolume: 15.2, healthyTissueImpact: 12 },
  { month: 9, tumorVolume: 12.1, healthyTissueImpact: 11 },
  { month: 12, tumorVolume: 10.5, healthyTissueImpact: 10 },
];

const DigitalTwin: React.FC<DigitalTwinProps> = ({ patient, selectedTreatment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "I am the Digital Twin of the tumor. I have simulated the response to the treatment. Ask me about my resistance mechanisms or growth patterns." }
  ]);
  const [isChatting, setIsChatting] = useState(false);
  
  // Internal selection state for comparison (defaults to passed prop)
  const [viewingTreatmentName, setViewingTreatmentName] = useState(selectedTreatment.name);
  
  // Simulation Data State
  const [simData, setSimData] = useState<TwinSimulationStep[]>(MOCK_DATA);
  const [isLoadingSim, setIsLoadingSim] = useState(false);

  // Available therapies for comparison
  const therapies = ["Radiotherapy", "Chemoradiation (TMZ + RT)", "TMZ Chemotherapy", "No Treatment"];

  // FETCH SIMULATION FROM BACKEND
  useEffect(() => {
    async function getSim() {
      if (patient.featureVector) {
        setIsLoadingSim(true);
        // Reset animation on new fetch
        setCurrentStep(0);
        setIsPlaying(false);
        try {
           const result = await fetchSimulation(viewingTreatmentName, patient.featureVector);
           if (result && result.trajectory) {
             setSimData(result.trajectory);
           } else if (result && Array.isArray(result)) {
             setSimData(result);
           }
        } catch(e) {
          console.error("Simulation fetch failed, using fallback", e);
          // Keep mock data on fail
        } finally {
          setIsLoadingSim(false);
        }
      }
    }
    getSim();
  }, [viewingTreatmentName, patient.featureVector]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= simData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simData.length]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatting(true);

    const apiHistory = chatHistory.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const response = await chatWithTwin(apiHistory, userMsg);
    
    setChatHistory(prev => [...prev, { role: 'model', text: response || "Error." }]);
    setIsChatting(false);
  };

  const currentData = simData[currentStep] || simData[0];

  return (
    <div className="p-8 h-full overflow-y-auto">
       <div className="mb-8 flex justify-between items-end">
         <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Dna className="text-cyan-400" /> Digital Twin Simulation
            </h2>
            <div className="flex items-center gap-3 mt-2">
               <span className="text-slate-400 text-sm">Simulating protocol:</span>
               <div className="relative">
                 <select 
                   value={viewingTreatmentName}
                   onChange={(e) => setViewingTreatmentName(e.target.value)}
                   className="appearance-none bg-slate-800 border border-slate-700 text-cyan-400 text-sm font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-cyan-500"
                 >
                   {therapies.map(t => (
                     <option key={t} value={t}>{t}</option>
                   ))}
                 </select>
                 <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
               </div>
            </div>
         </div>
         <div className="flex gap-2">
           <button 
             onClick={() => setIsPlaying(!isPlaying)}
             disabled={isLoadingSim}
             className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
           >
             {isLoadingSim ? <Loader2 size={18} className="animate-spin" /> : (isPlaying ? <Pause size={18} /> : <Play size={18} />)}
             {isPlaying ? 'Pause Sim' : 'Run Sim'}
           </button>
           <button 
             onClick={() => setCurrentStep(0)}
             className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
           >
             <RefreshCw size={18} />
           </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)]">
        {/* Simulation Visuals */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 3D Mockup / Visualizer */}
          <div className="flex-1 bg-black border border-slate-700 rounded-xl relative overflow-hidden flex items-center justify-center">
             <div className="absolute top-4 left-4 z-10 text-xs font-mono text-cyan-400">
               T = {currentData.month} Months
             </div>
             
             {/* Dynamic Tumor Blob Visualization */}
             {isLoadingSim ? (
               <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                  <span className="text-xs text-slate-500">Solving differential equations...</span>
               </div>
             ) : (
               <div 
                 className="rounded-full bg-gradient-to-r from-purple-600 to-rose-600 blur-md transition-all duration-500 ease-linear shadow-[0_0_50px_rgba(225,29,72,0.5)]"
                 style={{
                   width: `${Math.max(50, currentData.tumorVolume * 10)}px`,
                   height: `${Math.max(50, currentData.tumorVolume * 10)}px`,
                   opacity: 0.8 + (currentData.tumorVolume / 100)
                 }}
               />
             )}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
             
             {/* Grid overlay */}
             <div className="absolute inset-0 border border-cyan-500/10 rounded-xl pointer-events-none"></div>
          </div>

          {/* Time Series Chart */}
          <div className="h-64 bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg">
            <h4 className="text-sm font-semibold text-slate-400 mb-4">Predicted Tumor Volume (cm³)</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simData}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" label={{ value: 'Months', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
                  itemStyle={{ color: '#ef4444' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="tumorVolume" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorVol)" 
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl flex flex-col shadow-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-900/50">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" /> Interface with Twin
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                  msg.role === 'user' 
                    ? 'bg-cyan-600 text-white rounded-br-none' 
                    : 'bg-slate-700 text-slate-200 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
             {isChatting && (
              <div className="flex justify-start">
                 <div className="bg-slate-700 p-3 rounded-lg rounded-bl-none flex gap-1">
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75" />
                   <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150" />
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            <div className="flex gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about resistance..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button 
                onClick={handleSendMessage}
                disabled={isChatting}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;