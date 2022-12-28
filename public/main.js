import {ImageButton} from "gui";
import {Vector2} from "math";
import Instance from "instance";
import GUIRenderer from "./extensions/GUIRenderer.js";

import {NoWebGL2Error} from "errors";

export const instance = new Instance();
export let guiRenderer;

try {
	throw NoWebGL2Error();

	instance.build();
	await instance.initialize();

	instance.setupRenderers([
		guiRenderer = new GUIRenderer(instance),
	]);

	guiRenderer.build();
	guiRenderer.enable();

	await guiRenderer.init();

	// Load GUI textures
	const guiTextures = await (await fetch("assets/textures/textures.json")).json();
	await guiRenderer.loadTextures(...guiTextures);

	const btn1 = new ImageButton({
		align: ["left", "top"],
		margin: new Vector2(10, 10),
		size: new Vector2(20, 20),
		image: guiRenderer.textures["gui/widgets.png"],
		uv: new Vector2(0, 106),
		onMouseEnter: function() {
			this.setUV(uv => {
				uv.y = 126;
				return uv;
			});

			this.pushToRenderStack();
			guiRenderer.render();
		},
		onMouseLeave: function() {
			this.setUV(uv => {
				uv.y = 106;
				return uv;
			});

			this.pushToRenderStack();
			guiRenderer.render();
		},
	});

	const btn2 = new ImageButton({
		align: ["left", "top"],
		margin: new Vector2(32, 10),
		size: new Vector2(20, 20),
		image: guiRenderer.textures["gui/widgets.png"],
		uv: new Vector2(0, 146),
		onMouseEnter: function() {
			this.setUV(uv => {
				uv.y = 166;
				return uv;
			});

			this.pushToRenderStack();
			guiRenderer.render();
		},
		onMouseLeave: function() {
			this.setUV(uv => {
				uv.y = 146;
				return uv;
			});

			this.pushToRenderStack();
			guiRenderer.render();
		},
	});

	const btn3 = new ImageButton({
		align: ["left", "top"],
		margin: new Vector2(54, 10),
		size: new Vector2(20, 20),
		image: guiRenderer.textures["gui/widgets.png"],
		uv: new Vector2(0, 186),
	});

	guiRenderer.add(btn1, btn2, btn3);
	guiRenderer.compute();
	guiRenderer.render();

	instance.startLoop();
} catch (error) {
	// Make sure the renderers have been built before dispose
	if (instance.hasBeenBuilt()) instance.dispose();

	error.display?.();

	console.error("An error occurred:", error);
}