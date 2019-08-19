#version 300 es

precision highp float;
precision highp int ;

in vec4 position;

out vec2 pixPos;

uniform float size;
uniform sampler2D pointDS;

void main() {
    pixPos = position.xy;

    vec4 ds = texture(pointDS, pixPos);
    gl_Position = vec4((position.x+ds.r)*2.0 - 1.0, (position.y+ds.g)*2.0 - 1.0, 0.0, 1.0);

	gl_PointSize = size;
}
