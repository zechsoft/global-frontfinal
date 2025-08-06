import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, X, ChevronDown } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

function SignUp() {
  const navigate = useNavigate()
  
  // State for form fields
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const API_BASE_URL = "http://localhost:8000/api"

  // Toast function to replace Chakra UI toast
  const showToast = (title, description, type = 'info') => {
    setToastMessage({ title, description, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Modal controls
  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = "initial"
    navigate("/auth/signin")
  }

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 27) {
        closeModal()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleSignUp = async() => {
    setIsLoading(true)

    // Simple validation
    if (!name || !email || !password || !role) {
      showToast(
        "Missing information",
        "Please fill in all required fields",
        "error"
      )
      setIsLoading(false)
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast(
        "Invalid email",
        "Please enter a valid email address",
        "error"
      )
      setIsLoading(false)
      return
    }

    // Password validation (min 8 characters)
    if (password.length < 8) {
      showToast(
        "Invalid password",
        "Password must be at least 8 characters long",
        "error"
      )
      setIsLoading(false)
      return
    }

    if(!otp) {
      showToast(
        "Please enter the OTP",
        "No otp found",
        "error"
      )
      setIsLoading(false)
      return
    }

    try {
      const userCheck = await fetch(`${API_BASE_URL}/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      })

      if(userCheck.ok) {
        const secret = JSON.parse(sessionStorage.getItem("secret"))

        const newUser = {
          "name": name,
          "email": email,
          "password": password,
          "role": role,
          "otp": otp,
          "secret": secret
        }

        const registerUser = await fetch(`${API_BASE_URL}/registerUser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ newUser })
        })

        if(registerUser.ok) {
          setTimeout(() => {
            setIsLoading(false)
            showToast(
              "Registration Successful",
              `Welcome to Global India Corporation, ${name}!`,
              "success"
            )
            navigate("/auth/signin")
          }, 1000)
        } else {
          showToast(
            "Registration failed",
            "There was a problem in user registration please try again later.",
            "error"
          )
          setIsLoading(false)
          return
        }
      } else {
        showToast(
          "User already exists",
          `User ${name} already exists`,
          "success"
        )
        navigate("/auth/signin")
      }
    } catch(err) {
      if(err.response?.status === 406) {
        showToast(
          "User already exists",
          `User ${name} already exists`,
          "success"
        )
        navigate("/auth/signin")
      } else {
        showToast(
          "Something went wrong",
          err.response?.data?.error || err.message,
          "error"
        )
        setIsLoading(false)
        return
      }
    }
  }

  const handleSendOtp = async() => {
    if (!email) {
      showToast(
        "Missing email",
        "Please enter your email address",
        "error"
      )
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/sendotp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      const data = await response.json()

      if(response.ok) {
        showToast(
          "OTP Sent",
          "An OTP has been sent to your email address",
          "success"
        )
        sessionStorage.setItem("secret", JSON.stringify(data.secret))
      } else {
        showToast(
          "OTP failed",
          "There has been a minor inconvenience",
          "error"
        )
      }
    } catch(err) {
      showToast(
        "OTP failed",
        "There has been a minor inconvenience",
        "error"
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat relative"
         style={{ backgroundImage: "url(https://images.unsplash.com/photo-1538137524007-21e48fa42f3f)" }}>
      
      {/* Background Overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black bg-opacity-60" />
      
      {/* Content */}
      <div className="relative w-full text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-6 text-white animate-fade-in-up">
          GLOBAL INDIA CORPORATION
        </h1>
        
        <p className="text-xl md:text-2xl text-center max-w-4xl mb-10 mx-auto text-white animate-fade-in">
          Building India's Future Through Innovation, Infrastructure & Excellence
        </p>
        
        <div className="flex justify-center animate-scale-in">
          <button
            className="px-10 py-4 text-lg bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            onClick={openModal}
          >
            CREATE ACCOUNT
          </button>
        </div>
      </div>
      
      {/* Registration Modal */}
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
              <X className="w-5 h-5" />
            </button>

            {/* Left Column (Registration Form) */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center overflow-y-auto">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-blue-900 text-center mb-4">
                  Global India Corporation
                </h2>
                <p className="text-center text-gray-600">
                  Create your account to join our team
                </p>
              </div>

              {/* Google Sign-Up Button */}
              <button className="flex items-center justify-center w-full h-12 mb-6 border border-gray-300 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                <FcGoogle className="w-5 h-5 mr-2" />
                Sign Up with Google
              </button>

              {/* Divider */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-full border-b border-gray-200" />
                <span className="mx-2 text-gray-600">or</span>
                <div className="w-full border-b border-gray-200" />
              </div>

              {/* Form fields */}
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-normal mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-normal mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="mail@globalindiacorp.com"
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-normal mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="w-full h-12 px-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Role Field */}
                <div>
                  <label className="block text-sm font-normal mb-1">Role</label>
                  <select
                    className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>

                {/* OTP Field with button */}
                <div>
                  <label className="block text-sm font-normal mb-1">OTP Verification</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      className="flex-1 h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="h-12 px-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-lg hover:from-blue-800 hover:to-blue-950 transition-colors"
                    >
                      Send OTP
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center mb-5">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="rememberMe" className="ml-3 text-sm text-gray-600">
                    Keep me logged in
                  </label>
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-xl hover:from-blue-800 hover:to-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* Sign In Link */}
                <div className="flex justify-center mt-5">
                  <span className="text-sm text-gray-600">Already have an account?</span>
                  <button
                    type="button"
                    onClick={() => navigate("/auth/signin")}
                    className="ml-1 text-sm font-medium text-blue-900 hover:underline"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column (Company Information) */}
            <div className="hidden md:block w-1/2 relative overflow-hidden">
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter brightness-75"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?ixlib=rb-0.3.5&auto=format&fit=crop&w=1000&q=80)" }}
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 bg-blue-900 bg-opacity-70 flex flex-col justify-center items-center p-10 text-white text-center">
                <h3 className="text-2xl font-bold mb-6">
                  Join Our Team
                </h3>
                <p className="text-base mb-8">
                  Global India Corporation is at the forefront of India's infrastructure revolution, delivering world-class engineering solutions across energy, transportation, defense, and smart cities.
                </p>
                <div>
                  <p className="font-bold text-lg mb-4">
                    Why Join GIC?
                  </p>
                  <div className="space-y-2 text-left">
                    <p>✓ Be part of India's infrastructure revolution</p>
                    <p>✓ Work on landmark national projects</p>
                    <p>✓ Collaborate with industry experts</p>
                    <p>✓ Access cutting-edge technologies</p>
                    <p>✓ Excellent growth and learning opportunities</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          toastMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          toastMessage.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="font-medium">{toastMessage.title}</h4>
              <p className="text-sm mt-1">{toastMessage.description}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
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

export default SignUp