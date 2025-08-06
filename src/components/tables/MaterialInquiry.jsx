import React, { useState, useEffect, useRef } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Settings, ChevronUp, ChevronDown, Menu as MenuIcon, ArrowUp, ArrowDown, Download, X } from 'lucide-react'

// Get user data from localStorage or sessionStorage - replace with actual user context
const getUser = () => {
  return JSON.parse(localStorage.getItem("user")) || 
         JSON.parse(sessionStorage.getItem("user")) || 
         { email: "user@example.com", role: "admin" }
}

// Base URL for the backend API
const API_BASE_URL = "http://localhost:8000"

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "id", label: "#", visible: true },
  { id: "supplierMaterial", label: "Supplier Material", visible: true, altKey: "Suppliermaterial" },
  { id: "supplementOrderNumber", label: "Supplement Order Number", visible: true, altKey: "OrderNumber" },
  { id: "status", label: "Status", visible: true },
  { id: "explanation", label: "Explanation", visible: true, altKey: "explaination" },
  { id: "createTime", label: "Create Time", visible: true, altKey: "createdTime" },
  { id: "updateTime", label: "Update Time", visible: true }
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

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-red-100 text-red-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Processing': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default function MaterialInquiry() {
  const user = getUser() // Get actual user data
  const [inquiries, setInquiries] = useState([])
  const [filteredInquiries, setFilteredInquiries] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchColumn, setSearchColumn] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false)
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false)
  
  // Form states
  const [editingInquiry, setEditingInquiry] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewDetails, setViewDetails] = useState(null)
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS)
  const [tempHeaders, setTempHeaders] = useState([])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState("")
  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: "",
    label: "",
    visible: true,
    altKey: ""
  })
  const [saveAsGlobal, setSaveAsGlobal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Toast state
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    supplierMaterial: '',
    supplementOrderNumber: '',
    status: '',
    explanation: '',
    createTime: '',
    updateTime: ''
  })

  const searchInputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const isAdmin = user?.role === "admin"

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredInquiries.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    // Get visible headers
    const visibleHeaders = tableHeaders.filter(header => header.visible);
    
    // Create CSV headers
    const csvHeaders = visibleHeaders.map(header => header.label).join(',');
    
    // Create CSV rows
    const csvRows = filteredInquiries.map(inquiry => {
      return visibleHeaders.map(header => {
        const value = getFieldValue(inquiry, header);
        
        // Handle dates
        if ((header.id === "createTime" || header.id === "updateTime") && value !== '-') {
          return `"${formatDate(value)}"`;
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
    link.setAttribute('download', `material_inquiry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Data exported successfully", "success");
  };

  // Fetch data from backend
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/material-inquiry/get-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: user.email })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      setInquiries(result.data || [])
      setFilteredInquiries(result.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Error fetching data from server', 'error')
      // Set empty arrays on error
      setInquiries([])
      setFilteredInquiries([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch table headers from backend
  const fetchTableHeaders = async () => {
    try {
      if (!user?.email) {
        console.warn("No user email found, using default headers")
        setTableHeaders(DEFAULT_HEADERS)
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/api/table-headers/get-material-inquiry?email=${user.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.headers && result.headers.length > 0) {
          console.log('Loaded table headers from backend:', result.headers)
          setTableHeaders(result.headers)
          
          // Only save to localStorage if they're personal headers
          if (result.source !== 'global') {
            localStorage.setItem('materialInquiryTableHeaders', JSON.stringify(result.headers));
          } else {
            // If global headers, remove any personal localStorage cache
            localStorage.removeItem('materialInquiryTableHeaders');
          }
        } else {
          console.log('No custom headers found, using defaults')
          setTableHeaders(DEFAULT_HEADERS)
        }
      } else {
        console.log('Failed to fetch headers, using defaults')
        // Try to load from localStorage as fallback only if not admin
        if (!isAdmin) {
          const savedHeaders = localStorage.getItem('materialInquiryTableHeaders');
          if (savedHeaders) {
            try {
              setTableHeaders(JSON.parse(savedHeaders));
            } catch (e) {
              console.error("Error loading saved headers:", e);
              setTableHeaders(DEFAULT_HEADERS);
            }
          }
        } else {
          setTableHeaders(DEFAULT_HEADERS);
        }
      }
    } catch (error) {
      console.error('Error fetching table headers:', error)
      setTableHeaders(DEFAULT_HEADERS)
    }
  }

  useEffect(() => {
    fetchData()
    fetchTableHeaders()
  }, [])

  // Save headers to localStorage whenever they change (for non-admin users)
  useEffect(() => {
    if (!isAdmin || !saveAsGlobal) {
      localStorage.setItem('materialInquiryTableHeaders', JSON.stringify(tableHeaders));
    }
  }, [tableHeaders, isAdmin, saveAsGlobal]);

  // Search functionality
  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredInquiries(inquiries)
      return
    }
    
    const lowercasedSearchTerm = searchTerm.toLowerCase()
    
    const filtered = inquiries.filter((inquiry) => {
      if (searchColumn === 'All') {
        return tableHeaders.some(header => {
          if (!header.visible) return false;
          const value = getFieldValue(inquiry, header);
          
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercasedSearchTerm);
          } else {
            return value.toString().includes(searchTerm);
          }
        });
      } else {
        const header = tableHeaders.find(h => h.label === searchColumn);
        if (!header) return true;
        
        const value = getFieldValue(inquiry, header);
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercasedSearchTerm);
        } else {
          return value.toString().includes(searchTerm);
        }
      }
    })
    
    setFilteredInquiries(filtered)
  }

  const handleClear = () => {
    setSearchTerm('')
    setSearchColumn('All')
    setFilteredInquiries(inquiries)
  }

  useEffect(() => {
    handleSearch();
  }, [searchTerm, inquiries, tableHeaders, searchColumn]);

  // CRUD operations
  const handleAdd = () => {
    setEditingInquiry(null)
    setFormData({
      supplierMaterial: '',
      supplementOrderNumber: '',
      status: '',
      explanation: '',
      createTime: '',
      updateTime: ''
    })
    setShowModal(true)
  }

  const handleEdit = (inquiry) => {
    setEditingInquiry(inquiry)
    setFormData({
      supplierMaterial: inquiry.Suppliermaterial || inquiry.supplierMaterial || '',
      supplementOrderNumber: inquiry.OrderNumber || inquiry.supplementOrderNumber || '',
      status: inquiry.status || '',
      explanation: inquiry.explaination || inquiry.explanation || '',
      createTime: inquiry.createdTime || inquiry.createTime || '',
      updateTime: inquiry.updateTime || ''
    })
    setShowModal(true)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setLoading(true)
    try {
      // Find the row to delete
      const rowToDelete = inquiries.find(inquiry => 
        (inquiry._id || inquiry.id) === deleteId
      )
      
      if (!rowToDelete) {
        throw new Error("Inquiry not found")
      }
      
      // Use MongoDB _id if available, otherwise use regular id
      const idToDelete = rowToDelete._id || deleteId
      
      const response = await fetch(`${API_BASE_URL}/api/material-inquiry/delete-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          id: idToDelete, 
          email: user.email 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete inquiry')
      }
      
      // Refresh data from backend after successful deletion
      await fetchData()
      showToast('Inquiry deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      showToast(error.message || 'Error deleting inquiry', 'error')
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setDeleteId(null)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const currentDateTime = new Date().toISOString()
      
      // Find original row if editing
      let originalRow = null
      if (editingInquiry) {
        originalRow = inquiries.find(inquiry => 
          (inquiry._id || inquiry.id) === (editingInquiry._id || editingInquiry.id)
        )
        
        if (!originalRow) {
          throw new Error("Inquiry not found for update")
        }
      }
      
      // Create payload for backend
      const payload = {
        ...(originalRow && { id: originalRow._id || originalRow.id }),
        supplierMaterial: formData.supplierMaterial,
        supplementOrderNumber: formData.supplementOrderNumber,
        status: formData.status,
        explanation: formData.explanation,
        createTime: editingInquiry ? undefined : currentDateTime, // Only for new entries
        updateTime: currentDateTime,
        updatedBy: user.email
      }
      
      const response = await fetch(`${API_BASE_URL}/api/material-inquiry/add-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify([payload, { user: user.email }])
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save inquiry')
      }
      
      // Refresh data from backend after successful save
      await fetchData()
      showToast(editingInquiry ? 'Inquiry updated successfully' : 'Inquiry added successfully', 'success')
    } catch (error) {
      console.error('Error saving inquiry:', error)
      showToast(error.message || 'Error saving inquiry', 'error')
    } finally {
      setLoading(false)
      setShowModal(false)
      setEditingInquiry(null)
    }
  }

  const handleView = (inquiry) => {
    setViewDetails(inquiry)
    setShowViewModal(true)
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
      if (!user?.email) {
        showToast("User email not available", "error")
        return
      }
      
      const payload = {
        headers: tempHeaders,
        email: user.email,
        isGlobal: isAdmin && saveAsGlobal
      };
      
      const response = await fetch(`${API_BASE_URL}/api/table-headers/update-material-inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save header changes')
      }
      
      const result = await response.json()
      console.log('Headers saved successfully:', result)
      
      setTableHeaders(tempHeaders)
      setShowHeaderModal(false)
      
      // Handle localStorage based on whether it's global or personal
      if (payload.isGlobal) {
        // If saving as global, remove personal localStorage entry
        localStorage.removeItem('materialInquiryTableHeaders');
        showToast("Global table headers updated successfully! All users will see these changes.", "success");
      } else {
        // Save personal headers to localStorage
        localStorage.setItem('materialInquiryTableHeaders', JSON.stringify(tempHeaders));
        showToast("Personal table headers updated successfully!", "success");
      }
    } catch (error) {
      console.error('Error saving header changes:', error)
      showToast(error.message || 'Error saving header changes', 'error')
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
      showToast('Header ID and Label are required', 'error')
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
      window.location.href = "/admin/tables";
    } else {
      // navigate to client tables route
      window.location.href = "/client/tables";
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getFieldValue = (row, header) => {
    if (header.altKey) {
      return row[header.id] || row[header.altKey] || '-'
    }
    return row[header.id] || '-'
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
          <h1 className="text-xl font-bold text-gray-900">Material Inquiry</h1>
          <p className="text-md text-gray-400">Manage Material Inquiry</p>
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
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
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
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : (
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
              {filteredInquiries.map((inquiry) => (
                <tr key={inquiry._id || inquiry.id} className="hover:bg-gray-50">
                  {tableHeaders
                    .filter(header => header.visible)
                    .map(header => {
                      const value = getFieldValue(inquiry, header);

                      if (header.id === "status") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} />
                          </td>
                        );
                      }
                      
                      if (header.id === "createTime" || header.id === "updateTime") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(value)}
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
                        onClick={() => handleView(inquiry)}
                        className="text-gray-600 hover:text-gray-800 p-1 border border-gray-300 rounded"
                        title="View Details"
                        disabled={loading}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(inquiry)}
                        className="text-blue-600 hover:text-blue-800 p-1 border border-gray-300 rounded"
                        title="Edit"
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inquiry._id || inquiry.id)}
                        className="text-red-600 hover:text-red-800 p-1 border border-gray-300 rounded"
                        title="Delete"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Show "No data found" message when there are no results */}
      {!loading && filteredInquiries.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">No data found</p>
        </div>
      )}

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
                {editingInquiry ? 'Edit Inquiry' : 'Add New Inquiry'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Material
                </label>
                <input
                  type="text"
                  value={formData.supplierMaterial}
                  onChange={(e) => setFormData({...formData, supplierMaterial: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplement Order Number
                </label>
                <input
                  type="text"
                  value={formData.supplementOrderNumber}
                  onChange={(e) => setFormData({...formData, supplementOrderNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingInquiry ? 'Update' : 'Add')}
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
      {showViewModal && viewDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Material Inquiry Details</h3>
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
                  <span>{viewDetails.user || "Unknown"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-24">Created on:</span>
                  <span>
                    {viewDetails.createdTime || viewDetails.createTime
                      ? formatDate(viewDetails.createdTime || viewDetails.createTime)
                      : "Unknown date"}
                  </span>
                </div>
              </div>
              
              {viewDetails.updateTime && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold mb-2">Last Update</h4>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated by:</span>
                    <span>{viewDetails.updatedBy || "Unknown"}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated on:</span>
                    <span>{formatDate(viewDetails.updateTime)}</span>
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-bold mb-2">Material Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <span className="font-semibold w-32">Supplier Material:</span>
                    <span>{viewDetails.Suppliermaterial || viewDetails.supplierMaterial || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Order Number:</span>
                    <span>{viewDetails.OrderNumber || viewDetails.supplementOrderNumber || '-'}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Status:</span>
                    <StatusBadge status={viewDetails.status} />
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-32">Explanation:</span>
                    <span>{viewDetails.explaination || viewDetails.explanation || '-'}</span>
                  </div>
                </div>
              </div>
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
            <h3 className="text-lg font-bold mb-4">Delete Inquiry</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this inquiry? This action cannot be undone.
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
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
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
                  type="text"
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
                  type="text"
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
                  type="text"
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