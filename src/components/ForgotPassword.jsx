import { useState, useEffect } from 'react'
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPassword() {
  // Form states
  const [step, setStep] = useState(1) // 1: Enter Email, 2: Enter OTP & New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [secret, setSecret] = useState('')
  
  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Timer for OTP expiration
  const [timeLeft, setTimeLeft] = useState(3600) // 1 hour in seconds
  const [timerActive, setTimerActive] = useState(false)

  // Timer effect
  useEffect(() => {
    let interval = null
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setTimerActive(false)
      setError('OTP has expired. Please request a new password reset.')
      setStep(1)
      setSecret('')
    }
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  // Format timer display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password) => {
    return password.length >= 6
  }

  // Step 1: Send forgot password request
  const handleSendOTP = async () => {
    setError('')
    setSuccess('')
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('https://global-backfinal.onrender.com/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setSecret(data.secret)
        setSuccess(data.message)
        setStep(2)
        setTimeLeft(3600) // Reset timer to 1 hour
        setTimerActive(true)
      } else {
        setError(data.error || 'Failed to send password reset request')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Reset password with OTP
  const handleResetPassword = async () => {
    setError('')
    setSuccess('')
    
    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (!validatePassword(newPassword)) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('https://global-backfinal.onrender.com/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          secret
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message + ' Redirecting to login page in 3 seconds...')
        setTimerActive(false)
        
        // Simulate redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setSecret('')
    setError('')
    setSuccess('')
    setTimerActive(false)
    setTimeLeft(3600)
  }

  const handleBackToLogin = () => {
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Login Link */}
        <div className="mb-6">
          <button 
            onClick={handleBackToLogin}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {step === 1 ? (
                <Mail className="w-8 h-8 text-blue-600" />
              ) : (
                <Lock className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Forgot Password?' : 'Reset Your Password'}
            </h1>
            <p className="text-gray-600">
              {step === 1 
                ? 'Enter your email address and we\'ll send you an OTP to reset your password'
                : 'Enter the OTP sent to admin and create a new password'
              }
            </p>
          </div>

          {/* Step 1: Enter Email */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    disabled={isLoading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              )}

              {success && (
                <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <div className="text-green-700 text-sm">{success}</div>
                </div>
              )}

              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending Request...
                  </div>
                ) : (
                  'Send Reset Request'
                )}
              </button>
            </div>
          )}

          {/* Step 2: Enter OTP and New Password */}
          {step === 2 && (
            <div>
              {/* Timer Display */}
              {timerActive && (
                <div className="mb-6 text-center">
                  <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                    <div className="text-yellow-800 text-sm">
                      OTP expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-wider"
                    placeholder="Enter OTP"
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Check your email for the OTP sent to admin
                  </p>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                    <div className="text-red-700 text-sm">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <div className="text-green-700 text-sm">
                      {success}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleResetPassword}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Resetting Password...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  <button
                    onClick={handleBackToStep1}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
                    disabled={isLoading}
                  >
                    Back to Email Entry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact{' '}
              <a href="mailto:zechsoft.it@gmail.com" className="text-blue-600 hover:underline">
                IT Support
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Security Notice:</p>
              <p>
                For security reasons, password reset requests are sent to the admin for approval. 
                The OTP will be valid for 1 hour after the admin approves your request.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Information */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Demo Information:</p>
            <p className="mb-1">• API Endpoint: https://global-backfinal.onrender.com/api</p>
            <p className="mb-1">• Admin Email: zechsoft.it@gmail.com</p>
            <p>• For testing, use any valid email format</p>
          </div>
        </div>
      </div>
    </div>
  )
}