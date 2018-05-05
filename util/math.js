const Vec3 = require('../util/vec.js').Vec3;
const Vec2 = require('../util/vec.js').Vec2; // just in case

function normalizeClamp(angles) {
  if(angles.x > 89) {
    angles.x = 89;
  }
  if(angles.x < -89) {
    angles.x = -89;
  }
  while(angles.y > 180) {
    angles.y = angles.y - 360;
  }
  while(angles.y < -180) {
    angles.y = angles.y + 360;
  }
  if(angles.y > 180) {
    angles.y = 180;
  }
  if(angles.y < -180) {
    angles.y = -180;
  }
  if(typeof angles.x != 'number' || Number.isNaN(angles.x)) {
    angles.x = 0;
  }
  if(typeof angles.y != 'number' || Number.isNaN(angles.y)) {
    angles.y = 0;
  }
  if(angles.z != 0) {
    angles.z = 0;
  }
  return angles;
}
module.exports.normalizeClamp = normalizeClamp;

// copy paste https://github.com/fczbkk/angle-js/blob/master/src/index.js ctrl-f normalize
function normalize360(angle) {
  let result = 0;
  if (typeof angle === 'number') {
    result = angle % 360;
    if (result < 0) {
      result += 360
    }
  }
  return result;
}
module.exports.normalize360 = normalize360;

function angles(origin, point) {
  let target = new Vec3();
  target.x = point.x-origin.x;
  target.y = point.y-origin.y;
  target.z = point.z-origin.z;

  let xyDistance = Math.sqrt(Math.pow(target.x, 2) + Math.pow(target.y, 2));
  let xyzDistance = Math.sqrt(Math.pow(xyDistance, 2) + Math.pow(target.z, 2));

  let vecAngles = new Vec3();
  vecAngles.z = 0;
  vecAngles.y = Math.atan2(target.y, target.x) * 180 / Math.PI;
  vecAngles.x = Math.atan(- target.z / xyDistance) * 180 / Math.PI;
  return vecAngles;
}

module.exports.angles = angles;
