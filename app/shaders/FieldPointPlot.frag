#version 300 es

precision highp float;
precision highp int ;

out vec4 color;
in vec2 pixPos;

uniform sampler2D newPointDS;
uniform sampler2D oldPointDS;
uniform sampler2D clrm;
uniform float colorMax;
uniform float colorMin;
uniform float speedFactor;

void main() {
	vec4 newValue = texture(newPointDS, pixPos);
	if (newValue.r == 0.0 && newValue.g == 0.0) {
		color = vec4(1.0,1.0,1.0,0.0);
		return; // if the point position is reset dont render the point
	}

	vec4 oldValue = texture(oldPointDS, pixPos);
	vec4 fieldDiff = (newValue - oldValue)/speedFactor;
	float magnitude = sqrt(fieldDiff.r*fieldDiff.r 
						 + fieldDiff.g*fieldDiff.g);
	magnitude = (magnitude + colorMin)/(colorMax - colorMin);
	color = texture(clrm, vec2(magnitude, 0.0));
}