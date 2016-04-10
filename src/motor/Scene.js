import Node from './Node'
import {
    documentReady,
} from './Utility'

import '../motor-html/scene'

export default
class Scene extends Node {
    constructor(mountPoint, _motorHtmlScene) {
        super({}, _motorHtmlScene)

        this._scene = this
        this._resolveScenePromise(this)

        // For now, Scenes are always proportionally sized by default.
        this._properties.size.modes = ['proportional', 'proportional', 'proportional']

        // Resolves this.mountPromise, that the user can use to do something
        // once the scene is mounted.
        this._mount(mountPoint)

        this._renderWhenMounted()
    }

    makeElement() {
        return document.createElement('motor-scene')
    }

    // This currently starts a simple render loop.
    //
    // TODO: We don't want to have a naive render loop. We only want to render
    // once here (for now, in order to mount all Node.elements into DOM), then
    // we will have a mechanism that renders only parts of the scene graph as
    // needed (instead of the entire thing like currently).
    async _renderWhenMounted() {
        await this.mountPromise

        // So now we can render after the scene is mounted.
        // TODO: Move the loop into Motor core, and request frames
        // for specific nodes only when they update.
        const loop = () => {
            this.render()
            this._rAF = requestAnimationFrame(loop)
        }

        this._rAF = requestAnimationFrame(loop)
    }

    async _mount(mountPoint) {
        // Wait for the document to be ready before mounting, otherwise the
        // target mount point might not exist yet when this function is called.
        await documentReady()

        // if no mountPoint was provided, just mount onto the <body> element.
        // XXX: Maybe we should just not mount the scene if no mountPoint is
        // provided, and expose a mount method.
        if (!mountPoint) {
            mountPoint = document.body
        }

        // if the user supplied a selector, mount there.
        else if (typeof mountPoint === 'string') {
            let selector = mountPoint
            mountPoint = document.querySelector(selector)
        }

        // if we have an actual mount point (the user may have supplied one)
        if (mountPoint instanceof window.HTMLElement) {
            if (mountPoint !== this._el.element.parentNode)
                mountPoint.appendChild(this._el.element)

            this._mounted = true
        }
        else {
            throw new Error('Invalid mount point specified in Scene constructor. Specify a selector, or pass an actual HTMLElement.')
            return false
        }

        this._resolveMountPromise(this._mounted)
        return this._mounted
    }

}