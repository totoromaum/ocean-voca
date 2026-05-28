'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { recordStudySession } from '../../../actions'
import { Volume2, ArrowRight, ArrowLeft, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function FlashcardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const setId = resolvedParams.id

  const [words, setWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchWords()
    setStartTime(Date.now())
  }, [])

  const fetchWords = async () => {
    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('set_id', setId)
    
    if (data && data.length > 0) {
      // shuffle words
      const shuffled = [...data].sort(() => 0.5 - Math.random())
      setWords(shuffled)
      speak(shuffled[0].english)
    }
    setLoading(false)
  }

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setIsFlipped(false)
      speak(words[currentIndex + 1].english)
    } else {
      finishStudy()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setIsFlipped(false)
      speak(words[currentIndex - 1].english)
    }
  }

  const finishStudy = async () => {
    setCompleted(true)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    await recordStudySession({
      setId,
      activityType: 'flashcard',
      score: 100,
      timeSpent
    })
  }

  if (loading) return <div className="text-center py-20 animate-pulse font-bold text-2xl text-blue-400">Loading Cards...</div>
  if (words.length === 0) return <div className="text-center py-20 font-bold text-2xl">단어가 없습니다.</div>

  if (completed) {
    return (
      <div className="game-card max-w-xl mx-auto text-center py-16">
        <Trophy size={80} className="mx-auto text-yellow-400 mb-6 drop-shadow-md" />
        <h2 className="text-4xl font-black text-gray-800 mb-4">학습 완료!</h2>
        <p className="text-xl text-gray-600 mb-8">플래시카드 암기를 마쳤습니다.</p>
        <Link href="/student" className="btn-primary inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const currentWord = words[currentIndex]
  const progress = ((currentIndex) / words.length) * 100

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      
      {/* Progress Bar */}
      <div className="w-full bg-blue-100 rounded-full h-4 mb-8 overflow-hidden">
        <div 
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="text-blue-500 font-bold mb-4">
        {currentIndex + 1} / {words.length}
      </div>

      {/* Card */}
      <div 
        className="w-full h-96 [perspective:1000px] cursor-pointer mb-8 group"
        onClick={() => {
          setIsFlipped(!isFlipped)
          if (isFlipped) speak(currentWord.english)
        }}
      >
        <div className={`w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* Front (English) */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl border-4 border-blue-100 flex flex-col items-center justify-center [backface-visibility:hidden]">
            <button 
              onClick={(e) => { e.stopPropagation(); speak(currentWord.english); }}
              className="absolute top-6 right-6 text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-full transition-colors"
            >
              <Volume2 size={32} />
            </button>
            <h2 className="text-6xl font-black text-gray-800 break-words px-8 text-center">{currentWord.english}</h2>
            <p className="absolute bottom-6 text-gray-400 font-semibold animate-pulse">카드를 탭하여 뜻 확인하기</p>
          </div>

          {/* Back (Korean) */}
          <div className="absolute w-full h-full bg-blue-500 rounded-3xl shadow-xl border-4 border-blue-600 flex flex-col items-center justify-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <h2 className="text-5xl font-black text-white break-words px-8 text-center">{currentWord.korean}</h2>
            <p className="absolute bottom-6 text-blue-200 font-semibold">카드를 탭하여 뒤집기</p>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full">
        <button 
          onClick={handlePrev} 
          disabled={currentIndex === 0}
          className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-lg transition-colors ${currentIndex === 0 ? 'bg-gray-200 text-gray-400' : 'bg-white shadow-md text-gray-700 hover:bg-gray-50'}`}
        >
          <ArrowLeft size={24} /> 이전
        </button>
        <button 
          onClick={handleNext} 
          className="flex-1 py-4 bg-green-400 hover:bg-green-500 text-white shadow-lg flex items-center justify-center gap-2 rounded-2xl font-bold text-lg transition-colors transform active:scale-95"
        >
          {currentIndex === words.length - 1 ? '완료' : '다음'} <ArrowRight size={24} />
        </button>
      </div>
    </div>
  )
}
