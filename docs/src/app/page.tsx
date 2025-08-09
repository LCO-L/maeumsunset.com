import React from 'react';
import Link from 'next/link';

// EmotionMap 컴포넌트를 위한 임시 인라인 정의
function EmotionMap() {
  const emotionData = [
    { id: '1', emotion: 'Calm', intensity: 8, color: '#9CC9FF', x: 20, y: 30 },
    { id: '2', emotion: 'Joy', intensity: 9, color: '#FFD97D', x: 60, y: 45 },
    { id: '3', emotion: 'Excited', intensity: 7, color: '#FF9ED1', x: 40, y: 60 },
    { id: '4', emotion: 'Peaceful', intensity: 6, color: '#B4E7CE', x: 80, y: 25 },
    { id: '5', emotion: 'Focused', intensity: 8, color: '#A8DADC', x: 30, y: 75 }
  ];

  return (
    <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Emotion Map</h3>
        <div className="flex bg-white/10 rounded-lg p-1">
          <button className="px-3 py-1 rounded text-xs font-medium bg-white text-gray-800">Timeline</button>
          <button className="px-3 py-1 rounded text-xs font-medium text-white/70">Time</button>
        </div>
      </div>

      <div className="relative w-full h-48 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden border border-white/10">
        {emotionData.map((emotion, index) => (
          <div
            key={emotion.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${emotion.x}%`, top: `${emotion.y}%` }}
          >
            <div 
              className="w-3 h-3 rounded-full shadow-lg transition-all duration-300 group-hover:scale-150"
              style={{ backgroundColor: emotion.color }}
            ></div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {emotion.emotion}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-white/60">
          <span className="font-medium">Calm</span> • Apr 21
        </div>
        <div className="flex space-x-1">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className={`w-2 h-2 rounded-full bg-${['blue','yellow','green','purple','pink','orange','red'][i-1]}-400`}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen pb-24 bg-gradient-to-b from-[#ffbb88] to-[#ff89b0]">
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">SunSet</h1>
            <p className="text-sm text-white/70 mt-1">감정·시각·청각 허브</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <span className="text-xl">😊</span>
          </div>
        </div>
      </header>

      {/* Today's Quote Section */}
      <section className="px-4 mt-6">
        <div className="rounded-3xl p-6 backdrop-blur-sm bg-white/10 border border-white/20 shadow-2xl">
          <div className="text-sm text-white/70 font-medium mb-2">Today's Quote</div>
          <h2 className="text-xl font-semibold text-white mb-4 leading-relaxed">
            What energy would you like to add to the day?
          </h2>
          <Link href="/write" className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-800 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
            View Entry
          </Link>
          
          {/* Past emotions indicator */}
          <div className="flex items-center mt-4 space-x-2">
            <span className="text-xs text-white/60">past emotions</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-pink-400"></div>
            </div>
            <span className="text-xs text-white/40">•••</span>
          </div>
        </div>
      </section>

      {/* Import Cards Grid */}
      <section className="px-4 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Import Hub</h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Music Sources */}
          <div className="rounded-2xl p-4 backdrop-blur-sm bg-white/10 border border-white/20">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">♪</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Music</div>
                <div className="text-xs text-white/60">Spotify • Apple Music</div>
              </div>
            </div>
            <div className="text-xs text-white/70">좋아요한 곡 임포트</div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl p-4 backdrop-blur-sm bg-white/10 border border-white/20">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Calendar</div>
                <div className="text-xs text-white/60">Events & Schedule</div>
              </div>
            </div>
            <div className="text-xs text-white/70">중요 일정과 감정 연결</div>
          </div>

          {/* Health & Wellness */}
          <div className="rounded-2xl p-4 backdrop-blur-sm bg-white/10 border border-white/20">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">💓</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Health</div>
                <div className="text-xs text-white/60">Apple Health • Notion</div>
              </div>
            </div>
            <div className="text-xs text-white/70">건강 데이터 감정 반영</div>
          </div>

          {/* Photos */}
          <div className="rounded-2xl p-4 backdrop-blur-sm bg-white/10 border border-white/20">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">📸</span>
              </div>
              <div>
                <div className="text-sm font-medium text-white">Photos</div>
                <div className="text-xs text-white/60">Camera • Journal</div>
              </div>
            </div>
            <div className="text-xs text-white/70">오늘 사진으로 감정 포스터</div>
          </div>
        </div>
      </section>

      {/* Emotion Map */}
      <section className="px-4 mt-6">
        <EmotionMap />
      </section>

      {/* Quick Actions */}
      <section className="px-4 mt-6">
        <div className="flex space-x-3">
          <Link href="/campfire" className="flex-1 py-3 px-4 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 text-center">
            <div className="text-sm font-medium text-white">Campfire</div>
            <div className="text-xs text-white/60 mt-1">감정 공유 공간</div>
          </Link>
          <Link href="/result" className="flex-1 py-3 px-4 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 text-center">
            <div className="text-sm font-medium text-white">History</div>
            <div className="text-xs text-white/60 mt-1">과거 기록 탐색</div>
          </Link>
        </div>
      </section>

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
        <div className="max-w-sm mx-auto h-full flex items-center justify-center">
          <div className="text-xs text-white/60">Navigation will be here</div>
        </div>
      </div>
    </main>
  );
}