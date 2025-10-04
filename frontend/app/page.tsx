"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import EarthScene from "@/components/ui/globe";
import { ChatLauncher } from "@/components/ChatLauncher";
import { ChatPanel } from "@/components/ChatPanel";

import "./glow.css";
import LoginComponent from "@/components/ui/Login_component";

export default function Home() {
  const [currentSection, setCurrentSection] = useState(0);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const sectionId = parseInt(entry.target.getAttribute('data-section-id') || '0');
        setCurrentSection(sectionId);
      }
    });
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

      {/* Login Component - Fixed Top Right */}
      <div className="fixed top-6 right-10 z-[999]">
        <LoginComponent />
      </div>

      {/* UWaterloo Badge - Animated entry on Meet the Team section */}
      <div className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-700 ease-out ${currentSection === 3
        ? 'translate-x-0 opacity-100'
        : 'translate-x-full opacity-0'
        }`}>
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 shadow-xl">
          <div className="text-center">
            <h3 className="text-white font-bold text-lg mb-4">University of Waterloo</h3>
            <div className="w-32 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mx-auto flex items-center justify-center mb-3">
              <span className="text-white font-bold text-2xl">UW</span>
            </div>
            <p className="text-white/70 text-sm">Innovation • Technology • Excellence</p>
          </div>
        </div>
      </div>

      {/* Hero Section with Earth */}
      <section data-section-id="0" className="relative h-screen snap-start">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="absolute inset-0 flex items-center z-[60]">
          <div className="container mx-auto">
            <div className="max-w-3xl px-4">
              <h1 className="text-7xl font-bold mb-8 leading-tight text-left flex flex-wrap gap-x-4 relative will-change-transform">
                <span className="text-white font-sans [text-shadow:0_0_10px_#fff,0_0_20px_#00a3ff] [animation:textGlow_3s_ease-in-out_infinite_alternate] will-change-transform">
                  Learn to Explore
                </span>
                <span className="text-white font-sans [text-shadow:0_0_10px_#fff,0_0_20px_#ff1a1a,0_0_30px_#800080] [animation:textGlowRed_3s_ease-in-out_infinite_alternate] will-change-transform">
                  with rainbolt.ai
                </span>
              </h1>
              <p className="text-2xl text-white/80 text-left max-w-xl">
                Transforming ideas into intelligent solutions through cutting-edge artificial intelligence and machine learning.
              </p>
              <div className="mt-8 flex gap-4">
                <Button size="lg" className="bg-white text-black hover:bg-white/90" asChild>
                  <a href="/chat">Try Chat Interface</a>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                  <a href="/learning">Globe Learning</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-section-id="1" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-start pt-20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/80 max-w-5xl mx-auto">
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Advanced AI</h3>
                <p>State-of-the-art artificial intelligence solutions for your business needs.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Machine Learning</h3>
                <p>Custom machine learning models tailored to your specific requirements.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-4">Data Analytics</h3>
                <p>Comprehensive data analysis and visualization tools.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" data-section-id="2" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-center justify-end pr-16">
          <div className="max-w-2xl p-8 bg-white/5 rounded-lg backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-8">
              About rainbolt.ai
            </h2>
            <div className="text-white/80 space-y-6">
              <p>
                Rainbolt.ai is inspired by the incredible work of Rainbolt (Trevor Rainbolt), a creator known for his lightning-fast skills in identifying geographical locations from single images, with the red smile emoji as his iconic symbol.
              </p>
              <p>
                Just as Rainbolt helps people uncover long-lost locations across the world, Rainbolt.ai empowers users to learn geography in an engaging way. It also supports meaningful challenges, from helping families reconnect to discovering places of personal significance.               </p>
            </div>

            {/* Rainbolt Images */}
            <div className="flex gap-4 mt-8">
              <div className="flex-1">
                <img 
                  src="/Rainbolt-JB1-High-Quality-PHOTO-e1666190809190-1000x669.jpg" 
                  alt="Rainbolt Cool" 
                  className="w-full h-32 object-cover rounded-lg bg-white/10"
                />
                <p className="text-white/60 text-sm mt-2 text-center">Trevor Rainbolt</p>
              </div>
              <div className="flex-1">
                <img
                  src="/rainbolt_staring.webp"
                  alt="Rainbolt Staring"
                  className="w-full h-32 object-cover rounded-lg bg-white/10"
                />
                <p className="text-white/60 text-sm mt-2 text-center">Rainbolt Focused</p>
              </div>
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
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Daniel Pu</h3>
                <p className="text-white/80">UW CS</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Evan Yang</h3>
                <p className="text-white/80">UW SYDE</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Daniel Liu</h3>
                <p className="text-white/80">UW CFM</p>
              </div>
              <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
                <div className="w-20 h-20 rounded-full bg-white/10 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">TingXuan Wang</h3>
                <p className="text-white/80">UW MGTE</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-section-id="4" className="relative h-screen snap-start">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              Get in Touch
            </h2>
            <div className="max-w-md mx-auto">
              <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm">
                <form className="space-y-6">
                  <div>
                    <label className="block text-white mb-2">Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-black/50 text-white rounded border border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 bg-black/50 text-white rounded border border-white/20"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2">Message</label>
                    <textarea
                      className="w-full px-4 py-2 bg-black/50 text-white rounded border border-white/20 h-32"
                    ></textarea>
                  </div>
                  <Button type="submit" className="w-full bg-white text-black hover:bg-white/90">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div >
  );
}