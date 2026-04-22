import { Suspense } from 'react'
import SearchContent from '../search/page-content'

export default function SearchWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}