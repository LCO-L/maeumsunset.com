import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmotionCard {
  id: string;
  user: string;
  energy: string;
  color: string;
  emoji: string;
  snippet: string;
  music: {
    title: string;
    artist: string;
  };
  timestamp: string;
  resonance: number;
  hasResonated: boolean;
}

export default function CampfirePage() {
  const [emotionCards, setEmotionCards] = useState<EmotionCard[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'resonant'>('all');
  const [currentMood, setCurrentMood] = useState<string>('calm');

  // 샘플 감정 카드 데이터
  useEffect(() => {
    const sampleCards: EmotionCard[] = [
      {
        id: '1',
        user: 'Emma',
        energy: 'Grateful',
        color: '#B4E7CE',
        emoji: '🙏',
        snippet: 'Woke up to birds singing outside my window. Sometimes the simplest moments...',
        music: { title: 'Morning Pages', artist: 'Kiasmos' },
        timestamp: '2 hours ago',
        resonance: 12,
        hasResonated: false
      },
      {
        id: '2',
        user: 'Alex',
        energy: 'Focused',
        color: '#A8DADC',
        emoji: '🎯',
        snippet: 'Deep work session ahead. Cleared my desk, made tea, ready to dive in...',
        music: { title: 'Concentrated', artist: 'Lo-Fi Study Beats' },
        timestamp: '4 hours ago',
        resonance: 8,
        hasResonated: true
      },
      {
        id: '3',
        user: 'Maya',
        energy: 'Creative',
        color: '#FF9ED1',
        emoji: '🎨',
        snippet: 'Colors everywhere! Just visited an art gallery and my mind is buzzing...',
        music: { title: 'Inspiration Flow', artist: 'Ólafur Arnalds' },
        timestamp: '6 hours ago',
        resonance: 15,
        hasResonated: false
      },
      {
        id: '4',
        user: 'Jordan',
        energy: 'Calm',
        color: '#9CC9FF',
        emoji: '🌊',
        snippet: 'Evening walk by the lake. The water reflects the sky perfectly...',
        music: { title: 'Still Waters', artist: 'Max Richter' },
        timestamp: '8 hours ago',
        resonance: 20,
        hasResonated: true
      },
      {
        id: '5',
        user: 'Sam',
        energy: 'Joy',
        color: '#FFD97D',
        emoji: '☀️',
        snippet: 'Coffee with an old friend. Laughed until my cheeks hurt...',
        music: { title: 'Good Vibes', artist: 'Kali Uchis' },
        timestamp: '12 hours ago',
        resonance: 25,
        hasResonated: false
      }
    ];
    setEmotionCards(sampleCards);
  }, []);

  const handleResonance = (cardId: string) => {
    setEmotionCards(cards => 
      cards.map(card => 
        card.id === cardId 
          ? { 
              ...card, 
              hasResonated: !card.hasResonated,
              resonance: card.hasResonated ? card.resonance - 1 : card.resonance + 1
            }
          : card
      )
    );
  };

  const filteredCards = emotionCards.filter(card => {
    if (selectedFilter === 'recent') return true; // 시간순 정렬
    if (selectedFilter === 'resonant') return card.resonance > 15;
    return true;
  });

  return (
    <main className="min-h-screen pb-24 bg-gradient-to-b from-[#2D1B69] to-[#1A0E3D] relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-orange-500/20 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-yellow-500/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-red-500/10 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <header className="px-4 pt-8 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white flex items-center">
              🔥 Campfire
            </h1>
            <p className="text-xs text-white/70">감정을 나누는 따뜻한 공간</p>
          </div>
          <Link href="/write" className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <span className="text-white text-lg">+</span>
          </Link>
        </div>
      </header>

      {/* Current Community Mood */}
      <section className="px-4 mb-6 relative z-10">
        <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">Community Energy</h3>
              <p className="text-white/70 text-sm">Right now, we're feeling...</p>
            </div>
            <div className="flex space-x-2">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-blue-400/60 flex items-center justify-center text-sm">🌊</div>
                <div className="text-xs text-white/70 mt-1">32%</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-yellow-400/60 flex items-center justify-center text-sm">☀️</div>
                <div className="text-xs text-white/70 mt-1">28%</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-pink-400/60 flex items-center justify-center text-sm">🎨</div>
                <div className="text-xs text-white/70 mt-1">25%</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-4 mb-6 relative z-10">
        <div className="flex bg-white/10 rounded-2xl p-1 backdrop-blur-sm">
          {[
            { key: 'all', label: 'All', icon: '🌍' },
            { key: 'recent', label: 'Recent', icon: '⏰' },
            { key: 'resonant', label: 'Popular', icon: '✨' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedFilter(tab.key as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                selectedFilter === tab.key 
                  ? 'bg-white text-gray-800 shadow-lg' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Emotion Cards Feed */}
      <section className="px-4 space-y-4 relative z-10">
        {filteredCards.map((card, index) => (
          <div 
            key={card.id}
            className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-1"
            style={{ 
              animationDelay: `${index * 100}ms`,
              boxShadow: `0 0 30px ${card.color}20`
            }}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: card.color + '40' }}
                >
                  {card.emoji}
                </div>
                <div>
                  <div className="text-white font-medium">{card.user}</div>
                  <div className="text-white/60 text-sm">{card.energy} • {card.timestamp}</div>
                </div>
              </div>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: card.color }}
              ></div>
            </div>

            {/* Card Content */}
            <div className="mb-4">
              <p className="text-white/90 text-sm leading-relaxed">{card.snippet}</p>
            </div>

            {/* Music Section */}
            <div className="flex items-center space-x-3 mb-4 p-3 rounded-2xl bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">🎵</span>
              </div>
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{card.music.title}</div>
                <div className="text-white/60 text-xs">{card.music.artist}</div>
              </div>
              <button className="px-3 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30 transition-colors">
                Play
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleResonance(card.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                  card.hasResonated 
                    ? 'bg-orange-500/30 text-orange-200' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className={`text-lg ${card.hasResonated ? 'animate-pulse' : ''}`}>
                  {card.hasResonated ? '🔥' : '💫'}
                </span>
                <span className="text-sm font-medium">
                  {card.hasResonated ? 'Resonating' : 'Resonate'}
                </span>
                <span className="text-xs">({card.resonance})</span>
              </button>

              <div className="flex space-x-2">
                <button className="px-3 py-2 bg-white/10 text-white/70 rounded-xl text-xs hover:bg-white/20 hover:text-white transition-colors">
                  Reply
                </button>
                <button className="px-3 py-2 bg-white/10 text-white/70 rounded-xl text-xs hover:bg-white/20 hover:text-white transition-colors">
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Add New Entry Floating Button */}
      <Link 
        href="/write"
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-2xl hover:shadow-orange-500/25 transition-all transform hover:scale-110 z-20"
      >
        <span className="text-white text-xl font-bold">+</span>
      </Link>

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/10">
        <div className="max-w-sm mx-auto h-full flex items-center justify-center">
          <div className="text-xs text-white/60">🔥 {filteredCards.length} people sharing their energy</div>
        </div>
      </div>
    </main>
  );
}