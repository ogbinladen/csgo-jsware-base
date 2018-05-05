const local = require('../csgo/localplayer.js');
const entities = require('../csgo/entities.js');

const math = require('../util/math.js');

let aimTarget = false;

function findTarget() {
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
  }
  if(aimTarget != false) {
    aimTarget = entities.getEntity(aimTarget.index);
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

function aimAtTarget() {
  if(!aimTarget || !validTarget(aimTarget)) {
    aimTarget = false;
    return;
  }
  local.player.aimAtPoint(aimTarget.head);
}

module.exports.aimAtTarget = aimAtTarget;