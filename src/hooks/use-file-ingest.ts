import { useCallback } from 'react'

import { ACCEPTED_EXTENSIONS } from '@/core/constants'
import { useMaterialsStore } from '@/store/materials-store'

export function useFileIngest() {
  const ingest = useMaterialsStore((state) => state.ingest)
  return useCallback((files: FileList | File[] | null) => ingest(files), [ingest])
}

export function acceptedFilesLabel(): string {
  return ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(', ')
}
