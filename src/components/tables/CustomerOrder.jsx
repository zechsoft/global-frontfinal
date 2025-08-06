import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Settings, 
  Menu as MenuIcon, 
  ChevronUp, 
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react'

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "customerNumber", label: "Customer Number", visible: true },
  { id: "customer", label: "Customer", visible: true },
  { id: "buyer", label: "Buyer", visible: true },
  { id: "platformNo", label: "Platform No", visible: true },
  { id: "poNo", label: "PO No", visible: true },
  { id: "purchaseDate", label: "Purchase Date", visible: true },
  { id: "orderAmount", label: "Order Amount", visible: true },
  { id: "currency", label: "Currency", visible: true },
  { id: "purchasingDepartment", label: "Purchasing Department", visible: true },
  { id: "purchaser", label: "Purchaser", visible: true },
  { id: "requisitionBusinessGroup", label: "Requisition Business Group", visible: true },
  { id: "deliveryStatus", label: "Delivery Status", visible: true },
  { id: "orderStatus", label: "Order Status", visible: true },
  { id: "acceptanceStatus", label: "Acceptance Status", visible: true },
  { id: "statementStatus", label: "Statement Status", visible: true },
]

// API base URL
const API_BASE_URL = "http://localhost:8000"

// Enhanced API utility with better error handling and authentication
const apiRequest = async (url, options = {}, authToken = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token is provided
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const defaultOptions = {
    credentials: 'include', // This is important for cookie-based auth
    headers,
  };

  try {
    console.log("Making API request to:", url);
    console.log("With token:", authToken ? "Token present" : "No token");
    console.log("Request options:", { ...defaultOptions, ...options });
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      // Handle different error types
      if (response.status === 401) {
        console.error('Authentication failed. Please log in again.');
        throw new Error('Authentication failed. Please log in again.');
      }
      
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.log("Error response data:", errorData);
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
          const errorText = await response.text();
          console.log("Error response text:", errorText);
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          console.warn('Could not parse error response:', parseError);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    console.log("Response data:", responseData);
    return responseData;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

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

// Status badge styling helper
const getStatusBadge = (status) => {
  let colorClass
  switch (status) {
    case "Complete":
    case "Completed":
    case "Delivered":
    case "Accepted":
      colorClass = "bg-green-100 text-green-800"
      break
    case "Pending":
      colorClass = "bg-yellow-100 text-yellow-800"
      break
    case "Cancelled":
    case "Rejected":
      colorClass = "bg-red-100 text-red-800"
      break
    case "In Transit":
    case "Processing":
      colorClass = "bg-blue-100 text-blue-800"
      break
    case "Delayed":
      colorClass = "bg-orange-100 text-orange-800"
      break
    case "New":
      colorClass = "bg-purple-100 text-purple-800"
      break
    default:
      colorClass = "bg-gray-100 text-gray-800"
  }
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  )
}

export default function CustomerOrder() {
  const { user, getAuthToken } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [tableData, setTableData] = useState([])
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS)
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false)
  const [tempHeaders, setTempHeaders] = useState([])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState("")
  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: "",
    label: "",
    visible: true,
    altKey: ""
  })
  const [isAddHeaderModalOpen, setIsAddHeaderModalOpen] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedRowDetails, setSelectedRowDetails] = useState(null)
  const [saveAsGlobal, setSaveAsGlobal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newRow, setNewRow] = useState({
    customerNumber: "",
    customer: "",
    buyer: "",
    platformNo: "",
    poNo: "",
    purchaseDate: "",
    orderAmount: "",
    currency: "",
    purchasingDepartment: "",
    purchaser: "",
    requisitionBusinessGroup: "",
    deliveryStatus: "Pending",
    orderStatus: "Processing",
    acceptanceStatus: "Pending",
    statementStatus: "Pending",
  })
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false)
  const [toast, setToast] = useState(null)

  const searchInputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Export to CSV function
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      showToast("No data to export", "error");
      return;
    }

    // Get visible headers
    const visibleHeaders = tableHeaders.filter(header => header.visible);
    
    // Create CSV headers
    const csvHeaders = visibleHeaders.map(header => header.label).join(',');
    
    // Create CSV rows
    const csvRows = filteredData.map(order => {
      return visibleHeaders.map(header => {
        const value = order[header.id] || "";
        
        // Handle dates
        if (header.id === "purchaseDate" && value) {
          return `"${new Date(value).toLocaleDateString()}"`;
        }
        
        // Handle amounts
        if (header.id === "orderAmount" && value) {
          return Number(value).toFixed(2);
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
    link.setAttribute('download', `customer_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Data exported successfully", "success");
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email) return;
      
      try {
        // Try multiple ways to get the auth token
        let authToken = getAuthToken();
        
        // Fallback: try to get from storage directly
        if (!authToken) {
          authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        }
        
        console.log("Fetching data for user:", user.email);
        console.log("Auth token available:", !!authToken);

        const data = await apiRequest(`${API_BASE_URL}/api/customer/get-data`, {
          method: 'POST',
          body: JSON.stringify({ email: user.email })
        }, authToken);

        if (data && Array.isArray(data)) {
          const dataWithId = data.map(item => ({
            ...item,
            id: item._id
          }))
          setTableData(dataWithId)
          setFilteredData(dataWithId)
        } else {
          console.error("Invalid data format received from server")
          showToast("Received invalid data format from server", "error")
        }
        
        // Fetch table headers
        try {
          const headerData = await apiRequest(
            `${API_BASE_URL}/api/table-headers/get-customer-order?email=${user.email}`,
            { method: 'GET' },
            authToken
          );
          
          if (headerData.headers) {
            setTableHeaders(headerData.headers);
            console.log(`Headers loaded from ${headerData.source || 'server'}`);
            
            // Only save to localStorage if they're personal headers
            if (headerData.source !== 'global') {
              localStorage.setItem('customerOrderTableHeaders', JSON.stringify(headerData.headers));
            } else {
              // If global headers, remove any personal localStorage cache
              localStorage.removeItem('customerOrderTableHeaders');
            }
          }
        } catch (headerError) {
          console.error("Error fetching table headers:", headerError);
          // Try to load from localStorage as fallback only if not admin
          if (!isAdmin) {
            const savedHeaders = localStorage.getItem('customerOrderTableHeaders');
            if (savedHeaders) {
              try {
                setTableHeaders(JSON.parse(savedHeaders));
              } catch (e) {
                console.error("Error loading saved headers:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        
        // If it's an auth error, suggest re-login
        if (error.message.includes('Authentication failed')) {
          showToast("Session expired. Please log in again.", "error");
        } else {
          showToast(error.message || "Error fetching data from server", "error");
        }
      }
    }

    fetchData()
  }, [user, getAuthToken, isAdmin])

  // Save headers to localStorage whenever they change
  useEffect(() => {
    // Only save to localStorage if user is not admin or if these are personal headers
    if (!isAdmin || !saveAsGlobal) {
      localStorage.setItem('customerOrderTableHeaders', JSON.stringify(tableHeaders));
    }
  }, [tableHeaders, isAdmin, saveAsGlobal]);

  const handleViewDetails = (row) => {
    setSelectedRowDetails(row)
    setIsViewModalOpen(true)
  }

  const handleAddRow = () => {
    if (!user) {
      showToast("Please login to add data", "error")
      return
    }
    
    setIsModalOpen(true)
    setSelectedRowId(null)
    setNewRow({
      customerNumber: "",
      customer: "",
      buyer: "",
      platformNo: "",
      poNo: "",
      purchaseDate: "",
      orderAmount: "",
      currency: "",
      purchasingDepartment: "",
      purchaser: "",
      requisitionBusinessGroup: "",
      deliveryStatus: "Pending",
      orderStatus: "Processing",
      acceptanceStatus: "Pending",
      statementStatus: "Pending",
    })
  }

  const handleEditRow = (rowId) => {
    if (!user) {
      showToast("Please login to edit data", "error")
      return
    }
    
    const selectedRow = tableData.find((row) => row.id === rowId || row._id === rowId)
    if (selectedRow) {
      setNewRow({
        ...selectedRow,
        deliveryStatus: selectedRow.deliveryStatus || "Pending",
        orderStatus: selectedRow.orderStatus || "Processing",
        acceptanceStatus: selectedRow.acceptanceStatus || "Pending",
        statementStatus: selectedRow.statementStatus || "Pending"
      })
      setSelectedRowId(rowId)
      setIsModalOpen(true)
    }
  }

  const handleDeleteRow = (rowId) => {
    setRowToDelete(rowId)
    setIsDeleteDialogOpen(true)
  }

  const handleSaveRow = async () => {
    try {
      if (!user || !user.email) {
        throw new Error("User authentication required")
      }

      // Try multiple ways to get the auth token
      let authToken = getAuthToken();
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }

      const validatedNewRow = {
        ...newRow,
        deliveryStatus: newRow.deliveryStatus || "Pending",
        orderStatus: newRow.orderStatus || "Processing",
        acceptanceStatus: newRow.acceptanceStatus || "Pending",
        statementStatus: newRow.statementStatus || "Pending"
      }

      if (selectedRowId) {
        // Update existing row
        const updatedRow = { ...validatedNewRow, id: selectedRowId }
        
        await apiRequest(`${API_BASE_URL}/api/customer/update-data`, {
          method: 'POST',
          body: JSON.stringify({ data: updatedRow, email: user.email })
        }, authToken)
        
        showToast("Row updated successfully", "success")
      } else {
        // Add new row
        const dataToSend = [
          {
            customerNumber: validatedNewRow.customerNumber,
            customer: validatedNewRow.customer,
            buyer: validatedNewRow.buyer,
            platformNo: validatedNewRow.platformNo,
            poNo: validatedNewRow.poNo,
            purchaseDate: validatedNewRow.purchaseDate,
            orderAmount: validatedNewRow.orderAmount,
            currency: validatedNewRow.currency,
            purchasingDepartment: validatedNewRow.purchasingDepartment,
            purchaser: validatedNewRow.purchaser,
            requisitionBusinessGroup: validatedNewRow.requisitionBusinessGroup,
            deliveryStatus: validatedNewRow.deliveryStatus,
            orderStatus: validatedNewRow.orderStatus,
            acceptanceStatus: validatedNewRow.acceptanceStatus,
            statementStatus: validatedNewRow.statementStatus,
          },
          { user: user.email }
        ]
        
        await apiRequest(`${API_BASE_URL}/api/customer/add-data`, {
          method: 'POST',
          body: JSON.stringify(dataToSend)
        }, authToken)
        
        showToast("Row added successfully", "success")
      }

      // Refresh data after operation
      const data = await apiRequest(`${API_BASE_URL}/api/customer/get-data`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      }, authToken)
      
      const dataWithId = data.map(item => ({
        ...item,
        id: item._id
      }))
      
      setTableData(dataWithId)
      setFilteredData(dataWithId)

    } catch(err) {
      console.error("Error saving data:", err)
      showToast(err.message || "Failed to save data", "error")
    } finally {
      setIsModalOpen(false)
      setNewRow({
        customerNumber: "",
        customer: "",
        buyer: "",
        platformNo: "",
        poNo: "",
        purchaseDate: "",
        orderAmount: "",
        currency: "",
        purchasingDepartment: "",
        purchaser: "",
        requisitionBusinessGroup: "",
        deliveryStatus: "Pending",
        orderStatus: "Processing",
        acceptanceStatus: "Pending",
        statementStatus: "Pending",
      })
      setSelectedRowId(null)
    }
  }

  const confirmDelete = async () => {
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken();
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      
      const rowToDeleteItem = tableData.find(row => row.id === rowToDelete || row._id === rowToDelete)
      
      if (!rowToDeleteItem) {
        throw new Error("Row not found")
      }
      
      const mongoId = rowToDeleteItem._id || rowToDeleteItem.id
      
      await apiRequest(`${API_BASE_URL}/api/customer/delete-data`, {
        method: 'POST',
        body: JSON.stringify({ id: mongoId, email: user.email })
      }, authToken)
      
      // Refresh data after delete
      const data = await apiRequest(`${API_BASE_URL}/api/customer/get-data`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      }, authToken)
      
      if (data && Array.isArray(data)) {
        const dataWithId = data.map(item => ({
          ...item,
          id: item._id
        }))
        setTableData(dataWithId)
        setFilteredData(dataWithId)
      }
      
      showToast("Row deleted successfully", "success")
    } catch (error) {
      console.error("Error deleting row:", error)
      showToast(error.message || "Failed to delete row", "error")
    } finally {
      setIsDeleteDialogOpen(false)
      setRowToDelete(null)
    }
  }

  const filterRow = (row) => {
    if (searchTerm === "") return true
    
    if (selectedCountry === "All") {
      return tableHeaders.some(header => {
        if (!header.visible) return false
        const value = row[header.id] || ""
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase())
        } else {
          return value.toString().includes(searchTerm)
        }
      })
    } else {
      const header = tableHeaders.find(h => h.label === selectedCountry)
      if (!header) return true
      
      const value = row[header.id] || ""
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase())
      } else {
        return value.toString().includes(searchTerm)
      }
    }
  }

  const handleSearch = () => {
    const filtered = tableData.filter(filterRow)
    setFilteredData(filtered)
  }

  const handleClear = () => {
    setSearchTerm("")
    setSelectedCountry("All")
    setFilteredData(tableData)
  }

  useEffect(() => {
    handleSearch();
  }, [searchTerm, tableData, tableHeaders, selectedCountry]);

  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders])
    setIsHeaderModalOpen(true)
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
    setIsSaving(true);
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken();
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      
      const payload = {
        headers: tempHeaders,
        email: user.email,
        isGlobal: isAdmin && saveAsGlobal
      };
      
      console.log("Making request with payload:", payload);
      console.log("Auth token present:", !!authToken);
      
      const response = await apiRequest(`${API_BASE_URL}/api/table-headers/update-customer-order`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }, authToken);
      
      setTableHeaders(tempHeaders);
      setIsHeaderModalOpen(false);
      
      // Handle localStorage based on whether it's global or personal
      if (payload.isGlobal) {
        // If saving as global, remove personal localStorage entry
        localStorage.removeItem('customerOrderTableHeaders');
        showToast("Global table headers updated successfully! All users will see these changes.", "success");
      } else {
        // Save personal headers to localStorage
        localStorage.setItem('customerOrderTableHeaders', JSON.stringify(tempHeaders));
        showToast("Personal table headers updated successfully!", "success");
      }
      
    } catch (error) {
      console.error("Error saving header changes:", error);
      showToast(error.message || "Error saving header changes", "error");
    } finally {
      setIsSaving(false);
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
    setIsAddHeaderModalOpen(true)
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
    setIsAddHeaderModalOpen(false)
    
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

  if (user?.role !== 'admin' && user?.role !== 'client') {
    return (
      <div className="mt-16 p-6 bg-white shadow-md rounded-2xl w-full">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Access Denied</div>
          <p className="text-gray-400 mt-2">You don't have permission to view customer orders.</p>
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
          <h1 className="text-xl font-bold text-gray-900">Customer Orders</h1>
          <p className="text-md text-gray-400">Manage Customer Orders</p>
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
            onClick={handleAddRow}
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
            {filteredData.map((row) => (
              <tr key={row._id || row.id} className="hover:bg-gray-50">
                {tableHeaders
                  .filter(header => header.visible)
                  .map(header => {
                    const value = row[header.id] || ""

                    if (header.id === "deliveryStatus" || header.id === "orderStatus" || 
                        header.id === "acceptanceStatus" || header.id === "statementStatus") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(value)}
                        </td>
                      )
                    }
                    
                    if (header.id === "purchaseDate" && value) {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(value).toLocaleDateString()}
                        </td>
                      )
                    }
                    
                    if (header.id === "orderAmount" && value) {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {Number(value).toLocaleString(undefined, {
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2
                          })}
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
                      onClick={() => handleViewDetails(row)}
                      className="text-gray-600 hover:text-gray-800 p-1 border border-gray-300 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditRow(row._id || row.id)}
                      className="text-blue-600 hover:text-blue-800 p-1 border border-gray-300 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRow(row._id || row.id)}
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
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {selectedRowId ? 'Edit Customer Order' : 'Add New Customer Order'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  {header.id === "purchaseDate" ? (
                    <input
                      type="date"
                      value={newRow[header.id] || ""}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : header.id === "orderAmount" ? (
                    <input
                      type="number"
                      step="0.01"
                      value={newRow[header.id] || ""}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : header.id === "deliveryStatus" ? (
                    <select
                      value={newRow[header.id] || "Pending"}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Complete">Complete</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  ) : header.id === "orderStatus" ? (
                    <select
                      value={newRow[header.id] || "Processing"}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Fulfilled">Fulfilled</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="New">New</option>
                      <option value="Completed">Completed</option>
                    </select>
                  ) : header.id === "acceptanceStatus" ? (
                    <select
                      value={newRow[header.id] || "Pending"}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newRow[header.id] || ""}
                      onChange={(e) => setNewRow({ ...newRow, [header.id]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveRow}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {selectedRowId ? "Update" : "Add"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedRowDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Customer Order Details</h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
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
                  <span>{selectedRowDetails.user || "Unknown"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-24">Created on:</span>
                  <span>
                    {selectedRowDetails.createdAt 
                      ? new Date(selectedRowDetails.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </span>
                </div>
              </div>
              
              {selectedRowDetails.updatedAt && selectedRowDetails.updatedBy && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold mb-2">Last Update</h4>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated by:</span>
                    <span>{selectedRowDetails.updatedBy}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated on:</span>
                    <span>{new Date(selectedRowDetails.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Delete Customer Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this customer order? This action cannot be undone.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
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
      {isHeaderModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Manage Table Columns</h3>
              <button
                onClick={() => setIsHeaderModalOpen(false)}
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
                  onClick={() => setIsHeaderModalOpen(false)}
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
      {isAddHeaderModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add New Column</h3>
              <button
                onClick={() => setIsAddHeaderModalOpen(false)}
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
                onClick={() => setIsAddHeaderModalOpen(false)}
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