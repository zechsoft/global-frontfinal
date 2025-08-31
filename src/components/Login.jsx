import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, demoLogin, user } = useAuth()
  
  // All hooks must be called unconditionally at the top level
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showScrollDown, setShowScrollDown] = useState(true)
  const [scrollY, setScrollY] = useState(0)

  // Refs for animated sections
  const aboutSectionRef = useRef(null)
  const missionSectionRef = useRef(null)
  const projectsSectionRef = useRef(null)

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate])

  // Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      if (window.scrollY > window.innerHeight / 3 && showScrollDown) {
        setShowScrollDown(false)
        setIsModalOpen(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [showScrollDown])

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 27) {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'initial'
    setError('') // Clear any errors when closing modal
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all required fields')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)
    
    try {
      // Try API login first
      const result = await login(email, password, rememberMe)
      
      if (result.success) {
        console.log('Login successful! Redirecting...')
        // Navigation will be handled by the useEffect above when user state changes
        const redirectPath = result.user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'
        navigate(redirectPath, { replace: true })
      }
    } catch (err) {
      console.error('API Login failed:', err)
      
      // If API login fails, try demo login for development
      try {
        console.log('Trying demo login...')
        const demoResult = await demoLogin(email, password)
        
        if (demoResult.success) {
          console.log('Demo login successful! Redirecting...')
          const redirectPath = demoResult.user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'
          navigate(redirectPath, { replace: true })
        }
      } catch (demoErr) {
        console.error('Demo login also failed:', demoErr)
        setError(err.message || 'Login failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate animation trigger based on scroll position
  const inViewThreshold = 100
  const isAboutInView = scrollY > ((aboutSectionRef.current?.offsetTop || 0) - window.innerHeight + inViewThreshold)
  const isMissionInView = scrollY > ((missionSectionRef.current?.offsetTop || 0) - window.innerHeight + inViewThreshold)
  const isProjectsInView = scrollY > ((projectsSectionRef.current?.offsetTop || 0) - window.innerHeight + inViewThreshold)

  // If user is logged in, show loading or redirect
  if (user) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-green-600 mb-4">Login Successful!</h2>
          <p className="text-gray-600 mb-4">
            Redirecting to {user.role === 'admin' ? 'Admin' : 'Client'} Dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Main component content
  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* Hero Section with Background */}
      <div 
        className="w-full h-screen relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12')"
        }}
      >
        {/* Overlay with company logo and name */}
        <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col justify-center items-center text-white">
          <h1 
            className="text-4xl md:text-6xl font-bold text-center mb-6 animate-fade-in-up"
            style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
          >
            GLOBAL INDIA CORPORATION
          </h1>
          
          <p 
            className="text-xl md:text-2xl text-center max-w-4xl mb-10 animate-fade-in"
            style={{ animationDelay: '1s', animationFillMode: 'both' }}
          >
            Where Engineering Meets Precision - Because Everything is Possible
          </p>
          
          <button
            className="px-10 py-4 text-lg bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 animate-scale-in"
            style={{ animationDelay: '1.5s', animationFillMode: 'both' }}
            onClick={openModal}
          >
            LOGIN TO PORTAL
          </button>
        </div>
      </div>
      
      {/* Scroll down indicator */}
      {showScrollDown && (
        <div className="fixed bottom-[10%] left-1/2 transform -translate-x-1/2 flex flex-col items-center text-white text-xl md:text-2xl font-bold z-10 animate-bounce">
          EXPLORE MORE
          <ChevronDown className="w-9 h-9 mt-2" />
        </div>
      )}

      {/* About Section */}
      <div 
        ref={aboutSectionRef} 
        className="w-full min-h-[80vh] bg-gray-50 py-20"
      >
        <div className="flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto px-6 gap-10">
          <div 
            className={`w-full lg:w-1/2 transition-all duration-800 ${
              isAboutInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20'
            }`}
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-6">
              About Global India Corporation
            </h2>
            <p className="text-lg mb-4">
              Global India Corporation (GIC) is a leading multi-disciplinary engineering contracting and manpower supply company, established in 2016. We specialize in Electrical, Mechanical (HVAC), Civil, Demolition, and IT Networking services, delivering reliable solutions to industrial and commercial clients across various sectors.
            </p>
            <p className="text-lg mb-4">
              With a strong focus on quality, safety, and timely execution, GIC has earned a reputation for supporting complex engineering requirements with efficiency and professionalism. Our approach blends Indian and Korean-style work methodologies, enabling us to meet technical challenges while maintaining high standards of compliance and performance.
            </p>
            <p className="text-lg">
              At GIC, we believe that "Everything is Possible" — a mindset that drives every service we offer, from high-voltage electrical systems to structured network infrastructure and plant engineering support.
            </p>
          </div>
          
          <div 
            className={`w-full lg:w-1/2 h-80 md:h-96 bg-cover bg-center rounded-md shadow-xl transition-all duration-800 ${
              isAboutInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'
            }`}
            style={{
              backgroundImage: "url('/assets/Images/Images/Main Page Section Images/About US.png')"
            }}
          />
        </div>
      </div>

      {/* Mission and Values Section */}
      <div 
        ref={missionSectionRef}
        className="w-full min-h-[80vh] bg-gray-100 py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 
            className={`text-3xl font-bold text-blue-900 text-center mb-16 transition-all duration-800 ${
              isMissionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Our Mission & Core Strengths
          </h2>
          
          <div className="flex flex-col md:flex-row justify-center gap-8">
            {[
              {
                title: "Multi-Disciplinary Expertise",
                description: "From electrical systems to mechanical works, HVAC setups to IT networking, civil infrastructure to safe demolition — we offer end-to-end contracting support across key engineering domains under one professional team.",
                delay: "0.1s"
              },
              {
                title: "Skilled & Dedicated Workforce", 
                description: "We deploy qualified engineers, supervisors, electricians, riggers, fitters, welders, and other specialized technicians — all trained to handle real-time industrial challenges with domain knowledge, discipline, and safety commitment.",
                delay: "0.3s"
              },
              {
                title: "Indian-Korean Work Methodology",
                description: "Our unique blend of Indian and Korean methods allows us to exceed expectations in performance, safety, and project management. This cultural synergy reflects in our high client satisfaction and long-standing industry relationships.",
                delay: "0.5s"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className={`bg-white p-8 rounded-lg shadow-md w-full md:w-1/3 transition-all duration-500 ${
                  isMissionInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ 
                  transitionDelay: isMissionInView ? item.delay : '0s'
                }}
              >
                <h3 className="text-xl font-bold text-blue-900 mb-4">{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Projects Section */}
      <div 
        ref={projectsSectionRef}
        className="w-full min-h-[80vh] bg-gray-50 py-20"
      >
        <div className="max-w-6xl mx-auto px-6">
          <h2 
            className={`text-3xl font-bold text-blue-900 text-center mb-12 transition-all duration-800 ${
              isProjectsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            Key Completed Projects
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[
              {
                image: "/assets/Images/Key Completed Projects/Samsung display Noida-Plant-Pict n.jpg",
                title: "Samsung Display Center - Noida",
                description: "Electrical and mechanical works including HT cable laying, transformer setup, and lighting systems for advanced display manufacturing infrastructure.",
                direction: "left"
              },
              {
                image: "/assets/Images/Key Completed Projects/Kia.jpg", 
                title: "Kia Motors India - Penukonda",
                description: "Industrial electrical works, HVAC installation, and manpower support for Korean vendor operations at the automotive manufacturing facility.",
                direction: "right"
              },
              {
                image: "/assets/Images/Key Completed Projects/samsung-electronics-1 N.jpg",
                title: "Samsung India Electronics",
                description: "Electrical and IT networking support, manpower supply, and on-site engineering assistance across Noida & Chennai locations.",
                direction: "left"
              },
              {
                image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd",
                title: "Korean Engineering Partners",
                description: "Full-service contracting support for multiple Korean vendors including HAEWON, JUNGDO, SAMHO, DAEMYOUNG, and HYOJIN Engineering projects.",
                direction: "right"
              }
            ].map((project, index) => (
              <div 
                key={index}
                className={`mb-8 transition-all duration-800 ${
                  isProjectsInView 
                    ? 'opacity-100 translate-x-0' 
                    : `opacity-0 ${project.direction === 'left' ? '-translate-x-20' : 'translate-x-20'}`
                }`}
                style={{ transitionDelay: isProjectsInView ? `${0.2 * (index % 2)}s` : '0s' }}
              >
                <div 
                  className="h-72 bg-cover bg-center rounded-md mb-4"
                  style={{ backgroundImage: `url('${project.image}')` }}
                />
                <h3 className="text-xl font-bold text-blue-900 mb-2">{project.title}</h3>
                <p>{project.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Login Button */}
      {!isModalOpen && (
        <button
          className="fixed left-0 bottom-0 w-full h-15 bg-blue-900 bg-opacity-85 text-white text-lg font-medium hover:bg-opacity-95 transition-all duration-300 flex items-center justify-center gap-2"
          onClick={openModal}
        >
          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
          SECURE EMPLOYEE PORTAL LOGIN
        </button>
      )}

      {/* Login Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-85 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg overflow-hidden max-w-6xl w-full mx-4 flex max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 shadow-lg"
            >
              ✕
            </button>

            {/* Left Column (Login Form) */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
              <div className="mb-8 text-center">
                <h2 className="text-4xl font-bold text-blue-900 mb-4">
                  Global India Corporation
                </h2>
                <p className="text-gray-600">
                  Enter your credentials to access the employee portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="globalindiacorps@gmail.com"
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Min. 6 characters"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <span className="ml-2 text-sm text-gray-600">Keep me logged in</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/auth/forgot-password'}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 px-4 rounded-lg hover:from-blue-800 hover:to-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Secure Login'
                  )}
                </button>

              <div className="text-center">
  <span className="text-sm text-gray-600">Don't have an account? </span>
  <a href="/auth/signup" className="text-sm text-blue-600 hover:underline font-medium">
    Contact IT Support
  </a>
</div>

                {/* Demo Credentials */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Admin:</strong> admin@example.com / password</p>
                    <p><strong>Client:</strong> client1@example.com / password</p>
                 
                  </div>
                </div>
              </form>
            </div>

            {/* Right Column (Company Information) */}
            <div 
              className="hidden md:block w-1/2 relative bg-cover bg-center"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd')"
              }}
            >
              <div className="absolute inset-0 bg-blue-900 bg-opacity-70 flex flex-col justify-center items-center p-10 text-white text-center">
                <h3 className="text-2xl font-bold mb-6">
                  Multi-Disciplinary Engineering Excellence
                </h3>
                <p className="text-base mb-8">
                  Global India Corporation specializes in Electrical, Mechanical (HVAC), Civil, Demolition, and IT Networking services. We blend Indian and Korean work methodologies to deliver exceptional engineering solutions since 2016.
                </p>
                <div>
                  <p className="font-bold text-lg mb-4">Employee Portal Access:</p>
                  <div className="space-y-2 text-left">
                    <p>✓ Project management dashboards</p>
                    <p>✓ Work assignments & schedules</p>
                    <p>✓ Safety protocols & compliance</p>
                    <p>✓ Team collaboration tools</p>
                    <p>✓ HR services & support</p>
                  </div>
                </div>
                <div className="mt-8 text-sm">
                  <p className="font-semibold">Contact Info:</p>
                  <p>📧 globalindiacorps@gmail.com</p>
                  <p>📞 +91-9047642156, +91-9942471687</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}