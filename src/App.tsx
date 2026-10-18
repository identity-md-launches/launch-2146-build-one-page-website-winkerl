import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { amenities, currency, emptyFilters, filterHomes, homes } from './data';
import type { Filters, Home } from './data';
import { BrandMark, Icon } from './components/Icon';
import type { IconName } from './components/Icon';
import { HomeCard } from './components/HomeCard';
import { Modal } from './components/Modal';

const storageKey = 'winkerl.saved-homes.v1';
const categories: { label: string; value: string; icon: IconName }[] = [
  { label: 'All homes', value: 'All homes', icon: 'grid' },
  { label: 'Apartments', value: 'Apartment', icon: 'apartment' },
  { label: 'Lofts', value: 'Loft', icon: 'loft' },
  { label: 'Houses', value: 'House', icon: 'house' },
];

function readSaved(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string => typeof id === 'string' && homes.some((home) => home.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function RentOptions() {
  return (
    <>
      <option value="">Any budget</option>
      <option value="1500">Up to €1,500</option>
      <option value="2000">Up to €2,000</option>
      <option value="2500">Up to €2,500</option>
    </>
  );
}

function CornerDrawing() {
  return (
    <svg className="corner-drawing" aria-hidden="true" viewBox="0 0 210 150" fill="none">
      <path d="M30 124V57l62-33 61 34v66H30Z" fill="var(--color-accent-soft)" />
      <path
        d="m21 58 71-40 70 40M31 55v71h122V55M82 126V83h25v43M48 68h18v20H48zM119 68h18v20h-18z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M113 39v-17h15v25M19 131h154M178 124V93m0 12c-12 0-17-8-17-17 12 0 17 7 17 17Zm1-10c0-12 7-18 18-18 0 11-7 18-18 18ZM169 125h18l-3 13h-12z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 30v-8m-4 4h8M166 41v-8m-4 4h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState('');
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [filterDraft, setFilterDraft] = useState<Filters>(emptyFilters);
  const [kind, setKind] = useState('All homes');
  const [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState(readSaved);
  const [storageError, setStorageError] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [modal, setModal] = useState<'filters' | 'saved' | 'about' | null>(null);
  const [activeHome, setActiveHome] = useState<Home | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const savedFocusTarget = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      setStorageError(true);
    }
  }, [saved]);

  const visibleHomes = filterHomes(homes, filters, kind).sort((a, b) =>
    sort === 'rent-asc'
      ? a.rent - b.rent
      : sort === 'rent-desc'
        ? b.rent - a.rent
        : sort === 'space'
          ? b.area - a.area
          : 0,
  );
  const savedHomes = homes.filter((home) => saved.includes(home.id));
  const activeFilterCount =
    Number(Boolean(filters.query)) +
    Number(Boolean(filters.maxRent)) +
    Number(Boolean(filters.minBedrooms)) +
    filters.amenities.length;

  function focusResults() {
    requestAnimationFrame(() => {
      resultsHeading.current?.focus({ preventScroll: true });
      resultsHeading.current?.scrollIntoView({ block: 'start' });
    });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...filters, query: query.trim(), maxRent: budget });
    setQuery(query.trim());
    focusResults();
  }

  function resetSearch() {
    setQuery('');
    setBudget('');
    setFilters(emptyFilters);
    setKind('All homes');
    setSort('recommended');
    setAnnouncement('Search reset. All six sample homes are shown.');
    focusResults();
  }

  function toggleSaved(home: Home) {
    const isSaved = saved.includes(home.id);
    setSaved(isSaved ? saved.filter((id) => id !== home.id) : [...saved, home.id]);
    setAnnouncement(`${home.name} ${isSaved ? 'removed from' : 'added to'} saved homes.`);
  }

  function removeFilter(key: 'query' | 'maxRent' | 'minBedrooms' | 'amenity', value?: string) {
    if (key === 'query') setQuery('');
    if (key === 'maxRent') setBudget('');
    setFilters({
      ...filters,
      ...(key === 'amenity'
        ? { amenities: filters.amenities.filter((item) => item !== value) }
        : { [key]: '' }),
    });
  }

  function downloadShortlist() {
    const text = [
      'winkerl · Your saved homes',
      'Illustrative Vienna rentals. These homes are not available to book.',
      '',
      ...savedHomes.flatMap((home) => [
        home.name,
        `${home.postcode} ${home.district}, Vienna`,
        `${currency.format(home.rent)} / month · ${home.bedrooms} ${home.bedrooms === 1 ? 'bedroom' : 'bedrooms'} · ${home.area} m²`,
        home.amenities.join(', '),
        '',
      ]),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'winkerl-shortlist.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAnnouncement('Your shortlist has been downloaded.');
  }

  const filterMatches = filterHomes(homes, filterDraft, kind).length;

  return (
    <>
      <a className="skip-link" href="#homes">
        Skip to homes
      </a>
      <header className="site-header page-width">
        <a className="brand" href="#" aria-label="winkerl home">
          <BrandMark />
          winkerl<span className="brand-dot">.</span>
        </a>
        <nav aria-label="Main navigation">
          <a className="nav-link current" href="#homes">
            Find a home
          </a>
          <a className="nav-link" href="#our-way">
            The Winkerl way
          </a>
        </nav>
        <button
          type="button"
          className="saved-link"
          onClick={() => setModal('saved')}
          aria-label={`Saved homes, ${saved.length}`}
        >
          <Icon name="heart" />
          <span>Saved homes</span>
          <span className="saved-count">{saved.length}</span>
        </button>
      </header>

      <main>
        <section className="hero page-width" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Find your kind
              <br />
              of{' '}
              <span className="corner-word">
                corner.
                <svg viewBox="0 0 330 18" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M4 11C96 0 207 1 324 10M16 16C141 8 217 8 309 15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>
            <p className="mobile-description">Rental homes with character in Vienna.</p>
          </div>
          <div className="hero-aside">
            <CornerDrawing />
            <p>
              Rental homes with character in Vienna.
              <br />
              <span>For the way you want to live.</span>
            </p>
          </div>
        </section>

        <div className="page-width search-wrap">
          <form
            className="search-bar"
            onSubmit={search}
            role="search"
            aria-label="Find a Vienna home"
          >
            <label className="search-field neighborhood">
              <Icon name="pin" size={22} />
              <span>
                <span className="field-label">Neighborhood</span>
                <input
                  id="neighborhood"
                  name="neighborhood"
                  type="search"
                  autoComplete="off"
                  placeholder="Neubau or 1070"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </span>
            </label>
            <label className="search-field budget">
              <span>
                <span className="field-label">Monthly rent</span>
                <span className="select-wrap">
                  <select
                    id="budget"
                    name="budget"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  >
                    <RentOptions />
                  </select>
                  <Icon name="chevron" size={18} />
                </span>
              </span>
            </label>
            <button type="submit" className="button primary search-submit">
              <Icon name="search" />
              Search homes
              <Icon name="arrow" className="search-arrow" />
            </button>
          </form>
          <p className="search-note">A home-finding demo. Real inspiration, sample listings.</p>
        </div>

        <section className="homes-section page-width" id="homes" aria-labelledby="results-title">
          <div className="browse-toolbar">
            <div className="category-tabs" role="group" aria-label="Home type">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  className={`category-tab ${kind === category.value ? 'selected' : ''}`}
                  aria-pressed={kind === category.value}
                  onClick={() => setKind(category.value)}
                >
                  <Icon name={category.icon} size={23} />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="button filter-button"
              aria-label={`Filters${activeFilterCount ? `, ${activeFilterCount} active` : ''}`}
              onClick={() => {
                setFilterDraft({ ...filters, query: query.trim(), maxRent: budget });
                setModal('filters');
              }}
            >
              <Icon name="filter" />
              <span className="filter-button-label">Filters</span>
              {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>
          </div>
          <div className="results-header">
            <div>
              <h2 id="results-title" ref={resultsHeading} tabIndex={-1}>
                {activeFilterCount || kind !== 'All homes'
                  ? 'A corner that fits you'
                  : 'A few favorite corners.'}
              </h2>
              <p role="status" aria-live="polite">
                {visibleHomes.length} {visibleHomes.length === 1 ? 'sample home' : 'sample homes'}
                {filters.query ? ` matching “${filters.query.trim()}”` : ' in Vienna'}
              </p>
            </div>
            <label className="sort-control">
              <span>Sort homes:</span>
              <span className="select-wrap">
                <select
                  aria-label="Sort homes"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recommended">Our picks</option>
                  <option value="rent-asc">Rent: low to high</option>
                  <option value="rent-desc">Rent: high to low</option>
                  <option value="space">Most space</option>
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
          </div>

          {activeFilterCount > 0 && (
            <div className="active-filters" aria-label="Applied filters">
              {filters.query && (
                <button type="button" className="filter-chip" onClick={() => removeFilter('query')}>
                  “{filters.query}”<Icon name="close" size={15} />
                  <span className="sr-only">Remove neighborhood filter</span>
                </button>
              )}
              {filters.maxRent && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => removeFilter('maxRent')}
                >
                  Up to {currency.format(Number(filters.maxRent))}
                  <Icon name="close" size={15} />
                  <span className="sr-only">Remove budget filter</span>
                </button>
              )}
              {filters.minBedrooms && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => removeFilter('minBedrooms')}
                >
                  {filters.minBedrooms}+ bedrooms
                  <Icon name="close" size={15} />
                  <span className="sr-only">Remove bedroom filter</span>
                </button>
              )}
              {filters.amenities.map((amenity) => (
                <button
                  type="button"
                  className="filter-chip"
                  key={amenity}
                  onClick={() => removeFilter('amenity', amenity)}
                >
                  {amenity}
                  <Icon name="close" size={15} />
                  <span className="sr-only">Remove {amenity} filter</span>
                </button>
              ))}
              <button type="button" className="text-button" onClick={resetSearch}>
                Clear all
              </button>
            </div>
          )}

          {visibleHomes.length > 0 ? (
            <div className="homes-grid">
              {visibleHomes.map((home, index) => (
                <HomeCard
                  key={home.id}
                  home={home}
                  saved={saved.includes(home.id)}
                  onSave={toggleSaved}
                  onOpen={setActiveHome}
                  eager={index < 3}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name="search" size={30} />
              </span>
              <h3>No homes match just yet.</h3>
              <p>
                {filters.query
                  ? `Try another neighborhood instead of “${filters.query.trim()}”, or give your filters a little more room.`
                  : 'Try a different home type, a higher budget, or fewer amenities.'}
              </p>
              <button type="button" className="button primary" onClick={resetSearch}>
                Reset your search
                <Icon name="arrow" />
              </button>
            </div>
          )}

          <div className="results-end">
            <span className="end-line" />
            <BrandMark />
            <p>
              {visibleHomes.length > 0
                ? 'A little collection. A world of possibility.'
                : 'Your kind of corner is worth finding.'}
            </p>
            <span className="end-line" />
          </div>
        </section>

        <section className="our-way" id="our-way" aria-labelledby="way-title">
          <div className="page-width way-layout">
            <div className="way-intro">
              <span className="house-stamp">
                <Icon name="house" size={38} />
              </span>
              <h2 id="way-title">
                More than
                <br />
                four walls.
              </h2>
              <p>
                It’s the light in the morning. A favorite café around the corner. Room to be
                yourself.
              </p>
            </div>
            <div className="way-steps">
              <div className="way-step">
                <span>01</span>
                <div>
                  <h3>Find a place that fits</h3>
                  <p>
                    Explore Vienna’s corners by neighborhood, budget, and the little things that
                    matter.
                  </p>
                </div>
              </div>
              <div className="way-step">
                <span>02</span>
                <div>
                  <h3>Keep the ones you love</h3>
                  <p>
                    Save your favorites in this browser. Come back whenever you want a second look.
                  </p>
                </div>
              </div>
              <div className="way-step">
                <span>03</span>
                <div>
                  <h3>Make it a little shortlist</h3>
                  <p>
                    Download your saved homes to compare your favorites, even when you’re offline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer page-width">
        <div>
          <a className="brand footer-brand" href="#" aria-label="winkerl home">
            <BrandMark />
            winkerl<span className="brand-dot">.</span>
          </a>
          <p>A little place in Vienna.</p>
        </div>
        <p className="footer-note">A concept to explore, not a booking service.</p>
        <button className="text-button" type="button" onClick={() => setModal('about')}>
          About this demo
          <Icon name="arrow" size={17} />
        </button>
      </footer>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      {activeHome ? (
        <Modal title={activeHome.name} onClose={() => setActiveHome(null)} className="detail-modal">
          {modal === 'saved' && (
            <button
              type="button"
              className="text-button back-to-saved"
              onClick={() => setActiveHome(null)}
            >
              <Icon name="back" size={17} />
              Back to saved homes
            </button>
          )}
          <img
            className="detail-photo"
            src={activeHome.image}
            alt={activeHome.imageAlt}
            width="1100"
            height="825"
          />
          <div className="detail-top">
            <div>
              <p className="detail-location">
                <Icon name="pin" size={17} />
                {activeHome.postcode} {activeHome.district}, Vienna
              </p>
              <span className="detail-kind">{activeHome.kind}</span>
            </div>
            <p className="detail-price">
              {currency.format(activeHome.rent)}
              <span> / month</span>
            </p>
          </div>
          <div className="detail-facts">
            <span>
              <Icon name="bed" />
              {activeHome.bedrooms} {activeHome.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </span>
            <span>
              <Icon name="bath" />
              {activeHome.bathrooms} {activeHome.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
            </span>
            <span>
              <Icon name="area" />
              {activeHome.area} m²
            </span>
          </div>
          <p className="detail-description">{activeHome.description}</p>
          <h3>A few things to love</h3>
          <ul className="amenity-list">
            {activeHome.amenities.map((amenity) => (
              <li key={amenity}>
                <Icon name="check" size={17} />
                {amenity}
              </li>
            ))}
          </ul>
          <div className="demo-notice">
            <Icon name="house" size={21} />
            <p>
              This is an illustrative home, with a sample price and photo. It isn’t available to
              rent. There’s no street address, and utility costs are not specified.
            </p>
          </div>
          <button
            type="button"
            className={`button primary detail-save ${saved.includes(activeHome.id) ? 'saved-detail' : ''}`}
            aria-pressed={saved.includes(activeHome.id)}
            onClick={() => toggleSaved(activeHome)}
          >
            <Icon name="heart" />
            {saved.includes(activeHome.id) ? 'Saved to your collection' : 'Save this home'}
          </button>
        </Modal>
      ) : modal === 'filters' ? (
        <Modal title="A home that fits" onClose={() => setModal(null)} className="filter-modal">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(filterDraft);
              setQuery(filterDraft.query);
              setBudget(filterDraft.maxRent);
              setModal(null);
              focusResults();
            }}
          >
            <p className="modal-intro">A few little details make all the difference.</p>
            <div className="filter-form-row">
              <label className="form-field">
                Monthly rent
                <select
                  value={filterDraft.maxRent}
                  onChange={(event) =>
                    setFilterDraft({ ...filterDraft, maxRent: event.target.value })
                  }
                >
                  <RentOptions />
                </select>
              </label>
              <label className="form-field">
                Bedrooms
                <select
                  value={filterDraft.minBedrooms}
                  onChange={(event) =>
                    setFilterDraft({ ...filterDraft, minBedrooms: event.target.value })
                  }
                >
                  <option value="">Any number</option>
                  <option value="1">1+ bedrooms</option>
                  <option value="2">2+ bedrooms</option>
                  <option value="3">3+ bedrooms</option>
                </select>
              </label>
            </div>
            <fieldset className="amenities-fieldset">
              <legend>Make room for what matters</legend>
              {amenities.map((amenity) => (
                <label className="checkbox-row" key={amenity}>
                  <input
                    type="checkbox"
                    checked={filterDraft.amenities.includes(amenity)}
                    onChange={(event) =>
                      setFilterDraft({
                        ...filterDraft,
                        amenities: event.target.checked
                          ? [...filterDraft.amenities, amenity]
                          : filterDraft.amenities.filter((item) => item !== amenity),
                      })
                    }
                  />
                  <span>{amenity}</span>
                </label>
              ))}
            </fieldset>
            <div className="filter-footer">
              <button
                className="text-button"
                type="button"
                onClick={() => setFilterDraft({ ...emptyFilters, query: filterDraft.query })}
              >
                Reset filters
              </button>
              <button className="button primary" type="submit">
                Show {filterMatches} {filterMatches === 1 ? 'home' : 'homes'}
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </form>
        </Modal>
      ) : modal === 'saved' ? (
        <Modal
          title="Your little collection"
          onClose={() => setModal(null)}
          className="saved-modal"
        >
          <p className="modal-intro">
            {storageError
              ? 'Saved for this visit. Browser storage is unavailable.'
              : 'Your favorites, saved in this browser. No account needed.'}
          </p>
          {savedHomes.length ? (
            <>
              <div className="saved-list">
                {savedHomes.map((home, index) => (
                  <article className="saved-row" key={home.id}>
                    <button
                      type="button"
                      className="saved-home-link"
                      onClick={() => setActiveHome(home)}
                    >
                      <img src={home.image} alt="" width="100" height="85" />
                      <span>
                        <span className="saved-row-location">
                          {home.district} · {home.area} m²
                        </span>
                        <strong>{home.name}</strong>
                        <span>{currency.format(home.rent)} / month</span>
                      </span>
                      <Icon name="arrow" size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-button remove-saved"
                      ref={index === 0 ? savedFocusTarget : undefined}
                      onClick={() => {
                        toggleSaved(home);
                        requestAnimationFrame(() => savedFocusTarget.current?.focus());
                      }}
                      aria-label={`Remove ${home.name} from saved homes`}
                    >
                      <Icon name="close" size={17} />
                    </button>
                  </article>
                ))}
              </div>
              <button
                type="button"
                className="button primary download-button"
                onClick={downloadShortlist}
              >
                Download shortlist
                <Icon name="arrow" />
              </button>
              <p className="download-note">
                A text file of your {savedHomes.length} saved{' '}
                {savedHomes.length === 1 ? 'home' : 'homes'}. Sample listings only.
              </p>
            </>
          ) : (
            <div className="empty-state saved-empty">
              <span className="empty-icon">
                <Icon name="heart" size={30} />
              </span>
              <h3>Something will feel like home.</h3>
              <p>Select the heart on any home to keep it here for another look.</p>
              <button
                type="button"
                className="button primary"
                ref={savedFocusTarget}
                onClick={() => {
                  setModal(null);
                  focusResults();
                }}
              >
                Explore homes
                <Icon name="arrow" />
              </button>
            </div>
          )}
        </Modal>
      ) : modal === 'about' ? (
        <Modal
          title="A little about winkerl"
          onClose={() => setModal(null)}
          className="about-modal"
        >
          <p>
            winkerl is a home-finding concept inspired by Vienna and the feeling of finding a place
            of your own.
          </p>
          <h3>An honest little demo</h3>
          <p>
            The six homes, locations, prices, and amenities are fictional examples. Photography is
            illustrative. There is no live availability, property agent, booking, or enquiry
            service.
          </p>
          <h3>Your collection stays with you</h3>
          <p>
            Saved homes live in this browser’s local storage. There are no accounts, analytics, or
            data submissions. Clearing your browser data removes the collection.
          </p>
          <h3>The details behind the design</h3>
          <p>
            Interior photography from Unsplash. Manrope typeface by Mikhail Sharanda, distributed
            under the SIL Open Font License. All assets are bundled locally.
          </p>
          <button type="button" className="button primary" onClick={() => setModal(null)}>
            Back to finding your corner
            <Icon name="arrow" />
          </button>
        </Modal>
      ) : null}
    </>
  );
}
