import React from 'react';
import { LayoutGrid, Mic, BarChart3, Settings, Plus, Bot, Radio } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeView: string;
}

export function Sidebar({ activeView }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'debate', label: 'Interviews', icon: Mic },
    { id: 'diagnostics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="hidden md:flex flex-col h-full py-8 border-r border-outline-variant bg-surface-container-lowest w-64 flex-shrink-0 z-10">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container overflow-hidden">
          <Bot size={18} />
        </div>
        <div>
          <h1 className="font-sans text-xl font-bold text-on-surface leading-tight tracking-tight">SignalForge</h1>
          <p className="font-label-caps text-on-surface-variant">AI Interview Suite</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = item.id === activeView;
          return (
            <a
              key={item.id}
              href="#"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-label-caps ${
                isActive
                  ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
              }`}
            >
              <item.icon size={18} fill={isActive ? 'currentColor' : 'none'} />
              {item.label}
            </a>
          );
        })}
      </div>

      <div className="px-6 mt-auto">
        <button className="w-full bg-primary-container text-on-primary-container font-label-caps py-3 rounded-lg border border-primary-container hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-2">
          <Plus size={16} />
          New Simulation
        </button>
      </div>
    </nav>
  );
}

export function Header({ title }: { title: string }) {
  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center w-full px-6 h-16 flex-shrink-0 z-10">
      <div className="hidden md:flex">
        <span className="font-sans text-sm text-on-surface-variant">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center">
          <Radio size={20} />
        </button>
        <div className="w-8 h-8 rounded-full border border-outline-variant overflow-hidden bg-surface-container-highest">
          <img
            alt="User Avatar"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKkxAWMIN5-SMf6qvfWJclBqL9QUSah0K2_WzuheLEZnsKAYfuFxrpPsElSZt5HxLoo1oUkaErq_8yiWxU6eUGiQx2A_DcdCdexrOpQYq37iu-xcKO6eo47IEfG13O6ko2LljK6uQgDRFwAxPWpJXaRxUS80xoi9A5HDIOiKojojeiRO8ertbyRDl5HvGNVLCYMYNkqAAE0M-1tAzz_q_azPi9Jr9KxBaIJQN7y9PQwTfJNJYtMDQ7g4hF5BPyUlemS58priR82eo"
          />
        </div>
      </div>
    </header>
  );
}
