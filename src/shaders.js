import * as THREE from 'three';

/**
 * Custom GLSL Atmospheric Sky Dome
 * Renders multi-band Rayleigh/Mie gradient, glowing solar disc, twinkling stars & crescent moon at night.
 */
export function createSkyDome() {
  const uniforms = {
    uTopColor: { value: new THREE.Color('#2c6e91') },
    uMidColor: { value: new THREE.Color('#f4a261') },
    uHorizonColor: { value: new THREE.Color('#ffd699') },
    uSunDir: { value: new THREE.Vector3(-0.55, 0.24, -0.8).normalize() },
    uSunColor: { value: new THREE.Color('#fff1c1') },
    uNightMix: { value: 0.0 },
    uTime: { value: 0.0 }
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vWorldDir;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uTopColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uNightMix;
      uniform float uTime;
      varying vec3 vWorldDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, -0.1, 1.0);

        // Smooth 3-band sky gradient
        vec3 col = mix(uHorizonColor, uMidColor, smoothstep(-0.04, 0.24, h));
        col = mix(col, uTopColor, smoothstep(0.18, 0.78, h));

        // Sun glow & solar disc
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float mieHalo = pow(sunDot, 7.0) * 0.45 * (1.0 - uNightMix * 0.75);
        float sunCore = smoothstep(0.9965, 0.9992, sunDot) * (1.0 - uNightMix * 0.85);
        col += uSunColor * mieHalo + vec3(1.0, 0.97, 0.88) * sunCore * 1.4;

        // Warm horizon band near sun azimuth
        float horizonGlow = exp(-abs(dir.y) * 9.0) * pow(sunDot, 2.5) * 0.35 * (1.0 - uNightMix * 0.8);
        col += uSunColor * horizonGlow;

        // Starfield & Moon at night
        if (uNightMix > 0.01 && dir.y > 0.02) {
          vec3 starCell = floor(dir * 260.0);
          float rnd = hash(starCell);
          if (rnd > 0.9945) {
            float twinkle = 0.65 + 0.35 * sin(uTime * 2.5 + rnd * 120.0);
            float starIntensity = smoothstep(0.02, 0.25, dir.y) * uNightMix * twinkle;
            col += vec3(0.85, 0.92, 1.0) * starIntensity * 1.25;
          }

          // Crescent moon
          vec3 moonDir = normalize(vec3(-0.45, 0.42, -0.78));
          float moonDot = dot(dir, moonDir);
          float moonDisc = smoothstep(0.9982, 0.9989, moonDot);
          vec3 offsetDir = normalize(moonDir + vec3(0.018, 0.012, 0.0));
          float cutDisc = smoothstep(0.9984, 0.9990, dot(dir, offsetDir));
          float crescent = max(moonDisc - cutDisc, 0.0);
          float moonHalo = pow(max(moonDot, 0.0), 48.0) * 0.35;
          col += (vec3(0.92, 0.95, 1.0) * crescent * 1.5 + vec3(0.5, 0.68, 0.95) * moonHalo) * uNightMix;
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(260, 48, 32), mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/**
 * Custom GLSL Animated Coastal Ocean Shader
 * Multi-wave displacement, analytical normals, Fresnel sky reflection, sparkling sun path & pier seafoam!
 */
export function createOcean() {
  const uniforms = {
    uTime: { value: 0.0 },
    uScrollZ: { value: 0.0 },
    uDeepColor: { value: new THREE.Color('#0c4a6e') },
    uShallowColor: { value: new THREE.Color('#19959e') },
    uSkyColor: { value: new THREE.Color('#ffd699') },
    uSunColor: { value: new THREE.Color('#ffe2a8') },
    uSunDir: { value: new THREE.Vector3(-0.55, 0.24, -0.8).normalize() },
    uFogColor: { value: new THREE.Color('#f7c998') },
    uFogNear: { value: 35.0 },
    uFogFar: { value: 195.0 }
  };

  const geo = new THREE.PlaneGeometry(360, 360, 140, 140);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uScrollZ;
      varying vec3 vWorldPos;
      varying float vWaveHeight;
      varying vec2 vSampleCoord;

      float waveSum(vec2 p, float t) {
        float w = 0.0;
        w += sin(p.x * 0.22 + p.y * 0.14 + t * 1.35) * 0.26;
        w += sin(p.x * -0.15 + p.y * 0.31 + t * 1.05) * 0.18;
        w += sin(p.x * 0.48 - p.y * 0.42 + t * 2.10) * 0.09;
        w += cos(p.x * 0.85 + p.y * 0.65 - t * 2.60) * 0.045;
        return w;
      }

      void main() {
        vec3 pos = position;
        vec2 sampleP = vec2(pos.x, pos.z - uScrollZ);
        float h = waveSum(sampleP, uTime);
        pos.y += h;
        vWaveHeight = h;
        vSampleCoord = sampleP;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uTime;
      uniform vec3 uDeepColor;
      uniform vec3 uShallowColor;
      uniform vec3 uSkyColor;
      uniform vec3 uSunColor;
      uniform vec3 uSunDir;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;

      varying vec3 vWorldPos;
      varying float vWaveHeight;
      varying vec2 vSampleCoord;

      float waveHeight(vec2 p, float t) {
        float w = 0.0;
        w += sin(p.x * 0.22 + p.y * 0.14 + t * 1.35) * 0.26;
        w += sin(p.x * -0.15 + p.y * 0.31 + t * 1.05) * 0.18;
        w += sin(p.x * 0.48 - p.y * 0.42 + t * 2.10) * 0.09;
        w += cos(p.x * 0.85 + p.y * 0.65 - t * 2.60) * 0.045;
        // Fine sparkling capillary ripples
        w += sin(p.x * 2.4 + p.y * 1.8 + t * 3.8) * 0.018;
        w += cos(p.x * 3.1 - p.y * 2.6 - t * 4.2) * 0.014;
        return w;
      }

      void main() {
        float eps = 0.22;
        vec2 p = vSampleCoord;
        float hL = waveHeight(p - vec2(eps, 0.0), uTime);
        float hR = waveHeight(p + vec2(eps, 0.0), uTime);
        float hD = waveHeight(p - vec2(0.0, eps), uTime);
        float hU = waveHeight(p + vec2(0.0, eps), uTime);
        vec3 N = normalize(vec3(hL - hR, 2.0 * eps, hD - hU));

        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunDir);

        // Fresnel
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        fresnel = clamp(0.08 + fresnel * 0.82, 0.0, 1.0);

        // Water base color (shallow turquoise near pier, rich deep ocean farther out)
        float distFromPier = abs(vWorldPos.x);
        float shallowMask = exp(-distFromPier * 0.055);
        float crestTint = smoothstep(-0.2, 0.45, vWaveHeight);
        vec3 waterCol = mix(uDeepColor, uShallowColor, clamp(shallowMask * 0.72 + crestTint * 0.35, 0.0, 1.0));

        // Sky reflection
        vec3 col = mix(waterCol, uSkyColor, fresnel * 0.62);

        // Sparkling sun specular glitter
        vec3 H = normalize(L + V);
        float specSharp = pow(max(dot(N, H), 0.0), 180.0);
        float specBroad = pow(max(dot(N, H), 0.0), 22.0);
        col += uSunColor * (specSharp * 2.4 + specBroad * 0.34);

        // Soft seafoam along the pier edge & high wave crests
        float pierFoamBand = exp(-pow((distFromPier - 3.35) * 1.15, 2.0));
        float foamNoise = sin(p.y * 1.4 + uTime * 2.2) * cos(p.x * 2.1 - uTime * 1.6);
        float foam = smoothstep(0.18, 0.62, pierFoamBand * (0.75 + 0.45 * foamNoise));
        float crestFoam = smoothstep(0.38, 0.56, vWaveHeight + foamNoise * 0.08) * 0.45;
        col = mix(col, vec3(0.95, 0.98, 1.0), clamp(foam * 0.68 + crestFoam, 0.0, 0.85));

        // Distance atmospheric fog blend
        float dist = length(cameraPosition - vWorldPos);
        float fogFactor = smoothstep(uFogNear, uFogFar, dist);
        col = mix(col, uFogColor, fogFactor);

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -2.05;
  mesh.receiveShadow = true;
  return { mesh, uniforms };
}
