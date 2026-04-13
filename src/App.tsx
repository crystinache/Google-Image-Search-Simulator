/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Search, X, User, Upload, Save, RefreshCw } from 'lucide-react';

// --- Assets (Static paths from public folder) ---
const screenshot1 = '/screenshot1.jpg';
const screenshot2 = '/screenshot2.jpg';
const delpiero = '/delpiero.jpg';
const therock = '/therock.jpg';
const leonardo = '/LeonardoDiCaprio.jpg';

// --- FILM Assets ---
const screenshot1Film = '/Screenshot1FILM.jpg';
const screenshot2Film = '/Screenshot2FILM.jpg';
const immagine1Film = '/Immagine1FILM.jpg';
const immagine2Film = '/Immagine2FILM.jpg';
const immagine3Film = '/Immagine3FILM.jpg';

// --- Types ---
interface Preset {
  id: string;
  name: string;
  forceImageName: string;
  searchText: string;
  defaultImages: {
    image1: string;
    image2: string;
    expandedImage1: string;
    expandedImage2: string;
    expandedImage3: string;
  };
}

interface AppSettings {
  activePresetId: string;
  searchText: string;
  image1: string | null;
  image2: string | null;
  expandedImage1: string | null;
  expandedImage2: string | null;
  expandedImage3: string | null;
}

const PRESETS: Record<string, Preset> = {
  default: {
    id: 'default',
    name: 'Pagina predefinita',
    forceImageName: 'Leonardo Di Caprio',
    searchText: 'persone famose',
    defaultImages: {
      image1: screenshot1,
      image2: screenshot2,
      expandedImage1: delpiero,
      expandedImage2: therock,
      expandedImage3: leonardo,
    }
  },
  film: {
    id: 'film',
    name: 'Preset 1 FILM',
    forceImageName: 'NAPOLEON',
    searchText: 'locandine film',
    defaultImages: {
      image1: screenshot1Film,
      image2: screenshot2Film,
      expandedImage1: immagine1Film,
      expandedImage2: immagine2Film,
      expandedImage3: immagine3Film,
    }
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  activePresetId: 'default',
  searchText: PRESETS.default.searchText,
  image1: PRESETS.default.defaultImages.image1,
  image2: PRESETS.default.defaultImages.image2,
  expandedImage1: PRESETS.default.defaultImages.expandedImage1,
  expandedImage2: PRESETS.default.defaultImages.expandedImage2,
  expandedImage3: PRESETS.default.defaultImages.expandedImage3,
};

// --- Components ---

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('google_sim_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Helper to check if a path is an old or broken path
        const isInvalidPath = (path: string | null) => 
          !path || 
          path.includes('.png') || 
          path.includes('/src/') ||
          (!path.startsWith('data:') && !path.startsWith('/'));

        // We always start with the 'default' preset as per user request
        const preset = PRESETS.default;

        return {
          ...parsed,
          activePresetId: 'default',
          searchText: preset.searchText,
          image1: isInvalidPath(parsed.image1) ? preset.defaultImages.image1 : parsed.image1,
          image2: isInvalidPath(parsed.image2) ? preset.defaultImages.image2 : parsed.image2,
          expandedImage1: isInvalidPath(parsed.expandedImage1) ? preset.defaultImages.expandedImage1 : parsed.expandedImage1,
          expandedImage2: isInvalidPath(parsed.expandedImage2) ? preset.defaultImages.expandedImage2 : parsed.expandedImage2,
          expandedImage3: isInvalidPath(parsed.expandedImage3) ? preset.defaultImages.expandedImage3 : parsed.expandedImage3,
        };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasLoadedSecond, setHasLoadedSecond] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [expandedImage, setExpandedImage] = useState<1 | 2 | 3 | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // --- Preloading Logic ---
  const preloadImages = (imageUrls: (string | null)[]) => {
    imageUrls.forEach(url => {
      if (url && !url.startsWith('data:')) {
        const img = new Image();
        img.src = url;
      }
    });
  };

  // Preload Default Preset on Mount
  useEffect(() => {
    const defaultImages = Object.values(PRESETS.default.defaultImages);
    preloadImages(defaultImages);
  }, []);

  // Preload Film Preset when activated
  useEffect(() => {
    if (settings.activePresetId === 'film') {
      const filmImages = Object.values(PRESETS.film.defaultImages);
      preloadImages(filmImages);
    }
  }, [settings.activePresetId]);

  // Persistence - Sync settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('google_sim_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Errore nel salvataggio delle impostazioni:', error);
      // If localStorage is full, we might want to alert the user or handle it
    }
  }, [settings]);

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setIsMenuOpen(false);
    setHasLoadedSecond(false);
    setClickCount(0);
    setExpandedImage(null);
    window.scrollTo(0, 0);
  };

  // Scroll Pause Logic
  useEffect(() => {
    if (isMenuOpen || expandedImage) return;

    const handleScroll = () => {
      if (hasLoadedSecond) {
        if (loadingRef.current) {
          const rect = loadingRef.current.getBoundingClientRect();
          if (rect.top > window.innerHeight) {
            setHasLoadedSecond(false);
          }
        }
        return;
      }

      if (isPaused) return;

      if (loadingRef.current) {
        const rect = loadingRef.current.getBoundingClientRect();
        if (rect.top <= window.innerHeight && rect.top > 0) {
          setIsPaused(true);
          document.body.style.overflow = 'hidden';
          
          window.scrollTo({
            top: window.scrollY + rect.top - window.innerHeight + 1,
            behavior: 'auto'
          });

          setTimeout(() => {
            setIsPaused(false);
            setHasLoadedSecond(true);
            document.body.style.overflow = 'auto';
          }, 1000);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: false });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPaused, hasLoadedSecond, isMenuOpen, expandedImage]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, key: keyof AppSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size - localStorage has limits (~5MB total)
      if (file.size > 2 * 1024 * 1024) {
        alert('L\'immagine è troppo grande. Prova con un file più piccolo di 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGlobalClick = (e: React.MouseEvent) => {
    if (isMenuOpen || expandedImage) return;

    // Exclude clicks on the user icon to avoid interfering with double-click
    const target = e.target as HTMLElement;
    if (target.closest('.user-icon-trigger')) return;

    // ONLY allow clicks on the screenshots (main content area)
    if (!target.closest('[data-screenshot-area="true"]')) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount === 1) {
      if (settings.expandedImage1) setExpandedImage(1);
    } else if (nextCount === 2) {
      if (settings.expandedImage2) setExpandedImage(2);
    } else if (nextCount === 3) {
      if (settings.expandedImage3) setExpandedImage(3);
    }
  };

  const handlePersonDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempSettings(settings);
    setIsMenuOpen(true);
    document.body.style.overflow = 'auto';
  };

  const handleExpandedClick = (e: React.MouseEvent) => {
    const clickY = e.clientY;
    const threshold = window.innerHeight / 10; // Top 10%
    if (clickY < threshold) {
      if (expandedImage === 3) {
        // Redirect to Google Images search
        const query = encodeURIComponent(settings.searchText);
        window.location.href = `https://www.google.com/search?q=${query}&tbm=isch`;
      } else {
        setExpandedImage(null);
      }
    }
  };

  const handleAiModeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPresetId = settings.activePresetId === 'default' ? 'film' : 'default';
    const preset = PRESETS[newPresetId];
    
    const newSettings = {
      ...settings,
      activePresetId: newPresetId,
      searchText: preset.searchText,
      image1: preset.defaultImages.image1,
      image2: preset.defaultImages.image2,
      expandedImage1: preset.defaultImages.expandedImage1,
      expandedImage2: preset.defaultImages.expandedImage2,
      expandedImage3: preset.defaultImages.expandedImage3,
    };
    
    setSettings(newSettings);
    setHasLoadedSecond(false);
    setClickCount(0);
    setExpandedImage(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans select-none bg-white">
      <AnimatePresence mode="wait">
        {!isMenuOpen ? (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleGlobalClick}
            className="flex flex-col w-full"
          >
            {/* --- Header - Now relative to scroll with content --- */}
            <header className="bg-white w-full">
              <div className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <Menu className="text-gray-500 w-6 h-6" />
                  <div className="flex items-center">
                    <span className="text-[#4285F4] font-bold text-2xl">G</span>
                    <span className="text-[#EA4335] font-bold text-2xl">o</span>
                    <span className="text-[#FBBC05] font-bold text-2xl">o</span>
                    <span className="text-[#4285F4] font-bold text-2xl">g</span>
                    <span className="text-[#34A853] font-bold text-2xl">l</span>
                    <span className="text-[#EA4335] font-bold text-2xl">e</span>
                  </div>
                  <div 
                    onDoubleClick={handlePersonDoubleClick}
                    className="user-icon-trigger w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer active:bg-gray-300 transition-colors"
                  >
                    <User className="text-gray-500 w-5 h-5" />
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative flex items-center bg-white border border-gray-200 rounded-full shadow-sm px-4 py-1.5 mb-4">
                  <input
                    type="text"
                    value={settings.searchText}
                    onChange={(e) => setSettings({ ...settings, searchText: e.target.value })}
                    className="flex-1 outline-none text-gray-800 text-base"
                  />
                  <X 
                    className="text-gray-400 w-5 h-5 mx-2 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSettings({ ...settings, searchText: '' });
                    }}
                  />
                  <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
                  <div className="bg-[#4285F4] p-1.5 rounded-r-full -mr-4 ml-2">
                    <Search className="text-white w-5 h-5" />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto no-scrollbar text-sm font-medium text-gray-500 gap-6 whitespace-nowrap border-b border-gray-100">
                  <div 
                    onDoubleClick={handleAiModeDoubleClick}
                    className="pb-2 cursor-pointer"
                  >
                    AI Mode
                  </div>
                  <div className="pb-2">Tutti</div>
                  <div className="pb-2 text-[#4285F4] border-b-2 border-[#4285F4]">Immagini</div>
                  <div className="pb-2">Notizie</div>
                  <div className="pb-2">Video</div>
                  <div className="pb-2">Mappe</div>
                </div>
              </div>
            </header>

            {/* Indicator Dots for 3rd click */}
            {clickCount >= 2 && (
              <>
                <div className="fixed top-1 left-1 w-1 h-1 bg-black rounded-full z-[100] pointer-events-none opacity-40"></div>
                <div className="fixed bottom-1 right-1 w-1 h-1 bg-black rounded-full z-[100] pointer-events-none opacity-40"></div>
              </>
            )}

            {/* --- Content --- */}
            <main className="flex-1 flex flex-col" data-screenshot-area="true">
              {/* First Screenshot */}
              <div className="w-full">
                {settings.image1 ? (
                  <img 
                    src={settings.image1} 
                    alt="Screenshot 1" 
                    className="w-full h-auto block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-[9/16] bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    primo screenshot
                  </div>
                )}
              </div>

              {/* Loading Zone / Pause Trigger */}
              <div ref={loadingRef} className="w-full h-1 bg-transparent"></div>

              {/* Spinner during pause */}
              <AnimatePresence>
                {isPaused && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 100 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full flex items-center justify-center bg-white overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <RefreshCw className="w-8 h-8 text-[#4285F4]" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Second Screenshot */}
              <div className={`w-full transition-opacity duration-300 ${hasLoadedSecond ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                {settings.image2 ? (
                  <img 
                    src={settings.image2} 
                    alt="Screenshot 2" 
                    className="w-full h-auto block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-[9/16] bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                    secondo screenshot
                  </div>
                )}
              </div>
            </main>

            {/* --- Expanded Image View --- */}
            <AnimatePresence>
              {expandedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleExpandedClick}
                  className="fixed inset-0 z-[60] bg-black overflow-y-auto"
                >
                  <div className="w-full min-h-full">
                    <img 
                      src={
                        expandedImage === 1 ? settings.expandedImage1! : 
                        expandedImage === 2 ? settings.expandedImage2! : 
                        settings.expandedImage3!
                      } 
                      className="w-full h-auto block"
                      alt="Expanded"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>


        ) : (
          <motion.div
            key="secret-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-50 flex flex-col overflow-y-auto"
          >
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Menu Segreto</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)} 
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-8 flex-1">
                {editingPresetId ? (
                  <div className="space-y-8">
                    <button 
                      onClick={() => setEditingPresetId(null)}
                      className="text-[#4285F4] font-medium flex items-center gap-2 mb-4"
                    >
                      ← Torna ai Preset
                    </button>
                    
                    <h3 className="text-xl font-bold text-gray-800">{PRESETS[editingPresetId].name}</h3>

                    {/* Main Screenshots */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Screenshot 1</label>
                        <div 
                          onClick={() => document.getElementById('file1')?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:border-[#4285F4] transition-all bg-gray-50 h-32 overflow-hidden relative group"
                        >
                          {tempSettings.image1 ? (
                            <img src={tempSettings.image1} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          ) : null}
                          <Upload className="w-6 h-6 text-gray-400 relative z-10" />
                          <input id="file1" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'image1')} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Screenshot 2</label>
                        <div 
                          onClick={() => document.getElementById('file2')?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:border-[#4285F4] transition-all bg-gray-50 h-32 overflow-hidden relative group"
                        >
                          {tempSettings.image2 ? (
                            <img src={tempSettings.image2} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                          ) : null}
                          <Upload className="w-6 h-6 text-gray-400 relative z-10" />
                          <input id="file2" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'image2')} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Images */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Immagini Espandibili</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1: Prima immagine selezionata (1° click)</label>
                        <div 
                          onClick={() => document.getElementById('exp1')?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#4285F4] transition-all bg-gray-50 h-40 overflow-hidden relative group"
                        >
                          {tempSettings.expandedImage1 ? (
                            <img src={tempSettings.expandedImage1} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                          ) : null}
                          <Upload className="w-8 h-8 text-gray-400 mb-2 relative z-10" />
                          <span className="text-sm text-gray-500 relative z-10">Tocca per caricare</span>
                          <input id="exp1" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'expandedImage1')} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2: Seconda immagine selezionata (2° click)</label>
                        <div 
                          onClick={() => document.getElementById('exp2')?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#4285F4] transition-all bg-gray-50 h-40 overflow-hidden relative group"
                        >
                          {tempSettings.expandedImage2 ? (
                            <img src={tempSettings.expandedImage2} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                          ) : null}
                          <Upload className="w-8 h-8 text-gray-400 mb-2 relative z-10" />
                          <span className="text-sm text-gray-500 relative z-10">Tocca per caricare</span>
                          <input id="exp2" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'expandedImage2')} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3: Terza immagine selezionata (3° click)</label>
                        <div 
                          onClick={() => document.getElementById('exp3')?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#4285F4] transition-all bg-gray-50 h-40 overflow-hidden relative group"
                        >
                          {tempSettings.expandedImage3 ? (
                            <img src={tempSettings.expandedImage3} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                          ) : null}
                          <Upload className="w-8 h-8 text-gray-400 mb-2 relative z-10" />
                          <span className="text-sm text-gray-500 relative z-10">Tocca per caricare</span>
                          <input id="exp3" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'expandedImage3')} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Categorie Preset</h3>
                    {Object.values(PRESETS).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setEditingPresetId(preset.id);
                          // When switching preset in menu, we load its default or current settings
                          // For simplicity, we just allow editing the current active settings
                          // but labeled as the preset.
                        }}
                        className="w-full text-left p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-all group"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-gray-800 text-lg">{preset.name}</div>
                            <div className="text-sm text-gray-500">Force image: {preset.forceImageName}</div>
                            <div className="text-sm text-gray-500">Search word: {preset.searchText}</div>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5 text-[#4285F4]" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Utility */}
                <div className="pt-4 space-y-4">
                  <button 
                    onClick={() => {
                      setClickCount(0);
                      alert('Contatore click resettato');
                    }}
                    className="text-sm text-[#4285F4] font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resetta contatore click ({clickCount})
                  </button>

                  <button 
                    onClick={() => {
                      if (confirm('Vuoi davvero ripristinare le immagini predefinite?')) {
                        localStorage.removeItem('google_sim_settings');
                        setTempSettings(DEFAULT_SETTINGS);
                        setSettings(DEFAULT_SETTINGS);
                        alert('Impostazioni resettate. L\'app verrà ricaricata.');
                        window.location.reload();
                      }
                    }}
                    className="text-sm text-red-500 font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Ripristina immagini predefinite
                  </button>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Nota:</strong> Per rendere le immagini "definitive" per tutti, caricale nel pannello dei file a sinistra come <code>screenshot1.jpg</code>, <code>screenshot2.jpg</code>, <code>delpiero.jpg</code>, <code>therock.jpg</code> e <code>LeonardoDiCaprio.jpg</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pb-4">
                <button 
                  onClick={() => saveSettings(tempSettings)}
                  className="w-full bg-[#4285F4] text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-[#3367D6] active:scale-[0.98] transition-all shadow-xl shadow-blue-100"
                >
                  <Save className="w-6 h-6" />
                  Salva e Applica
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


