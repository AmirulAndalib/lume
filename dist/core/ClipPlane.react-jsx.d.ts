import type {ClipPlane, ClipPlaneAttributes} from './ClipPlane'
import type {ReactElementAttributes} from '@lume/element/src/react'

// React users can import this to have appropriate types for the element in their JSX markup.
declare global {
	namespace JSX {
		interface IntrinsicElements {
			'lume-clip-plane': ReactElementAttributes<ClipPlane, ClipPlaneAttributes>
		}
	}
}

// TODO move this to the elemet-behaviors package.
declare global {
	namespace React {
		// Attributes for all elements.
		interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
			has?: string
		}
	}
}
