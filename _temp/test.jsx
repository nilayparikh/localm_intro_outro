import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Settings,
  Layers,
  Type,
  Palette,
  Download,
  RotateCcw,
  Sparkles,
  Video,
  Monitor,
  Zap,
  Layout,
  Clock,
  Music,
} from "lucide-react";

const IntroOutroMaker = () => {
  const [activeTab, setActiveTab] = useState("customize");
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState("intro");
  const [previewKey, setPreviewKey] = useState(0);

  // Configuration State
  const [config, setConfig] = useState({
    title: "TECH VENTURES",
    subtitle: "Exploring the Future of Innovation",
    primaryColor: "#3b82f6",
    secondaryColor: "#1d4ed8",
    introAnimation: "cinematic", // cinematic, glitch, float, reveal, pulse
    outroAnimation: "social", // social, grid, minimal, dynamic, cards
    duration: 5,
    outroText: "Thanks for Watching",
    socialHandle: "@tech_ventures",
    autoReplay: false,
  });

  // Complex Animation Variants
  const variants = {
    intro: {
      cinematic: {
        container: { opacity: 1 },
        text: {
          initial: {
            opacity: 0,
            letterSpacing: "0.1em",
            filter: "blur(10px)",
            scale: 0.9,
          },
          animate: {
            opacity: 1,
            letterSpacing: "0.4em",
            filter: "blur(0px)",
            scale: 1,
            transition: { duration: 2, ease: "easeOut" },
          },
        },
      },
      glitch: {
        container: { opacity: 1 },
        text: {
          initial: { x: -20, opacity: 0 },
          animate: {
            x: [0, -5, 5, -2, 2, 0],
            opacity: 1,
            transition: { duration: 0.5, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
          },
        },
      },
      float: {
        container: { opacity: 1 },
        text: {
          initial: { y: 40, opacity: 0 },
          animate: {
            y: [40, -10, 0],
            opacity: 1,
            transition: { duration: 1.2, ease: "backOut" },
          },
        },
      },
      reveal: {
        container: { opacity: 1 },
        text: {
          initial: { clipPath: "inset(0 100% 0 0)" },
          animate: {
            clipPath: "inset(0 0% 0 0)",
            transition: { duration: 1.5, ease: [0.77, 0, 0.175, 1] },
          },
        },
      },
      pulse: {
        container: { opacity: 1 },
        text: {
          initial: { scale: 0.5, opacity: 0 },
          animate: {
            scale: [0.8, 1.05, 1],
            opacity: 1,
            transition: { duration: 1, ease: "easeOut" },
          },
        },
      },
    },
    outro: {
      social: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
      },
      grid: {
        initial: { opacity: 0, scale: 1.1 },
        animate: { opacity: 1, scale: 1, transition: { duration: 1 } },
      },
      minimal: {
        initial: { x: -100, opacity: 0 },
        animate: { x: 0, opacity: 1, transition: { duration: 0.8 } },
      },
      dynamic: {
        initial: { rotateY: 90, opacity: 0 },
        animate: {
          rotateY: 0,
          opacity: 1,
          transition: { duration: 1, type: "spring" },
        },
      },
      cards: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.3 } },
      },
    },
  };

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(false);
    setPreviewKey((prev) => prev + 1);
    setTimeout(() => setIsPlaying(true), 150);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        if (config.autoReplay) handleTogglePlay();
      }, config.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, config.duration, config.autoReplay, handleTogglePlay]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">
              MotionStudio <span className="text-blue-400">Pro</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              v2.5 Smart Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-slate-800/50 border border-slate-700 rounded-full p-1">
            <button
              onClick={() => {
                setMode("intro");
                setIsPlaying(false);
              }}
              className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${mode === "intro" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Intro
            </button>
            <button
              onClick={() => {
                setMode("outro");
                setIsPlaying(false);
              }}
              className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${mode === "outro" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
            >
              Outro
            </button>
          </div>
          <button className="group flex items-center gap-2 bg-white text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all active:scale-95 shadow-xl">
            <Download size={18} className="group-hover:bounce" />
            Render Project
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Controls */}
        <aside className="w-85 border-r border-slate-800 bg-slate-900/40 flex flex-col backdrop-blur-sm">
          <div className="flex border-b border-slate-800">
            {[
              { id: "customize", icon: Settings, label: "Content" },
              { id: "style", icon: Layout, label: "Animations" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? "border-b-2 border-blue-500 text-blue-400 bg-blue-500/5" : "text-slate-500 hover:text-slate-300"}`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeTab === "customize" ? (
              <div className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Type size={12} /> Text Assets
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        Main Title
                      </label>
                      <input
                        type="text"
                        value={
                          mode === "intro" ? config.title : config.outroText
                        }
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            [mode === "intro" ? "title" : "outroText"]:
                              e.target.value,
                          })
                        }
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        {mode === "intro" ? "Subtitle" : "Social Handle"}
                      </label>
                      <input
                        type="text"
                        value={
                          mode === "intro"
                            ? config.subtitle
                            : config.socialHandle
                        }
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            [mode === "intro" ? "subtitle" : "socialHandle"]:
                              e.target.value,
                          })
                        }
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-800/50">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> Timing
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Scene Duration
                    </span>
                    <span className="text-xs font-mono text-blue-400">
                      {config.duration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={config.duration}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </section>
              </div>
            ) : (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} />{" "}
                    {mode === "intro" ? "Intro Behavior" : "Outro Layout"}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {(mode === "intro"
                      ? ["cinematic", "glitch", "float", "reveal", "pulse"]
                      : ["social", "grid", "minimal", "dynamic", "cards"]
                    ).map((anim) => (
                      <button
                        key={anim}
                        onClick={() =>
                          setConfig({
                            ...config,
                            [mode === "intro"
                              ? "introAnimation"
                              : "outroAnimation"]: anim,
                          })
                        }
                        className={`text-left px-4 py-3 rounded-xl border text-sm capitalize transition-all flex items-center justify-between ${config[mode === "intro" ? "introAnimation" : "outroAnimation"] === anim ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/20 scale-[1.02]" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                      >
                        {anim}
                        {config[
                          mode === "intro" ? "introAnimation" : "outroAnimation"
                        ] === anim && (
                          <Zap size={14} className="fill-current" />
                        )}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} /> Visual Identity
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      "#3b82f6",
                      "#ef4444",
                      "#10b981",
                      "#f59e0b",
                      "#8b5cf6",
                      "#ffffff",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setConfig({ ...config, primaryColor: color })
                        }
                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 ${config.primaryColor === color ? "border-white ring-4 ring-blue-500/20" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-800 bg-slate-900/60">
            <button
              onClick={handleTogglePlay}
              disabled={isPlaying}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all shadow-2xl ${isPlaying ? "bg-slate-800 text-slate-500" : "bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-0.5 active:translate-y-0"}`}
            >
              {isPlaying ? (
                <Music size={20} className="animate-spin" />
              ) : (
                <RotateCcw size={20} />
              )}
              {isPlaying ? "Rendering Preview..." : "Run Animation"}
            </button>
          </div>
        </aside>

        {/* Center - Preview Window */}
        <section className="flex-1 bg-black flex flex-col items-center justify-center p-8 lg:p-16 relative">
          <div className="absolute top-8 left-8 flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-2">
              <Monitor size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Master Preview
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-slate-700"}`}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {isPlaying ? "Live" : "Standby"}
              </span>
            </div>
          </div>

          <div
            className="w-full max-w-5xl aspect-video bg-slate-900 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative border border-slate-800/50 group"
            style={{
              background: `radial-gradient(circle at center, #1e293b 0%, #020617 100%)`,
            }}
          >
            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key={`preview-${previewKey}`}
                  className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Subtle Background Textures */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />

                  {/* Smart Intro Rendering */}
                  {mode === "intro" ? (
                    <motion.div
                      className="text-center z-10 p-10 flex flex-col items-center"
                      variants={variants.intro[config.introAnimation].container}
                    >
                      <motion.h1
                        variants={variants.intro[config.introAnimation].text}
                        initial="initial"
                        animate="animate"
                        className="font-black uppercase text-5xl md:text-8xl mb-6 relative"
                        style={{
                          color: "white",
                          textShadow:
                            config.introAnimation === "glitch"
                              ? `2px 2px #ff0000, -2px -2px #0000ff`
                              : `0 10px 40px ${config.primaryColor}33`,
                        }}
                      >
                        {config.title}
                      </motion.h1>

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.8, duration: 1 }}
                        className="w-24 h-1 rounded-full mb-6"
                        style={{ backgroundColor: config.primaryColor }}
                      />

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className="text-slate-400 text-lg md:text-2xl font-light tracking-[0.3em] uppercase max-w-2xl text-center"
                      >
                        {config.subtitle}
                      </motion.p>

                      {/* Accent Decorative Elements */}
                      {config.introAnimation === "cinematic" && (
                        <motion.div
                          className="absolute w-[150%] h-[1px] opacity-20"
                          style={{
                            background: `linear-gradient(90deg, transparent, ${config.primaryColor}, transparent)`,
                          }}
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      )}
                    </motion.div>
                  ) : (
                    /* Smart Outro Rendering */
                    <motion.div
                      className="text-center z-10 w-full px-12 md:px-24"
                      variants={variants.outro[config.outroAnimation]}
                      initial="initial"
                      animate="animate"
                    >
                      <motion.h2
                        variants={{
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                        }}
                        className="text-4xl md:text-7xl font-bold mb-16 tracking-tight"
                      >
                        {config.outroText}
                      </motion.h2>

                      <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                        {[1, 2].map((i) => (
                          <motion.div
                            key={i}
                            variants={{
                              initial: { scale: 0.8, opacity: 0 },
                              animate: { scale: 1, opacity: 1 },
                            }}
                            className="aspect-video bg-slate-800/40 border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center gap-3 group/item relative overflow-hidden backdrop-blur-sm"
                          >
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                              <Video size={20} className="text-slate-400" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Next Episode {i}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        variants={{
                          initial: { y: 20, opacity: 0 },
                          animate: { y: 0, opacity: 1 },
                        }}
                        className="inline-flex items-center gap-4 bg-slate-900/80 px-8 py-3 rounded-2xl border border-slate-800 shadow-2xl"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Sparkles size={16} className="text-white" />
                        </div>
                        <span className="font-mono text-lg text-slate-300 font-medium tracking-tight">
                          Follow{" "}
                          <span style={{ color: config.primaryColor }}>
                            {config.socialHandle}
                          </span>
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Idle State */
                <div
                  className="absolute inset-0 flex items-center justify-center group-hover:bg-black/40 transition-all cursor-pointer"
                  onClick={handleTogglePlay}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-20"
                  >
                    <Play fill="white" size={32} className="text-white ml-1" />
                    <div className="absolute inset-0 bg-blue-400 rounded-3xl animate-ping opacity-20 pointer-events-none" />
                  </motion.div>
                  <div className="absolute bottom-12 flex flex-col items-center gap-2">
                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em]">
                      Ready to Launch
                    </span>
                    <div className="h-1 w-12 bg-blue-500/30 rounded-full" />
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Timeline Controller */}
          <div className="w-full max-w-5xl mt-12 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Sequence Progress
                </span>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-300 transition-colors">
                    Loop
                  </span>
                  <input
                    type="checkbox"
                    checked={config.autoReplay}
                    onChange={(e) =>
                      setConfig({ ...config, autoReplay: e.target.checked })
                    }
                    className="w-3 h-3 rounded bg-slate-800 border-slate-700 checked:bg-blue-500"
                  />
                </label>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                  00:0{config.duration}:00
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={isPlaying ? { width: "100%" } : { width: 0 }}
                transition={{ duration: config.duration, ease: "linear" }}
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 rounded-full"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Floating Status Bar */}
      <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 pl-4 rounded-full shadow-2xl">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Hardware Accel
        </span>
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </div>
    </div>
  );
};

export default IntroOutroMaker;
