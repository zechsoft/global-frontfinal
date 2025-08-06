import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Download,
  Plus,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Calendar,
  Hash,
  Type,
  Mail,
  List
} from 'lucide-react';

// API base URL
const API_BASE_URL = "http://localhost:8000";

const CustomisedTable = ({ table }) => {
  const [tables, setTables] = useState([]);
  const [currentTable, setCurrentTable] = useState(table || null);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [newRecord, setNewRecord] = useState({});
  const [editingRecord, setEditingRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { clientId } = useParams();
  
  const rowsPerPage = 10;
  const isAdmin = user?.role === "admin";

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load saved table configurations when component mounts
  useEffect(() => {
    if (!table) {
      loadSavedTables();
    }
  }, [table]);

  // Load table data when current table changes
  useEffect(() => {
    if (currentTable) {
      loadTableData(currentTable._id);
    }
  }, [currentTable]);

  // Apply filters when search term or filters change
  useEffect(() => {
    if (!tableData.length) {
      setFilteredData([]);
      return;
    }

    let results = [...tableData];
    
    // Apply search filter across all columns
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(record => {
        return Object.values(record).some(value => 
          value && value.toString().toLowerCase().includes(term)
        );
      });
    }
    
    // Apply column-specific filters
    Object.entries(filters).forEach(([column, value]) => {
      if (value && value !== "All") {
        results = results.filter(record => 
          record[column] && record[column].toString() === value
        );
      }
    });
    
    setFilteredData(results);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, filters, tableData]);

  const loadSavedTables = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/get-all`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            email: user.email, 
            isAdmin,
            clientId: clientId || user.clientId 
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }

      const data = await response.json();
      setTables(data.tables || []);
      
      // Set first table as current if available
      if (data.tables && data.tables.length > 0) {
        setCurrentTable(data.tables[0]);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load saved tables:", error);
      setError("Failed to load saved table configurations");
      setIsLoading(false);
      showToast("Failed to load saved table configurations", "error");
    }
  };

  const loadTableData = async (tableId) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${tableId}/data?email=${encodeURIComponent(user.email)}`,
        {
          method: 'GET',
          credentials: 'include'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load table data');
      }

      const data = await response.json();
      setTableData(data.records || []);
      setFilteredData(data.records || []);
      
      // Reset search and filters
      setSearchTerm("");
      setFilters({});
      setCurrentPage(1);
      
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load table data:", error);
      setError("Failed to load table data");
      setIsLoading(false);
      showToast("Failed to load table data", "error");
    }
  };

  const navigateToReadOnlyView = () => {
    if (!currentTable) return;
    
    const userRole = user.role || "client";
    navigate(`/${userRole}/readonly-table-display`);
  };

  const handleAddRecord = async () => {
    try {
      // Validate required fields
      const missingFields = currentTable.columns
        .filter(col => col.required)
        .filter(col => !newRecord[col.name]);
        
      if (missingFields.length > 0) {
        showToast(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`, "error");
        return;
      }
      
      // Include user info when adding record
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${currentTable._id}/data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ ...newRecord, userEmail: user.email })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to add record');
      }
      
      showToast("Record added successfully");
      
      // Reload table data
      loadTableData(currentTable._id);
      
      // Close modal and reset form
      setIsModalOpen(false);
      setNewRecord({});
    } catch (error) {
      console.error("Add record error:", error);
      showToast("Failed to add record", "error");
    }
  };

  const handleUpdateRecord = async () => {
    try {
      // Validate required fields
      const missingFields = currentTable.columns
        .filter(col => col.required)
        .filter(col => !editingRecord[col.name]);
        
      if (missingFields.length > 0) {
        showToast(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`, "error");
        return;
      }
      
      // Include user info when updating
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${currentTable._id}/data/${editingRecord._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ ...editingRecord, userEmail: user.email })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update record');
      }
      
      showToast("Record updated successfully");
      
      // Reload table data
      loadTableData(currentTable._id);
      
      // Close modal and reset form
      setIsModalOpen(false);
      setEditingRecord(null);
    } catch (error) {
      console.error("Update record error:", error);
      showToast("Failed to update record", "error");
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${currentTable._id}/data/${recordId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ userEmail: user.email })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      
      showToast("Record deleted successfully");
      
      // Reload table data
      loadTableData(currentTable._id);
    } catch (error) {
      console.error("Delete record error:", error);
      showToast("Failed to delete record", "error");
    }
  };

  const exportToCSV = () => {
    if (!currentTable || !filteredData.length) return;
    
    // Create CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add column headers
    const headers = currentTable.columns.map(col => col.name);
    csvContent += headers.join(',') + '\n';
    
    // Add data rows
    filteredData.forEach(row => {
      const rowValues = headers.map(header => {
        const value = row[header];
        // Handle commas in text values by quoting
        return value ? `"${value}"` : "";
      });
      csvContent += rowValues.join(',') + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentTable.name}-data-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredData.length} records to CSV`);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  const handleInputChange = (field, value) => {
    if (editingRecord) {
      setEditingRecord({
        ...editingRecord,
        [field]: value
      });
    } else {
      setNewRecord({
        ...newRecord,
        [field]: value
      });
    }
  };

  const openAddModal = () => {
    setEditingRecord(null);
    setNewRecord({});
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setNewRecord({});
    setEditingRecord({...record});
    setIsModalOpen(true);
  };

  // Get unique values for filter dropdowns
  const getUniqueValuesForColumn = (columnName) => {
    if (!tableData.length) return [];
    
    const uniqueValues = [...new Set(tableData.map(record => record[columnName]))]
      .filter(value => value !== undefined && value !== null && value !== '');
    
    return uniqueValues.sort();
  };

  const getColumnIcon = (type) => {
    switch (type) {
      case 'number': return <Hash className="w-4 h-4" />;
      case 'date': return <Calendar className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'select': return <List className="w-4 h-4" />;
      default: return <Type className="w-4 h-4" />;
    }
  };

  const formatCellValue = (value, type) => {
    if (!value) return '';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return Number(value).toLocaleString();
      default:
        return value;
    }
  };

  if (isLoading && !currentTable) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span className="text-gray-600">Loading tables...</span>
      </div>
    );
  }

  if (error && !currentTable && !tables.length) {
    return (
      <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }

  if (!tables.length && !table) {
    return (
      <div className="flex items-center p-4 text-blue-800 bg-blue-50 rounded-lg">
        <AlertCircle className="w-5 h-5 mr-2" />
        No custom tables found. Please create a table first.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {/* Left Side: Table Selection and Info */}
          <div className="flex items-center space-x-4">
            {!table && (
              <div className="relative">
                <select
                  value={currentTable?._id || ''}
                  onChange={(e) => {
                    const selectedTable = tables.find(t => t._id === e.target.value);
                    setCurrentTable(selectedTable);
                  }}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a Table</option>
                  {tables.map(table => (
                    <option key={table._id} value={table._id}>
                      {table.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentTable?.name || "Select a Table"}
              </h2>
              {user.email && (
                <p className="text-sm text-gray-500">
                  User: {user.email}
                  {clientId && ` | Client: ${clientId}`}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Button */}
            <button
              onClick={navigateToReadOnlyView}
              disabled={!currentTable}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </button>

            {/* Add New */}
            <button
              onClick={openAddModal}
              disabled={!currentTable}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </button>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              disabled={!filteredData.length}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && currentTable ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading data...</span>
          </div>
        ) : currentTable ? (
          <>
            {/* Filter dropdowns */}
            {currentTable.columns.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {currentTable.columns
                  .filter(col => {
                    const uniqueValues = getUniqueValuesForColumn(col.name);
                    return uniqueValues.length > 1 && uniqueValues.length < 20;
                  })
                  .map(column => (
                    <div key={column.name} className="relative">
                      <select
                        value={filters[column.name] || "All"}
                        onChange={(e) => setFilters({...filters, [column.name]: e.target.value})}
                        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
                      >
                        <option value="All">All {column.name}</option>
                        {getUniqueValuesForColumn(column.name).map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ))}
              </div>
            )}
            
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Showing {currentRows.length} of {filteredData.length} records
                {filteredData.length !== tableData.length && ` (filtered from ${tableData.length} total)`}
              </p>
              
              {/* Pagination Info */}
              {totalPages > 1 && (
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {currentTable.columns.map(column => (
                      <th
                        key={column.name}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        <div className="flex items-center space-x-2">
                          {getColumnIcon(column.type)}
                          <span>
                            {column.name}
                            {column.required && <span className="text-red-500 ml-1">*</span>}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentRows.length > 0 ? (
                    currentRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {currentTable.columns.map(column => (
                          <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCellValue(row[column.name], column.type)}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(row)}
                              disabled={row.userEmail && row.userEmail !== user.email && !isAdmin}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(row._id)}
                              disabled={row.userEmail && row.userEmail !== user.email && !isAdmin}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentTable.columns.length + 1} className="px-6 py-8 text-center text-gray-500">
                        No data found matching current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Select a table to view data</p>
          </div>
        )}
      </div>

      {/* Add/Edit Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="inline-block w-full max-w-md px-6 py-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRecord ? "Edit Record" : "Add New Record"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {currentTable?.columns.map(column => (
                  <div key={column.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {column.name}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {column.type === 'text' && (
                      <input
                        type="text"
                        value={editingRecord ? editingRecord[column.name] || '' : newRecord[column.name] || ''}
                        onChange={(e) => handleInputChange(column.name, e.target.value)}
                        placeholder={`Enter ${column.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {column.type === 'number' && (
                      <input
                        type="number"
                        value={editingRecord ? editingRecord[column.name] || '' : newRecord[column.name] || ''}
                        onChange={(e) => handleInputChange(column.name, e.target.value)}
                        placeholder={`Enter ${column.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {column.type === 'date' && (
                      <input
                        type="date"
                        value={editingRecord ? 
                          (editingRecord[column.name] ? new Date(editingRecord[column.name]).toISOString().split('T')[0] : '') : 
                          (newRecord[column.name] ? new Date(newRecord[column.name]).toISOString().split('T')[0] : '')
                        }
                        onChange={(e) => handleInputChange(column.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {column.type === 'email' && (
                      <input
                        type="email"
                        value={editingRecord ? editingRecord[column.name] || '' : newRecord[column.name] || ''}
                        onChange={(e) => handleInputChange(column.name, e.target.value)}
                        placeholder={`Enter ${column.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                    
                    {column.type === 'select' && (
                      <div className="relative">
                        <select
                          value={editingRecord ? editingRecord[column.name] || '' : newRecord[column.name] || ''}
                          onChange={(e) => handleInputChange(column.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select {column.name}</option>
                          {getUniqueValuesForColumn(column.name).map(value => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingRecord ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomisedTable; 