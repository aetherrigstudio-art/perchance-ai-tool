// Fullscreen "big triangle" vertex shader.
// Drawn with gl.drawArrays(gl.TRIANGLES, 0, 3) and NO vertex buffer:
// vertices are generated from gl_VertexID, so the only attribute-free
// state we need is the index. Covers the clip-space viewport with a single
// oversized triangle (cheaper than a quad: no diagonal seam, fewer verts).
export const FULLSCREEN_VERT = /* glsl */ `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  // gl_VertexID -> {0,1,2}. Generate a triangle that covers [-1,1] twice over.
  vec2 p = vec2(
    float((gl_VertexID << 1) & 2),
    float(gl_VertexID & 2)
  );
  vUv = p;                 // 0..2 range; the slime shader maps with its own uv math
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;
