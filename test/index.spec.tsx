import * as React from 'react'
import { renderHook, RenderHookOptions } from '@testing-library/react-hooks'
import { FeatureProvider, useFeature, useFlag, useFlagQuery, FeatureProviderProps, Op } from '../src'
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

function renderFlagQuery() {
  const original = render(() => useFlagQuery())

  return { flagQuery: original.result.current, original }
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
    const { flagQuery } = renderFlagQuery()

    expect(flagQuery('example-1')).toBe(true)
  })

  it('gets `true` when the flag query is truthy', () => {
    const { flagQuery } = renderFlagQuery()

    expect(flagQuery({ 'example-1': true, xyz: false })).toBe(true)
  })

  it('gets `false` when the flag query is falsy', () => {
    const { flagQuery } = renderFlagQuery()

    expect(flagQuery({ 'example-1': false, xyz: true })).toBe(false)
  })

  it('crashes when the provider is not wrapper', () => {
    const { result } = renderHook(() => useFlagQuery())

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })

  it('gets `true` when the `$and` operation succeed', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        [Op.AND]: ['example-1', 'example-2', 'example-3'],
      }),
    ).toBe(true)
  })

  it('gets `false` when the `$and` operation fails', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        [Op.AND]: ['foo', 'bar', 'example-1'],
      }),
    ).toBe(false)
  })

  it('gets `true` when the `$or` operation succeed', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        [Op.OR]: ['example-1', 'xyz'],
      }),
    ).toBe(true)
  })

  it('gets `false` when the `$or` operation fails', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        [Op.OR]: ['foo', 'xyz'],
      }),
    ).toBe(false)
  })

  it('gets `true` when a complex query is truthy', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        'example-1': true,
        'example-3': true,
        abc: false,
        [Op.OR]: ['xyz', 'abc', 'example-1'],
        [Op.OR]: [
          'abc',
          {
            'example-2': true,
            [Op.AND]: ['example-2', 'example-3'],
          },
        ],
        [Op.AND]: ['example-2', 'example-3'],
        [Op.AND]: [
          'example-2',
          {
            jkl: false,
            '007': false,
            [Op.OR]: ['example-2', 'sample-1'],
          },
        ],
      }),
    ).toBe(true)
  })

  it('gets `false` when a complex query is falsy', () => {
    const { flagQuery } = renderFlagQuery()

    expect(
      flagQuery({
        'example-1': false,
        'example-3': false,
        abc: true,
        [Op.AND]: ['xyz', 'abc', 'example-1'],
        [Op.AND]: [
          'abc',
          {
            'example-2': false,
            [Op.OR]: ['example-2', 'example-3'],
          },
        ],
        [Op.OR]: ['example-2', 'example-3'],
        [Op.OR]: [
          'example-2',
          {
            jkl: true,
            '007': true,
            [Op.AND]: ['example-2', 'sample-1'],
          },
        ],
      }),
    ).toBe(false)
  })

  it('crashes when the operator is unknown', () => {
    const { flagQuery } = renderFlagQuery()

    expect(() => {
      flagQuery({
        [Symbol('$xor')]: ['foo', 'xyz'],
      })
    }).toThrow('Invalid Operator')
  })
})
