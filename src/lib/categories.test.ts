import { describe, expect, it } from 'vitest'
import {
  attributesToForm,
  buildAttributes,
  CATEGORIES,
  categoryById,
  categoryBySlug,
  OTHER_VALUE,
  validateAttributes,
} from './categories'

const phones = CATEGORIES.telefoane
const vehicles = CATEGORIES.autovehicule

describe('Categorii', () => {
  it('id-urile corespund cu baza de date (seed.sql)', () => {
    expect(categoryBySlug('telefoane')?.id).toBe(1)
    expect(categoryBySlug('accesorii-telefoane')?.id).toBe(2)
    expect(categoryBySlug('autovehicule')?.id).toBe(3)
    expect(categoryBySlug('piese-auto')?.id).toBe(4)
    expect(categoryById(4)?.slug).toBe('piese-auto')
    expect(categoryBySlug('nu-exista')).toBeUndefined()
  })
  it('pozele minime (plan, secțiunea 6) – aceleași ca în publish_listing()', () => {
    expect(CATEGORIES.telefoane.minPhotos).toBe(3)
    expect(CATEGORIES['accesorii-telefoane'].minPhotos).toBe(1)
    expect(CATEGORIES.autovehicule.minPhotos).toBe(5)
    expect(CATEGORIES['piese-auto'].minPhotos).toBe(1)
  })
  it('doar piesele cer compatibilități; IMEI la telefoane, VIN la mașini', () => {
    expect(CATEGORIES['piese-auto'].hasCompatibility).toBe(true)
    expect(phones.privateField).toBe('imei')
    expect(vehicles.privateField).toBe('vin')
  })
})

describe('Câmpurile obligatorii și validarea', () => {
  it('telefon fără câmpuri: cere marca, modelul, memoria și rețeaua', () => {
    const errors = validateAttributes(phones, {})
    expect(Object.keys(errors).sort()).toEqual(['brand_id', 'model_id', 'network_lock', 'storage_gb'])
  })
  it('telefon complet: fără erori', () => {
    const values = { brand_id: '1', model_id: '5', storage_gb: '128', network_lock: 'unlocked' }
    expect(validateAttributes(phones, values)).toEqual({})
  })
  it('„Alt model” cere textul modelului', () => {
    const values = { brand_id: '1', model_id: OTHER_VALUE, storage_gb: '128', network_lock: 'unlocked' }
    expect(validateAttributes(phones, values)).toEqual({ model_other: 'validation.required' })
    expect(validateAttributes(phones, { ...values, model_other: 'Model rar' })).toEqual({})
  })
  it('bateria trebuie să fie între 1 și 100', () => {
    const base = { brand_id: '1', model_id: '5', storage_gb: '128', network_lock: 'unlocked' }
    expect(validateAttributes(phones, { ...base, battery_health: '101' })).toEqual({ battery_health: 'validation.range' })
    expect(validateAttributes(phones, { ...base, battery_health: '89.5' })).toEqual({ battery_health: 'validation.integer' })
    expect(validateAttributes(phones, { ...base, battery_health: '89' })).toEqual({})
  })
  it('o opțiune care nu e în listă e refuzată', () => {
    const base = { brand_id: '1', model_id: '5', storage_gb: '128', network_lock: 'unlocked' }
    expect(validateAttributes(phones, { ...base, storage_gb: '100' })).toEqual({ storage_gb: 'validation.required' })
  })
  it('mașină: anul în afara limitelor e refuzat', () => {
    const values = {
      make_id: '1', model_id: '2', year: '1900', mileage_km: '1000',
      fuel: 'diesel', transmission: 'manual', body_type: 'sedan',
    }
    expect(validateAttributes(vehicles, values)).toEqual({ year: 'validation.range' })
  })
  it('garanția „până când” se cere doar dacă există garanție', () => {
    const base = { brand_id: '1', model_id: '5', storage_gb: '128', network_lock: 'unlocked' }
    expect(validateAttributes(phones, { ...base, warranty: 'no', warranty_until: 'nu e dată' })).toEqual({})
    expect(validateAttributes(phones, { ...base, warranty: 'yes', warranty_until: 'nu e dată' })).toEqual({
      warranty_until: 'validation.date',
    })
  })
})

describe('Salvare și editare (formular <-> baza de date)', () => {
  it('numerele, da/nu și mărcile se salvează cu tipul corect (pentru filtre)', () => {
    const stored = buildAttributes(phones, {
      brand_id: '3', model_id: '7', storage_gb: '256', network_lock: 'locked',
      battery_health: '90', warranty: 'yes', warranty_until: '2027-01-01', color: '  negru  ',
    })
    expect(stored).toEqual({
      brand_id: 3, model_id: 7, storage_gb: 256, network_lock: 'locked',
      battery_health: 90, warranty: true, warranty_until: '2027-01-01', color: 'negru',
    })
  })
  it('„Alt model” salvează textul, nu id-ul', () => {
    const stored = buildAttributes(phones, {
      brand_id: '3', model_id: OTHER_VALUE, model_other: 'X100', storage_gb: '64', network_lock: 'unlocked',
    })
    expect(stored.model_other).toBe('X100')
    expect(stored.model_id).toBeUndefined()
  })
  it('câmpurile ascunse nu se salvează', () => {
    const stored = buildAttributes(phones, {
      brand_id: '3', model_id: '7', storage_gb: '64', network_lock: 'unlocked', warranty: 'no', warranty_until: '2027-01-01',
    })
    expect(stored.warranty_until).toBeUndefined()
  })
  it('editarea arată în formular exact ce s-a salvat', () => {
    const form = { brand_id: '3', model_id: OTHER_VALUE, model_other: 'X100', storage_gb: '64', network_lock: 'unlocked', warranty: 'no' }
    const back = attributesToForm(phones, buildAttributes(phones, form))
    expect(back).toMatchObject(form)
  })
})
