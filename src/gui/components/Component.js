import {Matrix3, Vector2} from "../../math/index.js";

/**
 * @param {{
 *    align: Number[2],
 *    margin: Vector2,
 *    size: Vector2,
 * }}
 */
export default function Component({align, margin, size}) {
	/** @type {Vector2} */
	let position;

	/**
	 * Computes the absolute position of the component
	 * by using its alignment and margin.
	 * 
	 * @param {Vector2} initial
	 * @param {Vector2} parentSize
	 */
	this.computePosition = function(initial, parentSize) {
		const
			m = margin,
			o = parentSize.subtract(size);

		if (align !== 0 && !align) throw TypeError(`Expecting an instance of Number, ${align.constructor.name} given`);

		switch (align) {
			case Component.alignLeftTop:
			case Component.alignLeftCenter:
			case Component.alignLeftBottom:
				initial.x += m.x;

				break;
			case Component.alignCenterTop:
			case Component.alignCenter:
			case Component.alignCenterBottom:
				initial.x += o.x / 2 + m.x;

				break;
			case Component.alignRightTop:
			case Component.alignRightCenter:
			case Component.alignRightBottom:
				initial.x += o.x - m.x;

				break;
		}

		switch (align) {
			case Component.alignLeftTop:
			case Component.alignCenterTop:
			case Component.alignRightTop:
				initial.y += m.y;

				break;
			case Component.alignLeftCenter:
			case Component.alignCenter:
			case Component.alignRightCenter:
				initial.y += o.y / 2 + m.y;

				break;
			case Component.alignLeftBottom:
			case Component.alignCenterBottom:
			case Component.alignRightBottom:
				initial.y += o.y - m.y;

				break;
		}

		position = initial.floor32();
	};

	/** @returns {Vector2} */
	this.getPosition = function() {
		if (!(position instanceof Vector2)) throw TypeError(`Expecting an instance of Vector2, ${position.constructor.name} given`);

		return position;
	};

	/** @param {Vector2} value */
	this.setPosition = value => void (position = value);

	/** @returns {Number} */
	this.getAlign = function() {
		if (!(align instanceof Number)) throw TypeError(`Expecting an instance of Number, ${align.constructor.name} given`);

		return align;
	};;

	/** @returns {Vector2} */
	this.getMargin = () => margin;

	/** @returns {Vector2} */
	this.getSize = () => size;

	/** @param {Vector2} value */
	this.setSize = value => void (size = value);

	/** @returns {Matrix3} */
	this.getWorldMatrix = () => Matrix3
		.translate(position)
		.scale(this.getSize());
}

Component.alignLeftTop = 0;
Component.alignCenterTop = 1;
Component.alignRightTop = 2;
Component.alignLeftCenter = 3;
Component.alignCenter = 4;
Component.alignRightCenter = 5;
Component.alignLeftBottom = 6;
Component.alignCenterBottom = 7;
Component.alignRightBottom = 8;