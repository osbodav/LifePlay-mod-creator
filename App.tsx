
import React, { useState } from 'react';
import { ModCategory, ItemType, ClothingType, ShopLocation, LPItem, GeneratedAssets } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);

  const [item, setItem] = useState<LPItem>({
    category: ModCategory.ITEM,
    id: 'luxury_wine_01',
    name: 'Vintage Red Wine',
    type: ItemType.CONSUMABLE,
    price: 85,
    description: 'A fine vintage from the local vineyards.',
    location: ShopLocation.SUPERMARKET,
    availability: '0 - 24',
    imagePrompt: 'elegant red wine bottle with detailed label, high-end game asset',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      const newCategory = value as ModCategory;
      setItem(prev => ({
        ...prev,
        category: newCategory,
        type: newCategory === ModCategory.ITEM ? ItemType.OBJECT : ClothingType.TOP,
        location: newCategory === ModCategory.ITEM ? ShopLocation.SUPERMARKET : ShopLocation.CLOTHES
      }));
    } else {
      setItem(prev => ({
        ...prev,
        [name]: name === 'price' ? parseInt(value) || 0 : value
      }));
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const [script, image] = await Promise.all([
        geminiService.generateItemScript(item),
        geminiService.generateItemTexture(item.imagePrompt, item.category)
      ]);

      setAssets({
        script,
        imageUrl: `data:image/png;base64,${image.base64}`,
        base64Image: image.base64
      });
    } catch (err: any) {
      setError(err.message || 'Generation failed. Check API key and content guidelines.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!assets) return;
    
    const scriptBlob = new Blob([assets.script], { type: 'text/plain' });
    const scriptUrl = URL.createObjectURL(scriptBlob);
    const scriptLink = document.createElement('a');
    scriptLink.href = scriptUrl;
    scriptLink.download = `${item.id}.lpmod`;
    scriptLink.click();

    const imageLink = document.createElement('a');
    imageLink.href = assets.imageUrl!;
    imageLink.download = `${item.id}.png`;
    imageLink.click();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
                <i className="fa-solid fa-blueprint text-white text-2xl"></i>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">LifePlay Mod Studio</h1>
            </div>
            <p className="text-slate-400">Validated for LifePlay 2023_04_Stable_64bit</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-orange-500/20 px-3 py-1 rounded border border-orange-500/30 text-orange-400 flex items-center gap-1">
                <i className="fa-solid fa-unlock text-[8px]"></i> Unrestricted Mode
              </span>
              <span className="bg-slate-800 px-3 py-1 rounded border border-slate-700 text-cyan-400">Engine: LP Script v2</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <i className="fa-solid fa-sliders text-cyan-500"></i> MOD SETTINGS
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mod Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleInputChange({ target: { name: 'category', value: ModCategory.ITEM } } as any)}
                      className={`py-2 px-4 rounded-lg text-sm font-bold border transition-all ${item.category === ModCategory.ITEM ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      General Item
                    </button>
                    <button 
                      onClick={() => handleInputChange({ target: { name: 'category', value: ModCategory.CLOTHING } } as any)}
                      className={`py-2 px-4 rounded-lg text-sm font-bold border transition-all ${item.category === ModCategory.CLOTHING ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    >
                      Clothing
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Internal ID (Matches Folder)</label>
                    <input name="id" value={item.id} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-cyan-400 font-mono text-sm focus:border-cyan-500 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Display Name</label>
                    <input name="name" value={item.name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{item.category === ModCategory.ITEM ? 'Cost ($)' : 'Price ($)'}</label>
                    <input type="number" name="price" value={item.price} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Asset Type</label>
                    <select name="type" value={item.type} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none">
                      {item.category === ModCategory.ITEM 
                        ? Object.values(ItemType).map(v => <option key={v} value={v}>{v}</option>)
                        : Object.values(ClothingType).map(v => <option key={v} value={v}>{v}</option>)
                      }
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Shop Location</label>
                  <select name="location" value={item.location} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none">
                    {Object.values(ShopLocation).map(v => <option key={v} value={v}>{v.replace('_', ' ')}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Visual Style Prompt</label>
                  <textarea name="imagePrompt" value={item.imagePrompt} onChange={handleInputChange} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:border-cyan-500 outline-none resize-none" />
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 py-3 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <><i className="fa-solid fa-atom fa-spin"></i> Processing...</> : <><i className="fa-solid fa-sparkles"></i> Build Mod Package</>}
                </button>
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {assets ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 w-full">Generated {item.category === ModCategory.CLOTHING ? 'Texture' : 'Icon'}</h3>
                    <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner">
                      <img src={assets.imageUrl!} alt="Preview" className="w-64 h-64 object-contain rounded-lg" />
                    </div>
                    <p className="mt-4 text-xs font-mono text-cyan-400">{item.id}.png</p>
                  </div>

                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase mb-4">Installation Steps</h3>
                    <div className="space-y-4 text-sm text-slate-300">
                      <div className="flex gap-3">
                        <span className="bg-cyan-500/20 text-cyan-400 w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                        <p>Create folder: <code className="bg-slate-950 px-2 py-0.5 rounded text-white font-mono">Modules/{item.id}/</code></p>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-cyan-500/20 text-cyan-400 w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                        <p>Place <code className="text-cyan-400">{item.id}.lpmod</code> inside that folder.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="bg-cyan-500/20 text-cyan-400 w-6 h-6 rounded flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                        <p>Place <code className="text-cyan-400">{item.id}.png</code> inside the same folder.</p>
                      </div>
                      <button onClick={handleDownload} className="w-full mt-4 bg-white text-slate-900 py-2 rounded-lg font-bold hover:bg-slate-200 transition-colors">
                        Download Package
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-file-code text-cyan-400"></i>
                      <span className="text-sm font-mono font-bold text-slate-300">{item.id}.lpmod</span>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(assets.script); alert('Copied!'); }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-tighter"
                    >
                      Copy Code
                    </button>
                  </div>
                  <div className="p-6 bg-[#0d1117]">
                    <pre className="font-mono text-sm text-cyan-100 overflow-x-auto leading-relaxed">
                      {assets.script}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                  <i className="fa-solid fa-box-open text-4xl text-slate-700"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-500">Ready for Construction</h3>
                <p className="max-w-xs text-slate-600 mt-2">Configure your item and click "Build Mod Package". Safety layers are configured for full creative freedom.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
