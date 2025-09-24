
"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/loading-spinner'
import { ThemeToggle } from '@/components/theme-toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, Lock, UserPlus } from 'lucide-react'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('signin')
  const { signIn, signUp } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Trim email to prevent whitespace issues
    const trimmedEmail = email.trim()

    const { error } = await signIn(trimmedEmail, password)
    
    if (error) {
      // Normalize error messages to prevent user enumeration
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('Email not confirmed')) {
        setError('Invalid email or password. Please check your credentials.')
      } else {
        setError('Unable to sign in. Please try again.')
      }
    }
    
    // Clear password after attempt for security
    setPassword('')
    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    // Trim email to prevent whitespace issues
    const trimmedEmail = email.trim()

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Stronger password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      setIsLoading(false)
      return
    }

    const { data, error } = await signUp(trimmedEmail, password)
    
    if (error) {
      // Normalize error messages to prevent user enumeration
      if (error.message?.includes('User already registered')) {
        setError('An account with this email may already exist. Please try signing in.')
      } else if (error.message?.includes('Invalid email')) {
        setError('Please enter a valid email address.')
      } else {
        setError('Unable to create account. Please try again.')
      }
    } else {
      // Check if email confirmation is required
      if (data?.user && !data?.session) {
        setSuccess('Please check your email to verify your account before signing in.')
      } else {
        setSuccess('Account created successfully! You can now sign in.')
      }
      setActiveTab('signin')
      setPassword('')
      setConfirmPassword('')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold">
              <span className="text-orange-500">Little</span>
              <span className="text-green-600">Forest</span>
            </h1>
            
            <p className="text-gray-500 text-sm mt-2">
              Farm Management System
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 mt-6" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Signing in...</span>
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                      Email
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (8+ chars, uppercase, lowercase, number)"
                        required
                        disabled={isLoading}
                        minLength={8}
                        autoComplete="new-password"
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        required
                        disabled={isLoading}
                        minLength={8}
                        autoComplete="new-password"
                        className="border-gray-200 focus:border-green-500 focus:ring-green-500 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 mt-6" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Creating account...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
