{
	const {Node, element, html, createEffect, Motor} = LUME

	element('av-skills-banner')(
		class SkillsBanner extends Node {
			hasShadow = true

			#skills
			#magicCircle
			#magicCircleContainer

			connectedCallback() {
				super.connectedCallback()

				// Skills description /////////////////////////////////////////////////////////////////////////////////////
				skills.call(this)
				async function skills() {
					const span = this.#skills.children[0]
					let translate = 0
					Motor.addRenderTask(() => {
						translate += 1.5
						if (translate >= span.offsetWidth / 3) translate = 0
						span.style.transform = `translate3d(${-translate}px, 0, 0.001px)`
					})

					// magicCircle.children[0].rotation = (x, y) => [x, y + 1]

					applyShader(this.#magicCircle, 0.001)

					async function applyShader(el, timeFactor) {
						const {uniforms, fragmentShader, vertexShader} = await import('../shaders/fluid-marble.js')

						el.fragmentShader = fragmentShader
						el.vertexShader = vertexShader

						createEffect(() => {
							const shaderMaterial = el.behaviors.get('shader-material')
							if (!shaderMaterial?.meshComponent) return

							el.uniforms = uniforms

							createEffect(() => {
								shaderMaterial.uniforms.iResolution.value.x = el.calculatedSize.x
								shaderMaterial.uniforms.iResolution.value.y = el.calculatedSize.y
								el.needsUpdate()
							})

							Motor.addRenderTask(t => {
								shaderMaterial.uniforms.iTime.value = t * timeFactor
								el.needsUpdate()
							})
						})
					}

					// Add some interaction!
					const maxDisplacement = 60
					let targetX = 0
					let targetY = 0

					createEffect(() => {
						if (!this.scene) return

						this.scene.addEventListener('pointermove', event => {
							// get a value between -maxDisplacement and maxDisplacement
							targetX = (event.clientX / this.scene.calculatedSize.x) * (maxDisplacement * 2) - maxDisplacement
							targetY = (event.clientY / this.scene.calculatedSize.y) * (maxDisplacement * 2) - maxDisplacement
						})
					})

					Motor.addRenderTask(() => {
						this.#magicCircleContainer.position.x += 0.05 * (targetX - this.#magicCircleContainer.position.x)
						this.#magicCircleContainer.position.y += 0.05 * (targetY - this.#magicCircleContainer.position.y)
					})

					// this.#magicCircle.rotation = (x, y, z) => [x + 0.5, y + 0.5, z + 0.5]
					// Motor.addRenderTask(() => {
					// 	this.#magicCircle.rotation.x += 0.5
					// 	this.#magicCircle.rotation.y += 0.5
					// 	this.#magicCircle.rotation.z += 0.5
					// })
				}
			}

			template = () => html`
				<link rel="stylesheet" href="./global.css" />

				<lume-element3d
					ref=${e => (this.#skills = e)}
					id="skills"
					size-mode="p l"
					size="1 162"
					align-point="0 0.5"
					mount-point="0 0.5"
					class="centerContent"
				>
					<span>
						<span>
							| A MULTIDISCIPLINARY CREATIVE AND ART DIRECTOR AND DESIGNER | WORK IN BRAND EXPERIENCE AND CREATES
							DIGITAL AND IN-PERSON EXPERIENCES | BRING THE ESSENCE OF THE BRAND THROUGH STORIES AND IMPACTFUL VISUAL
							EXPRESSION | A WIDE VARIETY OF SKILLS FROM VISUAL AND 2D CREATION TO SKETCHING AND 3D MODELING PLUS
							PROJECT MANAGEMENT AND STORYTELLING
						</span>
						<span>
							| A MULTIDISCIPLINARY CREATIVE AND ART DIRECTOR AND DESIGNER | WORK IN BRAND EXPERIENCE AND CREATES
							DIGITAL AND IN-PERSON EXPERIENCES | BRING THE ESSENCE OF THE BRAND THROUGH STORIES AND IMPACTFUL VISUAL
							EXPRESSION | A WIDE VARIETY OF SKILLS FROM VISUAL AND 2D CREATION TO SKETCHING AND 3D MODELING PLUS
							PROJECT MANAGEMENT AND STORYTELLING
						</span>
						<span>
							| A MULTIDISCIPLINARY CREATIVE AND ART DIRECTOR AND DESIGNER | WORK IN BRAND EXPERIENCE AND CREATES
							DIGITAL AND IN-PERSON EXPERIENCES | BRING THE ESSENCE OF THE BRAND THROUGH STORIES AND IMPACTFUL VISUAL
							EXPRESSION | A WIDE VARIETY OF SKILLS FROM VISUAL AND 2D CREATION TO SKETCHING AND 3D MODELING PLUS
							PROJECT MANAGEMENT AND STORYTELLING
						</span>
					</span>

					<lume-element3d
						ref=${e => (this.#magicCircleContainer = e)}
						id="magicCircleContainer"
						size="312 312"
						align-point="0.5 0.5"
						mount-point="0.5 0.5"
						position="0 0 20"
					>
						<lume-element3d
							id="magicCircleBg"
							size="212 212"
							align-point="0.5 0.5"
							mount-point="0.5 0.5"
							scale-comment="for some reason, the node is rendered slightly smaller when the filter is applied to it, so upscale just a tiny bit to match the webgl circle"
							scale="1.03 1.03"
						>
						</lume-element3d>
						<lume-scene id="scene2" webgl>
							<lume-ambient-light color="white" intensity="0.5"></lume-ambient-light>
							<lume-sphere
								ref=${e => (this.#magicCircle = e)}
								id="magicCircle"
								has="shader-material"
								sidedness="double"
								xxxxxxxxxx
								size="212 212 212"
								scale="1 1 1"
								xxxxxxxxxx
								align-point="0.5 0.5"
								mount-point="0.5 0.5"
							>
								${'' /* attempt to add shiny surface, no luck yet */}
								${
									'' /*<!--
								<lume-sphere
									has="physical-material"
									receive-shadow="false"
									size-mode="p p"
									size="1.1 1.1"
									sidedness="double"
									opacity="1"
									color="white"
									clearcoat="1"
									transmission="1"
									metalness="0.0"
									roughness="0.55"
								>
									<lume-point-light
										id="pointlight2"
										position="0 0 300"
										intensity="1"
										color="white"
										size="10 10"
									>
										<lume-sphere
											mount-point="0.5 0.5 0.5"
											cast-shadow="false"
											receive-shadow="false"
											has="basic-material"
										></lume-sphere>
									</lume-point-light>
								</lume-sphere>
								-->*/
								}
							</lume-sphere>
						</lume-scene>
					</lume-element3d>
				</lume-element3d>
			`

			css = /*css*/ `
				#scene2 {
					filter: saturate(1.5) brightness(0.6) blur(0px);
					/* opacity: 0.95 !important; */
				}
				#skills {
					padding: 0 82px;
					background: #8145bf33;
					font-size: 20px;
				}

				#skills > span {
					font-family: 'Austin-Bold', serif;
					font-size: 41px;
					position: absolute;
					white-space: nowrap;
					left: 0;
				}

				#magicCircleBg {
					border-radius: 100%;
					/* background: red; */
					/* backdrop-filter: blur(7px); */
					backdrop-filter: blur(2px);
					/* filter: saturate(1.5) brightness(0.6) blur(2px); */
					/* filter: blur(10px); */
					filter: url(#wavy);
				}
			`
		},
	)
}
