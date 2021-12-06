import * as React from 'react'
import { renderHook as _renderHook, RenderHookOptions } from '@testing-library/react-hooks'
import { render as _render, RenderOptions } from '@testing-library/react'
import { FeatureProvider, useFeature, useFlag, useFlagQueryFn, FeatureProviderProps, Op, Flag, Feature } from '../src'
import features from './fixtures/features.json'

const messages = {
  NO_PROVIDER: 'Component must be wrapped with FeatureProvider.',
}

const wrapper = ({ children }: Partial<FeatureProviderProps>) => (
  <FeatureProvider features={features}>{children}</FeatureProvider>
)

function renderHook<TResult>(
  callback: (props: FeatureProviderProps) => TResult,
  options?: RenderHookOptions<FeatureProviderProps>,
) {
  return _renderHook(callback, { wrapper, ...options })
}

function render(ui: React.ReactElement<any>, options?: RenderOptions) {
  return _render(ui, { wrapper, ...options })
}

function renderFlagQueryFn() {
  const original = renderHook(() => useFlagQueryFn())

  return { flagQueryFn: original.result.current, original }
}

describe('useFeature', () => {
  it('gets the feature when it is in the context', () => {
    const { result } = renderHook(() => useFeature('example-1'))

    expect(result.current).toMatchObject({
      slug: 'example-1',
      settings: {},
    })
  })

  it('gets `undefined` when it is not in the context', () => {
    const { result } = renderHook(() => useFeature('xyz'))

    expect(result.current).toBeUndefined()
  })

  it('crashes when the provider is not wrapper', () => {
    const { result } = _renderHook(() => useFeature('example-1'))

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })
})

describe('useFlag', () => {
  it('gets `true` when a feature is in the context', () => {
    const { result } = renderHook(() => useFlag('example-1'))

    expect(result.current).toBe(true)
  })

  it('gets `false` when a feature is in the context', () => {
    const { result } = renderHook(() => useFlag('xyz'))

    expect(result.current).toBe(false)
  })

  it('crashes when the provider is not wrapper', () => {
    const { result } = _renderHook(() => useFlag('example-1'))

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })
})

describe('useFlagQueryFn', () => {
  it('gets `true` when a feature is in the context', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(flagQueryFn('example-1')).toBe(true)
  })

  it('gets `true` when the flag query is truthy', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(flagQueryFn({ 'example-1': true, xyz: false })).toBe(true)
  })

  it('gets `false` when the flag query is falsy', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(flagQueryFn({ 'example-1': false, xyz: true })).toBe(false)
  })

  it('crashes when the provider is not wrapper', () => {
    const { result } = _renderHook(() => useFlagQueryFn())

    expect(result.error?.message).toEqual(messages.NO_PROVIDER)
  })

  it('gets `true` when the `$and` operation succeed', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
        [Op.AND]: ['example-1', 'example-2', 'example-3'],
      }),
    ).toBe(true)
  })

  it('gets `false` when the `$and` operation fails', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
        [Op.AND]: ['foo', 'bar', 'example-1'],
      }),
    ).toBe(false)
  })

  it('gets `true` when the `$or` operation succeed', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
        [Op.OR]: ['example-1', 'xyz'],
      }),
    ).toBe(true)
  })

  it('gets `false` when the `$or` operation fails', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
        [Op.OR]: ['foo', 'xyz'],
      }),
    ).toBe(false)
  })

  it('gets `true` when a complex query is truthy', () => {
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
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
    const { flagQueryFn } = renderFlagQueryFn()

    expect(
      flagQueryFn({
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
})

describe('Flag', () => {
  it('does not render if the flag query is false', () => {
    const { getByTestId, container } = render(
      <Flag flagQuery="not-valid">
        <span data-testid="sample">Sample Text</span>
      </Flag>,
    )

    expect(container.children.length).toBe(0)
    expect(() => getByTestId(/sample/i)).toThrowError()
  })

  it('renders if the flag query is true', () => {
    const { getByTestId, container } = render(
      <Flag flagQuery="example-1">
        <span data-testid="sample">Sample Text</span>
      </Flag>,
    )

    expect(container.children.length).toBe(1)
    expect(getByTestId(/sample/i)).not.toBeUndefined()
  })
})

describe('Feature', () => {
  it('does not render if the feature does not exist', () => {
    const { getByTestId, container } = render(
      <Feature slug="not-valid">
        {feature => {
          return <span data-testid={feature.slug}>Sample Text</span>
        }}
      </Feature>,
    )

    expect(container.children.length).toBe(0)
    expect(() => getByTestId(/sample/i)).toThrowError()
  })

  it('renders if the feature exists', () => {
    const { getByTestId, container } = render(
      <Feature slug="example-1">
        {feature => {
          return <span data-testid={feature.slug}>Sample Text</span>
        }}
      </Feature>,
    )

    expect(container.children.length).toBe(1)
    expect(getByTestId(/example-1/i)).not.toBeUndefined()
  })
})
