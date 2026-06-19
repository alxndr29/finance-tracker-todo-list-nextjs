'use client'

import { X, Download } from 'lucide-react'

interface ImageViewerProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm truncate max-w-xs">{alt}</p>
          <div className="flex gap-2">
            <a
              href={src}
              download={alt}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <img src={src} alt={alt} className="w-full max-h-[80vh] object-contain rounded-xl" />
      </div>
    </div>
  )
}
