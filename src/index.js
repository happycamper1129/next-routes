import pathToRegexp from 'path-to-regexp'
import React from 'react'
import {default as NextLink} from 'next/link'
import {default as NextRouter} from 'next/router'

module.exports = opts => new Routes(opts)

class Routes {
  constructor ({Link = NextLink, Router = NextRouter} = {}) {
    this.routes = []
    this.Link = this.getLink(Link)
    this.Router = this.getRouter(Router)
  }

  add (name, pattern, page) {
    const route = new Route(name, pattern, page)
    this.routes.push(route)
  }

  findByName (name) {
    return this.routes.find(route => route.name === name)
  }

  match (path) {
    for (let route of this.routes) {
      const params = route.match(path)
      if (params) {
        return {route, params}
      }
    }
  }

  getRequestHandler (app) {
    const nextHandler = app.getRequestHandler()

    return (req, res) => {
      const {path, query} = req
      const {route, params} = this.match(path) || {}

      if (route) {
        app.render(req, res, route.page, {...query, ...params})
      } else {
        nextHandler(req, res)
      }
    }
  }

  getLink (Link) {
    return props => {
      const {route, params, ...newProps} = props

      if (route) {
        Object.assign(newProps, this.findByName(route).getLinkProps(params))
      }

      return <Link {...newProps} />
    }
  }

  getRouter (Router) {
    const pushRoute = (name, params = {}) => {
      const {href, as} = this.findByName(name).getLinkProps(params)
      return Router.push(href, as)
    }

    const replaceRoute = (name, params = {}) => {
      const {href, as} = this.findByName(name).getLinkProps(params)
      return Router.replace(href, as)
    }

    return {...Router, pushRoute, replaceRoute}
  }
}

class Route {
  constructor (name, pattern, page = name) {
    this.name = name
    this.pattern = pattern
    this.page = page.replace(/^\/?(.*)/, '/$1')
    this.regex = pathToRegexp(pattern, this.keys = [])
    this.getAs = pathToRegexp.compile(pattern)
  }

  match (path) {
    const values = this.regex.exec(path)
    if (values) {
      return this.valuesToParams(values.slice(1))
    }
  }

  valuesToParams (values) {
    return values.reduce((params, val, i) => (
      Object.assign(params, {[this.keys[i].name]: val})
    ), {})
  }

  getHref (params) {
    const qs = Object.keys(params).map(key => [
      encodeURIComponent(key),
      encodeURIComponent(params[key])
    ].join('=')).join('&')

    return `${this.page}?${qs}`
  }

  getLinkProps (params) {
    const as = this.getAs(params)
    const href = this.getHref(params)
    return {as, href}
  }
}
