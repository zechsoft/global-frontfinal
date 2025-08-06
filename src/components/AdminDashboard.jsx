import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  Users, 
  Database, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Package,
  ShoppingCart,
  Truck,
  HelpCircle,
  RefreshCw,
  Eye,
  ChevronRight
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, getAllClients } = useAuth()
  const [selectedTimeRange, setSelectedTimeRange] = useState('7days')
  
  const clients = getAllClients()

  const stats = [
    {
      title: 'Total Clients',
      value: clients.length,
      change: '+2',
      changeType: 'positive',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Active Projects',
      value: '24',
      change: '+5',
      changeType: 'positive',
      icon: BarChart3,
      color: 'green'
    },
    {
      title: 'Total Orders',
      value: '156',
      change: '+12',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'purple'
    },
    {
      title: 'Revenue',
      value: '₹2.4L',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'orange'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      client: 'ABC Manufacturing Ltd',
      action: 'Added new supplier',
      time: '2 hours ago',
      type: 'supplier'
    },
    {
      id: 2,
      client: 'XYZ Industries Pvt Ltd',
      action: 'Updated material inquiry',
      time: '4 hours ago',
      type: 'inquiry'
    },
    {
      id: 3,
      client: 'PQR Enterprises',
      action: 'Completed delivery',
      time: '6 hours ago',
      type: 'delivery'
    },
    {
      id: 4,
      client: '123 Solutions Inc',
      action: 'Submitted daily work report',
      time: '1 day ago',
      type: 'report'
    }
  ]

  const quickActions = [
    {
      title: 'View All Client Data',
      description: 'Access consolidated data from all clients',
      icon: Database,
      path: '/admin/all-data',
      color: 'blue'
    },
    {
      title: 'Manage Clients',
      description: 'Add, edit, or remove client accounts',
      icon: Users,
      path: '/admin/clients',
      color: 'green'
    },
    {
      title: 'Generate Reports',
      description: 'Create comprehensive business reports',
      icon: BarChart3,
      path: '/admin/reports',
      color: 'purple'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings',
      icon: Eye,
      path: '/admin/settings',
      color: 'orange'
    }
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'supplier': return Package
      case 'inquiry': return HelpCircle
      case 'delivery': return Truck
      case 'report': return Calendar
      default: return BarChart3
    }
  }

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-white',
      green: 'bg-green-500 text-white',
      purple: 'bg-purple-500 text-white',
      orange: 'bg-orange-500 text-white',
      red: 'bg-red-500 text-white'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 3 months</option>
              <option value="year">This year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last period</span>
                </div>
              </div>
              <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="bg-white rounded-lg shadow-sm border p-6 text-left hover:shadow-md transition-shadow group"
            onClick={() => console.log('Navigate to:', action.path)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${getColorClasses(action.color)}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <ActivityIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.client}
                      </p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Client Overview */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Client Overview</h2>
              <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                Manage Clients
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {clients.slice(0, 4).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-600">{client.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => console.log('View client data:', client.id)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">Database</p>
            <p className="text-xs text-green-600">Operational</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">API Services</p>
            <p className="text-xs text-green-600">All Systems Go</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
            </div>
            <p className="text-sm font-medium text-gray-900">Backup</p>
            <p className="text-xs text-yellow-600">Scheduled Maintenance</p>
          </div>
        </div>
      </div>
    </div>
  )
}