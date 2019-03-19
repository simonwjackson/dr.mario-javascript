import * as _  from '//cdn.jsdelivr.net/npm/ramda@latest/es/index.js'

export const createContext = (options = {}) => {
  let state = _.mergeDeepRight({
    FPS: 24,
    interval: undefined,
    width: 500,
    height: 600,
    background: '#fff',
    blocksize: 20,
  }, options)

  const get = path => _.path(path, state)
  const set = _.curry((path, data) =>
    state = _.assocPath(path, data, state)
  )

  return {
    state,
    get,
    set
  }
}

export default createContext