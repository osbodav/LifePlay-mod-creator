
import React, { useState, useEffect } from 'react';
import { ModCategory, ShopLocation, LPItem, GeneratedAssets, ClothingSlot, ItemType } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const [item, setItem] = useState<LPItem>({
    category: ModCategory.ITEM,
    author: 'Vinfamy',
    version: '1.0.0',
    modName: 'World Expansion',
    id: 'vintage_wine_glass',
    name: 'Vintage Red Wine',
    type: ItemType.CONSUMABLE,
    slot: ClothingSlot.TOP,
    price: 35,
    description: 'A fine vintage wine served in a crystal glass. Induces mild relaxation.',
    location: ShopLocation.MALL,
    availability: '0 - 24',
    imagePrompt: 'Crystal wine glass with red wine, realistic lighting, game icon style',
    gender: 'Female',
    rehydrate: true,
    satiate: false,
    energyBoost: false,
    intoxicate: true,
    animation: 'drink',
    plotPrompt: 'The character takes a sip of the wine and feels relaxed, potentially leading to a romantic encounter.',
    sceneActors: 'Player, Romantic Partner',
    linkSceneToItem: false,
    outfitCategory: 'casual',
    clothingTags: ''
  });

  // Smart Detection Logic
  useEffect(() => {
    const name = item.name.toLowerCase();
    
    if (item.category === ModCategory.CLOTHING) {
      setItem(p => ({ ...p, animation: 'wear' }));
      if (name.includes('sock')) setItem(p => ({ ...p, slot: ClothingSlot.FOOT_UNDER, clothingTags: (p.clothingTags || '') + (p.clothingTags?.includes('sock') ? '' : 'socks') }));
      else if (name.includes('shoe') || name.includes('heel') || name.includes('boot')) setItem(p => ({ ...p, slot: ClothingSlot.FOOT, clothingTags: (p.clothingTags || '') + (p.clothingTags?.includes('shoes') ? '' : 'shoes') }));
      else if (name.includes('pant') || name.includes('skirt') || name.includes('short')) setItem(p => ({ ...p, slot: ClothingSlot.BOTTOM }));
      else if (name.includes('shirt') || name.includes('top') || name.includes('coat')) setItem(p => ({ ...p, slot: ClothingSlot.TOP }));
      
      if (name.includes('bikini') || name.includes('swim')) setItem(p => ({ ...p, outfitCategory: 'swim' }));
      else if (name.includes('suit') || name.includes('office')) setItem(p => ({ ...p, outfitCategory: 'work' }));
      else if (name.includes('gown') || name.includes('dress')) setItem(p => ({ ...p, outfitCategory: 'formal' }));
    } 
    
    else if (item.category === ModCategory.ITEM) {
      const isAlcohol = name.includes('wine') || name.includes('beer') || name.includes('vodka');
      const isFood = name.includes('food') || name.includes('snack') || name.includes('meal') || name.includes('burger');
      const isDrink = name.includes('drink') || name.includes('water') || name.includes('tea') || name.includes('coffee') || isAlcohol;

      if (isAlcohol || isFood || isDrink) {
        setItem(p => ({ 
          ...p, 
          type: ItemType.CONSUMABLE, 
          rehydrate: isDrink, 
          satiate: isFood, 
          intoxicate: isAlcohol,
          energyBoost: name.includes('coffee') || name.includes('energy'),
          animation: isFood ? 'eat' : 'drink'
        }));
      }
    } else if (item.category === ModCategory.ACTION) {
      if (name.includes('sleep') || name.includes('nap')) setItem(p => ({ ...p, animation: 'sleep' }));
      else if (name.includes('sit') || name.includes('rest')) setItem(p => ({ ...p, animation: 'sit' }));
      else if (name.includes('smoke')) setItem(p => ({ ...p, animation: 'smoke' }));
      else if (name.includes('study') || name.includes('read') || name.includes('book')) {
        setItem(p => ({ ...p, animation: 'type', plotPrompt: p.plotPrompt || 'Character spends time focusing on their studies to improve their intelligence.' }));
      }
      else if (name.includes('gym') || name.includes('workout') || name.includes('lift') || name.includes('run')) {
        setItem(p => ({ ...p, animation: 'gym', plotPrompt: p.plotPrompt || 'Character pushes their physical limits at the local gym.' }));
      }
      else if (name.includes('work') || name.includes('office') || name.includes('job')) {
        setItem(p => ({ ...p, animation: 'type', plotPrompt: p.plotPrompt || 'Character works hard at their professional responsibilities.' }));
      }
      else if (name.includes('social') || name.includes('party') || name.includes('talk')) {
        setItem(p => ({ ...p, animation: 'call', plotPrompt: p.plotPrompt || 'Character interacts with others to build their social network.' }));
      }
    }
  }, [item.name, item.category]);

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!item.id.trim()) errors.push("Engine ID is missing.");
    if (!/^[a-zA-Z0-9_]+$/.test(item.id)) errors.push("Engine ID must be alphanumeric (no spaces).");
    if (!item.name.trim()) errors.push("Display Name is missing.");
    if (!item.author.trim()) errors.push("Author name is missing.");
    
    if ((item.category === ModCategory.SCENE || item.linkSceneToItem) && !item.plotPrompt?.trim()) {
      errors.push("Plot / Scenario prompt is required for scenes.");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const checked = (e.target as HTMLInputElement).checked;
    setItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'price' ? parseInt(value) || 0 : value)
    }));
    if (validationErrors.length > 0) setValidationErrors([]);
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setLoading(true); setError(null); setAssets(null);
    try {
      const tasks: Promise<any>[] = [
        geminiService.generateManifest(item),
        item.category === ModCategory.CHARACTER 
          ? geminiService.generateCharacterPreset(item)
          : item.category === ModCategory.SCENE
            ? geminiService.generateSceneScript(item)
            : geminiService.generateItemScript(item),
        geminiService.generateRegistryEntries(item),
        geminiService.generateItemTexture(item.imagePrompt, item.category, item)
      ];

      const isItemWithScene = item.category === ModCategory.ITEM && item.linkSceneToItem;
      if (isItemWithScene) {
        tasks.push(geminiService.generateSceneScript(item));
      }

      const results = await Promise.all(tasks);
      const manifest = results[0];
      const script = results[1];
      const registry = results[2];
      const image = results[3];
      const linkedScene = isItemWithScene ? results[4] : null;

      let finalRegistry = registry;
      if (linkedScene) {
        finalRegistry += `\n\n## LINKED SCENE FILE: ${item.id}_scene.lpscene ##\n${linkedScene}`;
      }

      const imageUrl = image.base64 ? `data:image/png;base64,${image.base64}` : null;

      setAssets({ manifest, script, registryEntries: finalRegistry, imageUrl, base64Image: image.base64 });
    } catch (err: any) {
      setError(err.message || 'Asset generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = () => {
    if (!assets) return;
    const triggerDownload = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
    };

    triggerDownload(assets.manifest, `${item.id}_mod.lpmod`);
    const ext = item.category === ModCategory.CHARACTER ? 'lpcharacter' : item.category === ModCategory.SCENE ? 'lpscene' : 'lpaction';
    triggerDownload(assets.script, `${item.id}.${ext}`);
    if (assets.registryEntries) triggerDownload(assets.registryEntries, `MOD_INSTRUCTIONS.txt`);
    if (assets.imageUrl) {
      const imgL = document.createElement('a'); 
      imgL.href = assets.imageUrl; 
      imgL.download = `${item.id}.png`; 
      imgL.click();
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-slate-800 pb-10">
          <div className="flex items-center gap-6">
            <div className="bg-gradient-to-tr from-cyan-600 to-indigo-700 p-5 rounded-[2rem] shadow-2xl transform hover:scale-110 transition-transform">
              <i className="fa-solid fa-shirt text-white text-4xl"></i>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white uppercase italic leading-none">Mod Architect <span className="text-cyan-500">v6.0</span></h1>
              <p className="text-slate-500 mt-2 font-bold tracking-[0.2em] uppercase text-[10px] flex items-center gap-2">
                <i className="fa-solid fa-code-branch text-cyan-500"></i> Enhanced Clothing Engine
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowLibrary(true)} className="bg-slate-900 border border-slate-700 px-8 py-3 rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl uppercase tracking-widest">
              Engine Reference
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Editor Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800 rounded-[3rem] p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-600"></div>
              
              <h2 className="text-[10px] font-black mb-10 text-slate-500 tracking-[0.4em] uppercase border-b border-slate-800 pb-6 flex items-center gap-3">
                <i className="fa-solid fa-sliders text-cyan-500"></i> Blueprint Settings
              </h2>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Mod Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.values(ModCategory).map(cat => (
                      <button 
                        key={cat}
                        onClick={() => handleInputChange({ target: { name: 'category', value: cat } } as any)}
                        className={`py-4 rounded-xl text-[9px] font-black border transition-all ${item.category === cat ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Display Name</label>
                    <input name="name" value={item.name} onChange={handleInputChange} placeholder="E.g. Vintage Red Wine or Summer Silk Dress" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm focus:border-cyan-500 outline-none" />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Description</label>
                    <textarea name="description" value={item.description} onChange={handleInputChange} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs focus:border-cyan-500 outline-none resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Engine ID</label>
                      <input name="id" value={item.id} onChange={handleInputChange} placeholder="E.g. wine_red" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-cyan-500 font-mono text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Animation</label>
                      <input name="animation" value={item.animation} onChange={handleInputChange} placeholder="drink, eat, wear..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs outline-none" />
                    </div>
                  </div>
                </div>

                {/* Clothing Specific UI */}
                {item.category === ModCategory.CLOTHING && (
                  <div className="pt-10 border-t border-slate-800/50 space-y-6 animate-in fade-in">
                    <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                      <i className="fa-solid fa-shirt"></i> Clothing Blueprint
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Slot</label>
                        <select name="slot" value={item.slot} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none appearance-none">
                          {Object.values(ClothingSlot).map(slot => <option key={slot} value={slot}>{slot}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Gender</label>
                        <select name="gender" value={item.gender} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none appearance-none">
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Unisex">Unisex</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Outfit Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['casual', 'work', 'sports', 'swim', 'formal', 'sleepwear'].map(cat => (
                          <button 
                            key={cat}
                            onClick={() => handleInputChange({ target: { name: 'outfitCategory', value: cat } } as any)}
                            className={`py-2 rounded-lg text-[8px] font-black border transition-all ${item.outfitCategory === cat ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}
                          >
                            {cat.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Custom Tags (CSV)</label>
                      <input name="clothingTags" value={item.clothingTags} onChange={handleInputChange} placeholder="skirt, tight, leather..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none" />
                    </div>
                  </div>
                )}

                <div className="pt-10 border-t border-slate-800/50 space-y-10">
                  {/* Category Specific UI */}
                  {(item.category === ModCategory.SCENE || item.linkSceneToItem || item.category === ModCategory.ACTION) && (
                    <div className="space-y-6 p-6 bg-slate-950/50 rounded-3xl border border-slate-800 animate-in fade-in">
                      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-clapperboard"></i> Logic Config
                      </h3>
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase">Scenario / Plot Prompt</label>
                        <textarea name="plotPrompt" value={item.plotPrompt} onChange={handleInputChange} rows={3} placeholder="Describe the scene events..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs outline-none" />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-500 uppercase">Actors</label>
                        <input name="sceneActors" value={item.sceneActors} onChange={handleInputChange} placeholder="Player, Sarah, etc." className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs outline-none" />
                      </div>
                    </div>
                  )}

                  {item.category === ModCategory.ITEM && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        {['rehydrate', 'satiate', 'intoxicate', 'energyBoost'].map(key => (
                          <label key={key} className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${(item as any)[key] ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950 border-slate-800 text-slate-700'}`}>
                            <input type="checkbox" name={key} checked={(item as any)[key]} onChange={handleInputChange} className="hidden" />
                            <i className={`fa-solid ${key === 'rehydrate' ? 'fa-droplet' : key === 'satiate' ? 'fa-burger' : key === 'intoxicate' ? 'fa-wine-glass' : 'fa-bolt-lightning'} text-lg`}></i>
                            <span className="text-[8px] font-black uppercase tracking-widest">{key}</span>
                          </label>
                        ))}
                      </div>
                      <label className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${item.linkSceneToItem ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                        <input type="checkbox" name="linkSceneToItem" checked={item.linkSceneToItem} onChange={handleInputChange} className="w-4 h-4 rounded bg-slate-900 border-slate-700" />
                        <p className="text-[10px] font-black uppercase">Trigger Scripted Scene</p>
                      </label>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-600 uppercase mb-2">Shop Location & Price</label>
                    <div className="grid grid-cols-2 gap-4">
                      <select name="location" value={item.location} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none">
                        {Object.values(ShopLocation).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                      <input name="price" type="number" value={item.price} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs outline-none" />
                    </div>
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <ul className="text-[9px] text-red-400 font-bold space-y-1 list-disc pl-4">
                      {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                <button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-indigo-700 py-6 rounded-3xl font-black text-white shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-4 uppercase tracking-[0.4em] text-xs"
                >
                  {loading ? <i className="fa-solid fa-sync fa-spin"></i> : <i className="fa-solid fa-bolt"></i>} Synthesize Mod
                </button>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8">
            {error && (
              <div className="mb-6 p-6 bg-red-500/10 border border-red-500/30 rounded-[2rem] text-red-400 text-sm font-bold flex items-center gap-4 animate-in slide-in-from-top-4">
                <i className="fa-solid fa-triangle-exclamation"></i>
                {error}
              </div>
            )}
            
            {assets ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-slate-950 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Assembled Files</h3>
                      <button onClick={handleDownloadAll} className="bg-cyan-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase">Download</button>
                    </div>
                    <div className="space-y-3">
                       {[`${item.id}_mod.lpmod`, `${item.id}.${item.category === ModCategory.SCENE ? 'lpscene' : item.category === ModCategory.CHARACTER ? 'lpcharacter' : 'lpaction'}`, `${item.id}.png`].map(f => (
                         <div key={f} className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center gap-4 text-[10px] font-mono text-slate-300">
                           <i className={`fa-solid ${f.includes('lpmod') ? 'fa-shield' : f.includes('png') ? 'fa-image' : 'fa-code'}`}></i>
                           {f}
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-slate-900/30 border border-slate-800 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden">
                    <h3 className="absolute top-10 left-10 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Generated Texture</h3>
                    {assets.imageUrl ? (
                      <img src={assets.imageUrl} className="w-48 h-48 object-contain rounded-3xl shadow-2xl bg-black border border-white/5" alt="Mod Icon" />
                    ) : (
                      <div className="w-48 h-48 bg-slate-950 rounded-3xl border border-slate-800 flex items-center justify-center">
                        <i className="fa-solid fa-image-slash text-4xl text-slate-800"></i>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                   <div className="bg-slate-900 px-10 py-5 border-b border-slate-800 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.id}.{item.category === ModCategory.SCENE ? 'lpscene' : 'lpaction'}</span>
                   </div>
                   <div className="bg-[#04060a] p-12 overflow-x-auto">
                     <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                       {assets.script}
                     </pre>
                   </div>
                </div>

                {assets.registryEntries && (
                  <div className="p-12 bg-indigo-900/5 border border-indigo-500/20 rounded-[3.5rem]">
                    <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-6">Engine Registry Data</h3>
                    <pre className="bg-black/40 p-8 rounded-2xl font-mono text-[11px] text-slate-400">{assets.registryEntries}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[800px] border-2 border-dashed border-slate-800/40 rounded-[5rem] flex flex-col items-center justify-center text-center p-20 group">
                <i className="fa-solid fa-cube text-8xl text-slate-800 group-hover:text-cyan-600 transition-all"></i>
                <h3 className="text-4xl font-black text-slate-500 mt-10 uppercase italic">Idle Architect</h3>
                <p className="max-w-md mx-auto mt-6 text-slate-600 text-sm font-medium">Configure your mod variables on the left. The engine will automatically generate textures and logic scripts following LifePlay's stable branch syntax.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-12">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowLibrary(false)}></div>
          <div className="relative w-full max-w-5xl bg-[#0a0f18] border border-slate-800 rounded-[4rem] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-12 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-3xl font-black text-white uppercase tracking-widest italic">Engine Reference</h2>
              <button onClick={() => setShowLibrary(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            <div className="p-12 overflow-y-auto space-y-12">
               <div>
                 <h3 className="text-cyan-500 font-black text-xs uppercase mb-6 tracking-widest">Animations</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {['drink', 'eat', 'sit', 'wear', 'smoke', 'dance', 'call', 'type', 'wash_face', 'sleep', 'gym'].map(a => (
                     <div key={a} className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 text-center uppercase">{a}</div>
                   ))}
                 </div>
               </div>
               <div>
                 <h3 className="text-indigo-500 font-black text-xs uppercase mb-6 tracking-widest">Stat Keys</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {['fitness', 'intelligence', 'interpersonal', 'cooking', 'attractiveness', 'money', 'mood', 'energy'].map(s => (
                     <div key={s} className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 text-center uppercase">{s}</div>
                   ))}
                 </div>
               </div>
               <div>
                 <h3 className="text-purple-500 font-black text-xs uppercase mb-6 tracking-widest">Logic Blocks</h3>
                 <div className="space-y-4 font-mono text-[10px] text-slate-500">
                    <div className="p-6 bg-black rounded-2xl border border-slate-800">
                      <p className="text-indigo-400 mb-2">// Random Stat Change</p>
                      <p>intelligence += random(0, 1)</p>
                      <p>energy -= random(5, 10)</p>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
