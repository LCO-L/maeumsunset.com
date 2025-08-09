'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface HistoryData {
  date: string;
  energy: string;
  color: string;
  emoji: string;
  snippet: string;
  music: string;
  intensity: number;
}

interface WeeklyPattern {
  day: string;
  dominant: string;
  color: string;
  count: number;
}

export default function ResultPage() {
  const [viewMode, setViewMode] = useState<'timeline' | 'patterns' | 'insights'>('timeline');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([]);

  useEffect(() => {
    // 샘플 히스토리 데이터
    const sampleHistory: HistoryData[] = [
      { date: '2024-08-09', energy: 'Focused', color: '#A8DADC', emoji: '🎯', snippet: 'Deep work session...', music: 'Lo-Fi Study Beats', intensity: 8 },
      { date: '2024-08-08', energy: 'Creative', color: '#FF9ED1', emoji: '🎨', snippet: 'Art gallery visit...', music: 'Inspiration Flow', intensity: 9 },
      { date: '2024-08-07', energy: 'Calm', color: '#9CC9FF', emoji: '🌊', snippet: 'Evening by the lake...', music: 'Still Waters', intensity: 6 },
      { date: '2024-08-06', energy: 'Joy', color: '#FFD97D', emoji: '☀️', snippet: 'Coffee with friend...', music: 'Good Vibes', intensity: 9 },
      { date: '2024-08-05', energy: 'Grateful', color: '#B4E7CE', emoji: '🙏', snippet: 'Morning birds singing...', music: 'Morning Pages', intensity: 7 },
      { date: '2024-08-04', energy: 'Excited', color: '#F77F00', emoji: '✨', snippet: 'New project launch...', music: 'Electric Feel', intensity: 8 },
      { date: '2024-08-03', energy: 'Calm', color: '#9CC9FF', emoji: '🌊', snippet: 'Weekend meditation...', music: 'Peaceful Mind', intensity: 9 }
    ];
    setHistoryData(sampleHistory);

    // 주간 패턴 분석
    const patterns: WeeklyPattern[] = [
      { day: 'Mon', dominant: 'Focused', color: '#A8DADC', count: 3 },
      { day: 'Tue', dominant: 'Creative', color: '#FF9ED1', count: 2 },
      { day: 'Wed', dominant: 'Calm', color: '#9CC9FF', count: 4 },
      { day: 'Thu', dominant: 'Joy', color: '#FFD97D', count: 2 },
      { day: 'Fri', dominant: 'Excited', color: '#F77F00', count: 3 },
      { day: 'Sat', dominant: 'Grateful', color: '#B4E7CE', count: 3 },
      { day: 'Sun', dominant: 'Calm', color: '#9CC9FF', count: 5 }
    ];
    setWeeklyPatterns(patterns);
  }, []);

  const getIntensityHeight = (intensity: number) => `${(intensity / 10) * 100}%`;

  return (
    <main className="min-h-screen pb-24 bg-gradient-to-b from-[#1e1b4b] to-[#0f0f23]">
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-white/80 hover:text-white transition-colors">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Home</span>
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">History</h1>
            <p className="text-xs text-white/70">Your emotion journey</p>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      {/* View Mode Selector */}
      <section className="px-4 mb-6">
        <div className="flex bg-white/10 rounded-2xl p-1 backdrop-blur-sm">
          {[
            { key: 'timeline', label: 'Timeline', icon: '📅' },
            { key: 'patterns', label: 'Patterns', icon: '📊' },
            { key: 'insights', label: 'Insights', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key as any)}
              className={`flex-1 py-3 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                viewMode === tab.key 
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

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <section className="px-4">
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-6">
            <button className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-white">August 2024</h2>
            <button className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-4">
            {historyData.map((entry, index) => (
              <div 
                key={entry.date}
                className="flex items-center space-x-4 p-4 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/15 transition-all"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Date */}
                <div className="text-center min-w-[60px]">
                  <div className="text-white/60 text-xs">
                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-white font-semibold text-lg">
                    {new Date(entry.date).getDate()}
                  </div>
                </div>

                {/* Energy Indicator */}
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: entry.color + '40' }}
                >
                  {entry.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-white font-medium">{entry.energy}</h3>
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    ></div>
                  </div>
                  <p className="text-white/70 text-sm truncate">{entry.snippet}</p>
                  <p className="text-white/50 text-xs mt-1">♪ {entry.music}</p>
                </div>

                {/* Intensity Bar */}
                <div className="w-8 h-12 bg-white/10 rounded-full overflow-hidden flex items-end">
                  <div 
                    className="w-full transition-all duration-1000 rounded-full"
                    style={{ 
                      height: getIntensityHeight(entry.intensity),
                      backgroundColor: entry.color + '80'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Patterns View */}
      {viewMode === 'patterns' && (
        <section className="px-4">
          {/* Weekly Pattern Chart */}
          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Weekly Patterns</h3>
            <div className="flex items-end space-x-3 h-32">
              {weeklyPatterns.map((pattern, index) => (
                <div key={pattern.day} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full rounded-t-lg transition-all duration-1000 mb-2"
                    style={{ 
                      height: `${(pattern.count / 5) * 100}%`,
                      backgroundColor: pattern.color + '80',
                      animationDelay: `${index * 200}ms`
                    }}
                  ></div>
                  <div className="text-white/70 text-xs font-medium">{pattern.day}</div>
                  <div className="text-white/50 text-xs">{pattern.dominant}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Frequent Energies */}
          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Energies This Month</h3>
            <div className="space-y-3">
              {['Calm', 'Creative', 'Focused'].map((energy, index) => (
                <div key={energy} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl bg-${{Calm: 'blue', Creative: 'pink', Focused: 'cyan'}[energy]}-400/40 flex items-center justify-center`}>
                      {{'Calm': '🌊', 'Creative': '🎨', 'Focused': '🎯'}[energy]}
                    </div>
                    <span className="text-white font-medium">{energy}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${{Calm: 'blue', Creative: 'pink', Focused: 'cyan'}[energy]}-400 rounded-full transition-all duration-1000`}
                        style={{ width: `${[80, 60, 45][index]}%`, animationDelay: `${index * 300}ms` }}
                      ></div>
                    </div>
                    <span className="text-white/70 text-sm">{[12, 9, 7][index]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Insights View */}
      {viewMode === 'insights' && (
        <section className="px-4 space-y-6">
          {/* Personal Insights */}
          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Personal Insights
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5">
                <p className="text-white/90 text-sm mb-2">
                  <strong>Peak Energy Days:</strong> You tend to feel most creative on Tuesdays and most calm on Sundays.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5">
                <p className="text-white/90 text-sm mb-2">
                  <strong>Music Pattern:</strong> Lo-Fi and ambient music correlate with your most productive focused sessions.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5">
                <p className="text-white/90 text-sm mb-2">
                  <strong>Weekly Trend:</strong> Your energy intensity peaks mid-week and settles into calm by the weekend.
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Recommendations
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-500/20">
                <span className="text-2xl">🌊</span>
                <div>
                  <p className="text-white font-medium text-sm">Try more calm sessions</p>
                  <p className="text-white/70 text-xs">Your calm energy leads to the highest satisfaction</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-pink-500/20">
                <span className="text-2xl">🎨</span>
                <div>
                  <p className="text-white font-medium text-sm">Schedule creative time</p>
                  <p className="text-white/70 text-xs">Tuesday afternoons work best for your creative flow</p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="rounded-3xl backdrop-blur-sm bg-white/10 border border-white/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Export Your Journey</h3>
            <div className="flex space-x-3">
              <button className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                Monthly Report
              </button>
              <button className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors">
                Share Insights
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Bottom Navigation Placeholder */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-sm border-t border-white/10">
        <div className="max-w-sm mx-auto h-full flex items-center justify-center">
          <div className="text-xs text-white/60">📊 {historyData.length} emotion entries recorded</div>
        </div>
      </div>
    </main>
  );
}