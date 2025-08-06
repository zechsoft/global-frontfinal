import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plus, 
  Eye, 
  Settings,
  ChevronUp,
  ChevronDown,
  Menu as MenuIcon,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// API base URL for the deployed backend
const API_BASE_URL = "http://localhost:8000"

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "orderNumber", label: "Order Number", visible: true, altKey: "OrderNumber" },
  { id: "materialCategory", label: "Material Category", visible: true, altKey: "MaterialCategory" },
  { id: "vendor", label: "Vendor", visible: true, altKey: "Vendor" },
  { id: "invitee", label: "Invitee", visible: true, altKey: "Invitee" },
  { id: "hostInviterContactInfo", label: "Host/Inviter Contact Info", visible: true, altKey: "Host" },
  { id: "sender", label: "Sender", visible: true, altKey: "Sender" },
  { id: "status", label: "Status", visible: true, altKey: "Status" },
  { id: "supplementTemplate", label: "Supplement Template", visible: true, altKey: "SupplementTemplate" },
  { id: "createTime", label: "Create Time", visible: true, altKey: "Created" },
  { id: "updateTime", label: "Update Time", visible: true, altKey: "updated" },
]

// Enhanced API utility with better error handling and authentication
const apiRequest = async (url, options = {}, authToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add authorization header if token is provided
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const defaultOptions = {
    credentials: 'include', // This is important for cookie-based auth
    headers,
  }

  try {
    console.log("Making API request to:", url)
    console.log("With token:", authToken ? "Token present" : "No token")
    console.log("Request options:", { ...defaultOptions, ...options })
    
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    console.log("Response status:", response.status)
    
    if (!response.ok) {
      // Handle different error types
      if (response.status === 401) {
        console.error('Authentication failed. Please log in again.')
        throw new Error('Authentication failed. Please log in again.')
      }
      
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        console.log("Error response data:", errorData)
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text()
          console.log("Error response text:", errorText)
          errorMessage = errorText || errorMessage
        } catch (textError) {
          console.warn('Could not parse error response:', parseError)
        }
      }
      
      throw new Error(errorMessage)
    }
    
    const responseData = await response.json()
    console.log("Response data:", responseData)
    return responseData
  } catch (error) {
    console.error('API Request failed:', error)
    throw error
  }
}

// Toast notification component
const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  )
}

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  )
}

export default function MaterialReplenish() {
  const { user, getAuthToken } = useAuth() // Get user and token function from auth context
  const [replenishments, setReplenishments] = useState([])
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS)
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false)
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false)
  
  // Form states
  const [editingReplenishment, setEditingReplenishment] = useState(null)
  const [selectedReplenishmentDetails, setSelectedReplenishmentDetails] = useState(null)
  const [rowToDelete, setRowToDelete] = useState(null)
  const [tempHeaders, setTempHeaders] = useState([])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState("")
  const [saveAsGlobal, setSaveAsGlobal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  
  const [newReplenishment, setNewReplenishment] = useState({
    orderNumber: '',
    materialCategory: '',
    vendor: '',
    invitee: '',
    hostInviterContactInfo: '',
    sender: '',
    status: '',
    supplementTemplate: '',
    createTime: '',
    updateTime: ''
  })

  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: "",
    label: "",
    visible: true,
    altKey: ""
  })

  const searchInputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const isAdmin = user?.role === "admin"

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type })
  }

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      showToast("No data to export", "error")
      return
    }

    // Get visible headers
    const visibleHeaders = tableHeaders.filter(header => header.visible)
    
    // Create CSV headers
    const csvHeaders = visibleHeaders.map(header => header.label).join(',')
    
    // Create CSV rows
    const csvRows = filteredData.map(replenishment => {
      return visibleHeaders.map(header => {
        const value = header.altKey 
          ? (replenishment[header.id] || replenishment[header.altKey] || "") 
          : (replenishment[header.id] || "")
        
        // Handle dates
        if ((header.id === "createTime" || header.id === "updateTime") && value) {
          return `"${new Date(value).toLocaleDateString()}"`
        }
        
        // Escape commas and quotes in values
        const stringValue = String(value).replace(/"/g, '""')
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue
      }).join(',')
    })
    
    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].join('\n')
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `material_replenishment_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast("Data exported successfully", "success")
  }

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return
      
      try {
        // Try multiple ways to get the auth token
        let authToken = getAuthToken()
        
        // Fallback: try to get from storage directly
        if (!authToken) {
          authToken = localStorage.getItem("token") || sessionStorage.getItem("token")
        }
        
        console.log("Fetching data for user:", user.email)
        console.log("Auth token available:", !!authToken)

        const data = await apiRequest(`${API_BASE_URL}/api/material-replenishment/get-data`, {
          method: 'POST',
          body: JSON.stringify({ email: user.email })
        }, authToken)

        setReplenishments(data || [])
        setFilteredData(data || [])
        
        // Fetch table headers
        try {
          const headerData = await apiRequest(
            `${API_BASE_URL}/api/table-headers/get-material?email=${user.email}`,
            { method: 'GET' },
            authToken
          )
          
          if (headerData.headers) {
            setTableHeaders(headerData.headers)
          }
        } catch (headerError) {
          console.error("Error fetching table headers:", headerError)
          // Try to load from localStorage as fallback
          const savedHeaders = localStorage.getItem('materialTableHeaders')
          if (savedHeaders) {
            try {
              setTableHeaders(JSON.parse(savedHeaders))
            } catch (e) {
              console.error("Error loading saved headers:", e)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        
        // If it's an auth error, suggest re-login
        if (error.message.includes('Authentication failed')) {
          showToast("Session expired. Please log in again.", "error")
        } else {
          showToast(error.message || "Error fetching data from server", "error")
        }
      }
    }

    fetchData()
  }, [user, getAuthToken])

  // Save headers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('materialTableHeaders', JSON.stringify(tableHeaders))
  }, [tableHeaders])

  // Filter function
  const filterRow = (row) => {
    if (searchTerm === "") return true
    
    if (selectedCountry === "All") {
      return tableHeaders.some(header => {
        if (!header.visible) return false
        const value = header.altKey 
          ? (row[header.id] || row[header.altKey] || "") 
          : (row[header.id] || "")
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        } else {
          return value.toString().includes(searchTerm)
        }
      })
    } else {
      const header = tableHeaders.find(h => h.label === selectedCountry)
      if (!header) return true
      
      const value = header.altKey ? (row[header.id] || row[header.altKey] || "") : (row[header.id] || "")
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      } else {
        return value.toString().includes(searchTerm)
      }
    }
  }

  // Handle search
  const handleSearch = () => {
    const filtered = replenishments.filter(filterRow)
    setFilteredData(filtered)
  }

  // Handle clear
  const handleClear = () => {
    setSearchTerm("")
    setSelectedCountry("All")
    setFilteredData(replenishments)
  }

  useEffect(() => {
    handleSearch()
  }, [searchTerm, replenishments, tableHeaders, selectedCountry])

  // Handle view details
  const handleViewDetails = (replenishment) => {
    setSelectedReplenishmentDetails(replenishment)
    setShowViewModal(true)
  }

  // Handle add replenishment
  const handleAdd = () => {
    setEditingReplenishment(null)
    setNewReplenishment({
      orderNumber: '',
      materialCategory: '',
      vendor: '',
      invitee: '',
      hostInviterContactInfo: '',
      sender: '',
      status: '',
      supplementTemplate: '',
      createTime: '',
      updateTime: ''
    })
    setShowModal(true)
  }

  // Handle edit replenishment
  const handleEdit = (replenishment) => {
    setEditingReplenishment(replenishment)
    setNewReplenishment({
      orderNumber: replenishment.orderNumber || replenishment.OrderNumber || "",
      materialCategory: replenishment.materialCategory || replenishment.MaterialCategory || "",
      vendor: replenishment.vendor || replenishment.Vendor || "",
      invitee: replenishment.invitee || replenishment.Invitee || "",
      hostInviterContactInfo: replenishment.hostInviterContactInfo || replenishment.Host || "",
      sender: replenishment.sender || replenishment.Sender || "",
      status: replenishment.status || replenishment.Status || "",
      supplementTemplate: replenishment.supplementTemplate || replenishment.SupplementTemplate || "",
      createTime: replenishment.createTime || replenishment.Created || "",
      updateTime: replenishment.updateTime || replenishment.updated || "",
    })
    setShowModal(true)
  }

  // Handle delete replenishment
  const handleDelete = (id) => {
    setRowToDelete(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken()
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token")
      }
      
      const replenishmentToDelete = replenishments.find(row => row.id === rowToDelete)
      
      if (!replenishmentToDelete) {
        throw new Error("Record not found")
      }
      
      let mongoId = replenishmentToDelete._id || replenishmentToDelete.id
      
      if (!mongoId) {
        throw new Error("Could not determine record database ID")
      }
      
      await apiRequest(`${API_BASE_URL}/api/material-replenishment/delete-data`, {
        method: 'POST',
        body: JSON.stringify({
          id: mongoId,
          email: user.email
        })
      }, authToken)
      
      const updatedReplenishments = replenishments.filter(s => s.id !== rowToDelete)
      setReplenishments(updatedReplenishments)
      setFilteredData(updatedReplenishments.filter(filterRow))
      
      showToast("Record deleted successfully", "success")
    } catch (error) {
      console.error("Error deleting record:", error)
      showToast(error.message || "Error deleting record", "error")
    } finally {
      setShowDeleteDialog(false)
      setRowToDelete(null)
    }
  }

  // Handle save replenishment
  const handleSave = async () => {
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken()
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token")
      }
      
      const currentDateTime = new Date().toISOString().slice(0, -8)
      
      if (editingReplenishment) {
        // Update existing replenishment
        const rowToUpdate = replenishments.find(row => row._id === editingReplenishment._id || row.id === editingReplenishment.id)
        
        if (!rowToUpdate) {
          throw new Error("Could not find the row to update")
        }
        
        const mongoId = rowToUpdate._id || rowToUpdate.id
        
        const updatedRowData = { 
          ...rowToUpdate,
          ...newReplenishment,
          OrderNumber: newReplenishment.orderNumber,
          MaterialCategory: newReplenishment.materialCategory,
          Vendor: newReplenishment.vendor,
          Invitee: newReplenishment.invitee,
          Host: newReplenishment.hostInviterContactInfo,
          Sender: newReplenishment.sender,
          Status: newReplenishment.status,
          SupplementTemplate: newReplenishment.supplementTemplate,
          Created: newReplenishment.createTime,
          updated: newReplenishment.updateTime,
          updateTime: currentDateTime,
          updatedBy: user.email
        }
        
        const updated = replenishments.map(s => 
          s.id === editingReplenishment.id ? updatedRowData : s
        )
        
        setReplenishments(updated)
        setFilteredData(updated.filter(filterRow))
        
        // Send update to server
        await apiRequest(`${API_BASE_URL}/api/material-replenishment/update-data`, {
          method: 'POST',
          body: JSON.stringify({
            id: mongoId,
            data: newReplenishment,
            email: user.email
          })
        }, authToken)

        showToast("Record updated successfully", "success")
      } else {
        // Add new replenishment
        const newId = replenishments.length > 0 ? Math.max(...replenishments.map(s => parseInt(s.id) || 0)) + 1 : 1
        
        const newReplenishmentObj = {
          ...newReplenishment,
          id: newId,
          _id: `temp-${newId}`,
          OrderNumber: newReplenishment.orderNumber,
          MaterialCategory: newReplenishment.materialCategory,
          Vendor: newReplenishment.vendor,
          Invitee: newReplenishment.invitee,
          Host: newReplenishment.hostInviterContactInfo,
          Sender: newReplenishment.sender,
          Status: newReplenishment.status,
          SupplementTemplate: newReplenishment.supplementTemplate,
          Created: newReplenishment.createTime,
          updated: newReplenishment.updateTime,
          createTime: currentDateTime,
          updateTime: currentDateTime,
          createdBy: user.email,
          updatedBy: user.email
        }
        
        const newReplenishments = [...replenishments, newReplenishmentObj]
        setReplenishments(newReplenishments)
        setFilteredData(newReplenishments.filter(filterRow))
        
        // Send to server
        await apiRequest(`${API_BASE_URL}/api/material-replenishment/add-data`, {
          method: 'POST',
          body: JSON.stringify([
            newReplenishment,
            {"user": user.email}
          ])
        }, authToken)
        
        showToast("Record added successfully", "success")
      }
    } catch (error) {
      console.error("Error saving record:", error)
      showToast(error.message || "Error saving record", "error")
    } finally {
      setShowModal(false)
    }
  }

  // Header management functions
  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders])
    setShowHeaderModal(true)
    setEditingHeader(null)
    setSaveAsGlobal(false)
  }

  const handleHeaderVisibilityChange = (index) => {
    const updatedHeaders = [...tempHeaders]
    updatedHeaders[index].visible = !updatedHeaders[index].visible
    setTempHeaders(updatedHeaders)
  }

  const handleEditHeaderLabel = (index) => {
    setEditingHeader(index)
    setNewHeaderName(tempHeaders[index].label)
  }

  const saveHeaderLabel = () => {
    if (editingHeader !== null && newHeaderName.trim()) {
      const updatedHeaders = [...tempHeaders]
      updatedHeaders[editingHeader].label = newHeaderName.trim()
      setTempHeaders(updatedHeaders)
      setEditingHeader(null)
      setNewHeaderName("")
    }
  }

  const moveHeader = (index, direction) => {
    if ((direction < 0 && index === 0) || (direction > 0 && index === tempHeaders.length - 1)) {
      return
    }
    
    const updatedHeaders = [...tempHeaders]
    const temp = updatedHeaders[index]
    updatedHeaders[index] = updatedHeaders[index + direction]
    updatedHeaders[index + direction] = temp
    setTempHeaders(updatedHeaders)
  }

  const saveHeaderChanges = async () => {
    setIsSaving(true)
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken()
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token")
      }
      
      const payload = {
        headers: tempHeaders,
        email: user.email,
        isGlobal: isAdmin && saveAsGlobal
      }
      
      console.log("Making request with payload:", payload)
      console.log("Auth token present:", !!authToken)
      
      const response = await apiRequest(`${API_BASE_URL}/api/table-headers/update-material`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, authToken)
      
      setTableHeaders(tempHeaders)
      setShowHeaderModal(false)
      
      // Handle localStorage based on whether it's global or personal
      if (payload.isGlobal) {
        // If saving as global, remove personal localStorage entry
        // so it will fetch global headers next time
        localStorage.removeItem('materialTableHeaders')
        showToast("Global table headers updated successfully! All users will see these changes.", "success")
      } else {
        // Save personal headers to localStorage
        localStorage.setItem('materialTableHeaders', JSON.stringify(tempHeaders))
        showToast("Personal table headers updated successfully!", "success")
      }
      
    } catch (error) {
      console.error("Error saving header changes:", error)
      showToast(error.message || "Error saving header changes", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteHeader = (index) => {
    if (!isAdmin) return
    const updatedHeaders = [...tempHeaders]
    updatedHeaders.splice(index, 1)
    setTempHeaders(updatedHeaders)
  }

  const handleAddHeader = () => {
    if (!isAdmin) return
    setShowAddHeaderModal(true)
  }

  const saveNewHeader = () => {
    if (!newHeaderInfo.id || !newHeaderInfo.label) {
      showToast("Header ID and Label are required", "error")
      return
    }
    
    const newHeader = {
      id: newHeaderInfo.id,
      label: newHeaderInfo.label,
      visible: true,
      altKey: newHeaderInfo.altKey || null
    }
    
    setTempHeaders([...tempHeaders, newHeader])
    setShowAddHeaderModal(false)
    
    setNewHeaderInfo({
      id: "",
      label: "",
      visible: true,
      altKey: ""
    })
  }

  const resetHeadersToDefault = () => {
    setTempHeaders([...DEFAULT_HEADERS])
  }

  const handleViewAllClick = () => {
    // Navigate to appropriate route based on user role
    if (user?.role === "admin") {
      // navigate to admin tables route
      window.location.href = "/admin/tables"
    } else {
      // navigate to client tables route
      window.location.href = "/client/tables"
    }
  }

  // Helper functions
  const getFieldValue = (item, header) => {
    return header.altKey 
      ? (item[header.id] || item[header.altKey] || "") 
      : (item[header.id] || "")
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return "-"
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="mt-16 p-6 bg-white shadow-md rounded-2xl w-full">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 p-6 bg-white shadow-md rounded-2xl w-full">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900">Material Replenishment</h1>
          <p className="text-md text-gray-400">Manage Material Replenishment</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleViewAllClick}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            View All
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowTableOptionsMenu(!showTableOptionsMenu)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Table Options
              </button>
              {showTableOptionsMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-10">
                  <button
                    onClick={() => {
                      openHeaderModal()
                      setShowTableOptionsMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Manage Columns
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="All">All</option>
            {tableHeaders.filter(header => header.visible).map(header => (
              <option key={header.id} value={header.label}>{header.label}</option>
            ))}
          </select>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search here"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                isFocused ? 'border-green-500 ring-green-500' : 'border-gray-300'
              }`}
            />
          </div>
          
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {tableHeaders
                .filter(header => header.visible)
                .map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((replenishment) => (
              <tr key={replenishment.id || replenishment._id} className="hover:bg-gray-50">
                {tableHeaders
                  .filter(header => header.visible)
                  .map(header => {
                    const value = getFieldValue(replenishment, header)

                    if (header.id === "status") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={value} />
                        </td>
                      )
                    }
                    
                    if (header.id === "createTime" || header.id === "updateTime") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(value)}
                        </td>
                      )
                    }
                    
                    return (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {value || "-"}
                      </td>
                    )
                  })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(replenishment)}
                      className="text-gray-600 hover:text-gray-800 p-1 border border-gray-300 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(replenishment)}
                      className="text-blue-600 hover:text-blue-800 p-1 border border-gray-300 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(replenishment.id)}
                      className="text-red-600 hover:text-red-800 p-1 border border-gray-300 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-700">Page {currentPage} of 1</p>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled
            className="px-3 py-1 text-sm border border-gray-300 rounded-md opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingReplenishment ? 'Edit Record' : 'Add New Record'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {tableHeaders.map(header => (
                <div key={header.id} className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {header.label}
                  </label>
                  {header.id === 'status' ? (
                    <select
                      value={newReplenishment[header.id] || ''}
                      onChange={(e) => setNewReplenishment({ ...newReplenishment, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  ) : (
                    <input
                      type={header.id === 'createTime' || header.id === 'updateTime' ? 'datetime-local' : 'text'}
                      value={newReplenishment[header.id] || ""}
                      onChange={(e) => setNewReplenishment({ ...newReplenishment, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingReplenishment ? "Update" : "Add"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedReplenishmentDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Record Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold mb-2">Entry Information</h4>
                <div className="flex">
                  <span className="font-semibold w-24">Created by:</span>
                  <span>{selectedReplenishmentDetails.createdBy || selectedReplenishmentDetails.user || "Unknown"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-24">Created on:</span>
                  <span>
                    {selectedReplenishmentDetails.createTime || selectedReplenishmentDetails.Created
                      ? formatDateTime(selectedReplenishmentDetails.createTime || selectedReplenishmentDetails.Created)
                      : "Unknown date"}
                  </span>
                </div>
              </div>
              
              {(selectedReplenishmentDetails.updateTime || selectedReplenishmentDetails.updated) && selectedReplenishmentDetails.updatedBy && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold mb-2">Last Update</h4>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated by:</span>
                    <span>{selectedReplenishmentDetails.updatedBy}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated on:</span>
                    <span>{formatDateTime(selectedReplenishmentDetails.updateTime || selectedReplenishmentDetails.updated)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Record</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this record? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Header Management Modal */}
      {showHeaderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Manage Table Columns</h3>
              <button
                onClick={() => setShowHeaderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="flex justify-between mb-4">
              <p className="text-gray-600">Configure which columns are visible and their order</p>
              <div className="flex gap-2">
                {isAdmin && (
                  <button
                    onClick={handleAddHeader}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Add New Column
                  </button>
                )}
                <button
                  onClick={resetHeadersToDefault}
                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                >
                  Reset to Default
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-auto">
              {tempHeaders.map((header, index) => (
                <div 
                  key={header.id} 
                  className={`flex items-center p-3 border border-gray-200 rounded-md mb-2 ${ 
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex flex-1 items-center">
                    <button className="mr-2 cursor-grab text-gray-400 hover:text-gray-600">
                      <MenuIcon className="w-4 h-4" />
                    </button>
                    
                    {editingHeader === index ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input 
                          value={newHeaderName} 
                          onChange={(e) => setNewHeaderName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveHeaderLabel()}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={saveHeaderLabel}
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm">{header.label}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditHeaderLabel(index)}
                      className="p-1 text-gray-600 hover:text-blue-600"
                      title="Edit label"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {isAdmin ? (
                      <button
                        onClick={() => deleteHeader(index)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete column"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1 text-gray-300 cursor-not-allowed"
                        title="Only admins can delete columns"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-center">
                      <button
                        disabled={index === 0}
                        onClick={() => moveHeader(index, -1)}
                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        disabled={index === tempHeaders.length - 1}
                        onClick={() => moveHeader(index, 1)}
                        className="p-1 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <label className="flex items-center ml-2">
                      <input
                        type="checkbox"
                        checked={header.visible}
                        onChange={() => handleHeaderVisibilityChange(index)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {isAdmin && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={saveAsGlobal}
                    onChange={(e) => setSaveAsGlobal(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600 mr-2"
                  />
                  <span className="text-sm">Save as global default (affects all users)</span>
                </label>
              )}
              <div className="flex gap-2">
                <button
                  onClick={saveHeaderChanges}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (saveAsGlobal && isAdmin ? "Save Global Changes" : "Save Changes")}
                </button>
                <button
                  onClick={() => setShowHeaderModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Header Modal */}
      {showAddHeaderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Column</h3>
              <button
                onClick={() => setShowAddHeaderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column ID <span className="text-red-500">*</span>
                </label>
                <input 
                  value={newHeaderInfo.id}
                  onChange={(e) => setNewHeaderInfo({...newHeaderInfo, id: e.target.value})}
                  placeholder="e.g. contactPerson (camelCase)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column Label <span className="text-red-500">*</span>
                </label>
                <input 
                  value={newHeaderInfo.label}
                  onChange={(e) => setNewHeaderInfo({...newHeaderInfo, label: e.target.value})}
                  placeholder="e.g. Contact Person"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternative Key (Optional)
                </label>
                <input 
                  value={newHeaderInfo.altKey || ""}
                  onChange={(e) => setNewHeaderInfo({...newHeaderInfo, altKey: e.target.value})}
                  placeholder="For backwards compatibility"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use this if data might be stored under a different key name
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveNewHeader}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Column
              </button>
              <button
                onClick={() => setShowAddHeaderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}