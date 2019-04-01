#version 300 es

precision highp float;
precision highp int ;

layout (location = 0) out vec4 field;

void main() {
	field = vec4(0.0, 0.0, 0.0, 0.0); // initialize to 0 for now
}