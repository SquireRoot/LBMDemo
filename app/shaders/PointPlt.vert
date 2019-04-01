#version 300 es

precision highp float;
precision highp int ;

in vec4 position;

void main() {
	gl_Position = position;
	gl_PointSize = 4.0;
}