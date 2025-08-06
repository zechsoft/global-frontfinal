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
  { id: "orderNumber", label: "Order Number", visible: true, altKey: "OrderNumber" },
  { id: "materialCategory", label: "Material Category", visible: true, altKey: "MaterialCategory" },
  { id: "vendor", label: "Vendor", visible: true, altKey: "Vendor" },
  { id: "invitee", label: "Invitee", visible: true, altKey: "Invitee" },
  { id: "hostInviterContactInfo", label: "Host/Inviter Contact Information", visible: true, altKey: "Host" },
  { id: "sender", label: "Sender", visible: true, altKey: "Sender" },
  { id: "status", label: "Status", visible: true, altKey: "Status" },
  { id: "supplementTemplate", label: "Supplement Template", visible: true, altKey: "SupplementTemplate" },
  { id: "createTime", label: "Create Time", visible: true, altKey: "Created" },
  { id: "updateTime", label: "Update Time", visible: true, altKey: "updated" },
];

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
  } else if (type === "template") {
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

const Toast = ({ message, type, show, onHide }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const iconColor = type === 'error' ? 'text-red-400' : 'text-green-400';

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${bgColor} shadow-lg`}>
      <div className="flex items-center">
        {type === 'error' ? (
          <AlertCircle className={`w-5 h-5 ${iconColor} mr-3`} />
        ) : (
          <CheckCircle className={`w-5 h-5 ${iconColor} mr-3`} />
        )}
        <span className={`text-sm font-medium ${textColor}`}>{message}</span>
        <button
          onClick={onHide}
          className={`ml-4 ${textColor} hover:opacity-70`}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function MaterialReplenishView() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterTemplateStatus, setFilterTemplateStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Header management state
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS);
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false);
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
  const apiUrl = "https://global-backfinal.onrender.com/api";

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Helper function to get field value considering both new and old key formats
  const getFieldValue = (item, header) => {
    return header.altKey 
      ? (item[header.id] || item[header.altKey] || "") 
      : (item[header.id] || "");
  };

  // Initialize form data
  const initializeFormData = () => {
    const initialData = {};
    tableHeaders.forEach(header => {
      if (header.id === "status") {
        initialData[header.id] = "Active";
      } else if (header.id === "supplementTemplate") {
        initialData[header.id] = "Complete";
      } else if (header.id === "createTime" || header.id === "updateTime") {
        initialData[header.id] = new Date().toISOString();
      } else {
        initialData[header.id] = "";
      }
    });
    return initialData;
  };

  // Fetch materials data
  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/material-replenishment/get-all`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        const dataWithId = data.data.map(item => ({
          ...item,
          id: item._id || item.id
        }));
        setMaterials(dataWithId);
        setFilteredMaterials(dataWithId);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }

      // Fetch table headers
      try {
        const headerResponse = await fetch(`${apiUrl}/table-headers/get-material?email=${user.email}`, {
          credentials: 'include'
        });
        
        if (headerResponse.ok) {
          const headerData = await headerResponse.json();
          if (headerData.headers) {
            setTableHeaders(headerData.headers);
          }
        }
      } catch (headerError) {
        console.error("Error fetching table headers:", headerError);
        // Use default headers if fetch fails
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch material data");
      
      // Mock data for development/demo
      const mockData = [
        {
          id: "1",
          orderNumber: "ORD001",
          OrderNumber: "ORD001",
          materialCategory: "Electronics",
          MaterialCategory: "Electronics",
          vendor: "ABC Suppliers",
          Vendor: "ABC Suppliers",
          invitee: "John Doe",
          Invitee: "John Doe",
          hostInviterContactInfo: "host@company.com",
          Host: "host@company.com",
          sender: "Jane Smith",
          Sender: "Jane Smith",
          status: "Active",
          Status: "Active",
          supplementTemplate: "Complete",
          SupplementTemplate: "Complete",
          createTime: "2025-07-20T10:00:00Z",
          Created: "2025-07-20T10:00:00Z",
          updateTime: "2025-07-20T10:00:00Z",
          updated: "2025-07-20T10:00:00Z",
          user: "admin@example.com"
        },
        {
          id: "2",
          orderNumber: "ORD002",
          OrderNumber: "ORD002",
          materialCategory: "Raw Materials",
          MaterialCategory: "Raw Materials",
          vendor: "XYZ Industries",
          Vendor: "XYZ Industries",
          invitee: "Sarah Wilson",
          Invitee: "Sarah Wilson",
          hostInviterContactInfo: "contact@xyz.com",
          Host: "contact@xyz.com",
          sender: "Bob Brown",
          Sender: "Bob Brown",
          status: "Pending",
          Status: "Pending",
          supplementTemplate: "Incomplete",
          SupplementTemplate: "Incomplete",
          createTime: "2025-07-22T14:30:00Z",
          Created: "2025-07-22T14:30:00Z",
          updateTime: "2025-07-22T14:30:00Z",
          updated: "2025-07-22T14:30:00Z",
          user: "admin@example.com"
        }
      ];
      setMaterials(mockData);
      setFilteredMaterials(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Filter materials based on search and filter criteria
  useEffect(() => {
    let results = materials;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      if (searchColumn === "All") {
        results = results.filter(material => 
          tableHeaders.some(header => {
            const value = getFieldValue(material, header);
            return value && value.toString().toLowerCase().includes(term);
          })
        );
      } else {
        const selectedHeader = tableHeaders.find(h => h.label === searchColumn);
        if (selectedHeader) {
          results = results.filter(material => {
            const value = getFieldValue(material, selectedHeader);
            return value && value.toString().toLowerCase().includes(term);
          });
        }
      }
    }
    
    if (filterStatus !== "All") {
      results = results.filter(material => {
        const statusHeader = tableHeaders.find(h => h.id === "status");
        const status = getFieldValue(material, statusHeader);
        return status === filterStatus;
      });
    }
    
    if (filterTemplateStatus !== "All") {
      results = results.filter(material => {
        const templateHeader = tableHeaders.find(h => h.id === "supplementTemplate");
        const template = getFieldValue(material, templateHeader);
        return template === filterTemplateStatus;
      });
    }
    
    setFilteredMaterials(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, searchColumn, filterStatus, filterTemplateStatus, materials, tableHeaders]);

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
      editData[header.id] = getFieldValue(material, header);
    });
    setFormData(editData);
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleDelete = (material) => {
    setSelectedMaterial(material);
    setShowDeleteDialog(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      const currentDateTime = new Date().toISOString();
      
      // Map the frontend data structure to match backend expectations
      const rowData = {
        orderNumber: formData.orderNumber || "",
        materialCategory: formData.materialCategory || "",
        vendor: formData.vendor || "",
        invitee: formData.invitee || "",
        hostInviterContactInfo: formData.hostInviterContactInfo || "",
        sender: formData.sender || "",
        status: formData.status || "Active",
        supplementTemplate: formData.supplementTemplate || "Complete",
        updateTime: currentDateTime
      };

      let response;
      if (isEdit) {
        // Update existing row
        response = await fetch(`${apiUrl}/material-replenishment/update-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: selectedMaterial.id,
            data: rowData,
            email: user.email
          })
        });
      } else {
        // Add new row
        rowData.createTime = currentDateTime;
        response = await fetch(`${apiUrl}/material-replenishment/add-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify([rowData, { user: user.email }])
        });
      }

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
      showToast(err.message || "Failed to save material", 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${apiUrl}/material-replenishment/delete-data`, {
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
      showToast(err.message || "Failed to delete material", 'error');
    }
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

  const resetHeadersToDefault = () => {
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
        await fetch(`${apiUrl}/table-headers/update-material`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            headers: tempHeaders,
            email: user.email
          })
        });
        showToast("Table headers updated globally");
      }
      
      setTableHeaders(tempHeaders);
      setShowHeaderModal(false);
    } catch (error) {
      console.error("Error saving header changes:", error);
      showToast("Error saving header changes", "error");
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
      tableHeaders
        .filter(header => header.visible)
        .forEach((header, headerIndex) => {
          const value = getFieldValue(row, header);
          const formattedValue = (header.id === "createTime" || header.id === "updateTime") && value
            ? new Date(value).toLocaleString()
            : value || "";
          
          csvContent += `"${formattedValue}"`;
          if (headerIndex < tableHeaders.filter(h => h.visible).length - 1) {
            csvContent += ",";
          }
        });
      csvContent += "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `material-replenish-data-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredMaterials.length} material records to CSV`);
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
      {/* Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        show={toast.show} 
        onHide={hideToast} 
      />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Replenishment</h1>
            <p className="text-gray-600 mt-1">Stock replenishment requests and approvals</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              disabled={filteredMaterials.length === 0}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={openHeaderModal}
                  className="flex items-center px-4 py-2 text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Columns
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
          >
            <option value="All">All Columns</option>
            {tableHeaders.filter(h => h.visible).map(header => (
              <option key={header.id} value={header.label}>{header.label}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by selected column..."
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
            value={filterTemplateStatus}
            onChange={(e) => setFilterTemplateStatus(e.target.value)}
          >
            <option value="All">All Templates</option>
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
                {DEFAULT_HEADERS.filter(header => header.visible).map(header => (
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
                    {DEFAULT_HEADERS.filter(header => header.visible).map(header => {
                      const value = material[header.id] || "";
                      
                      if (header.id === "Status") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} type="status" />
                          </td>
                        );
                      }
                      
                      if (header.id === "SupplementTemplate") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={value} type="template" />
                          </td>
                        );
                      }
                      
                      if ((header.id === "Created" || header.id === "updated") && value) {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(value).toLocaleString()}
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
                  <td colSpan={DEFAULT_HEADERS.filter(h => h.visible).length + 2} className="px-6 py-4 text-center text-gray-500">
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Order Number:</span>
                    <p className="text-gray-900">{selectedMaterial.OrderNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Material Category:</span>
                    <p className="text-gray-900">{selectedMaterial.MaterialCategory || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Vendor:</span>
                    <p className="text-gray-900">{selectedMaterial.Vendor || "N/A"}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Invitee:</span>
                    <p className="text-gray-900">{selectedMaterial.Invitee || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Host/Inviter:</span>
                    <p className="text-gray-900">{selectedMaterial.Host || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Sender:</span>
                    <p className="text-gray-900">{selectedMaterial.Sender || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Status Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedMaterial.Status} type="status" />
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Supplement Template:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedMaterial.SupplementTemplate} type="template" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Timestamps</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-900">
                      {selectedMaterial.Created 
                        ? new Date(selectedMaterial.Created).toLocaleString() 
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <p className="text-gray-900">
                      {selectedMaterial.updated 
                        ? new Date(selectedMaterial.updated).toLocaleString() 
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {selectedMaterial.user && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Entry Information</h3>
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedMaterial.user}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.OrderNumber || ""}
                onChange={(e) => setFormData({ ...formData, OrderNumber: e.target.value })}
                placeholder="Enter order number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Category
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.MaterialCategory || ""}
                onChange={(e) => setFormData({ ...formData, MaterialCategory: e.target.value })}
                placeholder="Enter material category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.Vendor || ""}
                onChange={(e) => setFormData({ ...formData, Vendor: e.target.value })}
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invitee
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.Invitee || ""}
                onChange={(e) => setFormData({ ...formData, Invitee: e.target.value })}
                placeholder="Enter invitee name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host/Inviter Contact Information
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.Host || ""}
                onChange={(e) => setFormData({ ...formData, Host: e.target.value })}
                placeholder="Enter host contact info"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sender
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.Sender || ""}
                onChange={(e) => setFormData({ ...formData, Sender: e.target.value })}
                placeholder="Enter sender name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.Status || "Active"}
                onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplement Template
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.SupplementTemplate || "Complete"}
                onChange={(e) => setFormData({ ...formData, SupplementTemplate: e.target.value })}
              >
                <option value="Complete">Complete</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedMaterial(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Material"
        message={`Are you sure you want to delete material order "${selectedMaterial?.OrderNumber}"? This action cannot be undone.`}
      />
    </div>
  );
}