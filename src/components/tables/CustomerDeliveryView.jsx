import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  MapPin,
  Menu as MenuIcon,
  ChevronUp,
  ChevronDown,
  Save,
  X
} from 'lucide-react';

// Backend API URL
const API_URL = "http://localhost:8000";

// API Configuration - Set this to true to use separate delivery endpoints
// Set to false to use the existing customer-delivery-notices endpoints
const USE_SEPARATE_DELIVERY_API = false;

const API_ENDPOINTS = {
  getData: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries/get-data' : '/api/customer-delivery-notices/get-data',
  add: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries/add' : '/api/customer-delivery-notices/add',
  update: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries' : '/api/customer-delivery-notices',
  delete: USE_SEPARATE_DELIVERY_API ? '/api/customer-deliveries' : '/api/customer-delivery-notices',
  headers: '/api/table-headers/get-customer-delivery'
};

// Fallback headers - will be overridden by server/localStorage
const FALLBACK_HEADERS = [
  { id: "OrderNumber", label: "Order Number", visible: true },
  { id: "MaterialCategory", label: "Material Category", visible: true },
  { id: "Vendor", label: "Vendor", visible: true },
  { id: "Invitee", label: "Invitee", visible: true },
  { id: "HostInviterContactInfo", label: "Host/Inviter Contact Info", visible: true },
  { id: "Sender", label: "Sender", visible: true },
  { id: "Status", label: "Status", visible: true },
  { id: "SupplementTemplate", label: "Supplement Template", visible: true },
  { id: "Created", label: "Created", visible: true },
];

const StatusBadge = ({ status }) => {
  let bgColor, textColor;
  
  switch (status?.toLowerCase()) {
    case "delivered":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "pending":
    case "scheduled":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case "in transit":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case "cancelled":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  let bgColor, textColor;
  
  switch (priority?.toLowerCase()) {
    case "high":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    case "medium":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      break;
    case "low":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {priority}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                  'bg-blue-100 border-blue-400 text-blue-700';

  return (
    <div className={`fixed top-4 right-4 z-50 border-l-4 p-4 rounded shadow-lg ${bgColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {type === 'success' && <CheckCircle className="h-5 w-5" />}
          {type === 'error' && <XCircle className="h-5 w-5" />}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CustomerDeliveryView() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(FALLBACK_HEADERS); // Dynamic headers
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showTableOptionsDropdown, setShowTableOptionsDropdown] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [tempHeaders, setTempHeaders] = useState([]);
  const [editingHeader, setEditingHeader] = useState(null);
  const [newHeaderName, setNewHeaderName] = useState('');

  const isAdmin = user?.role === 'admin';

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.table-options-dropdown')) {
        setShowTableOptionsDropdown(false);
      }
    };

    if (showTableOptionsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTableOptionsDropdown]);

  // Initialize form data based on current headers
  const initializeFormData = () => {
    const initialData = {};
    tableHeaders.forEach(header => {
      if (header.id === 'Status' || header.id === 'status') {
        initialData[header.id] = 'Pending';
      } else if (header.id === 'Created' || header.id === 'scheduledDate') {
        initialData[header.id] = new Date().toISOString().split('T')[0];
      } else if (header.id === 'priority') {
        initialData[header.id] = 'Medium';
      } else if (header.id === 'quantity') {
        initialData[header.id] = '';
      } else {
        initialData[header.id] = '';
      }
    });
    return initialData;
  };

  // Fetch headers configuration
  const fetchHeaders = async () => {
    try {
      const headerResponse = await fetch(
        `${API_URL}${API_ENDPOINTS.headers}?email=${user?.email}`,
        { credentials: 'include' }
      );
      
      if (headerResponse.ok) {
        const headerResult = await headerResponse.json();
        if (headerResult.headers && Array.isArray(headerResult.headers)) {
          setTableHeaders(headerResult.headers);
          return;
        }
      }
    } catch (headerError) {
      console.error("Error fetching table headers:", headerError);
    }
    
    // Fallback to localStorage
    const savedHeaders = localStorage.getItem('customerDeliveryHeaders');
    if (savedHeaders) {
      try {
        const parsedHeaders = JSON.parse(savedHeaders);
        if (Array.isArray(parsedHeaders)) {
          setTableHeaders(parsedHeaders);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved headers:", e);
      }
    }
    
    // Final fallback to default headers
    setTableHeaders(FALLBACK_HEADERS);
  };

  // Fetch notices data
  const fetchNotices = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.getData}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: user?.email })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        const dataWithId = data.data.map((item, index) => ({
          ...item,
          id: item._id || item.id || `ITEM-${index + 1}`,
          // Map common fields to ensure compatibility
          OrderNumber: item.OrderNumber || item.orderId || item.id,
          MaterialCategory: item.MaterialCategory || item.product,
          Status: item.Status || item.status,
          Created: item.Created || item.scheduledDate || item.createdAt,
        }));
        setNotices(dataWithId);
        setFilteredNotices(dataWithId);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch delivery notices");
      
      // Mock data for development/demo - using flexible structure
      const mockData = [
        {
          id: "1",
          OrderNumber: "ORD001",
          orderId: "ORD001",
          MaterialCategory: "Electronics",
          product: "Electronic Components",
          Vendor: "ABC Electronics Ltd",
          customer: "ABC Electronics Ltd",
          Invitee: "John Doe",
          HostInviterContactInfo: "john@example.com",
          deliveryAddress: "123 Tech Street, Silicon Valley, CA",
          Sender: "Jane Smith",
          driver: "Jane Smith",
          Status: "Delivered",
          status: "Delivered",
          SupplementTemplate: "Standard Template",
          Created: "2025-07-20",
          scheduledDate: "2025-07-20",
          quantity: 500,
          trackingNumber: "TRK123456789",
          vehicleNo: "TRK-001",
          priority: "High",
          user: "admin@example.com",
          createdAt: "2025-07-20T10:00:00Z"
        },
        {
          id: "2",
          OrderNumber: "ORD002",
          orderId: "ORD002",
          MaterialCategory: "Chemicals",
          product: "Steel Sheets",
          Vendor: "XYZ Chemicals Inc",
          customer: "Manufacturing Corp",
          Invitee: "Sarah Wilson",
          HostInviterContactInfo: "sarah@example.com",
          deliveryAddress: "456 Industrial Blvd, Detroit, MI",
          Sender: "Bob Brown",
          driver: "Sarah Wilson",
          Status: "Pending",
          status: "Scheduled",
          SupplementTemplate: "Chemical Template",
          Created: "2025-07-22",
          scheduledDate: "2025-07-22",
          quantity: 200,
          trackingNumber: "TRK123456790",
          vehicleNo: "TRK-002",
          priority: "Medium",
          user: "admin@example.com",
          createdAt: "2025-07-22T14:30:00Z"
        }
      ];
      setNotices(mockData);
      setFilteredNotices(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHeaders().then(() => {
        fetchNotices();
      });
    }
  }, [user]);

  // Save header configuration to localStorage when changed
  useEffect(() => {
    if (tableHeaders.length > 0) {
      localStorage.setItem('customerDeliveryHeaders', JSON.stringify(tableHeaders));
    }
  }, [tableHeaders]);

  // Filter notices based on search and filter criteria
  useEffect(() => {
    let results = notices;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(notice => {
        return tableHeaders.some(header => {
          if (!header.visible) return false;
          const value = notice[header.id] || "";
          return value.toString().toLowerCase().includes(term);
        });
      });
    }
    
    if (filterStatus !== "All") {
      results = results.filter(notice => {
        const status = notice.Status || notice.status || "";
        return status.toLowerCase() === filterStatus.toLowerCase();
      });
    }
    
    setFilteredNotices(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterStatus, notices, tableHeaders]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredNotices.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredNotices.length / rowsPerPage);

  // Handle actions
  const handleView = (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
  };

  const handleAdd = () => {
    setFormData(initializeFormData());
    setShowAddModal(true);
  };

  const handleEdit = (notice) => {
    const editData = {};
    tableHeaders.forEach(header => {
      const value = notice[header.id] || "";
      editData[header.id] = value;
    });
    setFormData(editData);
    setSelectedNotice(notice);
    setShowEditModal(true);
  };

  const handleDelete = (notice) => {
    setSelectedNotice(notice);
    setShowDeleteDialog(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      if (!user || !user.email) {
        throw new Error("User authentication required");
      }

      // Validate required fields based on current headers
      const requiredFields = ['OrderNumber', 'orderId', 'MaterialCategory', 'product', 'Vendor', 'customer'];
      const missingRequired = requiredFields.find(field => {
        const headerExists = tableHeaders.some(h => h.id === field);
        return headerExists && !formData[field]?.trim();
      });

      if (missingRequired) {
        const headerLabel = tableHeaders.find(h => h.id === missingRequired)?.label || missingRequired;
        throw new Error(`${headerLabel} is required`);
      }

      const url = isEdit ? 
        `${API_URL}${API_ENDPOINTS.update}/${selectedNotice.id}` : 
        `${API_URL}${API_ENDPOINTS.add}`;
      const method = isEdit ? 'PUT' : 'POST';
      
      const body = isEdit ? {
        data: {
          ...formData,
          updatedAt: new Date(),
          updatedBy: user.email
        },
        user: user.email
      } : [
        {
          ...formData,
          user: user.email,
          createdAt: new Date()
        },
        { user: user.email }
      ];

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchNotices(); // Refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedNotice(null);
      setFormData({});
      showToast(isEdit ? "Notice updated successfully" : "Notice added successfully", "success");
    } catch (err) {
      console.error("Error saving notice:", err);
      showToast(err.message || "Failed to save notice", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!user || !user.email) {
        throw new Error("User authentication required");
      }

      const response = await fetch(`${API_URL}${API_ENDPOINTS.delete}/${selectedNotice.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ user: user.email })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchNotices(); // Refresh data
      setShowDeleteDialog(false);
      setSelectedNotice(null);
      showToast("Delivery notice deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting notice:", err);
      showToast(err.message || "Failed to delete notice", "error");
    }
  };

  // Header management functions
  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders]);
    setShowHeaderModal(true);
    setEditingHeader(null);
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
    try {
      const response = await fetch(`${API_URL}/api/table-headers/update-customer-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          headers: tempHeaders,
          email: user?.email,
          isGlobal: isAdmin
        })
      });

      if (response.ok) {
        setTableHeaders(tempHeaders);
        setShowHeaderModal(false);
        showToast(isAdmin ? "Global header settings saved!" : "Header settings saved!", "success");
      } else {
        // Fallback to localStorage if API fails
        setTableHeaders(tempHeaders);
        setShowHeaderModal(false);
        showToast("Header settings saved locally", "success");
      }
    } catch (error) {
      console.error("Error saving header changes:", error);
      // Fallback to localStorage
      setTableHeaders(tempHeaders);
      setShowHeaderModal(false);
      showToast("Header settings saved locally", "success");
    }
  };

  const resetHeadersToDefault = () => {
    setTempHeaders([...FALLBACK_HEADERS]);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#," + tableHeaders
      .filter(header => header.visible)
      .map(header => header.label)
      .join(",") + "\n";
    
    filteredNotices.forEach((row, index) => {
      csvContent += `${index + 1},`;
      tableHeaders.filter(header => header.visible).forEach(header => {
        const value = row[header.id] || "";
        csvContent += `"${value.toString().replace(/"/g, '""')}",`;
      });
      csvContent += "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `delivery-notices-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredNotices.length} delivery notices to CSV`, "success");
  };

  // Render cell content based on field type
  const renderCellContent = (notice, header) => {
    const value = notice[header.id] || "";
    
    if (header.id === "Status" || header.id === "status") {
      return <StatusBadge status={value} />;
    }
    
    if (header.id === "priority") {
      return <PriorityBadge priority={value} />;
    }
    
    if (header.id === "Created" || header.id === "scheduledDate" || header.id === "actualDate") {
      if (value) {
        return (
          <div className="flex items-center text-sm text-gray-900">
            <Clock className="w-4 h-4 mr-1 text-gray-400" />
            {new Date(value).toLocaleDateString()}
          </div>
        );
      }
      return "-";
    }
    
    if (header.id === "deliveryAddress") {
      return (
        <div className="flex items-center text-sm text-gray-900 max-w-xs">
          <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
          <div className="truncate" title={value}>
            {value || "-"}
          </div>
        </div>
      );
    }
    
    if (header.id === "trackingNumber") {
      return (
        <div className="text-sm font-mono text-gray-900">
          {value || "-"}
        </div>
      );
    }
    
    if (header.id === "customer" || header.id === "Vendor") {
      const quantity = notice.quantity;
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{value || "-"}</div>
          {quantity && (
            <div className="text-sm text-gray-500">Qty: {quantity}</div>
          )}
        </div>
      );
    }
    
    if (header.id === "driver" || header.id === "Sender") {
      const vehicleNo = notice.vehicleNo;
      return (
        <div>
          <div className="text-sm text-gray-900">{value || "-"}</div>
          {vehicleNo && (
            <div className="text-sm text-gray-500">{vehicleNo}</div>
          )}
        </div>
      );
    }
    
    return value || "-";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery notices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Delivery Notices</h1>
            <p className="text-gray-600 mt-1">Manage delivery notices, orders, and tracking information</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              disabled={filteredNotices.length === 0}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            {isAdmin && (
              <>
                <div className="relative table-options-dropdown">
                  <button 
                    onClick={() => setShowTableOptionsDropdown(!showTableOptionsDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Table Options</span>
                  </button>
                  {showTableOptionsDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                      <button
                        onClick={() => {
                          openHeaderModal();
                          setShowTableOptionsDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Manage Columns
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAdd}
                  className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Notice
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order number, material, vendor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Delayed">Delayed</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredNotices.length} of {notices.length} notices
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                {tableHeaders.filter(header => header.visible).map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData().length > 0 ? (
                getPaginatedData().map((notice, index) => (
                  <tr key={notice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    {tableHeaders.filter(header => header.visible).map(header => (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderCellContent(notice, header)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(notice)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(notice)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(notice)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.filter(h => h.visible).length + 2} className="px-6 py-4 text-center text-gray-500">
                    No delivery notices matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * rowsPerPage, filteredNotices.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredNotices.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Delivery Notice Details"
      >
        {selectedNotice && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Notice Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {tableHeaders.filter(h => h.visible).map(header => (
                  <div key={header.id}>
                    <span className="font-medium text-gray-700">{header.label}:</span>
                    <div className="text-gray-900 mt-1">
                      {renderCellContent(selectedNotice, header)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Entry Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedNotice.user || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created on:</span>
                  <p className="text-gray-900">
                    {selectedNotice.createdAt 
                      ? new Date(selectedNotice.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedNotice.updatedAt && selectedNotice.updatedBy && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Last Update</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Updated by:</span>
                    <p className="text-gray-900">{selectedNotice.updatedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated on:</span>
                    <p className="text-gray-900">{new Date(selectedNotice.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setFormData({});
        }}
        title={showEditModal ? "Edit Delivery Notice" : "Add New Delivery Notice"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tableHeaders.filter(header => header.visible && header.id !== 'actions').map(header => (
              <div key={header.id} className={header.id === 'deliveryAddress' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {header.label}
                  {['OrderNumber', 'orderId', 'MaterialCategory', 'product', 'Vendor', 'customer'].includes(header.id) && 
                    <span className="text-red-500">*</span>
                  }
                </label>
                {header.id === 'deliveryAddress' ? (
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                    placeholder={`Enter ${header.label.toLowerCase()}`}
                    rows={2}
                  />
                ) : header.id === 'Status' || header.id === 'status' ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || "Pending"}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                ) : header.id === 'priority' ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || "Medium"}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                ) : header.id === 'Created' || header.id === 'scheduledDate' || header.id === 'actualDate' ? (
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                  />
                ) : header.id === 'quantity' ? (
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                    placeholder={`Enter ${header.label.toLowerCase()}`}
                  />
                ) : (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData[header.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                    placeholder={`Enter ${header.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setFormData({});
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(showEditModal)}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {showEditModal ? "Update" : "Add"} Notice
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedNotice(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Delivery Notice"
        message={`Are you sure you want to delete notice "${selectedNotice?.OrderNumber || selectedNotice?.orderId}"? This action cannot be undone.`}
      />

      {/* Header Management Modal */}
      {showHeaderModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Manage Table Columns</h3>
              <button
                onClick={() => setShowHeaderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">Configure which columns are visible and their order</p>
              <button
                onClick={resetHeadersToDefault}
                className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                Reset to Default
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tempHeaders.map((header, index) => (
                <div
                  key={header.id}
                  className={`flex items-center justify-between p-3 border rounded-md ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <div className="w-6 h-6 mr-3 cursor-grab">
                      <MenuIcon className="w-4 h-4" />
                    </div>
                    
                    {editingHeader === index ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          value={newHeaderName}
                          onChange={(e) => setNewHeaderName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveHeaderLabel()}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          onClick={saveHeaderLabel}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingHeader(null)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="flex-1 text-sm font-medium">{header.label}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditHeaderLabel(index)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit Label"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <div className="flex">
                      <button
                        onClick={() => moveHeader(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveHeader(index, 1)}
                        disabled={index === tempHeaders.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-25"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={header.visible}
                        onChange={() => handleHeaderVisibilityChange(index)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${
                        header.visible ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                          header.visible ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowHeaderModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveHeaderChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}