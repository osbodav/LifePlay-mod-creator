
import React, { useState, useEffect } from 'react';
import { ModCategory, ShopLocation, LPItem, GeneratedAssets, ClothingSlot, ItemType } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const [item, setItem] = useState<LPItem>({
    category: ModCategory.ITEM,
    author: 'Vinfamy',
    version: '1.0.0',
    modName: 'Expansion Pack',
    id: 'luxury_socks_01',
    name: 'Silk Crew Socks',
    type: ItemType.OBJECT,
    slot: ClothingSlot.FOOT_UNDER,
    price: 25,
    description: 'Ultra-soft silk socks for extreme comfort.',
    location: ShopLocation.CLOTHES,
    availability: '0 - 24',
    imagePrompt: 'Soft silk socks, professional game icon style, white background',
    gender: 'Female',
    ageRange: '18-40',
    personality: 'Chic',
    triggerActions: 'all',
    triggerLocations: 'home',
    triggerTime: '0 - 24',
    actorConditions: '',
    plotPrompt: '',
    rehydrate: false,
    satiate: false,
    energyBoost: false,
    minutes: '5',
    timeoutMinutes: 0,
    effects: '',
    actionConditions: '',
    moveFirst: false,
    sceneAlways: '',
    animation: ''
  });

  // "Smart Detection" Effect
  useEffect(() => {
    const lowerName = item.name.toLowerCase();
    const lowerId = item.id.toLowerCase();
    
    if (item.category === ModCategory.CLOTHING) {
      if (lowerName.includes('sock') || lowerId.includes('sock')) {
        setItem(prev => ({ ...prev, slot: ClothingSlot.FOOT_UNDER }));
      } else if (lowerName.includes('shoe') || lowerName.includes('heel') || lowerName.includes('boot')) {
        setItem(prev => ({ ...prev, slot: ClothingSlot.FOOT }));
      } else if (lowerName.includes('shirt') || lowerName.includes('top') || lowerName.includes('bra')) {
        setItem(prev => ({ ...prev, slot: ClothingSlot.TOP }));
      } else if (lowerName.includes('pant') || lowerName.includes('skirt') || lowerName.includes('short')) {
        setItem(prev => ({ ...prev, slot: ClothingSlot.BOTTOM }));
      }
    } else if (item.category === ModCategory.ITEM) {
      if (lowerName.includes('cup') || lowerName.includes('drink') || lowerName.includes('wine') || lowerName.includes('water')) {
        setItem(prev => ({ ...prev, type: ItemType.CONSUMABLE, rehydrate: true }));
      } else if (lowerName.includes('food') || lowerName.includes('meal') || lowerName.includes('snack')) {
        setItem(prev => ({ ...prev, type: ItemType.CONSUMABLE, satiate: true }));
      }
    }
  }, [item.name, item.category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    setItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'price' || name === 'timeoutMinutes' ? parseInt(value) || 0 : value)
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const [manifest, script, image] = await Promise.all([
        geminiService.generateManifest(item),
        item.category === ModCategory.CHARACTER 
          ? geminiService.generateCharacterPreset(item)
          : item.category === ModCategory.SCENE
            ? geminiService.generateSceneScript(item)
            : item.category === ModCategory.ACTION
              ? geminiService.generateActivityScript(item)
              : geminiService.generateItemScript(item),
        geminiService.generateItemTexture(item.imagePrompt, item.category)
      ]);
      setAssets({ manifest, script, imageUrl: `data:image/png;base64,${image.base64}`, base64Image: image.base64 });
    } catch (err: any) {
      setError(err.message || 'Assembly failed.');
    } finally {
      setLoading(false);
    }
  };

  const triggerDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleDownloadAll = () => {
    if (!assets) return;
    triggerDownload(assets.manifest, `${item.id}_mod.lpmod`);
    const ext = item.category === ModCategory.CHARACTER ? 'lpcharacter' : item.category === ModCategory.SCENE ? 'lpscene' : 'lpaction';
    triggerDownload(assets.script, `${item.id}.${ext}`);
    const imageLink = document.createElement('a');
    imageLink.href = assets.imageUrl!;
    imageLink.download = `${item.id}.png`;
    imageLink.click();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-4 rounded-3xl shadow-2xl shadow-cyan-500/20 transform hover:rotate-12 transition-transform">
              <i className="fa-solid fa-puzzle-piece text-white text-4xl"></i>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">Architect <span className="text-cyan-500">v3.0</span></h1>
              <p className="text-slate-500 mt-2 font-bold tracking-[0.2em] uppercase text-[11px] flex items-center gap-2">
                <i className="fa-solid fa-bolt text-cyan-500 animate-pulse"></i> Intelligent Asset Assembly
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowLibrary(true)} className="bg-slate-900 border border-slate-700 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 active:scale-95 shadow-xl">
              <i className="fa-solid fa-book-open text-cyan-400"></i> Engine Specs
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Construction Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
              
              <h2 className="text-[10px] font-black mb-10 flex items-center gap-3 text-slate-500 tracking-[0.4em] uppercase">
                <i className="fa-solid fa-wrench text-cyan-500"></i> Blueprints
              </h2>

              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.values(ModCategory).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => handleInputChange({ target: { name: 'category', value: cat } } as any)}
                        className={`py-4 rounded-2xl text-[10px] font-black border transition-all ${item.category === cat ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-600/30 scale-105' : 'bg-slate-950/50 border-slate-800 text-slate-600 hover:border-slate-600'}`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest group-focus-within:text-cyan-500 transition-colors">Display Name</label>
                    <input name="name" value={item.name} onChange={handleInputChange} placeholder="e.g. Silk Socks" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-cyan-500 outline-none transition-all shadow-inner placeholder:text-slate-800" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">UniqueID</label>
                      <input name="id" value={item.id} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-400 font-mono text-xs focus:border-cyan-500 outline-none shadow-inner" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Price</label>
                      <input type="number" name="price" value={item.price} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-cyan-500 outline-none shadow-inner" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-800/50 space-y-8">
                  {item.category === ModCategory.CLOTHING && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        Clothing Slot
                        {item.name && <span className="text-[9px] text-cyan-500 lowercase bg-cyan-500/10 px-2 py-0.5 rounded-full">Inferred from name</span>}
                      </label>
                      <select name="slot" value={item.slot} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-slate-300 focus:border-cyan-500 outline-none">
                        {Object.values(ClothingSlot).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <p className="text-[10px] text-slate-600 italic leading-relaxed">
                        Socks go on <span className="text-cyan-500">Foot_Under</span>, Shoes go on <span className="text-cyan-500">Foot</span>.
                      </p>
                    </div>
                  )}

                  {item.category === ModCategory.ITEM && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage Logic</label>
                        <select name="type" value={item.type} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs font-bold text-slate-300 focus:border-cyan-500 outline-none">
                          {Object.values(ItemType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      
                      {item.type === ItemType.CONSUMABLE && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${item.rehydrate ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                            <input type="checkbox" name="rehydrate" checked={item.rehydrate} onChange={handleInputChange} className="hidden" />
                            <i className="fa-solid fa-droplet text-xl"></i>
                            <span className="text-[8px] font-black uppercase">Drinkable</span>
                          </label>
                          <label className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${item.satiate ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                            <input type="checkbox" name="satiate" checked={item.satiate} onChange={handleInputChange} className="hidden" />
                            <i className="fa-solid fa-utensils text-xl"></i>
                            <span className="text-[8px] font-black uppercase">Edible</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-10 border-t border-slate-800/50">
                  <label className="block text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">Texture Visualization</label>
                  <textarea name="imagePrompt" value={item.imagePrompt} onChange={handleInputChange} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-xs italic text-slate-400 resize-none outline-none leading-relaxed shadow-inner" />
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 py-6 rounded-[1.5rem] font-black text-white shadow-2xl shadow-cyan-900/30 transition-all hover:scale-[1.02] active:scale-[0.95] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs"
                >
                  {loading ? <><i className="fa-solid fa-sync fa-spin"></i> Processing...</> : <><i className="fa-solid fa-hammer"></i> Finalize Mod</>}
                </button>
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-8">
            {assets ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* File List */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Assembled Output</h3>
                      <button onClick={handleDownloadAll} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Zip-Ready
                      </button>
                    </div>
                    <div className="space-y-4 relative z-10">
                      <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl"><i className="fa-solid fa-file-contract"></i></div>
                          <div>
                            <p className="text-cyan-100 font-black text-xs">{item.id}_mod.lpmod</p>
                            <p className="text-slate-600 text-[10px] font-bold uppercase mt-1">Module Manifest</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl"><i className="fa-solid fa-code"></i></div>
                          <div>
                            <p className="text-purple-100 font-black text-xs">{item.id}.lpaction</p>
                            <p className="text-slate-600 text-[10px] font-bold uppercase mt-1">Logic Definition</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                      <i className="fa-solid fa-cube text-9xl"></i>
                    </div>
                  </div>

                  {/* Smart Info */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-[2.5rem] p-10 shadow-xl">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Intelligence Report</h3>
                    <div className="space-y-6">
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block mb-2">Usage Slot</span>
                        <p className="text-sm font-bold text-slate-300">
                          {item.category === ModCategory.CLOTHING 
                            ? `Attaches to ${item.slot} body part` 
                            : item.type === ItemType.CONSUMABLE 
                              ? `Consumable activity detected` 
                              : `General world object`}
                        </p>
                      </div>
                      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-2">Interactive Hooks</span>
                        <p className="text-xs font-medium text-slate-500 italic">
                          {item.rehydrate ? 'Hydration boost triggered on use.' : ''}
                          {item.satiate ? ' Hunger reduction triggered on use.' : ''}
                          {!item.rehydrate && !item.satiate ? 'Standard inventory placement.' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Script Display */}
                <div className="bg-slate-950 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl border-cyan-500/10">
                  <div className="bg-slate-900 px-12 py-6 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                      </div>
                      <span className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">{item.id}.lpaction</span>
                    </div>
                  </div>
                  <div className="bg-[#05070a] p-12 min-h-[400px]">
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto leading-[2] whitespace-pre-wrap">
                      {assets.script.split('\n').map((line, i) => {
                        const isDialogue = line.includes('::');
                        const isBlockStart = line.startsWith('ITEM') || line.startsWith('CLOTHING') || line.startsWith('ACTION');
                        return (
                          <div key={i} className="hover:bg-cyan-500/[0.04] px-4 -mx-4 rounded-lg transition-colors group">
                            <span className="inline-block w-12 text-slate-800 select-none mr-6 text-right group-hover:text-slate-600">{i+1}</span>
                            <span className={isBlockStart ? 'text-cyan-400 font-black' : isDialogue ? 'text-emerald-400' : ''}>{line}</span>
                          </div>
                        )
                      })}
                    </pre>
                  </div>
                </div>

                {/* Visual */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-[4rem] p-20 flex flex-col items-center justify-center relative group">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase mb-12 tracking-[0.6em] text-center">Reference Texture</h4>
                  <div className="relative group cursor-pointer" onClick={() => {
                          const link = document.createElement('a');
                          link.href = assets.imageUrl!;
                          link.download = `${item.id}.png`;
                          link.click();
                        }}>
                    <div className="absolute -inset-20 bg-cyan-500 blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
                    <img src={assets.imageUrl!} className="relative z-10 w-96 h-96 aspect-square object-contain rounded-3xl shadow-2xl bg-black border border-white/5 transition-all duration-700 group-hover:scale-105 group-hover:rotate-1" alt="Texture" />
                    <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="bg-white/10 backdrop-blur-2xl border border-white/20 px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-2xl">
                         Export Icon
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[900px] border-2 border-dashed border-slate-800/40 rounded-[5rem] flex flex-col items-center justify-center text-center p-24 transition-all group hover:bg-slate-900/[0.02] hover:border-slate-700/50">
                <div className="relative mb-16">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[200px] rounded-full scale-150 animate-pulse"></div>
                  <div className="bg-slate-900/80 p-16 rounded-[4rem] shadow-2xl border border-slate-800 relative z-10 transform group-hover:rotate-6 transition-transform duration-1000">
                    <i className="fa-solid fa-cube text-9xl text-slate-800 group-hover:text-cyan-600 transition-colors duration-700"></i>
                  </div>
                </div>
                <h3 className="text-5xl font-black text-slate-300 group-hover:text-white transition-colors tracking-tighter uppercase italic leading-tight">Assembly Core <span className="text-cyan-600">Offline</span></h3>
                <p className="max-w-xl mx-auto mt-10 text-base text-slate-500 leading-relaxed font-bold tracking-wide">
                  The architect is monitoring input for smart usage patterns. Define your item's name to automatically infer engine slots and interaction logic.
                </p>
                <div className="mt-20 flex gap-12">
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-700 group-hover:text-cyan-500 transition-all group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                       <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Smart Slot</span>
                   </div>
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-700 group-hover:text-purple-500 transition-all group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                       <i className="fa-solid fa-bottle-water text-2xl"></i>
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">Consumables</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lookup Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-10 animate-in fade-in zoom-in duration-700">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setShowLibrary(false)}></div>
          <div className="relative w-full max-w-6xl max-h-[85vh] bg-[#0a0f18] border border-slate-800 rounded-[4rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-12 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase tracking-[0.1em]">Engine Reference</h2>
                <p className="text-slate-500 text-[10px] mt-4 font-black tracking-[0.4em] uppercase">LifePlay 2023.04 Modular Standards</p>
              </div>
              <button onClick={() => setShowLibrary(false)} className="bg-slate-900 p-5 rounded-full hover:bg-red-900/20 hover:text-red-500 transition-all border border-slate-800 active:scale-90">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-16 space-y-20 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-10">
                    <h3 className="text-cyan-500 font-black text-xs uppercase tracking-[0.3em] border-l-4 border-cyan-500 pl-6">Clothing Slots</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(ClothingSlot).map(m => (
                        <div key={m} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-[11px] font-mono text-slate-400 group cursor-pointer hover:border-cyan-500/50 transition-all hover:bg-cyan-500/[0.03]" onClick={() => {
                          navigator.clipboard.writeText(m);
                          alert(`Engine key ${m} injected into clipboard.`);
                        }}>
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-10">
                    <h3 className="text-purple-500 font-black text-xs uppercase tracking-[0.3em] border-l-4 border-purple-500 pl-6">Stat Keys</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['hunger', 'thirst', 'energy', 'mood', 'fitness', 'attractiveness', 'arousal', 'intelligence', 'cooking', 'interpersonal', 'muscle'].map(m => (
                        <div key={m} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-[11px] font-mono text-slate-400 group cursor-pointer hover:border-purple-500/50 transition-all hover:bg-purple-500/[0.03]" onClick={() => {
                          navigator.clipboard.writeText(m);
                          alert(`Stat key ${m} injected into clipboard.`);
                        }}>
                          {m}
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
            <div className="p-12 bg-slate-950 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.6em] animate-pulse">Select Any Key for Manual Injection</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
