import * as React from 'react'

export interface DefaultFeature {
  slug: string
}

export type TCache = Record<string, DefaultFeature>

export type FeatureProviderProps =
  | {
      cache: TCache
      children: React.ReactNode
    }
  | {
      features: DefaultFeature[]
      children: React.ReactNode
    }

export interface FeatureContextValue {
  cache: TCache
}

export const Op = {
  OR: '$or' as const,
  AND: '$and' as const,
}

export type FlagQuery =
  | string
  | FlagQuery[]
  | {
      [Op.OR]: FlagQuery[]
    }
  | {
      [Op.AND]: FlagQuery[]
    }
  | {
      [slug: string]: boolean
    }

const NO_PROVIDER = '__toggled_no_provder_id__'

// @ts-ignore
export const FeatureContext = React.createContext<FeatureContextValue>(NO_PROVIDER)

export function createCache<F extends DefaultFeature = DefaultFeature>(features: F[]) {
  return features.reduce((cache, current) => {
    cache[current.slug] = current
    return cache
  }, {} as Record<string, F>)
}

export function FeatureProvider(props: FeatureProviderProps) {
  // @ts-expect-error
  const { features, cache, children } = props

  const contextValue = React.useMemo(() => {
    return { cache: cache ?? createCache(features) }
  }, [cache, features])

  return <FeatureContext.Provider value={contextValue}>{children}</FeatureContext.Provider>
}

function useToggledContext() {
  const contextValue = React.useContext(FeatureContext)

  // @ts-ignore
  if (contextValue === NO_PROVIDER) {
    throw new Error('Component must be wrapped with FeatureProvider.')
  }

  return contextValue
}

export function useFeature(slug: string) {
  const { cache } = useToggledContext()

  return cache[slug]
}

export function createFlagQueryFn(cache: Record<string, DefaultFeature>) {
  return function flagQueryFn(flagQuery: FlagQuery) {
    if (typeof flagQuery === 'string') {
      return Boolean(cache[flagQuery])
    }

    if (Array.isArray(flagQuery)) {
      for (const query of flagQuery) {
        if (!flagQueryFn(query)) {
          return false
        }
      }

      return true
    }

    for (let key in flagQuery) {
      let phase: boolean

      if (key === Op.OR) {
        phase = false

        // @ts-expect-error
        for (const innerQuery of flagQuery[key]) {
          if (flagQueryFn(innerQuery)) {
            phase = true
            break
          }
        }
      } else if (key === Op.AND) {
        phase = true

        // @ts-expect-error
        for (const innerQuery of flagQuery[key]) {
          if (!flagQueryFn(innerQuery)) {
            phase = false
            break
          }
        }
      } else {
        // @ts-expect-error
        phase = Boolean(cache[key]) === flagQuery[key]
      }

      if (!phase) {
        return false
      }
    }

    return true
  }
}

export function useFlagQueryFn() {
  const { cache } = useToggledContext()

  return React.useMemo(() => createFlagQueryFn(cache), [cache])
}

export function useFlag(flagQuery: FlagQuery) {
  const flagQueryFn = useFlagQueryFn()

  return flagQueryFn(flagQuery)
}

export interface FlagProps {
  flagQuery: FlagQuery
  children: React.ReactNode
}

export function Flag({ flagQuery, children }: FlagProps) {
  const enabled = useFlag(flagQuery)

  if (!enabled) {
    return null
  }

  return children as React.ReactElement
}

export interface FeatureProps {
  slug: string
  children(feature: DefaultFeature): React.ReactElement
}

export function Feature({ slug, children }: FeatureProps) {
  const feature = useFeature(slug)

  if (!feature) {
    return null
  }

  return children(feature)
}
