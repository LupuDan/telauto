// #/styleguide – only in development (npm run dev), never in the published site (see App.tsx).
// Shows every token and every component with its states, so the owner can check the design
// in one place (TELAUTO_PLAN_DESIGN_v1.md, section 0). The texts here are sample data for the
// developer page, not site texts, so they are written directly in the file.
import { useState, type ReactNode } from 'react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { Alert } from '../components/ui/Alert'
import { Button, type ButtonVariant } from '../components/ui/Button'
import { CheckboxField } from '../components/ui/CheckboxField'
import { ChipGroup } from '../components/ui/ChipGroup'
import { RangeInput } from '../components/ui/RangeInput'
import { SelectField } from '../components/ui/SelectField'
import { Spinner } from '../components/ui/Spinner'
import { TextField } from '../components/ui/TextField'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-panel border border-line bg-surface p-4 md:p-6">
      <h2 className="type-h2">{title}</h2>
      {children}
    </section>
  )
}

function Swatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className={`h-14 ${className}`} />
      <div className="p-2 text-sm">
        <p className="font-medium">{name}</p>
        <p className="tabular text-muted">{hex}</p>
      </div>
    </div>
  )
}

const BASE_COLORS = [
  ['Cerneală (ink)', '#1F2A37', 'bg-ink'],
  ['Albastru (brand)', '#1B4DB1', 'bg-brand'],
  ['Galben etichetă (tag)', '#FFC233', 'bg-tag'],
  ['Hârtie (paper)', '#F5F7FA', 'bg-paper'],
  ['Alb (surface)', '#FFFFFF', 'bg-surface'],
  ['Gri (muted)', '#64748B', 'bg-muted'],
] as const

const SUPPORT_COLORS = [
  ['brand-50', '#EDF2FC', 'bg-brand-50'],
  ['brand-700', '#163E8F', 'bg-brand-700'],
  ['tag-600', '#E5A400', 'bg-tag-600'],
  ['tag-50', '#FFF6DB', 'bg-tag-50'],
  ['line', '#DDE3EA', 'bg-line'],
  ['success', '#1F8A4C', 'bg-success'],
  ['danger', '#C62828', 'bg-danger'],
] as const

const TYPE_SCALE = [
  ['display', 'type-display', 'Cumpără și vinde ușor, în toată Moldova'],
  ['h1', 'type-h1', 'Autovehicule – Покупайте и продавайте'],
  ['h2', 'type-h2', 'Anunțuri noi · Новые объявления'],
  ['price-lg', 'type-price-lg', '12 500 lei'],
  ['price', 'type-price', '8 900 €'],
  ['body', 'type-body', 'Mașina este în stare foarte bună, întreținută la zi. Șofer ți-a spus: țară, șină.'],
  ['small', 'type-small', 'Bălți · azi, 14:32 · Кишинёв, сегодня'],
  ['micro', 'type-micro', '2015 · 180 000 km · 128 GB'],
] as const

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: 'primary', label: 'Trimite mesajul' },
  { variant: 'action', label: 'Adaugă anunț' },
  { variant: 'secondary', label: 'Arată telefonul' },
  { variant: 'ghost', label: 'Șterge filtrele' },
  { variant: 'danger', label: 'Șterge anunțul' },
]

const FUEL = [
  { value: 'petrol', label: 'Benzină' },
  { value: 'diesel', label: 'Motorină' },
  { value: 'lpg', label: 'Gaz / benzină' },
  { value: 'hybrid', label: 'Hibrid' },
  { value: 'electric', label: 'Electric' },
]

export function StyleguidePage() {
  const [fuel, setFuel] = useState<string | string[]>('diesel')
  const [fuels, setFuels] = useState<string | string[]>(['petrol', 'hybrid'])
  const [range, setRange] = useState({ from: '2015', to: '' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h1">Sistemul de design</h1>
        <p className="mt-1 text-muted">
          Pagină vizibilă doar în modul de dezvoltare. Verifică la 360, 768 și 1280 px, în română și rusă, în
          modul luminos și întunecat.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle variant="full" />
        </div>
      </div>

      <Section title="Logo">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <Logo variant="full" />
            <p className="text-sm text-muted">full – 36 px (antet desktop)</p>
          </div>
          <div className="space-y-2">
            <Logo variant="compact" />
            <p className="text-sm text-muted">compact – 30 px (antet mobil)</p>
          </div>
          <div className="space-y-2">
            <Logo variant="icon" className="size-10" />
            <p className="text-sm text-muted">icon – favicon</p>
          </div>
          <div className="space-y-2">
            <Logo variant="icon" tone="muted" className="size-10" />
            <p className="text-sm text-muted">icon gri – ecrane goale</p>
          </div>
        </div>
      </Section>

      <Section title="Culori de bază">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {BASE_COLORS.map(([name, hex, className]) => (
            <Swatch key={name} name={name} hex={hex} className={className} />
          ))}
        </div>
        <h3 className="font-semibold">Culori de suport</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {SUPPORT_COLORS.map(([name, hex, className]) => (
            <Swatch key={name} name={name} hex={hex} className={className} />
          ))}
        </div>
      </Section>

      <Section title="Tipografie">
        <ul className="divide-y divide-line">
          {TYPE_SCALE.map(([name, className, sample]) => (
            <li key={name} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-20 shrink-0 text-sm text-muted">{name}</span>
              <span className={className}>{sample}</span>
            </li>
          ))}
        </ul>
        <p className="max-w-[70ch]">
          Diacritice: ș ț ă â î Ș Ț Ă Â Î – <span className="font-display">ș ț ă â î Ș Ț</span>. Кириллица: ёЁ
          щЩ ъЪ – <span className="font-display">Привет, Молдова</span>.
        </p>
      </Section>

      <Section title="Colțuri și umbre">
        <div className="flex flex-wrap gap-4">
          <div className="rounded-full border border-line bg-paper px-4 py-2 text-sm">pastilă</div>
          <div className="rounded-field border border-line bg-paper px-4 py-2 text-sm">câmp / buton 10 px</div>
          <div className="rounded-card border border-line bg-paper px-4 py-2 text-sm">card 12 px</div>
          <div className="rounded-panel border border-line bg-paper px-4 py-2 text-sm">panou 16 px</div>
          <div className="rounded-panel bg-surface px-4 py-2 text-sm shadow-float">umbră: doar elemente plutitoare</div>
        </div>
      </Section>

      <Section title="Butoane">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-4 font-medium">varianta</th>
                <th className="py-2 pr-4 font-medium">normal (hover cu mouse-ul)</th>
                <th className="py-2 pr-4 font-medium">focus</th>
                <th className="py-2 pr-4 font-medium">dezactivat</th>
                <th className="py-2 pr-4 font-medium">încărcare</th>
                <th className="py-2 font-medium">compact (desktop)</th>
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map(({ variant, label }) => (
                <tr key={variant} className="align-middle">
                  <td className="py-2 pr-4 text-muted">{variant}</td>
                  <td className="py-2 pr-4">
                    <Button variant={variant}>{label}</Button>
                  </td>
                  <td className="py-2 pr-4">
                    <Button variant={variant} className="outline-2 outline-offset-2 outline-brand">
                      {label}
                    </Button>
                  </td>
                  <td className="py-2 pr-4">
                    <Button variant={variant} disabled>
                      {label}
                    </Button>
                  </td>
                  <td className="py-2 pr-4">
                    <Button variant={variant} loading>
                      {label}
                    </Button>
                  </td>
                  <td className="py-2">
                    <Button variant={variant} size="compact">
                      {label}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 sm:max-w-sm">
          <p className="text-sm text-muted">Lățime completă (telefon), text rusesc lung:</p>
          <Button variant="action" fullWidth>
            Опубликовать объявление
          </Button>
          <Button variant="secondary" fullWidth>
            Показать номер телефона
          </Button>
        </div>
      </Section>

      <Section title="Câmpuri">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Titlul anunțului" placeholder="De exemplu: Toyota RAV4 2.0" />
          <TextField label="Preț" unit="lei" inputMode="numeric" defaultValue="12 500" hint="Fără spații sau puncte." />
          <TextField label="Kilometri" unit="km" inputMode="numeric" error="Indică un număr între 0 și 2 000 000." />
          <TextField label="Culoare" optional placeholder="Neagră" />
          <TextField label="Memorie" unit="GB" disabled defaultValue="128" />
          <SelectField label="Localitate" defaultValue="balti">
            <option value="chisinau">Chișinău</option>
            <option value="balti">Bălți</option>
            <option value="cahul">Cahul</option>
          </SelectField>
          <SelectField label="Cutie de viteze" error="Alege o variantă." defaultValue="">
            <option value="">Alege</option>
            <option value="manual">Manuală</option>
          </SelectField>
          <RangeInput label="Anul fabricației" from={range.from} to={range.to} onChange={setRange} />
          <RangeInput label="Preț" unit="€" from="" to="" onChange={() => {}} error="„De la” trebuie să fie mai mic." />
        </div>
        <ChipGroup label="Combustibil (o variantă)" options={FUEL} value={fuel} onChange={setFuel} />
        <ChipGroup label="Combustibil (mai multe variante)" options={FUEL} value={fuels} onChange={setFuels} multiple />
        <ChipGroup label="Stare" options={FUEL.slice(0, 2)} value="" onChange={() => {}} error="Alege o variantă." />
        <CheckboxField label="Prețul este negociabil" />
      </Section>

      <Section title="Mesaje și încărcare">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert kind="info">Informație: anunțul va fi verificat.</Alert>
          <Alert kind="success">Anunțul a fost publicat.</Alert>
          <Alert kind="warning">Nu trimite niciodată avans.</Alert>
          <Alert kind="error">Parola trebuie să aibă cel puțin 8 caractere.</Alert>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <Spinner /> Se încarcă...
        </div>
      </Section>
    </div>
  )
}
