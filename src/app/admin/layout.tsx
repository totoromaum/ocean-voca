import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Users, BookOpen, BarChart3 } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current session
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login?type=teacher&message=선생님 로그인이 필요합니다.')
  }

  // Check if they are in the teachers table
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('*')
    .eq('id', user.id)
    .single()

  if (teacherError || !teacher) {
    // If not a teacher, maybe a student tried to enter?
    redirect('/login?type=teacher&message=접근 권한이 없습니다.')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold vibrant-title">Ocean Voca</h2>
          <p className="text-sm text-gray-500 mt-1">Teacher Dashboard</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl font-medium">
            <Users size={20} /> 학생 관리
          </Link>
          <Link href="/admin/voca" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
            <BookOpen size={20} /> 단어장 관리
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium transition-colors">
            <BarChart3 size={20} /> 리포트
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold truncate">{teacher.name}</p>
            <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 text-red-500 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors font-medium text-sm">
              <LogOut size={18} /> 로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
