/**
 * Represents 2 numbers usually coordinates
 */
module.exports.Vec2 = function(x, y) {
  this.x = null;
  this.y = null;
  if(typeof x == 'number' && typeof y == 'number' ) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Represents 3 numbers usually coordinates
 */
module.exports.Vec3 = function(x, y, z) {
  this.x = null;
  this.y = null;
  this.z = null;
  if(typeof x == 'number' && typeof y == 'number' && typeof z == 'number') {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
