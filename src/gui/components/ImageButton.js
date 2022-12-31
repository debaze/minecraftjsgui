import Component from "./Component.js";
import {Matrix3} from "src/math";

/**
 * @constructor
 * @extends Component
 * @param {{
 *    image: Texture,
 *    uv: Vector2,
 *    onMouseEnter: Function,
 *    onMouseLeave: Function,
 *    onMouseDown: Function
 * }}
 */
export default function ImageButton({image, uv, onMouseEnter, onMouseLeave, onMouseDown}) {
	Component.apply(this, arguments);

	this.getImageSize = () => image.size;

	this.getImageIndex = () => image.index;

	this.getUV = () => uv;

	this.setUV = newUV => void (uv = newUV);

	/** @type {Function} */
	this.onMouseEnter = onMouseEnter?.bind(this);

	/** @type {Function} */
	this.onMouseLeave = onMouseLeave?.bind(this);

	/** @type {Function} */
	this.onMouseDown = onMouseDown?.bind(this);

	/** @override */
	this.getTextureMatrix = () => Matrix3
		.translate(uv.divide(image.size))
		.scale(this.getSize().divide(image.size));
}