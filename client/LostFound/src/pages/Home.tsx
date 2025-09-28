import { useEffect, useMemo, useRef, useState } from 'react'
import '../scss/Home.scss'
import supabase from '../lib/supabaseClient'

type Item = {
  id: string
  title: string
  description: string
  location: string
  date: string
  type: 'found' | 'lost'
  category: string
  imageUrl: string
  userName: string
  userEmail: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [kind, setKind] = useState<'all' | 'found' | 'lost'>('all')
  const [category, setCategory] = useState<'all' | string>('all')

  // New: upload image state
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>('src/assets/uploadplaceholder.jpg') // placeholder path

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // cleanup object URLs
  useEffect(() => {
    return () => {
      if (uploadPreview && uploadPreview.startsWith('blob:')) {
        URL.revokeObjectURL(uploadPreview)
      }
    }
  }, [uploadPreview])

  async function fetchItems() {
    setLoading(true)
    setError(null)
    try {
      const [lostRes, foundRes] = await Promise.all([
        supabase.from('lost-items').select('*').order('created_at', { ascending: false }),
        supabase.from('found-items').select('*').order('created_at', { ascending: false }),
      ])

      if (lostRes.error) throw lostRes.error
      if (foundRes.error) throw foundRes.error

      const lostData = (lostRes.data ?? []) as any[]
      const foundData = (foundRes.data ?? []) as any[]

      // collect user ids and try to fetch profiles (if profiles table exists)
      const userIds = Array.from(
        new Set(
          [...lostData, ...foundData]
            .map((r) => r.user_id)
            .filter((u) => u)
        )
      )

      let profilesMap: Record<string, { username?: string; email?: string }> = {}
      if (userIds.length > 0) {
        const profilesRes = await supabase.from('profiles').select('id, username, email').in('id', userIds)
        if (!profilesRes.error && Array.isArray(profilesRes.data)) {
          for (const p of profilesRes.data as any[]) {
            profilesMap[p.id] = { username: p.username ?? '', email: p.email ?? '' }
          }
        }
      }

      const mappedLost: Item[] = lostData.map((r) => ({
        id: r.id,
        type: 'lost',
        title: r.title,
        description: r.description,
        category: r.category,
        location: r.location,
        date: r.date ?? r.date_lost ?? r.created_at,
        imageUrl: r.image_url ?? r.imageUrl ?? '',
        userName: profilesMap[r.user_id]?.username ?? '',
        userEmail: profilesMap[r.user_id]?.email ?? '',
      }))

      const mappedFound: Item[] = foundData.map((r) => ({
        id: r.id,
        type: 'found',
        title: r.title,
        description: r.description,
        category: r.category,
        location: r.location,
        date: (r.date ?? (r.date_found ?? r.created_at)) as string,
        imageUrl: r.image_url ?? r.imageUrl ?? '',
        userName: profilesMap[r.user_id]?.username ?? '',
        userEmail: profilesMap[r.user_id]?.email ?? '',
      }))

      const merged = [...mappedFound, ...mappedLost].sort((a, b) => {
        const ta = a.date ?? a.id
        const tb = b.date ?? b.id
        return tb.localeCompare(ta)
      })

      setItems(merged)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean))
    return ['all', ...Array.from(set) as string[]]
  }, [items])

  const visible = useMemo(() => {
    const q = query.toLowerCase()
    const loc = location.toLowerCase()
    return items.filter((i) =>
      (!q || (i.title || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q)) &&
      (!loc || (i.location || '').toLowerCase().includes(loc)) &&
      (kind === 'all' || i.type === kind) &&
      (category === 'all' || i.category === category)
    )
  }, [items, query, location, kind, category])

  // handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    if (!f) return
    setUploadFile(f)
    // revoke previous blob url if any
    if (uploadPreview && uploadPreview.startsWith('blob:')) URL.revokeObjectURL(uploadPreview)
    const url = URL.createObjectURL(f)
    setUploadPreview(url)
  }

  return (
    <div className="home">
      <section className="home__hero">
        <h1 className="home__title">Lost & Found Hub</h1>
        <p className="home__subtitle">Helping reunite lost items with their owners through the power of community. Search through found items or browse lost items to help others.</p>
      </section>

      <main className="home__content">
        <aside className="home__filters">
          <form className="home__filters-keywords" onSubmit={(e) => e.preventDefault()}>
            <div className="home__filters-title">Search by keywords</div>
            <input
              className="home__input"
              placeholder="Search by name or description"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <label>Type</label>
          <select className="home__select" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            <option value="all">All</option>
            <option value="found">Found</option>
            <option value="lost">Lost</option>
          </select>

          {/* replaced category select with image upload button */}
          <label>Upload Image</label>
          <div className="home__upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="home__upload-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload image"
              style={{
                width: 120,
                height: 120,
                padding: 0,
                border: '1px dashed #ccc',
                borderRadius: 8,
                background: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <img
                src={uploadPreview}
                alt="Upload preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </button>
          </div>

          <button type="button" className="home__search-btn" onClick={() => fetchItems()}>Search</button>
        </aside>
        <section className="home__results">
          {visible.length === 0 && <div className="home__empty">No items match your search.</div>}
          <div className="home__grid">
            {visible.map((i) => (
              <article key={i.id} className="item-card">
                <div className="item-card__media">
                  <img src={i.imageUrl} alt={i.title} loading="lazy" />
                </div>
                <div className="item-card__body">
                  <div className="item-card__row">
                    <h4 className="item-card__title">{i.title}</h4>
                    <span className={`badge ${i.type === 'found' ? 'badge--found' : 'badge--lost'}`}>{i.type}</span>
                  </div>
                  <p className="item-card__desc">{i.description}</p>
                  <div className="item-card__chips">
                    <span className="pill pill--category">{i.category}</span>
                  </div>
                  <div className="item-card__user">Posted by {i.userName}</div>
                </div>
                <div className="item-card__meta">
                  <span>{i.location}</span>
                  <span>{i.type === 'found' ? 'Found' : 'Lost'}: {new Date(i.date).toLocaleDateString()}</span>
                </div>
                <div className="item-card__footer">
                  <button className="btn btn--contact" onClick={() => window.location.href = `mailto:${i.userEmail}?subject=${encodeURIComponent('Regarding: ' + i.title)}`}>
                    Contact
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
