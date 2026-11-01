import { describe, expect, it } from 'vitest'
import { CATEGORIES, CATEGORY_SLUGS } from '../lib/categories'
import ro from './ro.json'
import ru from './ru.json'

type Tree = { [key: string]: string | Tree }

/** All keys as "a.b.c"; plural endings (_one, _few, _many, _other) are merged. */
function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key.replace(/_(one|few|many|other)$/, '')}`] : keys(value, `${prefix}${key}.`),
  )
}
function get(tree: Tree, path: string): unknown {
  return path.split('.').reduce<unknown>((node, part) => (node as Tree | undefined)?.[part], tree)
}

describe('Traduceri', () => {
  it('română și rusă au aceleași texte', () => {
    const roKeys = new Set(keys(ro as unknown as Tree))
    const ruKeys = new Set(keys(ru as unknown as Tree))
    expect([...roKeys].filter((key) => !ruKeys.has(key))).toEqual([])
    expect([...ruKeys].filter((key) => !roKeys.has(key))).toEqual([])
  })
  it('niciun text gol', () => {
    for (const tree of [ro, ru] as unknown as Tree[]) {
      const empty = keys(tree).filter((key) => get(tree, key) === '')
      expect(empty).toEqual([])
    }
  })
  it('fiecare câmp și fiecare opțiune din categories.ts are traducere', () => {
    for (const lang of [ro, ru] as unknown as Tree[]) {
      for (const slug of CATEGORY_SLUGS) {
        expect(get(lang, `categories.${slug}`)).toBeTypeOf('string')
        for (const field of CATEGORIES[slug].fields) {
          expect(get(lang, `fields.${field.key}.label`), field.key).toBeTypeOf('string')
          if (field.type === 'select') {
            for (const option of field.options) {
              expect(get(lang, `fields.${field.key}.options.${option}`), `${field.key}.${option}`).toBeTypeOf('string')
            }
          }
          if (field.type === 'reference' && field.otherKey) {
            expect(get(lang, `fields.${field.otherKey}.label`), field.otherKey).toBeTypeOf('string')
          }
        }
      }
    }
  })
})
