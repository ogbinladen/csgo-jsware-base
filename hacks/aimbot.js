const Vec3 = require('../util/vec.js').Vec3;

const local = require('../csgo/localplayer.js');
const entities = require('../csgo/entities.js');

const math = require('../util/math.js');

let aimTarget = false;

const secondBone = 4;

function findTarget(FOV) {
  if (!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
  }
  if (aimTarget != false) {
    let bezier = false;
    if (aimTarget.bezier) {
      bezier = aimTarget.bezier
    }
    let info = false;
    if (aimTarget.info) {
      info = aimTarget.info
    }
    aimTarget = entities.getEntity(aimTarget.index);
    aimTarget.bezier = bezier;
    aimTarget.info = info;
    return;
  }
  const enemyTeam = entities.enemyTeam;
  if (!enemyTeam) {
    return;
  }
  var minDistance = 99999999999999999;
  for (let i = 0; i < enemyTeam.length; i++) {
    if (!validTarget(enemyTeam[i])) {
      continue;
    }
    let angles = math.angles(local.player.head, enemyTeam[i].head);
    let crosshairDistance = Math.sqrt(Math.pow(angles.x - local.player.viewAngles.x, 2) +
      Math.pow(math.normalize360(angles.y) - math.normalize360(local.player.viewAngles.y), 2));
    if(secondBone) {
      let angles2 = math.angles(local.player.head, enemyTeam[i].readBone(secondBone));
      let crosshairDistance2 = Math.sqrt(Math.pow(angles.x - local.player.viewAngles.x, 2) +
      Math.pow(math.normalize360(angles.y) - math.normalize360(local.player.viewAngles.y), 2));
      if(crosshairDistance2 < crosshairDistance) {
        crosshairDistance = crosshairDistance2;
      }
    }
    if (FOV && FOV > 0 && crosshairDistance > FOV) {
      continue;
    }
    if (crosshairDistance < minDistance) {
      aimTarget = enemyTeam[i];
      minDistance = crosshairDistance;
      module.exports.aimTarget = aimTarget;
    }
  }
}
module.exports.findTarget = findTarget;

function validTarget(entity) {
  return entity.isAlive && !entity.dormant && !entity.immune;
}

module.exports.setTarget = (enemy) => {
  aimTarget = enemy;
  module.exports.aimTarget = aimTarget;
}

function resetTarget() {
  aimTarget = false;
}
module.exports.resetTarget = resetTarget;

var t = 0.0;

/**
 * Max aim velocity in [fake] degrees per second
 */
const MAX_VELOCITY = 50;

/**
 * Max aim accleration in [fake] degrees per second squared
 */
const ACCELERATION = 1337;

function aimAtTargetBezier() {
  if (!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }

  // lets get our aimpunch once so we can use it many times
  let punch = local.player.getAimPunch();

  // here we find the specific point on the target's body to lock onto
  if (!aimTarget.info || !aimTarget.info.aimBone) {
    aimTarget.info = {};
    let lowerBone = aimTarget.readBone(secondBone);

    let viewAnglesNoPunch = {
      x: local.player.viewAngles.x + punch.x,
      y: local.player.viewAngles.y + punch.y
    };
    
    // angle to head:
    let anglesOne = math.angleBetween(viewAnglesNoPunch, math.angles(local.player.head, aimTarget.head));
    
    // angle to second bone (stomach?)
    let anglesTwo = math.angleBetween(viewAnglesNoPunch, math.angles(local.player.head, lowerBone));

    if (anglesOne.x * anglesTwo.x > 0) { // same signed so we're either aiming above the head or at/below his dick
      if (anglesOne.x > 0) { // we're above his head
        aimTarget.info.aimBone = () => {
          return aimTarget.head; // aim at the head
        }
      } else {
        aimTarget.info.aimBone = () => {
          return aimTarget.readBone(secondBone); // aim at the second bone (stomach)
        }
      }
    } else {
      aimTarget.info.aimBone = function() {
        let lowerBone = aimTarget.readBone(secondBone); // (stomach)
        
        // direction vector from head to lower bone
        let vector = {
          x: aimTarget.head.x - lowerBone.x,
          y: aimTarget.head.y - lowerBone.y,
          z: aimTarget.head.z - lowerBone.z
        }

        // find the x or y coordinate given z
        let calcX = function (z) {
          return (vector.x * z - aimTarget.head.z * vector.x + aimTarget.head.x * vector.z ) / (vector.z);
        }
        let calcY = function (z) {
          return (vector.y * z - aimTarget.head.z * vector.y + aimTarget.head.y * vector.z) / (vector.z);
        }

        // define a "z lock" as the percentage between head and lower bone
        if(!aimTarget.info.lockZ) {
          let midZ = local.player.head.z - Math.sqrt(Math.pow(aimTarget.head.x - local.player.head.x, 2) + Math.pow(aimTarget.head.y - local.player.head.y, 2)) * 
            Math.tan(viewAnglesNoPunch.x * (Math.PI / 180));
          aimTarget.info.lockZ = (aimTarget.head.z - midZ) / vector.z;
        }

        let midZ = aimTarget.head.z - vector.z * aimTarget.info.lockZ;

        let aimBone = new Vec3(
          calcX(midZ),
          calcY(midZ),
          midZ
        );
        return aimBone;
      }
    }
  }

  let aimAngle = math.angles(local.player.head, aimTarget.info.aimBone());

  if (!aimTarget.bezier) { // here we define the bezier curve for the first time
    let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle)
    t = 0.0; // reset our t value (parametric argument, if you don't know what that is take precalc)
    
    // this generates a random curve between two points
    aimTarget.bezier = math.cuteCurveBetween({
      x: 0,
      y: 0
    }, {
      x: aimDifference.x,
      y: aimDifference.y
    });

    // save length for velocity / acceleration control
    aimTarget.bezier.originalLength = aimTarget.bezier.curve.length();

    // reset random stuff for velocity / acceleration control
    aimTarget.bezier.lastTime = new Date().getTime();
    aimTarget.bezier.theta = 0;
    aimTarget.bezier.velocity = 0;
  } else { // we've already got a curve made
    // we're gonna redefine the curve, but with preset random values so it doesn't get too whacky
    let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle);
    aimTarget.bezier.curve = math.cuteCurveBetween({
      x: 0,
      y: 0
    }, {
      x: aimDifference.x,
      y: aimDifference.y
    }, aimTarget.bezier.randoms).curve;
  }

  // basic calculus that you probably learned in physics
  let ms = new Date().getTime();
  let deltaT = (ms - aimTarget.bezier.lastTime) / 1000;
  aimTarget.bezier.lastTime = ms;
  aimTarget.bezier.velocity += deltaT * ACCELERATION;
  if (aimTarget.bezier.velocity > MAX_VELOCITY) {
    aimTarget.bezier.velocity = MAX_VELOCITY;
  }
  aimTarget.bezier.theta += aimTarget.bezier.velocity * deltaT;

  //bezier curves are defined [0,1]
  t = aimTarget.bezier.theta / aimTarget.bezier.originalLength;
  if (t > 1) {
    t = 1;
  }

  let angle = {
    x: local.player.viewAngles.x + aimTarget.bezier.curve.get(t).x - punch.x * 2 * 0.8,
    y: local.player.viewAngles.y + aimTarget.bezier.curve.get(t).y - punch.y * 2 * 0.8
  };
  if (!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  local.player.lookAt(angle);
  
  //let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle);
  //aimAngle.x = local.player.viewAngles.x + aimDifference.x/2;
  //aimAngle.y = local.player.viewAngles.y + aimDifference.y/2;
  //local.player.lookAt(aimAngle);
  //local.player.aimAtPoint(aimTarget.head);
}

module.exports.aimAtTargetBezier = aimAtTargetBezier;

function aimAtTarget() {
  if (!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  local.player.aimAtPoint(aimTarget.head, true);
}

module.exports.aimAtTarget = aimAtTarget;