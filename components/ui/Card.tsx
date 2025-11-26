import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-md p-4
        ${onClick ? 'active:scale-98 transition-transform cursor-pointer hover:shadow-lg' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  )
}
