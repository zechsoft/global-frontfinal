import React, { useState, useRef, useEffect } from "react";
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
} from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

// Updated API base URL to the deployed Render URL
const API_BASE_URL = "https://global-backfinal.onrender.com";

// Default table headers configuration
const DEFAULT_HEADERS = [
  { id: "supplierNumber", label: "Supplier Number", visible: true, altKey: "customerNumber" },
  { id: "supplier", label: "Supplier", visible: true, altKey: "Customer" },
  { id: "buyer", label: "Buyer", visible: true, altKey: null },
  { id: "secondOrderClassification", label: "Second-order Classification", visible: true, altKey: "SecondOrderClassification" },
  { id: "status", label: "Status", visible: true, altKey: "Status" },
  { id: "documentStatus", label: "Document Status", visible: true, altKey: "DocumentStatus" },
  { id: "abnormalInfo", label: "Abnormal Info", visible: true, altKey: "AbnormalInfo" },
  { id: "invitee", label: "Invitee", visible: true, altKey: "Invite" },
  { id: "reAuthPerson", label: "Re-auth Person", visible: true, altKey: "ReAuthPerson" },
  { id: "contactInfo", label: "Contact Info", visible: true, altKey: "ContactInfo" },
  { id: "invitationDate", label: "Invitation Date", visible: true, altKey: "InvitationDate" },
];

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

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

// Document status badge component
const DocumentStatusBadge = ({ status }) => {
  const getDocumentStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-800";
      case "Incomplete":
        return "bg-orange-100 text-orange-800";
      case "Pending Review":
        return "bg-blue-100 text-blue-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDocumentStatusColor(status)}`}>
      {status}
    </span>
  );
};

export default function SupplierInfo() {
  const { user, getAuthToken } = useAuth(); // Get user and token function from auth context
  const [suppliers, setSuppliers] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false);
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false);
  
  // Form states
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [tempHeaders, setTempHeaders] = useState([]);
  const [editingHeader, setEditingHeader] = useState(null);
  const [newHeaderName, setNewHeaderName] = useState("");
  const [saveAsGlobal, setSaveAsGlobal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  const [newSupplier, setNewSupplier] = useState({
    supplierNumber: "",
    supplier: "",
    buyer: "",
    secondOrderClassification: "",
    status: "",
    documentStatus: "",
    abnormalInfo: "",
    invitee: "",
    reAuthPerson: "",
    contactInfo: "",
    invitationDate: "",
  });

  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: "",
    label: "",
    visible: true,
    altKey: ""
  });

  const searchInputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const isAdmin = user?.role === "admin";

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
    const csvRows = filteredData.map(supplier => {
      return visibleHeaders.map(header => {
        const value = header.altKey 
          ? (supplier[header.id] || supplier[header.altKey] || "") 
          : (supplier[header.id] || "");
        
        // Handle dates
        if (header.id === "invitationDate" && value) {
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
    link.setAttribute('download', `supplier_info_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Data exported successfully", "success");
  };

// 1. Update the useEffect for fetching data (around line 120-180)
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

      const data = await apiRequest(`${API_BASE_URL}/api/suppliers/get-data`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      }, authToken);

      setSuppliers(data.data || []);
      setFilteredData(data.data || []);
      
      // Fetch table headers - FIXED: Use correct endpoint
      try {
        const headerData = await apiRequest(
          `${API_BASE_URL}/api/table-headers/get?email=${user.email}`,
          { method: 'GET' },
          authToken
        );
        
        if (headerData.headers) {
          setTableHeaders(headerData.headers);
        }
      } catch (headerError) {
        console.error("Error fetching table headers:", headerError);
        // Try to load from localStorage as fallback - FIXED: Use consistent key
        const savedHeaders = localStorage.getItem('supplierInfoTableHeaders');
        if (savedHeaders) {
          try {
            setTableHeaders(JSON.parse(savedHeaders));
          } catch (e) {
            console.error("Error loading saved headers:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // If it's an auth error, suggest re-login
      if (error.message.includes('Authentication failed')) {
        showToast("Session expired. Please log in again.", "error");
      } else {
        showToast(error.message || "Error fetching data from server", "error");
      }
    }
  };

  fetchData();
}, [user, getAuthToken]);

  // Save headers to localStorage whenever they change
useEffect(() => {
  localStorage.setItem('supplierInfoTableHeaders', JSON.stringify(tableHeaders));
}, [tableHeaders]);
  // Filter function
  const filterRow = (row) => {
    if (searchTerm === "") return true;
    
    if (selectedCountry === "All") {
      return tableHeaders.some(header => {
        if (!header.visible) return false;
        const value = header.altKey 
          ? (row[header.id] || row[header.altKey] || "") 
          : (row[header.id] || "");
        
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
          return value.toString().includes(searchTerm);
        }
      });
    } else {
      const header = tableHeaders.find(h => h.label === selectedCountry);
      if (!header) return true;
      
      const value = header.altKey ? (row[header.id] || row[header.altKey] || "") : (row[header.id] || "");
      
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      } else {
        return value.toString().includes(searchTerm);
      }
    }
  };

  // Handle search
  const handleSearch = () => {
    const filtered = suppliers.filter(filterRow);
    setFilteredData(filtered);
  };

  // Handle clear
  const handleClear = () => {
    setSearchTerm("");
    setSelectedCountry("All");
    setFilteredData(suppliers);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, suppliers, tableHeaders, selectedCountry]);

  // Handle view details
  const handleViewDetails = (supplier) => {
    setSelectedSupplierDetails(supplier);
    setShowViewModal(true);
  };

  // Handle add supplier
  const handleAdd = () => {
    setEditingSupplier(null);
    setNewSupplier({
      supplierNumber: "",
      supplier: "",
      buyer: "",
      secondOrderClassification: "",
      status: "",
      documentStatus: "",
      abnormalInfo: "",
      invitee: "",
      reAuthPerson: "",
      contactInfo: "",
      invitationDate: "",
    });
    setShowModal(true);
  };

  // Handle edit supplier
  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      supplierNumber: supplier.supplierNumber || supplier.customerNumber || "",
      supplier: supplier.supplier || supplier.Customer || "",
      buyer: supplier.buyer || "",
      secondOrderClassification: supplier.secondOrderClassification || supplier.SecondOrderClassification || "",
      status: supplier.status || supplier.Status || "",
      documentStatus: supplier.documentStatus || supplier.DocumentStatus || "",
      abnormalInfo: supplier.abnormalInfo || supplier.AbnormalInfo || "",
      invitee: supplier.invitee || supplier.Invite || "",
      reAuthPerson: supplier.reAuthPerson || supplier.ReAuthPerson || "",
      contactInfo: supplier.contactInfo || supplier.ContactInfo || "",
      invitationDate: supplier.invitationDate || supplier.InvitationDate || "",
    });
    setShowModal(true);
  };

  // Handle delete supplier
  const handleDelete = (id) => {
    setRowToDelete(id);
    setShowDeleteDialog(true);
  };
  useEffect(() => {
  // Only save to localStorage if user is not admin or if these are personal headers
  // This prevents overriding global header behavior
  if (!isAdmin || !saveAsGlobal) {
    localStorage.setItem('supplierInfoTableHeaders', JSON.stringify(tableHeaders));
  }
}, [tableHeaders, isAdmin, saveAsGlobal]);

  const confirmDelete = async () => {
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken();
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      
      const supplierToDelete = suppliers.find(row => row.id === rowToDelete);
      
      if (!supplierToDelete) {
        throw new Error("Supplier not found");
      }
      
      let mongoId = supplierToDelete._id || supplierToDelete.id;
      
      if (!mongoId) {
        throw new Error("Could not determine supplier database ID");
      }
      
      await apiRequest(`${API_BASE_URL}/api/suppliers/${mongoId}`, {
        method: 'DELETE'
      }, authToken);
      
      const updatedSuppliers = suppliers.filter(s => s.id !== rowToDelete);
      setSuppliers(updatedSuppliers);
      setFilteredData(updatedSuppliers.filter(filterRow));
      
      showToast("Supplier deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showToast(error.message || "Error deleting supplier", "error");
    } finally {
      setShowDeleteDialog(false);
      setRowToDelete(null);
    }
  };

  // Handle save supplier
  const handleSave = async () => {
    try {
      // Try multiple ways to get the auth token
      let authToken = getAuthToken();
      
      // Fallback: try to get from storage directly
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      
      if (editingSupplier) {
        // Update existing supplier
        const rowToUpdate = suppliers.find(row => row._id === editingSupplier._id || row.id === editingSupplier.id);
        
        if (!rowToUpdate) {
          throw new Error("Could not find the row to update");
        }
        
        const mongoId = rowToUpdate._id || rowToUpdate.id;
        
        const updatedRowData = { 
          ...rowToUpdate,
          ...newSupplier,
          Customer: newSupplier.supplier,
          customerNumber: newSupplier.supplierNumber,
          SecondOrderClassification: newSupplier.secondOrderClassification,
          Status: newSupplier.status,
          DocumentStatus: newSupplier.documentStatus,
          AbnormalInfo: newSupplier.abnormalInfo,
          Invite: newSupplier.invitee,
          ReAuthPerson: newSupplier.reAuthPerson,
          ContactInfo: newSupplier.contactInfo,
          InvitationDate: newSupplier.invitationDate,
          updatedAt: new Date(),
          updatedBy: user.email
        };
        
        const updated = suppliers.map(s => 
          s.id === editingSupplier.id ? updatedRowData : s
        );
        
        setSuppliers(updated);
        setFilteredData(updated.filter(filterRow));
        
        // Send update to server
        await apiRequest(`${API_BASE_URL}/api/suppliers/update`, {
          method: 'POST',
          body: JSON.stringify([
            {
              id: mongoId,
              ...newSupplier,
            },
            {"user": user.email}
          ])
        }, authToken);

        showToast("Supplier updated successfully", "success");
      } else {
        // Add new supplier
        const newId = suppliers.length > 0 ? Math.max(...suppliers.map(s => parseInt(s.id) || 0)) + 1 : 1;
        
        const newSupplierObj = {
          ...newSupplier,
          id: newId,
          _id: `temp-${newId}`,
          Customer: newSupplier.supplier,
          customerNumber: newSupplier.supplierNumber,
          SecondOrderClassification: newSupplier.secondOrderClassification,
          Status: newSupplier.status,
          DocumentStatus: newSupplier.documentStatus,
          AbnormalInfo: newSupplier.abnormalInfo,
          Invite: newSupplier.invitee,
          ReAuthPerson: newSupplier.reAuthPerson,
          ContactInfo: newSupplier.contactInfo,
          InvitationDate: newSupplier.invitationDate,
          createdAt: new Date(),
          user: user.email
        };
        
        const newSuppliers = [...suppliers, newSupplierObj];
        setSuppliers(newSuppliers);
        setFilteredData(newSuppliers.filter(filterRow));
        
        // Send to server
        await apiRequest(`${API_BASE_URL}/api/suppliers/add`, {
          method: 'POST',
          body: JSON.stringify([
            newSupplier,
            {"user": user.email}
          ])
        }, authToken);
        
        showToast("Supplier added successfully", "success");
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      showToast(error.message || "Error saving supplier", "error");
    } finally {
      setShowModal(false);
    }
  };

  // Header management functions
  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders]);
    setShowHeaderModal(true);
    setEditingHeader(null);
    setSaveAsGlobal(false);
  };

  const handleHeaderVisibilityChange = (index) => {
    const updatedHeaders = [...tempHeaders];
    updatedHeaders[index].visible = !updatedHeaders[index].visible;
    setTempHeaders(updatedHeaders);
  };

  const handleEditHeaderLabel = (index) => {
    setEditingHeader(index);
    setNewHeaderName(tempHeaders[index].label);
  };

  const saveHeaderLabel = () => {
    if (editingHeader !== null && newHeaderName.trim()) {
      const updatedHeaders = [...tempHeaders];
      updatedHeaders[editingHeader].label = newHeaderName.trim();
      setTempHeaders(updatedHeaders);
      setEditingHeader(null);
      setNewHeaderName("");
    }
  };

  const moveHeader = (index, direction) => {
    if ((direction < 0 && index === 0) || (direction > 0 && index === tempHeaders.length - 1)) {
      return;
    }
    
    const updatedHeaders = [...tempHeaders];
    const temp = updatedHeaders[index];
    updatedHeaders[index] = updatedHeaders[index + direction];
    updatedHeaders[index + direction] = temp;
    setTempHeaders(updatedHeaders);
  };

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
    
    const response = await apiRequest(`${API_BASE_URL}/api/table-headers/update`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }, authToken);
    
    setTableHeaders(tempHeaders);
    setShowHeaderModal(false);
    
    // Handle localStorage based on whether it's global or personal
    if (payload.isGlobal) {
      // If saving as global, remove personal localStorage entry
      // so it will fetch global headers next time
      localStorage.removeItem('supplierInfoTableHeaders');
      showToast("Global table headers updated successfully! All users will see these changes.", "success");
    } else {
      // Save personal headers to localStorage
      localStorage.setItem('supplierInfoTableHeaders', JSON.stringify(tempHeaders));
      showToast("Personal table headers updated successfully!", "success");
    }
    
    // If admin saved global headers, they should see the changes immediately
    if (payload.isGlobal && response.adminPersonalHeadersCleared) {
      console.log("Admin personal headers cleared, global headers now active");
    }
    
  } catch (error) {
    console.error("Error saving header changes:", error);
    showToast(error.message || "Error saving header changes", "error");
  } finally {
    setIsSaving(false);
  }
};

// Also update the data fetching useEffect to handle this better

useEffect(() => {
  const fetchData = async () => {
    if (!user?.email) return;
    
    try {
      let authToken = getAuthToken();
      
      if (!authToken) {
        authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      }
      
      console.log("Fetching data for user:", user.email);
      console.log("Auth token available:", !!authToken);

      const data = await apiRequest(`${API_BASE_URL}/api/suppliers/get-data`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      }, authToken);

      setSuppliers(data.data || []);
      setFilteredData(data.data || []);
      
      // Fetch table headers
      try {
        const headerData = await apiRequest(
          `${API_BASE_URL}/api/table-headers/get?email=${user.email}`,
          { method: 'GET' },
          authToken
        );
        
        if (headerData.headers) {
          setTableHeaders(headerData.headers);
          console.log(`Headers loaded from ${headerData.source || 'server'}`);
          
          // Only save to localStorage if they're personal headers
          if (headerData.source !== 'global') {
            localStorage.setItem('supplierInfoTableHeaders', JSON.stringify(headerData.headers));
          } else {
            // If global headers, remove any personal localStorage cache
            localStorage.removeItem('supplierInfoTableHeaders');
          }
        }
      } catch (headerError) {
        console.error("Error fetching table headers:", headerError);
        // Try to load from localStorage as fallback only if not admin
        // or if admin hasn't recently updated global settings
        if (!isAdmin) {
          const savedHeaders = localStorage.getItem('supplierInfoTableHeaders');
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
      console.error("Error fetching data:", error);
      
      if (error.message.includes('Authentication failed')) {
        showToast("Session expired. Please log in again.", "error");
      } else {
        showToast(error.message || "Error fetching data from server", "error");
      }
    }
  };

  fetchData();
}, [user, getAuthToken, isAdmin]);

  const deleteHeader = (index) => {
    if (!isAdmin) return;
    const updatedHeaders = [...tempHeaders];
    updatedHeaders.splice(index, 1);
    setTempHeaders(updatedHeaders);
  };

  const handleAddHeader = () => {
    if (!isAdmin) return;
    setShowAddHeaderModal(true);
  };

  const saveNewHeader = () => {
    if (!newHeaderInfo.id || !newHeaderInfo.label) {
      showToast("Header ID and Label are required", "error");
      return;
    }
    
    const newHeader = {
      id: newHeaderInfo.id,
      label: newHeaderInfo.label,
      visible: true,
      altKey: newHeaderInfo.altKey || null
    };
    
    setTempHeaders([...tempHeaders, newHeader]);
    setShowAddHeaderModal(false);
    
    setNewHeaderInfo({
      id: "",
      label: "",
      visible: true,
      altKey: ""
    });
  };

  const resetHeadersToDefault = () => {
    setTempHeaders([...DEFAULT_HEADERS]);
  };

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
          <h1 className="text-xl font-bold text-gray-900">Supplier Information</h1>
          <p className="text-md text-gray-400">Manage Supplier Information</p>
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
            {filteredData.map((supplier) => (
              <tr key={supplier.id || supplier._id} className="hover:bg-gray-50">
                {tableHeaders
                  .filter(header => header.visible)
                  .map(header => {
                    const value = header.altKey 
                      ? (supplier[header.id] || supplier[header.altKey] || "") 
                      : (supplier[header.id] || "");

                    if (header.id === "status") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={value} />
                        </td>
                      );
                    }
                    
                    if (header.id === "documentStatus") {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                          <DocumentStatusBadge status={value} />
                        </td>
                      );
                    }
                    
                    if (header.id === "invitationDate" && value) {
                      return (
                        <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(value).toLocaleDateString()}
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
                      onClick={() => handleViewDetails(supplier)}
                      className="text-gray-600 hover:text-gray-800 p-1 border border-gray-300 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(supplier)}
                      className="text-blue-600 hover:text-blue-800 p-1 border border-gray-300 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
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
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                  <input
                    type={header.id === "invitationDate" ? "date" : "text"}
                    value={newSupplier[header.id] || ""}
                    onChange={(e) => setNewSupplier({ ...newSupplier, [header.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingSupplier ? "Update" : "Add"}
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
      {showViewModal && selectedSupplierDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Supplier Entry Details</h3>
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
                  <span>{selectedSupplierDetails.user || "Unknown"}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-24">Created on:</span>
                  <span>
                    {selectedSupplierDetails.createdAt 
                      ? new Date(selectedSupplierDetails.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </span>
                </div>
              </div>
              
              {selectedSupplierDetails.updatedAt && selectedSupplierDetails.updatedBy && (
                <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="font-bold mb-2">Last Update</h4>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated by:</span>
                    <span>{selectedSupplierDetails.updatedBy}</span>
                  </div>
                  <div className="flex">
                    <span className="font-semibold w-24">Updated on:</span>
                    <span>{new Date(selectedSupplierDetails.updatedAt).toLocaleString()}</span>
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
            <h3 className="text-lg font-bold mb-4">Delete Supplier</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this supplier? This action cannot be undone.
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
  );
}