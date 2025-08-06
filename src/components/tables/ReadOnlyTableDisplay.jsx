import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Download,
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Calendar,
  Hash,
  Type,
  Mail,
  List,
  Filter,
  Users
} from 'lucide-react';

// API base URL
const API_BASE_URL = "http://localhost:8000";

const ReadOnlyTableDisplay = () => {
  const [tables, setTables] = useState([]);
  const [currentTable, setCurrentTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreator, setShowCreator] = useState(true);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
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

  useEffect(() => {
    loadSavedTables();
  }, []);

  useEffect(() => {
    if (currentTable) {
      loadTableData(currentTable._id);
    }
  }, [currentTable]);

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
    setCurrentPage(1);
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
            isAdmin: true,
            clientId: clientId || user.clientId 
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load tables');
      }

      const data = await response.json();
      setTables(data.tables || []);
      
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
        `${API_BASE_URL}/api/custom-tables/${tableId}/data?email=${encodeURIComponent(user.email)}&isAdmin=true`,
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

  const exportToCSV = () => {
    if (!currentTable || !filteredData.length) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    const headers = currentTable.columns.map(col => col.name);
    const csvHeaders = showCreator ? [...headers, 'Created By'] : headers;
    csvContent += csvHeaders.join(',') + '\n';
    
    filteredData.forEach(row => {
      const rowValues = headers.map(header => {
        const value = row[header];
        return value ? `"${value}"` : "";
      });
      
      if (showCreator) {
        rowValues.push(row.userEmail || "");
      }
      
      csvContent += rowValues.join(',') + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentTable.name}-data-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`Exported ${filteredData.length} records to CSV`);
  };

  const handleEditClick = (record) => {
    setEditingRecord(record);
    setEditFormData({...record});
    setIsModalOpen(true);
  };
  
  const handleEditFormChange = (name, value) => {
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };
  
  const handleSaveEdit = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${currentTable._id}/data/${editingRecord._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            ...editFormData,
            userEmail: user.email,
            isAdmin
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      const result = await response.json();
      const updatedData = tableData.map(record => 
        record._id === editingRecord._id ? result.data : record
      );
      
      setTableData(updatedData);
      showToast("Record updated successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update record:", error);
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
          body: JSON.stringify({ userEmail: user.email, isAdmin })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to delete record');
      }
      
      const updatedData = tableData.filter(record => record._id !== recordId);
      setTableData(updatedData);
      showToast("Record deleted successfully");
    } catch (error) {
      console.error("Failed to delete record:", error);
      showToast("Failed to delete record", "error");
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  // Get unique values for filter dropdowns
  const getUniqueValuesForColumn = (columnName) => {
    if (!tableData.length) return [];
    
    const uniqueValues = [...new Set(tableData.map(record => record[columnName]))]
      .filter(value => value !== undefined && value !== null && value !== '');
    
    return uniqueValues.sort();
  };

  // Get unique users who contributed data
  const getUniqueUsers = () => {
    if (!tableData.length) return [];
    
    const uniqueUsers = [...new Set(tableData.map(record => record.userEmail))]
      .filter(email => email !== undefined && email !== null);
    
    return uniqueUsers.sort();
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

  if (!tables.length) {
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
          {/* Left Side: Table Selector and Title */}
          <div className="flex items-center space-x-4">
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
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentTable?.name || "Select a Table"}
                <span className="text-sm text-gray-500 ml-2 font-normal">
                  (Read-Only View)
                </span>
              </h2>
              {user.email && (
                <p className="text-sm text-gray-500 mt-1">
                  User: {user.email}
                  {clientId && ` | Client: ${clientId}`}
                </p>
              )}
            </div>
          </div>

          {/* Right Side: Controls */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
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

            {/* Clear Search Button */}
            <button 
              onClick={() => setSearchTerm('')}
              disabled={!searchTerm}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            
            {/* Creator Column Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreator(!showCreator)}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showCreator 
                    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {showCreator ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showCreator ? 'Hide Creator' : 'Show Creator'}
              </button>
            </div>
            
            {/* Export CSV */}
            <button 
              onClick={exportToCSV}
              disabled={!filteredData.length}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
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
            <div className="flex flex-wrap gap-3 mb-6">
              {/* User filter dropdown - only show if creator column is visible */}
              {showCreator && getUniqueUsers().length > 1 && (
                <div className="relative">
                  <select 
                    value={filters['userEmail'] || "All"}
                    onChange={(e) => setFilters({...filters, 'userEmail': e.target.value})}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                  >
                    <option value="All">All Users</option>
                    {getUniqueUsers().map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                  <Users className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              )}
              
              {/* Column filters */}
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
                    <Filter className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                ))}
            </div>
            
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
                          <span>{column.name}</span>
                        </div>
                      </th>
                    ))}
                    {/* Only show Creator column if showCreator is true */}
                    {showCreator && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Created By</span>
                        </div>
                      </th>
                    )}
                    {/* Add Actions column for admin users */}
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
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
                        {/* Only show Creator column if showCreator is true */}
                        {showCreator && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.userEmail || "Unknown"}
                          </td>
                        )}
                        {/* Add Actions column for admin users */}
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditClick(row)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit record"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRecord(row._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td 
                        colSpan={currentTable.columns.length + (showCreator ? 1 : 0) + (isAdmin ? 1 : 0)} 
                        className="px-6 py-8 text-center text-gray-500"
                      >
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

      {/* Edit Record Modal */}
      {isModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsModalOpen(false)}></div>
            
            <div className="inline-block w-full max-w-md px-6 py-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Record
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
                    </label>
                    
                    {column.type === 'date' ? (
                      <input
                        type="date"
                        value={editFormData[column.name] ? new Date(editFormData[column.name]).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleEditFormChange(column.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : column.type === 'number' ? (
                      <input
                        type="number"
                        value={editFormData[column.name] || ''}
                        onChange={(e) => handleEditFormChange(column.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : column.type === 'email' ? (
                      <input
                        type="email"
                        value={editFormData[column.name] || ''}
                        onChange={(e) => handleEditFormChange(column.name, e.target.value)}
                        placeholder={`Enter ${column.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editFormData[column.name] || ''}
                        onChange={(e) => handleEditFormChange(column.name, e.target.value)}
                        placeholder={`Enter ${column.name}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
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
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadOnlyTableDisplay;