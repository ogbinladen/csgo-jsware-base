const memoryjs = require('memoryjs');
const off = require('./offsets');

const processName = "csgo.exe";

const csgoprocess = memoryjs.openProcess(processName);

const moduleClient = memoryjs.findModule("client.dll", csgoprocess.th32ProcessID);
const clientDLL = moduleClient.modBaseAddr;

const moduleEngine = memoryjs.findModule("engine.dll", csgoprocess.th32ProcessID);
const engineDLL = moduleEngine.modBaseAddr;

/**
 * Reads memory at the given address
 * @param {number} address memory address
 * @param {String} type type of data to read, ex "int", "float", "string"
 */
function read(address, type) {
  return memoryjs.readMemory(address,  type);
}

module.exports.read = read;

/**
 * Read memory offset from the clientDLL base address
 * @param {number} add memory offset from clientDLL
 * @param {String} type type of data to read, ex "int", "float", "string"
 */
module.exports.readClient = (add, type) => {
  return read(clientDLL + add,  type);
}

/**
 * Read memory offset from the engineDLL base address
 * @param {number} add memory offset from engineDLL
 * @param {String} type type of data to read, ex "int", "float", "string"
 */
module.exports.readEngine = (add, type) => {
  return read(engineDLL + add, type);
}

var dwClientState;

/**
 * Read memory offset from the dwClientState (engineDLL + dwClientState) base address
 * @param {number} add memory offset from dwClientState
 * @param {String} type type of data to read, ex "int", "float", "string"
 */
module.exports.readClientState = (add, type) => {
  if(!dwClientState) {
    dwClientState =  read(engineDLL + off('dwClientState'),  "int");;
  }
  return read(dwClientState + add, type);
}

/**
 * Write data to the given memory address
 * @param {number} address address of memory to write to
 * @param {*} data the data to write
 * @param {String} type the type of the data
 */
function write(address, data, type) {
  memoryjs.writeMemory(address, data, type);
}

module.exports.write = write;

/**
 * Write data offset from the ClientDLL base address
 * @param {number} address offset from ClientDLL of memory to write to
 * @param {*} data the data to write
 * @param {String} type the type of the data
 */
module.exports.writeClient = (add, data, type) => {
  write(clientDLL + add, data, type);
}

/**
 * Write data offset from the EngineDLL base address
 * @param {number} address offset from EngineDLL of memory to write to
 * @param {*} data the data to write
 * @param {String} type the type of the data
 */
module.exports.writeEngine = (add, data, type) => {
  write(engineDLL + add, data, type);
}

/**
 * Write data offset from the dwClientState (engineDLL + dwClientState) base address
 * @param {number} address offset from dwClientState of memory to write to
 * @param {*} data the data to write
 * @param {String} type the type of the data
 */
module.exports.writeClientState = (add, data, type) => {
  if(!dwClientState) {
    dwClientState =  read(engineDLL + off('dwClientState'),  "int");;
  }
  write(dwClientState + add, data, type);
}
