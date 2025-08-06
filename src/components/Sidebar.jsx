import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  User, 
  BarChart3, 
  Plus, 
  LogOut,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Package,
  HelpCircle,
  Truck,
  ShoppingCart,
  RefreshCw,
  MessageSquare,
  Users,
  Database
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose, onOpen }) {
  const [tablesOpen, setTablesOpen] = useState(false)
  const [footerCollapsed, setFooterCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'admin'
  const basePath = isAdmin ? '/admin' : '/client'
  
  const menuItems = [
    { path: `${basePath}/dashboard`, icon: Home, label: 'Dashboard' },
    { path: `${basePath}/profile`, icon: User, label: 'Profile' },
    { path: `${basePath}/customised-table`, icon: BarChart3, label: 'Customised Table' },
    { path: `${basePath}/table-creation`, icon: Plus, label: 'Table Creation' },
    { path: `${basePath}/chat`, icon: MessageSquare, label: 'Chat' },
    // Admin-only menu items
   
  ]

  const tableItems = [
    { path: `${basePath}/daily-work`, icon: Calendar, label: 'Daily Work' },
    { path: `${basePath}/view-tables`, icon: Eye, label: 'View Tables' },
  ]

  const quickAccessItems = [
    { path: `${basePath}/supplier-info`, icon: Package, label: 'Supplier Info' },
    { path: `${basePath}/material-inquiry`, icon: HelpCircle, label: 'Material Inquiry' },
    { path: `${basePath}/customer-delivery`, icon: Truck, label: 'Customer Delivery' },
    { path: `${basePath}/customer-order`, icon: ShoppingCart, label: 'Customer Order' },
    { path: `${basePath}/material-replenish`, icon: RefreshCw, label: 'Material Replenish' }
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      if (onClose) onClose()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleLinkClick = () => {
    // Close sidebar after navigation (especially important for mobile)
    if (onClose) {
      onClose()
    }
  }

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <>
      {/* Custom styles for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Blue Line Indicator - Shows when sidebar is closed */}
      <div className={`fixed left-1 top-1/2 transform -translate-y-1/2 h-16 w-0.5 bg-gradient-to-b from-blue-600 to-blue-700 z-40 transition-opacity duration-300 rounded-full ${
        isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
      </div>

      {/* Hover trigger area when sidebar is closed */}
      <div 
        className={`fixed left-0 top-1/2 transform -translate-y-1/2 h-20 w-8 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 cursor-pointer'
        }`}
        onClick={onOpen}
        onMouseEnter={() => {
          // Optional: Show a tooltip or preview on hover
          console.log('Hover to open sidebar')
        }}
      >
        {/* Invisible trigger area */}
      </div>
      
      {/* Main Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out flex flex-col`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">G</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white leading-tight">Global India</span>
              <span className="text-sm font-medium text-blue-100 leading-tight">Corporation</span>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {/* Main Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                  isActive(item.path) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Tables Dropdown */}
          <div className="pt-4">
            <button
              onClick={() => setTablesOpen(!tablesOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                Tables
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                tablesOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {tablesOpen && (
              <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {tableItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-3 transition-colors ${
                      isActive(item.path) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access Section */}
          <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Access
            </h3>
            <div className="space-y-1">
              {quickAccessItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-3 transition-colors ${
                    isActive(item.path) ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className={`border-t bg-gray-50 transition-all duration-300 ${footerCollapsed ? 'h-auto' : ''}`}>
          {/* Collapse/Expand Button */}
          <div className="flex justify-center py-2 border-b border-gray-200">
            <button
              onClick={() => setFooterCollapsed(!footerCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              aria-label={footerCollapsed ? "Expand footer" : "Collapse footer"}
            >
              {footerCollapsed ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Footer Content - Collapsible */}
          <div className={`transition-all duration-300 overflow-hidden ${
            footerCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
          }`}>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${isAdmin ? 'bg-red-500' : 'bg-green-500'} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'No email'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                    isAdmin 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user?.role?.toUpperCase() || 'USER'}
                  </span>
                </div>
              </div>
              
              {/* Social Media Links */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-2">
                  <a 
                    href="#" 
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    aria-label="Twitter"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </a>
                  <a 
                    href="#" 
                    className="p-1.5 text-pink-600 hover:bg-pink-50 rounded transition-colors"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378 0 0-.602 2.323-.747 2.896-.271 1.075-1.002 2.422-1.492 3.243 1.124.348 2.317.535 3.554.535 6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 group"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}