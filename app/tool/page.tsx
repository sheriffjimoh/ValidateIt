'use client'

import {  Suspense } from 'react'
import ToolContent from "@/components/tool-content";


export default function ToolPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink border-t-lime rounded-full animate-spin" />
      </div>
    }>
      <ToolContent />
    </Suspense>
  )
}