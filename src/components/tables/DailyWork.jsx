import { useState, useEffect, useRef } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Calendar, Clock, Eye, Settings, ChevronUp, ChevronDown, Download, MenuIcon, ArrowUp, ArrowDown } from 'lucide-react'

// Mock auth context - replace with your actual auth implementation
const useAuth = () => {
  return {
    user: JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user")) || {
      email: "admin@example.com",
      role: "admin",
      name: "Admin User"
    }
  }
}

// Updated API base URL
const API_BASE_URL = "https://global-backfinal.onrender.com"

// Default table headers configuration for Daily Work Report
const DEFAULT_DAILY_WORK_HEADERS = [
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
]

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

export default function DailyWork() {
  const { user } = useAuth()
  const [workEntries, setWorkEntries] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('2025-07-25')
  const [country, setCountry] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [showAddHeaderModal, setShowAddHeaderModal] = useState(false)
  const [showTableOptionsMenu, setShowTableOptionsMenu] = useState(false) // Added this state
  const [editingWork, setEditingWork] = useState(null)
  const [selectedReportDetails, setSelectedReportDetails] = useState(null)
  const [rowToDelete, setRowToDelete] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false) // Added this state
  const [tableHeaders, setTableHeaders] = useState(DEFAULT_DAILY_WORK_HEADERS)
  const [tempHeaders, setTempHeaders] = useState([])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState("")
  const [saveAsGlobal, setSaveAsGlobal] = useState(false) // Added this state
  const [newHeaderInfo, setNewHeaderInfo] = useState({
    id: "",
    label: "",
    visible: true,
    altKey: ""
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState(null) // Added toast state
  
  const [newRow, setNewRow] = useState({
    companyName: "",
    projectName: "",
    supervisorName: "",
    managerName: "",
    prepaidBy: "",
    employees: "",
    workType: "",
    progress: "",
    hours: "",
    charges: "",
    date: "",
  })

  const isAdmin = user?.role === "admin"

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
    const csvRows = filteredData.map(work => {
      return visibleHeaders.map(header => {
        const value = header.altKey 
          ? (work[header.id] || work[header.altKey] || "") 
          : (work[header.id] || "");
        
        // Handle dates
        if (header.id === "date" && value) {
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
    link.setAttribute('download', `daily_work_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Data exported successfully", "success");
  };

  useEffect(() => {
    fetchData()
    fetchDailyWorkHeaders()
  }, [])

  const fetchDailyWorkHeaders = async () => {
    try {
      if (!user?.email) {
        console.warn("No user email found, cannot fetch personalized headers")
        const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders')
        if (savedHeaders) {
          setTableHeaders(JSON.parse(savedHeaders))
        } else {
          setTableHeaders(DEFAULT_DAILY_WORK_HEADERS)
        }
        return
      }
      
      const headerResponse = await fetch(
        `${API_BASE_URL}/api/table-headers/get-daily-work?email=${user.email}`, 
        { credentials: 'include' }
      )
      
      if (headerResponse.ok) {
        const data = await headerResponse.json()
        if (data.headers) {
          setTableHeaders(data.headers)
          localStorage.setItem('dailyWorkerTableHeaders', JSON.stringify(data.headers))
        } else {
          const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders')
          if (savedHeaders) {
            setTableHeaders(JSON.parse(savedHeaders))
          } else {
            setTableHeaders(DEFAULT_DAILY_WORK_HEADERS)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching daily work table headers:", error)
      const savedHeaders = localStorage.getItem('dailyWorkerTableHeaders')
      if (savedHeaders) {
        try {
          setTableHeaders(JSON.parse(savedHeaders))
        } catch (e) {
          console.error("Error loading saved headers:", e)
          setTableHeaders(DEFAULT_DAILY_WORK_HEADERS)
        }
      } else {
        setTableHeaders(DEFAULT_DAILY_WORK_HEADERS)
      }
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `${API_BASE_URL}/api/dailywork/get-data`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({"email": user.email})
        }
      )

      if (response.ok) {
        const data = await response.json()
        const formattedData = data.map((item, index) => ({
          id: index + 1,
          srNo: index + 1,
          companyName: item.CompanyName,
          projectName: item.ProjectName,
          supervisorName: item.SupervisorName,
          managerName: item.ManagerName,
          prepaidBy: item.PrepaidBy,
          employees: item.Employee,
          workType: item.NatureofWork,
          progress: item.Progress,
          hours: item.HourofWork,
          charges: item.Charges || "0",
          date: item.Date,
          user: item.user,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy
        }))

        setWorkEntries(formattedData)
        setFilteredData(formattedData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      showToast("Failed to load daily work reports", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!newRow.companyName) errors.companyName = "Company name is required"
    if (!newRow.projectName) errors.projectName = "Project name is required"
    if (!newRow.date) errors.date = "Date is required"
    
    if (newRow.employees && isNaN(Number(newRow.employees))) {
      errors.employees = "Must be a number"
    }
    
    if (newRow.progress && (isNaN(Number(newRow.progress)) || Number(newRow.progress) < 0 || Number(newRow.progress) > 100)) {
      errors.progress = "Must be a number between 0-100"
    }
    
    if (newRow.hours && isNaN(Number(newRow.hours))) {
      errors.hours = "Must be a number"
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveRow = async() => {
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      if (editingWork) {
        const formattedData = [
          {
            CompanyName: newRow.companyName,
            ProjectName: newRow.projectName,
            SupervisorName: newRow.supervisorName,
            ManagerName: newRow.managerName,
            PrepaidBy: newRow.prepaidBy,
            Employee: newRow.employees,
            NatureofWork: newRow.workType,
            Progress: newRow.progress,
            HourofWork: newRow.hours,
            Charges: newRow.charges || "0",
            Date: newRow.date,
            id: editingWork.id
          },
          {
            user: user.email
          }
        ]
        
        const response = await fetch(
          `${API_BASE_URL}/api/dailywork/update-data`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formattedData)
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const updatedRow = { 
              ...newRow, 
              id: editingWork.id,
              updatedAt: new Date(),
              updatedBy: user.email 
            }
            
            const updatedTableData = workEntries.map((row) =>
              row.id === editingWork.id ? updatedRow : row
            )
            
            setWorkEntries(updatedTableData)
            setFilteredData(updatedTableData)
            showToast("Work report updated successfully", "success")
          }
        }
      } else {
        const formattedData = [
          {
            CompanyName: newRow.companyName,
            ProjectName: newRow.projectName,
            SupervisorName: newRow.supervisorName,
            ManagerName: newRow.managerName,
            PrepaidBy: newRow.prepaidBy,
            Employee: newRow.employees,
            NatureofWork: newRow.workType,
            Progress: newRow.progress,
            HourofWork: newRow.hours,
            Charges: newRow.charges || "0",
            Date: newRow.date
          },
          {
            user: user.email
          }
        ]
        
        const response = await fetch(
          `${API_BASE_URL}/api/dailywork/add-data`, 
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(formattedData)
          }
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const newRecord = result.data
            const newWorkEntry = { 
              id: workEntries.length + 1,
              srNo: workEntries.length + 1,
              companyName: newRecord.CompanyName,
              projectName: newRecord.ProjectName,
              supervisorName: newRecord.SupervisorName,
              managerName: newRecord.ManagerName,
              prepaidBy: newRecord.PrepaidBy,
              employees: newRecord.Employee,
              workType: newRecord.NatureofWork,
              progress: newRecord.Progress,
              hours: newRecord.HourofWork,
              charges: newRecord.Charges,
              date: newRecord.Date,
              user: newRecord.user,
              createdAt: newRecord.createdAt
            }
            
            const updatedTableData = [...workEntries, newWorkEntry]
            setWorkEntries(updatedTableData)
            setFilteredData(updatedTableData)
            showToast("Work report added successfully", "success")
          }
        }
      }
      
      setShowModal(false)
      setEditingWork(null)
      setNewRow({
        companyName: "",
        projectName: "",
        supervisorName: "",
        managerName: "",
        prepaidBy: "",
        employees: "",
        workType: "",
        progress: "",
        hours: "",
        charges: "",
        date: "",
      })
    } catch(error) {
      console.error("Error saving data:", error)
      showToast("Failed to save data. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (work) => {
    setEditingWork(work)
    setNewRow({...work})
    setShowModal(true)
    setFieldErrors({})
  }

  const confirmDelete = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dailywork/delete-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ id: rowToDelete, user: user.email })
        }
      )

      if (response.ok) {
        const updatedTableData = workEntries.filter((row) => row.id !== rowToDelete)
        setWorkEntries(updatedTableData)
        setFilteredData(updatedTableData)
        showToast("Report deleted", "success")
      }
    } catch (error) {
      console.error("Error deleting row:", error)
      showToast("Failed to delete report", "error")
    } finally {
      setShowDeleteDialog(false)
      setRowToDelete(null)
    }
  }

  const handleDelete = (id) => {
    setRowToDelete(id)
    setShowDeleteDialog(true)
  }

  const handleAdd = () => {
    setEditingWork(null)
    setShowModal(true)
    setNewRow({
      companyName: "",
      projectName: "",
      supervisorName: "",
      managerName: "",
      prepaidBy: "",
      employees: "",
      workType: "",
      progress: "",
      hours: "",
      charges: "",
      date: "",
    })
    setFieldErrors({})
  }

  const handleViewDetails = (row) => {
    setSelectedReportDetails(row)
    setShowViewModal(true)
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredData(workEntries)
      return
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase()
    
    if (country === "All") {
      const filtered = workEntries.filter((row) =>
        row.employees?.toString().includes(lowerSearchTerm) ||
        row.workType?.toLowerCase().includes(lowerSearchTerm) ||
        row.progress?.toString().includes(lowerSearchTerm) ||
        row.companyName?.toLowerCase().includes(lowerSearchTerm) ||
        row.projectName?.toLowerCase().includes(lowerSearchTerm)
      )
      setFilteredData(filtered)
    } else {
      const filtered = workEntries.filter((row) => {
        switch (country) {
          case "No. of Employees":
            return row.employees?.toString().includes(lowerSearchTerm)
          case "Nature of Work":
            return row.workType?.toLowerCase().includes(lowerSearchTerm)
          case "Progress":
            return row.progress?.toString().includes(lowerSearchTerm)
          default:
            return true
        }
      })
      setFilteredData(filtered)
    }
  }

  const handleClear = () => {
    setSearchTerm("")
    setCountry("All")
    setFilteredData(workEntries)
  }

  const handleInputChange = (field, value) => {
    setNewRow({ ...newRow, [field]: value })
    
    if (fieldErrors[field]) {
      setFieldErrors({
        ...fieldErrors,
        [field]: null
      })
    }
  }

  // Header management functions
  const openHeaderModal = () => {
    setTempHeaders([...tableHeaders])
    setShowHeaderModal(true)
    setEditingHeader(null)
    setSaveAsGlobal(false)
  }

  const handleHeaderVisibilityChange = (index) => {
    const updatedHeaders = [...tempHeaders]
    updatedHeaders[index].visible = !updatedHeaders[index].visible
    setTempHeaders(updatedHeaders)
  }

  const handleEditHeaderLabel = (index) => {
    setEditingHeader(index)
    setNewHeaderName(tempHeaders[index].label)
  }

  const saveHeaderLabel = () => {
    if (editingHeader !== null && newHeaderName.trim()) {
      const updatedHeaders = [...tempHeaders]
      updatedHeaders[editingHeader].label = newHeaderName.trim()
      setTempHeaders(updatedHeaders)
      setEditingHeader(null)
      setNewHeaderName("")
    }
  }

  const moveHeader = (index, direction) => {
    if ((direction < 0 && index === 0) || (direction > 0 && index === tempHeaders.length - 1)) {
      return
    }
    
    const updatedHeaders = [...tempHeaders]
    const temp = updatedHeaders[index]
    updatedHeaders[index] = updatedHeaders[index + direction]
    updatedHeaders[index + direction] = temp
    setTempHeaders(updatedHeaders)
  }

  const deleteHeader = (index) => {
    if (!isAdmin) return
    
    const updatedHeaders = [...tempHeaders]
    updatedHeaders.splice(index, 1)
    setTempHeaders(updatedHeaders)
  }

  const saveHeaderChanges = async () => {
    setIsSaving(true)
    try {
      if (!user?.email) {
        showToast("User email not available", "error")
        return
      }
      
      const payload = {
        headers: tempHeaders,
        email: user.email,
        isGlobal: isAdmin && saveAsGlobal
      }
      
      const response = await fetch(`${API_BASE_URL}/api/table-headers/update-daily-work`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        setTableHeaders(tempHeaders)
        setShowHeaderModal(false)
        
        // Handle localStorage based on whether it's global or personal
        if (payload.isGlobal) {
          localStorage.removeItem('dailyWorkerTableHeaders')
          showToast("Global table headers updated successfully! All users will see these changes.", "success")
        } else {
          localStorage.setItem('dailyWorkerTableHeaders', JSON.stringify(tempHeaders))
          showToast("Personal table headers updated successfully!", "success")
        }
      }
    } catch (error) {
      console.error("Error saving daily work header changes:", error)
      showToast("Failed to update table headers", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const saveNewHeader = () => {
    if (!newHeaderInfo.id || !newHeaderInfo.label) {
      showToast("Header ID and Label are required", "error")
      return
    }
    
    const newHeader = {
      id: newHeaderInfo.id,
      label: newHeaderInfo.label,
      visible: true,
      altKey: newHeaderInfo.altKey || null
    }
    
    setTempHeaders([...tempHeaders, newHeader])
    setShowAddHeaderModal(false)
    
    setNewHeaderInfo({
      id: "",
      label: "",
      visible: true,
      altKey: ""
    })
  }

  const resetHeadersToDefault = () => {
    setTempHeaders([...DEFAULT_DAILY_WORK_HEADERS])
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Completed': return 'bg-gray-100 text-gray-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress) => {
    switch (progress) {
      case 'Processing': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalHours = filteredData.reduce((sum, work) => sum + (parseFloat(work.hours) || 0), 0)
  const activeCount = filteredData.filter(w => w.status === 'Active' || w.status === 'In Progress').length

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Work Report</h1>
          <p className="text-gray-500">See information about daily work reports</p>
        </div>
        <div className="flex space-x-2">
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
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Report</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">•</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredData.filter(w => w.status === 'Completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All</option>
                <option value="No. of Employees">No. of Employees</option>
                <option value="Nature of Work">Nature of Work</option>
                <option value="Progress">Progress</option>
              </select>
              
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
                <button 
                  onClick={handleClear}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {tableHeaders
                  .filter(header => header.visible)
                  .map(header => (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header.label}
                    </th>
                  ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length > 0 ? filteredData.map((work) => (
                <tr key={work.id} className="hover:bg-gray-50">
                  {tableHeaders
                    .filter(header => header.visible)
                    .map(header => (
                      <td key={header.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {header.altKey 
                          ? (work[header.id] || work[header.altKey] || "") 
                          : (work[header.id] || "")}
                      </td>
                    ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(work)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(work)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(work.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={tableHeaders.filter(h => h.visible).length + 1} className="px-6 py-8 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center p-4 border-t">
          <span className="text-sm text-gray-500">
            Page {currentPage} of {Math.ceil(filteredData.length / 10) || 1}
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(filteredData.length / 10)}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingWork ? 'Edit Work Report' : 'Add New Work Report'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newRow.companyName || ""}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.companyName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newRow.projectName || ""}
                  onChange={(e) => handleInputChange("projectName", e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.projectName && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.projectName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={newRow.supervisorName || ""}
                  onChange={(e) => handleInputChange("supervisorName", e.target.value)}
                  placeholder="Enter supervisor name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  value={newRow.managerName || ""}
                  onChange={(e) => handleInputChange("managerName", e.target.value)}
                  placeholder="Enter manager name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prepared By
                </label>
                <input
                  type="text"
                  value={newRow.prepaidBy || ""}
                  onChange={(e) => handleInputChange("prepaidBy", e.target.value)}
                  placeholder="Enter prepared by"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. of Employee
                </label>
                <input
                  type="number"
                  value={newRow.employees || ""}
                  onChange={(e) => handleInputChange("employees", e.target.value)}
                  placeholder="Enter number of employees"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.employees && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.employees}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nature of Work
                </label>
                <input
                  type="text"
                  value={newRow.workType || ""}
                  onChange={(e) => handleInputChange("workType", e.target.value)}
                  placeholder="Enter nature of work"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newRow.progress || ""}
                  onChange={(e) => handleInputChange("progress", e.target.value)}
                  placeholder="Enter progress percentage"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.progress && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.progress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hour of Work
                </label>
                <input
                  type="number"
                  min="0"
                  value={newRow.hours || ""}
                  onChange={(e) => handleInputChange("hours", e.target.value)}
                  placeholder="Enter hours of work"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.hours && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.hours}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newRow.date || ""}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fieldErrors.date && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.date}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRow}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (editingWork ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Work Report Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {selectedReportDetails && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Entry Information</h4>
                  <div className="space-y-1">
                    <div className="flex">
                      <span className="font-medium w-24">Created by:</span>
                      <span>{selectedReportDetails.user || "Unknown"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Created on:</span>
                      <span>
                        {selectedReportDetails.createdAt 
                          ? new Date(selectedReportDetails.createdAt).toLocaleString() 
                          : "Unknown date"}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedReportDetails.updatedAt && selectedReportDetails.updatedBy && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-2">Last Update</h4>
                    <div className="space-y-1">
                      <div className="flex">
                        <span className="font-medium w-24">Updated by:</span>
                        <span>{selectedReportDetails.updatedBy}</span>
                      </div>
                      <div className="flex">
                        <span className="font-medium w-24">Updated on:</span>
                        <span>{new Date(selectedReportDetails.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end mt-6">
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
            <h3 className="text-lg font-semibold mb-4">Delete Work Report</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this work report? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
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
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">Configure which columns are visible and their order</p>
              <div className="flex space-x-2">
                {isAdmin && (
                  <button
                    onClick={() => setShowAddHeaderModal(true)}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
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
  )
}