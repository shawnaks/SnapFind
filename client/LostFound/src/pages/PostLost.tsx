import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../scss/PostFound.scss' // reuse the same styles as PostFound

const STORAGE_BUCKET = 'lost-items' // ensure this bucket exists in Supabase

export default function PostLost() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [lastLocation, setLastLocation] = useState('')
  const [dateLost, setDateLost] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function uploadImage(file: File) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) throw uploadError

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)

    return publicData?.publicUrl ?? null
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim()) return setError('Item title is required')
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
        category,
        location: lastLocation,
        date_lost: dateLost,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('lost-items').insert(insertPayload)
      if (insertError) {
        throw insertError
      }

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
        <div className='postfound-header'>
          <h1>Report a Lost Item</h1>
          <p className="subtitle">Help us help you find your lost item by providing detailed information</p>
        </div>
        <form onSubmit={submit} className="postfound-form">
          <div className="postfound-form-item">
            <label>Item Title</label>
            <input
              type="text"
              placeholder="What did you lose?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            /></div>
          <div className="postfound-form-item">
            <label>Description</label>
            <textarea
              placeholder="Provide detailed description including color, brand, size, distinctive features..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          <div className="postfound-form-item">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              <option value="electronics">Electronics</option>
              <option value="wallets">Wallets</option>
              <option value="keys">Keys</option>
              <option value="accessories">Accessories</option>
              <option value="documents">Documents</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="postfound-form-item">
            <label>Last Known Location</label>
            <input
              type="text"
              placeholder="Where did you last see it?"
              value={lastLocation}
              onChange={(e) => setLastLocation(e.target.value)}
            />
          </div>
          <div className="postfound-form-item">
            <label>Date Lost</label>
            <input type="date" value={dateLost} onChange={(e) => setDateLost(e.target.value)} />
          </div>
          <div className="postfound-form-item">
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
            <div className="image-hint">Including a photo can greatly increase the chances of reuniting the item with its owner.</div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="post-btn" disabled={loading}>
            {loading ? 'Posting...' : 'Post Lost Item'}
          </button>
        </form>
      </div >
    </main >
  )
}