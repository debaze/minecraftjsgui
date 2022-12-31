import Component from "./Component.js";
import {Matrix3, Vector2} from "src/math";

/**
 * @todo Documentation
 * 
 * @constructor
 * @extends Component
 */
export default function Button() {
	Component.apply(this, arguments);

	const size = this.getSize();

	/** @todo Make dynamic */
	const uv = new Vector2(0, 0);

	this.generateCachedTexture = function(bufferRenderer) {
		bufferRenderer.resizeToComponentSize(size);

		console.log("resized");
	};

	/** @override */
	this.getTextureMatrix = () => Matrix3.translate(uv.divide(size));
}