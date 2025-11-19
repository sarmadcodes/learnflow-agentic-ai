import { useState, useEffect, useRef } from 'react';
import { Download, BookOpen, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [topic, setTopic] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Custom cursor
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.1;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.1;
      if (cursorDot.current) cursorDot.current.style.transform = `translate(${mouse.current.x - 6}px, ${mouse.current.y - 6}px)`;
      if (cursorRing.current) cursorRing.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
      requestAnimationFrame(animate);
    };
    document.addEventListener('mousemove', handleMouseMove);
    animate();
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setResult(null);
    setShowConfetti(false);
    try {
      const res = await fetch('http://localhost:8001/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, days }),
      });
      const data = await res.json();
      setResult(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err) {
      alert('Backend not running on port 8001');
    } finally {
      setLoading(false);
    }
  };

  const downloadAnki = async () => {
    if (!result?.flashcards?.length) return;
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
  };

  return (
    <>
      {/* Custom Cursor */}
      <div ref={cursorRing} className="fixed top-0 left-0 w-10 h-10 border-2 border-indigo-500 rounded-full pointer-events-none z-[9999] hidden lg:block" />
      <div ref={cursorDot} className="fixed top-0 left-0 w-3 h-3 bg-indigo-600 rounded-full pointer-events-none z-[9999] hidden lg:block" />

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -30 }}
              animate={{ y: '110vh' }}
              transition={{ duration: 2.5 + Math.random(), delay: Math.random() * 0.5 }}
              className="absolute text-4xl opacity-80"
              style={{ left: `${Math.random() * 100}%` }}
            >
              {['◆', '◇', '★'][i % 3]}
            </motion.div>
          ))}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-800">
        
        {/* Simple White Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 border-b border-gray-100"
        >
          <div className="container mx-auto px-6 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="w-10 h-10 text-indigo-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                LearnFlow
              </h1>
            </div>
            <p className="text-gray-500 font-medium">AI-Powered Study Planner</p>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-md border border-gray-200 px-6 py-3 rounded-full shadow-lg mb-10"
          >
            <Brain className="w-7 h-7 text-indigo-600" />
            <span className="font-semibold text-gray-700">Trusted by thousands of learners</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            viewport={{ once: true }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold max-w-5xl mx-auto leading-tight"
          >
            Master any topic with{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              AI-powered
            </span>{" "}
            precision.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-light"
          >
            Personalized study plans • Instant Anki decks • Practice questions • All private & local
          </motion.p>
        </section>

        {/* Input Card */}
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100 p-12 -mt-10"
          >
            <div className="grid md:grid-cols-3 gap-10 items-end">
              <div className="md:col-span-2">
                <label className="block text-xl font-semibold text-gray-800 mb-4">What do you want to master?</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., Calculus, React, Spanish, Quantum Physics..."
                  className="w-full px-7 py-5 text-lg rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-xl font-semibold text-gray-800 mb-4">Duration</label>
                <div className="flex items-center gap-6">
                  <input type="range" min="1" max="30" value={days} onChange={(e) => setDays(Number(e.target.value))} className="flex-1 h-3 bg-gray-200 rounded-full slider" />
                  <span className="text-4xl font-bold text-indigo-600">{days}</span>
                </div>
                <p className="text-sm text-gray-500 text-right mt-2">{days === 1 ? 'day' : 'days'}</p>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="mt-12 w-full py-7 rounded-2xl font-bold text-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                color: 'white',
              }}
            >
              {loading ? 'Generating Your Plan...' : 'Generate Study Plan'}
            </button>
          </motion.div>
        </div>

        {/* Results */}
        {result && (
          <div className="container mx-auto px-6 max-w-5xl mt-24 space-y-20">
            <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-14">
              <div className="flex items-center gap-5 mb-10">
                <BookOpen className="w-12 h-12 text-indigo-600" />
                <h2 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Your Study Plan
                </h2>
              </div>
              <div className="prose prose-xl text-gray-700 whitespace-pre-wrap leading-relaxed">
                {result.study_plan}
              </div>
            </motion.section>

            {result.flashcards?.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-14">
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-5">
                    <Brain className="w-12 h-12 text-blue-600" />
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Flashcards ({result.flashcards.length})
                    </h2>
                  </div>
                  <button onClick={downloadAnki} className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-4">
                    <Download className="w-6 h-6" />
                    Download Anki Deck
                  </button>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {result.flashcards.map((card: any, i: number) => (
                    <motion.div key={i} whileHover={{ y: -12, scale: 1.04 }} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-10 hover:shadow-2xl transition-all duration-300">
                      <p className="font-bold text-blue-900 text-lg mb-4">Question</p>
                      <p className="text-gray-800 mb-6">{card.question}</p>
                      <p className="font-bold text-indigo-900 text-lg">Answer</p>
                      <p className="text-gray-700 mt-3">{card.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {result.practice && (
              <motion.section initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-14">
                <div className="flex items-center gap-5 mb-10">
                  <Zap className="w-12 h-12 text-purple-600" />
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Practice Questions
                  </h2>
                </div>
                <div className="prose prose-xl text-gray-700 whitespace-pre-wrap">
                  {result.practice}
                </div>
              </motion.section>
            )}

            {result.motivation && (
              <motion.section initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} className="bg-gradient-to-r from-indigo-50 to-cyan-100 rounded-3xl p-20 text-center border border-indigo-200 shadow-inner">
                <p className="text-4xl font-bold text-indigo-900 mb-6">Keep Pushing</p>
                <p className="text-3xl italic font-medium text-indigo-800 mt-6">"{result.motivation}"</p>
              </motion.section>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-32 py-12 bg-gradient-to-t from-gray-900 to-gray-800 text-gray-300">
          <div className="container mx-auto px-6 text-center">
            <p className="text-sm">
              © 2025 <span className="font-bold text-white">LearnFlow</span>. All rights reserved.
            </p>
            <p className="text-xs mt-3">
              Built with passion by <span className="text-cyan-400 font-bold">Sarmad</span>
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
        }
        
        .slider::-moz-range-thumb {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #6366f1, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
          border: none;
        }
      `}</style>
    </>
  );
}

export default App;