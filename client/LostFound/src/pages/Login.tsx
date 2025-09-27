import { useState } from 'react'
import { api } from '../lib/api'
import '../scss/Auth.scss'
import sha256 from 'crypto-js/sha256'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [hash, setHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/user/login', { email, password: hash })
      if (res.status === 200) {
        window.localStorage.setItem('email', email)
        navigate('/home')
      } else {
        setError(res.data?.message || 'Login failed')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={submit} className="auth-form">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              const v = e.target.value
              setPassword(v)
              setHash(sha256(sha256(v).toString()).toString())
            }}
            minLength={5}
            maxLength={50}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="auth-switch">
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </main>
  )
}