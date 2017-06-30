# Named routes for next.js

[![Build Status](https://travis-ci.org/fridays/next-routes.svg?branch=master)](https://travis-ci.org/fridays/next-routes) [![npm version](https://d25lcipzij17d.cloudfront.net/badge.svg?id=js&type=6&v=1.0.32&x2=0)](https://www.npmjs.com/package/next-routes) [![Greenkeeper badge](https://badges.greenkeeper.io/fridays/next-routes.svg)](https://greenkeeper.io/)

Easy to use universal named routes for [next.js](https://github.com/zeit/next.js)

- Express-style route and parameters matching
- Request handler middleware for express & co
- `Link` and `Router` that generate URLs by route definition

## How to use

Install:

```bash
npm install next-routes
```

Create `routes.js` inside your project root:

```javascript
// routes.js
const nextRoutes = require('next-routes')
const routes = module.exports = nextRoutes()

// Named routes
routes.add('blog', '/blog/:slug')
routes.add('about', '/about-us/:foo(bar|baz)', 'index')

// Unnamed routes
routes.add('/some/:thing', 'page')
```
This file is used both on the server and the client.

API: `routes.add(name, pattern, page = name)`

- `name` - Optional: The route name
- `pattern` - Express-style route pattern (uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp))
- `page` - Page inside `./pages` to be rendered. Optional for named routes (defaults to `name`), mandatory for unnamed routes.

The page component receives the matched URL parameters merged into `query`

```javascript
export default class Blog extends React.Component {
  static async getInitialProps ({query}) {
    // query.slug
  }
  render () {
    // this.props.url.query.slug
  }
}
```

### On the server

```javascript
// server.js
const next = require('next')
const routes = require('./routes')
const app = next({dev: process.env.NODE_ENV !== 'production'})
const handler = routes.getRequestHandler(app)

// With express.js
const express = require('express')
app.prepare().then(() => {
  express().use(handler).listen(3000)
})

// Without express.js
const {createServer} = require('http')
app.prepare().then(() => {
  createServer(handler).listen(3000)
})

```
Optionally you can pass a custom handler, for example:
```javascript
const handler = routes.getRequestHandler(app, ({req, res, route, query}) => {
  app.render(req, res, route.page, query)
})
```

### On the client

Thin wrappers around `Link` and `Router` add support for generated URLs based on route definition. Just import them from your `routes` file:

#### `Link` example

```jsx
// pages/index.js
import {Link} from '../routes'

export default () => (
  <div>
    <div>Welcome to next.js!</div>
    <Link route='blog' params={{slug: 'hello-world'}}>
      <a>Hello world</a>
    </Link>
    or:
    <Link route='/blog/hello-world'>
      <a>Hello world</a>
    </Link>
  </div>
)

```

API: `<Link route='name' params={params}>...</Link>`

Or: `<Link route='/path/to/match'>...</Link>`

- `route` - Name of a route or URL to match
- `params` - Optional parameters for the route URL

It generates the URL and passes `href` and `as` props to `next/link`. Other props like `prefetch` will work as well.

---

#### `Router` example

```jsx
// pages/blog.js
import React from 'react'
import {Router} from '../routes'

export default class extends React.Component {
  handleClick () {
    Router.pushRoute('about', {foo: 'bar'})
    // or
    Router.pushRoute('/about-us/bar')
  }
  render () {
    return (
      <div>
        <div>{this.props.url.query.slug}</div>
        <button onClick={this.handleClick}>
          Home
        </button>
      </div>
    )
  }
}
```
API:

`Router.pushRoute(route, params, options)`

`Router.replaceRoute(route, params, options)`

`Router.prefetchRoute(route, params)`

- `route` - Name of a route or URL to match
- `params` - Optional parameters for the route URL
- `options`

It generates the URL and passes `url`, `as` and `options` parameters to `next/router`.

---

You can optionally provide custom `Link` and `Router` objects, for example:

```javascript
// routes.js
const nextRoutes = require('next-routes')
const Link = require('./my/link')
const Router = require('./my/router')
const routes = module.exports = nextRoutes({Link, Router})
```

---

##### Related links

- [zeit/next.js](https://github.com/zeit/next.js) - Minimalistic framework for server-rendered React applications
- [path-to-regexp](https://github.com/pillarjs/path-to-regexp) - Express-style path to regexp
