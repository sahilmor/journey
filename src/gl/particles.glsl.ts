// Simplex noise by Ashima Arts / Stefan Gustavson (MIT).
const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uIntro;
uniform vec2 uSpinFrom;   // rotation of the "from" shape around Y and Z
uniform vec2 uSpinTo;
uniform vec3 uMouse;      // cursor position in the particles' local space
uniform float uMouseStrength;
uniform float uSize;
uniform float uPixelRatio;
uniform float uScale;
uniform float uCalm;      // 1 when the viewer prefers reduced motion
uniform float uSwarm;     // how much particles swirl while changing shape (1 normal, near 0 for a glide)

attribute vec3 aTo;
attribute vec3 aColorFrom;
attribute vec3 aColorTo;
attribute vec2 aExtFrom;  // [motion, size]
attribute vec2 aExtTo;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;

${noise}

vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 rotZ(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z); }

// Per-shape motion. 0 still, 1 wave, 2 flame, 3 drift, 4 twinkle.
vec3 motion(vec3 p, float type, out float alpha) {
  alpha = 1.0;
  float live = 1.0 - uCalm;
  if (type > 0.5 && type < 1.5) {
    p.y += (sin(p.x * 1.7 + uTime * 0.9 + p.z * 0.6) * 0.07 + sin(p.z * 2.3 - uTime * 1.1) * 0.05) * live;
  } else if (type > 1.5 && type < 2.5) {
    float f = fract(aRand.z + uTime * 0.26 * live);
    p.y += f * 1.35;
    p.xz *= 1.0 - f * 0.8;
    p.x += sin(uTime * 3.0 + aRand.w * 6.28) * 0.035 * f * live;
    alpha = sin(f * 3.14159);
  } else if (type > 2.5 && type < 3.5) {
    float t = uTime * 0.035 * live;
    p += vec3(snoise(p * 0.25 + t), snoise(p * 0.25 + 17.0 + t), snoise(p * 0.25 + 31.0 + t)) * 0.3;
  } else if (type > 3.5 && type < 4.5) {
    alpha = 0.72 + 0.28 * sin(uTime * (1.2 + aRand.w * 2.4) + aRand.z * 6.2831) * live;
  } else if (type > 4.5) {
    // A small lamp flame: a short rise and a quick flicker.
    float f = fract(aRand.z + uTime * 0.9 * live);
    p.y += f * 0.12;
    p.xz += vec2(sin(uTime * 7.0 + aRand.w * 6.28), cos(uTime * 5.0 + aRand.x * 6.28)) * 0.012 * live;
    alpha = 0.55 + 0.45 * sin(f * 3.14159);
  }
  return p;
}

void main() {
  float r = aRand.x;

  // Each particle starts its journey a little later than the last, so shapes pour
  // into each other instead of snapping.
  float t = clamp(uMorph * 1.45 - r * 0.45, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  float aFrom;
  float aTo_;
  vec3 from = motion(rotZ(rotY(position, uSpinFrom.x), uSpinFrom.y), aExtFrom.x, aFrom);
  vec3 to = motion(rotZ(rotY(aTo, uSpinTo.x), uSpinTo.y), aExtTo.x, aTo_);
  vec3 p = mix(from, to, t);
  float alpha = mix(aFrom, aTo_, t);

  // A slow breath at rest, a swirling swarm in the middle of a change.
  float mid = sin(t * 3.14159);
  vec3 q = p * 0.42 + vec3(0.0, 0.0, uTime * 0.07);
  vec3 turb = vec3(snoise(q + r * 2.0), snoise(q + vec3(19.1, 7.3, 0.0)), snoise(q + vec3(3.7, 29.9, 0.0)));
  p += turb * (0.018 + mid * 0.95 * uSwarm) * (1.0 - uCalm * 0.8);

  // Intro: the particles arrive from far away and settle into the first shape.
  float it = clamp(uIntro * 1.5 - r * 0.5, 0.0, 1.0);
  it = 1.0 - pow(1.0 - it, 3.0);
  vec3 scatter = normalize(aRand.xyz * 2.0 - 1.0 + 0.001) * (8.0 + aRand.w * 9.0);
  p = mix(scatter, p, it);

  // The cursor parts the particles like a hand through dust.
  vec2 d = p.xy - uMouse.xy;
  float dist = length(d);
  float push = smoothstep(1.0, 0.0, dist) * uMouseStrength;
  p.xy += normalize(d + 1e-4) * push * 0.5;
  p.z += push * 0.35;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = mix(aExtFrom.y, aExtTo.y, t);
  gl_PointSize = uSize * size * (0.55 + aRand.y * 0.9) * uPixelRatio * uScale / -mv.z;
  vColor = mix(aColorFrom, aColorTo, t);
  vAlpha = alpha * it;
}
`

export const particleFragment = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float glow = pow(smoothstep(0.5, 0.0, d), 1.7);
  gl_FragColor = vec4(vColor, glow * vAlpha * uOpacity);
  #include <colorspace_fragment>
}
`
