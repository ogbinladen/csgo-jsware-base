const Vec3 = require('../util/vec.js').Vec3;
const Vec2 = require('../util/vec.js').Vec2; // just in case

const Bezier = require('bezier-js');

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

/**
 * Calculate the absolute angle between the origin and a point
 * @param {Vec3} origin origin coordinates
 * @param {Vec3} point target coordinates
 * @returns {Vec3} angles {y: yaw, x: pitch, z: roll}
 */
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

/**
 * Calculate the smallest signed angle between two angles
 * @param {Vec2 or Vec3} angleOne generally the player's view angles
 * @param {Vec2 or Vec3} angleTwo generally the result of math.angles(player, enemy.head)
 */
function angleBetween(angleOne, angleTwo) {
  let outAngle = new Vec2();
  outAngle.y = normalize360(angleTwo.y) - normalize360(angleOne.y);
  if(Math.abs(outAngle.y) >= 180) {
    outAngle.y = normalize360(outAngle.y);
  }
  outAngle.x = angleTwo.x - angleOne.x;
  outAngle = normalizeClamp(outAngle);
  return outAngle
}
module.exports.angleBetween = angleBetween;

/**
 * Creates a (cute) randomized bezier curve between two points
 * @param {Vec2} pt1 
 * @param {Vec2} pt2 
 */
function cuteCurveBetween(pt1, pt2, randoms) {
  // random numbers for making control points
  if(!randoms) {
    var randoms = {r1: Math.random(), r2: Math.random(), r3: Math.random(), r4: Math.random()};
  }

  let theta = Math.atan2(pt2.y-pt1.y, pt2.x-pt1.x);

  let straight = cuteCurveStraight(pt1, pt2, randoms);

  let mid1 = {
    x: Math.cos(theta) * (straight.mid1.x-pt1.x) - Math.sin(theta) * (straight.mid1.y-pt1.y) + pt1.x,
    y: Math.sin(theta) * (straight.mid1.x-pt1.x) + Math.cos(theta) * (straight.mid1.y-pt1.y) + pt1.y
  }

  let mid2 = {
    x: Math.cos(theta) * (straight.mid2.x-pt1.x) - Math.sin(theta) * (straight.mid2.y-pt1.y) + pt1.x,
    y: Math.sin(theta) * (straight.mid2.x-pt1.x) + Math.cos(theta) * (straight.mid2.y-pt1.y) + pt1.y
  }
  return {curve: new Bezier(pt1, mid1 , mid2 , pt2), pt1: pt1, mid1: mid1, mid2:mid2, pt2: pt2, randoms: straight.randoms};
}

module.exports.cuteCurveBetween = cuteCurveBetween;

function cuteCurveStraight(pt1, pt2, randoms) {
  let newPt2 = {
    x:pt1.x+Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2)),
    y:pt1.y
  };

  let straightLen = Math.abs(newPt2.x - pt1.x);

  let mid1 = {
    x: pt1.x+Math.floor(randoms.r1*((newPt2.x-pt1.x)/1.9)+((newPt2.x-pt1.x)/6)), 
    y: pt1.y+Math.round(randoms.r2*(straightLen/2)-(straightLen/4))
  };
  let mid2 = {
    x: newPt2.x-Math.floor(randoms.r3*((newPt2.x-pt1.x)/2)), 
    y: newPt2.y+Math.round(randoms.r4*(straightLen/2)-(straightLen/4))
  };
  
  return {curve: new Bezier(pt1, mid1 , mid2 , newPt2), mid1: mid1, mid2: mid2, pt2: newPt2, randoms: randoms};
}