import {reactive, Element as LumeElement} from '@lume/element'
import {Eventful} from '@lume/eventful'
import {WithChildren} from './WithChildren.js'
import {DefaultBehaviors} from '../behaviors/DefaultBehaviors.js'
import {Settable} from '../utils/Settable.js'
import {defer, hasShadow, isNode, isScene, observeChildren} from '../core/utils.js'

export type ComposedTreeConnectionType = 'root' | 'slot' | 'actual'

const observers = new WeakMap()

class _TreeNode extends WithChildren(Eventful(LumeElement)) {}

/**
 * @class TreeNode - The `TreeNode` class represents objects that are connected
 * to each other in parent-child relationships in a tree structure. A parent
 * can have multiple children, and a child can have only one parent.
 * @extends Eventful
 * @extends DefaultBehaviors
 * @extends WithChildren
 * @extends Eventful
 * @extends LumeElement
 */
@reactive
export class TreeNode extends Settable(DefaultBehaviors(_TreeNode)) {
	/** @property {boolean} isScene - True if a subclass of this class is a Scene. */
	isScene = false

	/** @property {boolean} isNode - True if a subclass of this class is a Node. */
	isNode = false

	/**
	 * @readonly
	 * @property {TreeNode | null} lumeParent - The LUME-specific parent of the
	 * current TreeNode. Each node in a tree can have only one parent. This is
	 * `null` if there is no parent when not connected into a tree, or if the
	 * parentElement while connected into a tree is not as LUME 3D element.
	 */
	get lumeParent(): TreeNode | null {
		this.emit
		this._preUpgradeValues
		if (this.parentElement instanceof TreeNode) return this.parentElement
		return null
	}

	/**
	 * @readonly
	 * @property {TreeNode[]} lumeChildren - An array of this element's
	 * LUME-specific children. This returns a new static array each time, so
	 * and modifying this array directly does not effect the state of the
	 * TreeNode. Use [TreeNode.append(child)](#append) and
	 * [TreeNode.removeChild(child)](#removechild) to modify a TreeNode's
	 * actual children.
	 */
	get lumeChildren(): TreeNode[] {
		return Array.prototype.filter.call(this.children, c => c instanceof TreeNode) as TreeNode[]
	}

	/**
	 * @readonly
	 * @property {number} lumeChildCount - The number of children this TreeNode has.
	 */
	get lumeChildCount(): number {
		return this.lumeChildren.length
	}

	// COMPOSED TREE TRACKING:
	// Overriding HTMLElement.prototype.attachShadow here is part of our
	// implementation for tracking the composed tree and connecting THREE
	// objects in the same structure as the DOM composed tree so that it will
	// render as expected when end users compose elements with ShadowDOM and
	// slots.
	attachShadow(options: ShadowRootInit): ShadowRoot {
		const root = super.attachShadow(options)

		// Skip ShadowRoot observation for Scene instances. Only Scene actual
		// children or distributed children are considered in the LUME scene
		// graph because Scene's ShadowRoot already exists and serves in the
		// rendering implementation and is not the user's.
		if (this.isScene) return root

		this.__shadowRoot = root

		const observer = observeChildren(
			root,
			this.__shadowRootChildAdded.bind(this),
			this.__shadowRootChildRemoved.bind(this),
			true,
		)

		observers.set(root, observer)

		// Arrray.from is needed for older Safari which can't iterate on HTMLCollection
		const children = Array.from(this.children)

		for (const child of children) {
			if (!(child instanceof TreeNode)) continue
			child.__isPossiblyDistributedToShadowRoot = true
			this.__triggerChildUncomposedCallback(child, 'actual')
		}

		return root
	}

	childConnectedCallback(child: HTMLElement) {
		// This code handles two cases: the element has a ShadowRoot
		// ("composed children" are children of the ShadowRoot), or it has a
		// <slot> child ("composed children" are nodes that may be
		// distributed to the <slot>).
		if (isNode(child)) {
			// We skip Scene here because we know it already has a
			// ShadowRoot that serves a different purpose than for Nodes. A
			// Scene child's three objects will always be connected to the
			// scene's three object regardless of its ShadowRoot.
			if (!this.isScene && this.__shadowRoot) {
				child.__isPossiblyDistributedToShadowRoot = true

				// We don't call childComposedCallback here because that
				// will be called indirectly due to a slotchange event on a
				// <slot> element if the added child will be distributed to
				// a slot.
			} else {
				// If there's no shadow root, call the childComposedCallback
				// with connection type "actual". This is effectively a
				// regular parent-child composition (no distribution, no
				// children of a ShadowRoot).

				this.__triggerChildComposedCallback(child, 'actual')
			}
		} else if (child instanceof HTMLSlotElement) {
			// COMPOSED TREE TRACKING: Detecting slots here is part of composed
			// tree tracking (detecting when a child is distributed to an element).

			child.addEventListener('slotchange', this.__onChildSlotChange)

			// XXX Do we need __handleDistributedChildren for initial slotted
			// nodes? The answer seems to be "yes, sometimes". When slots are
			// appended, their slotchange events will fire. However, this
			// `childConnectedCallback` is fired later from when a child is
			// actually connected, in a MutationObserver task. Because of this,
			// an appended slot's slotchange event *may* have already fired,
			// and we will not have had the chance to add a slotchange event
			// handler yet, therefore we need to fire
			// __handleDistributedChildren here to handle that missed
			// opportunity.
			//
			// Also we need to defer() here because otherwise, this
			// childConnectedCallback will fire once for when a child is
			// connected into the light DOM and run the logic in the `if
			// (isNode(child))` branch *after* childConnectedCallback is fired
			// and executes this __handleDistributedChildren call for a shadow
			// DOM slot, and in that case the distribution will not be detected
			// (why is that?).  By deferring, this __handleDistributedChildren
			// call correctly happens *after* the above `if (isNode(child))`
			// branch and then things will work as expected. This is all due to
			// using MutationObserver, which fires event in a later task than
			// when child connections actually happen.
			//
			// TODO ^, Can we make WithChildren call this callback right when
			// children are added, synchronously?  If so then we could rely on
			// a slot's slotchange event upon it being connected without having
			// to call __handleDistributedChildren here (which means also not
			// having to use defer for anything).
			defer(() => this.__handleDistributedChildren(child))
		}
	}

	childDisconnectedCallback(child: HTMLElement) {
		if (isNode(child)) {
			if (!this.isScene && this.__shadowRoot) {
				child.__isPossiblyDistributedToShadowRoot = false
			} else {
				// If there's no shadow root, call the
				// childUncomposedCallback with connection type "actual".
				// This is effectively similar to childDisconnectedCallback.
				this.__triggerChildUncomposedCallback(child, 'actual')
			}
		} else if (child instanceof HTMLSlotElement) {
			// COMPOSED TREE TRACKING:
			child.removeEventListener('slotchange', this.__onChildSlotChange, {capture: true})

			this.__handleDistributedChildren(child)
			this.__previousSlotAssignedNodes.delete(child)
		}
	}

	// TODO: make setAttribute accept non-string values.
	setAttribute(attr: string, value: any) {
		super.setAttribute(attr, value)
	}

	// TODO move the following ShadowDOM stuff into a more generic place like LUME Element.

	// COMPOSED TREE TRACKING:
	get _hasShadowRoot(): boolean {
		return !!this.__shadowRoot
	}

	// COMPOSED TREE TRACKING:
	get _isPossiblyDistributedToShadowRoot(): boolean {
		return this.__isPossiblyDistributedToShadowRoot
	}

	// COMPOSED TREE TRACKING:
	get _shadowRootParent(): TreeNode | null {
		return this.__shadowRootParent
	}

	get _shadowRootChildren(): TreeNode[] {
		if (!this.__shadowRoot) return []

		return Array.from(this.__shadowRoot.children).filter((n): n is TreeNode => n instanceof TreeNode)
	}

	// COMPOSED TREE TRACKING: Elements that are distributed to a slot that is
	// child of a ShadowRoot of this element.
	get _distributedShadowRootChildren(): TreeNode[] {
		const result: TreeNode[] = []

		for (const child of Array.from(this.__shadowRoot?.children || [])) {
			if (child instanceof HTMLSlotElement && !child.assignedSlot) {
				for (const distributed of child.assignedElements({flatten: true})) {
					if (isNode(distributed)) result.push(distributed)
				}
			}
		}

		return result
	}

	// COMPOSED TREE TRACKING:
	get _distributedParent(): TreeNode | null {
		return this.__distributedParent
	}

	// COMPOSED TREE TRACKING:
	get _distributedChildren(): TreeNode[] | null {
		return this.__distributedChildren ? [...this.__distributedChildren] : null
	}

	// COMPOSED TREE TRACKING: The composed parent is the parent that this element renders relative
	// to in the flat tree (composed tree).
	get _composedParent(): HTMLElement | null {
		let parent: Node | null = this.parentElement

		// Special case only for Nodes that are children of a Scene.
		if (parent && isScene(parent)) return parent

		parent = this.__distributedParent || this.__shadowRootParent

		// Shortcut in case we have already detected distributed or shadowRoot parent.
		if (parent) return parent as HTMLElement

		parent = this.parentNode as HTMLElement | ShadowRoot | null

		if (parent instanceof HTMLSlotElement) {
			const slot = parent

			// If this element is a child of a <slot> element (i.e. this
			// element is a slot's default content), then return null if the
			// slot has anything slotted to it in which case default content
			// does not participate in the composed tree.
			if (slot.assignedElements({flatten: true}).length) return null

			const slotParent = slot.parentNode

			if (slotParent instanceof ShadowRoot) return slotParent.host as HTMLElement
			else return slot.parentElement
		} else if (parent instanceof ShadowRoot) {
			return parent.host as HTMLElement
		} else if (parent instanceof HTMLElement) {
			if (!hasShadow(parent)) return parent

			// a child of a host with a shadow has a composed parent if the child is slotted

			const slot = this.assignedSlot

			if (!slot) return null

			const slotParent = slot.parentNode

			if (slotParent instanceof ShadowRoot) return slotParent.host as HTMLElement
			else return slot.parentElement
		}

		return null
	}

	// COMPOSED TREE TRACKING: Composed children are the children that render relative to this
	// element in the flat tree (composed tree), whether as children of a
	// shadow root, or distributed children (assigned nodes) of a <slot>
	// element.
	get _composedChildren(): TreeNode[] {
		if (!this.isScene && this.__shadowRoot) {
			// TODO move this composed stuff to a separate class that has
			// no limitation on which types of nodes it observes, then use
			// it here and apply the restriction.
			return [...this._distributedShadowRootChildren, ...this._shadowRootChildren]
		} else {
			return [
				...(this.__distributedChildren || []), // TODO perhaps use slot.assignedElements instead?
				// We only care about TreeNode nodes.
				...Array.from(this.children).filter((n): n is TreeNode => n instanceof TreeNode),
			]
		}
	}

	// COMPOSED TREE TRACKING: This element's shadow root, if any. This always points to the shadow
	// root, even if it is a closed root, unlike the public shadowRoot
	// property.
	__shadowRoot?: ShadowRoot

	// COMPOSED TREE TRACKING: True when this element has a parent that has a shadow root.
	__isPossiblyDistributedToShadowRoot = false

	__prevAssignedNodes?: WeakMap<HTMLSlotElement, Element[]>

	// COMPOSED TREE TRACKING:
	// A map of the slot elements that are children of this element and
	// their last-known assigned elements. When a slotchange happens while
	// this element is in a shadow root and has a slot child, we can
	// detect what the difference is between the last known assigned elements and the new
	// ones.
	get __previousSlotAssignedNodes() {
		if (!this.__prevAssignedNodes) this.__prevAssignedNodes = new WeakMap()
		return this.__prevAssignedNodes
	}

	// COMPOSED TREE TRACKING:
	// If this element is distributed into a shadow tree, this will
	// reference the parent element of the <slot> element where this element is
	// distributed to. This element will render as a child of
	// that parent element in the flat tree (composed tree).
	__distributedParent: TreeNode | null = null

	// COMPOSED TREE TRACKING:
	// If this element is a top-level child of a shadow root, then this
	// points to the parent of the shadow root. The shadow root parent
	// is the element that this element renders relative to in the flat tree
	// (composed tree).
	__shadowRootParent: TreeNode | null = null

	// COMPOSED TREE TRACKING:
	// If this element has a child <slot> element while in
	// a shadow root, then this will be a Set of the nodes distributed
	// into the <slot>, and those nodes render relatively
	// to this element in the flat tree. We instantiate this later, only
	// when/if needed.
	__distributedChildren?: Set<TreeNode>

	// COMPOSED TREE TRACKING: Called when a child is added to the ShadowRoot of this element.
	// This does not run for Scene instances, which already have a root for their rendering implementation.
	__shadowRootChildAdded(child: HTMLElement) {
		// NOTE Logic here is similar to childConnectedCallback

		if (child instanceof TreeNode) {
			child.__shadowRootParent = this
			this.__triggerChildComposedCallback(child, 'root')
		} else if (child instanceof HTMLSlotElement) {
			child.addEventListener('slotchange', this.__onChildSlotChange)
			this.__handleDistributedChildren(child)
		}
	}

	// COMPOSED TREE TRACKING: Called when a child is removed from the ShadowRoot of this element.
	// This does not run for Scene instances, which already have a root for their rendering implementation.
	__shadowRootChildRemoved(child: HTMLElement) {
		// NOTE Logic here is similar to childDisconnectedCallback

		if (child instanceof TreeNode) {
			child.__shadowRootParent = null
			this.__triggerChildUncomposedCallback(child, 'root')
		} else if (child instanceof HTMLSlotElement) {
			child.removeEventListener('slotchange', this.__onChildSlotChange, {capture: true})
			this.__handleDistributedChildren(child)
			this.__previousSlotAssignedNodes.delete(child)
		}
	}

	// COMPOSED TREE TRACKING: Called when a slot child of this element emits a slotchange event.
	// TODO we need an @lazy decorator instead of making this a getter manually.
	get __onChildSlotChange(): (event: Event) => void {
		if (this.__onChildSlotChange__) return this.__onChildSlotChange__

		this.__onChildSlotChange__ = (event: Event) => {
			// event.currentTarget is the slot that this event handler is on,
			// while event.target is always the slot from the ancestor-most
			// tree if that slot is assigned to this slot or another slot that
			// ultimate distributes to this slot.
			const slot = event.currentTarget as HTMLSlotElement

			this.__handleDistributedChildren(slot)
		}

		return this.__onChildSlotChange__
	}

	__onChildSlotChange__?: (event: Event) => void

	// COMPOSED TREE TRACKING: Life cycle methods for use by subclasses to run
	// logic when children are composed or uncomposed to them in the composed
	// tree.
	// TODO: enable composition tracking only if a sublass instance has one of
	// these methods in place, otherwise don't waste the resources.
	childComposedCallback?(child: Element, connectionType: ComposedTreeConnectionType): void
	childUncomposedCallback?(child: Element, connectionType: ComposedTreeConnectionType): void

	__triggerChildComposedCallback(child: TreeNode, connectionType: ComposedTreeConnectionType) {
		if (!this.childComposedCallback) return

		const isUpgraded = child.matches(':defined')

		if (isUpgraded) {
			this.childComposedCallback(child, connectionType)
		} else {
			customElements.whenDefined(child.tagName.toLowerCase()).then(() => {
				this.childComposedCallback!(child, connectionType)
			})
		}
	}

	__triggerChildUncomposedCallback(child: TreeNode, connectionType: ComposedTreeConnectionType) {
		this.childUncomposedCallback && this.childUncomposedCallback(child, connectionType)
	}

	// COMPOSED TREE TRACKING: This is called in certain cases when distributed
	// children may have changed, f.e. when a slot was added to this element, or
	// when a child slot of this element has had assigned nodes changed
	// (slotchange).
	__handleDistributedChildren(slot: HTMLSlotElement) {
		const diff = this.__getDistributedChildDifference(slot)

		const {added} = diff
		for (let l = added.length, i = 0; i < l; i += 1) {
			const addedNode = added[i]

			if (!(addedNode instanceof TreeNode)) continue

			// Keep track of the final distribution of a node.
			//
			// If the given slot is assigned to another
			// slot, then this logic will run again for the next slot on
			// that next slot's slotchange, so we remove the distributed
			// node from the previous distributedParent and add it to the next
			// one. If we don't do this, then the distributed node will
			// exist in multiple distributedChildren lists when there is a
			// chain of assigned slots. For more info, see
			// https://github.com/w3c/webcomponents/issues/611
			const distributedParent = addedNode.__distributedParent
			if (distributedParent) {
				const distributedChildren = distributedParent.__distributedChildren
				if (distributedChildren) {
					distributedChildren.delete(addedNode)
					if (!distributedChildren.size) distributedParent.__distributedChildren = undefined
				}
			}

			// The node is now distributed to `this` element.
			addedNode.__distributedParent = this
			if (!this.__distributedChildren) this.__distributedChildren = new Set()
			this.__distributedChildren.add(addedNode)

			this.__triggerChildComposedCallback(addedNode, 'slot')
		}

		const {removed} = diff
		for (let l = removed.length, i = 0; i < l; i += 1) {
			const removedNode = removed[i]

			if (!(removedNode instanceof TreeNode)) continue

			removedNode.__distributedParent = null
			this.__distributedChildren!.delete(removedNode)
			if (!this.__distributedChildren!.size) this.__distributedChildren = undefined

			this.__triggerChildUncomposedCallback(removedNode, 'slot')
		}
	}

	// COMPOSED TREE TRACKING: Get the difference between the last assigned
	// elements and current assigned elements of a child slot of this element.
	__getDistributedChildDifference(slot: HTMLSlotElement) {
		const previousNodes = this.__previousSlotAssignedNodes.get(slot) ?? []

		// If this slot is assigned to another slot, then we don't consider any
		// of the slot's assigned nodes as being distributed to the current element,
		// because instead they are distributed to an element further down in the
		// composed tree where this slot is assigned to.
		//
		// Special case for Scenes: we don't care if slot children of a Scene
		// distribute to a deeper slot, because a Scene's ShadowRoot is for the rendering
		// implementation and not the user's distribution, so we only want to detect
		// elements slotted directly to the Scene in that case.
		const newNodes = !this.isScene && slot.assignedSlot ? [] : slot.assignedElements({flatten: true})

		// Save the newNodes to be used as the previousNodes for next time
		// (clone it so the following in-place modification doesn't ruin any
		// assumptions in the next round).
		this.__previousSlotAssignedNodes.set(slot, [...newNodes])

		const diff: {added: Node[]; removed: Node[]} = {
			added: newNodes,
			removed: [],
		}

		for (let i = 0, l = previousNodes.length; i < l; i += 1) {
			const oldNode = previousNodes[i]
			const newIndex = newNodes.indexOf(oldNode)

			// if it exists in the previousNodes but not the newNodes, then
			// the node was removed.
			if (!(newIndex >= 0)) {
				diff.removed.push(oldNode)
			}

			// otherwise the node wasn't added or removed.
			else {
				newNodes.splice(i, 1)
			}
		}

		// The remaining nodes in newNodes must have been added.

		return diff
	}
}
