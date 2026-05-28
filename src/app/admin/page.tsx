'use client'

import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { bulkCreateStudents, deleteStudent } from './actions'
import { createClient } from '@/utils/supabase/client'
import { Trash2, Upload, FileSpreadsheet, Download, Users } from 'lucide-react'

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [generatedAccounts, setGeneratedAccounts] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('student_number', { ascending: true })
    
    if (data) setStudents(data)
    setLoading(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        // Find the column containing student numbers (e.g., '학번' or 'student_number')
        const studentNumbers: string[] = []
        data.forEach((row: any) => {
          const num = row['학번'] || row['student_number'] || row['학번(숫자)']
          if (num) studentNumbers.push(String(num).trim())
        })

        if (studentNumbers.length === 0) {
          alert("엑셀 파일에 '학번' 이라는 이름의 열(Column)이 없습니다.")
          setUploading(false)
          return
        }

        const result = await bulkCreateStudents(studentNumbers)
        
        if (result.success) {
          alert(`${result.total}명의 학생 계정이 생성되었습니다.`)
          setGeneratedAccounts(result.accounts || [])
          fetchStudents()
        } else {
          alert('계정 생성 중 오류가 발생했습니다.')
        }
      } catch (err) {
        console.error(err)
        alert('파일을 처리하는 중 문제가 발생했습니다.')
      } finally {
        setUploading(false)
        if (e.target) e.target.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`학번 ${num} 학생을 정말 삭제하시겠습니까?`)) return
    
    const res = await deleteStudent(id)
    if (res.success) {
      fetchStudents()
    } else {
      alert('삭제 실패: ' + res.error)
    }
  }

  const exportAccountsToExcel = () => {
    if (generatedAccounts.length === 0) return
    const ws = XLSX.utils.json_to_sheet(generatedAccounts)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Accounts")
    XLSX.writeFile(wb, "student_accounts.xlsx")
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800">학생 관리</h1>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <FileSpreadsheet className="text-green-500" />
            학생 일괄 등록 (엑셀 업로드)
          </h2>
          <p className="text-gray-500 text-sm">
            '학번'이라는 열(Column)이 포함된 엑셀(.xlsx) 파일을 업로드하면 
            아이디와 무작위 6자리 비밀번호가 자동 생성됩니다.
          </p>
        </div>
        
        <label className={`btn-primary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={18} />
          {uploading ? '생성 중...' : '엑셀 파일 선택'}
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Generated Accounts Result */}
      {generatedAccounts.length > 0 && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-2xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-green-800">새로 생성된 계정 목록 ({generatedAccounts.length}명)</h2>
            <button onClick={exportAccountsToExcel} className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-100 transition-colors">
              <Download size={16} /> 엑셀로 다운로드
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto bg-white rounded-xl border p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 font-semibold">학번</th>
                  <th className="pb-2 font-semibold">아이디</th>
                  <th className="pb-2 font-semibold">임시 비밀번호</th>
                </tr>
              </thead>
              <tbody>
                {generatedAccounts.map((acc, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{acc.student_number}</td>
                    <td className="py-2 font-mono text-blue-600">{acc.loginId}</td>
                    <td className="py-2 font-mono text-red-500">{acc.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold">등록된 학생 목록</h2>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            총 {students.length}명
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">불러오는 중...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <Users size={48} className="text-gray-300 mb-4" />
              <p>아직 등록된 학생이 없습니다.</p>
              <p className="text-sm mt-1">위에서 엑셀 파일을 업로드하여 학생을 추가해 보세요.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm">
                <tr>
                  <th className="p-4 font-semibold">학번</th>
                  <th className="p-4 font-semibold">아이디</th>
                  <th className="p-4 font-semibold">등록일</th>
                  <th className="p-4 font-semibold text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">{student.student_number}</td>
                    <td className="p-4 text-gray-600 font-mono text-sm">{student.login_id}</td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(student.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(student.id, student.student_number)}
                        className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="학생 삭제"
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
