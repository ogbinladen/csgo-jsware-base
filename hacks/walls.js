const glow = require('../csgo/glow.js');
const entities = require('../csgo/entities.js');

const aimbot = require('./aimbot.js');

function showWalls() {
  const friendlyTeam = entities.friendlyTeam;
  const enemyTeam = entities.enemyTeam;
  for (i = 0; i < friendlyTeam.length; i++) {
    var R = 0, G = 191, B=255, A=150;
    friendlyTeam[i].glow(R, G, B, A);
  }
  for (i = 0; i < enemyTeam.length; i++) {
    var R = (255 * (100 - enemyTeam[i].health)) / 100, G = (255 * enemyTeam[i].health) / 100, B = 0, A = 180;
    if(aimbot.aimTarget && aimbot.aimTarget.index == enemyTeam[i].index) {
      A = 255;
    }
    enemyTeam[i].glow(R, G, B, A);
  }
}

var wallInterval;

function enableWalls(loopTime) {
  if(!loopTime)
    loopTime = 10;
  if(wallInterval)
    clearInterval(wallInterval)
  wallInterval = setInterval(showWalls, loopTime);
}

function disableWalls() {
  if(wallInterval)
    clearInterval(wallInterval)
}

module.exports.enableWalls = enableWalls;
module.exports.disableWalls = disableWalls;
