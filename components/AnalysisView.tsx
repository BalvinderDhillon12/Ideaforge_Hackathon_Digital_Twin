import React, { useState } from 'react';
import { RadiomicsData, PatientData } from '../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Eye, EyeOff, Layers, Zap, User } from 'lucide-react';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Viewer */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
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

          <div className="relative aspect-square w-full bg-black rounded-lg overflow-hidden border border-slate-700 group">
            {/* Base MRI Image Placeholder */}
            <img 
              src="https://picsum.photos/800/800?grayscale" 
              alt="Brain MRI" 
              className="w-full h-full object-cover opacity-80"
            />
            
            {/* Simulated Segmentation Overlays */}
            {showSegmentation && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative w-3/4 h-3/4 transition-opacity duration-300`}>
                  {/* Edema Layer */}
                  {(activeLayer === 'all' || activeLayer === 'edema') && (
                     <div className="absolute top-[10%] left-[10%] w-[80%] h-[80%] rounded-full bg-sky-500/30 blur-xl animate-pulse" />
                  )}
                  {/* Necrotic Core */}
                  {(activeLayer === 'all' || activeLayer === 'necrosis') && (
                     <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-500/40 blur-lg" />
                  )}
                   {/* Enhancing Tumor */}
                  {(activeLayer === 'all' || activeLayer === 'enhancing') && (
                     <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] rounded-full border-4 border-rose-500/50 blur-sm" />
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
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            <button 
              onClick={() => setActiveLayer('all')}
              className={`px-3 py-1 text-xs rounded-full border ${activeLayer === 'all' ? 'bg-slate-100 text-slate-900 border-slate-100' : 'text-slate-400 border-slate-600 hover:border-slate-400'}`}
            >
              Composite
            </button>
            <button 
               onClick={() => setActiveLayer('edema')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${activeLayer === 'edema' ? 'bg-sky-500/20 text-sky-400 border-sky-500' : 'text-slate-400 border-slate-600 hover:border-sky-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-sky-500"></div> Edema
            </button>
             <button 
               onClick={() => setActiveLayer('necrosis')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${activeLayer === 'necrosis' ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'text-slate-400 border-slate-600 hover:border-purple-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div> Necrosis
            </button>
            <button 
               onClick={() => setActiveLayer('enhancing')}
               className={`px-3 py-1 text-xs rounded-full border flex items-center gap-1 ${activeLayer === 'enhancing' ? 'bg-rose-500/20 text-rose-400 border-rose-500' : 'text-slate-400 border-slate-600 hover:border-rose-500'}`}
            >
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> Enhancing
            </button>
          </div>
        </div>

        {/* Right Column: Radiomics */}
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
             <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-lg font-semibold text-slate-200">Radiomic Signature</h3>
                  <p className="text-xs text-slate-400">First-order & Texture Features (GLCM/GLRLM)</p>
               </div>
               <Zap className="text-yellow-500 w-5 h-5" />
             </div>
             
             <div className="h-64 w-full">
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
  );
};

export default AnalysisView;