'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginTeacher(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?type=teacher&message=Could not authenticate user')
  }

  return redirect('/admin')
}

export async function signupTeacher(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  // 1. Sign up the user in auth.users
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return redirect(`/login?type=teacher&message=${authError.message}`)
  }

  // 2. If successful, insert into public.teachers
  if (authData.user) {
    const { error: dbError } = await supabase.from('teachers').insert({
      id: authData.user.id,
      email: email,
      name: name,
      assigned_grades: []
    })
    
    if (dbError) {
       console.error(dbError)
       return redirect('/login?type=teacher&message=Failed to create teacher profile')
    }
  }

  return redirect('/admin?message=Check email to continue sign in process')
}

export async function loginStudent(formData: FormData) {
  const supabase = await createClient()

  const loginId = formData.get('loginId') as string
  const password = formData.get('password') as string

  // We map the login_id to the dummy email
  const dummyEmail = `${loginId}@ocean.ms.dummy`

  const { error } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password,
  })

  if (error) {
    return redirect('/login?type=student&message=Invalid Student ID or Password')
  }

  return redirect('/student')
}
