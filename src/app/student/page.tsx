'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { BookOpen, Sparkles, Play } from 'lucide-react'

export default function StudentDashboardPage() {
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSets()
  }, [])

  const fetchSets = async () => {
    setLoading(true)
    // Students can see all sets
    const { data, error } = await supabase
      .from('vocabulary_sets')
      .select('*, words(count)')
      .order('created_at', { ascending: false })
    
    if (data) setSets(data)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-2 flex items-center justify-center md:justify-start gap-2">
          <Sparkles className="text-yellow-400" size={32} />
          학습할 단어장을 선택해볼까?
        </h2>
        <p className="text-gray-600 text-lg">플래시카드로 외우고 매칭 게임으로 점수를 올려봐!</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xl font-bold text-gray-400 animate-pulse">
          단어장 불러오는 중... 🎮
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-2xl font-bold text-gray-500">아직 선생님이 단어장을 올리지 않으셨어!</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sets.map((set) => (
            <div key={set.id} className="game-card items-start !p-6 border-b-8 border-b-gray-200">
              <div className="w-full">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-black text-gray-800 line-clamp-2">{set.title}</h3>
                </div>
                <p className="text-gray-500 min-h-[3rem] line-clamp-2 mb-4">
                  {set.description || '단어장 설명이 없습니다.'}
                </p>
                <div className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm mb-6">
                  {set.words[0].count} 단어
                </div>
                
                <div className="flex flex-col gap-3">
                  <Link href={`/student/set/${set.id}/flashcard`} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <BookOpen size={20} /> 플래시카드 (암기)
                  </Link>
                  <Link href={`/student/set/${set.id}/match`} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play size={20} /> 단어 매칭 게임
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
