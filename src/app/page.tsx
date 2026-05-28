import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="game-card max-w-2xl w-full">
        <h1 className="text-5xl md:text-7xl font-extrabold vibrant-title mb-6">
          Ocean Voca
        </h1>
        <p className="text-xl text-gray-600 mb-10">
          오션중학교 단어 정복에 오신 것을 환영합니다! 🚀
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/login?type=student" className="btn-primary flex-1 text-center text-xl">
            학생 로그인 🎮
          </Link>
          <Link href="/login?type=teacher" className="btn-secondary flex-1 text-center text-xl">
            선생님 로그인 📚
          </Link>
        </div>
      </div>
    </div>
  );
}
