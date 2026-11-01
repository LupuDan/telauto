import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../../lib/categories'
import { countActiveFilters, filtersToParams, filtersToSearchArgs, PAGE_SIZE, parseFilters } from './filters'

const params = (query: string) => new URLSearchParams(query)
const vehicles = CATEGORIES.autovehicule
const phones = CATEGORIES.telefoane
const parts = CATEGORIES['piese-auto']

describe('Filtrele din adresă', () => {
  it('citește filtrele generale', () => {
    const f = parseFilters(params('q=dacia&loc=5&cond=used&pmin=1000&pmax=5000&cur=EUR&sort=cheap&page=3'), undefined)
    expect(f).toMatchObject({
      q: 'dacia', locality: '5', condition: 'used', priceMin: '1000', priceMax: '5000',
      currency: 'EUR', sort: 'cheap', page: 3,
    })
  })
  it('ignoră valorile greșite (nu se strică pagina dacă linkul e modificat de mână)', () => {
    const f = parseFilters(params('loc=abc&cond=broken&pmin=-5&sort=random&page=0&f.fuel=apa'), vehicles)
    expect(f).toMatchObject({ locality: '', condition: '', priceMin: '', sort: 'new', page: 1 })
    expect(f.attributes).toEqual({})
  })
  it('citește filtrele categoriei: listă, interval, marcă', () => {
    const f = parseFilters(params('f.fuel=diesel&f.year.min=2010&f.year.max=2018&f.make_id=4&f.model_id=9'), vehicles)
    expect(f.attributes).toEqual({ fuel: 'diesel', make_id: '4', model_id: '9' })
    expect(f.ranges).toEqual({ year: { min: '2010', max: '2018' } })
  })
  it('un model fără marcă este ignorat', () => {
    const f = parseFilters(params('f.model_id=9'), vehicles)
    expect(f.attributes).toEqual({})
  })
  it('filtrele altei categorii sunt ignorate', () => {
    const f = parseFilters(params('f.fuel=diesel'), phones)
    expect(f.attributes).toEqual({})
  })
  it('compatibilitatea doar la piese, anul doar cu marca', () => {
    expect(parseFilters(params('cmake=1&cmodel=2&cyear=2015'), parts)).toMatchObject({
      compatMake: '1', compatModel: '2', compatYear: '2015',
    })
    expect(parseFilters(params('cyear=2015'), parts).compatYear).toBe('')
    expect(parseFilters(params('cmake=1'), vehicles).compatMake).toBe('')
  })
  it('scrie înapoi doar ce e setat (linkuri scurte) și citește la fel', () => {
    const f = parseFilters(params('f.fuel=diesel&f.year.min=2010&sort=expensive&page=2'), vehicles)
    const query = filtersToParams(f).toString()
    expect(query).toBe('f.fuel=diesel&f.year.min=2010&sort=expensive&page=2')
    expect(parseFilters(params(query), vehicles)).toEqual(f)
  })
  it('numără filtrele active (butonul „Filtre” pe telefon)', () => {
    const f = parseFilters(params('q=x&loc=1&pmin=10&pmax=20&f.fuel=diesel&f.year.min=2010&sort=cheap'), vehicles)
    expect(countActiveFilters(f)).toBe(4)
  })
})

describe('Filtre -> search_listings()', () => {
  it('folosește aceleași tipuri ca la salvare, altfel nu s-ar găsi nimic', () => {
    const f = parseFilters(params('f.brand_id=2&f.storage_gb=128&f.warranty=yes&f.network_lock=unlocked'), phones)
    expect(filtersToSearchArgs(f, phones).p_attributes).toEqual({
      brand_id: 2, storage_gb: 128, warranty: true, network_lock: 'unlocked',
    })
  })
  it('intervalele devin [min, max], cu null pentru capătul lipsă', () => {
    const f = parseFilters(params('f.year.min=2010&f.mileage_km.max=200000'), vehicles)
    expect(filtersToSearchArgs(f, vehicles).p_ranges).toEqual({ year: [2010, null], mileage_km: [null, 200000] })
  })
  it('prețul, moneda, pagina și categoria', () => {
    const f = parseFilters(params('pmin=1 000&pmax=2000,50&cur=EUR&page=3'), vehicles)
    expect(filtersToSearchArgs(f, vehicles)).toMatchObject({
      p_category_id: 3, p_price_min: 1000, p_price_max: 2000.5, p_currency: 'EUR',
      p_limit: PAGE_SIZE, p_offset: 2 * PAGE_SIZE,
    })
  })
  it('fără filtre nu trimite nimic în plus', () => {
    const args = filtersToSearchArgs(parseFilters(params(''), undefined), undefined)
    expect(args).toEqual({ p_sort: 'new', p_limit: PAGE_SIZE, p_offset: 0 })
  })
})
