import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../scss/PostFound.scss'

const STORAGE_BUCKET = 'found-items' // ensure this bucket exists in your Supabase project

export default function PostFound() {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [location, setLocation] = useState('')
    const [dateFound, setDateFound] = useState<string>(() => new Date().toISOString().slice(0, 10))
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

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
        if (!file) return setError('Please upload an image (required).')

        // ensure we have a signed-in user
        const { data: userData } = await supabase.auth.getUser()
        const userId = userData?.user?.id ?? window.localStorage.getItem('userId')
        if (!userId) {
            setError('Please log in to post an item.')
            navigate('/login')
            return
        }

        setLoading(true)

        try {
            let imageUrl: string | null = null
            try {
                imageUrl = await uploadImage(file)
            } catch (imgErr: any) {
                console.error('Image upload failed:', imgErr)
                setError('Image upload failed. Please try again.')
                setLoading(false)
                return
            }

            const insertPayload: any = {
                title,
                description,
                location,
                date: dateFound,
                image_url: imageUrl,
                user_id: userId,             // attach user uuid
                created_at: new Date().toISOString(),
            }

            const { error: insertError } = await supabase.from('found-items').insert(insertPayload)
            if (insertError) throw insertError

            navigate('/home')
        } catch (err: any) {
            setError(err?.message || 'Failed to post item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="postfound-page">
            <div className="postfound-card">
                <h1>Help Someone Find Their Item</h1>
                <p className="subtitle">Share details about an item you found to help reunite it with its owner</p>

                <form onSubmit={submit} className="postfound-form" noValidate>
                    <div className="postfound-form-item">
                        <label>Item Title</label>
                        <input
                            type="text"
                            placeholder="e.g., Black iPhone with blue case"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
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


                        <label>Where did you find it?</label>
                        <input
                            type="text"
                            placeholder="e.g., Central Park near the fountain"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                    <div className="postfound-form-item">
                        <label>Date Found</label>
                        <input type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} />
                    </div>
                    <div className="postfound-form-item">
                        <label>Upload Photo <span style={{ color: '#b00020' }}>*</span></label>
                        <div
                            className="image-upload"
                            onClick={() => document.getElementById('file-input')?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click()
                            }}
                            style={{ borderColor: file ? undefined : '#b00020' }}
                        >
                            {file ? <span className="file-name">{file.name}</span> : <span className="upload-text">Click to upload an image (required)</span>}
                            <input
                                id="file-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] ?? null)
                                    setError('')
                                }}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {error && <div className="error">{error}</div>}

                    <button type="submit" className="post-btn" disabled={loading || !file}>
                        {loading ? 'Posting...' : 'Post Found Item'}
                    </button>
                </form>
            </div>
        </main>
    )
}