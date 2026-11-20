import * as THREE from 'three';
import { createWoodTextures, createLighthouseTexture, createGlowSpriteTexture } from './textures.js';
import { createSkyDome, createOcean } from './shaders.js';

/**
 * Endless Living Coastal Boardwalk & Ocean World
 * - Scrolling cedar wooden pier with railings, pilings, vintage streetlamps & AI poster signboard
 * - Custom GLSL Sky Dome & Ocean Water with sun glitter and pier seafoam
 * - Iconic red-and-white striped Coastal Lighthouse with rotating light beam
 * - Swaying palm trees, bobbing buoys, sailboats, fluffy clouds, flocking seagulls
 * - Interactive leaping silver fish with water splash & golden catch sparkles
 * - Turbo Boost wind speed-lines
 */
export function createCoastalWorld(scene) {
  const worldGroup = new THREE.Group();
  scene.add(worldGroup);

  // 1. Custom GLSL Sky Dome & Ocean
  const sky = createSkyDome();
  scene.add(sky.mesh);

  const ocean = createOcean();
  scene.add(ocean.mesh);

  const glowSpriteTex = createGlowSpriteTexture();

  // 2. Infinite Scrolling Wooden Boardwalk Pier
  const { map: woodMap, bumpMap: woodBump } = createWoodTextures();
  woodMap.repeat.set(1.5, 3.0);
  woodBump.repeat.set(1.5, 3.0);

  const deckMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.025,
    roughness: 0.84,
    metalness: 0.02
  });

  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x7c5335,
    roughness: 0.9,
    metalness: 0.02
  });

  const pilingMat = new THREE.MeshStandardMaterial({
    color: 0x4f3928,
    roughness: 0.95
  });

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.72,
    roughness: 0.38
  });

  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.2,
    roughness: 0.15
  });

  // Load our AI-generated "PELICAN CYCLE CLUB" poster for the 3D pier signboard!
  const posterTex = new THREE.TextureLoader().load('./poster.jpg');
  posterTex.colorSpace = THREE.SRGBColorSpace;
  const posterMat = new THREE.MeshStandardMaterial({
    map: posterTex,
    roughness: 0.45,
    metalness: 0.05
  });

  const SEG_LEN = 12;
  const SEG_COUNT = 16;
  const TOTAL_LEN = SEG_LEN * SEG_COUNT; // 192m seamless loop
  const PIER_HALF_W = 3.1;
  const segments = [];
  const lanternGlowSprites = [];

  for (let i = 0; i < SEG_COUNT; i++) {
    const seg = new THREE.Group();
    seg.position.z = 48 - i * SEG_LEN;

    // Main boardwalk cedar plank deck (top at exactly y = 0!)
    const deck = new THREE.Mesh(new THREE.BoxGeometry(PIER_HALF_W * 2, 0.18, SEG_LEN), deckMat);
    deck.position.y = -0.09;
    deck.receiveShadow = true;
    seg.add(deck);

    // Side kerbs / beams
    for (const sx of [-1, 1]) {
      const kerb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, SEG_LEN), timberMat);
      kerb.position.set(sx * (PIER_HALF_W - 0.06), 0.02, 0);
      kerb.castShadow = true;
      kerb.receiveShadow = true;
      seg.add(kerb);

      // Horizontal top & mid guardrails (matching poster!)
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, SEG_LEN), timberMat);
      topRail.position.set(sx * (PIER_HALF_W - 0.05), 1.02, 0);
      topRail.castShadow = true;
      seg.add(topRail);

      const midRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.075, SEG_LEN), timberMat);
      midRail.position.set(sx * (PIER_HALF_W - 0.05), 0.56, 0);
      midRail.castShadow = true;
      seg.add(midRail);

      // Vertical posts & submerged pilings (3 per 12m segment)
      for (const pz of [-4, 0, 4]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.18, 0.14), timberMat);
        post.position.set(sx * (PIER_HALF_W - 0.05), 0.54, pz);
        post.castShadow = true;
        post.receiveShadow = true;
        seg.add(post);

        // Submerged round timber piling into the sea
        const piling = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.6, 10), pilingMat);
        piling.position.set(sx * (PIER_HALF_W - 0.12), -1.85, pz);
        seg.add(piling);
      }
    }

    // Vintage Cast-Iron Pier Streetlamp every 2 segments (alternating sides)
    if (i % 2 === 0) {
      const lampSide = (i % 4 === 0) ? 1 : -1;
      const lamp = new THREE.Group();
      lamp.position.set(lampSide * (PIER_HALF_W + 0.02), 0, -2);

      const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 0.65, 10), ironMat);
      poleBase.position.y = 0.32;
      const poleShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.078, 3.55, 10), ironMat);
      poleShaft.position.y = 2.25;
      poleShaft.castShadow = true;

      // Curved bracket overhanging boardwalk
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.055, 0.055), ironMat);
      arm.position.set(-lampSide * 0.28, 3.92, 0);

      // Lantern head
      const lanternX = -lampSide * 0.56;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 6), ironMat);
      cap.position.set(lanternX, 3.88, 0);
      const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.32, 6), lanternGlassMat);
      glass.position.set(lanternX, 3.63, 0);

      // Warm additive glow sprite (brightens at dusk & night)
      const spriteMat = new THREE.SpriteMaterial({
        map: glowSpriteTex,
        color: 0xffc866,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glow = new THREE.Sprite(spriteMat);
      glow.position.set(lanternX, 3.62, 0);
      glow.scale.set(2.4, 2.4, 1);
      lanternGlowSprites.push(glow);

      lamp.add(poleBase, poleShaft, arm, cap, glass, glow);
      seg.add(lamp);
    }

    // Charming Wooden Coastal Signboard displaying our AI-generated Poster every 6 segments!
    if (i === 4 || i === 11) {
      const sign = new THREE.Group();
      sign.position.set(-PIER_HALF_W - 0.35, 0, 2);
      sign.rotation.y = 0.28;

      const sPostL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.75, 0.11), timberMat);
      sPostL.position.set(-1.05, 1.32, 0);
      const sPostR = sPostL.clone();
      sPostR.position.x = 1.05;

      const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.38, 0.1), timberMat);
      boardFrame.position.set(0, 2.02, 0);
      boardFrame.castShadow = true;

      const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 1.22), posterMat);
      posterFace.position.set(0, 2.02, 0.056);

      const posterFaceBack = new THREE.Mesh(new THREE.PlaneGeometry(2.16, 1.22), posterMat);
      posterFaceBack.position.set(0, 2.02, -0.056);
      posterFaceBack.rotation.y = Math.PI;

      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.09, 0.44), timberMat);
      roof.position.set(0, 2.76, 0.04);
      roof.rotation.x = 0.14;

      sign.add(sPostL, sPostR, boardFrame, posterFace, posterFaceBack, roof);
      seg.add(sign);
    }

    worldGroup.add(seg);
    segments.push(seg);
  }

  // 3. Iconic Red-and-White Striped Coastal Lighthouse on Rocky Headland!
  const lighthouseGroup = new THREE.Group();
  lighthouseGroup.position.set(34, -2.0, -56);
  worldGroup.add(lighthouseGroup);

  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6b6057, roughness: 0.94 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x5c8044, roughness: 0.88 });

  // Layered rocky headland
  const headlandParts = [
    { pos: [0, 0.8, 0], scale: [14, 4.5, 11] },
    { pos: [-8, 0.1, 4], scale: [8, 2.8, 7] },
    { pos: [9, 0.2, -3], scale: [9, 3.0, 8] },
    { pos: [-14, -0.5, 8], scale: [5, 1.6, 5] }
  ];
  for (const hp of headlandParts) {
    const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), rockMat);
    r.position.set(...hp.pos);
    r.scale.set(...hp.scale);
    r.receiveShadow = true;
    lighthouseGroup.add(r);
  }
  const grassCap = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), grassMat);
  grassCap.position.set(0, 2.6, 0);
  grassCap.scale.set(11.5, 1.8, 8.8);
  lighthouseGroup.add(grassCap);

  // Striped Lighthouse Tower
  const lhTex = createLighthouseTexture();
  const lhTower = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 2.55, 15.5, 24),
    new THREE.MeshStandardMaterial({ map: lhTex, roughness: 0.72 })
  );
  lhTower.position.set(0, 10.6, 0);
  lhTower.castShadow = true;
  lighthouseGroup.add(lhTower);

  // Gallery deck & lantern room
  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 1.75, 0.6, 20), ironMat);
  gallery.position.set(0, 18.4, 0);
  lighthouseGroup.add(gallery);

  const lhGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfff3c4,
    emissive: 0xffcc55,
    emissiveIntensity: 1.4,
    roughness: 0.1
  });
  const lanternRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 2.1, 16), lhGlassMat);
  lanternRoom.position.set(0, 19.65, 0);
  lighthouseGroup.add(lanternRoom);

  const lhRoof = new THREE.Mesh(
    new THREE.ConeGeometry(1.65, 1.8, 16),
    new THREE.MeshStandardMaterial({ color: 0xc93b2e, roughness: 0.55 })
  );
  lhRoof.position.set(0, 21.5, 0);
  lighthouseGroup.add(lhRoof);

  // Cozy keeper's cottage beside the lighthouse
  const cottageBody = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.8, 3.6),
    new THREE.MeshStandardMaterial({ color: 0xf6efe2, roughness: 0.8 })
  );
  cottageBody.position.set(4.6, 4.9, 1.4);
  const cottageRoof = new THREE.Mesh(
    new THREE.ConeGeometry(3.6, 1.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xb93c2e, roughness: 0.7 })
  );
  cottageRoof.rotation.y = Math.PI / 4;
  cottageRoof.position.set(4.6, 7.1, 1.4);
  lighthouseGroup.add(cottageBody, cottageRoof);

  // Rotating Volumetric Lighthouse Beam!
  const lhBeamPivot = new THREE.Group();
  lhBeamPivot.position.set(0, 19.65, 0);
  lighthouseGroup.add(lhBeamPivot);

  const lhBeamMat = new THREE.MeshBasicMaterial({
    color: 0xffe494,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  for (const dir of [-1, 1]) {
    const beam = new THREE.Mesh(new THREE.ConeGeometry(5.5, 58, 20, 1, true), lhBeamMat);
    beam.rotation.z = dir * Math.PI / 2;
    beam.position.x = dir * 29;
    lhBeamPivot.add(beam);
  }

  // 4. Swaying Palm Tree Islets, Bobbing Buoys & Distant Sailboats (Looping Props)
  const scrollingProps = [];

  function buildPalmTree(scale = 1) {
    const palm = new THREE.Group();
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 2.2, 0.1),
      new THREE.Vector3(0.9, 4.6, 0.2),
      new THREE.Vector3(1.25, 6.4, 0.1)
    ]);
    const trunk = new THREE.Mesh(
      new THREE.TubeGeometry(trunkCurve, 12, 0.22, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x8b6240, roughness: 0.92 })
    );
    palm.add(trunk);

    const crown = new THREE.Group();
    crown.position.set(1.25, 6.4, 0.1);
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x3b8c52, roughness: 0.72, side: THREE.DoubleSide });
    for (let f = 0; f < 7; f++) {
      const a = (f / 7) * Math.PI * 2;
      const frond = new THREE.Group();
      frond.rotation.y = a;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), frondMat);
      leaf.scale.set(0.75, 0.14, 3.6);
      leaf.position.set(0, -0.25, 1.55);
      leaf.rotation.x = 0.42;
      frond.add(leaf);
      crown.add(frond);
    }
    palm.add(crown);
    palm.scale.setScalar(scale);
    return { palm, crown };
  }

  // Add coastal palm islets along the sides
  const palmCrowns = [];
  const isletConfigs = [
    { x: -24, z: -22, s: 1.15 },
    { x: -32, z: -88, s: 1.35 },
    { x: 25, z: -120, s: 1.1 },
    { x: -20, z: -158, s: 1.0 }
  ];
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xe8c996, roughness: 0.92 });
  for (const cfg of isletConfigs) {
    const islet = new THREE.Group();
    islet.position.set(cfg.x, -2.2, cfg.z);
    const mound = new THREE.Mesh(new THREE.SphereGeometry(4.8, 16, 10), sandMat);
    mound.scale.set(1.3, 0.36, 1.1);
    islet.add(mound);
    const p1 = buildPalmTree(cfg.s);
    p1.palm.position.set(-0.6, 0.9, 0);
    const p2 = buildPalmTree(cfg.s * 0.78);
    p2.palm.position.set(1.2, 0.8, 0.8);
    p2.palm.rotation.y = 2.1;
    islet.add(p1.palm, p2.palm);
    palmCrowns.push(p1.crown, p2.crown);
    worldGroup.add(islet);
    scrollingProps.push({ obj: islet, bobAmp: 0, phase: 0, speedScale: 0.85 });
  }

  // Bobbing Ocean Buoys
  const buoyRedMat = new THREE.MeshStandardMaterial({ color: 0xe63946, roughness: 0.45 });
  const buoyWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const buoy = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.7, 12), buoyRedMat);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 0.42, 12), buoyWhiteMat);
    stripe.position.y = 0.52;
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, emissiveIntensity: 1.2 })
    );
    beacon.position.y = 1.05;
    buoy.add(base, stripe, beacon);

    const side = i % 2 === 0 ? -1 : 1;
    buoy.position.set(side * (7.5 + (i % 3) * 4.5), -1.85, 20 - i * 32);
    worldGroup.add(buoy);
    scrollingProps.push({ obj: buoy, bobAmp: 0.22, phase: i * 1.4, baseY: -1.85, speedScale: 1.0 });
  }

  // Distant Sailboats
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.6, side: THREE.DoubleSide });
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1d4e6e, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 3.8), hullMat);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.8, 8), timberMat);
    mast.position.y = 2.4;
    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 0);
    sailShape.lineTo(0, 4.1);
    sailShape.quadraticCurveTo(1.5, 2.2, 2.4, 0.2);
    sailShape.closePath();
    const sail = new THREE.Mesh(new THREE.ShapeGeometry(sailShape), sailMat);
    sail.rotation.y = Math.PI / 2;
    sail.position.set(0.05, 0.55, 0.2);
    boat.add(hull, mast, sail);

    const side = i % 2 === 0 ? -1 : 1;
    boat.position.set(side * (26 + i * 11), -1.8, -10 - i * 44);
    boat.rotation.y = side * 0.4;
    worldGroup.add(boat);
    scrollingProps.push({ obj: boat, bobAmp: 0.18, phase: i * 2.1, baseY: -1.8, speedScale: 0.55 });
  }

  // 5. Fluffy Sculpted Coastal Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    roughness: 0.95,
    metalness: 0.0
  });
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + (i % 3);
    for (let p = 0; p < puffs; p++) {
      const r = 3.2 + Math.sin(p * 1.9 + i) * 1.2;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
      puff.position.set((p - (puffs - 1) * 0.5) * 3.4, Math.abs(p - 1) * -0.5, (p % 2) * 1.2);
      puff.scale.set(1.25, 0.68, 0.95);
      cloud.add(puff);
    }
    const angle = (i / 16) * Math.PI * 2;
    const dist = 68 + (i % 4) * 24;
    cloud.position.set(Math.cos(angle) * dist, 24 + (i % 3) * 9, Math.sin(angle) * dist - 20);
    worldGroup.add(cloud);
    clouds.push({ obj: cloud, speed: 0.4 + (i % 4) * 0.25 });
  }

  // 6. Flocking Animated Seagulls Overhead!
  const gullMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const gullTipMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const seagulls = [];
  for (let i = 0; i < 9; i++) {
    const gull = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), gullMat);
    body.scale.set(0.6, 0.55, 1.9);
    gull.add(body);

    const wL = new THREE.Group();
    const wLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.22), gullMat);
    wLMesh.position.x = -0.31;
    const wLTip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.028, 0.16), gullTipMat);
    wLTip.position.x = -0.72;
    wL.add(wLMesh, wLTip);

    const wR = new THREE.Group();
    const wRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.22), gullMat);
    wRMesh.position.x = 0.31;
    const wRTip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.028, 0.16), gullTipMat);
    wRTip.position.x = 0.72;
    wR.add(wRMesh, wRTip);

    gull.add(wL, wR);
    worldGroup.add(gull);
    seagulls.push({
      obj: gull,
      wL,
      wR,
      orbitRadius: 9 + (i % 4) * 5.5,
      height: 5.5 + (i % 3) * 2.8,
      angle: (i / 9) * Math.PI * 2,
      speed: 0.32 + (i % 3) * 0.11,
      zOff: -14 - (i % 4) * 9,
      flapSpeed: 5.5 + (i % 3) * 1.4,
      startleBoost: 0
    });
  }

  function startleSeagulls() {
    for (const g of seagulls) {
      g.startleBoost = 1.0;
    }
  }

  // 7. Interactive Leaping Silver Fish & Splash / Sparkle Particle System!
  const fishGroup = new THREE.Group();
  const silverFishMat = new THREE.MeshStandardMaterial({
    color: 0xe2f1ff,
    metalness: 0.9,
    roughness: 0.14,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.22
  });
  const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 12), silverFishMat);
  fBody.scale.set(0.45, 0.72, 2.35);
  const fTail = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.14, 4), silverFishMat);
  fTail.rotation.x = -Math.PI / 2;
  fTail.position.z = -0.20;
  fTail.scale.set(0.32, 1, 1);
  fishGroup.add(fBody, fTail);
  fishGroup.visible = false;
  worldGroup.add(fishGroup);

  // Reusable burst particles for ocean splash & catch sparkles
  const burstParticles = [];
  const pGeo = new THREE.SphereGeometry(0.055, 6, 6);
  for (let i = 0; i < 36; i++) {
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(pGeo, pMat);
    mesh.visible = false;
    worldGroup.add(mesh);
    burstParticles.push({ mesh, vel: new THREE.Vector3(), life: 0, maxLife: 0.8 });
  }

  function spawnBurst(origin, colorHex, count = 18, power = 3.2) {
    let spawned = 0;
    for (const p of burstParticles) {
      if (p.life <= 0) {
        p.mesh.position.copy(origin);
        p.mesh.material.color.setHex(colorHex);
        p.mesh.visible = true;
        p.vel.set(
          (Math.random() - 0.5) * power,
          Math.random() * power * 1.15 + 0.8,
          (Math.random() - 0.5) * power
        );
        p.maxLife = 0.55 + Math.random() * 0.4;
        p.life = p.maxLife;
        spawned++;
        if (spawned >= count) break;
      }
    }
  }

  let activeFish = null;
  const fishStart = new THREE.Vector3();
  const fishCtrl = new THREE.Vector3();

  function launchFish(bikeX) {
    if (activeFish) return false;
    const side = Math.random() > 0.5 ? 1 : -1;
    fishStart.set(side * (4.6 + Math.random() * 1.6), -1.8, -4.5);
    fishCtrl.set(side * 2.2 + bikeX * 0.4, 3.6, -2.0);
    activeFish = { progress: 0, duration: 1.05 };
    fishGroup.visible = true;
    fishGroup.position.copy(fishStart);
    spawnBurst(fishStart, 0x99f6e4, 16, 3.8);
    return true;
  }

  // 8. Ambient Sun-Mote Particles & Turbo Speed-Lines!
  const moteCount = 90;
  const motePositions = new Float32Array(moteCount * 3);
  for (let i = 0; i < moteCount; i++) {
    motePositions[i * 3] = (Math.random() - 0.5) * 18;
    motePositions[i * 3 + 1] = 0.4 + Math.random() * 6.5;
    motePositions[i * 3 + 2] = 10 - Math.random() * 55;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({
    map: glowSpriteTex,
    color: 0xffe4a8,
    size: 0.24,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  worldGroup.add(motes);

  // Turbo Boost Speed-Lines
  const speedLines = [];
  const lineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const lineGeo = new THREE.BoxGeometry(0.018, 0.018, 2.2);
  for (let i = 0; i < 24; i++) {
    const l = new THREE.Mesh(lineGeo, lineMat);
    l.position.set(
      (Math.random() - 0.5) * 8.5,
      0.5 + Math.random() * 3.6,
      -20 + Math.random() * 32
    );
    worldGroup.add(l);
    speedLines.push(l);
  }

  let totalScroll = 0;
  const tmpFishPos = new THREE.Vector3();
  const tmpNextPos = new THREE.Vector3();

  function update(dt, time, speedMps, nightFactor, turboActive, mouthWorldPos, onFishCaught) {
    const dz = speedMps * dt;
    totalScroll += dz;

    // Update sky & ocean shaders
    sky.uniforms.uTime.value = time;
    ocean.uniforms.uTime.value = time;
    ocean.uniforms.uScrollZ.value = totalScroll;

    // Scroll boardwalk pier segments seamlessly
    for (const seg of segments) {
      seg.position.z += dz;
      if (seg.position.z > 48 + SEG_LEN * 0.5) {
        seg.position.z -= TOTAL_LEN;
      }
    }

    // Scroll coastal islets, buoys, sailboats
    for (const p of scrollingProps) {
      p.obj.position.z += dz * p.speedScale;
      if (p.obj.position.z > 46) {
        p.obj.position.z -= 210;
      }
      if (p.bobAmp > 0) {
        p.obj.position.y = p.baseY + Math.sin(time * 2.1 + p.phase) * p.bobAmp;
        p.obj.rotation.z = Math.cos(time * 1.7 + p.phase) * 0.08;
      }
    }

    // Sway palm fronds in sea breeze
    for (let i = 0; i < palmCrowns.length; i++) {
      palmCrowns[i].rotation.z = Math.sin(time * 1.8 + i) * 0.07;
      palmCrowns[i].rotation.x = Math.cos(time * 1.4 + i) * 0.05;
    }

    // Rotate lighthouse volumetric beacon beam!
    lhBeamPivot.rotation.y = time * 0.65;
    lhBeamMat.opacity = 0.08 + nightFactor * 0.24;
    lhGlassMat.emissiveIntensity = 1.0 + nightFactor * 2.5;

    // Streetlamp glow intensity at sunset / night
    const lampGlow = THREE.MathUtils.smoothstep(nightFactor, 0.2, 0.88);
    lanternGlassMat.emissiveIntensity = 0.2 + lampGlow * 3.0;
    for (const sp of lanternGlowSprites) {
      sp.material.opacity = 0.08 + lampGlow * 0.72;
    }

    // Drift clouds gently
    for (const c of clouds) {
      c.obj.position.x += c.speed * dt;
      if (c.obj.position.x > 130) c.obj.position.x = -130;
    }

    // Animate circling seagulls
    for (const g of seagulls) {
      g.angle += g.speed * dt * (1 + g.startleBoost * 1.8);
      g.startleBoost = Math.max(0, g.startleBoost - dt * 0.65);
      const lift = g.startleBoost * 3.5;
      const x = Math.cos(g.angle) * g.orbitRadius;
      const z = g.zOff + Math.sin(g.angle) * (g.orbitRadius * 0.6);
      const y = g.height + lift + Math.sin(time * 1.6 + g.angle) * 0.65;
      g.obj.position.set(x, y, z);
      g.obj.rotation.y = -g.angle;
      const flap = Math.sin(time * g.flapSpeed * (1 + g.startleBoost * 1.4) + g.angle) * 0.48;
      g.wL.rotation.z = flap;
      g.wR.rotation.z = -flap;
    }

    // Update interactive leaping silver fish along Quadratic Bezier arc straight to Pelican's mouth!
    let fishLookTarget = null;
    if (activeFish) {
      activeFish.progress += dt / activeFish.duration;
      const t = Math.min(1, activeFish.progress);
      const u = 1 - t;
      tmpFishPos.set(
        u * u * fishStart.x + 2 * u * t * fishCtrl.x + t * t * mouthWorldPos.x,
        u * u * fishStart.y + 2 * u * t * fishCtrl.y + t * t * mouthWorldPos.y,
        u * u * fishStart.z + 2 * u * t * fishCtrl.z + t * t * mouthWorldPos.z
      );
      fishGroup.position.copy(tmpFishPos);

      // Orient fish nose along its trajectory tangent + energetic wriggle
      const t2 = Math.min(1, t + 0.04);
      const u2 = 1 - t2;
      tmpNextPos.set(
        u2 * u2 * fishStart.x + 2 * u2 * t2 * fishCtrl.x + t2 * t2 * mouthWorldPos.x,
        u2 * u2 * fishStart.y + 2 * u2 * t2 * fishCtrl.y + t2 * t2 * mouthWorldPos.y,
        u2 * u2 * fishStart.z + 2 * u2 * t2 * fishCtrl.z + t2 * t2 * mouthWorldPos.z
      );
      fishGroup.lookAt(tmpNextPos);
      fTail.rotation.y = Math.sin(time * 28) * 0.45;
      fishLookTarget = tmpFishPos;

      if (t >= 1) {
        activeFish = null;
        fishGroup.visible = false;
        spawnBurst(mouthWorldPos, 0xfde047, 16, 2.5);
        if (onFishCaught) onFishCaught();
      }
    }

    // Update splash & catch sparkle particles
    for (const p of burstParticles) {
      if (p.life > 0) {
        p.life -= dt;
        p.vel.y -= 9.5 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        const alpha = Math.max(0, p.life / p.maxLife);
        p.mesh.material.opacity = alpha;
        p.mesh.scale.setScalar(0.5 + alpha * 0.8);
        if (p.life <= 0) p.mesh.visible = false;
      }
    }

    // Drift ambient sea-mist bokeh motes
    const posArr = moteGeo.attributes.position.array;
    for (let i = 0; i < moteCount; i++) {
      posArr[i * 3 + 2] += dz * 0.75 + 0.5 * dt;
      posArr[i * 3 + 1] += Math.sin(time * 1.4 + i) * 0.004;
      if (posArr[i * 3 + 2] > 12) {
        posArr[i * 3 + 2] = -46;
        posArr[i * 3] = (Math.random() - 0.5) * 18;
      }
    }
    moteGeo.attributes.position.needsUpdate = true;

    // Turbo speed-lines
    const targetLineOp = turboActive ? 0.45 : 0.0;
    lineMat.opacity = THREE.MathUtils.lerp(lineMat.opacity, targetLineOp, Math.min(1, dt * 8));
    if (lineMat.opacity > 0.01) {
      for (const l of speedLines) {
        l.position.z += (speedMps * 2.8 + 18) * dt;
        if (l.position.z > 10) {
          l.position.z = -24 - Math.random() * 12;
          l.position.x = (Math.random() - 0.5) * 8.5;
          l.position.y = 0.5 + Math.random() * 3.6;
        }
      }
    }

    return fishLookTarget;
  }

  return {
    sky,
    ocean,
    cloudMat,
    moteMat,
    update,
    launchFish,
    startleSeagulls
  };
}
