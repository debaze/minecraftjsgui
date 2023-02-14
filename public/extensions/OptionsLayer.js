import {ImageButton, Layer} from "src/gui";
import {Vector2} from "src/math";
import {gui} from "../main.js";

/**
 * @extends Layer
 */
export default class OptionsLayer extends Layer {
	/** @override */
	build() {
		return [
			new ImageButton({
				align: ["center", "top"],
				margin: new Vector2(0, 30),
				size: new Vector2(20, 20),
				image: gui.renderer.textures["gui/widgets.png"],
				uv: new Vector2(0, 106),
				onMouseEnter: function() {
					const newUv = this.getUV();
					newUv.y = 126;
					this.setUV(newUv);

					gui.renderQueue.push(this);
					gui.render();
				},
				onMouseLeave: function() {
					const newUv = this.getUV();
					newUv.y = 106;
					this.setUV(newUv);

					gui.renderQueue.push(this);
					gui.render();
				},
				onMouseDown: function() {
					/**
					 * This action will register the children from all the stack layers.
					 * All the previous layers will be rendered.
					 */
					gui.pop();
					gui.computeTree();
					gui.render();
				},
			}),
		];
	}
}