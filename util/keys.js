// https://msdn.microsoft.com/en-us/library/windows/desktop/dd375731(v=vs.85).aspx

const aks = require('asynckeystate');

let binds = [];

function getKeyState(key) {
  return aks.getAsyncKeyState(key);
}

module.exports.getKeyState = getKeyState;

function unbind(key) {
  for(let i = 0; i < binds.length; i++) {
    if(binds[i].key == key) {
      binds.splice(i, 1);
      return;
    }
  }
}

/**
 * Binds a function to a key
 * @param {number} key the key to listen for
 * @param {*} pressedFunction the function to run when the key is pressed
 * @param {*} continuous countinously call the function while the key is held?
 * @param {*} releasedFunction the function to run when the key is released (optional)
 */
function bind(key, pressedFunction, continuous, releasedFunction) {
  unbind(key);
  if(releasedFunction) {
    binds.push({key: key, pressedFunction: pressedFunction, continuous: continuous, releasedFunction: releasedFunction, pressed:false});
  } else {
    binds.push({key: key, pressedFunction: pressedFunction, continuous: continuous, pressed: false});
  }
}

module.exports.bind = bind;

function checkBinds() {
  for(let i = 0; i < binds.length; i++) {
    if(getKeyState(binds[i].key) && (binds[i].continuous || !binds[i].pressed)) {
      binds[i].pressedFunction();
      binds[i].pressed = true;
    } else if (binds[i].releasedFunction && binds[i].pressed && !getKeyState(binds[i].key)) {
      binds[i].releasedFunction();
      binds[i].pressed = false;
    } else if (!getKeyState(binds[i].key)) {
      binds[i].pressed = false;
    }
  }
}

/**
 * Manage the input loop, which continously runs and checks for key presses
 */
class inputLoop {
  constructor() {
    this.looptime = 5;
    this.loop = () => {
      checkBinds();
      setTimeout(this.loop, this.looptime);
    };
    this.setLooptime = (time) => {
      this.looptime = time;
    };
    this.loop();
  }
}
module.exports.inputLoop = inputLoop;
