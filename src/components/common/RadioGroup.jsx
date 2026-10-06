/**
 * Themed radio-group — a reusable single-choice control matching the
 * app's primary color. The selected option is a solid primary disc with
 * a white centered hole (a "donut"); unselected is a hollow gray ring.
 * Use anywhere two-or-more mutually-exclusive choices are picked, e.g.
 * Required/Optional, or a Static/Dynamic response-format toggle.
 *
 * Props:
 *   value     - the currently selected option value
 *   onChange  - (value) => void
 *   options   - array of { value, label } OR array of strings
 *   name      - radio group name (defaults to a generated one)
 *   disabled
 *   direction - 'row' (default) | 'col'
 *   className  - extra classes on the wrapper
 */
let _uid = 0

export default function RadioGroup({
  value,
  onChange,
  options = [],
  name,
  disabled = false,
  direction = 'row',
  className = '',
}) {
  const groupName = name || `radio-group-${(_uid += 1)}`
  const items = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))

  return (
    <div
      role="radiogroup"
      className={`flex ${direction === 'col' ? 'flex-col gap-2' : 'flex-wrap items-center gap-5'} ${className}`}
    >
      {items.map((opt) => {
        const checked = opt.value === value
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 text-sm ${
              disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {/* Selected = solid primary disc with a white centered hole
                (a "donut"); unselected = hollow gray ring. The white
                dot is centered via grid place-items-center. */}
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full transition ${
                checked ? 'bg-primary' : 'border-2 border-gray-300 bg-transparent'
              }`}
            >
              {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span className={checked ? 'font-medium text-heading' : 'text-body'}>{opt.label}</span>
          </label>
        )
      })}
    </div>
  )
}
