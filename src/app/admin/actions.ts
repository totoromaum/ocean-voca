'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

function generateRandomNumbers(length: number) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

export async function bulkCreateStudents(studentNumbers: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const adminAuthClient = createAdminClient()
  const generatedAccounts = []

  for (const stuNum of studentNumbers) {
    // 1. Generate Info
    const loginId = `ocean${stuNum}`
    const password = generateRandomNumbers(6)
    const dummyEmail = `${loginId}@ocean.ms.dummy`

    // 2. Create User in Supabase Auth using Admin API
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: dummyEmail,
      password: password,
      email_confirm: true // bypass email confirmation
    })

    if (authError) {
      console.error(`Error creating auth user for ${stuNum}:`, authError)
      continue
    }

    if (authData.user) {
      // 3. Insert into public.students table
      // Note: We can use the normal client for this because RLS allows teachers to insert their assigned students,
      // But using the admin client is safer to bypass RLS just in case. Let's use normal client with teacher's identity.
      const { error: dbError } = await supabase.from('students').insert({
        id: authData.user.id,
        student_number: stuNum,
        login_id: loginId,
        teacher_id: user.id
      })

      if (dbError) {
        console.error(`Error inserting student record for ${stuNum}:`, dbError)
        // Rollback auth user
        await adminAuthClient.auth.admin.deleteUser(authData.user.id)
        continue
      }

      generatedAccounts.push({
        student_number: stuNum,
        loginId,
        password
      })
    }
  }

  revalidatePath('/admin')
  return { 
    success: true, 
    accounts: generatedAccounts, 
    total: generatedAccounts.length 
  }
}

export async function deleteStudent(studentId: string) {
  const supabase = await createClient()
  // Ensure the student belongs to the teacher via RLS implicitly
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  
  if (error) {
    return { success: false, error: error.message }
  }

  // Then delete from auth using admin client (optional, but good practice)
  const adminAuthClient = createAdminClient()
  await adminAuthClient.auth.admin.deleteUser(studentId)

  revalidatePath('/admin')
  return { success: true }
}
