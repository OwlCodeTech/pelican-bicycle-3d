import * as THREE from 'three';
import { createWickerTexture } from './textures.js';

/**
 * Helper to create a cylinder connecting two 3D points
 */
function makeTubeBetween(p1, p2, radius, material, radialSegs = 12) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, radialSegs);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Museum-grade Vintage Seafoam-Teal Coastal Cruiser Bicycle
 * Forward = -Z, Up = +Y, Right = +X.
 * Rear tire touches ground at (0, 0, +0.62) in bikeBody coords, pivoted at wheeliePivot.
 */
export function createBicycle() {
  const root = new THREE.Group(); // Placed on boardwalk, handles steering lateral X and lean Z

  // Wheelie pivot located at exact rear tire ground contact point
  const wheeliePivot = new THREE.Group();
  wheeliePivot.position.set(0, 0, 0.62);
  root.add(wheeliePivot);

  // Bike body shifted back so all internal coordinates stay symmetric around (0, y, 0)
  const bikeBody = new THREE.Group();
  bikeBody.position.set(0, 0, -0.62);
  wheeliePivot.add(bikeBody);

  // Key mechanical dimensions
  const WHEEL_RADIUS = 0.38;
  const REAR_AXLE = new THREE.Vector3(0, WHEEL_RADIUS, 0.62);
  const FRONT_AXLE = new THREE.Vector3(0, WHEEL_RADIUS, -0.62);
  const BB_POS = new THREE.Vector3(0, 0.34, 0.08);
  const SEAT_TOP = new THREE.Vector3(0, 0.84, 0.25);
  const HEAD_TOP = new THREE.Vector3(0, 0.84, -0.42);
  const HEAD_BOT = new THREE.Vector3(0, 0.64, -0.49);
  const CRANK_RADIUS = 0.165;
  const PEDAL_X = 0.165;

  // === Materials ===
  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x2bb5a3, // Seafoam teal matching poster!
    metalness: 0.25,
    roughness: 0.2,
    clearcoat: 0.92,
    clearcoatRoughness: 0.12
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe8eef2,
    metalness: 0.92,
    roughness: 0.16
  });

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.78,
    roughness: 0.34
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xe6b450,
    metalness: 0.88,
    roughness: 0.22
  });

  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x7c4624,
    roughness: 0.62,
    metalness: 0.05
  });

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.84,
    metalness: 0.04
  });

  const whitewallMat = new THREE.MeshStandardMaterial({
    color: 0xf4eee0,
    roughness: 0.68,
    metalness: 0.02
  });

  // === Spoked Wheel Builder ===
  function buildWheel() {
    const wheel = new THREE.Group();

    // Rubber tire torus (outer radius ~0.38, tube ~0.036)
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.344, 0.036, 16, 48), tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    tire.receiveShadow = true;
    wheel.add(tire);

    // Classic cream whitewall rings on both sides
    for (const sx of [-1, 1]) {
      const ww = new THREE.Mesh(new THREE.TorusGeometry(0.328, 0.015, 10, 44), whitewallMat);
      ww.rotation.y = Math.PI / 2;
      ww.position.x = sx * 0.025;
      wheel.add(ww);
    }

    // Brushed aluminum rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.308, 0.014, 12, 44), chromeMat);
    rim.rotation.y = Math.PI / 2;
    wheel.add(rim);

    // Central hub & axle nuts
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.09, 16), chromeMat);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);

    const flangeGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.008, 16);
    for (const sx of [-0.03, 0.03]) {
      const fl = new THREE.Mesh(flangeGeo, chromeMat);
      fl.rotation.z = Math.PI / 2;
      fl.position.x = sx;
      wheel.add(fl);
    }

    // 24 Crossed stainless spokes
    const spokeCount = 24;
    const spokeGeo = new THREE.CylinderGeometry(0.0026, 0.0026, 0.30, 5);
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const side = i % 2 === 0 ? 1 : -1;
      const cross = (i % 4 < 2 ? 1 : -1) * 0.16;
      const spoke = new THREE.Mesh(spokeGeo, chromeMat);
      const midR = 0.162;
      const rimA = angle + cross;
      const pHub = new THREE.Vector3(side * 0.028, Math.cos(angle) * 0.036, Math.sin(angle) * 0.036);
      const pRim = new THREE.Vector3(0, Math.cos(rimA) * 0.302, Math.sin(rimA) * 0.302);
      spoke.position.copy(pHub).add(pRim).multiplyScalar(0.5);
      spoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pRim.clone().sub(pHub).normalize());
      wheel.add(spoke);
    }

    // Brass valve stem
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.032, 6), brassMat);
    valve.position.set(0, 0.285, 0);
    wheel.add(valve);

    return wheel;
  }

  // === Rear Wheel ===
  const rearWheel = buildWheel();
  rearWheel.position.copy(REAR_AXLE);
  bikeBody.add(rearWheel);

  // Rear sprocket/cog attached to rear wheel
  const rearCog = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.012, 16), darkMetalMat);
  rearCog.rotation.z = Math.PI / 2;
  rearCog.position.set(0.056, 0, 0);
  rearWheel.add(rearCog);

  // === Curved Step-Through Cruiser Frame ===
  // Head tube
  bikeBody.add(makeTubeBetween(HEAD_BOT, HEAD_TOP, 0.024, frameMat, 14));
  // Seat tube (BB to seat cluster)
  bikeBody.add(makeTubeBetween(BB_POS, SEAT_TOP, 0.02, frameMat, 14));

  // Graceful curved upper cruiser bar (head top -> curving gently down into seat tube)
  const topCurve = new THREE.CatmullRomCurve3([
    HEAD_TOP.clone().add(new THREE.Vector3(0, -0.04, 0.01)),
    new THREE.Vector3(0, 0.72, -0.22),
    new THREE.Vector3(0, 0.56, -0.02),
    new THREE.Vector3(0, 0.48, 0.14)
  ]);
  const topTube = new THREE.Mesh(new THREE.TubeGeometry(topCurve, 24, 0.018, 12, false), frameMat);
  topTube.castShadow = true;
  bikeBody.add(topTube);

  // Graceful curved lower cruiser down tube (head bot -> BB)
  const downCurve = new THREE.CatmullRomCurve3([
    HEAD_BOT.clone().add(new THREE.Vector3(0, 0.03, 0.01)),
    new THREE.Vector3(0, 0.52, -0.28),
    new THREE.Vector3(0, 0.38, -0.10),
    BB_POS.clone()
  ]);
  const downTube = new THREE.Mesh(new THREE.TubeGeometry(downCurve, 24, 0.02, 12, false), frameMat);
  downTube.castShadow = true;
  bikeBody.add(downTube);

  // Twin rear chain stays & seat stays (left & right around rear wheel)
  for (const sx of [-1, 1]) {
    const axleEnd = new THREE.Vector3(sx * 0.062, REAR_AXLE.y, REAR_AXLE.z);
    const bbSide = new THREE.Vector3(sx * 0.036, BB_POS.y, BB_POS.z);
    const seatSide = new THREE.Vector3(sx * 0.018, SEAT_TOP.y - 0.08, SEAT_TOP.z - 0.02);

    bikeBody.add(makeTubeBetween(bbSide, axleEnd, 0.012, frameMat, 10));

    // Gently arched seat stay
    const stayCurve = new THREE.CatmullRomCurve3([
      seatSide,
      new THREE.Vector3(sx * 0.048, 0.64, 0.44),
      axleEnd
    ]);
    const seatStay = new THREE.Mesh(new THREE.TubeGeometry(stayCurve, 16, 0.011, 8, false), frameMat);
    seatStay.castShadow = true;
    bikeBody.add(seatStay);
  }

  // Bottom bracket shell
  const bbShell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.10, 16), frameMat);
  bbShell.rotation.z = Math.PI / 2;
  bbShell.position.copy(BB_POS);
  bikeBody.add(bbShell);

  // Rear Fender (curved seafoam arc over rear tire, wider than tire)
  const rearFenderGeo = new THREE.TorusGeometry(0.405, 0.022, 10, 32, Math.PI * 0.96);
  const rearFender = new THREE.Mesh(rearFenderGeo, frameMat);
  rearFender.rotation.y = Math.PI / 2;
  rearFender.rotation.z = Math.PI * 0.12;
  rearFender.position.copy(REAR_AXLE);
  rearFender.scale.set(1, 1, 2.05); // sleek radial profile, wider than tire side-to-side
  rearFender.castShadow = true;
  bikeBody.add(rearFender);

  // Chrome rear fender stays
  for (const sx of [-1, 1]) {
    bikeBody.add(makeTubeBetween(
      new THREE.Vector3(sx * 0.064, REAR_AXLE.y, REAR_AXLE.z),
      new THREE.Vector3(sx * 0.035, REAR_AXLE.y + 0.14, REAR_AXLE.z + 0.37),
      0.004, chromeMat, 6
    ));
  }

  // Ruby Rear Taillight mounted on rear fender
  const tailHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.036, 12), chromeMat);
  tailHousing.rotation.x = Math.PI / 2 - 0.35;
  tailHousing.position.set(0, REAR_AXLE.y + 0.18, REAR_AXLE.z + 0.375);
  bikeBody.add(tailHousing);

  const tailLensMat = new THREE.MeshStandardMaterial({
    color: 0xff2244,
    emissive: 0xff1133,
    emissiveIntensity: 0.4,
    roughness: 0.2
  });
  const tailLens = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), tailLensMat);
  tailLens.position.set(0, REAR_AXLE.y + 0.175, REAR_AXLE.z + 0.395);
  bikeBody.add(tailLens);

  // === Sprung Brooks-Style Leather Saddle ===
  const seatPost = makeTubeBetween(SEAT_TOP, SEAT_TOP.clone().add(new THREE.Vector3(0, 0.08, 0.02)), 0.015, chromeMat, 12);
  bikeBody.add(seatPost);

  const saddleGroup = new THREE.Group();
  saddleGroup.position.set(0, 0.935, 0.27);
  bikeBody.add(saddleGroup);

  const saddleGeo = new THREE.SphereGeometry(0.115, 18, 12);
  saddleGeo.scale(1.05, 0.32, 1.48);
  const saddleMesh = new THREE.Mesh(saddleGeo, leatherMat);
  saddleMesh.castShadow = true;
  saddleGroup.add(saddleMesh);

  // Brass saddle rivets & twin coil springs
  for (const sx of [-0.055, 0, 0.055]) {
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), brassMat);
    rivet.position.set(sx, 0.025, 0.125);
    saddleGroup.add(rivet);
  }
  for (const sx of [-0.048, 0.048]) {
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 10), chromeMat);
    spring.position.set(sx, -0.036, 0.07);
    saddleGroup.add(spring);
  }

  // === Working Drivetrain: Chainring, Crank Arms, Counter-Rotating Pedals & Animated Chain ===
  const crankGroup = new THREE.Group();
  crankGroup.position.copy(BB_POS);
  bikeBody.add(crankGroup);

  // Front Chainring (right side, x = +0.056)
  const chainringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.008, 8, 32), chromeMat);
  chainringOuter.rotation.y = Math.PI / 2;
  chainringOuter.position.x = 0.056;
  crankGroup.add(chainringOuter);

  const chainringDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.006, 20), darkMetalMat);
  chainringDisc.rotation.z = Math.PI / 2;
  chainringDisc.position.x = 0.056;
  crankGroup.add(chainringDisc);

  // Chainring 5 spider spokes
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.095, 0.018), chromeMat);
    sp.position.set(0.06, Math.cos(a) * 0.048, Math.sin(a) * 0.048);
    sp.rotation.x = a;
    crankGroup.add(sp);
  }

  // Left & Right Crank Arms (180 degrees apart)
  // Right crank starts pointing UP (+Y at crankAngle=0), Left crank starts pointing DOWN (-Y)
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.016, CRANK_RADIUS, 0.026), chromeMat);
  rightArm.position.set(0.088, CRANK_RADIUS * 0.5, 0);
  rightArm.castShadow = true;
  crankGroup.add(rightArm);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.016, CRANK_RADIUS, 0.026), chromeMat);
  leftArm.position.set(-0.088, -CRANK_RADIUS * 0.5, 0);
  leftArm.castShadow = true;
  crankGroup.add(leftArm);

  function buildPedal(side) {
    const pGroup = new THREE.Group();
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8), chromeMat);
    spindle.rotation.z = Math.PI / 2;
    spindle.position.x = -side * 0.035;
    pGroup.add(spindle);

    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.022, 0.072), darkMetalMat);
    platform.castShadow = true;
    pGroup.add(platform);

    // Amber side pedal reflectors
    const reflMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.35 });
    const reflF = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.008), reflMat);
    reflF.position.z = -0.037;
    const reflB = reflF.clone();
    reflB.position.z = 0.037;
    pGroup.add(reflF, reflB);
    return pGroup;
  }

  const rightPedal = buildPedal(1);
  rightPedal.position.set(PEDAL_X, CRANK_RADIUS, 0);
  crankGroup.add(rightPedal);

  const leftPedal = buildPedal(-1);
  leftPedal.position.set(-PEDAL_X, -CRANK_RADIUS, 0);
  crankGroup.add(leftPedal);

  // Animated Roller Chain along exact upper & lower tangent runs
  const chainX = 0.056;
  const upperStart = new THREE.Vector3(chainX, BB_POS.y + 0.102, BB_POS.z);
  const upperEnd = new THREE.Vector3(chainX, REAR_AXLE.y + 0.048, REAR_AXLE.z);
  const lowerStart = new THREE.Vector3(chainX, REAR_AXLE.y - 0.048, REAR_AXLE.z);
  const lowerEnd = new THREE.Vector3(chainX, BB_POS.y - 0.102, BB_POS.z);

  const chainLoopPts = [
    upperStart, upperEnd,
    new THREE.Vector3(chainX, REAR_AXLE.y, REAR_AXLE.z + 0.048),
    lowerStart, lowerEnd,
    new THREE.Vector3(chainX, BB_POS.y, BB_POS.z - 0.102)
  ];
  const chainPath = new THREE.CatmullRomCurve3(chainLoopPts, true, 'catmullrom', 0.18);
  const chainLinkCount = 42;
  const chainLinks = [];
  const linkGeo = new THREE.BoxGeometry(0.012, 0.012, 0.024);
  for (let i = 0; i < chainLinkCount; i++) {
    const link = new THREE.Mesh(linkGeo, darkMetalMat);
    bikeBody.add(link);
    chainLinks.push(link);
  }
  let chainOffset = 0;
  const tmpP = new THREE.Vector3();
  const tmpT = new THREE.Vector3();
  function updateChain(offset) {
    for (let i = 0; i < chainLinkCount; i++) {
      const u = ((i / chainLinkCount) + offset) % 1;
      const safeU = u < 0 ? u + 1 : u;
      chainPath.getPointAt(safeU, tmpP);
      chainPath.getTangentAt(safeU, tmpT);
      chainLinks[i].position.copy(tmpP);
      chainLinks[i].lookAt(tmpP.clone().add(tmpT));
    }
  }
  updateChain(0);

  // === Steerable Front Fork + Wheel + Handlebars + Basket + Bell + Headlamp ===
  // Head tube steering axis pivot
  const headAxis = new THREE.Vector3().subVectors(HEAD_TOP, HEAD_BOT).normalize();
  const steerPivot = new THREE.Group();
  steerPivot.position.copy(HEAD_BOT);
  // Align steerPivot local +Y along the tilted head tube axis!
  const headQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), headAxis);
  steerPivot.quaternion.copy(headQuat);
  bikeBody.add(steerPivot);

  // Inner group rotating around steerPivot's local Y (the true steering axis!)
  const steerTurn = new THREE.Group();
  steerPivot.add(steerTurn);

  // Counter-rotate back to bikeBody orientation so placing front parts is intuitive & exact!
  const steerAssembly = new THREE.Group();
  steerAssembly.quaternion.copy(headQuat).invert();
  steerAssembly.position.set(0, 0, 0);
  steerTurn.add(steerAssembly);

  // Helper to convert bikeBody coords into steerAssembly coords (offset by -HEAD_BOT)
  const toSteer = (v) => v.clone().sub(HEAD_BOT);

  // Front Wheel
  const frontWheel = buildWheel();
  frontWheel.position.copy(toSteer(FRONT_AXLE));
  steerAssembly.add(frontWheel);

  // Front Fork blades (graceful curved rake from crown to front axle)
  const forkCrown = toSteer(HEAD_BOT);
  for (const sx of [-1, 1]) {
    const fCurve = new THREE.CatmullRomCurve3([
      forkCrown.clone().add(new THREE.Vector3(sx * 0.036, 0, 0)),
      forkCrown.clone().add(new THREE.Vector3(sx * 0.056, -0.14, -0.055)),
      toSteer(FRONT_AXLE).add(new THREE.Vector3(sx * 0.058, 0, 0))
    ]);
    const blade = new THREE.Mesh(new THREE.TubeGeometry(fCurve, 14, 0.013, 10, false), frameMat);
    blade.castShadow = true;
    steerAssembly.add(blade);
  }

  // Front Fender
  const frontFender = new THREE.Mesh(
    new THREE.TorusGeometry(0.405, 0.022, 10, 28, Math.PI * 0.85),
    frameMat
  );
  frontFender.rotation.y = Math.PI / 2;
  frontFender.rotation.z = Math.PI * 0.22;
  frontFender.position.copy(toSteer(FRONT_AXLE));
  frontFender.scale.set(1, 1, 2.05);
  frontFender.castShadow = true;
  steerAssembly.add(frontFender);

  // Chrome Stem
  const stemBase = toSteer(HEAD_TOP);
  const stemTop = stemBase.clone().add(new THREE.Vector3(0, 0.15, -0.035));
  steerAssembly.add(makeTubeBetween(stemBase, stemTop, 0.014, chromeMat, 10));

  // Swept-back Cruiser Handlebars (matching poster silhouette!)
  const gripLeftLocal = stemTop.clone().add(new THREE.Vector3(-0.32, 0.04, 0.19));
  const gripRightLocal = stemTop.clone().add(new THREE.Vector3(0.32, 0.04, 0.19));

  const barCurve = new THREE.CatmullRomCurve3([
    gripLeftLocal,
    stemTop.clone().add(new THREE.Vector3(-0.24, 0.06, 0.04)),
    stemTop.clone().add(new THREE.Vector3(-0.08, 0.02, -0.01)),
    stemTop,
    stemTop.clone().add(new THREE.Vector3(0.08, 0.02, -0.01)),
    stemTop.clone().add(new THREE.Vector3(0.24, 0.06, 0.04)),
    gripRightLocal
  ]);
  const handlebar = new THREE.Mesh(new THREE.TubeGeometry(barCurve, 36, 0.012, 10, false), chromeMat);
  handlebar.castShadow = true;
  steerAssembly.add(handlebar);

  // Stitched tan leather grips + reference anchors for pelican wingtips
  const leftGripAnchor = new THREE.Object3D();
  const rightGripAnchor = new THREE.Object3D();
  leftGripAnchor.position.copy(gripLeftLocal).add(new THREE.Vector3(0.02, 0.01, -0.04));
  rightGripAnchor.position.copy(gripRightLocal).add(new THREE.Vector3(-0.02, 0.01, -0.04));
  steerAssembly.add(leftGripAnchor, rightGripAnchor);

  for (const sx of [-1, 1]) {
    const gStart = stemTop.clone().add(new THREE.Vector3(sx * 0.27, 0.052, 0.10));
    const gEnd = sx < 0 ? gripLeftLocal : gripRightLocal;
    steerAssembly.add(makeTubeBetween(gStart, gEnd, 0.018, leatherMat, 12));
  }

  // Shiny Brass Bicycle Bell on Right Handlebar!
  const bellGroup = new THREE.Group();
  bellGroup.position.copy(stemTop).add(new THREE.Vector3(0.18, 0.06, 0.02));
  steerAssembly.add(bellGroup);

  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    brassMat
  );
  bellDome.castShadow = true;
  bellGroup.add(bellDome);
  const bellCap = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 10), chromeMat);
  bellCap.position.y = 0.028;
  bellGroup.add(bellCap);
  const bellTrigger = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.012), chromeMat);
  bellTrigger.position.set(-0.026, 0.004, 0.014);
  bellGroup.add(bellTrigger);

  // Vintage Chrome Front Headlamp + Real Spotlight & Volumetric Glow Cone for Dusk/Night!
  const lampPos = toSteer(HEAD_BOT).add(new THREE.Vector3(0, 0.05, -0.095));
  const lampGroup = new THREE.Group();
  lampGroup.position.copy(lampPos);
  steerAssembly.add(lampGroup);

  const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.03, 0.085, 16), chromeMat);
  lampBody.rotation.x = Math.PI / 2;
  lampBody.castShadow = true;
  lampGroup.add(lampBody);

  const lampLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff8dc,
    emissive: 0xffd57a,
    emissiveIntensity: 0.25,
    roughness: 0.1
  });
  const lampLens = new THREE.Mesh(new THREE.SphereGeometry(0.041, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), lampLensMat);
  lampLens.rotation.x = -Math.PI / 2;
  lampLens.position.z = -0.04;
  lampGroup.add(lampLens);

  // Headlamp beam cone (visible at twilight / night)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffe49e,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const beamCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 4.6, 20, 1, true), beamMat);
  beamCone.rotation.x = -Math.PI / 2 - 0.16;
  beamCone.position.set(0, -0.35, -2.35);
  lampGroup.add(beamCone);

  const headSpot = new THREE.SpotLight(0xffe099, 0, 14, Math.PI / 4.2, 0.65, 1.4);
  headSpot.position.set(0, 0, -0.06);
  const headSpotTarget = new THREE.Object3D();
  headSpotTarget.position.set(0, -0.9, -4.5);
  lampGroup.add(headSpot, headSpotTarget);
  headSpot.target = headSpotTarget;

  // === Woven Wicker Front Basket (Filled with Silver Fish, Seashells & Sunflower!) ===
  const { map: wickerMap, bumpMap: wickerBump } = createWickerTexture();
  const wickerMat = new THREE.MeshStandardMaterial({
    map: wickerMap,
    bumpMap: wickerBump,
    bumpScale: 0.015,
    roughness: 0.85,
    side: THREE.DoubleSide
  });

  const basketGroup = new THREE.Group();
  basketGroup.position.copy(stemTop).add(new THREE.Vector3(0, -0.14, -0.175));
  steerAssembly.add(basketGroup);

  const basketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.125, 0.21, 18, 1, true),
    wickerMat
  );
  basketBody.scale.set(1.18, 1, 0.85);
  basketBody.castShadow = true;
  basketGroup.add(basketBody);

  const basketBottom = new THREE.Mesh(new THREE.CircleGeometry(0.125, 16), wickerMat);
  basketBottom.rotation.x = -Math.PI / 2;
  basketBottom.position.y = -0.102;
  basketBottom.scale.set(1.18, 0.85, 1);
  basketGroup.add(basketBottom);

  // Braided top rim
  const basketRim = new THREE.Mesh(new THREE.TorusGeometry(0.164, 0.015, 8, 24), wickerMat);
  basketRim.rotation.x = Math.PI / 2;
  basketRim.position.y = 0.105;
  basketRim.scale.set(1.18, 0.85, 1);
  basketGroup.add(basketRim);

  // Leather mounting straps
  for (const sx of [-0.08, 0.08]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.07, 0.06), leatherMat);
    strap.position.set(sx, 0.06, 0.13);
    basketGroup.add(strap);
  }

  // Shiny silver fish peeking out of the basket!
  const fishSilverMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    metalness: 0.82,
    roughness: 0.22
  });
  for (let i = 0; i < 2; i++) {
    const f = new THREE.Group();
    const fBody = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 10), fishSilverMat);
    fBody.scale.set(0.55, 0.85, 2.2);
    const fTail = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 4), fishSilverMat);
    fTail.rotation.x = Math.PI / 2;
    fTail.position.z = -0.075;
    fTail.scale.set(0.35, 1, 1);
    f.add(fBody, fTail);
    f.position.set(i === 0 ? -0.07 : 0.04, 0.09, i === 0 ? 0.02 : -0.03);
    f.rotation.set(0.55 + i * 0.25, i === 0 ? 0.4 : -0.5, i === 0 ? 0.3 : -0.2);
    basketGroup.add(f);
  }

  // Coastal seashell & cheerful golden sunflower in the basket
  const shellMesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.048, 0.085, 12),
    new THREE.MeshStandardMaterial({ color: 0xf9a88b, roughness: 0.5 })
  );
  shellMesh.position.set(0.095, 0.09, 0.04);
  shellMesh.rotation.set(0.3, 0.2, -0.45);
  basketGroup.add(shellMesh);

  const flowerGroup = new THREE.Group();
  flowerGroup.position.set(-0.11, 0.14, -0.02);
  flowerGroup.rotation.set(-0.2, 0.4, 0.25);
  const fCenter = new THREE.Mesh(
    new THREE.SphereGeometry(0.026, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x5c3416, roughness: 0.8 })
  );
  fCenter.scale.set(1, 1, 0.45);
  flowerGroup.add(fCenter);
  const petalMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  for (let p = 0; p < 10; p++) {
    const a = (p / 10) * Math.PI * 2;
    const pet = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), petalMat);
    pet.scale.set(0.7, 1.5, 0.3);
    pet.position.set(Math.cos(a) * 0.034, Math.sin(a) * 0.034, 0);
    pet.rotation.z = a - Math.PI / 2;
    flowerGroup.add(pet);
  }
  basketGroup.add(flowerGroup);

  // Expanding golden soundwave rings when bell rings!
  const bellRingMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const bellRingMesh = new THREE.Mesh(new THREE.RingGeometry(0.04, 0.065, 28), bellRingMat);
  bellRingMesh.position.copy(bellGroup.position).add(new THREE.Vector3(0, 0.04, 0));
  steerAssembly.add(bellRingMesh);

  // === Dynamic State & Helpers ===
  let wheelAngle = 0;
  let crankAngle = 0;
  let bellTimer = 0;
  let steerAngle = 0;

  // Reusable vectors for exact coordinate export to Pelican IK
  const leftPedalPos = new THREE.Vector3();
  const rightPedalPos = new THREE.Vector3();
  const leftGripPos = new THREE.Vector3();
  const rightGripPos = new THREE.Vector3();

  function update(dt, speedMps, targetSteer, wheeliePitch, nightFactor, cameraPos) {
    // 1. Exact non-slip wheel rotation: dTheta = v * dt / R
    const dWheel = (speedMps * dt) / WHEEL_RADIUS;
    wheelAngle += dWheel;
    // Rolling toward -Z corresponds to negative X rotation
    rearWheel.rotation.x = -wheelAngle;
    frontWheel.rotation.x = -wheelAngle;

    // 2. Realistic gear ratio (~2.1:1 cruiser gearing) -> crank spins smoothly
    const dCrank = dWheel / 1.95;
    crankAngle += dCrank;
    crankGroup.rotation.x = -crankAngle;

    // Counter-rotate pedals so foot platforms remain horizontal!
    rightPedal.rotation.x = crankAngle;
    leftPedal.rotation.x = crankAngle;

    // Advance chain links along loop
    chainOffset = (chainOffset + dCrank * 0.085) % 1;
    updateChain(chainOffset);

    // 3. Steering angle around true tilted head-tube axis
    steerAngle = THREE.MathUtils.lerp(steerAngle, targetSteer, Math.min(1, dt * 8));
    steerTurn.rotation.y = steerAngle;

    // 4. Wheelie pitch around rear tire contact patch!
    wheeliePivot.rotation.x = wheeliePitch;

    // 5. Night headlamp & taillight intensity
    const lampOn = THREE.MathUtils.smoothstep(nightFactor, 0.25, 0.9);
    lampLensMat.emissiveIntensity = 0.25 + lampOn * 2.6;
    tailLensMat.emissiveIntensity = 0.4 + lampOn * 2.4;
    beamMat.opacity = lampOn * 0.18;
    headSpot.intensity = lampOn * 6.5;

    // 6. Bell ring animation & golden soundwave ring
    if (bellTimer > 0) {
      bellTimer = Math.max(0, bellTimer - dt);
      const t = 1 - bellTimer / 0.85;
      bellDome.rotation.z = Math.sin(t * 58) * 0.16 * (1 - t);
      bellTrigger.rotation.y = Math.sin(t * 36) * 0.35 * (1 - t);
      const s = 1 + t * 9.5;
      bellRingMesh.scale.setScalar(s);
      bellRingMat.opacity = (1 - t) * 0.85;
      if (cameraPos) bellRingMesh.lookAt(cameraPos);
    } else {
      bellDome.rotation.z = 0;
      bellTrigger.rotation.y = 0;
      bellRingMat.opacity = 0;
    }

    // Ensure matrices are up to date for exact grip export
    bikeBody.updateMatrixWorld(true);
  }

  function triggerBell() {
    bellTimer = 0.85;
  }

  /**
   * Exact pedal top-center coordinates in `bikeBody` local space for Pelican 2-bone analytical IK!
   */
  function getPedalPositions() {
    // Right pedal starts at (+PEDAL_X, +CRANK_RADIUS, 0) rotated by -crankAngle around X
    const c = Math.cos(crankAngle);
    const s = Math.sin(crankAngle);

    rightPedalPos.set(
      PEDAL_X,
      BB_POS.y + CRANK_RADIUS * c + 0.015,
      BB_POS.z - CRANK_RADIUS * s
    );
    leftPedalPos.set(
      -PEDAL_X,
      BB_POS.y - CRANK_RADIUS * c + 0.015,
      BB_POS.z + CRANK_RADIUS * s
    );
    return { left: leftPedalPos, right: rightPedalPos };
  }

  /**
   * Exact handlebar grip positions in `bikeBody` local space (tracking steering rotation!)
   */
  function getGripPositions() {
    const invBike = new THREE.Matrix4().copy(bikeBody.matrixWorld).invert();
    leftGripAnchor.getWorldPosition(leftGripPos).applyMatrix4(invBike);
    rightGripAnchor.getWorldPosition(rightGripPos).applyMatrix4(invBike);
    return { left: leftGripPos, right: rightGripPos };
  }

  function getCrankAngle() {
    return crankAngle;
  }

  return {
    root,
    wheeliePivot,
    bikeBody,
    update,
    triggerBell,
    getPedalPositions,
    getGripPositions,
    getCrankAngle,
    WHEEL_RADIUS
  };
}
