const csgo = require('../util/process.js');
const off = require('../util/offsets.js');
const Vec3 = require('../util/vec.js').Vec3;
const math = require('../util/math.js');
const ents = require('./entities.js');

var aimPunchCompensation = new Vec3(0,0,0);

/**
 * Call this to read the local player
 * The local player is just an Entity with some more data and a few more functions
 */
function readLocalPlayer() {
  let index = csgo.readClientState(off("dwClientState_GetLocalPlayer"),  "int"); // find the index of the local player
  let localPlayer = ents.getEntity(index); // get the entity that corresponds to that index

  localPlayer.inCross = ents.getEntity(localPlayer.read(off("m_iCrosshairId"), "int") - 1); // the ID of the entity in the player's crosshair

  localPlayer.head = new Vec3(); // we're gonna redefine the head based off of m_vecOrigin instead of the bone
  localPlayer.head.x = localPlayer.read(off('m_vecOrigin'), 'float');
  localPlayer.head.y = localPlayer.read(off('m_vecOrigin') + 4, 'float');

  localPlayer.viewOffset = new Vec3(0, 0, localPlayer.read(off('m_vecOrigin')+8, 'float')); // lazy but also less memory reads

  localPlayer.head.z = localPlayer.read(off('m_vecViewOffset') + 8, 'float') + localPlayer.viewOffset.z;

  // get the player's view angles. these technically aren't part of the entity but we're gonna add them
  localPlayer.viewAngles = new Vec3(csgo.readClientState(off('dwClientState_ViewAngles'), "float"),
                                    csgo.readClientState(off('dwClientState_ViewAngles') + 4, "float"),
                                    0); // 0 roll angle

  /**
   * Look at the given target angle
   * @param {Vec2 or Vec3 } targetAngle (y: yaw, x: pitch, z: roll unused)
   */
  localPlayer.lookAt = (targetAngle) => {
    targetAngle = math.normalizeClamp(targetAngle);
    csgo.writeClientState(off('dwClientState_ViewAngles') + 4, targetAngle.y, 'float');
    csgo.writeClientState(off('dwClientState_ViewAngles'), targetAngle.x, 'float');
  }

  /**
   * Aim at the given point
   * @param {Vec3} target (x,y,z) coordinates of point to aim at
   * @param {Boolean} aimPunch (x,y,z) compensate for aimpunch?
   */
  localPlayer.aimAtPoint = (target, aimPunch) => {
    let vecAngles = math.angles(localPlayer.head, target);
    if(aimPunch) {
      let punch = localPlayer.getAimPunch();
      vecAngles.x -= punch.x*2;
      vecAngles.y -= punch.y*2;
    }
    localPlayer.lookAt(vecAngles);
  }

  // these are self explanatory, if you don't get it google dwForceAttack
  localPlayer.shootOnce = () => {
    csgo.writeClient(off('dwForceAttack'), 6, "int");
  }
  localPlayer.startShooting = () => {
    csgo.writeClient(off('dwForceAttack'), true, "int");
  }
  localPlayer.stopShooting = () => {
    csgo.writeClient(off('dwForceAttack'), false, "int");
  }

  localPlayer.shotsFired = localPlayer.read(off("m_iShotsFired"), "int");

  localPlayer.getAimPunch = () => {
    return new Vec3(
      localPlayer.read(off('m_aimPunchAngle'), "float"),
      localPlayer.read(off('m_aimPunchAngle') + 4, "float"),
      localPlayer.read(off('m_aimPunchAngle') + 8, "float")
    );
  }

  localPlayer.compensateAimPunch = (strength, angles) => {
    if(!strength) {
      strength = 1;
    }
    if(!angles) {
      angles = localPlayer.viewAngles
    }

    let punch = localPlayer.getAimPunch();
    localPlayer.lookAt({
      x: angles.x - (punch.x*2*strength - aimPunchCompensation.x),
      y: angles.y - (punch.y*2*strength - aimPunchCompensation.y)
    });
    aimPunchCompensation.x+=(punch.x*2*strength - aimPunchCompensation.x);
    aimPunchCompensation.y+=(punch.y*2*strength - aimPunchCompensation.y);
  }
  localPlayer.resetAimPunchCompensation = () => {
    aimPunchCompensation = new Vec3(0,0,0);
  }

  /**
   * Makes the player jump for one tick
   */
  localPlayer.jump = () => {
    csgo.writeClient(off('dwForceJump'), 6, "int");
  }

  /**
   * flags which includes things such as checking if we're on the ground
   */
  localPlayer.flags = localPlayer.read(off('m_fFlags'), "int");

  localPlayer.onGround = localPlayer.flags == 257 || localPlayer.flags == 263;

  /**
   * Sets or gets the max flash alpha
   * @param {number} [alpha] 0-255
   */
  localPlayer.maxFlashAlpha = function(alpha) {
    if(typeof alpha !== 'undefined' && typeof alpha == 'number') {
      localPlayer.write(off('m_flFlashMaxAlpha'), alpha, 'float');
    } else {
      return localPlayer.read(off('m_flFlashMaxAlpha'), 'float');
    }
  }

  /**
   * The player is special entity with more data and functions specific to the current player
   */
  module.exports.player = localPlayer;
}

/**
 * Manage the loop that continously reads + updates the local player
 * Should only run after we're reading entities
 */
class readLoop {
  constructor() {
    this.looptime = 5;
    this.loop = () => {
      readLocalPlayer();
      setTimeout(this.loop, this.looptime);
    };
    this.loop();
  }
}
module.exports.readLoop = readLoop;

module.exports.readLocalPlayer = readLocalPlayer;
