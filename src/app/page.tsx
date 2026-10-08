'use client';
import { useState, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import confetti from 'canvas-confetti';
import dagre from 'dagre';
import RpgNode from '@/components/RpgNode';
import { User, LayoutDashboard, Map, Timer, Calendar, MessageSquare, LogOut, Play, CheckCircle2, Circle, Award, X, KeyRound, Clock, Send, ListTree, Network, Briefcase } from 'lucide-react';

const nodeTypes = { rpgNode: RpgNode };

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 120 });
  nodes.forEach((n) => dagreGraph.setNode(n.id, { width: 280, height: 100 }));
  edges.forEach((e) => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);
  return {
    nodes: nodes.map((n) => ({ ...n, position: { x: dagreGraph.node(n.id).x - 140, y: dagreGraph.node(n.id).y - 50 } })),
    edges,
  };
};

export default function SystemOS() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  const [mapViewMode, setMapViewMode] = useState<'graph' | 'chronological'>('graph');

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [trackCount, setTrackCount] = useState<number>(1);
  const [track1, setTrack1] = useState({ currentSkills: '', dreamJob: '', targetCompany: '' });
  const [track2, setTrack2] = useState({ currentSkills: '', dreamJob: '', targetCompany: '' });
  const [track3, setTrack3] = useState({ currentSkills: '', dreamJob: '', targetCompany: '' });
  
  const [selectedTimeline, setSelectedTimeline] = useState<string>('6 Months');
  const [loading, setLoading] = useState(false);
  const [counselling, setCounselling] = useState('');
  const [roadmapGenerated, setRoadmapGenerated] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<{ role: string; text: string }[]>([
    { role: 'model', text: '[SYSTEM] Career Strategist online. Choose your track count, fill out your custom paths, and set your timeline to begin synchronization.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [trainingActivities, setTrainingActivities] = useState<any[]>([]);
  const [xpBonus, setXpBonus] = useState(100);
  const [todos, setTodos] = useState<{ id: number; text: string; done: boolean; isBonus?: boolean }[]>([]);

  const [resetHourNum, setResetHourNum] = useState<number>(12);
  const [resetAmpm, setResetAmpm] = useState<'AM' | 'PM'>('AM');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('00:00:00');

  const [rewardModal, setRewardModal] = useState<{ title: string; desc: string; xp: number } | null>(null);

  const totalXP = xpBonus;
  const currentLevel = Math.floor(totalXP / 1000) + 1;
  const currentLevelXP = totalXP % 1000;
  const progressPercent = (currentLevelXP / 1000) * 100;
  
  const getRank = (lvl: number) => {
    if (lvl < 3) return 'E-Rank Hunter';
    if (lvl < 6) return 'D-Rank Hunter';
    if (lvl < 10) return 'B-Rank Hunter';
    if (lvl < 15) return 'S-Rank Hunter';
    return 'Shadow Monarch';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('solo_leveling_remember_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    setTimeout(() => {
      const usersDb = JSON.parse(localStorage.getItem('solo_leveling_db') || '{}');

      if (authMode === 'signup') {
        if (usersDb[emailInput]) {
          setAuthMessage('[ERROR] Hunter ID already registered. Proceed to login.');
          setAuthLoading(false);
          return;
        }
        const newUser = { email: emailInput, password: passwordInput, name: nameInput || 'Sung Jinwoo' };
        usersDb[emailInput] = newUser;
        localStorage.setItem('solo_leveling_db', JSON.stringify(usersDb));
        
        const sessionData = { email: newUser.email, name: newUser.name };
        if (rememberMe) {
          localStorage.setItem('solo_leveling_remember_user', JSON.stringify(sessionData));
        }
        setCurrentUser(sessionData);
      } else {
        const existing = usersDb[emailInput];
        if (!existing || existing.password !== passwordInput) {
          setAuthMessage('[ERROR] Invalid Hunter Credentials or Passkey.');
          setAuthLoading(false);
          return;
        }
        const sessionData = { email: existing.email, name: existing.name };
        if (rememberMe) {
          localStorage.setItem('solo_leveling_remember_user', JSON.stringify(sessionData));
        }
        setCurrentUser(sessionData);
      }

      setAuthLoading(false);
      setAuthMessage('');
    }, 1200);
  };

  const handleLogout = () => {
    localStorage.removeItem('solo_leveling_remember_user');
    setCurrentUser(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTrainingActivities(prev => prev.map(act => {
        if (act.active && act.secondsLeft > 0) {
          const nextSec = act.secondsLeft - 1;
          if (nextSec === 0) {
            return { ...act, active: false, failed: true, secondsLeft: 0 };
          }
          return { ...act, secondsLeft: nextSec };
        }
        return act;
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleManualCompleteDrill = (actId: number) => {
    const act = trainingActivities.find(a => a.id === actId);
    if (!act || act.completed || act.failed) return;

    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    const bonusXpReward = act.xp + 50; 
    setXpBonus(xp => xp + bonusXpReward);
    setRewardModal({
      title: "TRAINING GATE CONQUERED (SCHEDULED TIME)",
      desc: `Successfully completed drill: ${act.title}. Extra XP bonus awarded!`,
      xp: bonusXpReward
    });

    setTrainingActivities(prev => prev.map(a => a.id === actId ? { ...a, active: false, completed: true } : a));
  };

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date();
      const target = new Date();
      
      let convertedHour = resetHourNum;
      if (resetAmpm === 'PM' && resetHourNum < 12) convertedHour += 12;
      if (resetAmpm === 'AM' && resetHourNum === 12) convertedHour = 0;

      target.setHours(convertedHour, 0, 0, 0);

      if (now >= target) {
        target.setDate(target.getDate() + 1);
      }

      const diff = target.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');

      setTimeUntilReset(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [resetHourNum, resetAmpm]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'model', text: `[SYSTEM] Tactical advice for "${userMsg}": Maintain execution velocity across your active paths leading up to the S-Rank Dungeon gate.` }]);
      setChatLoading(false);
    }, 800);
  };

  const toggleTodo = (id: number) => {
    setTodos(prevTodos => {
      const updated = prevTodos.map(t => {
        if (t.id === id) {
          const nextState = !t.done;
          if (nextState) {
            const rewardXP = t.isBonus ? 200 : 75;
            setXpBonus(prev => prev + rewardXP);
            setRewardModal({
              title: t.isBonus ? "BONUS GATE CONQUERED!" : "DAILY QUEST COMPLETED",
              desc: `Successfully processed: "${t.text}"`,
              xp: rewardXP
            });
          } else {
            setXpBonus(prev => Math.max(0, prev - 100));
          }
          return { ...t, done: nextState };
        }
        return t;
      });

      const regularQuests = updated.filter(t => !t.isBonus);
      const allRegularDone = regularQuests.length > 0 && regularQuests.every(t => t.done);
      const hasBonus = updated.some(t => t.isBonus);

      if (allRegularDone && !hasBonus) {
        return [
          ...updated,
          { id: Date.now() + 999, text: '[BONUS GATE] Overtime Protocol: Submit 1 Extra Code Refactor Across Active Targets', done: false, isBonus: true }
        ];
      }

      return updated;
    });
  };

  const initGame = () => {
    if (!track1.dreamJob || !track1.targetCompany) return;
    setLoading(true);
    
    setTimeout(() => {
      const primaryCompany = track1.targetCompany;
      const primaryRole = track1.dreamJob;
      const rawSkills = track1.currentSkills.trim().toLowerCase();
      const isBeginner = !rawSkills || rawSkills === 'none' || rawSkills === 'no skill' || rawSkills === 'beginner' || rawSkills === '0' || rawSkills === 'nil';

      setCounselling(`System Analysis: Initialized roadmap toward S-Rank Dungeon gate at [${primaryCompany}]. Mode: [${isBeginner ? 'Absolute Beginner Foundation' : 'Custom Accelerated'}]. Timeline: [${selectedTimeline}].`);
      
      setTodos([
        { id: Date.now() + 1, text: `Complete 1 hour of architecture study for ${primaryCompany}`, done: false, isBonus: false },
        { id: Date.now() + 2, text: `Clear 1 algorithmic bottleneck challenge targeting ${primaryRole}`, done: false, isBonus: false },
        { id: Date.now() + 3, text: `Commit a clean component pull-request matching active targets`, done: false, isBonus: false }
      ]);

      let rawNodes = [];
      if (isBeginner) {
        rawNodes = [
          { id: "1", title: "Phase 1: Zero to Syntax (HTML/CSS/JS Basics)", tier: "E-Rank Dungeon", actionable: { quest: `Awaken basic programming literacy: variables, loops, DOM manipulation, and syntax fundamentals within ${selectedTimeline}.`, githubTopic: "syntax-basics", bossFight: ["Write a clean vanilla JS calculator.", "Explain variable scoping & types."] } },
          { id: "2", title: "Phase 2: Logic & Data Structures", tier: "D-Rank Dungeon", actionable: { quest: "Master arrays, objects, asynchronous programming (promises/async-await), and basic algorithms.", githubTopic: "algorithms", bossFight: ["Implement array map/filter/reduce from scratch.", "Handle asynchronous API fetching."] } },
          { id: "3", title: "Phase 3: Framework Integration & Scaling", tier: "B-Rank Dungeon", actionable: { quest: `Transition into modern frameworks (React/Next.js) and connect with secure backend endpoints for ${primaryCompany}.`, githubTopic: "frameworks", bossFight: ["Build a multi-page interactive web app.", "Secure tokens against XSS vulnerabilities."] } },
          { id: "4", title: `Phase 4: ${primaryCompany} S-Rank Dungeon Gate`, tier: "S-Rank Gate", actionable: { quest: `Simulate the exact engineering panel review and scale a service to 10M traffic bursts for ${primaryRole}.`, githubTopic: "s-rank-gate", bossFight: ["Scale a service to 10M traffic bursts.", "Walk through a major production incident."] } }
        ];
      } else {
        rawNodes = [
          { id: "1", title: `${track1.currentSkills} (E-Rank Core)`, tier: "E-Rank Dungeon", actionable: { quest: `Solidify foundational knowledge for ${track1.targetCompany} within ${selectedTimeline}.`, githubTopic: "fundamentals", bossFight: ["Explain execution closures.", "Handle memory management."] } },
          { id: "2", title: `${track1.dreamJob} Architecture`, tier: "D-Rank Dungeon", actionable: { quest: `Develop reusable component hierarchies and system modules for ${track1.targetCompany}.`, githubTopic: "architecture", bossFight: ["Design a scalable component tree.", "Optimize render lifecycles."] } },
          { id: "3", title: "System Integration & Scaling", tier: "B-Rank Dungeon", actionable: { quest: "Connect frontend layers with secure server-side endpoints and edge caching.", githubTopic: "backend-integration", bossFight: ["Secure tokens against XSS.", "Explain edge caching."] } },
          { id: "4", title: `${track1.targetCompany} S-Rank Dungeon Gate`, tier: "S-Rank Gate", actionable: { quest: `Simulate the exact engineering panel review and scale a service to 10M traffic bursts.`, githubTopic: "s-rank-gate", bossFight: ["Scale a service to 10M traffic bursts.", "Walk through a major production incident."] } }
        ];
      }

      if (trackCount >= 2 && track2.dreamJob) {
        rawNodes.push({ id: "5", title: `${track2.dreamJob} (Track 2 Branch)`, tier: "B-Rank Dungeon", actionable: { quest: `Build secondary competency in ${track2.dreamJob} targeting ${track2.targetCompany || 'Guild 2'}.`, githubTopic: "track-2", bossFight: ["Establish secure API layers.", "Configure edge caching."] } });
      }

      if (trackCount === 3 && track3.dreamJob) {
        rawNodes.push({ id: "6", title: `${track3.dreamJob} (Track 3 Branch)`, tier: "S-Rank Gate", actionable: { quest: `Master tertiary specialization in ${track3.dreamJob} for ${track3.targetCompany || 'Guild 3'}.`, githubTopic: "track-3", bossFight: ["Scale services to high traffic bursts.", "Manage fault-tolerant failovers."] } });
      }

      const rawEdges = [
        { source: "1", target: "2" },
        { source: "2", target: "3" },
        { source: "3", target: "4" }
      ];
      if (trackCount >= 2 && track2.dreamJob) {
        rawEdges.push({ source: "2", target: "5" });
      }
      if (trackCount === 3 && track3.dreamJob) {
        rawEdges.push({ source: "3", target: "6" });
      }

      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const rotatedNodes = [...rawNodes];
      const shiftAmount = dayOfYear % rotatedNodes.length;
      const dailyRotatedSubset = [...rotatedNodes.slice(shiftAmount), ...rotatedNodes.slice(0, shiftAmount)].slice(0, 3);

      const generatedDrills = dailyRotatedSubset.map((n, idx) => ({
        id: idx + 1,
        title: `Training Drill (${selectedTimeline}): ${n.title}`,
        description: n.actionable.quest,
        challenges: n.actionable.bossFight,
        duration: selectedTimeline === '3 Months' ? 600 + idx * 200 : selectedTimeline === '6 Months' ? 1200 + idx * 300 : 1800 + idx * 400,
        secondsLeft: selectedTimeline === '3 Months' ? 600 + idx * 200 : selectedTimeline === '6 Months' ? 1200 + idx * 300 : 1800 + idx * 400,
        xp: 150 + idx * 50,
        active: false,
        completed: false,
        failed: false
      }));
      setTrainingActivities(generatedDrills);

      const formattedNodes: Node[] = rawNodes.map((n: any, idx: number) => ({
        id: n.id, type: 'rpgNode', data: { ...n, status: idx === 0 ? 'unlocked' : 'locked', onSelect: () => setSelectedNode(n) }, position: { x: 0, y: 0 },
      }));
      const formattedEdges: Edge[] = rawEdges.map((e: any) => ({
        id: `e-${e.source}-${e.target}`, source: e.source, target: e.target, animated: true, style: { stroke: '#1e3a8a', strokeWidth: 3 },
      }));

      const layouted = getLayoutedElements(formattedNodes, formattedEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setRoadmapGenerated(true);
      setLoading(false);
    }, 800);
  };

  const completeQuest = (nodeId: string) => {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#3b82f6', '#8b5cf6'] });
    setXpBonus(prev => prev + 250);
    
    const nodeObj = nodes.find(n => n.id === nodeId);
    setRewardModal({
      title: "DUNGEON CLEARED!",
      desc: `Successfully conquered: ${(nodeObj?.data as any)?.title || 'Gate'}`,
      xp: 250
    });
    
    const connectedEdges = edges.filter(e => e.source === nodeId);
    const targetIds = connectedEdges.map(e => e.target);
    
    setNodes((prev) => prev.map((n: Node) => {
      if (n.id === nodeId) return { ...n, data: { ...(n.data as Record<string, unknown>), status: 'completed' } };
      if (targetIds.includes(n.id)) return { ...n, data: { ...(n.data as Record<string, unknown>), status: 'unlocked' } };
      return n;
    }));
    
    setEdges((prev) => prev.map((e: Edge) => {
      if (e.source === nodeId) return { ...e, style: { stroke: '#3b82f6', strokeWidth: 3, filter: 'drop-shadow(0 0 8px #3b82f6)' }, animated: false };
      return e;
    }));
    setSelectedNode(null);
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen bg-[#020617] items-center justify-center font-mono relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a1a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a1a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="w-full max-w-[460px] z-10 bg-[#0f172a]/95 backdrop-blur-md border-2 border-blue-600/50 p-6 md:p-8 shadow-[0_0_60px_rgba(37,99,235,0.25)] relative rounded-sm">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"></div>
          <div className="text-center mb-6 mt-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-widest text-blue-400 uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">[ SYSTEMOS ]</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Solo Leveling Career Roadmap & Gamified Productivity Engine</p>
            <p className="text-blue-300/80 text-[11px] mt-3 leading-relaxed border-t border-b border-blue-900/40 py-2">
              Awaken your Hunter ID, conquer high-difficulty technical training rooms, manage daily quests, and level up your professional engineering career.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6 bg-[#020617] p-1 border border-blue-900/60">
            <button type="button" onClick={() => { setAuthMode('login'); setAuthMessage(''); }} className={`py-2 text-xs font-bold uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>Login</button>
            <button type="button" onClick={() => { setAuthMode('signup'); setAuthMessage(''); }} className={`py-2 text-xs font-bold uppercase tracking-wider transition-all ${authMode === 'signup' ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'text-slate-400 hover:text-slate-200'}`}>Awaken</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'signup' && (
              <div>
                <label className="block text-[10px] uppercase text-blue-400 mb-1 font-bold tracking-widest">Hunter Designation</label>
                <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} required className="w-full bg-[#020617] border border-blue-900 rounded-sm py-3 px-3 outline-none focus:border-blue-500 text-slate-200 text-sm" placeholder="Sung Jinwoo" />
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase text-blue-400 mb-1 font-bold tracking-widest">Player ID / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} required className="w-full bg-[#020617] border border-blue-900 rounded-sm py-3 pl-10 pr-3 outline-none focus:border-blue-500 text-slate-200 text-sm" placeholder="hunter@system.net" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-blue-400 mb-1 font-bold tracking-widest">Security Passkey</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required className="w-full bg-[#020617] border border-blue-900 rounded-sm py-3 pl-10 pr-3 outline-none focus:border-blue-500 text-slate-200 text-sm" placeholder="••••••••" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 accent-blue-600 bg-[#020617] border-blue-900 rounded-sm cursor-pointer" />
              <label htmlFor="remember" className="text-xs text-slate-400 uppercase tracking-wider cursor-pointer">Remember Me</label>
            </div>
            {authMessage && <p className="text-red-400 text-xs text-center font-bold">{authMessage}</p>}
            <button type="submit" disabled={authLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-sm flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] mt-2">
              {authLoading ? 'Connecting to Gate...' : (authMode === 'signup' ? 'Initiate Awakening' : 'Arise (Enter)')} 
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-4 md:p-8 font-mono max-w-5xl mx-auto h-full overflow-y-auto">
            <h1 className="text-2xl md:text-3xl font-black text-blue-400 uppercase tracking-widest mb-6 md:mb-8 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">[ PLAYER STATUS & HUNTER PROFILE ]</h1>
            <div className="bg-[#0f172a]/80 border-2 border-blue-900/50 p-4 md:p-8 relative overflow-hidden mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
               <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
                 <div className="w-24 h-24 md:w-28 md:h-28 border-4 border-blue-500 flex items-center justify-center bg-[#020617] shadow-[0_0_30px_rgba(59,130,246,0.3)] shrink-0">
                   <div className="text-center">
                     <div className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">LVL</div>
                     <div className="text-4xl md:text-5xl font-black text-white">{currentLevel}</div>
                   </div>
                 </div>
                 <div className="flex-1 w-full text-center md:text-left">
                   <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-3 gap-2">
                     <div>
                       <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{getRank(currentLevel)}</h2>
                       <p className="text-blue-400 text-xs md:text-sm uppercase tracking-widest mt-1">Primary Target: {track1.dreamJob || 'Unassigned'} ({selectedTimeline})</p>
                     </div>
                     <div className="text-blue-400 font-bold text-xs md:text-sm tracking-widest">XP: {currentLevelXP} / 1000</div>
                   </div>
                   <div className="h-3 bg-[#020617] border border-blue-900 overflow-hidden relative">
                     <div className="h-full bg-blue-500 transition-all duration-1000 relative shadow-[0_0_10px_rgba(59,130,246,0.8)]" style={{ width: `${progressPercent}%` }}></div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        );

      case 'roadmap':
        return !roadmapGenerated ? (
          <div className="flex h-full items-center justify-center font-mono p-4 overflow-y-auto">
            <div className="w-full max-w-[620px] bg-[#0f172a] border-2 border-blue-900/50 p-6 md:p-8 shadow-[0_0_40px_rgba(37,99,235,0.15)] relative my-auto">
              <h2 className="text-xl md:text-2xl font-black text-blue-400 uppercase tracking-widest mb-2">[ S-RANK DUNGEON ROADMAP SELECTOR ]</h2>
              <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">If you have zero skills or are a beginner, leave Current Skills blank or type "None" to start from absolute zero.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase text-purple-400 mb-2 font-bold tracking-widest">Select Number of Career Paths</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTrackCount(num)}
                        className={`py-2.5 text-center text-xs uppercase font-bold border transition-all ${trackCount === num ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-[#020617] text-slate-300 border-blue-900/60 hover:border-blue-500'}`}
                      >
                        {num} Track {num > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#020617] border border-blue-900/60 p-4 rounded-sm space-y-3">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Career Track 1 (Primary Target)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Current Skills (leave blank if none)" value={track1.currentSkills} onChange={e => setTrack1({...track1, currentSkills: e.target.value})} />
                    <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Job Role" value={track1.dreamJob} onChange={e => setTrack1({...track1, dreamJob: e.target.value})} />
                    <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Company/Guild" value={track1.targetCompany} onChange={e => setTrack1({...track1, targetCompany: e.target.value})} />
                  </div>
                </div>

                {trackCount >= 2 && (
                  <div className="bg-[#020617] border border-blue-900/60 p-4 rounded-sm space-y-3 animate-in fade-in duration-200">
                    <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Career Track 2 (Secondary)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Current Skills" value={track2.currentSkills} onChange={e => setTrack2({...track2, currentSkills: e.target.value})} />
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Job Role" value={track2.dreamJob} onChange={e => setTrack2({...track2, dreamJob: e.target.value})} />
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Company/Guild" value={track2.targetCompany} onChange={e => setTrack2({...track2, targetCompany: e.target.value})} />
                    </div>
                  </div>
                )}

                {trackCount === 3 && (
                  <div className="bg-[#020617] border border-blue-900/60 p-4 rounded-sm space-y-3 animate-in fade-in duration-200">
                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Career Track 3 (Tertiary)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Current Skills" value={track3.currentSkills} onChange={e => setTrack3({...track3, currentSkills: e.target.value})} />
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Job Role" value={track3.dreamJob} onChange={e => setTrack3({...track3, dreamJob: e.target.value})} />
                      <input className="bg-[#0f172a] border border-blue-900/50 p-2 text-xs text-slate-200 outline-none focus:border-blue-500" placeholder="Target Company/Guild" value={track3.targetCompany} onChange={e => setTrack3({...track3, targetCompany: e.target.value})} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase text-blue-400 mb-2 font-bold tracking-widest">Target Timeline Pacing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['3 Months', '6 Months', '1 Year'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedTimeline(t)}
                        className={`py-2 text-center text-xs uppercase font-bold border transition-all ${selectedTimeline === t ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-[#020617] text-slate-300 border-blue-900/60 hover:border-purple-500'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={initGame} disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.5)] disabled:opacity-50 text-sm md:text-base mt-2">
                  {loading ? 'CALCULATING S-RANK MAP...' : 'GENERATE S-RANK MAP & TRAINING'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 relative h-full flex flex-col">
            <div className="bg-[#0f172a] border-b border-blue-900/60 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 md:px-6 z-20 font-mono gap-2">
              <div className="text-xs text-blue-400 font-bold uppercase tracking-wider truncate max-w-full">
                Target: <span className="text-white">{track1.targetCompany}</span> | Goal: <span className="text-white">{track1.dreamJob}</span> ({selectedTimeline})
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <button onClick={() => setRoadmapGenerated(false)} className="px-3 py-1 text-xs uppercase font-bold bg-blue-950 text-blue-400 border border-blue-600 hover:bg-blue-900">
                  Edit Tracks
                </button>
                <div className="flex gap-1 bg-[#020617] p-1 border border-blue-900">
                  <button onClick={() => setMapViewMode('graph')} className={`px-2 md:px-3 py-1 text-xs uppercase font-bold flex items-center gap-1.5 ${mapViewMode === 'graph' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    <Network className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Map</span>
                  </button>
                  <button onClick={() => setMapViewMode('chronological')} className={`px-2 md:px-3 py-1 text-xs uppercase font-bold flex items-center gap-1.5 ${mapViewMode === 'chronological' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                    <ListTree className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Timeline</span>
                  </button>
                </div>
              </div>
            </div>

            {mapViewMode === 'graph' ? (
              <div className="flex-1 relative h-full">
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} fitView>
                  <Background color="#020617" gap={30} size={2} />
                  <Controls className="!bg-[#0f172a] !border-blue-900 !fill-blue-500" />
                </ReactFlow>
                {selectedNode && (
                  <div className="absolute md:relative bottom-0 left-0 w-full md:w-[400px] h-[55vh] md:h-full bg-[#0f172a]/95 border-t-2 md:border-t-0 md:border-l-2 border-blue-600/40 p-4 md:p-6 flex flex-col overflow-y-auto shadow-[0_-20px_50px_rgba(0,0,0,0.8)] md:shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-50">
                    <div className="flex justify-between items-center mb-4 md:mb-6">
                      <span className="text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/30 px-3 py-1 bg-blue-500/10">{(selectedNode.data as any)?.tier}</span>
                      <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-blue-400">✕</button>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6 uppercase font-mono drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{(selectedNode.data as any)?.title}</h2>
                    <div className="space-y-4 flex-1 font-mono">
                      <div className="border border-blue-900/50 bg-[#020617] p-4 md:p-5 border-l-4 border-l-blue-500">
                        <h4 className="text-blue-400 text-xs font-bold tracking-widest mb-2 uppercase">Objective</h4>
                        <p className="text-xs md:text-sm text-slate-300 leading-relaxed">{(selectedNode.data as any)?.actionable?.quest}</p>
                      </div>
                      <div className="border border-purple-900/50 bg-[#020617] p-4 md:p-5 border-l-4 border-l-purple-500 pb-20 md:pb-5">
                        <h4 className="text-purple-400 text-xs font-bold tracking-widest mb-2 uppercase">Boss Encounter</h4>
                        <ul className="list-decimal pl-4 text-xs md:text-sm text-slate-300 space-y-2">
                          {Array.isArray((selectedNode.data as any)?.actionable?.bossFight) && (selectedNode.data as any).actionable.bossFight.map((q: string, i: number) => <li key={i}>{q}</li>)}
                        </ul>
                      </div>
                    </div>
                    <button onClick={() => completeQuest(selectedNode.id)} disabled={(selectedNode.data as any)?.status === 'locked'} className="mt-4 md:mt-6 w-full py-3 md:py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-20 disabled:shadow-none font-mono text-sm md:text-base sticky bottom-0">
                      {(selectedNode.data as any)?.status === 'locked' ? 'LOCKED' : 'CLEAR DUNGEON (+250 XP)'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 bg-[#020617] p-4 md:p-6 overflow-y-auto font-mono max-w-4xl mx-auto w-full pb-20">
                <div className="border-l-2 border-blue-500 pl-4 md:pl-6 space-y-8 my-4">
                  {nodes.map((n: Node, idx: number) => {
                    const nodeData = n.data as any;
                    return (
                      <div key={n.id} className="relative bg-[#0f172a] border border-blue-900/60 p-4 md:p-6 rounded-sm shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                        <div className="absolute -left-[25px] md:-left-[31px] top-6 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#020617] shadow-[0_0_10px_rgba(59,130,246,1)]"></div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Phase {idx + 1} // {nodeData?.tier}</span>
                          <span className={`text-[10px] px-2.5 py-0.5 uppercase font-bold border ${nodeData?.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {nodeData?.status === 'completed' ? 'Cleared' : 'Pending Gate'}
                          </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-black text-white mb-3 uppercase">{nodeData?.title}</h3>
                        <div className="bg-[#020617] border border-blue-900/40 p-3 md:p-4 mb-3">
                          <p className="text-xs text-blue-300 font-bold uppercase mb-1">Gate Objective</p>
                          <p className="text-sm text-slate-200">{nodeData?.actionable?.quest}</p>
                        </div>
                        {nodeData?.actionable?.bossFight && Array.isArray(nodeData.actionable.bossFight) && (
                          <div className="bg-[#020617] border border-purple-900/40 p-3 md:p-4">
                            <p className="text-xs text-purple-400 font-bold uppercase mb-1">Boss Encounter Challenges</p>
                            <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1">
                              {nodeData.actionable.bossFight.map((boss: string, i: number) => <li key={i}>{boss}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 'schedule':
        return (
          <div className="p-4 md:p-8 font-mono max-w-3xl mx-auto h-full flex flex-col overflow-y-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h1 className="text-xl md:text-3xl font-black text-blue-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">[ SYSTEM DAILY & BONUS QUESTS ]</h1>
            </div>
            
            <div className="bg-[#0f172a] border border-blue-900/60 p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400 animate-spin" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Next Daily Reset In</p>
                  <p className="text-xl font-black text-blue-400">{timeUntilReset}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs uppercase text-slate-300">Reset Time (12H):</label>
                <select value={resetHourNum} onChange={(e) => setResetHourNum(Number(e.target.value))} className="bg-[#020617] border border-blue-900 text-blue-400 px-2 py-2 text-xs font-bold outline-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}:00</option>
                  ))}
                </select>
                <select value={resetAmpm} onChange={(e) => setResetAmpm(e.target.value as 'AM' | 'PM')} className="bg-[#020617] border border-blue-900 text-blue-400 px-2 py-2 text-xs font-bold outline-none">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-red-400 mb-4 uppercase tracking-wider">⚠️ System Warning: Unchecking active tasks triggers a -100 XP penalty. Clear all dailies to unlock the Bonus Quest!</p>
            
            <div className="space-y-2 md:space-y-3 overflow-y-auto flex-1 pr-2 pb-20 md:pb-0">
              {!roadmapGenerated ? (
                <div className="text-slate-400 text-sm bg-[#0f172a] border border-blue-900/50 p-6">
                  [SYSTEM NOTICE] Generate your roadmap in the <strong className="text-blue-400">Map</strong> tab to unlock daily quests.
                </div>
              ) : todos.length === 0 ? (
                <div className="text-slate-500 text-sm">Awaiting system quest initialization...</div>
              ) : (
                todos.map(todo => (
                  <div key={todo.id} onClick={() => toggleTodo(todo.id)} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 border cursor-pointer transition-all ${todo.isBonus ? 'border-purple-500/50 bg-purple-950/20' : ''} ${todo.done ? 'bg-blue-950/20 border-blue-900/30 opacity-60' : 'bg-[#0f172a] border-blue-900/50 hover:border-blue-500/50'}`}>
                    {todo.done ? <CheckCircle2 className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${todo.isBonus ? 'text-purple-400' : 'text-blue-500'}`} /> : <Circle className="w-5 h-5 md:w-6 md:h-6 text-slate-600 shrink-0" />}
                    <div className="flex-1">
                      {todo.isBonus && <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500 px-2 py-0.5 rounded-sm uppercase font-bold mr-2">Bonus Gate</span>}
                      <span className={`text-sm md:text-lg ${todo.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>{todo.text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'counseling':
        return (
          <div className="p-4 md:p-8 font-mono max-w-4xl mx-auto h-full flex flex-col">
            <h1 className="text-xl md:text-3xl font-black text-blue-400 uppercase tracking-widest mb-4 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">[ AI CAREER STRATEGIST CHAT ]</h1>
            <div className="flex-1 bg-[#0f172a] border border-blue-900/50 p-4 flex flex-col space-y-4 overflow-hidden mb-16 md:mb-0">
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`p-3 text-sm max-w-[85%] border ${msg.role === 'user' ? 'ml-auto bg-blue-950/40 border-blue-600 text-slate-100' : 'bg-[#020617] border-blue-900/60 text-blue-300'}`}>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{msg.role === 'user' ? 'Hunter' : 'System AI'}</p>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
                {chatLoading && <div className="text-xs text-blue-400 animate-pulse">[SYSTEM] Generating tactical advice...</div>}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-blue-900/40">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI Strategist..." className="flex-1 bg-[#020617] border border-blue-900 p-3 text-sm text-slate-200 outline-none focus:border-blue-500" />
                <button type="submit" disabled={chatLoading} className="px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        );

      case 'tracker':
        return (
          <div className="p-4 md:p-8 font-mono max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
            <h1 className="text-xl md:text-3xl font-black text-blue-400 uppercase tracking-widest mb-2 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">[ TRAINING ROOM ]</h1>
            <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">
              Timeline pacing: <strong className="text-purple-400">{selectedTimeline}</strong>. Complete tasks within scheduled time for <strong className="text-blue-400">extra XP</strong>. 
              Honesty Protocol: You must manually close/complete the timer before it runs out. If the timer expires itself, the task is marked as <strong className="text-red-400">Gate Failed</strong>.
            </p>
            
            <div className="space-y-4 pb-24 md:pb-0">
              {!roadmapGenerated ? (
                <div className="text-slate-400 text-sm bg-[#0f172a] border border-blue-900/50 p-6">
                  [SYSTEM NOTICE] Generate your roadmap in the <strong className="text-blue-400">Map</strong> tab to unlock synchronized training room drills.
                </div>
              ) : trainingActivities.length === 0 ? (
                <div className="text-slate-500 text-sm">Awaiting training gate initialization...</div>
              ) : (
                trainingActivities.map(act => (
                  <div key={act.id} className="bg-[#0f172a] border border-blue-900/60 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-purple-500">
                    <div className="flex-1">
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 uppercase font-bold">Reward: +{act.xp} XP (+50 Bonus in time)</span>
                      <h3 className="text-base md:text-lg font-bold text-white mt-1">{act.title}</h3>
                      <p className="text-xs text-slate-300 mt-1">Objective: {act.description}</p>
                      <ul className="list-disc pl-4 text-[11px] text-purple-300 mt-2 space-y-0.5">
                        {act.challenges?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                      </ul>
                      <p className="text-xs text-slate-500 mt-2">Duration: {Math.floor(act.duration / 60)} minutes ({selectedTimeline} pacing)</p>
                    </div>
                    <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0 pt-2 md:pt-0 border-t border-blue-900/40 md:border-0">
                      <div className="text-2xl font-black text-blue-400">{formatTimer(act.secondsLeft)}</div>
                      {act.completed ? (
                        <span className="px-4 py-2 bg-blue-950/40 text-blue-400 border border-blue-600 text-xs font-bold uppercase">Completed</span>
                      ) : act.failed ? (
                        <span className="px-4 py-2 bg-red-950/40 text-red-400 border border-red-600 text-xs font-bold uppercase">Gate Failed</span>
                      ) : (
                        <div className="flex gap-2">
                          {!act.active && (
                            <button 
                              onClick={() => {
                                setTrainingActivities(trainingActivities.map(a => a.id === act.id ? { ...a, active: true } : a));
                              }} 
                              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                            >
                              <Play className="w-4 h-4" /> Start Drill
                            </button>
                          )}
                          {act.active && (
                            <button 
                              onClick={() => handleManualCompleteDrill(act.id)} 
                              className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wider text-xs flex items-center gap-1 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                            >
                              Close & Claim
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <>
      {rewardModal && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f172a] border-2 border-blue-500 p-6 shadow-[0_0_50px_rgba(59,130,246,0.5)] relative rounded-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)]"></div>
            <button onClick={() => setRewardModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6 mt-2">
              <Award className="w-12 h-12 text-blue-400 mx-auto mb-3 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              <h2 className="text-xl font-black text-blue-400 uppercase tracking-widest">{rewardModal.title}</h2>
              <p className="text-xs text-slate-400 uppercase mt-1">System Reward Acquired</p>
            </div>
            <div className="bg-[#020617] border border-blue-900/60 p-4 mb-6 space-y-2 text-center">
              <p className="text-sm text-slate-200">{rewardModal.desc}</p>
              <p className="text-lg font-black text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">+{rewardModal.xp} XP</p>
            </div>
            <button onClick={() => setRewardModal(null)} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              Claim Reward
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden selection:bg-blue-500/30 relative">
        <div className="w-full md:w-64 bg-[#0f172a] border-t-2 md:border-t-0 md:border-r-2 border-blue-900/50 flex flex-col z-40 shrink-0 order-2 md:order-1 h-16 md:h-full">
          <div className="hidden md:block p-6 border-b-2 border-blue-900/50 text-center">
            <h1 className="font-black text-2xl tracking-widest text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">SYSTEM</h1>
          </div>
          <nav className="p-2 md:p-4 flex flex-row md:flex-col justify-around md:justify-start gap-1 md:space-y-2 font-mono flex-1">
            <button onClick={() => setActiveTab('dashboard')} className={`flex-1 md:w-full flex flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm uppercase tracking-wider font-bold transition-all rounded-sm md:rounded-none ${activeTab === 'dashboard' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 shadow-[inset_0_0_15px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#020617]'}`}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Status</span>
            </button>
            <button onClick={() => setActiveTab('roadmap')} className={`flex-1 md:w-full flex flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm uppercase tracking-wider font-bold transition-all rounded-sm md:rounded-none ${activeTab === 'roadmap' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 shadow-[inset_0_0_15px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#020617]'}`}>
              <Map className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Map</span>
            </button>
            <button onClick={() => setActiveTab('counseling')} className={`flex-1 md:w-full flex flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm uppercase tracking-wider font-bold transition-all rounded-sm md:rounded-none ${activeTab === 'counseling' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 shadow-[inset_0_0_15px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#020617]'}`}>
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Counselling</span>
            </button>
            <button onClick={() => setActiveTab('schedule')} className={`flex-1 md:w-full flex flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm uppercase tracking-wider font-bold transition-all rounded-sm md:rounded-none ${activeTab === 'schedule' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 shadow-[inset_0_0_15px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#020617]'}`}>
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Quests</span>
            </button>
            <button onClick={() => setActiveTab('tracker')} className={`flex-1 md:w-full flex flex-row items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-3 text-[10px] md:text-sm uppercase tracking-wider font-bold transition-all rounded-sm md:rounded-none ${activeTab === 'tracker' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50 shadow-[inset_0_0_15px_rgba(37,99,235,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-[#020617]'}`}>
              <Timer className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Training</span>
            </button>
          </nav>
          <div className="hidden md:block p-4 border-t-2 border-blue-900/50">
            <button onClick={handleLogout} className="w-full flex flex-row items-center gap-3 px-4 py-3 text-sm uppercase tracking-wider font-bold text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all font-mono">
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-[#020617] relative order-1 md:order-2 overflow-hidden h-[calc(100vh-4rem)] md:h-screen">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a1a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a1a_1px,transparent_1px)] bg-[size:16px_16px] md:bg-[size:24px_24px] pointer-events-none z-0"></div>
          <div className="relative z-10 h-full">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}