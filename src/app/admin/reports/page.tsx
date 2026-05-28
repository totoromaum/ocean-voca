'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BarChart3, Clock, Target, Book } from 'lucide-react'

export default function AdminReportsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    
    // Fetch sessions. RLS policy ensures teacher only sees their assigned students.
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        id, activity_type, completed, score, time_spent_seconds, created_at,
        students(student_number),
        vocabulary_sets(title)
      `)
      .order('created_at', { ascending: false })
    
    if (data) setSessions(data)
    setLoading(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}분 ${s}초`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800 flex items-center gap-3">
        <BarChart3 className="text-blue-500" size={32} />
        학습 리포트
      </h1>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">학생들의 최근 학습 이력</h2>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">불러오는 중...</div>
          ) : sessions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <BarChart3 size={48} className="text-gray-300 mb-4" />
              <p>아직 학습 이력이 없습니다.</p>
              <p className="text-sm mt-1">학생들이 단어 학습을 시작하면 여기에 기록이 나타납니다.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">학번</th>
                  <th className="p-4 font-semibold">단어장</th>
                  <th className="p-4 font-semibold">활동 종류</th>
                  <th className="p-4 font-semibold">진행 상황</th>
                  <th className="p-4 font-semibold">학습 시간</th>
                  <th className="p-4 font-semibold">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{session.students?.student_number}</td>
                    <td className="p-4 text-gray-700 font-medium">{session.vocabulary_sets?.title}</td>
                    <td className="p-4">
                      {session.activity_type === 'flashcard' ? (
                        <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                          <Book size={14} /> 플래시카드
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-md">
                          <Target size={14} /> 매칭 게임
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {session.completed ? (
                        <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                          완료 {session.activity_type === 'match_game' && `(${session.score}점)`}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">진행 중</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <Clock size={14} /> {formatTime(session.time_spent_seconds)}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(session.created_at).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
