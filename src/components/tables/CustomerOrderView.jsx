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
  DollarSign
} from 'lucide-react';

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
];

const StatusBadge = ({ status, type = "delivery" }) => {
  let bgColor, textColor;
  
  if (type === "delivery") {
    switch (status) {
      case "Complete":
      case "Completed":
      case "Delivered":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "Pending":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case "Cancelled":
      case "Rejected":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      case "In Transit":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case "Delayed":
        bgColor = "bg-orange-100";
        textColor = "text-orange-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }
  } else if (type === "order") {
    switch (status) {
      case "Fulfilled":
      case "Completed":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "Processing":
        bgColor = "bg-blue-100";
        textColor = "text-blue-800";
        break;
      case "Delayed":
        bgColor = "bg-orange-100";
        textColor = "text-orange-800";
        break;
      case "Cancelled":
      case "Rejected":
        bgColor = "bg-red-100";
        textColor = "text-red-800";
        break;
      case "New":
        bgColor = "bg-purple-100";
        textColor = "text-purple-800";
        break;
      default:
        bgColor = "bg-gray-100";
        textColor = "text-gray-800";
    }
  } else if (type === "acceptance") {
    switch (status) {
      case "Accepted":
        bgColor = "bg-green-100";
        textColor = "text-green-800";
        break;
      case "Pending":
        bgColor = "bg-yellow-100";
        textColor = "text-yellow-800";
        break;
      case "Rejected":
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

export default function CustomerOrderView() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS); // Dynamic headers
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState("All");
  const [filterOrderStatus, setFilterOrderStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({});

  const isAdmin = user?.role === 'admin';
  const apiUrl = "https://global-backfinal.onrender.com/api";

  // Fetch table headers configuration
  const fetchCustomerOrderHeaders = async () => {
    try {
      if (!user?.email) {
        console.warn("No user email found, using default headers");
        setTableHeaders(DEFAULT_HEADERS);
        return;
      }
      
      const headerResponse = await fetch(
        `${apiUrl}/table-headers/get-customer-order?email=${user.email}`, 
        { credentials: 'include' }
      );
      
      if (headerResponse.ok) {
        const data = await headerResponse.json();
        if (data.headers && Array.isArray(data.headers)) {
          setTableHeaders(data.headers);
        } else {
          setTableHeaders(DEFAULT_HEADERS);
        }
      } else {
        console.warn("Failed to fetch headers, using defaults");
        setTableHeaders(DEFAULT_HEADERS);
      }
    } catch (error) {
      console.error("Error fetching customer order table headers:", error);
      setTableHeaders(DEFAULT_HEADERS);
    }
  };

  // Initialize form data based on current headers
  const initializeFormData = () => {
    const initialData = {};
    tableHeaders.forEach(header => {
      if (header.id === "deliveryStatus") {
        initialData[header.id] = "Pending";
      } else if (header.id === "orderStatus") {
        initialData[header.id] = "Processing";
      } else if (header.id === "acceptanceStatus") {
        initialData[header.id] = "Pending";
      } else if (header.id === "statementStatus") {
        initialData[header.id] = "Pending";
      } else {
        initialData[header.id] = "";
      }
    });
    return initialData;
  };

  // Fetch orders data
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/customer/get-all`, {
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
        setOrders(dataWithId);
        setFilteredOrders(dataWithId);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch customer order data");
      
      // Mock data for development/demo
      const mockData = [
        {
          id: "1",
          customerNumber: "CUST001",
          customer: "ABC Manufacturing Ltd",
          buyer: "John Smith",
          platformNo: "PLT001",
          poNo: "PO-2025-001",
          purchaseDate: "2025-07-20",
          orderAmount: "15000.00",
          currency: "USD",
          purchasingDepartment: "Procurement",
          purchaser: "Jane Doe",
          requisitionBusinessGroup: "Manufacturing",
          deliveryStatus: "Complete",
          orderStatus: "Fulfilled",
          acceptanceStatus: "Accepted",
          statementStatus: "Generated",
          user: "admin@example.com",
          createdAt: "2025-07-20T10:00:00Z"
        },
        {
          id: "2",
          customerNumber: "CUST002",
          customer: "XYZ Industries",
          buyer: "Sarah Wilson",
          platformNo: "PLT002",
          poNo: "PO-2025-002",
          purchaseDate: "2025-07-22",
          orderAmount: "25000.00",
          currency: "EUR",
          purchasingDepartment: "Supply Chain",
          purchaser: "Bob Brown",
          requisitionBusinessGroup: "Operations",
          deliveryStatus: "Pending",
          orderStatus: "Processing",
          acceptanceStatus: "Pending",
          statementStatus: "Pending",
          user: "admin@example.com",
          createdAt: "2025-07-22T14:30:00Z"
        }
      ];
      setOrders(mockData);
      setFilteredOrders(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrderHeaders();
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search and filter criteria
  useEffect(() => {
    let results = orders;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(order => 
        tableHeaders.some(header => {
          if (!header.visible) return false;
          const value = order[header.id] || "";
          return value.toString().toLowerCase().includes(term);
        })
      );
    }
    
    if (filterDeliveryStatus !== "All") {
      results = results.filter(order => order.deliveryStatus === filterDeliveryStatus);
    }
    
    if (filterOrderStatus !== "All") {
      results = results.filter(order => order.orderStatus === filterOrderStatus);
    }
    
    setFilteredOrders(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterDeliveryStatus, filterOrderStatus, orders, tableHeaders]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);

  // Handle actions
  const handleView = (order) => {
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleAdd = () => {
    setFormData(initializeFormData());
    setShowAddModal(true);
  };

  const handleEdit = (order) => {
    const editData = {};
    tableHeaders.forEach(header => {
      editData[header.id] = order[header.id] || "";
    });
    setFormData(editData);
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDelete = (order) => {
    setSelectedOrder(order);
    setShowDeleteDialog(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      const currentDateTime = new Date().toISOString();
      const orderData = {
        ...formData,
        updateTime: currentDateTime
      };

      if (!isEdit) {
        orderData.createTime = currentDateTime;
      }

      const url = isEdit ? 
        `${apiUrl}/customer/update-data` : 
        `${apiUrl}/customer/add-data`;
      
      const body = isEdit ? 
        { data: { ...orderData, id: selectedOrder.id }, email: user.email } : 
        [orderData, { user: user.email }];

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

      await fetchOrders(); // Refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedOrder(null);
      setFormData({});
    } catch (err) {
      console.error("Error saving order:", err);
      setError(err.message || "Failed to save order");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`${apiUrl}/customer/delete-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id: selectedOrder.id, email: user.email })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchOrders(); // Refresh data
      setShowDeleteDialog(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Error deleting order:", err);
      setError(err.message || "Failed to delete order");
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "#," + tableHeaders
      .filter(header => header.visible)
      .map(header => header.label)
      .join(",") + "\n";
    
    filteredOrders.forEach((row, index) => {
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
    link.setAttribute("download", `customer-orders-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render form field based on header type
  const renderFormField = (header) => {
    if (header.id === "deliveryStatus") {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData[header.id] || "Pending"}
          onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
        >
          <option value="Pending">Pending</option>
          <option value="Complete">Complete</option>
          <option value="Cancelled">Cancelled</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
      );
    } else if (header.id === "orderStatus") {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData[header.id] || "Processing"}
          onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
        >
          <option value="Processing">Processing</option>
          <option value="Fulfilled">Fulfilled</option>
          <option value="Delayed">Delayed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="New">New</option>
          <option value="Completed">Completed</option>
        </select>
      );
    } else if (header.id === "acceptanceStatus") {
      return (
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData[header.id] || "Pending"}
          onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
        >
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
      );
    } else {
      return (
        <input
          type={header.id === "purchaseDate" ? "date" : header.id === "orderAmount" ? "number" : "text"}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData[header.id] || ""}
          onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
          placeholder={`Enter ${header.label.toLowerCase()}`}
          step={header.id === "orderAmount" ? "0.01" : undefined}
          min={header.id === "orderAmount" ? "0" : undefined}
        />
      );
    }
  };

  // Render table cell based on header type
  const renderTableCell = (header, order) => {
    const value = order[header.id] || "";
    
    if (header.id === "deliveryStatus") {
      return <StatusBadge status={value} type="delivery" />;
    }
    
    if (header.id === "orderStatus") {
      return <StatusBadge status={value} type="order" />;
    }

    if (header.id === "acceptanceStatus") {
      return <StatusBadge status={value} type="acceptance" />;
    }

    if (header.id === "statementStatus") {
      return <StatusBadge status={value} type="delivery" />;
    }
    
    if (header.id === "purchaseDate" && value) {
      return new Date(value).toLocaleDateString();
    }
    
    if (header.id === "orderAmount" && value) {
      return (
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 text-green-600 mr-1" />
          {Number(value).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
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
          <p className="mt-4 text-gray-600">Loading customer orders...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Orders</h1>
            <p className="text-gray-600 mt-1">Manage customer orders, deliveries, and payments</p>
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
                onClick={handleAdd}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Order
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
              placeholder="Search by customer, PO number, buyer..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterDeliveryStatus}
            onChange={(e) => setFilterDeliveryStatus(e.target.value)}
          >
            <option value="All">All Delivery Status</option>
            <option value="Complete">Complete</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterOrderStatus}
            onChange={(e) => setFilterOrderStatus(e.target.value)}
          >
            <option value="All">All Order Status</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Processing">Processing</option>
            <option value="Delayed">Delayed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="New">New</option>
            <option value="Completed">Completed</option>
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
          Showing {filteredOrders.length} of {orders.length} customer orders
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
                getPaginatedData().map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </td>
                    {tableHeaders.filter(header => header.visible).map(header => (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {renderTableCell(header, order)}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(order)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order)}
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
                    No customer orders matching your criteria
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
                    {Math.min(currentPage * rowsPerPage, filteredOrders.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredOrders.length}</span>
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
        title="Customer Order Details"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Entry Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedOrder.user || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created on:</span>
                  <p className="text-gray-900">
                    {selectedOrder.createdAt 
                      ? new Date(selectedOrder.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedOrder.updatedAt && selectedOrder.updatedBy && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Last Update</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Updated by:</span>
                    <p className="text-gray-900">{selectedOrder.updatedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated on:</span>
                    <p className="text-gray-900">{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Order Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {tableHeaders.filter(header => header.visible).map(header => (
                  <div key={header.id}>
                    <span className="font-medium text-gray-700">{header.label}:</span>
                    <div className="text-gray-900 mt-1">
                      {header.id === "orderAmount" && selectedOrder[header.id] ? (
                        <span className="font-medium">
                          {selectedOrder.currency || ""} {Number(selectedOrder[header.id]).toLocaleString()}
                        </span>
                      ) : header.id === "deliveryStatus" || header.id === "orderStatus" || 
                           header.id === "acceptanceStatus" || header.id === "statementStatus" ? (
                        renderTableCell(header, selectedOrder)
                      ) : (
                        selectedOrder[header.id] || "-"
                      )}
                    </div>
                  </div>
                ))}
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
        title={showEditModal ? "Edit Customer Order" : "Add New Customer Order"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tableHeaders.filter(header => header.visible).map(header => (
            <div key={header.id} className={header.id === "requisitionBusinessGroup" ? "md:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {header.label}
              </label>
              {renderFormField(header)}
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
            {showEditModal ? "Update" : "Add"} Order
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedOrder(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Customer Order"
        message={`Are you sure you want to delete the order "${selectedOrder?.poNo || selectedOrder?.customerNumber}" for customer "${selectedOrder?.customer}"? This action cannot be undone.`}
      />
    </div>
  );
}