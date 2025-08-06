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
  RefreshCw
} from 'lucide-react';

// Default fallback headers - same as the management page
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

const API_BASE_URL = "http://localhost:8000";

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
    credentials: 'include',
    headers,
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          // Keep default error message
        }
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

const StatusBadge = ({ status, type = "status" }) => {
  let bgColor, textColor;
  
  if (type === "status") {
    switch (status) {
      case "Active":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "Pending":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case "Inactive":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }
  } else if (type === "document") {
    switch (status) {
      case "Complete":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "Incomplete":
        bgColor = "bg-orange-100";
        textColor = "text-orange-800";
        break;
      case "Pending Review":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case "Expired":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {status}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

export default function SupplierInfoView() {
  const { user, getAuthToken } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS); // Dynamic headers
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDocStatus, setFilterDocStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({});

  const isAdmin = user?.role === 'admin';

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Get auth token helper
  const getToken = () => {
    let authToken = getAuthToken();
    if (!authToken) {
      authToken = localStorage.getItem("token") || sessionStorage.getItem("token");
    }
    return authToken;
  };

  // Initialize form data based on current headers
  const initializeFormData = () => {
    const initialData = {};
    tableHeaders.forEach(header => {
      initialData[header.id] = "";
    });
    return initialData;
  };

  // Fetch table headers configuration
  const fetchTableHeaders = async () => {
    if (!user?.email) return;
    
    setIsLoadingHeaders(true);
    try {
      const authToken = getToken();
      
      const headerData = await apiRequest(
        `${API_BASE_URL}/api/table-headers/get?email=${user.email}`,
        { method: 'GET' },
        authToken
      );
      
      if (headerData.headers) {
        setTableHeaders(headerData.headers);
        console.log(`Headers loaded from ${headerData.source || 'server'} for view page`);
        
        // Only save to localStorage if they're personal headers
        if (headerData.source !== 'global') {
          localStorage.setItem('supplierInfoViewTableHeaders', JSON.stringify(headerData.headers));
        } else {
          // If global headers, remove any personal localStorage cache
          localStorage.removeItem('supplierInfoViewTableHeaders');
        }
      }
    } catch (headerError) {
      console.error("Error fetching table headers for view:", headerError);
      // Try to load from localStorage as fallback
      const savedHeaders = localStorage.getItem('supplierInfoViewTableHeaders');
      if (savedHeaders) {
        try {
          setTableHeaders(JSON.parse(savedHeaders));
          console.log("Headers loaded from localStorage for view page");
        } catch (e) {
          console.error("Error loading saved headers for view:", e);
        }
      }
    } finally {
      setIsLoadingHeaders(false);
    }
  };

  // Fetch suppliers data
  const fetchSuppliers = async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const authToken = getToken();
      
      const data = await apiRequest(`${API_BASE_URL}/api/suppliers/get-data`, {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      }, authToken);

      if (data && Array.isArray(data.data)) {
        const dataWithId = data.data.map(item => ({
          ...item,
          id: item._id || item.id
        }));
        setSuppliers(dataWithId);
        setFilteredSuppliers(dataWithId);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch supplier data");
      
      if (err.message.includes('Authentication failed')) {
        showToast("Session expired. Please log in again.", "error");
      } else {
        showToast(err.message || "Error fetching data from server", "error");
      }
      
      // Mock data for development/demo
      const mockData = [
        {
          id: "1",
          supplierNumber: "SUP001",
          supplier: "ABC Manufacturing Ltd",
          buyer: "John Doe",
          secondOrderClassification: "Grade A",
          status: "Active",
          documentStatus: "Complete",
          abnormalInfo: "None",
          invitee: "Jane Smith",
          reAuthPerson: "Mike Johnson",
          contactInfo: "contact@abc.com",
          invitationDate: "2025-07-20",
          user: "admin@example.com",
          createdAt: "2025-07-20T10:00:00Z"
        },
        {
          id: "2",
          supplierNumber: "SUP002",
          supplier: "XYZ Industries",
          buyer: "Sarah Wilson",
          secondOrderClassification: "Grade B",
          status: "Pending",
          documentStatus: "Incomplete",
          abnormalInfo: "Missing certifications",
          invitee: "Bob Brown",
          reAuthPerson: "Alice Davis",
          contactInfo: "info@xyz.com",
          invitationDate: "2025-07-22",
          user: "admin@example.com",
          createdAt: "2025-07-22T14:30:00Z"
        }
      ];
      setSuppliers(mockData);
      setFilteredSuppliers(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user?.email) {
      Promise.all([
        fetchTableHeaders(),
        fetchSuppliers()
      ]);
    }
  }, [user]);

  // Refresh function to sync with management page changes
  const refreshData = async () => {
    showToast("Refreshing data...", "info");
    await Promise.all([
      fetchTableHeaders(),
      fetchSuppliers()
    ]);
    showToast("Data refreshed successfully!", "success");
  };

  // Filter suppliers based on search and filter criteria
  useEffect(() => {
    let results = suppliers;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(supplier => 
        tableHeaders.some(header => {
          if (!header.visible) return false;
          const value = header.altKey 
            ? (supplier[header.id] || supplier[header.altKey] || "") 
            : (supplier[header.id] || "");
          
          if (typeof value === 'string') {
            return value.toLowerCase().includes(term);
          } else {
            return value.toString().toLowerCase().includes(term);
          }
        })
      );
    }
    
    if (filterStatus !== "All") {
      results = results.filter(supplier => (supplier.status || supplier.Status) === filterStatus);
    }
    
    if (filterDocStatus !== "All") {
      results = results.filter(supplier => (supplier.documentStatus || supplier.DocumentStatus) === filterDocStatus);
    }
    
    setFilteredSuppliers(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterStatus, filterDocStatus, suppliers, tableHeaders]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredSuppliers.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredSuppliers.length / rowsPerPage);

  // Handle actions
  const handleView = (supplier) => {
    setSelectedSupplier(supplier);
    setShowViewModal(true);
  };

  const handleAdd = () => {
    setFormData(initializeFormData());
    setShowAddModal(true);
  };

  const handleEdit = (supplier) => {
    const editData = {};
    tableHeaders.forEach(header => {
      const value = header.altKey ? 
        (supplier[header.id] || supplier[header.altKey] || "") : 
        (supplier[header.id] || "");
      editData[header.id] = value;
    });
    setFormData(editData);
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      const authToken = getToken();
      
      if (isEdit) {
        // Update existing supplier
        const rowToUpdate = suppliers.find(row => row._id === selectedSupplier._id || row.id === selectedSupplier.id);
        
        if (!rowToUpdate) {
          throw new Error("Could not find the row to update");
        }
        
        const mongoId = rowToUpdate._id || rowToUpdate.id;
        
        await apiRequest(`${API_BASE_URL}/api/suppliers/update`, {
          method: 'POST',
          body: JSON.stringify([
            {
              id: mongoId,
              ...formData,
            },
            {"user": user.email}
          ])
        }, authToken);

        showToast("Supplier updated successfully", "success");
      } else {
        // Add new supplier
        await apiRequest(`${API_BASE_URL}/api/suppliers/add`, {
          method: 'POST',
          body: JSON.stringify([
            formData,
            {"user": user.email}
          ])
        }, authToken);
        
        showToast("Supplier added successfully", "success");
      }

      await fetchSuppliers(); // Refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedSupplier(null);
      setFormData({});
    } catch (err) {
      console.error("Error saving supplier:", err);
      showToast(err.message || "Error saving supplier", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const authToken = getToken();
      
      let mongoId = selectedSupplier._id || selectedSupplier.id;
      
      if (!mongoId) {
        throw new Error("Could not determine supplier database ID");
      }
      
      await apiRequest(`${API_BASE_URL}/api/suppliers/${mongoId}`, {
        method: 'DELETE'
      }, authToken);

      await fetchSuppliers(); // Refresh data
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
      showToast("Supplier deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting supplier:", err);
      showToast(err.message || "Error deleting supplier", "error");
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#," + tableHeaders
      .filter(header => header.visible)
      .map(header => header.label)
      .join(",") + "\n";
    
    filteredSuppliers.forEach((row, index) => {
      csvContent += `${index + 1},`;
      tableHeaders.filter(header => header.visible).forEach(header => {
        const value = header.altKey ? (row[header.id] || row[header.altKey] || "") : (row[header.id] || "");
        csvContent += `"${value.toString().replace(/"/g, '""')}",`;
      });
      csvContent += "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `supplier-data-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get visible headers
  const visibleHeaders = tableHeaders.filter(header => header.visible);

  if (isLoading || isLoadingHeaders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoadingHeaders ? "Loading table configuration..." : "Loading supplier data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supplier Information</h1>
            <p className="text-gray-600 mt-1">Manage supplier details, contacts, and categories</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh data and table configuration"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Supplier
              </button>
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
              placeholder="Search by supplier, number, buyer..."
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
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterDocStatus}
            onChange={(e) => setFilterDocStatus(e.target.value)}
          >
            <option value="All">All Document Statuses</option>
            <option value="Complete">Complete</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Expired">Expired</option>
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
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          {visibleHeaders.length < tableHeaders.length && (
            <span className="ml-2 text-blue-600">
              ({visibleHeaders.length} of {tableHeaders.length} columns visible)
            </span>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                {visibleHeaders.map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData().length > 0 ? (
                getPaginatedData().map((supplier, index) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    {visibleHeaders.map(header => {
                      const value = header.altKey ? 
                        (supplier[header.id] || supplier[header.altKey] || "") : 
                        (supplier[header.id] || "");
                      
                      if (header.id === "status") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} type="status" />
                          </td>
                        );
                      }
                      
                      if (header.id === "documentStatus") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} type="document" />
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(supplier)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(supplier)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(supplier)}
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
                  <td colSpan={visibleHeaders.length + 2} className="px-6 py-4 text-center text-gray-500">
                    No supplier data matching your criteria
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
                    {Math.min(currentPage * rowsPerPage, filteredSuppliers.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredSuppliers.length}</span>
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
        title="Supplier Details"
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Entry Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedSupplier.user || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created on:</span>
                  <p className="text-gray-900">
                    {selectedSupplier.createdAt 
                      ? new Date(selectedSupplier.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedSupplier.updatedAt && selectedSupplier.updatedBy && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Last Update</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Updated by:</span>
                    <p className="text-gray-900">{selectedSupplier.updatedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated on:</span>
                    <p className="text-gray-900">{new Date(selectedSupplier.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Display all supplier data based on current headers */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Supplier Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {visibleHeaders.map(header => {
                  const value = header.altKey ? 
                    (selectedSupplier[header.id] || selectedSupplier[header.altKey] || "") : 
                    (selectedSupplier[header.id] || "");
                  
                  return (
                    <div key={header.id}>
                      <span className="font-medium text-gray-700">{header.label}:</span>
                      <p className="text-gray-900">
                        {header.id === "status" || header.id === "documentStatus" ? (
                          <StatusBadge 
                            status={value} 
                            type={header.id === "status" ? "status" : "document"} 
                          />
                        ) : header.id === "invitationDate" && value ? (
                          new Date(value).toLocaleDateString()
                        ) : (
                          value || "-"
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
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
        title={showEditModal ? "Edit Supplier" : "Add New Supplier"}
      >
        <div className="space-y-4">
          {tableHeaders.map(header => (
            <div key={header.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {header.label}
              </label>
              <input
                type={header.id === "invitationDate" ? "date" : "text"}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData[header.id] || ""}
                onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                placeholder={`Enter ${header.label.toLowerCase()}`}
              />
            </div>
          ))}
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
              {showEditModal ? "Update" : "Add"} Supplier
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${selectedSupplier?.supplier || selectedSupplier?.Customer}"? This action cannot be undone.`}
      />
    </div>
  );
}