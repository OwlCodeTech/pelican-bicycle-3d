import * as THREE from 'three';
import { createFeatherTexture } from './textures.js';

/**
 * Exact 2-Bone Analytical Inverse Kinematics Solver (Sagittal plane + slight outward knee flair)
 * Computes knee joint position between hip and ankle so webbed feet stay 100% locked to pedals!
 */
function solveTwoBoneIK(hip, ankle, L1, L2, forwardBendSign, outX) {
  const dir = new THREE.Vector3().subVectors(ankle, hip);
  let dist = dir.length();
  const maxReach = (L1 + L2) * 0.992;
  const minReach = Math.abs(L1 - L2) + 0.02;
  dist = THREE.MathUtils.clamp(dist, minReach, maxReach);
  dir.normalize();

  // Law of cosines for angle at hip
  const cosAlpha = THREE.MathUtils.clamp((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist), -1, 1);
  const sinAlpha = Math.sqrt(Math.max(0, 1 - cosAlpha * cosAlpha));

  // Knee bends forward (-Z) and slightly outward
  const bendRef = new THREE.Vector3(outX * 0.25, 0, forwardBendSign);
  // Gram-Schmidt orthogonalize bendRef against dir
  const ortho = bendRef.sub(dir.clone().multiplyScalar(bendRef.dot(dir))).normalize();

  return hip.clone()
    .addScaledVector(dir, L1 * cosAlpha)
    .addScaledVector(ortho, L1 * sinAlpha);
}

/**
 * Expressive, Anatomically Sculpted 3D Articulated Pelican
 * Matches our "PELICAN CYCLE CLUB" art direction:
 * - Layered plumage body & fanned dark-tipped tail feathers
 * - 2-bone analytical IK orange legs & 3-toed webbed feet locked to the bicycle pedals
 * - Flowing crimson silk scarf waving dynamically in the sea breeze
 * - Vintage brass aviator goggles perched on brow
 * - Hinged giant pelican beak & elastic orange gular pouch that catches & gulps silver fish!
 * - Multi-feather wings that grip handlebars while steering and unfurl wide during wheelie/turbo!
 */
export function createPelican() {
  const group = new THREE.Group(); // Attached directly to bikeBody!

  const { map: featherMap, bumpMap: featherBump } = createFeatherTexture();

  // === Materials ===
  const plumageMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf2,
    map: featherMap,
    bumpMap: featherBump,
    bumpScale: 0.012,
    roughness: 0.72,
    metalness: 0.02
  });

  const creamBellyMat = new THREE.MeshStandardMaterial({
    color: 0xfef1d8,
    roughness: 0.78
  });

  const slateFeatherMat = new THREE.MeshStandardMaterial({
    color: 0x3b4754,
    roughness: 0.68
  });

  const beakUpperMat = new THREE.MeshPhysicalMaterial({
    color: 0xf7b955,
    roughness: 0.34,
    clearcoat: 0.45,
    clearcoatRoughness: 0.25
  });

  const pouchMat = new THREE.MeshPhysicalMaterial({
    color: 0xf28c28,
    roughness: 0.42,
    sheen: 0.45,
    sheenColor: new THREE.Color(0xffd08a)
  });

  const legOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf07d22,
    roughness: 0.56
  });

  const scarfMat = new THREE.MeshStandardMaterial({
    color: 0xd9382e,
    roughness: 0.58,
    side: THREE.DoubleSide
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xdca542,
    metalness: 0.85,
    roughness: 0.25
  });

  const goggleStrapMat = new THREE.MeshStandardMaterial({
    color: 0x5c361d,
    roughness: 0.75
  });

  const goggleLensMat = new THREE.MeshPhysicalMaterial({
    color: 0x52c4cc,
    metalness: 0.15,
    roughness: 0.08,
    clearcoat: 1.0,
    transmission: 0.28,
    transparent: true,
    opacity: 0.9
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: 0.2 });
  const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.08, metalness: 0.2 });

  // === Pelvis / Torso Root (sits squarely on bike saddle at y=0.94, z=0.27) ===
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, 1.04, 0.24);
  group.add(torsoPivot);

  // Plump sculpted teardrop body using LatheGeometry
  const bodyPoints = [
    new THREE.Vector2(0.0, -0.20),
    new THREE.Vector2(0.14, -0.17),
    new THREE.Vector2(0.22, -0.07),
    new THREE.Vector2(0.24, 0.06),
    new THREE.Vector2(0.21, 0.19),
    new THREE.Vector2(0.14, 0.28),
    new THREE.Vector2(0.06, 0.33),
    new THREE.Vector2(0.0, 0.34)
  ];
  const bodyGeo = new THREE.LatheGeometry(bodyPoints, 26);
  bodyGeo.scale(0.92, 1.05, 1.24);
  const bodyMesh = new THREE.Mesh(bodyGeo, plumageMat);
  bodyMesh.position.set(0, 0.09, -0.02);
  bodyMesh.rotation.x = 0.28; // Slight sporty forward cycling lean!
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  torsoPivot.add(bodyMesh);

  // Warm cream chest patch
  const chestGeo = new THREE.SphereGeometry(0.18, 18, 14);
  chestGeo.scale(0.86, 1.05, 0.72);
  const chestMesh = new THREE.Mesh(chestGeo, creamBellyMat);
  chestMesh.position.set(0, 0.12, -0.18);
  torsoPivot.add(chestMesh);

  // Fanned Layered Tail Feathers
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.03, 0.26);
  torsoPivot.add(tailGroup);

  for (let i = -2; i <= 2; i++) {
    const fGeo = new THREE.SphereGeometry(0.048, 10, 8);
    fGeo.scale(0.65, 0.22, 2.5);
    const fMat = Math.abs(i) === 2 ? slateFeatherMat : plumageMat;
    const feather = new THREE.Mesh(fGeo, fMat);
    feather.position.set(i * 0.042, Math.abs(i) * -0.008, 0.08);
    feather.rotation.y = -i * 0.16;
    feather.rotation.x = 0.24;
    feather.castShadow = true;
    tailGroup.add(feather);
  }

  // === Flowing Crimson Red Silk Scarf ===
  // Neck collar loop
  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.034, 12, 24), scarfMat);
  scarfCollar.rotation.x = Math.PI / 2 + 0.18;
  scarfCollar.position.set(0, 0.36, -0.12);
  scarfCollar.castShadow = true;
  torsoPivot.add(scarfCollar);

  // Two trailing scarf ribbons with vertex-animated flutter!
  function buildScarfRibbon(width, length, yOff, xOff) {
    const segs = 16;
    const geo = new THREE.PlaneGeometry(length, width, segs, 2);
    // Shift so x=0 is attached at collar and extends toward +Z (behind pelican)
    geo.rotateY(-Math.PI / 2);
    geo.translate(xOff, yOff, length * 0.5);
    const mesh = new THREE.Mesh(geo, scarfMat);
    mesh.position.set(0, 0.35, -0.05);
    mesh.castShadow = true;
    torsoPivot.add(mesh);
    return { mesh, basePos: geo.attributes.position.array.slice(), length };
  }
  const ribbonMain = buildScarfRibbon(0.095, 0.64, 0.01, -0.02);
  const ribbonSub = buildScarfRibbon(0.072, 0.50, -0.035, 0.03);

  // === Graceful S-Curve Neck & Expressive Head ===
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0, 0.36, -0.11);
  torsoPivot.add(neckPivot);

  // Sculpted S-curve neck
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.02, 0.02),
    new THREE.Vector3(0, 0.11, 0.04),
    new THREE.Vector3(0, 0.24, -0.01),
    new THREE.Vector3(0, 0.35, -0.06)
  ]);
  const neckMesh = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 18, 0.078, 14, false), plumageMat);
  neckMesh.castShadow = true;
  neckPivot.add(neckMesh);

  // Head pivot at top of neck
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.36, -0.07);
  neckPivot.add(headPivot);

  // Sculpted cranium
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 22, 18), plumageMat);
  headMesh.scale.set(0.95, 0.96, 1.12);
  headMesh.castShadow = true;
  headPivot.add(headMesh);

  // Fluffy head crest tufts
  for (let i = 0; i < 3; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.09, 8), plumageMat);
    tuft.position.set((i - 1) * 0.022, 0.105 - i * 0.01, 0.06 + i * 0.02);
    tuft.rotation.x = -0.75 - i * 0.18;
    headPivot.add(tuft);
  }

  // Expressive Eyes with Animated Eyelids
  const eyelids = [];
  for (const sx of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(sx * 0.088, 0.028, -0.062);
    headPivot.add(eyeGroup);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 12), eyeWhiteMat);
    eyeGroup.add(sclera);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 10), eyePupilMat);
    pupil.position.set(sx * 0.012, 0.002, -0.02);
    eyeGroup.add(pupil);

    // Specular catchlight dot
    const catchlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    catchlight.position.set(sx * 0.018, 0.012, -0.033);
    eyeGroup.add(catchlight);

    // Upper eyelid dome (rotates down to blink!)
    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(0.0355, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      plumageMat
    );
    lid.rotation.x = -0.95; // open
    eyeGroup.add(lid);
    eyelids.push(lid);
  }

  // === Vintage Brass Aviator Goggles perched on Forehead (Matches Poster!) ===
  const gogglesGroup = new THREE.Group();
  gogglesGroup.position.set(0, 0.085, -0.045);
  gogglesGroup.rotation.x = -0.35;
  headPivot.add(gogglesGroup);

  // Leather strap wrapping around back of head
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.014, 8, 24), goggleStrapMat);
  strap.rotation.x = Math.PI / 2;
  strap.position.set(0, -0.01, 0.048);
  strap.scale.set(0.95, 1.06, 1);
  gogglesGroup.add(strap);

  // Twin brass goggle cups & tinted lenses
  for (const sx of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(sx * 0.056, 0.005, -0.068);
    cup.rotation.y = -sx * 0.28;

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.009, 10, 20), brassMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.044, 0.028, 18), brassMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.012;

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 18), goggleLensMat);
    lens.position.z = -0.004;
    lens.rotation.y = Math.PI;

    cup.add(rim, barrel, lens);
    gogglesGroup.add(cup);
  }
  // Center nose bridge
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.014, 0.014), goggleStrapMat);
  bridge.position.set(0, 0.005, -0.075);
  gogglesGroup.add(bridge);

  // === Iconic Giant Pelican Beak & Elastic Expandable Gular Pouch ===
  // Upper mandible: long gracefully tapered golden bill with hooked tip
  const upperBillGroup = new THREE.Group();
  upperBillGroup.position.set(0, 0.015, -0.095);
  headPivot.add(upperBillGroup);

  const upperBillGeo = new THREE.ConeGeometry(0.076, 0.44, 16);
  upperBillGeo.rotateX(-Math.PI / 2);
  upperBillGeo.scale(0.88, 0.42, 1.0);
  const upperBill = new THREE.Mesh(upperBillGeo, beakUpperMat);
  upperBill.position.set(0, 0.01, -0.20);
  upperBill.castShadow = true;
  upperBillGroup.add(upperBill);

  // Ridge highlight along upper bill + hooked tip (unguis)
  const billHook = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.045, 10), legOrangeMat);
  billHook.position.set(0, -0.008, -0.415);
  billHook.rotation.x = Math.PI - 0.3;
  upperBillGroup.add(billHook);

  // Hinged Lower Jaw + Elastic Orange Throat Pouch!
  const lowerJawPivot = new THREE.Group();
  lowerJawPivot.position.set(0, -0.015, -0.09);
  headPivot.add(lowerJawPivot);

  // Lower mandible rim
  const lowerRimGeo = new THREE.ConeGeometry(0.068, 0.41, 14);
  lowerRimGeo.rotateX(-Math.PI / 2);
  lowerRimGeo.scale(0.84, 0.22, 1.0);
  const lowerRim = new THREE.Mesh(lowerRimGeo, beakUpperMat);
  lowerRim.position.set(0, -0.005, -0.185);
  lowerJawPivot.add(lowerRim);

  // Sculpted Gular Pouch hanging generously below the lower bill
  const pouchGeo = new THREE.SphereGeometry(0.11, 20, 16);
  pouchGeo.scale(0.68, 0.85, 1.85);
  const pouchMesh = new THREE.Mesh(pouchGeo, pouchMat);
  pouchMesh.position.set(0, -0.068, -0.16);
  pouchMesh.castShadow = true;
  lowerJawPivot.add(pouchMesh);

  // Target anchor inside open mouth so leaping fish fly straight into the beak!
  const mouthTarget = new THREE.Object3D();
  mouthTarget.position.set(0, -0.01, -0.25);
  headPivot.add(mouthTarget);

  // === Articulated Multi-Feather Wings (Grip Handlebars OR Spread & Flap!) ===
  function buildWing(side) {
    const shoulder = new THREE.Group();
    shoulder.rotation.order = 'YXZ';
    shoulder.position.set(side * 0.195, 0.25, -0.06);
    torsoPivot.add(shoulder);

    // Upper wing covert
    const upperGeo = new THREE.SphereGeometry(0.11, 14, 12);
    upperGeo.scale(0.62, 0.88, 1.95);
    const upperMesh = new THREE.Mesh(upperGeo, plumageMat);
    upperMesh.position.set(side * 0.04, -0.03, -0.14);
    upperMesh.castShadow = true;
    shoulder.add(upperMesh);

    // Forearm pivot
    const forearm = new THREE.Group();
    forearm.position.set(side * 0.06, -0.04, -0.25);
    shoulder.add(forearm);

    const foreGeo = new THREE.SphereGeometry(0.085, 14, 10);
    foreGeo.scale(0.55, 0.72, 1.9);
    const foreMesh = new THREE.Mesh(foreGeo, plumageMat);
    foreMesh.position.set(0, 0, -0.11);
    foreMesh.castShadow = true;
    forearm.add(foreMesh);

    // Layered primary flight feathers (dark charcoal tips!) that fan out when gliding/flapping
    const primaries = [];
    for (let f = 0; f < 5; f++) {
      const fGeo = new THREE.SphereGeometry(0.036, 10, 8);
      fGeo.scale(0.32, 0.85, 2.9 - f * 0.22);
      const feather = new THREE.Mesh(fGeo, f >= 2 ? slateFeatherMat : plumageMat);
      feather.position.set(side * (0.012 + f * 0.008), -0.015 - f * 0.012, -0.16 - f * 0.015);
      feather.castShadow = true;
      forearm.add(feather);
      primaries.push(feather);
    }

    return { shoulder, forearm, primaries, side };
  }

  const leftWing = buildWing(-1);
  const rightWing = buildWing(1);

  // === 2-Bone Analytical IK Legs & 3-Toed Webbed Feet ===
  const THIGH_LEN = 0.29;
  const SHIN_LEN = 0.34;
  const HIP_LEFT_BASE = new THREE.Vector3(-0.115, 0.90, 0.22);
  const HIP_RIGHT_BASE = new THREE.Vector3(0.115, 0.90, 0.22);

  function buildLeg(side) {
    const legGroup = new THREE.Group();
    group.add(legGroup);

    // Feathered drumstick / upper hip puff
    const puff = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), plumageMat);
    puff.scale.set(0.85, 1.1, 1.0);
    legGroup.add(puff);

    // Thigh cylinder
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.019, THIGH_LEN, 10), legOrangeMat);
    thigh.castShadow = true;
    legGroup.add(thigh);

    // Knee joint sphere
    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), legOrangeMat);
    legGroup.add(kneeCap);

    // Shin / tarsus cylinder
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.015, SHIN_LEN, 10), legOrangeMat);
    shin.castShadow = true;
    legGroup.add(shin);

    // Webbed 3-Toed Pelican Foot!
    const foot = new THREE.Group();
    const ankleBall = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), legOrangeMat);
    foot.add(ankleBall);

    // Webbed triangle fan
    const webShape = new THREE.Shape();
    webShape.moveTo(0, 0.02);
    webShape.lineTo(-0.068, -0.105);
    webShape.quadraticCurveTo(-0.032, -0.088, 0, -0.118);
    webShape.quadraticCurveTo(0.032, -0.088, 0.068, -0.105);
    webShape.lineTo(0, 0.02);

    const webGeo = new THREE.ExtrudeGeometry(webShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
    webGeo.rotateX(Math.PI / 2);
    const webMesh = new THREE.Mesh(webGeo, legOrangeMat);
    webMesh.position.set(0, 0.004, 0.02);
    webMesh.castShadow = true;
    foot.add(webMesh);

    // 3 distinct orange toe ridges
    for (const ang of [-0.46, 0, 0.46]) {
      const toe = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.115, 6), legOrangeMat);
      toe.rotation.x = Math.PI / 2;
      toe.rotation.z = ang;
      toe.position.set(Math.sin(-ang) * 0.052, 0.002, -Math.cos(ang) * 0.048);
      foot.add(toe);
    }

    legGroup.add(foot);
    return { puff, thigh, kneeCap, shin, foot, side };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  const upVec = new THREE.Vector3(0, 1, 0);
  const tmpDir = new THREE.Vector3();

  function placeLimbSegment(mesh, a, b) {
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    tmpDir.subVectors(b, a);
    const len = tmpDir.length();
    mesh.scale.set(1, len / mesh.geometry.parameters.height, 1);
    mesh.quaternion.setFromUnitVectors(upVec, tmpDir.normalize());
  }

  // === Animation State ===
  let blinkTimer = 2.4;
  let blinkProgress = 0;
  let squawkTimer = 0;
  let gulpTimer = 0;
  let pouchBounce = 0;
  let flapBlend = 0;
  let flapPhase = 0;
  let headLookTarget = null;

  function triggerSquawk() {
    squawkTimer = 0.65;
  }

  function triggerGulp() {
    gulpTimer = 1.15;
    pouchBounce = 1.0;
  }

  function setFishTarget(worldPosOrNull) {
    headLookTarget = worldPosOrNull;
  }

  function getMouthWorldPosition(outVec) {
    mouthTarget.getWorldPosition(outVec);
    return outVec;
  }

  const hipL = new THREE.Vector3();
  const hipR = new THREE.Vector3();
  const invTorsoMat = new THREE.Matrix4();
  const localGripL = new THREE.Vector3();
  const localGripR = new THREE.Vector3();

  function update(dt, time, crankAngle, speedMps, pedalPositions, gripPositions, steerAngle, turboActive, wheelieAmount) {
    // 1. Torso cadence bob, subtle hip-rock & speed crouch
    const pedalingRock = Math.sin(crankAngle) * 0.045;
    const pedalingBob = Math.abs(Math.cos(crankAngle)) * 0.018;
    const turboCrouch = turboActive ? 0.14 : 0;

    torsoPivot.position.y = 1.03 + pedalingBob - turboCrouch * 0.15;
    torsoPivot.rotation.z = pedalingRock - steerAngle * 0.12;
    torsoPivot.rotation.x = turboCrouch - wheelieAmount * 0.25;
    torsoPivot.rotation.y = steerAngle * 0.22;

    // Tail feather playful wag
    tailGroup.rotation.x = Math.sin(time * 5 + crankAngle) * 0.07;
    tailGroup.rotation.y = Math.cos(crankAngle) * 0.08;

    // 2. Solve Exact 2-Bone Analytical IK for Both Legs!
    hipL.copy(HIP_LEFT_BASE);
    hipR.copy(HIP_RIGHT_BASE);
    hipL.y += pedalingBob - pedalingRock * 0.15;
    hipR.y += pedalingBob + pedalingRock * 0.15;

    const ankleL = pedalPositions.left.clone().add(new THREE.Vector3(0, 0.022, 0.02));
    const ankleR = pedalPositions.right.clone().add(new THREE.Vector3(0, 0.022, 0.02));

    const kneeL = solveTwoBoneIK(hipL, ankleL, THIGH_LEN, SHIN_LEN, -1, -1);
    const kneeR = solveTwoBoneIK(hipR, ankleR, THIGH_LEN, SHIN_LEN, -1, 1);

    // Position left leg
    leftLeg.puff.position.copy(hipL);
    placeLimbSegment(leftLeg.thigh, hipL, kneeL);
    leftLeg.kneeCap.position.copy(kneeL);
    placeLimbSegment(leftLeg.shin, kneeL, ankleL);
    leftLeg.foot.position.copy(ankleL);
    // Keep webbed foot planted nearly flat on the pedal with slight natural ankle flex
    leftLeg.foot.rotation.x = Math.sin(crankAngle) * 0.16;

    // Position right leg
    rightLeg.puff.position.copy(hipR);
    placeLimbSegment(rightLeg.thigh, hipR, kneeR);
    rightLeg.kneeCap.position.copy(kneeR);
    placeLimbSegment(rightLeg.shin, kneeR, ankleR);
    rightLeg.foot.position.copy(ankleR);
    rightLeg.foot.rotation.x = -Math.sin(crankAngle) * 0.16;

    // 3. Wings: Blend smoothly between Holding Handlebars and Joyful Wing Flap / Glide!
    const wantsFlap = wheelieAmount > 0.12 || turboActive;
    flapBlend = THREE.MathUtils.lerp(flapBlend, wantsFlap ? 1 : 0, Math.min(1, dt * 6));
    if (flapBlend > 0.01) {
      flapPhase += dt * (turboActive ? 14 : 10);
    }

    torsoPivot.updateMatrixWorld(true);
    invTorsoMat.copy(torsoPivot.matrixWorld).invert();
    // Convert grip positions from bikeBody space -> torsoPivot space
    localGripL.copy(gripPositions.left).applyMatrix4(group.matrixWorld).applyMatrix4(invTorsoMat);
    localGripR.copy(gripPositions.right).applyMatrix4(group.matrixWorld).applyMatrix4(invTorsoMat);

    const updateWing = (wing, localGrip) => {
      const s = wing.side;
      // Steering grip pose: point wing shoulder toward handlebar grip
      const toGrip = localGrip.clone().sub(wing.shoulder.position);
      const gripYaw = Math.atan2(-toGrip.x, -toGrip.z);
      const gripPitch = Math.atan2(toGrip.y, Math.hypot(toGrip.x, toGrip.z));

      // Open flap/glide pose: spread wings wide outward and beat up & down!
      const beat = Math.sin(flapPhase) * 0.42;
      const openYaw = -s * 1.28;
      const openPitch = 0.25 + beat;
      const openRoll = s * (0.35 + beat * 0.7);

      wing.shoulder.rotation.y = THREE.MathUtils.lerp(gripYaw, openYaw, flapBlend);
      wing.shoulder.rotation.x = THREE.MathUtils.lerp(gripPitch, openPitch, flapBlend);
      wing.shoulder.rotation.z = THREE.MathUtils.lerp(s * 0.18, openRoll, flapBlend);

      // Forearm bends slightly when holding bars, straightens & fans feathers when flapping!
      wing.forearm.rotation.y = THREE.MathUtils.lerp(-s * 0.18, 0.0, flapBlend);
      wing.forearm.rotation.z = THREE.MathUtils.lerp(0, s * Math.cos(flapPhase) * 0.25, flapBlend);

      wing.primaries.forEach((f, idx) => {
        f.rotation.y = THREE.MathUtils.lerp(-s * 0.04 * idx, -s * (0.14 + idx * 0.11), flapBlend);
      });
    };
    updateWing(leftWing, localGripL);
    updateWing(rightWing, localGripR);

    // 4. Neck & Head Stabilization + Expressive Tracking
    neckPivot.rotation.x = -torsoPivot.rotation.x * 0.45 + (turboActive ? 0.18 : 0);
    neckPivot.rotation.z = -torsoPivot.rotation.z * 0.55;

    let targetHeadYaw = steerAngle * 0.55 + Math.sin(time * 0.85) * 0.08;
    let targetHeadPitch = -0.05 + Math.sin(time * 1.7) * 0.03;

    // If a flying fish is in mid-air, enthusiastically look up toward it and open beak wide!
    let fishJawOpen = 0;
    if (headLookTarget) {
      targetHeadYaw = THREE.MathUtils.clamp((headLookTarget.x - group.parent.position.x) * -0.18, -0.5, 0.5);
      targetHeadPitch = 0.26;
      fishJawOpen = 0.52;
    }

    headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, targetHeadYaw, Math.min(1, dt * 7));
    headPivot.rotation.x = THREE.MathUtils.lerp(headPivot.rotation.x, targetHeadPitch, Math.min(1, dt * 7));

    // 5. Blinking Eyelids
    blinkTimer -= dt;
    if (blinkTimer <= 0) {
      blinkProgress = 1.0;
      blinkTimer = 2.5 + Math.random() * 3.2;
    }
    if (blinkProgress > 0) {
      blinkProgress = Math.max(0, blinkProgress - dt * 6.5);
    }
    const blinkCurve = Math.sin(blinkProgress * Math.PI);
    const happySquint = gulpTimer > 0.3 ? 0.35 : 0;
    const lidRot = THREE.MathUtils.lerp(-0.95, 0.22, Math.max(blinkCurve, happySquint));
    eyelids[0].rotation.x = lidRot;
    eyelids[1].rotation.x = lidRot;

    // 6. Hinged Pelican Beak & Elastic Gular Pouch Physics!
    let jawOpen = fishJawOpen;
    if (squawkTimer > 0) {
      squawkTimer = Math.max(0, squawkTimer - dt);
      jawOpen = Math.max(jawOpen, Math.sin((squawkTimer / 0.65) * Math.PI) * 0.48);
    }
    if (gulpTimer > 0) {
      gulpTimer = Math.max(0, gulpTimer - dt);
      pouchBounce = gulpTimer / 1.15;
    } else {
      pouchBounce = Math.max(0, pouchBounce - dt * 2);
    }

    lowerJawPivot.rotation.x = THREE.MathUtils.lerp(lowerJawPivot.rotation.x, -jawOpen, Math.min(1, dt * 14));

    // Elastic pouch jiggle & swell after catching a fish!
    const swell = 1 + pouchBounce * 0.45 * Math.abs(Math.cos(time * 14)) + Math.sin(crankAngle * 2) * 0.03;
    pouchMesh.scale.set(
      1 + pouchBounce * 0.32,
      swell,
      1 + pouchBounce * 0.12
    );

    // 7. Flowing Red Silk Scarf Vertex Wave Animation!
    const windSpeed = 5.5 + speedMps * 1.45 + (turboActive ? 9 : 0);
    const animateRibbon = (rb, phaseOff) => {
      const pos = rb.mesh.geometry.attributes.position;
      const base = rb.basePos;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const bz = base[i * 3 + 2];
        const frac = THREE.MathUtils.clamp(bz / rb.length, 0, 1);
        const waveY = Math.sin(time * windSpeed - frac * 6.5 + phaseOff) * 0.065 * frac;
        const waveX = Math.cos(time * (windSpeed * 0.72) - frac * 5.0 + phaseOff) * 0.05 * frac;
        // Speed lifts scarf higher & straighter behind neck!
        const liftY = THREE.MathUtils.clamp(speedMps * 0.015, 0, 0.16) * frac - (1 - Math.min(1, speedMps / 4)) * 0.12 * frac;
        pos.setXYZ(i, bx + waveX - steerAngle * 0.14 * frac, by + waveY + liftY, bz);
      }
      pos.needsUpdate = true;
      rb.mesh.geometry.computeVertexNormals();
    };
    animateRibbon(ribbonMain, 0);
    animateRibbon(ribbonSub, 1.8);
  }

  return {
    group,
    update,
    triggerSquawk,
    triggerGulp,
    setFishTarget,
    getMouthWorldPosition
  };
}
