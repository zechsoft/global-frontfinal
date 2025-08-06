import React, { useState, useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useParams, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Check, 
  Edit, 
  Lock, 
  Unlock,
  ChevronDown,
  AlertCircle,
  Calendar,
  Hash,
  Type,
  Mail,
  List
} from 'lucide-react';
//import CustomTable from "./CustomTableDisplay.js"; // Adjust path if needed

// Define the base API URL for the deployed backend
const API_BASE_URL = "http://localhost:8000";

const TableCustomizer = () => {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState([{ name: "", type: "text", required: true }]);
  const [isPublic, setIsPublic] = useState(false);
  const [savedTables, setSavedTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for editing table schema
  const [editingTable, setEditingTable] = useState(null);
  const [editTableName, setEditTableName] = useState("");
  const [editColumns, setEditColumns] = useState([]);
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Toast state for notifications
  const [toast, setToast] = useState(null);

  const { user } = useAuth();
  const { clientId } = useParams();
  const location = useLocation();
  
  const isAdmin = user?.role === "admin";
  const isClientView = location.pathname.includes('/client/');

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load saved table configurations on component mount
  useEffect(() => {
    loadSavedTables();
  }, [clientId]);

  const loadSavedTables = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use POST to include user email and admin status as in original code
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
      setSavedTables(data.tables || []);
    } catch (error) {
      console.error("Failed to load saved tables:", error);
      setError("Failed to load saved tables. Please check your connection and try again.");
      showToast("Failed to load saved table configurations", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddColumn = () => {
    setColumns([...columns, { name: "", type: "text", required: true }]);
  };

  const handleRemoveColumn = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleCreateTable = async () => {
    // Validate inputs
    if (!tableName.trim()) {
      showToast("Table name is required", "error");
      return;
    }

    // Check if there are columns defined and all have names
    if (columns.length === 0 || columns.some(col => !col.name.trim())) {
      showToast("All columns must have names", "error");
      return;
    }

    // Prepare table configuration exactly as in original code
    const tableConfig = {
      name: tableName,
      columns: columns,
      userEmail: user.email,  // Include creator email
      isPublic: isPublic,     // Include public flag
      clientId: clientId || user.clientId, // Include client context
      createdAt: new Date()
    };

    try {
      // Save the table configuration using original API structure
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/create`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(tableConfig)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create table');
      }

      const data = await response.json();
      
      showToast(`Table "${tableName}" created successfully`);

      // Reset form and reload saved tables
      setTableName("");
      setColumns([{ name: "", type: "text", required: true }]);
      setIsPublic(false);
      await loadSavedTables();
      
      // Optionally activate the newly created table
      if (data.table) {
        setActiveTable(data.table);
      }
    } catch (error) {
      console.error("Error creating table:", error);
      showToast(error.message || "Failed to create table", "error");
    }
  };

  const activateTable = (table) => {
    setActiveTable(table);
  };

  const deleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return;
    }

    try {
      // Include user information for permission check as in original code
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${tableId}`,
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            userEmail: user.email, 
            isAdmin,
            clientId: clientId || user.clientId 
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete table');
      }
      
      showToast("Table deleted successfully");

      // Reset active table if it was deleted
      if (activeTable && activeTable._id === tableId) {
        setActiveTable(null);
      }
      
      // Reload saved tables
      loadSavedTables();
    } catch (error) {
      console.error("Delete table error:", error);
      showToast(error.message || "Failed to delete table", "error");
    }
  };

  const openEditTableModal = (table) => {
    setEditingTable(table);
    setEditTableName(table.name);
    setEditColumns([...table.columns]);
    setEditIsPublic(table.isPublic || false);
    setIsEditModalOpen(true);
  };

  const handleAddEditColumn = () => {
    setEditColumns([...editColumns, { name: "", type: "text", required: true }]);
  };

  const handleRemoveEditColumn = (index) => {
    const newEditColumns = [...editColumns];
    newEditColumns.splice(index, 1);
    setEditColumns(newEditColumns);
  };

  const handleEditColumnChange = (index, field, value) => {
    const newEditColumns = [...editColumns];
    newEditColumns[index][field] = value;
    setEditColumns(newEditColumns);
  };

  const handleUpdateTableSchema = async () => {
    // Validate inputs
    if (!editTableName.trim()) {
      showToast("Table name is required", "error");
      return;
    }

    // Check if there are columns defined and all have names
    if (editColumns.length === 0 || editColumns.some(col => !col.name.trim())) {
      showToast("All columns must have names", "error");
      return;
    }

    // Prepare updated table configuration exactly as in original code
    const updatedTableConfig = {
      name: editTableName,
      columns: editColumns,
      userEmail: user.email,
      isAdmin,
      isPublic: editIsPublic,
      clientId: clientId || user.clientId
    };

    try {
      // Update the table configuration using original API structure
      const response = await fetch(
        `${API_BASE_URL}/api/custom-tables/${editingTable._id}`, 
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updatedTableConfig)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update table schema');
      }

      const data = await response.json();
      
      showToast(`Table "${editTableName}" updated successfully`);

      // Close modal
      setIsEditModalOpen(false);
      
      // Get the updated table data
      const updatedTable = data.table || {
        ...editingTable,
        name: editTableName,
        columns: editColumns,
        isPublic: editIsPublic
      };
      
      // Update active table immediately if it was the one edited
      if (activeTable && activeTable._id === editingTable._id) {
        setActiveTable(updatedTable);
      }
      
      // Then reload all saved tables
      await loadSavedTables();
    } catch (error) {
      console.error("Update table error:", error);
      showToast(error.message || "Failed to update table schema", "error");
    }
  };

  // Updated function to allow admins to edit/delete public tables and their own tables
  const canModifyTable = (table) => {
    return isAdmin || // Admin can edit any table
           (table.createdBy === user.email) || // Owner can edit their own table
           (table.userEmail === user.email) || // Alternative field name check
           (isAdmin && table.isPublic); // Additional check for admin to edit public tables
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Table Customizer</h1>
          <p className="text-gray-600">Create and manage custom data tables for your organization</p>
          {clientId && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Client View: {clientId}
            </div>
          )}
        </div>

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

        {/* Create New Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Table</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {isAdmin && (
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Make Table Public
                    </span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Define Columns</h3>
              
              <div className="space-y-3">
                {columns.map((column, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) => handleColumnChange(index, "name", e.target.value)}
                        placeholder="Column name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="w-40">
                      <div className="relative">
                        <select
                          value={column.type}
                          onChange={(e) => handleColumnChange(index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="email">Email</option>
                          <option value="select">Dropdown</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div className="w-32">
                      <div className="relative">
                        <select
                          value={column.required}
                          onChange={(e) => handleColumnChange(index, "required", e.target.value === "true")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                          <option value="true">Required</option>
                          <option value="false">Optional</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveColumn(index)}
                      disabled={columns.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleAddColumn}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </button>
            </div>
            
            <button
              onClick={handleCreateTable}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4 mr-2" />
              Create Table
            </button>
          </div>
        </div>

        {/* Saved Tables Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Saved Table Configurations</h2>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading saved tables...</p>
              </div>
            ) : error ? (
              <div className="flex items-center p-4 text-red-800 bg-red-50 rounded-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            ) : savedTables.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedTables.map((table) => (
                  <div 
                    key={table._id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      activeTable && activeTable._id === table._id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{table.name}</h3>
                      <div className="flex items-center space-x-1">
                        {table.isPublic ? (
                          <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            <Unlock className="w-3 h-3 mr-1" />
                            Public
                          </div>
                        ) : (
                          <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{table.columns.length} columns</p>
                    
                    {table.createdBy && (
                      <p className="text-xs text-gray-500 mb-2">
                        Created by: {(table.createdBy === user.email || table.userEmail === user.email) ? "You" : (table.createdBy || table.userEmail)}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-4">
                      Created: {new Date(table.createdAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => activateTable(table)}
                        className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                          activeTable && activeTable._id === table._id
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {activeTable && activeTable._id === table._id ? "Active" : "Use Table"}
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditTableModal(table)}
                          disabled={!canModifyTable(table)}
                          className="p-1 text-teal-600 hover:bg-teal-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTable(table._id)}
                          disabled={!canModifyTable(table)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600">No saved tables found. Create one above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Active Table Section */}
        {activeTable && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Working with "{activeTable.name}"
                </h2>
                <div className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </div>
                {activeTable.isPublic && (
                  <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Public
                  </div>
                )}
              </div>
            </div>
            {/* <div className="p-6">
              <CustomTable key={`table-${activeTable._id}-${JSON.stringify(activeTable.columns)}`} table={activeTable} />
            </div> */}
          </div>
        )}

        {/* Edit Table Schema Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsEditModalOpen(false)}></div>
              
              <div className="inline-block w-full max-w-4xl px-6 py-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit Table Schema: {editingTable?.name}
                    </h3>
                    {editingTable?.isPublic && isAdmin && editingTable?.createdBy !== user.email && (
                      <div className="mt-1 inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Admin Edit of Public Table
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center p-4 mb-6 text-amber-800 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div className="text-sm">
                    <strong>Warning:</strong> Changing column types or removing columns may affect existing data. 
                    Adding new columns or making columns optional is safer.
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Table Name
                      </label>
                      <input
                        type="text"
                        value={editTableName}
                        onChange={(e) => setEditTableName(e.target.value)}
                        placeholder="Enter table name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    {isAdmin && (
                      <div className="flex items-center">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsPublic}
                            onChange={(e) => setEditIsPublic(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            editIsPublic ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              editIsPublic ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-700">
                            Make Table Public
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Columns</h4>
                    
                    <div className="space-y-3">
                      {editColumns.map((column, index) => (
                        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={column.name}
                              onChange={(e) => handleEditColumnChange(index, "name", e.target.value)}
                              placeholder="Column name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div className="w-40">
                            <div className="relative">
                              <select
                                value={column.type}
                                onChange={(e) => handleEditColumnChange(index, "type", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="email">Email</option>
                                <option value="select">Dropdown</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          
                          <div className="w-32">
                            <div className="relative">
                              <select
                                value={column.required}
                                onChange={(e) => handleEditColumnChange(index, "required", e.target.value === "true")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                              >
                                <option value="true">Required</option>
                                <option value="false">Optional</option>
                              </select>
                              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveEditColumn(index)}
                            disabled={editColumns.length === 1}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={handleAddEditColumn}
                      className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Column
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTableSchema}
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
    </div>
  );
};

export default TableCustomizer;