import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Plus,
  Trash2,
  Facebook,
  Twitter,
  Instagram,
  ExternalLink,
  Building
} from 'lucide-react'

export default function Profile() {
  const { user, getAuthToken } = useAuth()
  const [activeSection, setActiveSection] = useState('overview')
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [profileImage, setProfileImage] = useState('/api/placeholder/150/150')
  const [isLoading, setIsLoading] = useState(false)
  
  // Profile state
  const [profileInfo, setProfileInfo] = useState({
    fullName: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    location: user?.location || '',
    bio: user?.bio || 'Welcome to my profile! I\'m passionate about creating amazing experiences.',
    companyName: user?.companyName || 'Global India Corporation'
  })

  // Projects state
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [notification, setNotification] = useState(null)

  // Load user profile and projects on component mount
  useEffect(() => {
    if (user?.email) {
      loadUserProfile()
      loadUserProjects()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("https://global-backfinal.onrender.com/api/get-user-profile", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          const userData = data.user
          
          // Update profile info
          setProfileInfo({
            fullName: userData.userName || userData.displayName || userData.name || '',
            mobile: userData.mobile || '',
            email: userData.Email || userData.email || '',
            location: userData.location || '',
            bio: userData.bio || 'Welcome to my profile! I\'m passionate about creating amazing experiences.',
            companyName: userData.companyName || 'Global India Corporation'
          })
          
          // Update profile image - Cloudinary URLs don't need modification
          if (userData.profileImage) {
            setProfileImage(userData.profileImage)
          }
        }
      } else {
        throw new Error('Failed to load profile')
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      showNotification('Failed to load profile data', 'error')
      
      // Fallback to user data from context
      if (user.profileImage) {
        setProfileImage(user.profileImage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProjects = async () => {
    try {
      const response = await fetch("https://global-backfinal.onrender.com/api/get-projects", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ email: user.email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.projects) {
          // Format projects - Cloudinary URLs don't need modification
          const formattedProjects = data.projects.map(project => ({
            ...project,
            id: project._id || project.id,
            image: project.image || '/api/placeholder/400/300',
            status: project.status || 'Planning'
          }))
          
          setProjects(formattedProjects)
        }
      } else {
        throw new Error('Failed to load projects')
      }
    } catch (error) {
      console.error("Error loading projects:", error)
      showNotification('Failed to load projects', 'error')
    }
  }

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleEditProfileClick = () => {
    if (isProfileEditing) {
      saveProfileInfo()
    } else {
      setIsProfileEditing(true)
    }
  }

  const saveProfileInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("https://global-backfinal.onrender.com/api/edit-user", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ data: profileInfo })
      })

      if (response.ok) {
        // Update localStorage/sessionStorage with new user data
        const updatedUser = {
          ...user,
          name: profileInfo.fullName,
          email: profileInfo.email,
          mobile: profileInfo.mobile,
          location: profileInfo.location,
          bio: profileInfo.bio,
          companyName: profileInfo.companyName
        }
        
        if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser))
        }
        
        setIsProfileEditing(false)
        showNotification('Profile updated successfully!')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      showNotification('Failed to update profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileInfoChange = (e) => {
    const { name, value } = e.target
    setProfileInfo(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please select a valid image file', 'error')
        return
      }

      try {
        const formData = new FormData()
        formData.append("profileImage", file)
        formData.append("email", profileInfo.email)
        
        setIsLoading(true)
        const response = await fetch("https://global-backfinal.onrender.com/api/upload-profile-image", {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          },
          credentials: 'include',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          
          // Update localStorage with the new Cloudinary URL
          const updatedUser = { ...user, profileImage: data.imageUrl }
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(updatedUser))
          } else {
            sessionStorage.setItem("user", JSON.stringify(updatedUser))
          }
          
          // Update profile image state with Cloudinary URL
          setProfileImage(data.imageUrl)
          showNotification('Profile image updated successfully!')
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload image')
        }
      } catch (error) {
        console.error("Error uploading image:", error)
        showNotification(error.message || 'Failed to upload profile image', 'error')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleProjectAction = (project, action) => {
    if (action === 'edit') {
      setSelectedProject(project)
      setShowProjectModal(true)
    } else if (action === 'delete') {
      handleDeleteProject(project.id)
    }
  }

  const handleAddProject = () => {
    setSelectedProject({
      id: null,
      name: '',
      description: '',
      image: '/api/placeholder/400/300',
      status: 'Planning'
    })
    setShowProjectModal(true)
  }

  const handleSaveProject = async () => {
    if (!selectedProject?.name || !selectedProject?.description) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    try {
      setIsLoading(true)
      let response

      if (selectedProject.id) {
        // Update existing project
        response = await fetch("https://global-backfinal.onrender.com/api/update-project", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          credentials: 'include',
          body: JSON.stringify({
            project: {
              id: selectedProject.id,
              name: selectedProject.name,
              description: selectedProject.description,
              status: selectedProject.status,
              image: selectedProject.image
            },
            email: profileInfo.email
          })
        })
      } else {
        // Add new project
        response = await fetch("https://global-backfinal.onrender.com/api/add-project", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          credentials: 'include',
          body: JSON.stringify({
            project: {
              name: selectedProject.name,
              description: selectedProject.description,
              status: selectedProject.status,
              image: selectedProject.image
            },
            email: profileInfo.email
          })
        })
      }

      if (response.ok) {
        const data = await response.json()
        
        if (selectedProject.id) {
          // Update existing project in state
          setProjects(prev => 
            prev.map(p => p.id === selectedProject.id ? { ...selectedProject } : p)
          )
          showNotification('Project updated successfully!')
        } else {
          // Add new project to state
          const newProject = {
            ...selectedProject,
            id: data.projectId || Date.now()
          }
          setProjects(prev => [...prev, newProject])
          showNotification('Project added successfully!')
        }
        
        setShowProjectModal(false)
        setSelectedProject(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save project')
      }
    } catch (error) {
      console.error("Error saving project:", error)
      showNotification(error.message || 'Failed to save project', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("https://global-backfinal.onrender.com/api/delete-project", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({
          projectId: projectId,
          email: profileInfo.email
        })
      })

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
        showNotification('Project deleted successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error("Error deleting project:", error)
      showNotification(error.message || 'Failed to delete project', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle project image upload
  const handleProjectImageUpload = async (file) => {
    if (!file || !selectedProject?.id) return

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size must be less than 5MB', 'error')
      return
    }

    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file', 'error')
      return
    }

    try {
      const formData = new FormData()
      formData.append("projectImage", file)
      formData.append("projectId", selectedProject.id)
      
      const response = await fetch("https://global-backfinal.onrender.com/api/upload-project-image", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedProject(prev => ({ ...prev, image: data.imageUrl }))
        showNotification('Project image updated successfully!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload project image')
      }
    } catch (error) {
      console.error("Error uploading project image:", error)
      showNotification(error.message || 'Failed to upload project image', 'error')
    }
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'info', label: 'Information', icon: Edit3 },
    { id: 'projects', label: 'Projects', icon: ExternalLink }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Loading...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            {/* Profile Info */}
            <div className="flex flex-col md:flex-row items-center mb-6 md:mb-0">
              <div className="relative mb-4 md:mb-0 md:mr-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/api/placeholder/150/150'
                    }}
                  />
                </div>
                {isProfileEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {profileInfo.fullName}
                </h1>
                <p className="text-gray-600 mb-2">{profileInfo.email}</p>
                <div className="flex items-center justify-center md:justify-start text-sm text-gray-500 space-x-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profileInfo.location || 'Location not set'}
                  </div>
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-1" />
                    {profileInfo.companyName}
                  </div>
                </div>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="flex flex-wrap justify-center gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <section.icon className="w-4 h-4 mr-2" />
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Sections */}
        {activeSection === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Profile Information Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-6">{profileInfo.bio}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700 w-20">Name:</span>
                    <span className="text-gray-600">{profileInfo.fullName}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700 w-20">Mobile:</span>
                    <span className="text-gray-600">{profileInfo.mobile || 'Not set'}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700 w-20">Email:</span>
                    <span className="text-gray-600">{profileInfo.email}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700 w-20">Location:</span>
                    <span className="text-gray-600">{profileInfo.location || 'Not set'}</span>
                  </div>

                  <div className="flex items-center">
                    <Building className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="font-medium text-gray-700 w-20">Company:</span>
                    <span className="text-gray-600">{profileInfo.companyName}</span>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="pt-6 border-t">
                  <h3 className="font-medium text-gray-700 mb-3">Social Media</h3>
                  <div className="flex space-x-3">
                    <a href="#" className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
                <button
                  onClick={() => setActiveSection('projects')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No projects yet</p>
                    <button
                      onClick={() => setActiveSection('projects')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Add your first project
                    </button>
                  </div>
                ) : (
                  projects.slice(0, 3).map((project) => (
                    <div key={project.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-12 h-12 rounded-lg object-cover mr-4"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300'
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{project.description}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'info' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isProfileEditing ? 'Edit Profile Information' : 'Profile Information'}
              </h2>
              <button
                onClick={handleEditProfileClick}
                disabled={isLoading}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  isProfileEditing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProfileEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                )}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isProfileEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={profileInfo.fullName}
                      onChange={handleProfileInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile
                  </label>
                  {isProfileEditing ? (
                    <input
                      type="tel"
                      name="mobile"
                      value={profileInfo.mobile}
                      onChange={handleProfileInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.mobile || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  {isProfileEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileInfo.email}
                      onChange={handleProfileInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isProfileEditing ? (
                    <input
                      type="text"
                      name="location"
                      value={profileInfo.location}
                      onChange={handleProfileInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.location || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isProfileEditing ? (
                    <textarea
                      name="bio"
                      value={profileInfo.bio}
                      onChange={handleProfileInfoChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.bio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  {isProfileEditing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={profileInfo.companyName}
                      onChange={handleProfileInfoChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-600">{profileInfo.companyName}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Projects</h2>
                <p className="text-gray-600">Manage your project portfolio</p>
              </div>
              <button
                onClick={handleAddProject}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your first project to showcase your work</p>
                <button
                  onClick={handleAddProject}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Project
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/api/placeholder/400/300'
                      }}
                    />
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleProjectAction(project, 'edit')}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleProjectAction(project, 'delete')}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {selectedProject?.id ? 'Edit Project' : 'Add New Project'}
                </h3>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={selectedProject?.name || ''}
                    onChange={(e) => setSelectedProject(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={selectedProject?.description || ''}
                    onChange={(e) => setSelectedProject(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedProject?.status || 'Planning'}
                    onChange={(e) => setSelectedProject(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        if (selectedProject?.id) {
                          // If editing existing project, upload to Cloudinary
                          handleProjectImageUpload(file)
                        } else {
                          // If new project, just show preview (will be uploaded when project is saved)
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setSelectedProject(prev => ({ 
                              ...prev, 
                              image: reader.result,
                              imageFile: file 
                            }))
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {selectedProject?.image && (
                    <div className="mt-3">
                      <img
                        src={selectedProject.image}
                        alt="Project preview"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveProject}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Save Project'}
                </button>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-white hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}