import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../scss/Auth.scss'

export default function Register() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Username is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (password.length < 5) {
      setError('Password must be at least 5 characters')
      return
    }

    setLoading(true)
    try {
      // sign up with Supabase client (client anon key)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      const userId = (data as any)?.user?.id

      if (userId) {
        // insert profile row (if you have a profiles table)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: userId, username, phone, email })

        if (profileError) {
          setError(profileError.message)
          return
        }

        window.localStorage.setItem('email', email)
        window.localStorage.setItem('username', username)
        navigate('/home')
        return
      }

      // If userId is not returned, Supabase likely requires email confirmation.
      setError('Confirmation email sent. Please check your inbox to verify your account.')
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Join Our Community</h2>

        <form onSubmit={submit} className="auth-form">

          <div className="auth-form-item">
            <label>Username</label>
            <input
              type="text"
              placeholder="Type here..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={3}
              maxLength={30}
              required
            />
          </div>

          <div className="auth-form-item">
            <label>Email</label>
            <input
              type="email"
              placeholder="Type here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-form-item">
            <label>Phone number (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1234567890"
              pattern="^\+?[0-9\s\-()]{7,20}$"
            /></div>
          <div className="auth-form-item">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={5}
              maxLength={50}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  )
}