import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../scss/PostFound.scss'

const STORAGE_BUCKET = 'lost-items' // ensure this bucket exists in Supabase

export default function PostLost() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lastLocation, setLastLocation] = useState('')
  const [dateLost, setDateLost] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const navigate = useNavigate()

  // resolve current user id on mount (and keep localStorage in sync)
  useEffect(() => {
    async function resolveUserId() {
      try {
        // supabase-js v2: getUser()
        const getUserResult = await supabase.auth.getUser()
        const uidFromGetUser = (getUserResult as any)?.data?.user?.id
        if (uidFromGetUser) {
          setUserId(uidFromGetUser)
          window.localStorage.setItem('userId', uidFromGetUser)
          return
        }

        // fallback to session (some versions / flows)
        const getSession = await supabase.auth.getSession()
        const uidFromSession = (getSession as any)?.data?.session?.user?.id
        if (uidFromSession) {
          setUserId(uidFromSession)
          window.localStorage.setItem('userId', uidFromSession)
          return
        }

        // last resort: existing value in localStorage
        const stored = window.localStorage.getItem('userId')
        if (stored) setUserId(stored)
      } catch (err) {
        // ignore — user remains null
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

    const { data: uploadData, error: uploadError } = await supabase.storage
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Item title is required')

    // ensure we have a resolved user id
    const uid = userId ?? window.localStorage.getItem('userId')
    if (!uid) {
      setError('Please log in to report a lost item.')
      navigate('/login')
      return
    }

    setLoading(true)

    try {
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
        description,
        location: lastLocation,
        date_lost: dateLost,
        image_url: imageUrl,
        user_id: uid,   // attach the resolved user uuid
        created_at: new Date().toISOString(),
      }

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
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: 'none' }}
              />
            </div>
            <div className='image-hint'>Uploading a photo can significantly increase the chances of finding your item.</div>
          </div>
          {error && <div className="error">{error}</div>}

          <button type="submit" className="post-btn" disabled={loading}>
            {loading ? 'Posting...' : 'Post Lost Item'}
          </button>
        </form>
      </div>
    </main>
  )
}