const local = require('../csgo/localplayer.js');
const entities = require('../csgo/entities.js');

const math = require('../util/math.js');

let aimTarget = false;

function findTarget(FOV) {
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
  }
  if(aimTarget != false) {
    let bezier = false;
    if(aimTarget.bezier) {
      bezier = aimTarget.bezier
    }
    aimTarget = entities.getEntity(aimTarget.index);
    aimTarget.bezier = bezier;
    return;
  }
  const enemyTeam = entities.enemyTeam;
  if(!enemyTeam) {
    return;
  }
  var minDistance = 99999999999999999;
  for(let i = 0; i < enemyTeam.length; i++) {
    if(!validTarget(enemyTeam[i])) {
      continue;
    }
    let angles = math.angles(local.player.head, enemyTeam[i].head);
    let crosshairDistance = Math.sqrt(Math.pow(angles.x - local.player.viewAngles.x, 2) +
                                      Math.pow(math.normalize360(angles.y) - math.normalize360(local.player.viewAngles.y), 2));
    if(FOV && FOV > 0 && crosshairDistance > FOV) {
      continue;
    }
    if(crosshairDistance < minDistance) {
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
const MAX_VELOCITY = 100;

/**
 * Max aim accleration in [fake] degrees per second squared
 */
const ACCELERATION = 690;

function aimAtTargetBezier() {
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  let aimAngle = math.angles(local.player.head, aimTarget.head);

  if(!aimTarget.bezier) {
    let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle)
    t = 0.0;
    aimTarget.bezier = math.cuteCurveBetween({
      x: 0,
      y: 0
    }, {
      x: aimDifference.x,
      y: aimDifference.y
    });
    aimTarget.bezier.originalLength = aimTarget.bezier.curve.length();
    aimTarget.bezier.lastTime = new Date().getTime();
    aimTarget.bezier.theta = 0;
    aimTarget.bezier.velocity = 0;
  } else {
    let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle);
    aimTarget.bezier.curve = math.cuteCurveBetween({
      x: 0,
      y: 0
    }, {
      x: aimDifference.x,
      y: aimDifference.y
    }, aimTarget.bezier.randoms).curve;
  }
  
  let ms = new Date().getTime();
  let deltaT = (ms - aimTarget.bezier.lastTime)/1000;
  aimTarget.bezier.lastTime = ms;
  aimTarget.bezier.velocity += deltaT * ACCELERATION;
  if(aimTarget.bezier.velocity > MAX_VELOCITY) {
    aimTarget.bezier.velocity = MAX_VELOCITY;
  }
  aimTarget.bezier.theta +=  aimTarget.bezier.velocity * deltaT;
  t = aimTarget.bezier.theta / aimTarget.bezier.originalLength;
  // 
  //t+=0.005;
  if(t > 1) {
    t = 1;
  }

  // console.log(aimTarget.bezier.velocity);
  let punch = local.player.getAimPunch()
  let angle = {
    x: local.player.viewAngles.x + aimTarget.bezier.curve.get(t).x - punch.x*2 * 0.8,
    y: local.player.viewAngles.y + aimTarget.bezier.curve.get(t).y - punch.y*2 * 0.8
  };
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  local.player.lookAt(angle);
  // console.log(t);
  //let aimDifference = math.angleBetween(local.player.viewAngles, aimAngle);
  //aimAngle.x = local.player.viewAngles.x + aimDifference.x/2;
  //aimAngle.y = local.player.viewAngles.y + aimDifference.y/2;
  //local.player.lookAt(aimAngle);
  //local.player.aimAtPoint(aimTarget.head);
}

module.exports.aimAtTargetBezier = aimAtTargetBezier;

function aimAtTarget() {
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  local.player.aimAtPoint(aimTarget.head, true);
}

module.exports.aimAtTarget = aimAtTarget;