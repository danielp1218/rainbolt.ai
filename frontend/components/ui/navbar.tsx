import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";


interface NavbarProps {
  currentSection: number;
}

export function Navbar({ currentSection }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [prevSection, setPrevSection] = useState(currentSection);

  useEffect(() => {
    if (currentSection === 0) {
      // Always show navbar in first section
      setIsVisible(true);
    } else if (currentSection !== prevSection) {
      // Only update visibility when actually changing sections
      const isScrollingDown = currentSection > prevSection;
      setIsVisible(!isScrollingDown);
    }
    
    // Always update previous section
    setPrevSection(currentSection);
  }, [currentSection, prevSection]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-200 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
      <div className="container relative mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="text-white text-2xl font-bold">rainbolt.ai</div>
            <NavigationMenu>
              <NavigationMenuList className="flex gap-8">
                <NavigationMenuItem>
                  <Link href="#features" className="text-white/80 hover:text-white transition-colors">
                    Features
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#about" className="text-white/80 hover:text-white transition-colors">
                    About
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="#contact" className="text-white/80 hover:text-white transition-colors">
                    Contact
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div>
            <Button className="bg-white text-black hover:bg-white/90">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}