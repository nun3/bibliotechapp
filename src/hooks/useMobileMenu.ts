import { useState, useEffect } from 'react'

export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)

  return {
    isOpen,
    isMobile,
    toggle,
    close
  }
}
