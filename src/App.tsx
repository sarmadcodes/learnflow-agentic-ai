import React, { useState, useEffect, useRef } from 'react';
import { Download, BookOpen, Brain, Zap, X, RotateCw, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for scrolling
  const studyPlanRef = useRef<HTMLDivElement>(null);

  // Scroll-aware navbar
  const lastScrollY = useRef(0);
  const [navbarVisible, setNavbarVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY.current && current > 80) {
        setNavbarVisible(false);
      } else if (current < lastScrollY.current) {
        setNavbarVisible(true);
      }
      lastScrollY.current = current;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Custom cursor (desktop only)
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (window.innerWidth < 1024) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.1;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.1;

      if (cursorDot.current) {
        cursorDot.current.style.transform = `translate(${mouse.current.x - 6}px, ${mouse.current.y - 6}px)`;
      }
      if (cursorRing.current) {
        cursorRing.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
      }
      requestAnimationFrame(animate);
    };

    document.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

 
  useEffect(() => {
    if (result && studyPlanRef.current) {
      studyPlanRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:8001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, days }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert('Backend not running on port 8001.\nPlease start your FastAPI server.');
    } finally {
      setLoading(false);
    }
  };

  const downloadAnki = async () => {
    if (!result?.flashcards?.length) return;
    try {
      const res = await fetch('http://localhost:8001/api/download-anki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.flashcards),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'learnflow-deck.apkg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate Anki deck. Please ensure the backend is running.');
    }
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRing} className="fixed top-0 left-0 w-10 h-10 border-2 border-indigo-500 rounded-full pointer-events-none z-[9999] hidden lg:block" />
      <div ref={cursorDot} className="fixed top-0 left-0 w-3 h-3 bg-indigo-600 rounded-full pointer-events-none z-[9999] hidden lg:block" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-800">

        {/* Navbar */}
       <motion.header
  initial={{ opacity: 0, y: -50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-300"
>
  <div className="container mx-auto px-6 py-4 flex items-center justify-between">
    

    <div className="flex items-center gap-3">
      <Brain className="w-9 h-9 text-indigo-600" />
      <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
        LearnFlow
      </h1>
    </div>

 
    <div className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 backdrop-blur-md border border-gray-200 px-5 py-2.5 rounded-full shadow-lg text-sm md:text-base">
      <p className="font-medium text-white">AI-Powered Study Planner</p>
    </div>


    <button
      onClick={() => setMobileMenuOpen((v) => !v)}
      className="md:hidden"
    >
      <Menu className="w-7 h-7 text-gray-700" />
    </button>
  </div>


  {mobileMenuOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200 py-4 text-center"
    >
      <p className="text-lg font-semibold text-gray-700">
        AI-Powered Study Planner
      </p>
    </motion.div>
  )}
</motion.header>


        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 px-5 py-3 rounded-full shadow-lg mb-8 text-sm md:text-base">
            <Brain className="w-6 h-6 text-indigo-600" />
            <span className="font-semibold text-gray-700">Trusted by thousands</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold max-w-5xl mx-auto leading-tight">
            Master any topic with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              AI-powered
            </span>{" "} precision.
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="mt-6 text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4">
            Personalized study plans • Instant Anki decks • Practice questions • Fully private
          </motion.p>
        </section>

        {/* Input Card */}
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-12 -mt-8">
            <div className="grid md:grid-cols-3 gap-8 items-end">
              <div className="md:col-span-2">
                <label className="block text-lg md:text-xl font-semibold text-gray-800 mb-3">Topic to Master</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., Calculus, React, Spanish..."
                  className="w-full px-6 py-5 text-base md:text-lg rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-lg md:text-xl font-semibold text-gray-800 mb-3">Duration (Days)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="flex-1 h-3 bg-gray-200 rounded-full slider"
                  />
                  <span className="text-3xl md:text-4xl font-bold text-indigo-600 min-w-[3ch] text-right">{days}</span>
                </div>
                <p className="text-sm text-gray-500 text-right mt-1">{days === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="mt-10 w-full py-6 rounded-2xl font-bold text-xl md:text-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white"
            >
              {loading ? 'Generating Study Plan...' : 'Generate Study Plan'}
            </button>
          </motion.div>
        </div>

        {/* Results */}
        {result && (
          <div className="container mx-auto px-6 max-w-7xl mt-20 space-y-16 md:space-y-20">

            {/* Study Plan */}
            <motion.section
              ref={studyPlanRef}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-14"
            >
              <div className="flex items-center gap-4 mb-8">
                <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-indigo-600" />
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Study Plan
                </h2>
              </div>
              <div className="prose prose-lg md:prose-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.study_plan}
              </div>
            </motion.section>

            {/* Flashcards */}
{result.flashcards?.length > 0 && (
  <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-14">
    <div className="flex items-center gap-4 mb-10">
      <Brain className="w-10 h-10 md:w-12 md:h-12 text-blue-600" />
      <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
        Flashcards ({result.flashcards.length})
      </h2>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {result.flashcards.map((card: any, i: number) => (
        <motion.div
          key={i}
          layoutId={`card-${i}`}
          onClick={() => { setSelectedCard({ ...card, index: i }); setIsFlipped(false); }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300"
        >
          <p className="font-bold text-blue-900 text-base md:text-lg mb-2">Question</p>
          <p className="text-gray-800 text-sm line-clamp-4">{card.question}</p>
          <p className="text-xs text-indigo-600 mt-3 opacity-70">Tap to flip</p>
        </motion.div>
      ))}
    </div>
  </motion.section>
)}

            {/* Flashcard Modal */}
            {selectedCard && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedCard(null)}
              >
                <motion.div
                  layoutId={`card-${selectedCard.index}`}
                  className="relative w-full max-w-2xl h-96 md:h-[520px]"
                  style={{ perspective: 1500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <motion.div
                    className="relative w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 shadow-2xl border-4 border-blue-300 flex flex-col justify-center items-center text-center">
                      <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition shadow">
                        <X className="w-6 h-6 text-gray-700" />
                      </button>
                      <Brain className="w-14 h-14 md:w-16 md:h-16 text-blue-600 mb-6" />
                      <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6">Question</h3>
                      <p className="text-base md:text-lg text-gray-800 leading-relaxed px-4">{selectedCard.question}</p>
                      <button onClick={() => setIsFlipped(!isFlipped)} className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition flex items-center gap-2">
                        <RotateCw className="w-5 h-5" /> Show Answer
                      </button>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-2xl border-4 border-indigo-400 flex flex-col justify-center items-center text-center">
                      <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition shadow">
                        <X className="w-6 h-6 text-gray-700" />
                      </button>
                      <Zap className="w-14 h-14 md:w-16 md:h-16 text-purple-600 mb-6" />
                      <h3 className="text-2xl md:text-3xl font-bold text-indigo-900 mb-6">Answer</h3>
                      <p className="text-base md:text-lg text-gray-800 leading-relaxed px-4">{selectedCard.answer}</p>
                      <button onClick={() => setIsFlipped(!isFlipped)} className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center gap-2">
                        <RotateCw className="w-5 h-5" /> Show Question
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* Practice Questions */}
            {result.practice && (
              <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-14">
                <div className="flex items-center gap-4 mb-8">
                  <Zap className="w-10 h-10 md:w-12 md:h-12 text-purple-600" />
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Practice Questions
                  </h2>
                </div>
                <div className="prose prose-lg md:prose-xl text-gray-700 whitespace-pre-wrap">
                  {result.practice}
                </div>
              </motion.section>
            )}

            {/* Motivation */}
            {result.motivation && (
              <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-indigo-50 to-cyan-100 rounded-3xl p-12 md:p-20 text-center border border-indigo-200 shadow-inner">
                <p className="text-3xl md:text-4xl font-bold text-indigo-900 mb-6">Stay Consistent</p>
                <p className="text-2xl md:text-3xl italic font-medium text-indigo-800 mt-6">"{result.motivation}"</p>
              </motion.section>
            )}
          </div>
        )}

        

        <motion.footer
            initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
         className="mt-24 md:mt-32 py-12  bg-slate-200 ">
          <div className="container mx-auto px-6 text-center bg-slate-200">
            <p className="text-sm  bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-transparent">
              © 2025 <span className="font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500  bg-clip-text text-transparent">LearnFlow</span>. Developed by Sarmad, Abdullah, Asad, Mubashir, Zain, Ohm
            </p>
          </div>
        </motion.footer>
      </div>

      <style >{`
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .line-clamp-4 { display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        .slider::-moz-range-thumb {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
          border: none;
        }
      `}</style>
    </>
  );
}

export default App;
