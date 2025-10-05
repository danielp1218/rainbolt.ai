"use client";

import { useEffect, useState, useRef } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Button } from "@/components/ui/Button";
import EarthScene from "@/components/ui/Globe";

import "./glow.css";
import LoginComponent from "@/components/ui/LoginComponent";

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const heroSectionRef = useRef<HTMLElement>(null);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = parseInt(entry.target.getAttribute('data-section-id') || '0');
        setCurrentSection(sectionId);

        // Trigger counting animation when hero section is in view
        if (sectionId === 0 && !hasAnimated) {
          setHasAnimated(true);
          animateCount();
        }
      }
    });
  };

  const animateCount = () => {
    const targetNumber = 955199;
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = targetNumber / steps;
    let currentCount = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      currentCount = Math.min(Math.floor(increment * step), targetNumber);
      setPhotoCount(currentCount);

      if (step >= steps) {
        clearInterval(timer);
        setPhotoCount(targetNumber);
      }
    }, duration / steps);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3, // Trigger when section is 30% visible
      rootMargin: '-80px 0px' // Adjust for navbar height
    });

    // Observe all sections
    document.querySelectorAll('section[data-section-id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <EarthScene
          markers={[]}
          currentSection={currentSection}
        />
        {/* Vignette Effect */}
        <div className="vignette" />
      </div>

      {/* Navigation */}
      <Navbar currentSection={currentSection} />

      {/* Hero Section with Earth */}
      <section ref={heroSectionRef} data-section-id="0" className="relative h-screen snap-start">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="absolute inset-0 flex items-center z-[60]">
          <div className="container mx-auto">
            <div className="max-w-3xl px-4">
              <h1 className="text-7xl font-bold mb-8 leading-tight text-left relative will-change-transform">
                <span className="text-white font-sans [text-shadow:0_0_10px_#fff,0_0_20px_#0066cc] [animation:textGlow_3s_ease-in-out_infinite_alternate] will-change-transform">
                  Bolt around the world with  </span>
                <span className="text-white font-sans [text-shadow:0_0_10px_#fff,0_0_20px_#ff1a1a,0_0_30px_#800080] [animation:textGlowRed_3s_ease-in-out_infinite_alternate] will-change-transform">
                  rainbolt.ai
                </span>
              </h1>
              <p className="text-[1.4rem] text-white/80 text-left max-w-xl">
                Powered by <span className="text-[1.6rem] font-bold text-white">{formatNumber(photoCount)}</span> geotagged photos and expert geolocation strategies, we turn visual curiosity into global understanding.
              </p>
              <div className="mt-8 flex gap-4">
                <Button size="lg" className="bg-white text-black hover:bg-white/90" asChild>
                  <a href="/chat">Try Rainbolt AI</a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <a href="#about">Watch Demo</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-section-id="1" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-start pt-20 overflow-y-auto">
          <div className="container mx-auto px-4 pb-20">
            <h2 className="text-4xl font-bold text-white mb-12 text-center [text-shadow:0_0_10px_#fff,0_0_20px_#ff1a1a,0_0_30px_#800080] [animation:textGlowRed_3s_ease-in-out_infinite_alternate]">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Pinpoint Geolocation</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Upload any image. Get exact coordinates, street views, and 95%+ confidence scores in seconds. Our RAG model analyzes 200+ visual markers—architecture, vegetation, signage—like elite geoguessers.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Expert-Level Reasoning</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Trained on 10,000+ pro geolocation strategies. Identifies 50+ subtle clues—utility poles, road markings, building materials—to pinpoint locations with meter-level precision.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Cultural Context Engine</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Every location unlocks 15+ insights: history, cuisine, architecture, customs. Turn any photo into a 60-second learning experience.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Learning Mode</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Master 100+ geographic patterns through AI-guided training. Build photographic memory for locations using proven recognition techniques.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Real-Time Streaming</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Sub-3-second responses via WebSocket. Watch confidence climb from 40% → 95% as our model processes 1M+ reference points layer-by-layer.
                </p>
              </div>

              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                <h3 className="text-2xl font-bold mb-3 text-white">Enterprise-Grade Stack</h3>
                <p className="text-lg text-white/80 leading-relaxed">
                  Firebase + Auth0 + FastAPI architecture. 99.9% uptime. Bank-level security for unlimited scale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-section-id="2" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-center justify-end pr-12">
          <div className="max-w-2xl bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20 space-y-4 overflow-y-auto max-h-[80vh]">
            <h2 className="text-2xl font-bold text-white mb-4">
              About <span className="text-white [text-shadow:0_0_10px_#fff,0_0_20px_#ff1a1a,0_0_30px_#800080] [animation:textGlowRed_3s_ease-in-out_infinite_alternate]">rainbolt.ai</span>
            </h2>

            {/* The Global Literacy Crisis */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Geographic Illiteracy Crisis
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Billions navigate our world yet remain geographically blind—recognizing brands and memes, but not the landscapes and cultures that define our planet.
              </p>
            </div>

            {/* Our Mission */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Our Mission
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                We democratize geographic intelligence through AI that combines millions of geotagged images with expert geolocation strategies—not just guessing locations, but understanding them.
              </p>
            </div>

            {/* Why It Matters */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Why It Matters
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Transform passive image viewing into active discovery. We're building geographic literacy one image at a time—for travelers, educators, researchers, and the curious.
              </p>
            </div>

            {/* The Technology */}
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                The Technology
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Our RAG model synthesizes visual patterns, cultural databases, and expert methodologies. Purpose-built for spatial accuracy—trained to think like elite geographic detectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" data-section-id="3" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-center justify-start pl-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold text-white mb-12">
              Meet Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden">
                  <img src="/IMG_0628.jpg" alt="Daniel Pu" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Daniel Pu</h3>
                <p className="text-white/80">Computer Science</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden">
                  <img src="/IMG_0623.jpg" alt="Evan Yang" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Evan Yang</h3>
                <p className="text-white/80">Systems Design Engineering</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden">
                  <img src="/IMG_0627.jpg" alt="Daniel Liu" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Daniel Liu</h3>
                <p className="text-white/80">Computer Science and Financial Science</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4 overflow-hidden">
                  <img src="/IMG_0625.jpg" alt="Justin Wang" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Justin Wang</h3>
                <p className="text-white/80">Management Engineering</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-section-id="4" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <h2 className={`text-5xl font-bold text-white [text-shadow:0_0_10px_#fff,0_0_20px_#0066cc,0_0_30px_#0099ff] [animation:textGlowBlue_3s_ease-in-out_infinite_alternate] ${currentSection === 4 ? 'animate-slide-in' : 'opacity-0'}`}>
            Tech Stack
          </h2>
          <div className={`max-w-7xl w-full px-4 ${currentSection === 4 ? 'animate-slide-in' : 'opacity-0'}`}>
            <img
              src="/Colorful Simple Modern Business Order Process Flowchart (1920 x 1080 px).png"
              alt="Process Flowchart"
              className="w-full h-auto"
              style={{ maxHeight: '80vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      </section>
    </div >
  );
}