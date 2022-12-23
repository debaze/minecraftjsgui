#version 300 es

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;

out vec2 v_uv;

void main() {
	gl_Position = vec4(a_position, 0, 1);

	v_uv = a_uv;
}