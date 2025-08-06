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
  ChevronUp,
  ChevronDown,
  Check,
  X
} from 'lucide-react';

const DEFAULT_HEADERS = [
  { id: "supplierMaterial", label: "Supplier Material", visible: true, altKey: "Suppliermaterial" },
  { id: "supplementOrderNumber", label: "Supplement Order Number", visible: true, altKey: "OrderNumber" },
  { id: "status", label: "Status", visible: true },
  { id: "explanation", label: "Explanation", visible: true, altKey: "explaination" },
  { id: "createTime", label: "Create Time", visible: true, altKey: "createdTime" },
  { id: "updateTime", label: "Update Time", visible: true }
];

const StatusBadge = ({ status }) => {
  let bgColor, textColor, icon;
  
  switch (status) {
    case "Approved":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <CheckCircle className="w-3 h-3" />;
      break;
    case "Pending":
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
      icon = <Clock className="w-3 h-3" />;
      break;
    case "Rejected":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = <XCircle className="w-3 h-3" />;
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      icon = <AlertCircle className="w-3 h-3" />;
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {icon}
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

export default function MaterialInquiryView() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
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
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({});
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS);
  const [tempHeaders, setTempHeaders] = useState([]);
  const [editingHeader, setEditingHeader] = useState(null);
  const [newHeaderName, setNewHeaderName] = useState('');
  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: '',
    label: '',
    visible: true,
    altKey: ''
  });

  const isAdmin = user?.role === 'admin';
  const apiUrl = "http://localhost:8000/api";

  // Toast notification helper
  const showToast = (message, type = "success") => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  // Initialize form data
  const initializeFormData = () => {
    const initialData = {};
    tableHeaders.forEach(header => {
      initialData[header.id] = "";
    });
    initialData.status = "Pending";
    initialData.createTime = new Date().toISOString();
    initialData.updateTime = new Date().toISOString();
    return initialData;
  };

  // Fetch materials data
  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/material-inquiry/get-all`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        const dataWithId = data.data.map(item => ({
          ...item,
          id: item._id
        }));
        setMaterials(dataWithId);
        setFilteredMaterials(dataWithId);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch material data");
      
      // Mock data for development/demo
      const mockData = [
        {
          id: "1",
          supplierMaterial: "Steel Rods Grade A",
          supplementOrderNumber: "ORD001",
          status: "Approved",
          explanation: "Quality materials required for construction",
          createTime: "2025-07-20T10:00:00Z",
          updateTime: "2025-07-22T14:30:00Z",
          user: "admin@example.com",
          updatedBy: "admin@example.com"
        },
        {
          id: "2",
          supplierMaterial: "Aluminum Sheets",
          supplementOrderNumber: "ORD002",
          status: "Pending",
          explanation: "Pending supplier confirmation",
          createTime: "2025-07-22T14:30:00Z",
          updateTime: "2025-07-22T14:30:00Z",
          user: "client@example.com"
        },
        {
          id: "3",
          supplierMaterial: "Copper Wires",
          supplementOrderNumber: "ORD003",
          status: "Rejected",
          explanation: "Specifications did not match requirements",
          createTime: "2025-07-21T09:15:00Z",
          updateTime: "2025-07-23T11:45:00Z",
          user: "client@example.com",
          updatedBy: "admin@example.com"
        }
      ];
      setMaterials(mockData);
      setFilteredMaterials(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch table headers from backend
  const fetchTableHeaders = async () => {
    try {
      if (isAdmin && user?.email) {
        const response = await fetch(`${apiUrl}/table-headers/get-material-inquiry?email=${user.email}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.headers) {
            setTableHeaders(data.headers);
            return;
          }
        }
      }
      
      // Fallback to localStorage if API fails
      const savedHeaders = localStorage.getItem('materialInquiryTableHeaders');
      if (savedHeaders) {
        setTableHeaders(JSON.parse(savedHeaders));
      }
    } catch (error) {
      console.error("Error fetching table headers:", error);
      // Use default headers if everything fails
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchMaterials();
      fetchTableHeaders();
    }
  }, [user]);

  // Filter materials based on search and filter criteria
  useEffect(() => {
    let results = materials;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(material => 
        (material.supplierMaterial || material.Suppliermaterial || "").toLowerCase().includes(term) ||
        (material.supplementOrderNumber || material.OrderNumber || "").toLowerCase().includes(term) ||
        (material.explanation || material.explaination || "").toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== "All") {
      results = results.filter(material => material.status === filterStatus);
    }
    
    setFilteredMaterials(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterStatus, materials]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredMaterials.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredMaterials.length / rowsPerPage);

  // Handle actions
  const handleView = (material) => {
    setSelectedMaterial(material);
    setShowViewModal(true);
  };

  const handleAdd = () => {
    setFormData(initializeFormData());
    setShowAddModal(true);
  };

  const handleEdit = (material) => {
    const editData = {};
    tableHeaders.forEach(header => {
      const value = header.altKey ? 
        (material[header.id] || material[header.altKey] || "") : 
        (material[header.id] || "");
      editData[header.id] = value;
    });
    setFormData(editData);
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleDelete = (material) => {
    setSelectedMaterial(material);
    setShowDeleteDialog(true);
  };

  // Header management functions
  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders]);
    setShowHeaderModal(true);
    setEditingHeader(null);
  };

  const toggleHeaderVisibility = (index) => {
    const updated = [...tempHeaders];
    updated[index].visible = !updated[index].visible;
    setTempHeaders(updated);
  };

  const handleEditHeaderLabel = (index) => {
    setEditingHeader(index);
    setNewHeaderName(tempHeaders[index].label);
  };

  const saveHeaderLabel = () => {
    if (editingHeader !== null && newHeaderName.trim()) {
      const updated = [...tempHeaders];
      updated[editingHeader].label = newHeaderName.trim();
      setTempHeaders(updated);
      setEditingHeader(null);
      setNewHeaderName('');
    }
  };

  const cancelHeaderEdit = () => {
    setEditingHeader(null);
    setNewHeaderName('');
  };

  const deleteHeader = (index) => {
    if (!isAdmin) return;
    
    const updated = [...tempHeaders];
    updated.splice(index, 1);
    setTempHeaders(updated);
  };

  const handleAddHeader = () => {
    if (!isAdmin) return;
    setNewHeaderInfo({
      id: '',
      label: '',
      visible: true,
      altKey: ''
    });
    setShowAddHeaderModal(true);
  };

  const saveNewHeader = () => {
    if (!newHeaderInfo.id || !newHeaderInfo.label) {
      showToast("Header ID and Label are required", "error");
      return;
    }
    
    // Check if ID already exists
    if (tempHeaders.some(h => h.id === newHeaderInfo.id)) {
      showToast("Header ID already exists", "error");
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
      id: '',
      label: '',
      visible: true,
      altKey: ''
    });
    showToast("New column added successfully");
  };

  const resetHeaders = () => {
    setTempHeaders([...DEFAULT_HEADERS]);
    showToast("Headers reset to default");
  };

  const moveHeader = (index, direction) => {
    if ((direction < 0 && index === 0) || (direction > 0 && index === tempHeaders.length - 1)) {
      return;
    }
    
    const updated = [...tempHeaders];
    const temp = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = temp;
    setTempHeaders(updated);
  };

  const saveHeaderChanges = async () => {
    try {
      if (isAdmin) {
        const response = await fetch(`${apiUrl}/table-headers/update-material-inquiry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ headers: tempHeaders, email: user.email })
        });
        
        if (response.ok) {
          showToast("Table headers updated globally");
        } else {
          throw new Error("Failed to save headers to server");
        }
      }
      
      setTableHeaders(tempHeaders);
      setShowHeaderModal(false);
      localStorage.setItem('materialInquiryTableHeaders', JSON.stringify(tempHeaders));
    } catch (error) {
      console.error("Error saving header changes:", error);
      showToast("Error saving header changes", "error");
    }
  };

  const handleSave = async (isEdit = false) => {
    try {
      const currentDateTime = new Date().toISOString();
      const requestData = {
        ...formData,
        updateTime: currentDateTime,
        updatedBy: user.email
      };

      if (!isEdit) {
        requestData.createTime = currentDateTime;
      }

      const url = isEdit ? 
        `${apiUrl}/material-inquiry/add-material` : 
        `${apiUrl}/material-inquiry/add-material`;
      
      const body = isEdit ? 
        [{ ...requestData, id: selectedMaterial.id }, { user: user.email }] : 
        [requestData, { user: user.email }];

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchMaterials(); // Refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedMaterial(null);
      setFormData({});
      showToast(isEdit ? "Material updated successfully" : "Material added successfully");
    } catch (err) {
      console.error("Error saving material:", err);
      setError(err.message || "Failed to save material");
      showToast("Error saving material", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${apiUrl}/material-inquiry/delete-material`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: selectedMaterial.id,
          email: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchMaterials(); // Refresh data
      setShowDeleteDialog(false);
      setSelectedMaterial(null);
      showToast("Material deleted successfully");
    } catch (err) {
      console.error("Error deleting material:", err);
      setError(err.message || "Failed to delete material");
      showToast("Error deleting material", "error");
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#," + tableHeaders
      .filter(header => header.visible)
      .map(header => header.label)
      .join(",") + "\n";
    
    filteredMaterials.forEach((row, index) => {
      csvContent += `${index + 1},`;
      tableHeaders.filter(header => header.visible).forEach(header => {
        const value = header.altKey ? (row[header.id] || row[header.altKey] || "") : (row[header.id] || "");
        if (header.id === "createTime" || header.id === "updateTime") {
          const dateValue = value ? new Date(value).toLocaleString() : "";
          csvContent += `"${dateValue}",`;
        } else {
          csvContent += `"${value.toString().replace(/"/g, '""')}",`;
        }
      });
      csvContent += "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material-inquiry-data-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading material data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Inquiry</h1>
            <p className="text-gray-600 mt-1">Manage material requests, inquiries, and procurement</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            {isAdmin && (
              <button
                onClick={openHeaderModal}
                className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Columns
              </button>
            )}
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
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
              placeholder="Search by material, order number, explanation..."
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
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
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
          Showing {filteredMaterials.length} of {materials.length} materials
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
                getPaginatedData().map((material, index) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    {tableHeaders.filter(header => header.visible).map(header => {
                      const value = header.altKey ? 
                        (material[header.id] || material[header.altKey] || "") : 
                        (material[header.id] || "");
                      
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
                            {value ? new Date(value).toLocaleString() : "-"}
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
                          onClick={() => handleView(material)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(material)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(material)}
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
                    No material data matching your criteria
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
                    {Math.min(currentPage * rowsPerPage, filteredMaterials.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredMaterials.length}</span>
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
        title="Material Details"
      >
        {selectedMaterial && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Supplier Material:</span>
                  <span className="text-gray-900">{selectedMaterial.supplierMaterial || selectedMaterial.Suppliermaterial || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Order Number:</span>
                  <span className="text-gray-900">{selectedMaterial.supplementOrderNumber || selectedMaterial.OrderNumber || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <StatusBadge status={selectedMaterial.status} />
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Explanation:</span>
                  <span className="text-gray-900 text-right max-w-xs">{selectedMaterial.explanation || selectedMaterial.explaination || "-"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Entry Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedMaterial.user || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created on:</span>
                  <p className="text-gray-900">
                    {selectedMaterial.createTime || selectedMaterial.createdTime
                      ? new Date(selectedMaterial.createTime || selectedMaterial.createdTime).toLocaleString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>
            
            {(selectedMaterial.updateTime || selectedMaterial.updatedBy) && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Last Update</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Updated by:</span>
                    <p className="text-gray-900">{selectedMaterial.updatedBy || "Unknown"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated on:</span>
                    <p className="text-gray-900">
                      {selectedMaterial.updateTime 
                        ? new Date(selectedMaterial.updateTime).toLocaleString() 
                        : "Unknown date"}
                    </p>
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
        title={showEditModal ? "Edit Material" : "Add New Material"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier Material
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.supplierMaterial || ""}
              onChange={(e) => setFormData({ ...formData, supplierMaterial: e.target.value })}
              placeholder="Enter supplier material"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplement Order Number
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.supplementOrderNumber || ""}
              onChange={(e) => setFormData({ ...formData, supplementOrderNumber: e.target.value })}
              placeholder="Enter order number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.status || "Pending"}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Explanation
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.explanation || ""}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Enter explanation"
            />
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
              {showEditModal ? "Update" : "Add"} Material
            </button>
          </div>
        </div>
      </Modal>

      {/* Header Management Modal */}
      <Modal
        isOpen={showHeaderModal}
        onClose={() => setShowHeaderModal(false)}
        title="Manage Table Columns"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Configure which columns are visible</p>
            <button
              onClick={resetHeaders}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Reset to Default
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tempHeaders.map((header, index) => (
              <div key={header.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <span className="text-sm font-medium text-gray-700">{header.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={header.visible}
                    onChange={() => handleHeaderVisibilityChange(index)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowHeaderModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveHeaderChanges}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedMaterial(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Material"
        message={`Are you sure you want to delete material "${selectedMaterial?.supplierMaterial || selectedMaterial?.Suppliermaterial}"? This action cannot be undone.`}
      />
    </div>
  );
}