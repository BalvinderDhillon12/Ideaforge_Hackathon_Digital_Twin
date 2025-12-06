
import React from 'react';
import { ViewState } from '../types';
import { 
  Activity, 
  Brain, 
  Upload, 
  Dna,
  Settings,
  Server
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, onOpenSettings }) => {
  const menuItems = [
    { id: ViewState.UPLOAD, label: 'Upload Scan', icon: Upload },
    { id: ViewState.ANALYSIS, label: 'Segmentation & Radiomics', icon: Brain },
    { id: ViewState.TREATMENT, label: 'Treatment Planning', icon: Activity },
    { id: ViewState.DIGITAL_TWIN, label: 'Digital Twin Sim', icon: Dna },
  ];

  return (
    <div className="w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-20 transition-all duration-300">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <Activity className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">NeuroTwin AI</h1>
          <p className="text-xs text-slate-400">Oncology Suite v2.0</p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">System Online</span>
          </div>
          <p className="text-[10px] text-slate-500">MAML Model: Ready</p>
          <p className="text-[10px] text-slate-500">SAC Agent: Idle</p>
        </div>

        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Connection Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
