'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { EARTH_GRADIENT } from '@/config/theme-config'

interface EarthButtonProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export function EarthButton({
  href,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  showArrow = false,
  className = '',
  type = 'button',
}: EarthButtonProps) {
  // サイズに応じたパディングとフォントサイズ
  const sizeClasses = {
    sm: 'px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm rounded-lg',
    md: 'px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl',
    lg: 'px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 text-base sm:text-lg md:text-xl rounded-2xl',
  }

  // ベーススタイル
  const baseClasses = 'group relative font-bold transition-all duration-300 inline-flex items-center justify-center space-x-2 sm:space-x-3 shadow-2xl hover:shadow-3xl hover:scale-105 transform whitespace-nowrap w-full sm:w-auto'

  // バリアントに応じたスタイル
  const variantStyles = {
    primary: {
      className: 'text-white',
      style: {
        background: EARTH_GRADIENT.css,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    secondary: {
      className: 'text-gray-900 backdrop-blur-lg border-2',
      style: {
        background: 'rgba(255, 255, 255, 0.7)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
      },
      textShadow: 'none',
    },
  }

  const variantStyle = variantStyles[variant]
  const sizeClass = sizeClasses[size]
  const combinedClasses = `${baseClasses} ${sizeClass} ${variantStyle.className} ${className}`

  const content = (
    <>
      <span className="relative z-10" style={{ textShadow: variantStyle.textShadow }}>
        {children}
      </span>
      {showArrow && (
        <ArrowRight 
          className="h-4 w-4 sm:h-5 sm:w-5 relative z-10 transform group-hover:translate-x-1 transition-transform flex-shrink-0" 
          style={{ filter: variant === 'primary' ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' : 'none' }} 
        />
      )}
    </>
  )

  if (href) {
    return (
      <Link 
        href={href} 
        className={combinedClasses}
        style={variantStyle.style}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClasses}
      style={variantStyle.style}
      onMouseEnter={variant === 'secondary' ? (e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.2)'
      } : undefined}
      onMouseLeave={variant === 'secondary' ? (e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
      } : undefined}
    >
      {content}
    </button>
  )
}
