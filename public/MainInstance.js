import {Instance} from "src";
import {min, max, Vector2} from "src/math";
import {MainInstanceRenderer} from "./MainInstanceRenderer.js";

export class MainInstance extends Instance {
	/**
	 * @type {Number}
	 */
	#resizeTimeoutId;

	/**
	 * @param {MainInstanceRenderer} renderer
	 */
	constructor(renderer) {
		super(renderer);

		this._parameters = {
			...this._parameters,
			font_path: "",
			shader_path: "",
			texture_path: "",
			current_scale: 0,
			desired_scale: 0,
			max_scale: 0,
			default_width: 320,
			default_height: 240,
			resize_delay: 50,
		};
		this.#resizeTimeoutId = 0;
	}

	/**
	 * @returns {Number}
	 */
	getResizeTimeoutId() {
		return this.#resizeTimeoutId;
	}

	/**
	 * @param {Number} resizeTimeoutId
	 */
	setResizeTimeoutId(resizeTimeoutId) {
		this.#resizeTimeoutId = resizeTimeoutId;
	}

	/**
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} dpr
	 */
	resize(width, height, dpr) {
		/** @type {Vector2} */
		const viewport = new Vector2(width, height)
			.multiplyScalar(dpr)
			.floor();

		this.getRenderer().setViewport(viewport);

		// Calculate scale multiplier
		let i = 1;
		while (
			viewport[0] > this.getParameter("default_width") * dpr * i &&
			viewport[1] > this.getParameter("default_height") * dpr * i
		) i++;

		this.setParameter("max_scale", min(i - 1, 1));

		{
			const desiredScale = this.getParameter("desired_scale");
			const maxScale = this.getParameter("max_scale");

			this.setParameter("current_scale", max(desiredScale, maxScale));
		}

		const composites = this.getComposites();
		const compositeCount = this.getRenderer().getCompositeCount();

		for (i = 0; i < compositeCount; i++) {
			composites[i].resize(viewport);
		}
	}
}