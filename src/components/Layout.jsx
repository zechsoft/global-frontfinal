import { useState, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const sidebarRef = useRef(null)
  const hoverTriggerRef = useRef(null)
  const layoutRef = useRef(null)
  
  // Mock user data - replace with actual auth context
  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  }

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
    setIsHovering(false)
  }

  const handleSidebarOpen = () => {
    setSidebarOpen(true)
  }

  // Handle hover trigger on the left edge for desktop
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Only trigger hover on desktop (screen width > 1024px)
      if (window.innerWidth > 1024) {
        // Check if mouse is near the left edge (within 10px)
        if (e.clientX <= 10 && !sidebarOpen) {
          setIsHovering(true)
          setSidebarOpen(true)
        }
      }
    }

    // Handle mouse leave from the hover trigger area
    const handleMouseLeave = () => {
      if (isHovering && window.innerWidth > 1024) {
        // Add a small delay before closing to prevent accidental closes
        setTimeout(() => {
          if (isHovering) {
            setIsHovering(false)
            setSidebarOpen(false)
          }
        }, 300)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [sidebarOpen, isHovering])

  // Handle clicks outside sidebar to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      // On mobile, close sidebar when clicking outside
      if (window.innerWidth <= 1024) {
        if (
          sidebarOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target) &&
          !event.target.closest('[data-sidebar-trigger]')
        ) {
          handleSidebarClose()
        }
      }
      // On desktop, close sidebar if it was opened by hover and user clicks elsewhere
      else if (isHovering && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsHovering(false)
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sidebarOpen, isHovering])

  // Handle sidebar mouse enter/leave for hover behavior
  const handleSidebarMouseEnter = () => {
    if (window.innerWidth > 1024) {
      setIsHovering(true)
    }
  }

  const handleSidebarMouseLeave = () => {
    if (window.innerWidth > 1024 && isHovering) {
      setTimeout(() => {
        setIsHovering(false)
        setSidebarOpen(false)
      }, 300)
    }
  }

  // Close sidebar on window resize if switching to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && isHovering) {
        setIsHovering(false)
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isHovering])

  return (
    <div 
      className="min-h-screen bg-gray-50 flex relative" 
      ref={layoutRef}
    >
      {/* Background image for top 50% only */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(135deg, #4A90E2 0%, #357ABD 25%, #2E5F8A 50%, #1E3A5F 75%, #0F1419 100%),
            radial-gradient(ellipse at top right, rgba(255,255,255,0.1) 0%, transparent 50%),
            radial-gradient(ellipse at bottom left, rgba(255,255,255,0.05) 0%, transparent 50%)
          `
        }}
      >
        {/* Decorative wave patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute top-0 right-0 w-full h-full"
            viewBox="0 0 1200 400"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern id="waves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
                <path
                  d="M0,50 Q50,0 100,50 T200,50"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                  fill="none"
                />
                <path
                  d="M0,60 Q50,10 100,60 T200,60"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  fill="none"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        </div>

        {/* Additional decorative elements - only in top half */}
        <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-white opacity-5"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-white opacity-5"></div>
      </div>

      {/* Hover trigger area for desktop - invisible div on left edge */}
      <div
        ref={hoverTriggerRef}
        className="hidden lg:block fixed left-0 top-0 w-2 h-full z-40 cursor-pointer"
        onMouseEnter={() => {
          if (!sidebarOpen) {
            handleSidebarOpen()
            setIsHovering(true)
          }
        }}
      />

      {/* Sidebar Container - Always overlay on both mobile and desktop */}
      <div
        ref={sidebarRef}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className="fixed inset-y-0 left-0 z-50"
      >
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={handleSidebarClose}
          user={user}
        />
      </div>

      {/* Main content area - Full width always */}
      <div className="flex-1 flex flex-col w-full relative z-10">
        {/* Navbar */}
        <div data-sidebar-trigger>
          <Navbar onMenuToggle={handleMenuToggle} user={user} />
        </div>
        
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Overlay for both mobile and desktop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={handleSidebarClose}
        />
      )}

      {/* Desktop Edge Indicator - Shows when hovering near left edge */}
      {isHovering && !sidebarOpen && (
        <div className="hidden lg:block fixed left-0 top-1/2 transform -translate-y-1/2 w-1 h-20 bg-blue-500 rounded-r-md z-50 transition-all duration-200" />
      )}
    </div>
  )
}