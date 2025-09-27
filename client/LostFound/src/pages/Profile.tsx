import '../scss/Profile.scss'

type MyItem = {
	id: string
	title: string
	imageUrl: string
	location: string
	type: 'found' | 'lost'
	category: string
}

const MOCK_MY_ITEMS: MyItem[] = [
	{ id: 'i1', title: 'Blue Backpack', imageUrl: 'https://picsum.photos/seed/pf1/600/400', location: 'Main Library', type: 'found', category: 'Bags' },
	{ id: 'i2', title: 'iPhone 13', imageUrl: 'https://picsum.photos/seed/pf2/600/400', location: 'Cafeteria', type: 'lost', category: 'Electronics' },
	{ id: 'i3', title: 'Keychain', imageUrl: 'https://picsum.photos/seed/pf3/600/400', location: 'Gym', type: 'found', category: 'Keys' },
]

export default function Profile() {
	return (
		<div className="profile">
			<section className="profile__body">
				<div className="profile__main">
					<div className="profile__group">
						{/* Left profile card */}
						<aside className="profile__left">
							<div className="profile__edit-wrap">
								<button className="profile__edit-btn" type="button">Edit profile</button>
							</div>
							<div className="profile__user">
								<img className="profile__avatar" src="https://i.pravatar.cc/160?img=12" alt="User Avatar" />
								<div className="profile__username">John Doe</div>
							</div>
						</aside>

						{/* Right content card */}
						<section className="profile__right">
							<div className="profile__tabs">
								<button className="profile__tab" type="button">My lost items</button>
								<button className="profile__tab" type="button">My found items</button>
								<button className="profile__tab" type="button">Pending confirmation</button>
							</div>
							<div className="profile__items">
								{MOCK_MY_ITEMS.map((it) => (
									<article key={it.id} className="profile__card">
										<div className="profile__card-media">
											<img src={it.imageUrl} alt={it.title} loading="lazy" />
										</div>
										<div className="profile__card-body">
											<div className="profile__card-title">{it.title}</div>
											<div className="profile__card-meta">
												<span className={`profile__badge ${it.type === 'found' ? 'profile__badge--found' : 'profile__badge--lost'}`}>{it.type}</span>
												<span className="profile__meta-item">{it.location}</span>
												<span className="profile__meta-item">{it.category}</span>
											</div>
										</div>
										<div className="profile__card-actions">
											<button type="button" className="profile__btn profile__btn--ghost">Edit</button>
											<button type="button" className="profile__btn profile__btn--danger">Delete</button>
										</div>
									</article>
								))}
							</div>
						</section>
					</div>
				</div>
			</section>
		</div>
	)
}

