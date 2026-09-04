# Design System: Jenni Khoe MUA – Luxury Wedding/MUA Visual Identity

## 1. Design Tokens & Tailwind Configuration

### Colors
```ts
// tailwind.config.ts
colors: {
  luxury: {
    champagne: '#F7E7CE',
    champagneLight: '#FAF0E6',
    roseGold: '#B76E79',
    roseGoldDark: '#9C5560',
    warmNude: '#EAD7D1',
    deepSlate: '#1E232A',
    charcoal: '#121417',
    pearl: '#FDFBF7'
  }
}
```

### Typography
```ts
fontFamily: {
  serif: ['var(--font-cormorant)', 'Playfair Display', 'serif'],
  sans: ['var(--font-montserrat)', 'sans-serif']
}
```

| Token | Usage | Classes |
|-------|-------|---------|
| Heading XL | Hero titles, page headings | `font-serif text-4xl md:text-6xl tracking-wide text-luxury-deepSlate` |
| Heading MD | Section headers | `font-serif text-2xl md:text-3xl tracking-wide text-luxury-deepSlate` |
| Body | Paragraphs, descriptions | `font-sans text-sm md:text-base text-luxury-deepSlate/80 font-light` |
| Label/Meta | Small, captions, footnotes | `font-sans text-xs tracking-widest uppercase text-luxury-roseGold` |
| Currency/Numbers | Price display | `font-serif tabular-nums font-semibold text-luxury-roseGold` |

## 2. Surface Utility Standards

| Component | Utility |
|-----------|---------|
| Glassmorphism Card | `bg-white/80 backdrop-blur-md border border-luxury-champagne/40 shadow-xl shadow-luxury-roseGold/5 rounded-2xl` |
| Primary Button | `bg-luxury-roseGold hover:bg-luxury-roseGoldDark text-white font-sans text-xs tracking-widest uppercase py-3 px-6 rounded-full transition-all duration-300 shadow-md hover:shadow-luxury-roseGold/20 active:scale-95` |
| Secondary Button | `border border-luxury-roseGold text-luxury-roseGold hover:bg-luxury-roseGold hover:text-white text-xs tracking-widest uppercase py-3 px-6 rounded-full transition-all duration-300` |
| Input Field | `w-full bg-white/70 border border-luxury-champagne/60 rounded-xl px-4 py-3 font-sans text-sm text-luxury-deepSlate placeholder:text-luxury-deepSlate/40 focus:outline-none focus:ring-1 focus:ring-luxury-roseGold focus:border-luxury-roseGold transition-all` |
| Divider | `h-px bg-gradient-to-r from-transparent via-luxury-roseGold/30 to-transparent` |

## 3. Interactive Components

### Before/After Slider (`BeforeAfterSlider.tsx`)
- **Structure**: Two `<Image>` overlaid in `relative overflow-hidden rounded-2xl select-none aspect-[4/5] md:aspect-[1/1]`
- **Clip**: Top (After) clipped via `clipPath: polygon(0 0, ${pos}% 0, ${pos}% 100%, 0 100%)`
- **Control**: Native `<input type="range">` styled transparent overlay (`absolute inset-0 opacity-0 cursor-ew-resize z-20`)
- **Handle**: Vertical line `w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.3)]` with circular pill `w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg`
- **Props**: `{ beforeImg, afterImg, aspect?, labelBefore?, labelAfter? }`

### Portfolio Grid (`PortfolioGrid.tsx`)
- **Layout**: `columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4` (CSS masonry)
- **Images**: Next.js `<Image>` with WebP/AVIF, lazy-load, `placeholder="blur"`
- **Filter**: Horizontal scroll tag pills (`whitespace-nowrap overflow-x-auto no-scrollbar`)

### Floating WhatsApp (`FloatingWhatsApp.tsx`)
- **Position**: `fixed bottom-6 right-6 z-50 flex items-center gap-3`
- **Animation**: Subtle pulse on unread badge
- **Click**: `https://wa.me/{phone}?text={encodeURIComponent(prefillText)}`
- **No third-party script** — pure native link

## 4. Booking Form UX (`CheckAvailabilityForm.tsx`)

### Multi-step flow
| Step | Field | Type |
|------|-------|------|
| 1 | Wedding Date | `<input type="date">` + blocked date highlights via `GET /api/public/calendar/blocked-dates` |
| 2 | Event Type | Pill selector: Wedding / Prewedding / Party / Commercial |
| 3 | Client Name & WhatsApp | Text + tel input |

### Interaction rules
- Touch target ≥ `min-h-[48px]` for all inputs
- Error state: `text-xs text-rose-500 mt-1` + field `ring-1 ring-luxury-roseGold border-luxury-roseGold`
- Submit → POST to `/api/public/bookings/inquiry` → auto redirect to WA with encoded confirmation

## 5. Responsive Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `< 640px` | Mobile | Single column, collapsed nav, full-width cards |
| `640px–1024px` | Tablet | 2 columns, sidebar nav, grid galleries |
| `≥ 1024px` | Desktop | 3 columns, full hero, sticky nav |