import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  Home, 
  Users, 
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
  Database,
  Settings
} from 'lucide-react'

export default function AdminSidebar({ isOpen, onClose, user }) {
  const [tablesOpen, setTablesOpen] = useState(false)
  const [clientsOpen, setClientsOpen] = useState(false)
  const [footerCollapsed, setFooterCollapsed] = useState(false)
  const { logout, getAllClients } = useAuth()

  const clients = getAllClients()
  
  const menuItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Admin Dashboard' },
    { path: '/admin/clients', icon: Users, label: 'Client Management' },
    { path: '/admin/all-data', icon: Database, label: 'All Data Overview' },
    { path: '/admin/customised-table', icon: BarChart3, label: 'Customised Table' },
    { path: '/admin/table-creation', icon: Plus, label: 'Table Creation' },
    { path: '/admin/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  const tableItems = [
    { path: '/admin/daily-work', icon: Calendar, label: 'Daily Work' },
    { path: '/admin/view-tables', icon: Eye, label: 'View Tables' },
  ]

  const quickAccessItems = [
    { path: '/admin/supplier-info', icon: Package, label: 'Supplier Info' },
    { path: '/admin/material-inquiry', icon: HelpCircle, label: 'Material Inquiry' },
    { path: '/admin/customer-delivery', icon: Truck, label: 'Customer Delivery' },
    { path: '/admin/customer-order', icon: ShoppingCart, label: 'Customer Order' },
    { path: '/admin/material-replenish', icon: RefreshCw, label: 'Material Replenish' }
  ]

  const handleLogout = () => {
    logout()
    if (onClose) onClose()
  }

  const handleLinkClick = (e, path) => {
    e.preventDefault()
    console.log('Admin navigating to:', path)
    // Add your navigation logic here
    if (onClose) onClose()
  }

  const handleClientClick = (e, clientId) => {
    e.preventDefault()
    console.log('Viewing client data for:', clientId)
    // Add navigation to client-specific data
    if (onClose) onClose()
  }

  const isActive = (path) => {
    return window.location.pathname === path
  }

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out flex flex-col`}>
        
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-red-600 to-red-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white leading-tight">Admin Panel</span>
              <span className="text-sm font-medium text-red-100 leading-tight">Global India Corp</span>
            </div>
          </div>
          
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
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {/* Main Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={(e) => handleLinkClick(e, item.path)}
                className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group text-left ${
                  isActive(item.path)
                    ? 'bg-red-50 text-red-700 border-r-2 border-red-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                  isActive(item.path) ? 'text-red-700' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Client Management Dropdown */}
          <div className="pt-4">
            <button
              onClick={() => setClientsOpen(!clientsOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-3 text-gray-500 group-hover:text-gray-700" />
                Client Data Access
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                clientsOpen ? 'rotate-180' : ''
              }`} />
            </button>
            
            {clientsOpen && (
              <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={(e) => handleClientClick(e, client.id)}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-blue-600">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{client.name}</span>
                      <span className="text-xs text-gray-500">{client.companyName}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
                  <button
                    key={item.path}
                    onClick={(e) => handleLinkClick(e, item.path)}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group text-left ${
                      isActive(item.path)
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 mr-3 transition-colors ${
                      isActive(item.path) ? 'text-red-700' : 'text-gray-500 group-hover:text-gray-700'
                    }`} />
                    {item.label}
                  </button>
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
                <button
                  key={item.path}
                  onClick={(e) => handleLinkClick(e, item.path)}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group text-left ${
                    isActive(item.path)
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 mr-3 transition-colors ${
                    isActive(item.path) ? 'text-red-700' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className={`border-t bg-gray-50 transition-all duration-300 ${footerCollapsed ? 'h-auto' : ''}`}>
          <div className="flex justify-center py-2 border-b border-gray-200">
            <button
              onClick={() => setFooterCollapsed(!footerCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
            >
              {footerCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className={`transition-all duration-300 overflow-hidden ${
            footerCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
          }`}>
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>
              
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