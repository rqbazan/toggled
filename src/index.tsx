import * as React from 'react'

export interface DefaultFeature {
  slug: string
}

export interface FeatureProviderProps<F extends DefaultFeature = DefaultFeature> {
  features: F[]
  children: React.ReactNode
}

export interface FeatureContextValue<F extends DefaultFeature = DefaultFeature> {
  cache: Map<string, F>
}

export const Op = {
  OR: Symbol('$or'),
  AND: Symbol('$and'),
}

export type FlagQuery =
  | string
  | FlagQuery[]
  | {
      [slug: string]: boolean
      [operator: symbol]: FlagQuery[]
    }

const NO_PROVIDER = Symbol('No provider')

// @ts-ignore
export const FeatureContext = React.createContext<FeatureContextValue>(NO_PROVIDER)

export function FeatureProvider<F extends DefaultFeature = DefaultFeature>(props: FeatureProviderProps<F>) {
  const { features, children } = props

  const contextValue = React.useMemo(() => {
    const cache = new Map(features.map(feature => [feature.slug, feature]))

    return { cache }
  }, [features])

  return <FeatureContext.Provider value={contextValue}>{children}</FeatureContext.Provider>
}

function useFFContext() {
  const contextValue = React.useContext(FeatureContext)

  // @ts-ignore
  if (contextValue === NO_PROVIDER) {
    throw new Error('Component must be wrapped with FeatureProvider.')
  }

  return contextValue
}

export function useFeature(slug: string) {
  const { cache } = useFFContext()

  return cache.get(slug)
}

export function useFlagQuery() {
  const { cache } = useFFContext()

  return function fn(flagQuery: FlagQuery) {
    if (typeof flagQuery === 'string') {
      return cache.has(flagQuery)
    }

    if (Array.isArray(flagQuery)) {
      for (const query of flagQuery) {
        if (!fn(query)) {
          return false
        }
      }

      return true
    }

    for (let key of Reflect.ownKeys(flagQuery)) {
      let phase: boolean

      if (typeof key === 'string') {
        phase = cache.has(key) === flagQuery[key]
      } else {
        if (key === Op.OR) {
          phase = false

          for (const innerQuery of flagQuery[key]) {
            if (fn(innerQuery)) {
              phase = true
              break
            }
          }
        } else if (key === Op.AND) {
          phase = true

          for (const innerQuery of flagQuery[key]) {
            if (!fn(innerQuery)) {
              phase = false
              break
            }
          }
        } else {
          throw Error('Invalid Op')
        }
      }

      if (!phase) {
        return false
      }
    }

    return true
  }
}

export function useFlag(query: FlagQuery) {
  const flagQuery = useFlagQuery()

  return flagQuery(query)
}
