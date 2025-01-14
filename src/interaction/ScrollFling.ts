import {onCleanup, untrack} from 'solid-js'
import {Effects, reactive, signal} from 'classy-solid'
import {Motor} from '../core/Motor.js'
import {clamp} from '../math/clamp.js'

import type {RenderTask} from '../core/index.js'

type Options = Partial<
	Pick<
		ScrollFling,
		| 'target'
		| 'x'
		| 'y'
		| 'minX'
		| 'maxX'
		| 'minY'
		| 'maxY'
		| 'sensitivity'
		| 'hasInteracted'
		| 'epsilon'
		| 'lerpAmount'
	>
>

// @ts-ignore
window.debug = true

export
@reactive
class ScrollFling extends Effects {
	@signal accessor #x = 0

	/**
	 * During scroll, this value will change. It is a signal so that it can be
	 * observed. Set this value initially if you want to start at a certain
	 * value. Setting the value immediately stops any smoothing animation.
	 */
	get x() {
		return this.#x
	}
	set x(val) {
		this.#stopAnimation()
		this.#targetX = val
		this.#x = val
	}

	@signal accessor #y = 0

	/**
	 * During scroll, this value will change. It is a signal so that it can be
	 * observed. Set this value initially if you want to start at a certain
	 * value. Setting the value immediately stops any smoothing animation.
	 */
	get y() {
		return this.#y
	}
	set y(val) {
		this.#stopAnimation()
		this.#y = val
		this.#targetY = val
	}

	minX = -Infinity
	maxX = Infinity
	minY = -Infinity
	maxY = Infinity

	target: Element = document.documentElement

	sensitivity = 1

	@signal hasInteracted = false

	epsilon = 0.01

	/**
	 * The portion to lerp towards the target values each frame. Between 0 and 1.
	 */
	lerpAmount = 0.3

	#targetX = 0
	#targetY = 0

	#task?: RenderTask

	@signal accessor #isStarted = false

	get isStarted() {
		return this.#isStarted
	}

	#aborter = new AbortController()

	constructor(options: Options = {}) {
		super()
		Object.assign(this, options)
		this.#targetX = this.#x
		this.#targetY = this.#y
	}

	#onWheel = (event: WheelEvent) => {
		this.hasInteracted = true

		event.preventDefault()

		const dx = event.deltaX * this.sensitivity
		const dy = event.deltaY * this.sensitivity

		this.#targetX = clamp(this.#targetX + dx, this.minX, this.maxX)
		this.#targetY = clamp(this.#targetY + dy, this.minY, this.maxY)

		this.#stopAnimation()

		// lerp towards the target values
		this.#task = Motor.addRenderTask((_t, dt): false | void => {
			const dx = this.#targetX - this.#x
			const dy = this.#targetY - this.#y
			const fpsRatio = dt / 16.6666

			// Multiply by fpsRatio so that the lerpAmount is consistent over time no matter the fps.
			this.#x += dx * fpsRatio * this.lerpAmount
			this.#y += dy * fpsRatio * this.lerpAmount

			// Stop the fling update loop once the deltas are small enough
			// that we no longer notice a change.
			if (Math.abs(dx) < this.epsilon && Math.abs(dy) < this.epsilon) return false
		})
	}

	start(): this {
		if (untrack(() => this.#isStarted)) return this
		this.#isStarted = true

		this.createEffect(() => {
			this.target // any time the target changes make new events on that target

			this.#aborter = new AbortController()

			// @ts-expect-error, whyyyyy TypeScript
			this.target.addEventListener('wheel', this.#onWheel, {signal: this.#aborter.signal})

			onCleanup(() => {
				this.#stopAnimation()
				this.#aborter.abort()
			})
		})

		return this
	}

	stop(): this {
		if (!untrack(() => this.#isStarted)) return this
		this.#isStarted = false

		this.stopEffects()

		return this
	}

	#stopAnimation() {
		// Stop any current animation, if any.
		if (this.#task) Motor.removeRenderTask(this.#task)
	}
}

// @ts-ignore
window.debug = false
