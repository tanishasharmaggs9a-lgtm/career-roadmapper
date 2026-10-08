import { Handle, Position } from '@xyflow/react';
import { Lock, Unlock, CheckCircle } from 'lucide-react';

export default function RpgNode({ data }: any) {
  const isLocked = data.status === 'locked';
  const isCompleted = data.status === 'completed';

  let borderStyle = 'border-blue-900/50 bg-[#0f172a]/90 text-slate-500';
  let icon = <Lock className="w-4 h-4 text-slate-500" />;

  if (isCompleted) {
    borderStyle = 'border-blue-500 bg-[#020617] shadow-[0_0_15px_rgba(59,130,246,0.5)] text-white';
    icon = <CheckCircle className="w-4 h-4 text-blue-400" />;
  } else if (!isLocked) {
    borderStyle = 'border-purple-500 bg-[#020617] shadow-[0_0_15px_rgba(168,85,247,0.4)] text-purple-300';
    icon = <Unlock className="w-4 h-4 text-purple-400" />;
  }

  return (
    <div className={`w-[280px] p-4 rounded-sm border-2 transition-all font-mono ${borderStyle} ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 cursor-pointer hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]'}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !border-none !rounded-none" />
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{data.tier}</span>
        {icon}
      </div>
      <h3 className="font-black uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">{data.title}</h3>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !border-none !rounded-none" />
    </div>
  );
}