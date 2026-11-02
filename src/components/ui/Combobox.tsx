import { Check, ChevronDown } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { FieldError, FieldLabel } from './FieldMessage'
import { inputClass } from './fieldStyles'

export type ComboOption = { value: string; label: string }

type ComboboxProps = {
  label: string
  options: readonly ComboOption[]
  /** chosen value ('' = nothing chosen) */
  value: string
  onChange: (value: string) => void
  /** text when nothing is chosen ("Oricare", "– Alege –") */
  placeholder: string
  /** an extra option that stays at the end of the list whatever is typed ("Altul (scrie)") */
  extraOption?: ComboOption
  /** in filters: the empty choice is a real option ("Oricare") */
  allowEmpty?: boolean
  disabled?: boolean
  loading?: boolean
  optional?: boolean
  error?: string
  name?: string
  onBlur?: () => void
}

/** Lower case without diacritics, so "skoda" finds "Škoda" and "chisinau" finds "Chișinău". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()

/**
 * List with search for long lists: make and model (plan de design, section 5).
 * Type to filter, arrows to move, Enter to choose, Esc to close (WAI-ARIA combobox pattern).
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder,
  extraOption,
  allowEmpty = false,
  disabled = false,
  loading = false,
  optional,
  error,
  name,
  onBlur,
}: ComboboxProps) {
  const { t } = useTranslation()
  const id = useId()
  const listId = `${id}-list`
  const errorId = `${id}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const all = useMemo(() => [...options, ...(extraOption ? [extraOption] : [])], [options, extraOption])
  const selected = all.find((option) => option.value === value)

  const shown = useMemo(() => {
    const q = fold(query.trim())
    const matches = q ? options.filter((option) => fold(option.label).includes(q)) : [...options]
    // names that start with the typed text come first
    if (q) matches.sort((a, b) => Number(!fold(a.label).startsWith(q)) - Number(!fold(b.label).startsWith(q)))
    return [
      ...(allowEmpty && !q ? [{ value: '', label: placeholder }] : []),
      ...matches,
      ...(extraOption ? [extraOption] : []),
    ]
  }, [query, options, extraOption, allowEmpty, placeholder])

  function openList() {
    if (disabled) return
    setQuery('')
    setActive(Math.max(0, shown.findIndex((option) => option.value === value)))
    setOpen(true)
  }

  function choose(option: ComboOption) {
    onChange(option.value)
    setOpen(false)
    setQuery('')
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return openList()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((index) => (index + step + shown.length) % Math.max(shown.length, 1))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      const option = shown[active]
      if (option) choose(option)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="relative">
      <FieldLabel htmlFor={id} label={label} optional={optional} />
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : (selected?.label ?? '')}
          placeholder={loading ? t('common.loading') : open && selected ? selected.label : placeholder}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={handleKey}
          onBlur={() => {
            // a click on an option happens before the list closes (onMouseDown below)
            setOpen(false)
            setQuery('')
            onBlur?.()
          }}
          className={`${inputClass(Boolean(error))} pr-10 ${!open && !selected ? 'placeholder:text-ink' : ''}`}
        />
        <ChevronDown
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          strokeWidth={1.75}
        />
      </div>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-field border border-line bg-surface py-1 shadow-float"
        >
          {shown.length === 0 || (shown.length === 1 && extraOption && query) ? (
            <li className="px-3 py-2 text-sm text-muted">{t('common.noMatches')}</li>
          ) : null}
          {shown.map((option, index) => (
            <li
              key={`${option.value}-${index}`}
              id={`${id}-opt-${index}`}
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(option)
              }}
              onMouseMove={() => setActive(index)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-base ${
                index === active ? 'bg-brand-50 text-brand' : 'text-ink'
              } ${option === extraOption ? 'border-t border-line' : ''}`}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={2.25} />}
            </li>
          ))}
        </ul>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
