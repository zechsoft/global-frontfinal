import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing user session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      console.log('AuthProvider - Checking existing session...');
      try {
        // Check localStorage first (remember me)
        let storedUser = localStorage.getItem("user")
        let storedToken = localStorage.getItem("token")
        
        console.log('AuthProvider - localStorage user:', !!storedUser);
        console.log('AuthProvider - localStorage token:', !!storedToken);
        
        if (!storedUser) {
          // Check sessionStorage if not in localStorage
          storedUser = sessionStorage.getItem("user")
          storedToken = sessionStorage.getItem("token")
          
          console.log('AuthProvider - sessionStorage user:', !!storedUser);
          console.log('AuthProvider - sessionStorage token:', !!storedToken);
        }
        
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          console.log('AuthProvider - Restored user:', userData);
          setUser(userData)
          setToken(storedToken)
        } else {
          console.log('AuthProvider - No stored user found');
        }
      } catch (error) {
        console.error('AuthProvider - Error parsing stored user data:', error)
        // Clear invalid data
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("token")
      }
      setIsLoading(false)
    }

    checkExistingSession()
  }, [])

  // API login function
  const login = async (email, password, rememberMe = false) => {
    try {
      const data = { email, password }
      
      console.log('AuthProvider - Login attempt for:', email)
      
      const response = await fetch("http://localhost:8000/api/login", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      console.log('AuthProvider - Login response status:', response.status)

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (parseError) {
          console.error('AuthProvider - Error parsing error response:', parseError)
          const errorText = await response.text()
          console.log('AuthProvider - Error response text:', errorText)
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const userData = await response.json()
      console.log('AuthProvider - Login successful, user data:', userData)
      
      // Extract token from response
      const authToken = userData.token
      
      // Create user object with consistent structure
      const userInfo = {
        id: userData.id || userData._id,
        _id: userData.id || userData._id, // Keep both for compatibility
        email: userData.displayMail || userData.email,
        Email: userData.displayMail || userData.email, // Keep both for compatibility
        role: userData.role,
        isAuthenticated: userData.isAuthenticated || true,
        mobile: userData.mobile,
        userName: userData.displayName || userData.name, // Consistent with backend
        name: userData.displayName || userData.name,
        location: userData.location,
        bio: userData.bio,
        info: userData.bio, // Keep both for compatibility
        companyName: userData.companyName || 'Global India Corporation',
        clientId: userData.clientId || (userData.role === 'client' ? userData.id : null)
      }

      console.log('AuthProvider - Processed user info:', userInfo)

      // Store user info and token based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem("user", JSON.stringify(userInfo))
      if (authToken) {
        storage.setItem("token", authToken)
      }

      // Update context state
      setUser(userInfo)
      setToken(authToken)
      
      console.log('AuthProvider - User set in context successfully')
      
      return { success: true, user: userInfo }
      
    } catch (error) {
      console.error('AuthProvider - Login error:', error)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.')
      }
      throw error
    }
  }

  // Fallback login for demo purposes (when API is not available)
  const demoLogin = (email, password) => {
    const users = {
      // Admin user - can access all client data
      'admin@example.com': {
        id: 'admin-1',
        _id: 'admin-1',
        email: 'admin@example.com',
        Email: 'admin@example.com',
        role: 'admin',
        userName: 'Admin User',
        name: 'Admin User',
        companyName: 'Global India Corporation',
        isAuthenticated: true
      },
      
      // Client users - each has their own data space
      'client1@example.com': {
        id: 'client-1',
        _id: 'client-1',
        email: 'client1@example.com',
        Email: 'client1@example.com',
        role: 'client',
        userName: 'Client User 1',
        name: 'Client User 1',
        companyName: 'ABC Manufacturing Ltd',
        clientId: 'CLIENT001',
        isAuthenticated: true
      },
      'client2@example.com': {
        id: 'client-2',
        _id: 'client-2',
        email: 'client2@example.com',
        Email: 'client2@example.com',
        role: 'client',
        userName: 'Client User 2',
        name: 'Client User 2',
        companyName: 'XYZ Industries Pvt Ltd',
        clientId: 'CLIENT002',
        isAuthenticated: true
      },
      'client3@example.com': {
        id: 'client-3',
        _id: 'client-3',
        email: 'client3@example.com',
        Email: 'client3@example.com',
        role: 'client',
        userName: 'Client User 3',
        name: 'Client User 3',
        companyName: 'PQR Enterprises',
        clientId: 'CLIENT003',
        isAuthenticated: true
      }
    }

    // Simple password validation (use 'password' for demo)
    if (users[email] && password === 'password') {
      const demoToken = `demo-token-${Date.now()}`
      console.log('AuthProvider - Demo login successful for:', email)
      setUser(users[email])
      setToken(demoToken)
      sessionStorage.setItem("user", JSON.stringify(users[email]))
      sessionStorage.setItem("token", demoToken)
      return { success: true, user: users[email] }
    }
    throw new Error('Invalid email or password')
  }

  const logout = async () => {
    try {
      console.log('AuthProvider - Logging out...')
      // Call logout API endpoint to invalidate server-side session
      await fetch("http://localhost:8000/api/logout", { 
        credentials: 'include',
        method: 'POST'
      })
    } catch (error) {
      console.log('AuthProvider - Logout API call failed:', error)
    }
    
    // Clear local state and storage
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token")
    console.log('AuthProvider - Logout completed')
  }

  // Helper function to get current auth token
  const getAuthToken = () => {
    if (token) return token
    
    // Fallback: try to get from storage
    return localStorage.getItem("token") || sessionStorage.getItem("token")
  }

  // API call helper with authentication
  const authenticatedApiCall = async (url, options = {}) => {
    const authToken = getAuthToken()
    
    console.log('AuthProvider - Making authenticated API call to:', url)
    console.log('AuthProvider - Token available:', !!authToken)
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      credentials: 'include'
    }
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    }
    
    const response = await fetch(url, mergedOptions)
    
    if (response.status === 401) {
      console.log('AuthProvider - Authentication failed, logging out')
      // Token expired or invalid, logout user
      logout()
      throw new Error('Authentication required. Please login.')
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('AuthProvider - API call failed:', response.status, errorText)
      throw new Error(`API call failed: ${response.status}`)
    }
    
    const result = await response.json()
    console.log('AuthProvider - API call successful')
    return result
  }

  // Get all clients (admin only)
  const getAllClients = () => {
    if (user?.role !== 'admin') return []
    
    return [
      { id: 'client-1', name: 'Client User 1', companyName: 'ABC Manufacturing Ltd', clientId: 'CLIENT001', email: 'client1@example.com' },
      { id: 'client-2', name: 'Client User 2', companyName: 'XYZ Industries Pvt Ltd', clientId: 'CLIENT002', email: 'client2@example.com' },
      { id: 'client-3', name: 'Client User 3', companyName: 'PQR Enterprises', clientId: 'CLIENT003', email: 'client3@example.com' },
      { id: 'client-4', name: 'Client User 4', companyName: '123 Solutions Inc', clientId: 'CLIENT004', email: 'client4@example.com' },
      { id: 'client-5', name: 'Client User 5', companyName: 'DEF Technologies', clientId: 'CLIENT005', email: 'client5@example.com' }
    ]
  }

  // Check if user can access specific client data
  const canAccessClientData = (clientId) => {
    if (user?.role === 'admin') return true
    if (user?.role === 'client' && user?.clientId === clientId) return true
    return false
  }

  // Get current client context (for data filtering)
  const getCurrentClientContext = () => {
    if (user?.role === 'admin') {
      return 'ALL_CLIENTS'
    }
    if (user?.role === 'client') {
      return user.clientId
    }
    return null
  }

  const value = {
    user,
    token,
    getAuthToken,
    login,
    demoLogin,
    logout,
    getAllClients,
    canAccessClientData,
    getCurrentClientContext,
    authenticatedApiCall,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}