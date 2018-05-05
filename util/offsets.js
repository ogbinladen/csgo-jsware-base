const fs = require('fs');

var offs;

function loadOffsets() {
  offs = JSON.parse(fs.readFileSync('offs.json')); //testing directory
}

loadOffsets();

module.exports = function(name) {
  if(name) {
    var signaturesIndex = Object.keys(offs.signatures).indexOf(name);
    var netvarsIndex = Object.keys(offs.netvars).indexOf(name);
    if(signaturesIndex != -1) {
      return offs.signatures[name];
    } else if (netvarsIndex != -1) {
      return offs.netvars[name];
    }
  }
  console.log("Offset: " + name + " is bad");
  return -1;
}
