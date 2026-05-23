import { useEffect, useState } from 'react'
import { HandelFile } from '../../../services/HandelFile.js'

function CustomerIdThumb({ fileId }) {
  const [src, setSrc] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fid = String(fileId ?? '').trim()
    if (!fid) {
      setSrc(null)
      setFailed(false)
      return undefined
    }

    const load = async () => {
      try {
        const hf = new HandelFile()
        const res = await hf.DownloadFile({ fileId: fid })
        if (cancelled) return
        if (res?.url && res?.status !== false) {
          setSrc(res.url)
          setFailed(false)
        } else {
          setSrc(null)
          setFailed(true)
        }
      } catch {
        if (!cancelled) {
          setSrc(null)
          setFailed(true)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [fileId])

  if (!fileId) {
    return (
      <div
        className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc]"
        aria-hidden
      >
        <div className="h-7 w-10 rounded bg-linear-to-br from-[#e2e8f0] to-[#cbd5e1]" />
      </div>
    )
  }

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="h-10 w-14 rounded-lg border border-[#e2e8f0] object-cover"
      />
    )
  }

  return (
    <div
      className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[10px] text-[#9ca3af]"
      aria-hidden
    >
      ID
    </div>
  )
}

export default CustomerIdThumb
