'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVocabularySet(title: string, description: string, words: { english: string; korean: string }[]) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Insert Vocabulary Set
  const { data: set, error: setError } = await supabase
    .from('vocabulary_sets')
    .insert({
      title,
      description,
      created_by: user.id
    })
    .select('id')
    .single()

  if (setError || !set) {
    return { success: false, error: setError?.message || 'Failed to create set' }
  }

  // 2. Insert Words
  const wordsToInsert = words.map(w => ({
    set_id: set.id,
    english: w.english,
    korean: w.korean
  }))

  const { error: wordsError } = await supabase
    .from('words')
    .insert(wordsToInsert)

  if (wordsError) {
    // Should ideally rollback, but simple delete for MVP
    await supabase.from('vocabulary_sets').delete().eq('id', set.id)
    return { success: false, error: wordsError.message }
  }

  revalidatePath('/admin/voca')
  return { success: true }
}

export async function deleteVocabularySet(setId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('vocabulary_sets').delete().eq('id', setId)
  
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/admin/voca')
  return { success: true }
}
