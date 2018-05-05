const csgo = require('../util/process.js');
const off = require('../util/offsets.js');

const ents = require('./entities.js');

const glowPointer = csgo.readClient(off('dwGlowObjectManager'), "int");

function glowEntity(entity, R, G, B, A) {
  if (!entity || entity.bad){
    return;
  }
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x4), (R / 255), "float");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x8), (G / 255), "float");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0xC), (B / 255), "float");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x10), (A / 255), "float");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x24), true, "boolean");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x25), false, "boolean");
  csgo.write(glowPointer + ((entity.glowIndex * 0x38) + 0x26), false, "boolean");
}

module.exports.glowEntity = glowEntity;

// for testing remove later, break into "hacks" folder
module.exports.glow = () => {
  for (i = 0; i <= 32; i++) {
    entity = ents.getEntity(i);
		if (!entity || entity.bad){
			continue;
		}
		if(entity.team != -1) {
			// if(i == leader && leader != -1)
			// 	leader++
			var R = 0, G = 191, B=255, A=150;
      glowEntity(entity, R, G, B, A)
    } else /*if (!entities[i].dormant)*/ {

    }
  }
}
