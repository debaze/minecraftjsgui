import {Vector2, clampDown, clampUp, intersects} from "src/math";
import Program from "./Program.js";
import Renderer from "./Renderer.js";
import WebGLRenderer from "./WebGLRenderer.js";

/**
 * @todo Apply settings
 * @todo Implement render pipeline here
 * @todo JSDoc for private properties?
 * @todo Viewport size Vector2?
 * 
 * Game instance.
 * This holds information about asset base paths, viewport dimensions and GUI scale.
 */
export default function Instance() {
	const DEFAULT_WIDTH = 320;
	const DEFAULT_HEIGHT = 240;
	const RESIZE_DELAY = 50;

	/**
	 * Prevents the first `ResizeObserver` call.
	 * 
	 * @type {?Boolean}
	 */
	let isFirstResize = true;

	/**
	 * Timeout ID of the `ResizeObserver`, used to clear the timeout.
	 * 
	 * @type {Number}
	 */
	let resizeTimeoutID;

	/**
	 * Animation request ID, used to interrupt the loop.
	 * 
	 * @type {Number}
	 */
	let animationRequestID;

	/**
	 * Returns `true` if the instance canvas has been added to the DOM, `false` otherwise.
	 * 
	 * @type {Boolean}
	 */
	let hasBeenBuilt = false;

	let rendererLength;

	let mouseEnterListeners = [];
	let mouseEnterListenerCount = 0;

	let mouseLeaveListeners = [];
	let mouseLeaveListenerCount = 0;

	let mouseDownListeners = [];
	let mouseDownListenerCount = 0;

	/**
	 * @private
	 * @type {WebGLRenderer}
	 */
	const outputRenderer = new WebGLRenderer({
		offscreen: false,
		generateMipmaps: false,
		version: 2,
	});

	/**
	 * Offscreen renderers.
	 * 
	 * @type {Renderer[]}
	 */
	this.renderers = [];

	/**
	 * Textures for each offscreen renderer.
	 * 
	 * @type {WebGLTexture[]}
	 */
	this.rendererTextures = [];

	/**
	 * Shader folder path, relative to the root folder.
	 * 
	 * @type {?String}
	 */
	this.shaderPath = "assets/shaders/";

	/**
	 * Texture folder path, relative to the root folder.
	 * 
	 * @type {?String}
	 */
	this.texturePath = "assets/textures/";

	/**
	 * Cached values of `window.innerWidth` and `window.innerHeight`.
	 * 
	 * @type {Vector2}
	 */
	const viewport = new Vector2(0, 0);

	/**
	 * Current GUI scale multiplier.
	 * Determines the scale of the crosshair and most of the GUI components.
	 * 
	 * @type {?Number}
	 */
	this.currentScale = 2;

	/**
	 * @todo Since this is controlled by the user, move it to a public class?
	 * 
	 * GUI scale multiplier chosen by the user.
	 * 
	 * @type {?Number}
	 */
	this.desiredScale = 2;

	/**
	 * Maximum GUI scale multiplier appliable to the current viewport.
	 * This caps the desired scale multiplier.
	 * 
	 * @type {?Number}
	 */
	this.maxScale = 4;

	/**
	 * Current position of the pointer, used for GUI event listeners.
	 * 
	 * @type {?Vector2}
	 */
	let pointerPosition;

	/**
	 * @throws {NoWebGL2Error}
	 */
	this.build = function() {
		outputRenderer.build();
		viewport.x = innerWidth;
		viewport.y = innerHeight;
		outputRenderer.setViewport(viewport, devicePixelRatio);

		this.resizeObserver = new ResizeObserver(([entry]) => {
			// Avoid the first resize
			if (isFirstResize) return isFirstResize = null;

			clearTimeout(resizeTimeoutID);
			resizeTimeoutID = setTimeout(() => {
				let width, height, dpr = 1;

				if (entry.devicePixelContentBoxSize) {
					({inlineSize: width, blockSize: height} = entry.devicePixelContentBoxSize[0]);
				} else {
					dpr = devicePixelRatio;

					if (entry.contentBoxSize) {
						entry.contentBoxSize[0] ?
							({inlineSize: width, blockSize: height} = entry.contentBoxSize[0]) :
							({inlineSize: width, blockSize: height} = entry.contentBoxSize);
					} else ({width, height} = entry.contentRect);
				}

				this.resize(width, height, dpr);
			}, RESIZE_DELAY);
		});

		document.body.appendChild(outputRenderer.canvas);

		hasBeenBuilt = true;

		try {
			this.resizeObserver.observe(outputRenderer.canvas, {
				box: "device-pixel-content-box",
			});
		} catch (error) {
			// "device-pixel-content-box" isn't defined, try with "content-box"
			this.resizeObserver.observe(outputRenderer.canvas, {
				box: "content-box",
			});
		}

		outputRenderer.canvas.addEventListener("mousemove", mouseMoveListener.bind(this));
		outputRenderer.canvas.addEventListener("mousedown", mouseDownListener.bind(this));
	};

	this.hasBeenBuilt = () => hasBeenBuilt;

	/**
	 * Setups the instance renderers.
	 * 
	 * @param {Renderer[]} renderers
	 */
	this.setupRenderers = async function(renderers) {
		const {gl} = outputRenderer;
		const {rendererTextures} = this;
		let renderer, texture;

		rendererLength = renderers.length;

		for (let i = 0; i < rendererLength; i++) {
			renderer = renderers[i];

			renderer.build();
			renderer.setViewport(viewport, devicePixelRatio);
			await renderer.init();

			this.renderers.push(renderer);

			gl.bindTexture(gl.TEXTURE_2D, texture = gl.createTexture());
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // Don't generate mipmaps

			rendererTextures.push(texture);
		}
	};

	/**
	 * When called, recalculates the max possible GUI scale for the current viewport dimensions
	 * Clamps up the desired scale to the max scale to get the current scale
	 * 
	 * @param {Number} width
	 * @param {Number} height
	 * @param {Number} dpr
	 */
	this.resize = function(width, height, dpr) {
		/** @type {Vector2} */
		let newViewport = outputRenderer.setViewport(new Vector2(width, height), dpr);
		viewport.x = newViewport.x;
		viewport.y = newViewport.y;
		newViewport = null;

		// Calculate scale multiplier
		let i = 1;
		while (
			viewport.x > DEFAULT_WIDTH * i &&
			viewport.y > DEFAULT_HEIGHT * i
		) i++;

		const currentScale = clampUp(
			this.desiredScale,
			this.maxScale = clampDown(i - 1, 1),
		);

		this.currentScale = currentScale;

		for (let i = 0; i < rendererLength; i++) this.renderers[i].resize(viewport, this);
	};

	/**
	 * @todo Which color format?
	 * 
	 * @param {Number} index
	 * @param {OffscreenCanvas} canvas
	 */
	this.updateRendererTexture = function(index, canvas) {
		const {gl} = outputRenderer;

		gl.bindTexture(gl.TEXTURE_2D, this.rendererTextures[index]);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
	};

	/**
	 * @todo Better naming
	 * 
	 * Starts the game loop.
	 */
	this.startLoop = () => this.loop();

	/**
	 * @todo Better naming
	 * 
	 * Game loop.
	 */
	this.loop = function() {
		animationRequestID = requestAnimationFrame(this.loop);

		this.render();
	}.bind(this);

	/**
	 * @todo Better naming
	 * 
	 * Stops the game loop.
	 */
	this.stopLoop = () => cancelAnimationFrame(animationRequestID);

	/**
	 * @todo Use `Renderer` class to avoid duplicate methods (createProgram/createShader/linkProgram)?
	 */
	this.initialize = async function() {
		const {gl} = outputRenderer;

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

		/** @type {Program} */
		const program = await outputRenderer.loadProgram(
			"main.vert",
			"main.frag",
			this.shaderPath,
		);

		outputRenderer.linkProgram(program);

		/** @todo Make useProgram helper in `WebGLRenderer`? */
		gl.useProgram(program.program);

		gl.attribute = {
			position: 0,
		};
		gl.buffer = {
			position: gl.createBuffer(),
		};
		gl.uniform = {};

		gl.enableVertexAttribArray(gl.attribute.position);
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.buffer.position);
		gl.vertexAttribPointer(gl.attribute.position, 2, gl.FLOAT, false, 0, 0);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			1,  1,
		   -1,  1,
		   -1, -1,
			1, -1,
		]), gl.STATIC_DRAW);
	};

	/**
	 * @todo Use instanced drawing
	 */
	this.render = function() {
		const {rendererTextures} = this;
		const {gl} = outputRenderer;

		for (let i = 0; i < rendererLength; i++) {
			if (this.renderers[i].disabled) continue;

			gl.bindTexture(gl.TEXTURE_2D, rendererTextures[i]);
			gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
		}
	};

	this.dispose = function() {
		const {gl} = outputRenderer;

		if (gl === null) return console.info("This exception occurred before building the instance.");

		/** @todo Stop the game loop if it has started */

		// Dispose child renderers
		for (let i = 0; i < rendererLength; i++) this.renderers[i].dispose();

		// Remove the resize observer
		this.resizeObserver.unobserve(outputRenderer.canvas);

		outputRenderer.dispose();

		return console.info("The instance was properly disposed after catching this exception.");
	};

	this.addMouseDownListener = function(listener) {
		mouseDownListeners.push(listener);
		mouseDownListenerCount++;
	};

	this.addMouseEnterListener = function(listener) {
		mouseEnterListeners.push(listener);
		mouseEnterListenerCount++;
	};

	this.addMouseLeaveListener = function(listener) {
		mouseLeaveListeners.push(listener);
		mouseLeaveListenerCount++;
	};

	/**
	 * Manager for the `mouseenter` and `mouseleave` events.
	 * 
	 * @param {{x: Number, y: Number}}
	 */
	function mouseMoveListener({clientX: x, clientY: y}) {
		pointerPosition = new Vector2(x, y).divideScalar(this.currentScale);
		let i, listener;

		for (i = 0; i < mouseEnterListenerCount; i++) {
			listener = mouseEnterListeners[i];

			if (!intersects(pointerPosition, listener.component.getPosition(), listener.component.getSize())) continue;
			if (listener.component.isHovered()) continue;

			listener.component.setIsHovered(true);
			listener(pointerPosition);
		}

		for (i = 0; i < mouseLeaveListenerCount; i++) {
			listener = mouseLeaveListeners[i];

			if (intersects(pointerPosition, listener.component.getPosition(), listener.component.getSize())) continue;
			if (!listener.component.isHovered()) continue;

			listener.component.setIsHovered(false);
			listener(pointerPosition);
		}
	}

	/**
	 * Manager for the `mousedown` event.
	 */
	function mouseDownListener() {
		for (let i = 0, listener; i < mouseDownListenerCount; i++) {
			listener = mouseDownListeners[i];

			if (!intersects(pointerPosition, listener.component.getPosition(), listener.component.getSize())) return;

			listener(pointerPosition);
		}
	}

	this.getViewport = () => viewport;
}