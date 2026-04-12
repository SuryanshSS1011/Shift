'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

type LogoVariant = 'full' | 'mark' | 'reversed-dark' | 'reversed-green'

interface LogoProps {
  variant?: LogoVariant
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeConfig = {
  sm: { full: { width: 110, height: 32 }, mark: { width: 28, height: 28 } },
  md: { full: { width: 165, height: 48 }, mark: { width: 40, height: 40 } },
  lg: { full: { width: 220, height: 64 }, mark: { width: 56, height: 56 } },
  xl: { full: { width: 280, height: 80 }, mark: { width: 72, height: 72 } },
}

const variantPaths: Record<LogoVariant, string> = {
  'full': '/brand/logo-primary.svg',
  'mark': '/brand/logo-bare-mark.svg',
  'reversed-dark': '/brand/logo-reversed-dark.svg',
  'reversed-green': '/brand/logo-reversed-green.svg',
}

export function Logo({ variant = 'full', size = 'md', className }: LogoProps) {
  const isReversed = variant.startsWith('reversed')
  const sizeType = variant === 'mark' ? 'mark' : 'full'
  const dimensions = sizeConfig[size][sizeType]

  return (
    <Image
      src={variantPaths[variant]}
      alt="Shift"
      width={dimensions.width}
      height={dimensions.height}
      className={cn('object-contain', className)}
      priority
    />
  )
}

// Inline SVG version for use in contexts where Image is not preferred
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 56 56"
      className={className}
    >
      <title>Shift</title>
      <path d="M 38 6 C 52 8,52 46,12 50 C -2 46,12 4,38 6 Z" fill="#16a34a"/>
      <path d="M 36 9 C 32 20,24 34,14 48" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
