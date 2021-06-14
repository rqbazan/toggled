<p align="center">
  <img src="./logo/256x256.png" alt="ff logo" width="150" />
</p>

<h1 align="center">
  Feature Flags
</h1>

<p align="center">
  <a href="https://npmjs.org/package/@rqbazan/ff">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@rqbazan/ff.svg?style=for-the-badge">
  </a>
  <a href="https://github.com/rqbazan/ff">
    <img alt="LICENSE" src="https://img.shields.io/github/license/rqbazan/ff?style=for-the-badge">
  </a>
  <a href="https://github.com/rqbazan/ff/actions/workflows/main.yml">
    <img alt="CI" src="https://img.shields.io/github/workflow/status/rqbazan/ff/CI?label=CI&style=for-the-badge">
  </a>
  <a href="https://david-dm.org/rqbazan/ff">
    <img alt="Dependencies" src="https://img.shields.io/david/rqbazan/ff.svg?style=for-the-badge">
  </a>
</p>

Tiny library to use [feature flags](https://martinfowler.com/articles/feature-toggles.html) in React. Get features by its slug identifier or get a binary output using flag queries.

## Installation

NPM:

```sh
npm i @rqbazan/ff
```

Yarn:

```sh
yarn add @rqbazan/ff
```

## API

### `DefaultFeature` <sup>_Interface_</sup>

Internal public interface used by default to type the `<FeatureProvider />` and `useFeature`.

#### Specification

```ts
export interface DefaultFeature {
  slug: string
}
```

#### Example

```ts
// src/types/ff.d.ts
import '@rqbazan/ff'

// extend the interface if needed
declare module '@rqbazan/ff' {
  export interface DefaultFeature {
    slug: string
    settings?: any
  }
}
```

### `FeatureContext`

Library context, exported for no specific reason, avoid using it and prefer the custom hooks, or open a PR to add a new one that obligates you to use the `FeatureContext`.

#### Specification

```ts
interface FeatureContextValue<F extends DefaultFeature = DefaultFeature> {
  cache: Map<string, F>
}
```

### `<FeatureProvider />`

Provider component that exposes the features in a more convenient way to get them by its own slugs.

#### Specification

```ts
interface FeatureProviderProps<F extends DefaultFeature = DefaultFeature> {
  features: F[]
  children: React.ReactNode
}
```

#### Example

```tsx
import { FeatureProvider } from '@rqbazan/ff'
import apiClient from './api-client'
import App from './app'

apiClient.getAllFeatures().then(features => {
  ReactDOM.render(
    <FeatureProvider features={features}>
      <App />
    </FeatureProvider>,
    document.getElementById('root'),
  )
})
```

### `useFeature`

Hook that is used to get a feature object from the context by its slug. Notice that it could be `undefined` because the context **only should contain the features that are enabled.**

#### Specification

```ts
interface UseFeature<F extends DefaultFeature = DefaultFeature> {
  (slug: string): F | undefined
}
```

#### Example

```tsx
// src/app.tsx
import { useFeature } from '@rqbazan/ff'

function App() {
  const themeFF = useFeature('theme')

  return (
    <ThemeProvider theme={themeFF ? themeFF.settings.name : 'default'}>
      <Component />
    </ThemeProvider>
  )
}
```

### `useFlagQuery`

Hook that is used to get the magic function that can process a _feature query_ (FQ), which could be just the feature slug or, and more powerful, one object where the keys are slugs and the values flags.

#### Specification

```ts
interface FlagQuery {
  (query: string | { [slug: string]: boolean }): boolean
}

interface UseFlagQuery {
  (): FlagQuery
}
```

#### Example

```tsx
import { useFlagQuery } from '@rqbazan/ff'

export default function App() {
  const flagQuery = useFlagQuery()

  return (
    <Layout designV2={flagQuery({ 'design-v2': true, 'design-v1': false })}>
      {flagQuery('chat') && <ChatWidget>}
    </Layout>
  )
}
```

### `useFlag`

Hook that is used to get a binary output based on the existence of a feature in the context. So, if the feature is in the context then the flag will be `true`, otherwise `false`.

> The `useFlagQuery` hook is used internally.

#### Specification

```ts
interface UseFlag {
  (query: string | { [slug: string]: boolean }): boolean
}
```

#### Example

```tsx
import { useFlag } from '@rqbazan/ff'

export default function App() {
  const hasChat = useFlag('chat')

  const hasDesignV2 = useFlag({ 'design-v2': true, 'design-v1': false })

  return (
    <Layout designV2={hasDesignV2}>
      {hasChat && <ChatWidget>}
    </Layout>
  )
}
```
