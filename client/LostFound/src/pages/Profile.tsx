import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import '../scss/Profile.scss'

type Item = {
  id: string
  title?: string
  description?: string
  category?: string
  location?: string
  date_found?: string
  date_lost?: string
  image_url?: string
  created_at?: string
  user_id?: string
}

export default function Profile() {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost') // default to lost
  const [lostItems, setLostItems] = useState<Item[]>([])
  const [foundItems, setFoundItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function resolveUser() {
      try {
        const { data } = await supabase.auth.getUser()
        const id = data?.user?.id ?? window.localStorage.getItem('userId')
        setUserId(id ?? null)
      } catch {
        const id = window.localStorage.getItem('userId')
        setUserId(id ?? null)
      }
    }
    resolveUser()
  }, [])

  useEffect(() => {
    if (!userId) return
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function fetchItems() {
    setLoading(true)
    setError(null)
    try {
      const [lostRes, foundRes] = await Promise.all([
        supabase
          .from('lost-items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('found-items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      if (lostRes.error) throw lostRes.error
      if (foundRes.error) throw foundRes.error

      setLostItems(lostRes.data ?? [])
      setFoundItems(foundRes.data ?? [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  function renderItem(item: Item) {
    const date = item.date_lost ?? item.date_found ?? item.created_at
    return (
      <article className="item-card" key={item.id}>
        <div className="item-media">
          {item.image_url ? (
            // show scaled cover image
            <img src={item.image_url} alt={item.title || 'item image'} className="item-image" />
          ) : (
            <div className="item-image placeholder" />
          )}
        </div>

        <div className="item-content">
          <div className="item-row">
            <h3 className="item-title">{item.title || 'Untitled'}</h3>
            <time className="item-date">{date ? new Date(date).toLocaleDateString() : ''}</time>
          </div>

          <div className="item-meta">
            {item.category && <span className="tag">{item.category}</span>}
            {item.location && <span className="location">{item.location}</span>}
          </div>

          {item.description && <p className="item-desc">{item.description}</p>}

          <div className="item-actions">
            <button type="button" className="btn btn-outline">View</button>
            <button type="button" className="btn btn-primary">Edit</button>
          </div>
        </div>
      </article>
    )
  }

  if (!userId) {
    return (
      <main className="profile-page">
        <div className="profile-card">
          <h2>My Profile</h2>
          <p>Please log in to view your items.</p>
        </div>
      </main>
    )
  }

  const itemsToShow = activeTab === 'lost' ? lostItems : foundItems

  return (
    <main className="profile-page">
      <div className="profile-card">
        <h2>My Items</h2>

        <div className="profile_tabs">
          <button
            className={activeTab === 'lost' ? 'active' : ''}
            onClick={() => setActiveTab('lost')}
            type="button"
          >
            My Lost Items
          </button>
          <button
            className={activeTab === 'found' ? 'active' : ''}
            onClick={() => setActiveTab('found')}
            type="button"
          >
            My Found Items
          </button>
          <button className="refresh" onClick={fetchItems} type="button" aria-label="Refresh">
            Refresh
          </button>
        </div>

        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && itemsToShow.length === 0 && (
          <div className="empty">
            {activeTab === 'lost' ? 'You have not reported any lost items.' : 'You have not posted any found items.'}
          </div>
        )}

        <div className="profile-items-list">
          {itemsToShow.map(renderItem)}
        </div>
      </div>
    </main>
  )
}

