import React, { useState, useRef, useEffect } from 'react'
import { 
  Plus, Search, Filter, Edit, Trash2, MapPin, Clock, Eye, Settings, 
  ChevronUp, ChevronDown, Save, X, UserPlus, Menu as MenuIcon,
  ArrowUp, ArrowDown, Download
} from 'lucide-react'

// Backend API URL
const API_URL = "http://localhost:8000"

// API Configuration - Set this to true to use separate delivery endpoints
// Set to false to use the existing customer-delivery-notices endpoints
const USE_SEPARATE_DELIVERY_API = false

const API_ENDPOINTS = {
  getData: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries/get-data' : '/api/customer-delivery-notices/get-data',
  add: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries/add' : '/api/customer-delivery-notices/add',
  update: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries' : '/api/customer-delivery-notices',
  delete: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries' : '/api/customer-delivery-notices',
  headers: '/api/table-headers/get-customer-delivery'
}

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "id", label: "Delivery ID", visible: true },
  { id: "orderId", label: "Order ID", visible: true },
  { id: "customer", label: "Customer", visible: true },
  { id: "product", label: "Product", visible: true },
  { id: "quantity", label: "Quantity", visible: true },
  { id: "deliveryAddress", label: "Delivery Address", visible: true },
  { id: "scheduledDate", label: "Scheduled Date", visible: true },
  { id: "actualDate", label: "Actual Date", visible: true },
  { id: "driver", label: "Driver", visible: true },
  { id: "vehicleNo", label: "Vehicle No", visible: true },
  { id: "trackingNumber", label: "Tracking Number", visible: true },
  { id: "priority", label: "Priority", visible: true },
  { id: "status", label: "Status", visible: true }
]

// Toast notification component
const ToastNotification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">×</button>
      </div>
    </div>
  );
};

export default function CustomerDelivery() {
  // State management
  const [deliveries, setDeliveries] = useState([])
  const [filteredDeliveries, setFilteredDeliveries] = useState([])
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false)
  
  // Edit states
  const [editingDelivery, setEditingDelivery] = useState(null)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [deliveryToDelete, setDeliveryToDelete] = useState(null)
  const [tempHeaders, setTempHeaders] = useState([])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState('')
  const [saveAsGlobal, setSaveAsGlobal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    orderId: '',
    customer: '',
    product: '',
    quantity: '',
    deliveryAddress: '',
    scheduledDate: '',
    actualDate: '',
    driver: '',
    vehicleNo: '',
    trackingNumber: '',
    priority: 'Medium',
    status: 'Scheduled'
  })
  
  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: '',
    label: '',
    visible: true,
    altKey: ''
  })

  // Refs
  const searchInputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Get user from storage (matching the pattern from your auth context)
  const user = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"))

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredDeliveries.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    // Get visible headers
    const visibleHeaders = tableHeaders.filter(header => header.visible);
    
    // Create CSV headers
    const csvHeaders = visibleHeaders.map(header => header.label).join(',');
    
    // Create CSV rows
    const csvRows = filteredDeliveries.map(delivery => {
      return visibleHeaders.map(header => {
        const value = delivery[header.id] || "";
        
        // Handle dates
        if ((header.id === "scheduledDate" || header.id === "actualDate") && value) {
          return `"${new Date(value).toLocaleDateString()}"`;
        }
        
        // Escape commas and quotes in values
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',');
    });
    
    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_deliveries_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Data exported successfully", "success");
  };

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Check if user is admin
        setIsAdmin(user?.role === "admin")
        
        // Fetch deliveries data - using configurable endpoint
        const response = await fetch(`${API_URL}${API_ENDPOINTS.getData}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: user?.email })
        })

        if (response.ok) {
          const result = await response.json()
          const processedData = result.data.map((item, index) => ({
            ...item,
            id: item.id || `DEL-${String(index + 1).padStart(3, '0')}`,
            quantity: Number(item.quantity) || 0
          }))
          setDeliveries(processedData)
          setFilteredDeliveries(processedData)
        } else {
          // Fallback to demo data if API fails
          const demoData = [
            {
              id: 'DEL-001',
              orderId: 'ORD-001',
              customer: 'Tech Industries Inc.',
              product: 'Electronic Components',
              quantity: 500,
              deliveryAddress: '123 Tech Street, Silicon Valley, CA',
              scheduledDate: '2025-08-01',
              actualDate: null,
              driver: 'Mike Johnson',
              vehicleNo: 'TRK-001',
              status: 'In Transit',
              trackingNumber: 'TRK123456789',
              priority: 'High',
              _id: 'demo-1'
            },
            {
              id: 'DEL-002',
              orderId: 'ORD-002',
              customer: 'Manufacturing Corp',
              product: 'Steel Sheets',
              quantity: 200,
              deliveryAddress: '456 Industrial Blvd, Detroit, MI',
              scheduledDate: '2025-07-30',
              actualDate: null,
              driver: 'Sarah Wilson',
              vehicleNo: 'TRK-002',
              status: 'Scheduled',
              trackingNumber: 'TRK123456790',
              priority: 'Medium',
              _id: 'demo-2'
            },
            {
              id: 'DEL-003',
              orderId: 'ORD-003',
              customer: 'Auto Parts Ltd',
              product: 'Aluminum Rods',
              quantity: 300,
              deliveryAddress: '789 Auto Lane, Houston, TX',
              scheduledDate: '2025-07-28',
              actualDate: '2025-07-28',
              driver: 'John Davis',
              vehicleNo: 'TRK-003',
              status: 'Delivered',
              trackingNumber: 'TRK123456791',
              priority: 'Low',
              _id: 'demo-3'
            }
          ]
          setDeliveries(demoData)
          setFilteredDeliveries(demoData)
        }

        // Fetch headers configuration
        try {
          const headerResponse = await fetch(
            `${API_URL}${API_ENDPOINTS.headers}?email=${user?.email}`,
            { credentials: 'include' }
          )
          
          if (headerResponse.ok) {
            const headerResult = await headerResponse.json()
            if (headerResult.headers) {
              setTableHeaders(headerResult.headers)
            }
          } else {
            // Fallback to localStorage or default
            const savedHeaders = localStorage.getItem('customerDeliveryHeaders')
            if (savedHeaders) {
              setTableHeaders(JSON.parse(savedHeaders))
            }
          }
        } catch (headerError) {
          console.error("Error fetching table headers:", headerError)
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        showToast("Error fetching data", "error")
      } finally {
        setIsLoading(false)
      }
    }

    if (user?.email) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Save header configuration
  useEffect(() => {
    localStorage.setItem('customerDeliveryHeaders', JSON.stringify(tableHeaders))
  }, [tableHeaders])

  // Filter deliveries based on search
  const filterRow = (row) => {
    if (searchTerm === "") return true;
    
    if (selectedCountry === "All") {
      return tableHeaders.some(header => {
        if (!header.visible) return false;
        const value = row[header.id] || "";
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return value.toString().includes(searchTerm);
        }
      });
    } else {
      const header = tableHeaders.find(h => h.label === selectedCountry);
      if (!header) return true;
      
      const value = row[header.id] || "";
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return value.toString().includes(searchTerm);
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    const filtered = deliveries.filter(filterRow);
    setFilteredDeliveries(filtered);
  };

  // Handle clear
  const handleClear = () => {
    setSearchTerm("");
    setSelectedCountry("All");
    setFilteredDeliveries(deliveries);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, deliveries, tableHeaders, selectedCountry]);

  // Utility functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in transit': return 'bg-yellow-100 text-yellow-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'delayed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // CRUD operations
  const handleAdd = () => {
    setEditingDelivery(null)
    setFormData({
      orderId: '',
      customer: '',
      product: '',
      quantity: '',
      deliveryAddress: '',
      scheduledDate: '',
      actualDate: '',
      driver: '',
      vehicleNo: '',
      trackingNumber: '',
      priority: 'Medium',
      status: 'Scheduled'
    })
    setShowModal(true)
  }

  const handleEdit = (delivery) => {
    setEditingDelivery(delivery)
    setFormData({
      orderId: delivery.orderId || '',
      customer: delivery.customer || '',
      product: delivery.product || '',
      quantity: delivery.quantity || '',
      deliveryAddress: delivery.deliveryAddress || '',
      scheduledDate: delivery.scheduledDate || '',
      actualDate: delivery.actualDate || '',
      driver: delivery.driver || '',
      vehicleNo: delivery.vehicleNo || '',
      trackingNumber: delivery.trackingNumber || '',
      priority: delivery.priority || 'Medium',
      status: delivery.status || 'Scheduled'
    })
    setShowModal(true)
  }

  const handleView = (delivery) => {
    setSelectedDelivery(delivery)
    setShowViewModal(true)
  }

  const handleDelete = (delivery) => {
    setDeliveryToDelete(delivery)
    setShowDeleteDialog(true)
  }

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.orderId.trim() || !formData.customer.trim() || !formData.product.trim()) {
        showToast("Please fill in all required fields", "error")
        return
      }

      const deliveryData = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        user: user?.email
      }

      if (editingDelivery) {
        // Update existing delivery
        const mongoDbId = editingDelivery._id
        
        // Update UI immediately
        const updatedDeliveries = deliveries.map(d =>
          d.id === editingDelivery.id ? { ...d, ...deliveryData, updatedAt: new Date(), updatedBy: user?.email } : d
        )
        setDeliveries(updatedDeliveries)

        // Call backend API
        try {
          const response = await fetch(`${API_URL}${API_ENDPOINTS.update}/${mongoDbId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              data: deliveryData,
              user: user?.email
            })
          })

          if (response.ok) {
            showToast("Delivery updated successfully", "success")
          } else {
            showToast("Warning: Local update only - couldn't save to database", "error")
          }
        } catch (updateError) {
          console.error("Backend update error:", updateError)
          showToast("Warning: Local update only", "error")
        }
      } else {
        // Add new delivery
        try {
          const response = await fetch(`${API_URL}${API_ENDPOINTS.add}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify([deliveryData, { user: user?.email }])
          })

          if (response.ok) {
            const result = await response.json()
            const newDelivery = {
              ...deliveryData,
              id: `DEL-${String(deliveries.length + 1).padStart(3, '0')}`,
              _id: result.data._id,
              createdAt: new Date()
            }
            setDeliveries([...deliveries, newDelivery])
            showToast("Delivery added successfully", "success")
          } else {
            // Fallback to local only
            const newDelivery = {
              ...deliveryData,
              id: `DEL-${String(deliveries.length + 1).padStart(3, '0')}`,
              _id: `local-${Date.now()}`,
              createdAt: new Date()
            }
            setDeliveries([...deliveries, newDelivery])
            showToast("Delivery added locally (not saved to server)", "error")
          }
        } catch (addError) {
          console.error("Error adding delivery:", addError)
          showToast("Error adding delivery", "error")
          return
        }
      }

      setShowModal(false)
      setEditingDelivery(null)
    } catch (error) {
      console.error("Error saving delivery:", error)
      showToast("Error saving delivery", "error")
    }
  }

  const confirmDelete = async () => {
    try {
      const mongoDbId = deliveryToDelete._id

      // Update UI immediately
      const updatedDeliveries = deliveries.filter(d => d._id !== mongoDbId)
      setDeliveries(updatedDeliveries)

      // Call backend API
      try {
        const response = await fetch(`${API_URL}${API_ENDPOINTS.delete}/${mongoDbId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ user: user?.email })
        })

        if (response.ok) {
          showToast("Delivery deleted successfully", "success")
        } else {
          showToast("Warning: Deleted locally only", "error")
        }
      } catch (deleteError) {
        console.error("Backend delete error:", deleteError)
        showToast("Warning: Deleted locally only", "error")
      }

    } catch (error) {
      console.error("Error deleting delivery:", error)
      showToast("Error deleting delivery", "error")
    } finally {
      setShowDeleteDialog(false)
      setDeliveryToDelete(null)
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
      const payload = {
        headers: tempHeaders,
        email: user?.email,
        isGlobal: isAdmin && saveAsGlobal
      }
      
      const response = await fetch(`${API_URL}/api/table-headers/update-customer-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setTableHeaders(tempHeaders)
        setShowHeaderModal(false)
        
        if (payload.isGlobal) {
          localStorage.removeItem('customerDeliveryHeaders')
          showToast("Global table headers updated successfully! All users will see these changes.", "success")
        } else {
          localStorage.setItem('customerDeliveryHeaders', JSON.stringify(tempHeaders))
          showToast("Personal table headers updated successfully!", "success")
        }
      } else {
        showToast("Failed to save header settings", "error")
      }
    } catch (error) {
      console.error("Error saving header changes:", error)
      showToast("Error saving header settings", "error")
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
    setNewHeaderInfo({ id: "", label: "", visible: true, altKey: "" })
  }

  const resetHeadersToDefault = () => {
    setTempHeaders([...DEFAULT_HEADERS])
  }

  const handleViewAllClick = () => {
    // Navigate to appropriate route based on user role
    if (user?.role === "admin") {
      window.location.href = "/admin/tables";
    } else {
      window.location.href = "/client/tables";
    }
  };

  if (isLoading) {
    return (
      <div className="mt-16 p-6 bg-white shadow-md rounded-2xl w-full">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div className="mt-16 p-6 bg-white shadow-md rounded-2xl w-full">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
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
          <h1 className="text-xl font-bold text-gray-900">Customer Delivery Management</h1>
          <p className="text-md text-gray-400">Manage and track customer deliveries</p>
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
                      openHeaderModal();
                      setShowTableOptionsMenu(false);
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
            {filteredDeliveries.map((delivery) => (
              <tr key={delivery.id || delivery._id} className="hover:bg-gray-50">
                {tableHeaders
                  .filter(header => header.visible)
                  .map(header => {
                    const value = delivery[header.id] || "";

                    if (header.id === "status") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
                            {value}
                          </span>
                        </td>
                      );
                    }
                    
                    if (header.id === "priority") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(value)}`}>
                            {value}
                          </span>
                        </td>
                      );
                    }

                    if (header.id === "deliveryAddress") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 max-w-xs">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <div className="truncate" title={value}>
                              {value}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    if (header.id === "scheduledDate" || header.id === "actualDate") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-gray-400" />
                            {value ? new Date(value).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                      );
                    }

                    if (header.id === "trackingNumber") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-900">
                            {value}
                          </div>
                        </td>
                      );
                    }

                    if (header.id === "customer") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{delivery.customer}</div>
                            {delivery.quantity && (
                              <div className="text-sm text-gray-500">Qty: {delivery.quantity}</div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    if (header.id === "driver" && delivery.vehicleNo) {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{delivery.driver}</div>
                            <div className="text-sm text-gray-500">{delivery.vehicleNo}</div>
                          </div>
                        </td>
                      );
                    }
                    
                    return (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {value || "-"}
                      </td>
                    );
                  })}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleView(delivery)}
                      className="text-gray-600 hover:text-gray-800 p-1 border border-gray-300 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(delivery)}
                      className="text-blue-600 hover:text-blue-800 p-1 border border-gray-300 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(delivery)}
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
                {editingDelivery ? 'Edit Delivery' : 'Add New Delivery'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ORD-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Customer Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Complete delivery address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Date
                </label>
                <input
                  type="date"
                  value={formData.actualDate}
                  onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver
                </label>
                <input
                  type="text"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Driver Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TRK-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="TRK123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingDelivery ? "Update" : "Add"}
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
      {showViewModal && selectedDelivery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Delivery Entry Details</h3>
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
                  <span>{selectedDelivery.user || "Unknown"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-24">Created on:</span>
                  <span>
                    {selectedDelivery.createdAt 
                      ? new Date(selectedDelivery.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </span>
                </div>
              </div>
              
              {selectedDelivery.updatedAt && selectedDelivery.updatedBy && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold mb-2">Last Update</h4>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated by:</span>
                    <span>{selectedDelivery.updatedBy}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated on:</span>
                    <span>{new Date(selectedDelivery.updatedAt).toLocaleString()}</span>
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
            <h3 className="text-lg font-bold mb-4">Delete Delivery</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this delivery? This action cannot be undone.
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
                  placeholder="e.g. notes (camelCase)"
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
                  placeholder="e.g. Notes"
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