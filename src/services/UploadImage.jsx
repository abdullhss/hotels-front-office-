import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent } from '../components/ui/dialog.jsx'
import { CameraIcon, ExcelIcon, PdfIcon, WordIcon } from '../../utils/Icons'
import './uploadImage.css'
import { getBase64 } from './getBase64.js'

export { getBase64 } from './getBase64.js'

const uploadButton = (
  <div className="text-center">
    <CameraIcon type="plus" />
  </div>
)

function filePreviewContent(file) {
  const type = file?.type ?? ''
  if (type.startsWith('image/')) {
    const src = file.preview || file.url || file.thumbUrl
    if (src) {
      return <img src={src} alt="" className="h-full w-full object-cover" />
    }
  }
  switch (type) {
    case 'application/pdf':
      return (
        <div className="flex h-full w-full items-center justify-center">
          <PdfIcon />
        </div>
      )
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return (
        <div className="flex h-full w-full items-center justify-center">
          <WordIcon />
        </div>
      )
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return (
        <div className="flex h-full w-full items-center justify-center">
          <ExcelIcon />
        </div>
      )
    default:
      return (
        <span className="line-clamp-2 px-1 text-center text-[10px] text-gray-600" title={file?.name}>
          {file?.name ?? '—'}
        </span>
      )
  }
}

export default function UploadImage({
  errorMessage,
  error,
  fileList = [],
  handleUploadChange,
  renderButton = uploadButton,
  maxCount = 8,
  accept = 'image/*',
  ...props
}) {
  const inputRef = useRef(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const borderTone = error ? 'border-red-600' : 'border-[#a2a1a833]'

  const handleFiles = async (e) => {
    const raw = e.target.files
    if (!raw?.length) return
    e.target.value = ''

    const picked = Array.from(raw)
    const newItems = []
    for (const file of picked) {
      if (file.size === 0 && !file.type) continue
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      let preview = ''
      try {
        if (file.type.startsWith('image/')) {
          preview = await getBase64(file)
        }
      } catch {
        preview = ''
      }
      newItems.push({
        uid,
        name: file.name,
        status: 'done',
        originFileObj: file,
        preview,
        type: file.type,
      })
    }
    if (!newItems.length) return

    const merged = [...fileList, ...newItems].slice(0, maxCount)
    const last = newItems[newItems.length - 1]
    handleUploadChange?.({
      file: last,
      fileList: merged,
    })
  }

  const showPreview = (index) => {
    setPreviewIndex(index)
    setPreviewVisible(true)
  }

  const n = fileList?.length ?? 0
  const canAdd = n < maxCount
  const previewSrc =
    fileList[previewIndex]?.preview ||
    fileList[previewIndex]?.url ||
    fileList[previewIndex]?.thumbUrl

  return (
    <div className="flex w-full flex-col" {...props}>
      <div className="flex flex-wrap gap-2">
        {fileList?.map((file, index) => (
          <button
            key={file.uid ?? index}
            type="button"
            onClick={() => showPreview(index)}
            className={`upload-image-card-trigger relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-gray-50 ${borderTone}`}
          >
            {filePreviewContent(file)}
          </button>
        ))}
        {canAdd ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`upload-image-card-trigger flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-gray-50 hover:border-[#2a2a2d33] ${borderTone}`}
          >
            {renderButton}
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFiles}
        />
      </div>
      {errorMessage ? <span className="mt-1 px-[14px] text-sm text-[#d32f2f]">{errorMessage}</span> : null}

      <Dialog open={previewVisible} onOpenChange={setPreviewVisible}>
        <DialogContent
          className="max-w-3xl rounded-md! p-4"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <h2 className="sr-only">Preview</h2>
          <div className="relative flex max-h-[70vh] min-h-[120px] items-center justify-center">
            {n > 1 ? (
              <button
                type="button"
                className="absolute inset-s-2 z-10 rounded-full border border-gray-200 bg-white/90 p-2 shadow hover:bg-white"
                aria-label="Previous"
                onClick={() => setPreviewIndex((i) => (i - 1 + n) % n)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : null}
            {previewSrc && String(fileList[previewIndex]?.type ?? '').startsWith('image/') ? (
              <img
                src={previewSrc}
                alt=""
                className="max-h-[70vh] max-w-full cursor-grab rounded-md object-contain blur-sm transition hover:blur-none"
              />
            ) : (
              <div className="flex max-h-[50vh] w-full flex-col items-center justify-center gap-4 p-6">
                {filePreviewContent(fileList[previewIndex] ?? {})}
              </div>
            )}
            {n > 1 ? (
              <button
                type="button"
                className="absolute inset-e-2 z-10 rounded-full border border-gray-200 bg-white/90 p-2 shadow hover:bg-white"
                aria-label="Next"
                onClick={() => setPreviewIndex((i) => (i + 1) % n)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
