import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../scss/PostFound.scss'

const STORAGE_BUCKET = 'lost-items' // ensure this bucket exists in Supabase

export default function PostLost() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [lastLocation, setLastLocation] = useState('')
  const [dateLost, setDateLost] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()
  const CATEGORY_OPTIONS = ['Bag','Wallet','Umbrella','Laptop','Shoes','Headphones','Charger','ID','Notebook','Key','Phone','Earbud']

  // resolve current user id on mount (and keep localStorage in sync)
  useEffect(() => {
    async function resolveUserId() {
      try {
        const getUserResult = await supabase.auth.getUser()
        const uidFromGetUser = (getUserResult as any)?.data?.user?.id
        if (uidFromGetUser) {
          setUserId(uidFromGetUser)
          window.localStorage.setItem('userId', uidFromGetUser)
          return
        }

        const getSession = await supabase.auth.getSession()
        const uidFromSession = (getSession as any)?.data?.session?.user?.id
        if (uidFromSession) {
          setUserId(uidFromSession)
          window.localStorage.setItem('userId', uidFromSession)
          return
        }

        const stored = window.localStorage.getItem('userId')
        if (stored) setUserId(stored)
      } catch (err) {
        const stored = window.localStorage.getItem('userId')
        if (stored) setUserId(stored)
      }
    }

    resolveUserId()
  }, [])

  async function uploadImage(file: File) {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    if (!publicData?.publicUrl) {
      const { data: signedData, error: signedError } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60)
      if (signedError) throw signedError
      return signedData.signedUrl
    }

    return publicData.publicUrl
  }

  // Predict category from image — ONLY called on submit when file exists
  async function predictImageCategory(file: File): Promise<string | null> {
    try {
      setPredicting(true)
      const form = new FormData()
      form.append('file', file, file.name)

      const base = 'https://testing-2-onwh.onrender.com'
      const res = await fetch(`${base.replace(/\/$/, '')}/predict/`, {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.detail || data?.message || 'Prediction failed')
      }

      return data.predicted_class ?? null
    } catch (err) {
      console.error('Prediction error', err)
      return null
    } finally {
      setPredicting(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Item title is required')
    // Require category only when no image is uploaded
    if (!file && !category.trim()) return setError('Category is required when no image is uploaded')

    // ensure we have a resolved user id
    const uid = userId ?? window.localStorage.getItem('userId')
    if (!uid) {
      setError('Please log in to report a lost item.')
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      // 1) predict category only if file exists and user didn't explicitly choose a category
      let predictedCategory: string | null = null
      if (file && !category.trim()) {
        predictedCategory = await predictImageCategory(file)
      }

      // final category: prefer user-chosen category, else prediction, else empty
      const finalCategory = category.trim() || predictedCategory || ''

      // 2) upload image if provided
      let imageUrl: string | null = null
      if (file) {
        try {
          imageUrl = await uploadImage(file)
        } catch (imgErr: any) {
          console.warn('Image upload failed:', imgErr?.message ?? imgErr)
          setError('Image upload failed. You can try again or continue without an image.')
        }
      }

      const insertPayload: any = {
        title,
        description: description ? description.trim() : 'No description provided',
        location: lastLocation ? lastLocation.trim() : 'N/A',
        date: dateLost,
        image_url: imageUrl ? imageUrl : 'https://ecfdpxyucfbjqphqbeyf.supabase.co/storage/v1/object/public/lost-items/uploads/360_F_89551596_LdHAZRwz3i4EM4J0NHNHy2hEUYDfXc0j.jpg',
        user_id: uid,
        created_at: new Date().toISOString(),
      }

      if (finalCategory) insertPayload.category = finalCategory

      const { error: insertError } = await supabase.from('lost-items').insert(insertPayload)
      if (insertError) throw insertError

      navigate('/home')
    } catch (err: any) {
      setError(err?.message || 'Failed to report lost item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="postfound-page">
      <div className="postfound-card">
        <h1>Report a Lost Item</h1>
        <p className="subtitle">Help us help you find your lost item by providing detailed information</p>

        <form onSubmit={submit} className="postfound-form">
          <div className='postfound-form-item'>
            <label>Item Title</label>
            <input
              type="text"
              placeholder="What did you lose?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className='postfound-form-item'>

            <label>Description</label>
            <textarea
              placeholder="Provide detailed description including color, brand, size, distinctive features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              style={{ resize: 'none' }}
            />
          </div>
          <div className='postfound-form-item'>
            <label>Last Known Location</label>
            <input
              type="text"
              placeholder="Where did you last see it?"
              value={lastLocation}
              onChange={(e) => setLastLocation(e.target.value)}
            />
          </div>
          <div className='postfound-form-item'>
            <label>Date Lost</label>
            <input type="date" value={dateLost} onChange={(e) => setDateLost(e.target.value)} />
          </div>
          <div className='postfound-form-item'>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category (required if no image)</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className='or-separator'>or</div>

          <div className='postfound-form-item'>
            <label>Item Photo</label>
            <div
              className="image-upload"
              onClick={() => document.getElementById('file-input')?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click()
              }}
            >
              {file ? <span className="file-name">{file.name}</span> : <span className="upload-text">Click to upload an image</span>}
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} // only set file, do NOT predict here
                style={{ display: 'none' }}
              />
            </div>
            <div className='image-hint'>Uploading a photo can significantly increase the chances of finding your item.</div>
          </div>
          {predicting && <div style={{ marginBottom: 8 }}>Predicting category…</div>}
          {error && <div className="error">{error}</div>}

          <button type="submit" className="post-btn" disabled={loading || predicting}>
            {loading ? 'Posting...' : 'Post Lost Item'}
          </button>
        </form>
      </div>
    </main>
  )
}