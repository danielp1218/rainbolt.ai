"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import EarthScene from "@/components/ui/globe";
import { ChatLauncher } from "@/components/ChatLauncher";
import { ChatPanel } from "@/components/ChatPanel";

import "./glow.css";

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
    <div className="relative h-screen overflow-y-auto snap-mandatory snap-y scroll-smooth">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <EarthScene 
          markers={[]} 
        />
        {/* Vignette Effect */}
        <div className="vignette" />
      </div>
      
      {/* Navigation */}
      <Navbar currentSection={currentSection} />

      {/* Chat Overlay Layer - Above everything, pointer-events managed per component */}
      <div className="fixed inset-0 z-[100] pointer-events-none">
        <ChatLauncher />
        <ChatPanel />
      </div>

      {/* Hero Section with Earth */}
      <section data-section-id="0" className="relative h-screen snap-always snap-start">
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
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-section-id="1" className="relative h-screen snap-always snap-start bg-black/90">
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/80">
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
      <section id="about" data-section-id="2" className="relative h-screen snap-always snap-start bg-gradient-to-b from-black/90 to-black z-10">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              About Us
            </h2>
            <div className="max-w-3xl mx-auto text-white/80 text-center">
              <p className="mb-6">
                Rainbolt AI is at the forefront of artificial intelligence innovation, developing
                cutting-edge solutions that transform industries and empower businesses.
              </p>
              <p>
                With our advanced AI technologies, we're making the future of intelligent automation
                accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" data-section-id="3" className="relative h-screen snap-always snap-start bg-black/90 flex items-center justify-center">
        <div className="container mx-auto px-4">
          <h2 className="text-5xl font-bold text-white mb-12 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">John Doe</h3>
              <p className="text-white/80">AI Research Lead</p>
            </div>
            <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Jane Smith</h3>
              <p className="text-white/80">ML Engineer</p>
            </div>
            <div className="p-6 bg-white/5 rounded-lg backdrop-blur-sm text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-white mb-2">Mike Johnson</h3>
              <p className="text-white/80">Data Scientist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" data-section-id="4" className="relative h-screen snap-always snap-start bg-black z-10">
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
    </div>
  );
}