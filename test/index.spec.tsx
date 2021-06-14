import * as React from 'react'
import { renderHook, RenderHookOptions } from '@testing-library/react-hooks'
import { FeatureProvider, useFeature, useFlag, useFlagQuery, FeatureProviderProps } from '../src'
import features from './fixtures/features.json'

const messages = {
  NO_PROVIDER: 'Component must be wrapped with FeatureProvider.',
}

function render<TResult>(
  callback: (props: FeatureProviderProps) => TResult,
  options?: RenderHookOptions<FeatureProviderProps>,
) {
  const wrapper = ({ children }: FeatureProviderProps) => (
    <FeatureProvider features={features}>{children}</FeatureProvider>
  )

  return renderHook(callback, { wrapper, ...options })
}

describe('useFeature', () => {
  it('gets the feature when it is in the context', () => {
    const { result } = render(() => useFeature('example-1'))

    expect(result.current).toMatchObject({
      slug: 'example-1',
      settings: {},
    })
  })

  it('gets `undefined` when it is not in the context', () => {
    const { result } = render(() => useFeature('xyz'))

    expect(result.current).toBeUndefined()
  })

  it('crashs when the provider is not wrapper', () => {
    const { result } = renderHook(() => useFeature('example-1'))

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })
})

describe('useFlag', () => {
  it('gets `true` when a feature is in the context', () => {
    const { result } = render(() => useFlag('example-1'))

    expect(result.current).toBe(true)
  })

  it('gets `false` when a feature is in the context', () => {
    const { result } = render(() => useFlag('xyz'))

    expect(result.current).toBe(false)
  })

  it('crashs when the provider is not wrapper', () => {
    const { result } = renderHook(() => useFlag('example-1'))

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })
})

describe('useFlagQuery', () => {
  it('gets `true` when a feature is in the context', () => {
    const {
      result: { current: flagQuery },
    } = render(() => useFlagQuery())

    expect(flagQuery('example-1')).toBe(true)
  })

  it('gets `true` when the flag query is truthy', () => {
    const {
      result: { current: flagQuery },
    } = render(() => useFlagQuery())

    expect(flagQuery({ 'example-1': true, xyz: false })).toBe(true)
  })

  it('gets `false` when the flag query is falsy', () => {
    const {
      result: { current: flagQuery },
    } = render(() => useFlagQuery())

    expect(flagQuery({ 'example-1': false, xyz: true })).toBe(false)
  })

  it('crashs when the provider is not wrapper', () => {
    const { result } = renderHook(() => useFlagQuery())

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })
})
