'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const SearchContent = dynamic(() => import('../search/page-content'), { ssr: false })

export default function SearchWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 p-8 text-center">Loading deals...</div>}>
      <SearchContent />
    </Suspense>
  )
}