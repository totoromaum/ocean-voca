'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { recordStudySession } from '../../../actions'
import { Trophy, Timer, XCircle } from 'lucide-react'
import Link from 'next/link'

type Card = {
  uid: string
  wordId: string
  text: string
  type: 'english' | 'korean'
  matched: boolean
}

export default function MatchGamePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const setId = resolvedParams.id

  const [cards, setCards] = useState<Card[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Game State
  const [playing, setPlaying] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [score, setScore] = useState(0)
  const [mistakes, setMistakes] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchWords()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (playing && !completed) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [playing, completed, startTime])

  const fetchWords = async () => {
    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('set_id', setId)
    
    if (data && data.length > 0) {
      // Create pairs
      let deck: Card[] = []
      data.forEach(w => {
        deck.push({ uid: `${w.id}-en`, wordId: w.id, text: w.english, type: 'english', matched: false })
        deck.push({ uid: `${w.id}-ko`, wordId: w.id, text: w.korean, type: 'korean', matched: false })
      })
      // Shuffle
      deck = deck.sort(() => 0.5 - Math.random())
      setCards(deck)
    }
    setLoading(false)
  }

  const startGame = () => {
    setPlaying(true)
    setStartTime(Date.now())
  }

  const handleCardClick = (clickedCard: Card) => {
    if (!playing || clickedCard.matched || selectedCard?.uid === clickedCard.uid) return

    if (!selectedCard) {
      setSelectedCard(clickedCard)
      return
    }

    // Check for match
    if (selectedCard.wordId === clickedCard.wordId && selectedCard.type !== clickedCard.type) {
      // Matched!
      setCards(prev => prev.map(c => 
        c.wordId === clickedCard.wordId ? { ...c, matched: true } : c
      ))
      setSelectedCard(null)

      // Check win condition
      setTimeout(() => {
        setCards(currentCards => {
          if (currentCards.every(c => c.matched)) {
            finishGame(currentCards.length / 2)
          }
          return currentCards
        })
      }, 100)
    } else {
      // Not matched
      setMistakes(m => m + 1)
      setSelectedCard(null)
      // Visual feedback could be added here
    }
  }

  const finishGame = async (totalPairs: number) => {
    setCompleted(true)
    setPlaying(false)
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    
    // Simple Score Calculation: max 100, minus 1 for each second, minus 5 for each mistake
    let calcScore = 100 - (timeSpent / 2) - (mistakes * 5)
    if (calcScore < 10) calcScore = 10 // min score 10
    const finalScore = Math.floor(calcScore)
    setScore(finalScore)

    await recordStudySession({
      setId,
      activityType: 'match_game',
      score: finalScore,
      timeSpent
    })
  }

  if (loading) return <div className="text-center py-20 animate-pulse font-bold text-2xl text-purple-400">Loading Game...</div>
  if (cards.length === 0) return <div className="text-center py-20 font-bold text-2xl">단어가 없습니다.</div>

  if (!playing && !completed) {
    return (
      <div className="game-card max-w-xl mx-auto text-center py-16">
        <h2 className="text-4xl font-black text-gray-800 mb-4">단어 매칭 게임</h2>
        <p className="text-xl text-gray-600 mb-8">
          영어와 뜻을 짝지어 보세요. <br/>빠를수록, 실수하지 않을수록 점수가 높습니다!
        </p>
        <button onClick={startGame} className="btn-primary text-2xl px-12 py-4 animate-bounce">
          시작하기!
        </button>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="game-card max-w-xl mx-auto text-center py-16 bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
        <Trophy size={100} className="mx-auto text-yellow-500 mb-6 drop-shadow-lg" />
        <h2 className="text-5xl font-black text-gray-800 mb-2">게임 클리어!</h2>
        <p className="text-2xl font-bold text-orange-500 mb-8">최종 점수: {score}점</p>
        
        <div className="flex justify-center gap-8 mb-10 text-gray-600 font-semibold">
          <div className="flex flex-col items-center">
            <Timer size={24} className="mb-1" /> {elapsedTime}초
          </div>
          <div className="flex flex-col items-center">
            <XCircle size={24} className="mb-1 text-red-400" /> 실수 {mistakes}번
          </div>
        </div>

        <Link href="/student" className="btn-secondary inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header HUD */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6 border-2 border-gray-100">
        <div className="text-lg font-bold text-gray-500">
          실수: <span className="text-red-500">{mistakes}</span>
        </div>
        <div className="text-3xl font-black text-blue-500 tracking-wider">
          {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:{(elapsedTime % 60).toString().padStart(2, '0')}
        </div>
        <div className="text-lg font-bold text-gray-500">
          남은 카드: <span className="text-green-500">{cards.filter(c => !c.matched).length}</span>
        </div>
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => {
          if (card.matched) {
            return (
              <div key={card.uid} className="h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <span className="text-gray-300 font-black text-2xl">✓</span>
              </div>
            )
          }

          const isSelected = selectedCard?.uid === card.uid
          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(card)}
              className={`h-32 rounded-2xl border-4 font-bold text-lg md:text-xl transition-all duration-200 p-2 break-words
                ${isSelected 
                  ? 'bg-blue-500 text-white border-blue-600 transform scale-95 shadow-inner' 
                  : 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                }
              `}
            >
              {card.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
