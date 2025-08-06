import { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Settings, 
  Menu, 
  User,
  ChevronDown,
  Bell
} from 'lucide-react'

export default function Navbar({ 
  onMenuToggle, 
  onLogout, // Add this prop to handle logout from parent component
  user = { name: 'Admin User', email: 'admin@example.com' } 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userMenuRef = useRef(null)
  const searchRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearch(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setShowUserMenu(false)
      
      // Method 1: If using a parent component logout handler
      if (onLogout) {
        await onLogout()
        return
      }
      
      // Method 2: API logout call
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if using session-based auth
      })
      
      if (response.ok) {
        // Clear any stored tokens
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
        sessionStorage.clear()
        
        // Clear any auth cookies (if needed)
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
        
        // Redirect to login page
        window.location.href = '/login'
        // Or if using React Router: navigate('/login')
      } else {
        console.error('Logout failed')
        // Handle logout error - maybe show a notification
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Handle network error - maybe show a notification
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Mock search data
  const searchData = [
    { title: 'Dashboard', path: '/dashboard', type: 'page' },
    { title: 'Analytics', path: '/analytics', type: 'page' },
    { title: 'User Management', path: '/users', type: 'page' },
    { title: 'Settings', path: '/settings', type: 'page' },
    { title: 'Profile', path: '/profile', type: 'page' },
    { title: 'Reports', path: '/reports', type: 'page' },
    { title: 'Notifications', path: '/notifications', type: 'page' },
    { title: 'Billing', path: '/billing', type: 'page' },
    { title: 'Help Center', path: '/help', type: 'page' },
    { title: 'API Documentation', path: '/docs', type: 'page' }
  ]

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setSearchResults([])
      return
    }
    
    const filtered = searchData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(filtered)
  }

  const handleNavigate = (path) => {
    console.log(`Navigating to: ${path}`)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
    // In a real app, you would use your router here
    // For example: navigate(path) or window.location.href = path
    window.location.hash = path // Simple hash navigation for demo
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <header className="bg-transparent h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden mr-4 p-2 rounded-md text-white hover:bg-white/20 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Desktop Menu Button - Hidden by default, shows on hover near left edge */}
        <button
          onClick={onMenuToggle}
          className="hidden lg:block mr-4 p-2 rounded-md text-white hover:bg-white/20 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-white hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Search Dropdown */}
          {showSearch && (
            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-lg shadow-lg border z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search pages, settings, users..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoComplete="off"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  )}
                </div>
                
                {searchQuery && searchResults.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-500 mb-2">Search Results</div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigate(result.path)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                        >
                          <span className="text-gray-700">{result.title}</span>
                          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {result.path}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchQuery && searchResults.length === 0 && (
                  <div className="mt-3 text-sm text-gray-500 text-center py-4">
                    No results found for "{searchQuery}"
                  </div>
                )}
                
                {!searchQuery && (
                  <div className="mt-3 text-sm text-gray-500">
                    <div className="flex items-center justify-between mb-2">
                      <span>Quick Access</span>
                    </div>
                    <div className="space-y-1">
                      {searchData.slice(0, 5).map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleNavigate(item.path)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                        >
                          <span className="text-gray-700">{item.title}</span>
                          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.path}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button 
          className="p-2 text-white hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 text-sm text-white hover:bg-white/20 backdrop-blur-sm rounded-lg px-2 md:px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="User menu"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white/80 rounded-full flex items-center justify-center">
              <span className="text-gray-800 font-semibold text-xs md:text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="hidden md:block max-w-24 truncate">{user?.name || 'User'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-md shadow-lg border z-50 animate-in slide-in-from-top-2 duration-200">
              <div className="py-1">
                <div className="px-4 py-3 text-sm text-gray-700 border-b">
                  <div className="font-medium truncate">{user?.name || 'User'}</div>
                  <div className="text-gray-500 text-xs truncate">{user?.email}</div>
                  {user?.role && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                      {user.role}
                    </span>
                  )}
                </div>
                <a 
                  href="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Profile
                </a>
                <a 
                  href="/settings" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings
                </a>
                <hr className="my-1" />
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors disabled:opacity-50"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button - Hidden on very small screens */}
       
      </div>
    </header>
  )
}