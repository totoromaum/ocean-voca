'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { createVocabularySet, deleteVocabularySet } from './actions'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Upload, Book, FileText, CheckCircle2 } from 'lucide-react'

export default function AdminVocaPage() {
  const [sets, setSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parsedWords, setParsedWords] = useState<{english: string, korean: string}[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchSets()
  }, [])

  const fetchSets = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('vocabulary_sets')
      .select('*, teachers(name)')
      .order('created_at', { ascending: false })
    
    if (data) setSets(data)
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        const words: {english: string, korean: string}[] = []
        
        data.forEach((row: any) => {
          // Detect columns. Usually "영어", "단어", "english" and "뜻", "의미", "korean"
          const eng = row['영어'] || row['단어'] || row['English'] || row['english']
          const kor = row['뜻'] || row['의미'] || row['Korean'] || row['korean']
          
          if (eng && kor) {
            words.push({ english: String(eng).trim(), korean: String(kor).trim() })
          }
        })

        if (words.length === 0) {
          alert("엑셀 파일에서 '영어', '뜻' 열(Column)을 찾을 수 없습니다.")
          return
        }

        setParsedWords(words)
        alert(`${words.length}개의 단어를 불러왔습니다. 제목과 설명을 입력하고 저장하세요!`)
      } catch (err) {
        console.error(err)
        alert('파일을 처리하는 중 문제가 발생했습니다.')
      } finally {
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleSaveSet = async () => {
    if (!title.trim() || parsedWords.length === 0) {
      alert('제목을 입력하고 단어 엑셀 파일을 먼저 업로드해주세요.')
      return
    }

    setUploading(true)
    const res = await createVocabularySet(title, description, parsedWords)
    if (res.success) {
      alert('단어장 세트가 성공적으로 등록되었습니다.')
      setTitle('')
      setDescription('')
      setParsedWords([])
      fetchSets()
    } else {
      alert('등록 중 오류 발생: ' + res.error)
    }
    setUploading(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 단어장을 삭제하시겠습니까? (관련된 학생 학습 기록도 삭제될 수 있습니다)`)) return
    
    const res = await deleteVocabularySet(id)
    if (res.success) {
      fetchSets()
    } else {
      alert('삭제 실패: ' + res.error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800">단어장(세트) 관리</h1>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Book className="text-blue-500" />새 단어장 등록
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-1">단어장 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field" 
              placeholder="예: 중1 미래엔 1단원" 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">설명 (선택)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field" 
              placeholder="단어장에 대한 간단한 설명" 
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="flex items-center gap-4">
            <label className="btn-secondary flex items-center gap-2 cursor-pointer">
              <Upload size={18} /> 단어 엑셀 업로드
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileUpload} />
            </label>
            {parsedWords.length > 0 && (
              <span className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <CheckCircle2 size={18} /> {parsedWords.length} 단어 로드됨
              </span>
            )}
          </div>
          <button 
            onClick={handleSaveSet}
            disabled={uploading || parsedWords.length === 0}
            className={`btn-primary ${uploading || parsedWords.length === 0 ? 'opacity-50' : ''}`}
          >
            {uploading ? '저장 중...' : '공용 단어장으로 저장'}
          </button>
        </div>
      </div>

      {/* Set List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">공용 단어장 라이브러리</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            총 {sets.length}개
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">불러오는 중...</div>
          ) : sets.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <FileText size={48} className="text-gray-300 mb-4" />
              <p>아직 등록된 단어장이 없습니다.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">제목</th>
                  <th className="p-4 font-semibold">설명</th>
                  <th className="p-4 font-semibold">제작 선생님</th>
                  <th className="p-4 font-semibold">등록일</th>
                  <th className="p-4 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sets.map((set) => (
                  <tr key={set.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{set.title}</td>
                    <td className="p-4 text-gray-600 text-sm">{set.description || '-'}</td>
                    <td className="p-4 text-gray-600 text-sm">{set.teachers?.name || '알 수 없음'}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(set.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(set.id, set.title)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="단어장 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
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
