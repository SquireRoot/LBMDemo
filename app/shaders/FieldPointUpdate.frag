#version 300 es

precision highp float;
precision highp int ;

in vec2 pixPos;

uniform sampler2D inPointDS;
uniform sampler2D field;
uniform sampler2D timeOffset;
uniform float speedFactor;
uniform int travelTime;
uniform int time;
uniform vec2 vertOffset;

layout (location = 0) out vec4 outPointDS;

void main() {
	vec4 delay = texture(timeOffset, pixPos);
	int delayedTime = time + int(floor(delay.r*float(travelTime)));
	if (mod(float(delayedTime), float(travelTime)) < 1.0) {
		outPointDS = vec4(0.0, 0.0, 0.0, 0.0);
		return;
	}

	vec4 inPointDSValue = texture(inPointDS, pixPos);
	vec2 fieldCoordinate = pixPos + vertOffset;
	fieldCoordinate.x = fieldCoordinate.x + inPointDSValue.r;
	fieldCoordinate.y = fieldCoordinate.y + inPointDSValue.g;
	vec4 fieldValue = texture(field, fieldCoordinate) * speedFactor;

	outPointDS = vec4(0.0,0.0,0.0,0.0);
	outPointDS.r = inPointDSValue.r + fieldValue.r;
	outPointDS.g = inPointDSValue.g + fieldValue.g;

	// vec4 inPointDSValue = texture(inPointDS, pixPos);
	// outPointDS = vec4(float(time)/100.0,0.0,0.0,0.0);
}