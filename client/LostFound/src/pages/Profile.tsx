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
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost') // default to lost
  const [lostItems, setLostItems] = useState<Item[]>([])
  const [foundItems, setFoundItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function resolveUser() {
      try {
        const { data } = await supabase.auth.getUser()
        const u = data?.user
        const id = u?.id ?? window.localStorage.getItem('userId')
        setUserId(id ?? null)
        const email = u?.email ?? window.localStorage.getItem('email') ?? ''
        setUserEmail(email)
        // Prefer Supabase user_metadata for name/avatar if present
        const meta = (u?.user_metadata as any) || {}
        const nameCandidate: string = meta.full_name || meta.name || (email ? email.split('@')[0] : 'User')
        setUserName(nameCandidate)
        const avatarCandidate: string = meta.avatar_url || `https://i.pravatar.cc/160?u=${encodeURIComponent(email || id || 'guest')}`
        setAvatarUrl(avatarCandidate)
      } catch {
        const id = window.localStorage.getItem('userId')
        setUserId(id ?? null)
        const email = window.localStorage.getItem('email') ?? ''
        setUserEmail(email)
        setUserName(email ? email.split('@')[0] : 'User')
        setAvatarUrl(`https://i.pravatar.cc/160?u=${encodeURIComponent(email || id || 'guest')}`)
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
  async function deleteItem(id: string, type: 'lost' | 'found') {
    const confirmed = window.confirm('Delete this item? This action cannot be undone.')
    if (!confirmed) return

    // optimistic UI: mark deleting
    setDeletingId(id)
    setError(null)

    try {
      const table = type === 'lost' ? 'lost-items' : 'found-items'
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id).limit(1)
      if (deleteError) throw deleteError

      // remove from local state without refetching
      if (type === 'lost') {
        setLostItems((prev) => prev.filter((it) => it.id !== id))
      } else {
        setFoundItems((prev) => prev.filter((it) => it.id !== id))
      }
    } catch (err: any) {
      console.error('Delete failed', err)
      setError(err?.message || 'Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  // new: delete an item from the appropriate table
  async function deleteItem(id: string, type: 'lost' | 'found') {
    const confirmed = window.confirm('Delete this item? This action cannot be undone.')
    if (!confirmed) return

    // optimistic UI: mark deleting
    setDeletingId(id)
    setError(null)

    try {
      const table = type === 'lost' ? 'lost-items' : 'found-items'
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id).limit(1)
      if (deleteError) throw deleteError

      // remove from local state without refetching
      if (type === 'lost') {
        setLostItems((prev) => prev.filter((it) => it.id !== id))
      } else {
        setFoundItems((prev) => prev.filter((it) => it.id !== id))
      }
    } catch (err: any) {
      console.error('Delete failed', err)
      setError(err?.message || 'Failed to delete item')
    } finally {
      setDeletingId(null)
    }
  }

  function renderItem(item: Item) {
    const date = item.date_lost ?? item.date_found ?? item.created_at
    const statusWord = activeTab === 'lost' ? 'lost' : 'found'
    const primaryActionLabel = activeTab === 'lost' ? 'Mark As Found' : 'Mark As Returned'
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
          <p className="item-desc">
            {item.description}
            {item.location && (
              <>
                {' '}{statusWord} at <strong>{item.location}</strong>
              </>
            )}
          </p>
          {item.category && (
            <div className="item-meta">
              <span className="tag">Category: <strong>{item.category}</strong></span>
            </div>
          )}
          <div className="item-actions">
          </div>
          <div className="item-primary-action">
            <button type="button" className="btn btn-delete" onClick={() => deleteItem(item.id, activeTab)}
              disabled={deletingId === item.id || loading}
            >
              {deletingId === item.id ? 'Deleting...' : primaryActionLabel}</button>
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
        <div className="profile-two-col">
          <aside className="profile-two-col__left">
            <section className="profile-user">
              <img className="profile-user__avatar" src={avatarUrl || 'https://i.pravatar.cc/160'} alt="User avatar" />
              <div className="profile-user__info">
                <div className="profile-user__name">{userName || 'User'}</div>
                {userEmail && <div className="profile-user__email">{userEmail}</div>}
              </div>
              <div className="profile-user__actions">
                <button type="button" className="btn btn-outline">Edit profile</button>
              </div>
            </section>
          </aside>

          <section className="profile-two-col__right">
            <h2 className="profile-title">My Items</h2>

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
            </div>

            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && itemsToShow.length === 0 && (
              <div className="empty">
                {activeTab === 'lost' ? 'You have not reported any lost items.' : 'You have not posted any found items.'}
              </div>
            )}

            <div className="profile-items-list" role="list">
              {itemsToShow.map(renderItem)}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

