#version 300 es

precision mediump float;
precision mediump sampler2DArray;

flat in uint v_textureIndex;
in vec2 v_uv;

/** @todo Rebuild the array with only the used textures? */
uniform sampler2DArray u_textures;

out vec4 FragColor;

void main() {
	FragColor = texture(u_textures, vec3(v_uv, v_textureIndex));
}