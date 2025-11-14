import { useEffect, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function App() {
  const [file, setFile] = useState(null)
  const [useOcr, setUseOcr] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [docs, setDocs] = useState([])

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/documents`)
      const data = await res.json()
      setDocs(data.items || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const onUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setMessage('')

    const form = new FormData()
    form.append('file', file)

    const params = new URLSearchParams()
    params.set('use_ocr', String(useOcr))
    if (apiKey) params.set('ocr_api_key', apiKey)

    try {
      const res = await fetch(`${BACKEND}/api/documents/upload?${params.toString()}`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setMessage(`Uploaded: ${data.filename}. OCR: ${data.ocr_used ? 'Yes' : 'No'}`)
      setFile(null)
      ;(document.getElementById('fileInput') || {}).value = ''
      fetchDocs()
    } catch (err) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-10">
      <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800">PDF Upload with Text Extraction / OCR</h1>
        <p className="text-slate-600 mt-1">Upload a PDF. We extract text automatically. If needed, you can enable OCR via OCR.space API.</p>

        <form onSubmit={onUpload} className="mt-6 space-y-4">
          <input id="fileInput" type="file" accept="application/pdf" onChange={(e)=> setFile(e.target.files?.[0] || null)} className="block w-full text-sm" />

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={useOcr} onChange={(e)=> setUseOcr(e.target.checked)} />
              <span className="text-sm text-slate-700">Force OCR</span>
            </label>
            <input type="password" placeholder="OCR.space API Key (optional)" value={apiKey} onChange={(e)=> setApiKey(e.target.value)} className="border rounded px-3 py-2 text-sm w-72" />
          </div>

          <button disabled={!file || uploading} className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}

        <div className="mt-8">
          <h2 className="font-semibold text-slate-800">Recent Documents</h2>
          <ul className="mt-3 space-y-3">
            {docs.map(d => (
              <li key={d.id} className="p-3 border rounded bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{d.filename}</p>
                    <p className="text-xs text-slate-500">{(d.size/1024).toFixed(1)} KB • OCR: {d.ocr_used ? 'Yes' : 'No'}</p>
                  </div>
                  <a href={`${BACKEND}/api/documents/${d.id}/download`} className="text-indigo-600 text-sm hover:underline">Download</a>
                </div>
                {d.extracted_text_preview && (
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-auto bg-slate-50 p-2 rounded">{d.extracted_text_preview}</pre>
                )}
              </li>
            ))}
            {docs.length === 0 && <p className="text-sm text-slate-500">No documents yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default App
