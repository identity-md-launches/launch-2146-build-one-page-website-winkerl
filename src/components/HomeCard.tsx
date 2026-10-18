import type { Home } from '../data';
import { currency } from '../data';
import { Icon } from './Icon';

export function HomeCard({
  home,
  saved,
  onSave,
  onOpen,
  eager = false,
}: {
  home: Home;
  saved: boolean;
  onSave: (home: Home) => void;
  onOpen: (home: Home) => void;
  eager?: boolean;
}) {
  return (
    <article className="home-card" data-home-id={home.id}>
      <div className="home-photo">
        <button
          className="photo-link"
          type="button"
          onClick={() => onOpen(home)}
          aria-label={`View ${home.name}`}
        >
          <img
            src={home.image}
            alt={home.imageAlt}
            width="1100"
            height="825"
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : 'auto'}
          />
        </button>
        <span className="photo-label">{home.kind}</span>
        <button
          type="button"
          className={`save-button ${saved ? 'is-saved' : ''}`}
          onClick={() => onSave(home)}
          aria-pressed={saved}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${home.name}`}
        >
          <Icon name="heart" />
        </button>
      </div>
      <div className="home-location">
        <span>
          {home.postcode} · {home.district}
        </span>
        <span className="home-price">
          {currency.format(home.rent)}
          <span> / month</span>
        </span>
      </div>
      <h3>
        <button type="button" className="home-title" onClick={() => onOpen(home)}>
          {home.name}
          <Icon name="arrow" size={18} />
        </button>
      </h3>
      <div className="home-facts">
        <span>
          <Icon name="bed" size={17} />
          {home.bedrooms} {home.bedrooms === 1 ? 'bed' : 'beds'}
        </span>
        <span>
          <Icon name="area" size={16} />
          {home.area} m²
        </span>
        <span>{home.amenities.includes('Furnished') ? 'Furnished' : 'Unfurnished'}</span>
      </div>
      <div className="home-feature">
        <Icon name={home.amenities.includes('Outdoor space') ? 'leaf' : 'sun'} size={16} />
        {home.feature}
      </div>
    </article>
  );
}
