export const mediaVertex = /* glsl */ `
uniform float uVelocity;
varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 p = position;
  // Fast scrolling bends the photo a little, like paper moving through air.
  p.y += sin(uv.x * 3.14159) * uVelocity * 0.035;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const mediaFragment = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uImage;     // texture size in pixels
uniform vec2 uPlane;     // plane size in pixels
uniform float uReveal;   // 0 hidden, 1 shown
uniform float uHover;
uniform vec2 uMouse;     // cursor in the plane's uv
uniform float uVelocity;
uniform float uParallax; // -1 above the viewport centre, 1 below
uniform float uTime;
uniform float uRadius;   // corner radius in pixels
varying vec2 vUv;

// Signed distance to a rounded rectangle the size of the plane, in pixels.
float roundedEdge(vec2 uv) {
  vec2 p = (uv - 0.5) * uPlane;
  vec2 q = abs(p) - (uPlane * 0.5 - uRadius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// object-fit: cover, in the shader
vec2 cover(vec2 uv) {
  float rp = uPlane.x / uPlane.y;
  float ri = uImage.x / uImage.y;
  vec2 s = rp < ri ? vec2(rp / ri, 1.0) : vec2(1.0, ri / rp);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float rv = 1.0 - pow(1.0 - uReveal, 3.0);

  // The photo settles from a close crop as it is revealed, and drifts against the scroll.
  float zoom = mix(1.32, 1.1, rv) + uHover * 0.035;
  vec2 uv = (vUv - 0.5) / zoom + 0.5;
  uv.y += uParallax * 0.045;

  // A soft lens follows the cursor.
  vec2 toM = (vUv - uMouse) * vec2(uPlane.x / uPlane.y, 1.0);
  float lens = smoothstep(0.5, 0.0, length(toM)) * uHover;
  uv -= (vUv - uMouse) * lens * 0.07;

  vec2 cuv = cover(uv);
  float split = 0.0022 * uHover + min(abs(uVelocity), 1.0) * 0.006;
  vec3 col = vec3(
    texture2D(uTex, cuv + vec2(split, 0.0)).r,
    texture2D(uTex, cuv).g,
    texture2D(uTex, cuv - vec2(split, 0.0)).b
  );

  // One grade for every photo so a mix of phone pictures still looks like one film:
  // slightly warm, slightly muted, soft blacks, vignette and grain.
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(l), 0.14 * (1.0 - uHover));
  col *= vec3(1.04, 1.0, 0.94);
  col = col * 0.93 + 0.018;
  col *= mix(0.78, 1.0, smoothstep(0.95, 0.3, length(vUv - 0.5)));
  col += (hash(vUv * uPlane + fract(uTime * 7.0)) - 0.5) * 0.03;

  // Revealed from the bottom up with a soft edge.
  float edge = rv * 1.15;
  float mask = 1.0 - smoothstep(edge - 0.08, edge, vUv.y);
  // Smooth corners: a one-pixel soft edge instead of a jagged cut.
  float corners = 1.0 - smoothstep(-0.8, 0.8, roundedEdge(vUv));
  // A faint light line along the top edge, like light catching a print.
  float rim = smoothstep(2.0, 0.0, abs(roundedEdge(vUv) + 1.0)) * smoothstep(0.35, 1.0, vUv.y) * 0.08;
  col += rim;
  gl_FragColor = vec4(col, mask * corners);
  #include <colorspace_fragment>
}
`
