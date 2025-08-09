import React, { useState, useEffect } from 'react';

interface EmotionData {
  id: string;
  emotion: string;
  intensity: number;
  color: string;
  timestamp: Date;
  x: number;
  y: number;
}

export default function EmotionMap() {
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [currentView, setCurrentView] = useState<'timeline' | 'time'>('timeline');

  // 샘플 감정 데이터 생성
  useEffect(() => {
    const sampleData: EmotionData[] = [
      { id: '1', emotion: 'Calm', intensity: 8, color: '#9CC9FF', timestamp: new Date(), x: 20, y: 30 },
      { id: '2', emotion: 'Joy', intensity: 9, color: '#FFD97D', timestamp: new Date(), x: 60, y: 45 },
      { id: '3', emotion: 'Excited', intensity: 7, color: '#FF9ED1', timestamp: new Date(), x: 40, y: 60 },
      { id: '4', emotion: 'Peaceful', intensity: 6, color: '#B4E7CE', timestamp: new Date(), x: 80, y: 25 },
      { id: '5', emotion: 'Focused', intensity: 8, color: '#A8DADC', timestamp: new Date(), x: 30, y: 75 },
      { id: '6', emotion: 'Creative', intensity: 9, color: '#F1FAEE', timestamp: new Date(), x: 70, y: 80 },
      { id: '7', emotion: 'Inspired', intensity: 7, color: '#E63946', timestamp: new Date(), x: 50, y: 20 },
      { id: '8', emotion: 'Grateful', intensity: 8, color: '#457B9D', timestamp: new Date(), x: 85, y: 65 },
      { id: '9', emotion: 'Energetic', intensity: 9, color: '#F77F00', timestamp: new Date(), x: 15, y: 85 },
      { id: '10', emotion: 'Serene', intensity: 6, color: '#FCBF49', timestamp: new Date(), x: 65, y: 35 }
    ];
    setEmotionData(sampleData);
  }, []);

  return (
    <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Emotion Map</h3>
        <div className="flex bg-white/10 rounded-lg p-1">
          <button 
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentView === 'timeline' 
                ? 'bg-white text-gray-800' 
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setCurrentView('timeline')}
          >
            Timeline
          </button>
          <button 
            className={`px-3 py-1 rounded text-xs font-medium transition-all ${
              currentView === 'time' 
                ? 'bg-white text-gray-800' 
                : 'text-white/70 hover:text-white'
            }`}
            onClick={() => setCurrentView('time')}
          >
            Time
          </button>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="relative w-full h-64 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden border border-white/10">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Emotion Dots */}
        {emotionData.map((emotion, index) => (
          <div
            key={emotion.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${emotion.x}%`,
              top: `${emotion.y}%`,
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Main Dot */}
            <div 
              className="w-4 h-4 rounded-full shadow-lg transition-all duration-300 group-hover:scale-150 animate-pulse"
              style={{ 
                backgroundColor: emotion.color,
                boxShadow: `0 0 ${emotion.intensity * 2}px ${emotion.color}40`
              }}
            ></div>
            
            {/* Ripple Effect */}
            <div 
              className="absolute inset-0 rounded-full opacity-30 animate-ping"
              style={{ backgroundColor: emotion.color }}
            ></div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {emotion.emotion}
              <div className="text-xs opacity-70">Intensity: {emotion.intensity}</div>
            </div>
          </div>
        ))}

        {/* Connection Lines (animated) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {emotionData.map((emotion, index) => {
            if (index === 0) return null;
            const prev = emotionData[index - 1];
            return (
              <line
                key={`line-${emotion.id}`}
                x1={`${prev.x}%`}
                y1={`${prev.y}%`}
                x2={`${emotion.x}%`}
                y2={`${emotion.y}%`}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
                strokeDasharray="2,3"
                className="animate-pulse"
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom Info */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/60">
          <span className="font-medium">Calm</span> • Apr 21
        </div>
        <div className="flex space-x-1">
          {/* Weekly emotion dots */}
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
        </div>
      </div>

      {/* Calendar View Toggle Area */}
      <div className="mt-3 p-3 bg-white/5 rounded-xl">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={day} className="text-xs font-medium text-white/70 py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar dates with emotion colors */}
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="relative">
              <div className="w-6 h-6 rounded-full text-xs text-white/80 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors">
                {15 + i}
              </div>
              {i < 5 && (
                <div 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: emotionData[i]?.color || '#9CC9FF' }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}