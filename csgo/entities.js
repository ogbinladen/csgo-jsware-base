const csgo = require('../util/process.js');
const off = require('../util/offsets.js');
const Vec3 = require('../util/vec.js').Vec3;

const local = require('./localplayer.js');
const glow = require('./glow.js');

let entities = [];
let friendlyTeam = [];
let enemyTeam = [];
const boneDistance = 0x30;

/**
 * An entity has a bunch of different properties. Represents things like player.
 * Also contains a few functions to make dealing with them easier.
 */
class Entity {
  constructor(entityBase, index) {
    this.entityBase = entityBase; // the base memory address
    if (index) {
      this.index = index; // index of the entity for easy reference
    }
    else {
      this.index = null;
    }
    if (entityBase == 0) {
      this.bad = true; // garbage don't use
      return;
    }

    /**
     * A helper function to read memory relative to this entity
     * @param {Number} offset memory offset relative to this entity's base address 
     * @param {String} type the type of data to read (eg. "int")
     * @returns {type} data whatever data at whatever offset you requested
     */
    this.read = (offset, type) => {
      return csgo.read(this.entityBase + offset, type);
    };

    /**
     * A helper function to read memory relative to this entity
     * @param {Number} offset memory offset relative to this entity's base address 
     * @param {*} data the data you want to write
     * @param {String} type the type of data to read (eg. "int")
     */
    this.write = (offset, data, type) => {
      return csgo.write(this.entityBase + offset, data, type);
    };

    this.health = this.read(off('m_iHealth'), "int"); // the entity's health
    this.team = this.read(off('m_iTeamNum'), "int"); // the team of the entity (a number)
    this.isAlive = this.read(off('m_lifeState'), "int") == 0; // is this entity alive?
    this.isSpotted = this.read(off('m_bSpotted'), "boolean"); // is this entity spotted (by your teammate or yourself)?

    this.glowIndex = this.read(off('m_iGlowIndex'), "int"); // glow index for glow purposes
   
    this.immune = this.read(off('m_bGunGameImmunity'), "boolean"); // can this entity be hurt?
    this.dormant = this.read(0xE9, "boolean"); // dormant entities are generally useless for position data and cannot be seen / shot

    this.boneMatrix = csgo.read(this.entityBase + off('m_dwBoneMatrix'), "int"); // the address for the bone matrix

    /**
     * Get the (x,y,z) position of a specific bone
     * @param {Number} id The ID for the bone. Use Google to find these.
     * @returns {Vec3} position -- (x: [number],y: [number],z: [number]) coordinates of the bone
     */
    this.readBone = (id) => {
      if (this.boneMatrix == 0) {
        return;
      }
      let x = csgo.read(this.boneMatrix + boneDistance * id + 0x0C, "float");
      let y = csgo.read(this.boneMatrix + boneDistance * id + 0x1C, "float");
      let z = csgo.read(this.boneMatrix + boneDistance * id + 0x2C, "float");
      return new Vec3(x, y, z);
    };

    this.head = this.readBone(8); // the head is the most important bone of the body

    if (this.index != null) { // can't glow bad entities

    /**
     * Glow (outline) this entity
     * @param {Number} R red
     * @param {Number} G green
     * @param {Number} B blue
     * @param {Number} A alpha (transparency)
     */
      this.glow = (R, G, B, A) => {
        glow.glowEntity(this, R, G, B, A);
      };
    }
  }
}

const ENTITIES_SIZE = 32;

/**
 * Call this to read all entities
 */
function readEntities() {
  // will fill these if we can
  friendlyTeam = [];
  enemyTeam = [];
  for (let i = 0; i <= ENTITIES_SIZE; i++)
	{
    let entityBase = csgo.readClient((off('dwEntityList')) + (i * 0x10), "int"); // find the entity base
    entities[i] = new Entity(entityBase, i); // pull data about entity, filling in its base and index
    if(!local.player) {
      continue; // don't try to fill teams if we don't know the player's team
    }
    if(entities[i].team == local.player.team && entities[i].glow) {
      friendlyTeam.push(entities[i]);
    } else if(!entities[i].bad && entities[i].glow) {
      enemyTeam.push(entities[i]);
    }
    // export our two teams
    module.exports.friendlyTeam = friendlyTeam;
    module.exports.enemyTeam = enemyTeam;
  }
}

/**
 * Manage the loop that continously reads + updates the entity list
 */
class readLoop {
  constructor() {
    this.looptime = 5; // loop time, in ms

    /**
     * Read all the entities then do it again after looptime ms
     */
    this.loop = () => {
      readEntities();
      setTimeout(this.loop, this.looptime);
    };
    this.loop();
  }
}
module.exports.readLoop = readLoop;

module.exports.readEntities = readEntities;

/**
 * Gets the entity with the specific ID (index)
 * @param {Number} id index
 */
module.exports.getEntity = (id) => {
  return entities[id];
}
