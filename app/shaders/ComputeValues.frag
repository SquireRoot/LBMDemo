#version 300 es

precision highp float;

in vec2 pixPos;

uniform sampler2D n0_rho_ux_uy;

layout (location = 0) out vec4 values;

void main() {
	vec4 data = texture(n0_rho_ux_uy, pixPos);
	values = vec4(0.0,0.0,0.0,0.0);
	values.b = sqrt(data.b*data.b + data.a*data.a);
	values.r = data.b;
	values.g = data.a;
}