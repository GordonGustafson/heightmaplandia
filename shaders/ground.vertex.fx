precision highp float;

attribute vec3 position;

uniform mat4 worldViewProjection;

varying vec4 vPosition;

void main() {
    vPosition = vec4( position, 1. );

    gl_Position = worldViewProjection * vPosition;
}