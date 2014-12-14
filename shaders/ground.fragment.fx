precision highp float;

varying vec4 vPosition;

// assume the minimum terrain height is 0
uniform float MAX_TERRAIN_HEIGHT;

uniform sampler2D rockSampler;
uniform sampler2D grassSampler;
uniform sampler2D snowSampler;

void main() {
    float fractionOfMaxTerrainHeight = vPosition.y / MAX_TERRAIN_HEIGHT;

    const int NUMBER_OF_TEXTURES = 3;
    vec4 TEXTURE_COLORS_AT_CURRENT_XZ[NUMBER_OF_TEXTURES];
    TEXTURE_COLORS_AT_CURRENT_XZ[0] = texture2D(rockSampler,  vPosition.xz);
    TEXTURE_COLORS_AT_CURRENT_XZ[1] = texture2D(grassSampler, vPosition.xz);
    TEXTURE_COLORS_AT_CURRENT_XZ[2] = texture2D(snowSampler,  vPosition.xz);

    // If vPosition.y falls between two values adjacent in this array, linearly interpolate
    // the colors of the corresponding textures. Otherwise, use only the top or bottom texture.
    float TEXTURE_BOUNDARY_HEIGHTS[NUMBER_OF_TEXTURES];
    TEXTURE_BOUNDARY_HEIGHTS[0] = 0.05;
    TEXTURE_BOUNDARY_HEIGHTS[1] = 0.50;
    TEXTURE_BOUNDARY_HEIGHTS[2] = .95;

    if        (fractionOfMaxTerrainHeight < TEXTURE_BOUNDARY_HEIGHTS[0]) {
        gl_FragColor = TEXTURE_COLORS_AT_CURRENT_XZ[0];
    } else if (fractionOfMaxTerrainHeight > TEXTURE_BOUNDARY_HEIGHTS[NUMBER_OF_TEXTURES - 1]) {
        gl_FragColor = TEXTURE_COLORS_AT_CURRENT_XZ[NUMBER_OF_TEXTURES - 1];
    } else {
        for (int i = 0; i < NUMBER_OF_TEXTURES - 1; i++) {
            float lowHeightBoundary  = TEXTURE_BOUNDARY_HEIGHTS[i];
            float highHeightBoundary = TEXTURE_BOUNDARY_HEIGHTS[i+1];
            if (fractionOfMaxTerrainHeight > lowHeightBoundary &&
                fractionOfMaxTerrainHeight < highHeightBoundary) {
                float fractionBetweenHeightBoundaries = (fractionOfMaxTerrainHeight - lowHeightBoundary) /
                                                                (highHeightBoundary - lowHeightBoundary);
                vec4 lowTextureColor  = TEXTURE_COLORS_AT_CURRENT_XZ[i];
                vec4 highTextureColor = TEXTURE_COLORS_AT_CURRENT_XZ[i+1];
                gl_FragColor = mix(lowTextureColor, highTextureColor, fractionBetweenHeightBoundaries);
            }
        }
    }
}