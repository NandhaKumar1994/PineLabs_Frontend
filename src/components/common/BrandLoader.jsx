// Branded loading indicator: the Pine Labs brand MARK (the arrowhead
// symbol) centered inside a circular spinner ring.
//
// The mark is INLINED as SVG (not an <img src>) on purpose: an <img>
// has to be fetched over the network before it paints, so the ring —
// which is pure CSS — would appear first and the logo would pop in a
// moment later. Inlining the SVG makes the mark paint together with the
// ring, instantly, with no request and no flash of an empty ring.
//
// The path is the single polygon from src/assets/pinelabs-logo.svg
// (viewBox "92 91 216 216"); it inherits the app brand colour via
// `text-primary` / currentColor.
//
// Two render modes:
//   - OVERLAY (default): absolutely covers its nearest positioned
//     ancestor (e.g. a modal) with a translucent backdrop, blocking
//     interaction while an async action (like a bulk import) is in flight.
//   - INLINE (`inline` prop): a normal centered block with no backdrop —
//     for embedding in a table cell / empty state (e.g. "Loading
//     instances…").
//
// Props:
//   label     - text under the spinner (e.g. "Importing records…")
//   inline    - render as an in-flow block instead of a covering overlay
//   className - extra classes for the wrapper

// Pine Labs arrowhead mark, inlined so it paints instantly with the ring.
function PineLabsMark({ className = '' }) {
  return (
    <svg viewBox="92 91 216 216" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="181,91 308,91 308,218 219,307 219,181 92,181" />
    </svg>
  )
}

export default function BrandLoader({ label = 'Loading…', inline = false, className = '' }) {
  const wrapperCls = inline
    ? `flex flex-col items-center justify-center gap-3 py-4 ${className}`
    : `absolute inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-white/85 backdrop-blur-sm ${className}`

  const ringSize = inline ? 'h-14 w-14' : 'h-20 w-20'
  const markSize = inline ? 'h-6 w-6' : 'h-8 w-8'

  return (
    <div className={wrapperCls} role="status" aria-live="polite" aria-busy="true">
      <div className={`relative grid ${ringSize} place-items-center`}>
        {/* Spinning ring rotates around the logo mark, which stays still
            and centered inside it. */}
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/15 border-t-primary" />
        <PineLabsMark className={`${markSize} text-primary`} />
      </div>
      {label && <p className="text-sm font-semibold text-heading">{label}</p>}
    </div>
  )
}
