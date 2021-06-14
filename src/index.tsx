import * as React from 'react'

export interface DefaultFeature {
  slug: string
}

export interface FeatureProviderProps<F extends DefaultFeature = DefaultFeature> {
  features: F[]
  children: React.ReactNode
}

export type FeatureQuery = string | { [slug: string]: boolean }

const NO_PROVIDER = {}

export const FeatureContext = React.createContext<any>(NO_PROVIDER)

export function FeatureProvider<F extends DefaultFeature>(props: FeatureProviderProps<F>) {
  const { features, children } = props

  const contextValue = React.useMemo(() => {
    const cache = new Map(features.map(feature => [feature.slug, feature]))

    return { cache }
  }, [features])

  return <FeatureContext.Provider value={contextValue}>{children}</FeatureContext.Provider>
}

function useFFContext() {
  const contextValue = React.useContext(FeatureContext)

  if (contextValue === NO_PROVIDER) {
    throw new Error('Component must be wrapped with FeatureProvider.')
  }

  return contextValue
}

export function useFeature<F extends DefaultFeature = DefaultFeature>(slug: string): F | undefined {
  const { cache } = useFFContext()

  return cache.get(slug)
}

export function useFlagQuery() {
  const { cache } = useFFContext()

  return (query: FeatureQuery) => {
    if (typeof query === 'string') {
      return cache.has(query)
    }

    for (const slug in query) {
      if (cache.has(slug) !== query[slug]) {
        return false
      }
    }

    return true
  }
}

export function useFlag(query: FeatureQuery) {
  const flagQuery = useFlagQuery()

  return flagQuery(query)
}
