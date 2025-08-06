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
  Calendar
} from 'lucide-react';

const DEFAULT_HEADERS = [
  { id: "srNo", label: "Sr.No.", visible: true },
  { id: "companyName", label: "Company Name", visible: true, altKey: "CompanyName" },
  { id: "projectName", label: "Project Name", visible: true, altKey: "ProjectName" },
  { id: "date", label: "Date", visible: true, altKey: "Date" },
  { id: "supervisorName", label: "Supervisor Name", visible: true, altKey: "SupervisorName" },
  { id: "managerName", label: "Manager Name", visible: true, altKey: "ManagerName" },
  { id: "prepaidBy", label: "Prepared By", visible: true, altKey: "PrepaidBy" },
  { id: "employees", label: "No. of Employee", visible: true, altKey: "Employee" },
  { id: "workType", label: "Nature of Work", visible: true, altKey: "NatureOfWork" },
  { id: "progress", label: "Progress", visible: true, altKey: "Progress" },
  { id: "hours", label: "Hour of Work", visible: true, altKey: "HourOfWork" }
];

const ProgressBadge = ({ progress }) => {
  let bgColor, textColor;
  
  switch (progress) {
    case "Completed":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      break;
    case "In Progress":
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      break;
    case "Not Started":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {progress}
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

export default function DailyWorkView() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgress, setFilterProgress] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(7);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  // Add dynamic headers state
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_HEADERS);

  const isAdmin = user?.role === 'admin';
  const apiUrl = "https://global-backfinal.onrender.com/api";

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 5000);
  };

  // Fetch table headers from backend/localStorage
  const fetchTableHeaders = async () => {
    try {
      if (!user?.email) {
        console.warn("No user email found, loading from localStorage");
        const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders');
        if (savedHeaders) {
          setTableHeaders(JSON.parse(savedHeaders));
        } else {
          setTableHeaders(DEFAULT_HEADERS);
        }
        return;
      }
      
      const headerResponse = await fetch(
        `${apiUrl}/table-headers/get-daily-work?email=${user.email}`, 
        { credentials: 'include' }
      );
      
      if (headerResponse.ok) {
        const data = await headerResponse.json();
        if (data.headers && Array.isArray(data.headers)) {
          setTableHeaders(data.headers);
          localStorage.setItem('dailyWorkerTableHeaders', JSON.stringify(data.headers));
        } else {
          // Fallback to localStorage
          const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders');
          if (savedHeaders) {
            setTableHeaders(JSON.parse(savedHeaders));
          } else {
            setTableHeaders(DEFAULT_HEADERS);
          }
        }
      } else {
        // Fallback to localStorage
        const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders');
        if (savedHeaders) {
          setTableHeaders(JSON.parse(savedHeaders));
        } else {
          setTableHeaders(DEFAULT_HEADERS);
        }
      }
    } catch (error) {
      console.error("Error fetching table headers:", error);
      // Fallback to localStorage
      const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders');
      if (savedHeaders) {
        try {
          setTableHeaders(JSON.parse(savedHeaders));
        } catch (e) {
          console.error("Error loading saved headers:", e);
          setTableHeaders(DEFAULT_HEADERS);
        }
      } else {
        setTableHeaders(DEFAULT_HEADERS);
      }
    }
  };

  // Initialize form data
  const initializeFormData = () => ({
    companyName: "",
    projectName: "",
    date: "",
    supervisorName: "",
    managerName: "",
    prepaidBy: "",
    employees: "",
    workType: "",
    progress: "In Progress",
    hours: "",
    charges: "0"
  });

  // Fetch reports data
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/dailywork/get-all`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.data)) {
        const dataWithIds = data.data.map((item, index) => ({
          ...item,
          id: item._id,
          srNo: index + 1,
          companyName: item.CompanyName,
          projectName: item.ProjectName,
          date: item.Date,
          supervisorName: item.SupervisorName,
          managerName: item.ManagerName,
          prepaidBy: item.PrepaidBy,
          employees: item.Employee,
          workType: item.NatureOfWork,
          progress: item.Progress,
          hours: item.HourOfWork,
          charges: item.Charges || "0"
        }));
        
        setReports(dataWithIds);
        setFilteredReports(dataWithIds);
        setError(null);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch daily work report data");
      
      // Mock data for development/demo
      const mockData = [
        {
          id: "1",
          srNo: 1,
          companyName: "ABC Construction Ltd",
          projectName: "Building Complex A",
          date: "2025-07-25",
          supervisorName: "John Smith",
          managerName: "Sarah Wilson",
          prepaidBy: "Mike Johnson",
          employees: "15",
          workType: "Construction",
          progress: "In Progress",
          hours: "8",
          charges: "1200",
          user: "admin@example.com",
          createdAt: "2025-07-25T10:00:00Z"
        },
        {
          id: "2",
          srNo: 2,
          companyName: "XYZ Infrastructure",
          projectName: "Road Development",
          date: "2025-07-24",
          supervisorName: "Bob Brown",
          managerName: "Alice Davis",
          prepaidBy: "Tom Wilson",
          employees: "20",
          workType: "Road Work",
          progress: "Completed",
          hours: "10",
          charges: "1800",
          user: "admin@example.com",
          createdAt: "2025-07-24T14:30:00Z"
        }
      ];
      setReports(mockData);
      setFilteredReports(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTableHeaders(); // Fetch headers first
    fetchReports();
  }, []);

  // Listen for header changes from localStorage (when updated from main page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'dailyWorkerTableHeaders' && e.newValue) {
        try {
          const newHeaders = JSON.parse(e.newValue);
          setTableHeaders(newHeaders);
        } catch (error) {
          console.error("Error parsing updated headers:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter reports based on search and filter criteria
  useEffect(() => {
    let results = reports;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(report => 
        (report.companyName || "").toLowerCase().includes(term) ||
        (report.projectName || "").toLowerCase().includes(term) ||
        (report.supervisorName || "").toLowerCase().includes(term) ||
        (report.managerName || "").toLowerCase().includes(term)
      );
    }
    
    if (filterProgress !== "All") {
      results = results.filter(report => report.progress === filterProgress);
    }
    
    setFilteredReports(results);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, filterProgress, reports]);

  // Get paginated data
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredReports.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredReports.length / rowsPerPage);

  // Handle actions
  const handleView = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleAdd = () => {
    if (!user) {
      showNotification("Authentication required. Please login to add data.", "error");
      return;
    }
    setFormData(initializeFormData());
    setShowAddModal(true);
  };

  const handleEdit = (report) => {
    if (!user) {
      showNotification("Authentication required. Please login to edit data.", "error");
      return;
    }
    
    const editData = {
      ...report,
      companyName: report.companyName || report.CompanyName || "",
      projectName: report.projectName || report.ProjectName || "",
      date: report.date || report.Date || "",
      supervisorName: report.supervisorName || report.SupervisorName || "",
      managerName: report.managerName || report.ManagerName || "",
      prepaidBy: report.prepaidBy || report.PrepaidBy || "",
      employees: report.employees || report.Employee || "",
      workType: report.workType || report.NatureOfWork || "",
      progress: report.progress || report.Progress || "In Progress",
      hours: report.hours || report.HourOfWork || "",
      charges: report.charges || "0"
    };
    
    setFormData(editData);
    setSelectedReport(report);
    setShowEditModal(true);
  };

  const handleDelete = (report) => {
    if (!user) {
      showNotification("Authentication required. Please login to delete data.", "error");
      return;
    }
    setSelectedReport(report);
    setShowDeleteDialog(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      if (!user || !user.email) {
        throw new Error("User authentication required");
      }

      // Map the frontend data structure to match backend expectations
      const rowData = {
        CompanyName: formData.companyName || "",
        ProjectName: formData.projectName || "",
        Date: formData.date || "",
        SupervisorName: formData.supervisorName || "",
        ManagerName: formData.managerName || "",
        PrepaidBy: formData.prepaidBy || "",
        Employee: formData.employees || "",
        NatureOfWork: formData.workType || "",
        Progress: formData.progress || "In Progress",
        HourOfWork: formData.hours || "",
        Charges: formData.charges || "0"
      };

      const url = isEdit ? 
        `${apiUrl}/dailywork/update/${selectedReport.id}` : 
        `${apiUrl}/dailywork/add-data`;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? rowData : [rowData, { user: user.email }];

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

      await fetchReports(); // Refresh data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedReport(null);
      setFormData({});
      
      showNotification(
        isEdit ? "Report updated successfully" : "Report added successfully", 
        "success"
      );
    } catch (err) {
      console.error("Error saving report:", err);
      showNotification(err.message || "Failed to save report", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!user || !user.email) {
        throw new Error("User authentication required");
      }
      
      const response = await fetch(`${apiUrl}/dailywork/delete/${selectedReport.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchReports(); // Refresh data
      setShowDeleteDialog(false);
      setSelectedReport(null);
      
      showNotification("Report deleted successfully", "success");
    } catch (err) {
      console.error("Error deleting report:", err);
      showNotification(err.message || "Failed to delete report", "error");
    }
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += tableHeaders
      .filter(header => header.visible)
      .map(header => header.label)
      .join(",") + "\n";
    
    filteredReports.forEach((row) => {
      const csvRow = tableHeaders
        .filter(header => header.visible)
        .map(header => {
          let value = "";
          if (header.altKey) {
            value = row[header.id] || row[header.altKey] || "";
          } else {
            value = row[header.id] || "";
          }
          
          // Handle special formatting
          if (header.id === "date" && value) {
            value = new Date(value).toLocaleDateString();
          }
          
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });
      
      csvContent += csvRow.join(",") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily-worker-report-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Exported ${filteredReports.length} worker report records to CSV`, "success");
  };

  // Get visible headers for rendering
  const getVisibleHeaders = () => {
    return tableHeaders.filter(header => header.visible);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading daily work report data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Daily Work Reports</h1>
            <p className="text-gray-600 mt-1">Manage daily work entries, hours, and progress tracking</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              disabled={filteredReports.length === 0}
              className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                Add Report
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
              placeholder="Search by company, project, supervisor..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterProgress}
            onChange={(e) => setFilterProgress(e.target.value)}
          >
            <option value="All">All Progress</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-3 mt-0.5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />}
            <p>{notification.message}</p>
          </div>
        </div>
      )}

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
          Showing {filteredReports.length} of {reports.length} reports
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {getVisibleHeaders().map(header => (
                  <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getPaginatedData().length > 0 ? (
                getPaginatedData().map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    {getVisibleHeaders().map(header => {
                      const value = header.altKey ? 
                        (report[header.id] || report[header.altKey] || "") : 
                        (report[header.id] || "");
                      
                      if (header.id === "progress") {
                        return (
                          <td key={header.id} className="px-6 py-4 whitespace-nowrap">
                            <ProgressBadge progress={value} />
                          </td>
                        );
                      }
                      
                      if (header.id === "date" && value) {
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
                          onClick={() => handleView(report)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(report)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(report)}
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
                  <td colSpan={getVisibleHeaders().length + 1} className="px-6 py-4 text-center text-gray-500">
                    No report data matching your criteria
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
                    {Math.min(currentPage * rowsPerPage, filteredReports.length)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{filteredReports.length}</span>
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
        title="Daily Work Report Details"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-4">Project Information</h3>
                {getVisibleHeaders().slice(0, Math.ceil(getVisibleHeaders().length / 2)).map(header => {
                  if (header.id === "srNo") return null;
                  
                  const value = header.altKey ? 
                    (selectedReport[header.id] || selectedReport[header.altKey] || "") : 
                    (selectedReport[header.id] || "");
                  
                  let displayValue = value;
                  if (header.id === "date" && value) {
                    displayValue = new Date(value).toLocaleDateString();
                  } else if (header.id === "progress") {
                    return (
                      <div key={header.id}>
                        <span className="block text-sm font-medium text-gray-700">{header.label}:</span>
                        <div className="mt-1">
                          <ProgressBadge progress={value} />
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={header.id}>
                      <span className="block text-sm font-medium text-gray-700">{header.label}:</span>
                      <p className="text-gray-900">{displayValue || "N/A"}</p>
                    </div>
                  );
                })}
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 mb-4">Additional Information</h3>
                {getVisibleHeaders().slice(Math.ceil(getVisibleHeaders().length / 2)).map(header => {
                  if (header.id === "srNo") return null;
                  
                  const value = header.altKey ? 
                    (selectedReport[header.id] || selectedReport[header.altKey] || "") : 
                    (selectedReport[header.id] || "");
                  
                  let displayValue = value;
                  if (header.id === "date" && value) {
                    displayValue = new Date(value).toLocaleDateString();
                  } else if (header.id === "progress") {
                    return (
                      <div key={header.id}>
                        <span className="block text-sm font-medium text-gray-700">{header.label}:</span>
                        <div className="mt-1">
                          <ProgressBadge progress={value} />
                        </div>
                      </div>
                    );
                  } else if (header.id === "hours") {
                    displayValue = value ? `${value} hours` : "N/A";
                  }
                  
                  return (
                    <div key={header.id}>
                      <span className="block text-sm font-medium text-gray-700">{header.label}:</span>
                      <p className="text-gray-900">{displayValue || "N/A"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Entry Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Created by:</span>
                  <p className="text-gray-900">{selectedReport.user || "Unknown"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Created on:</span>
                  <p className="text-gray-900">
                    {selectedReport.createdAt 
                      ? new Date(selectedReport.createdAt).toLocaleString() 
                      : "Unknown date"}
                  </p>
                </div>
              </div>
            </div>
            
            {selectedReport.updatedAt && selectedReport.updatedBy && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Last Update</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Updated by:</span>
                    <p className="text-gray-900">{selectedReport.updatedBy}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated on:</span>
                    <p className="text-gray-900">{new Date(selectedReport.updatedAt).toLocaleString()}</p>
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
        title={showEditModal ? "Edit Daily Work Report" : "Add New Daily Work Report"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getVisibleHeaders().map(header => {
              if (header.id === "srNo") return null;
              
              const fieldValue = formData[header.id] || "";
              const isRequired = ["companyName", "projectName", "date"].includes(header.id);
              
              if (header.id === "progress") {
                return (
                  <div key={header.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {header.label}
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue || "In Progress"}
                      onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                );
              }
              
              if (header.id === "date") {
                return (
                  <div key={header.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {header.label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                      required={isRequired}
                    />
                  </div>
                );
              }
              
              if (header.id === "employees" || header.id === "hours") {
                return (
                  <div key={header.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {header.label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="number"
                      min={header.id === "employees" ? "1" : "0"}
                      step={header.id === "hours" ? "0.5" : "1"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={fieldValue}
                      onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                      placeholder={`Enter ${header.label.toLowerCase()}`}
                      required={isRequired}
                    />
                  </div>
                );
              }
              
              return (
                <div key={header.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {header.label} {isRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={fieldValue}
                    onChange={(e) => setFormData({ ...formData, [header.id]: e.target.value })}
                    placeholder={`Enter ${header.label.toLowerCase()}`}
                    required={isRequired}
                  />
                </div>
              );
            })}
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
              {showEditModal ? "Update" : "Add"} Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedReport(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Daily Work Report"
        message={`Are you sure you want to delete the report for "${selectedReport?.companyName}" - "${selectedReport?.projectName}"? This action cannot be undone.`}
      />
    </div>
  );
}