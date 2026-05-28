import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Gamepad2, LogOut } from 'lucide-react'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current session
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?type=student&message=로그인이 필요합니다.')
  }

  // Check if they are in the students table
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .single()

  if (studentError || !student) {
    redirect('/login?type=student&message=학생 계정이 아닙니다.')
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b-4 border-blue-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/student" className="flex items-center gap-2">
            <Gamepad2 className="text-blue-500" size={28} />
            <h1 className="text-2xl font-black vibrant-title">Ocean Voca</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold text-sm border-2 border-yellow-300">
              학번: {student.student_number}
            </div>
            <form action="/auth/signout" method="post">
              <button className="text-gray-500 hover:text-red-500 font-bold text-sm">
                <LogOut size={20} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
