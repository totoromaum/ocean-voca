'use server'

import { createClient } from '@/utils/supabase/server'

export async function recordStudySession({
  setId,
  activityType,
  score,
  timeSpent
}: {
  setId: string
  activityType: 'flashcard' | 'match_game'
  score: number
  timeSpent: number
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { error } = await supabase.from('study_sessions').insert({
    student_id: user.id,
    set_id: setId,
    activity_type: activityType,
    completed: true,
    score: score,
    time_spent_seconds: timeSpent
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
