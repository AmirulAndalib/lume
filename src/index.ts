import {Class, Mixin} from 'lowclass'
export {Class, Mixin}
export * from '@lume/eventful'
export * from '@lume/element'
export * from '@lume/element/dist/html.js'

export * from './behaviors/index.js'
export * from './cameras/index.js'
export * from './core/index.js'
export * from './examples/index.js'
export * from './interaction/index.js'
export * from './layouts/index.js'
export * from './lights/index.js'
export * from './math/index.js'
export * from './meshes/index.js'
export * from './models/index.js'
export * from './renderers/index.js'
export * from './utils/index.js'
export * from './xyz-values/index.js'

export * from './defineElements.js'

import * as _THREE from 'three/src/Three.js'

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js'
import {SVGLoader} from 'three/examples/jsm/loaders/SVGLoader.js'

// Add more objects as needed.
export const THREE = {..._THREE, OrbitControls, SVGLoader}

export const version = '0.3.0-alpha.11'
