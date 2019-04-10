#version 300 es

precision highp float;

in vec2 pixPos;

uniform sampler2D map;

layout (location = 0) out vec4 values;

void main() {
	values = vec4(0.0,0.0,0.0,1.0);
	//values = texture(map, pixPos);
	values.r = pixPos.y;
}