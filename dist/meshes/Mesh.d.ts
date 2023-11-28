import { Mesh as ThreeMesh } from 'three/src/objects/Mesh.js';
import { Element3D } from '../core/Element3D.js';
import type { Material } from 'three/src/materials/Material.js';
import type { Element3DAttributes } from '../core/Element3D.js';
export type MeshAttributes = Element3DAttributes | 'castShadow' | 'receiveShadow';
/**
 * @class Mesh -
 *
 * Element: `<lume-mesh>`
 *
 * An element that renders a particular 3D shape (geometry) along with a
 * particular style (material). This is a generic element with no particular
 * shape. Elements like `<lume-box>` extend from `Mesh` in order to set define
 * behaviors they ship with by default. For example a `<lume-box>` element
 * (backed by the [`Box`](./Box) class) extends from this `Mesh` class and
 * applies two default behaviors:
 * [`box-geometry`](../behaviors/mesh-behaviors/geometries/BoxGeometryBehavior)
 * and
 * [`phong-material`](../behaviors/mesh-behaviors/materials/PhongMaterialBehavior).
 *
 * For sake of simplicity, `<lume-mesh>` has a `box-geometry` and
 * `phong-material` by default, just like a `<lume-box>`.
 *
 * ## Example
 *
 * <live-code id="liveExample"></live-code>
 * <script>
 *   liveExample.code = meshExample()
 * </script>
 *
 * @extends Element3D
 * @element lume-mesh TODO @element jsdoc tag
 *
 */
export declare class Mesh extends Element3D {
    static defaultBehaviors: {
        [k: string]: any;
    };
    /**
     * @property {boolean} castShadow
     *
     * `boolean` `attribute`
     *
     * Default: `true`
     *
     * When `true`, the mesh casts shadows onto other objects when under the
     * presence of a light such as a
     * [`<lume-point-light>`](../lights/PointLight).
     */
    castShadow: boolean;
    /**
     * @property {boolean} receiveShadow
     *
     * `boolean` `attribute`
     *
     * Default: `true`
     *
     * When `true`, the mesh receives shadows from other objects when under the
     * presence of a light such as a
     * [`<lume-point-light>`](../lights/PointLight).
     */
    receiveShadow: boolean;
    _loadGL(): boolean;
    makeThreeObject3d(): ThreeMesh<import("three").BufferGeometry<import("three").NormalBufferAttributes>, Material | Material[], import("three").Object3DEventMap>;
}
import type { ElementAttributes } from '@lume/element';
import type { PhongMaterialBehavior, PhongMaterialBehaviorAttributes, LambertMaterialBehavior, LambertMaterialBehaviorAttributes, ElementWithBehaviors, ClipPlanesBehavior, ClipPlanesBehaviorAttributes, PhysicalMaterialBehavior, PhysicalMaterialBehaviorAttributes, StandardMaterialBehavior, StandardMaterialBehaviorAttributes } from '../index.js';
type BehaviorInstanceTypes = PhongMaterialBehavior & LambertMaterialBehavior & StandardMaterialBehavior & PhysicalMaterialBehavior & ClipPlanesBehavior;
type BehaviorAttributes = PhongMaterialBehaviorAttributes | LambertMaterialBehaviorAttributes | StandardMaterialBehaviorAttributes | PhysicalMaterialBehaviorAttributes | ClipPlanesBehaviorAttributes;
export interface Mesh extends ElementWithBehaviors<BehaviorInstanceTypes, BehaviorAttributes> {
}
declare module 'solid-js' {
    namespace JSX {
        interface IntrinsicElements {
            'lume-mesh': ElementAttributes<Mesh & BehaviorInstanceTypes, MeshAttributes | BehaviorAttributes>;
        }
    }
}
declare global {
    interface HTMLElementTagNameMap {
        'lume-mesh': Mesh;
    }
}
export {};
//# sourceMappingURL=Mesh.d.ts.map