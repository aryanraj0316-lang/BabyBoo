/**
 * 2.5D lighting for Buddy: an SkSL runtime shader that relights each part
 * with its normal map.
 *
 * Calibration: the diffuse term is a RATIO against the neutral light, and the
 * specular term is relative to the neutral specular, so with the neutral
 * light, key = 1 and no screen spill the shader returns the source colours
 * exactly (lighting only adds depth when the light moves or the phone glows).
 * Colours are premultiplied; additive terms are scaled by alpha.
 */
import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';

export const LIGHTING_SKSL = `
uniform shader image;
uniform shader normalMap;
uniform float3 lightDir;     // normalized, in the part's local frame
uniform float3 neutralDir;   // the light the source was rendered with (local)
uniform float3 lightColor;
uniform float ambient;
uniform float key;
uniform float specPower;
uniform float specAmount;
uniform float rimAmount;
uniform float3 spillDir;     // phone glow direction (local)
uniform float3 spillColor;   // screen tint * luma * intensity
uniform float debugNormals;

half4 main(float2 xy) {
  half4 base = image.eval(xy);
  if (base.a < 0.004) { return half4(0); }
  half4 nm = normalMap.eval(xy);
  float3 n = normalize(float3(nm.rgb) * 2.0 - 1.0);
  if (debugNormals > 0.5) { return half4(half3(nm.rgb) * base.a, base.a); }
  float d  = max(dot(n, lightDir), 0.0);
  float d0 = max(dot(n, neutralDir), 0.0);
  float k  = ambient + (1.0 - ambient) * d;
  float k0 = ambient + (1.0 - ambient) * d0;
  float ratio = (k / max(k0, 0.05));
  ratio = mix(1.0, ratio, clamp(key, 0.0, 2.0));
  float3 h  = normalize(lightDir + float3(0.0, 0.0, 1.0));
  float3 h0 = normalize(neutralDir + float3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, h), 0.0), specPower) - pow(max(dot(n, h0), 0.0), specPower);
  float3 lit = float3(base.rgb) * ratio;
  lit += lightColor * (spec * specAmount * key) * float(base.a);
  // Screen spill: soft diffuse glow plus a rim on the side facing the phone.
  float ds = max(dot(n, spillDir), 0.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.0) * max(dot(normalize(n.xy + 1e-4), normalize(spillDir.xy + 1e-4)), 0.0);
  lit += float3(base.rgb) * spillColor * ds;
  lit += spillColor * rim * rimAmount * float(base.a);
  lit = min(lit, float3(base.a));
  return half4(half3(lit), base.a);
}
`;

let cached: SkRuntimeEffect | null | undefined;

/** Compile once; returns null if runtime effects are unavailable. */
export function getLightingEffect(): SkRuntimeEffect | null {
  if (cached !== undefined) return cached;
  try {
    cached = Skia.RuntimeEffect.Make(LIGHTING_SKSL);
  } catch {
    cached = null;
  }
  return cached;
}

/** Rotate a screen-space direction into a part's local frame. */
export function toLocal(v: [number, number, number], m: number[]): [number, number, number] {
  'worklet';
  const ang = Math.atan2(m[3], m[0]);
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

/** The light the source render appears lit with (soft key from upper left). */
export const NEUTRAL_LIGHT: [number, number, number] = [-0.4511, -0.5514, 0.7018];
