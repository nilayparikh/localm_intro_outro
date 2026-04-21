import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Box,
  Wind,
  Cpu,
  Waves,
} from "lucide-react";

const IntroOutroMaker = () => {
  const [activeTab, setActiveTab] = useState("customize");
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState("intro");
  const [previewKey, setPreviewKey] = useState(0);

  // Configuration State
  const [config, setConfig] = useState({
    title: "QUANTUM REACH",
    subtitle: "Redefining the Digital Frontier",
    primaryColor: "#8b5cf6",
    secondaryColor: "#1d4ed8",
    introAnimation: "cinematic",
    outroAnimation: "dynamic",
    compositeStyle: "glass", // glass, particles, cyberpunk, wireframe, aurora
    intensity: 50,
    duration: 6,
    outroText: "STAY CONNECTED",
    socialHandle: "@quantum_reach",
    autoReplay: false,
  });

  // Advanced Composite Components
  const CompositeLayer = ({ style, color, intensity }) => {
    switch (style) {
      case "particles":
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white opacity-20"
                style={{
                  width: Math.random() * 4 + 2,
                  height: Math.random() * 4 + 2,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: `blur(${Math.random() * 2}px)`,
                }}
                animate={{
                  y: [0, -100 * (intensity / 50)],
                  x: [0, (Math.random() - 0.5) * 50],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </div>
        );
      case "cyberpunk":
        return (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-20 w-full"
              animate={{ y: ["-100%", "1000%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );
      case "wireframe":
        return (
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ perspective: "1000px" }}
          >
            <motion.div
              className="w-[200%] h-[200%] -left-1/2 -top-1/2"
              style={{
                backgroundImage: `linear-gradient(${color}22 1px, transparent 1px), linear-gradient(90deg, ${color}22 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
                transformStyle: "preserve-3d",
              }}
              animate={{ rotateX: [20, 30, 20], rotateZ: [0, 5, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      case "aurora":
        return (
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute -inset-[100%] opacity-30"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 50%)`,
                filter: "blur(80px)",
              }}
              animate={{
                x: ["-10%", "10%", "-10%"],
                y: ["-10%", "5%", "-10%"],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );
      default: // Glass
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
              style={{ backgroundColor: color }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-10"
              style={{ backgroundColor: "#ffffff" }}
            />
          </div>
        );
    }
  };

  // Complex Animation Variants
  const variants = {
    intro: {
      cinematic: {
        container: { opacity: 1 },
        text: {
          initial: {
            opacity: 0,
            letterSpacing: "0.1em",
            filter: "blur(15px)",
            scale: 0.85,
          },
          animate: {
            opacity: 1,
            letterSpacing: "0.5em",
            filter: "blur(0px)",
            scale: 1,
            transition: { duration: 2.5, ease: [0.16, 1, 0.3, 1] },
          },
        },
      },
      glitch: {
        container: { opacity: 1 },
        text: {
          initial: { skewX: 20, opacity: 0 },
          animate: {
            skewX: [0, -10, 10, -5, 5, 0],
            x: [0, -2, 2, -1, 1, 0],
            opacity: 1,
            transition: { duration: 0.6, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
          },
        },
      },
      float: {
        container: { opacity: 1 },
        text: {
          initial: { y: 60, opacity: 0, rotateX: 45 },
          animate: {
            y: 0,
            opacity: 1,
            rotateX: 0,
            transition: { duration: 1.5, type: "spring", damping: 12 },
          },
        },
      },
      reveal: {
        container: { opacity: 1 },
        text: {
          initial: { clipPath: "polygon(0 0, 0 0, 0 100%, 0% 100%)" },
          animate: {
            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
            transition: { duration: 1.8, ease: [0.87, 0, 0.13, 1] },
          },
        },
      },
      pulse: {
        container: { opacity: 1 },
        text: {
          initial: { scale: 0.3, opacity: 0 },
          animate: {
            scale: [0.3, 1.1, 1],
            opacity: 1,
            transition: { duration: 1.2, ease: "circOut" },
          },
        },
      },
    },
    outro: {
      social: {
        initial: { opacity: 0, scale: 0.9 },
        animate: {
          opacity: 1,
          scale: 1,
          transition: { staggerChildren: 0.15 },
        },
      },
      grid: {
        initial: { opacity: 0, y: 50 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.2, ease: "anticipate" },
        },
      },
      minimal: {
        initial: { opacity: 0, filter: "blur(10px)" },
        animate: {
          opacity: 1,
          filter: "blur(0px)",
          transition: { duration: 1.5 },
        },
      },
      dynamic: {
        initial: { rotateY: -90, opacity: 0, z: -200 },
        animate: {
          rotateY: 0,
          opacity: 1,
          z: 0,
          transition: { duration: 1.4, type: "spring" },
        },
      },
      cards: {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { staggerChildren: 0.25 } },
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
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Box size={20} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">
              MotionStudio <span className="text-indigo-400">Ultra</span>
            </h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              v3.0 Composite Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-slate-800/50 border border-slate-700 rounded-full p-1">
            {["intro", "outro"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setIsPlaying(false);
                }}
                className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${mode === m ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button className="group flex items-center gap-2 bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-400 transition-all active:scale-95 shadow-xl shadow-indigo-500/20">
            <Download size={18} />
            Export 4K
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Advanced Controls */}
        <aside className="w-85 border-r border-slate-800 bg-slate-900/40 flex flex-col backdrop-blur-sm">
          <div className="flex border-b border-slate-800">
            {[
              { id: "customize", icon: Settings, label: "Properties" },
              { id: "style", icon: Sparkles, label: "Fx & Composite" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? "border-b-2 border-indigo-500 text-indigo-400 bg-indigo-500/5" : "text-slate-500 hover:text-slate-300"}`}
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
                    <Type size={12} /> Content
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        Primary Display
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
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-medium">
                        Sub-Label
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
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-800/50">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={12} /> Sequence Timing
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Length</span>
                    <span className="text-xs font-mono text-indigo-400">
                      {config.duration}.00s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="12"
                    step="1"
                    value={config.duration}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </section>
              </div>
            ) : (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} /> Composite Style
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: "glass", icon: Monitor, label: "Hyper Glass" },
                      { id: "particles", icon: Wind, label: "3D Particles" },
                      { id: "cyberpunk", icon: Cpu, label: "Cyber Scan" },
                      { id: "wireframe", icon: Box, label: "Geo Wireframe" },
                      { id: "aurora", icon: Waves, label: "Aurora Mesh" },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          setConfig({ ...config, compositeStyle: style.id })
                        }
                        className={`text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${config.compositeStyle === style.id ? "bg-indigo-600 border-indigo-400 text-white shadow-lg" : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500"}`}
                      >
                        <style.icon size={16} />
                        {style.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="space-y-4 pt-4 border-t border-slate-800/50">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Composite Intensity
                  </h3>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.intensity}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        intensity: parseInt(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Palette size={12} /> Color Grade
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "#8b5cf6",
                      "#3b82f6",
                      "#ef4444",
                      "#10b981",
                      "#f59e0b",
                      "#ffffff",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setConfig({ ...config, primaryColor: color })
                        }
                        className={`w-10 h-10 rounded-xl border-2 transition-all ${config.primaryColor === color ? "border-white scale-110" : "border-transparent"}`}
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
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${isPlaying ? "bg-slate-800 text-slate-500" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl active:scale-[0.98]"}`}
            >
              {isPlaying ? (
                <Music size={20} className="animate-pulse" />
              ) : (
                <RotateCcw size={20} />
              )}
              {isPlaying ? "Live Previewing..." : "Play Sequence"}
            </button>
          </div>
        </aside>

        {/* Center - Render Viewport */}
        <section className="flex-1 bg-black flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
          {/* Viewport UI Decorators */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full border-[40px] border-black z-30" />
            <div className="absolute top-10 left-10 flex flex-col gap-1">
              <div className="w-12 h-[1px] bg-indigo-500" />
              <div className="w-4 h-[1px] bg-indigo-500" />
            </div>
          </div>

          <div className="w-full max-w-5xl aspect-video bg-[#020617] rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative border border-white/5 group">
            <CompositeLayer
              style={config.compositeStyle}
              color={config.primaryColor}
              intensity={config.intensity}
            />

            <AnimatePresence mode="wait">
              {isPlaying ? (
                <motion.div
                  key={`render-${previewKey}`}
                  className="absolute inset-0 flex flex-col items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Mode Specific Logic */}
                  {mode === "intro" ? (
                    <motion.div
                      className="text-center p-12"
                      variants={variants.intro[config.introAnimation].container}
                    >
                      <motion.h1
                        variants={variants.intro[config.introAnimation].text}
                        initial="initial"
                        animate="animate"
                        className="font-black uppercase text-6xl md:text-9xl mb-4 relative z-10"
                        style={{
                          color: "white",
                          textShadow: `0 20px 60px ${config.primaryColor}55`,
                          fontFamily: "system-ui, sans-serif",
                        }}
                      >
                        {config.title}
                      </motion.h1>

                      <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 1, duration: 1.2 }}
                        className="w-48 h-[2px] mx-auto mb-8 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
                      />

                      <motion.p
                        initial={{ opacity: 0, letterSpacing: "0em" }}
                        animate={{ opacity: 1, letterSpacing: "0.4em" }}
                        transition={{ delay: 1.4, duration: 1 }}
                        className="text-white/60 text-sm md:text-xl font-medium uppercase"
                      >
                        {config.subtitle}
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.div
                      className="text-center z-10 w-full px-20"
                      variants={variants.outro[config.outroAnimation]}
                      initial="initial"
                      animate="animate"
                    >
                      <motion.h2
                        className="text-5xl md:text-8xl font-black mb-20 tracking-tighter italic"
                        style={{ color: "white" }}
                      >
                        {config.outroText}
                      </motion.h2>

                      <div className="flex justify-center gap-10 mb-20">
                        {[1, 2].map((i) => (
                          <motion.div
                            key={i}
                            variants={{
                              initial: { y: 40, opacity: 0 },
                              animate: { y: 0, opacity: 1 },
                            }}
                            className="w-72 aspect-video bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center group/card relative overflow-hidden backdrop-blur-xl shadow-2xl"
                          >
                            <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/card:opacity-100 transition-all duration-500" />
                            <Video size={24} className="text-white/40 mb-3" />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                              Recommended
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      <motion.div
                        variants={{
                          initial: { scale: 0.8, opacity: 0 },
                          animate: { scale: 1, opacity: 1 },
                        }}
                        className="inline-flex items-center gap-6 px-10 py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <Zap size={18} className="text-white fill-current" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white/90">
                          {config.socialHandle}
                        </span>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center group-hover:bg-black/40 transition-all cursor-pointer z-40"
                  onClick={handleTogglePlay}
                >
                  <motion.div
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: config.primaryColor,
                    }}
                    className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl"
                  >
                    <Play fill="white" size={28} className="text-white ml-1" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Render Timeline Control */}
          <div className="w-full max-w-5xl mt-10 bg-slate-900/80 p-5 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Composite Buffer 00:0{config.duration}s
                </span>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase">
                <span>Loopback: {config.autoReplay ? "ON" : "OFF"}</span>
                <div className="h-3 w-[1px] bg-slate-800" />
                <span>Quality: 4K Ultra</span>
              </div>
            </div>
            <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={isPlaying ? { width: "100%" } : { width: 0 }}
                transition={{ duration: config.duration, ease: "linear" }}
                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default IntroOutroMaker;
