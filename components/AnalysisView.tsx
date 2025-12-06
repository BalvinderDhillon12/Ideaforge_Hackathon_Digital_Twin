
import React, { useState } from 'react';
import { RadiomicsData, PatientData } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Eye, EyeOff, Layers, Zap, User, AlertCircle, Microscope, Scale, ShieldCheck, Clock, FileDigit, Activity } from 'lucide-react';

interface AnalysisViewProps {
  radiomics: RadiomicsData[];
  patient?: PatientData;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ radiomics, patient }) => {
  const [showSegmentation, setShowSegmentation] = useState(true);
  const [activeLayer, setActiveLayer] = useState<'all' | 'edema' | 'necrosis' | 'enhancing'>('all');

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="text-cyan-400" /> Segmentation & Radiomics
          </h2>
          <p className="text-slate-400 mt-1">Deep learning based sub-region segmentation and feature extraction.</p>
        </div>
        {patient && (
          <div className="text-right bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Subject ID</div>
            <div className="text-sm font-mono text-cyan-400 flex items-center gap-2 justify-end">
              <User size={12} /> {patient.id}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image Viewer */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Axial T1-Weighted MRI</h3>
            <div className="flex gap-2">
               <button 
                onClick={() => setShowSegmentation(!showSegmentation)}
                className={`p-2 rounded-md transition-colors ${showSegmentation ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700 text-slate-400'}`}
                title="Toggle Segmentation"
              >
                {showSegmentation ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <div className="relative aspect-square w-full bg-black rounded-lg overflow-hidden border border-slate-700 group flex items-center justify-center mb-4">
            {/* Base MRI Image - USES REAL IMAGE IF AVAILABLE */}
            {patient?.imageUrl ? (
              <img 
                src={patient.imageUrl} 
                alt="Patient MRI Slice" 
                className="w-full h-full object-contain opacity-90"
              />
            ) : (
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Glioblastoma_macro.jpg" 
                alt="Demo MRI" 
                className="w-full h-full object-cover opacity-80"
              />
            )}
            
            {/* Simulated Segmentation Overlays */}
            {showSegmentation && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`relative w-full h-full transition-opacity duration-300`}>
                  {/* NOTE: In a real app, these segmentation masks would also be base64 images overlaid perfectly. 
                      For this prototype, we position them centrally or use the mock blobs if using the demo image. */}
                  
                  {patient?.imageUrl ? (
                     // If real image, we assume the segmentation comes baked in or we overlay a generic heatmap for effect
                     <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent mix-blend-overlay" />
                  ) : (
                    // Mock blobs for the demo image (aligned with the wiki tumor image roughly)
                    <div className="w-full h-full relative">
                        {(activeLayer === 'all' || activeLayer === 'edema') && (
                          <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-sky-500/20 blur-xl animate-pulse" />
                        )}
                        {(activeLayer === 'all' || activeLayer === 'necrosis') && (
                          <div className="absolute top-[30%] left-[50%] w-[20%] h-[20%] rounded-full bg-purple-500/30 blur-lg" />
                        )}
                        {(activeLayer === 'all' || activeLayer === 'enhancing') && (
                          <div className="absolute top-[25%] left-[45%] w-[30%] h-[30%] rounded-full border-4 border-rose-500/40 blur-sm" />
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scale Bar */}
            <div className="absolute bottom-4 right-4 text-xs text-slate-500 bg-black/50 px-2 py-1 rounded">
              5 cm
            </div>
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-0 border-b-2 border-cyan-500/50 animate-scan pointer-events-none opacity-50"></div>
          </div>

          {/* Layer Toggles */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap ${activeLayer === 'all' ? 'bg-slate-100 text-slate-900 border-slate-100' : 'text-slate-400 border-slate-600 hover:border-slate-400'}`}
            >
              Composite
            </button>
            <button 
               onClick={() => setActiveLayer('edema')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap ${activeLayer === 'edema' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'text-slate-400 border-slate-600 hover:border-sky-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-sky-500"></div> Edema
            </button>
             <button 
               onClick={() => setActiveLayer('necrosis')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap ${activeLayer === 'necrosis' ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'text-slate-400 border-slate-600 hover:border-purple-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div> Necrosis
            </button>
            <button 
               onClick={() => setActiveLayer('enhancing')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 whitespace-nowrap ${activeLayer === 'enhancing' ? 'bg-rose-500/20 text-rose-400 border-rose-500' : 'text-slate-400 border-slate-600 hover:border-rose-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> Enhancing
            </button>
          </div>
        </div>

        {/* Center & Right Column: Data Panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Row: Phenotype & Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tumor Phenotype Summary */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
              <div className="flex items-center gap-2 mb-6">
                <Microscope className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-100">Tumor Phenotype Summary</h3>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Volume</div>
                  <div className="text-2xl font-mono text-slate-200">
                    {patient?.phenotype?.volumeCm3.toFixed(2) || "---"} <span className="text-sm text-slate-500">cm³</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Midline Shift</div>
                  <div className={`text-2xl font-mono ${ (patient?.phenotype?.midlineShiftMm || 0) > 5 ? 'text-red-400' : 'text-green-400' }`}>
                    {patient?.phenotype?.midlineShiftMm.toFixed(2) || "---"} <span className="text-sm text-slate-500">mm</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Enhancing vs Non-Enhancing</span>
                    <span>{patient?.phenotype?.enhancingPercentage}% / {patient?.phenotype?.nonEnhancingPercentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden flex">
                    <div className="h-full bg-rose-500" style={{ width: `${patient?.phenotype?.enhancingPercentage}%` }} />
                    <div className="h-full bg-slate-600" style={{ width: `${patient?.phenotype?.nonEnhancingPercentage}%` }} />
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Edema Volume</div>
                  <div className="text-lg font-mono text-sky-400">
                    {patient?.phenotype?.edemaVolumeCm3.toFixed(1) || "---"} <span className="text-xs text-slate-500">cm³</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Necrosis Volume</div>
                  <div className="text-lg font-mono text-purple-400">
                    {patient?.phenotype?.necrosisVolumeCm3.toFixed(1) || "---"} <span className="text-xs text-slate-500">cm³</span>
                  </div>
                </div>

                <div className="col-span-2 border-t border-slate-700 pt-4 mt-2">
                   <div className="flex justify-between items-center">
                      <div className="text-sm font-medium text-slate-300">Resectability Score</div>
                      <div className="text-xl font-bold text-cyan-400">{patient?.phenotype?.resectabilityScore}%</div>
                   </div>
                   <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${patient?.phenotype?.resectabilityScore}%` }} />
                   </div>
                </div>
              </div>
            </div>

            {/* Analysis Audit Trail */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col">
               <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-slate-100">Analysis Audit Trail</h3>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Analysis Timestamp</div>
                    <div className="text-sm text-slate-300 font-mono">
                      {patient?.audit?.analysisTimestamp ? new Date(patient.audit.analysisTimestamp).toLocaleString() : "---"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileDigit className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Model Version</div>
                    <div className="text-sm text-slate-300 font-mono bg-slate-900/50 px-2 py-1 rounded inline-block border border-slate-700">
                      {patient?.audit?.modelVersion || "v0.0.0"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Execution ID</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {patient?.audit?.executionId || "---"}
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-700 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Seg. Confidence</div>
                      <div className="text-lg font-bold text-green-400">
                        {patient?.audit ? (patient.audit.segmentationConfidence * 100).toFixed(1) : "--"}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Pred. Confidence</div>
                      <div className="text-lg font-bold text-cyan-400">
                        {patient?.audit ? (patient.audit.predictionConfidence * 100).toFixed(1) : "--"}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Radiomics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
               <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-200">Radiomic Signature</h3>
                    <p className="text-xs text-slate-400">First-order & Texture Features</p>
                 </div>
                 <Zap className="text-yellow-500 w-5 h-5" />
               </div>
               
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radiomics}>
                     <PolarGrid stroke="#334155" />
                     <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                     <Radar
                       name="Patient"
                       dataKey="value"
                       stroke="#06b6d4"
                       strokeWidth={2}
                       fill="#06b6d4"
                       fillOpacity={0.3}
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                        itemStyle={{ color: '#06b6d4' }}
                     />
                   </RadarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
               <h3 className="text-lg font-semibold text-slate-200 mb-4">Heterogeneity Index</h3>
               <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={radiomics.slice(0, 5)} layout="vertical">
                      <XAxis type="number" domain={[0, 1]} hide />
                      <YAxis dataKey="feature" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                      <Bar dataKey="value" barSize={12} radius={[0, 4, 4, 0]}>
                        {radiomics.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'][index]} />
                        ))}
                      </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;