import { loginTeacher, signupTeacher, loginStudent } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; message?: string }>
}) {
  const resolvedParams = await searchParams
  const type = resolvedParams?.type || 'student'
  const message = resolvedParams?.message

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="game-card w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          {type === 'teacher' ? '👩‍🏫 선생님 로그인' : '👦 학생 로그인'}
        </h2>
        
        {message && (
          <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 rounded-xl">
            {message}
          </div>
        )}

        {type === 'teacher' ? (
          <form className="flex flex-col gap-4 w-full">
            <div>
              <label className="block text-sm font-semibold mb-1">이메일</label>
              <input name="email" type="email" required className="input-field" placeholder="teacher@ocean.ms" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">비밀번호</label>
              <input name="password" type="password" required className="input-field" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">이름 (회원가입 시에만 입력)</label>
              <input name="name" type="text" className="input-field" placeholder="홍길동 선생님" />
            </div>
            
            <div className="flex gap-4 mt-4">
              <button formAction={loginTeacher} className="btn-secondary flex-1">
                로그인
              </button>
              <button formAction={signupTeacher} className="btn-primary flex-1">
                회원가입
              </button>
            </div>
          </form>
        ) : (
          <form className="flex flex-col gap-4 w-full">
            <div>
              <label className="block text-sm font-semibold mb-1">학생 아이디</label>
              <input name="loginId" type="text" required className="input-field" placeholder="ocean10101" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">비밀번호 (6자리 숫자)</label>
              <input name="password" type="password" required className="input-field" placeholder="••••••" />
            </div>
            
            <button formAction={loginStudent} className="btn-primary w-full mt-4">
              게임 시작하기 🚀
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm">
          <a href="/" className="text-blue-500 hover:underline">
            ← 첫 화면으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
