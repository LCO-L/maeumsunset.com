import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface EnergyType {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  emoji: string;
  description: string;
}

interface MusicSuggestion {
  id: string;
  title: string;
  artist: string;
  mood: string;
  color: string;
  preview?: string;
}

export default function WritePage() {
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType | null>(null);
  const [journalText, setJournalText] = useState('');
  const [musicSuggestion, setMusicSuggestion] = useState<MusicSuggestion | null>(null);
  const [step, setStep] = useState<'energy' | 'journal' | 'music'>('energy');
  const [bgColor, setBgColor] = useState('from-[#ffbb88] to-[#ff89b0]');

  const energyTypes: EnergyType[] = [
    { id: 'calm', name: 'Calm', color: '#9CC9FF', bgColor: 'from-[#9CC9FF] to-[#B4E7CE]', emoji: '🌊', description: 'Peaceful and centered' },
    { id: 'joy', name: 'Joy', color: '#FFD97D', bgColor: 'from-[#FFD97D] to-[#FCBF49]', emoji: '☀️', description: 'Bright and cheerful' },
    { id: 'excited', name: 'Excited', color: '#FF9ED1', bgColor: 'from-[#FF9ED1] to-[#F77F00]', emoji: '✨', description: 'Full of energy' },
    { id: 'focused', name: 'Focused', color: '#A8DADC', bgColor: 'from-[#A8DADC] to-[#457B9D]', emoji: '🎯', description: 'Clear and determined' },
    { id: 'creative', name: 'Creative', color: '#F1FAEE', bgColor: 'from-[#F1FAEE] to-[#E63946]', emoji: '🎨', description: 'Inspired and imaginative' },
    { id: 'grateful', name: 'Grateful', color: '#B4E7CE', bgColor: 'from-[#B4E7CE] to-[#52B788]', emoji: '🙏', description: 'Thankful and appreciative' }
  ];

  const musicSuggestions: { [key: string]: MusicSuggestion } = {
    calm: { id: '1', title: 'Weightless', artist: 'Marconi Union', mood: 'Calm', color: '#9CC9FF' },
    joy: { id: '2', title: 'Good as Hell', artist: 'Lizzo', mood: 'Joy', color: '#FFD97D' },
    excited: { id: '3', title: 'Electric Feel', artist: 'MGMT', mood: 'Excited', color: '#FF9ED1' },
    focused: { id: '4', title: 'Concentrated', artist: 'Lo-Fi Study Beats', mood: 'Focused', color: '#A8DADC' },
    creative: { id: '5', title: 'Inspiration', artist: 'Brian Eno', mood: 'Creative', color: '#F1FAEE' },
    grateful: { id: '6', title: 'Thank You', artist: 'Alanis Morissette', mood: 'Grateful', color: '#B4E7CE' }
  };

  const handleEnergySelect = (energy: EnergyType) => {
    setSelectedEnergy(energy);
    setBgColor(energy.bgColor);
    setStep('journal');
    
    // AI 음악 추천 시뮬레이션
    setTimeout(() => {
      setMusicSuggestion(musicSuggestions[energy.id]);
    }, 1500);
  };

  const getCurrentPrompt = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "What energy would you like to add to the day?";
    if (hour < 17) return "How would you like to shift your afternoon energy?";
    return "What energy will complete your day?";
  };

  return (
    <main className={`min-h-screen pb-24 bg-gradient-to-b ${bgColor} transition-all duration-1000`}>
      {/* Header */}
      <header className="px-4 pt-8 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center text-white/80 hover:text-white transition-colors">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </Link>
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Energy Journal</h1>
          <p className="text-xs text-white/70">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="w-16"></div>
      </header>

      {/* Progress Indicator */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-2 h-2 rounded-full transition-all ${step === 'energy' ? 'bg-white' : 'bg-white/40'}`}></div>
          <div className={`w-8 h-0.5 transition-all ${selectedEnergy ? 'bg-white' : 'bg-white/40'}`}></div>
          <div className={`w-2 h-2 rounded-full transition-all ${step === 'journal' ? 'bg-white' : 'bg-white/40'}`}></div>
          <div className={`w-8 h-0.5 transition-all ${musicSuggestion ? 'bg-white' : 'bg-white/40'}`}></div>
          <div className={`w-2 h-2 rounded-full transition-all ${step === 'music' ? 'bg-white' : 'bg-white/40'}`}></div>
        </div>
      </div>

      {/* Energy Selection */}
      {step === 'energy' && (
        <section className="px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-white mb-2">{getCurrentPrompt()}</h2>
            <p className="text-white/70 text-sm">Choose the energy that resonates with you right now</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {energyTypes.map((energy) => (
              <button
                key={energy.id}
                onClick={() => handleEnergySelect(energy)}
                className="p-6 rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl group"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{energy.emoji}</div>
                  <h3 className="text-lg font-semibold text-white mb-1">{energy.name}</h3>
                  <p className="text-xs text-white/70">{energy.description}</p>
                  <div 
                    className="w-full h-1 rounded-full mt-3 opacity-60"
                    style={{ backgroundColor: energy.color }}
                  ></div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Journal Writing */}
      {step === 'journal' && selectedEnergy && (
        <section className="px-4">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-3xl mr-3">{selectedEnergy.emoji}</span>
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedEnergy.name} Energy</h2>
                <p className="text-white/70 text-sm">{selectedEnergy.description}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6 mb-6">
            <label className="block text-white/80 text-sm font-medium mb-3">
              Express your {selectedEnergy.name.toLowerCase()} energy...
            </label>
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="How are you feeling? What brought this energy? What do you want to do with it?"
              className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
          </div>

          {musicSuggestion && (
            <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🎵</span>
                Perfect soundtrack for your {selectedEnergy.name.toLowerCase()} energy
              </h3>
              
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/10">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: musicSuggestion.color + '40' }}
                >
                  🎶
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{musicSuggestion.title}</h4>
                  <p className="text-white/70 text-sm">{musicSuggestion.artist}</p>
                  <p className="text-white/50 text-xs mt-1">Mood: {musicSuggestion.mood}</p>
                </div>
                <div className="flex flex-col space-y-2">
                  <button className="px-4 py-2 bg-white text-gray-800 rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                    Play
                  </button>
                  <button className="px-4 py-2 bg-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-all">
                    Replace
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <button 
              onClick={() => setStep('energy')}
              className="flex-1 py-3 px-4 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 text-center text-white font-medium"
            >
              Change Energy
            </button>
            <button 
              className="flex-1 py-3 px-4 rounded-2xl bg-white text-gray-800 font-semibold text-center shadow-lg hover:shadow-xl transition-all"
            >
              Share Entry
            </button>
          </div>
        </section>
      )}

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
        <div className="max-w-sm mx-auto h-full flex items-center justify-center">
          <div className="text-xs text-white/60">Saving automatically...</div>
        </div>
      </div>
    </main>
  );
}