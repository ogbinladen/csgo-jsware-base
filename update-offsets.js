var https = require('https');
var fs = require('fs');
var file = fs.createWriteStream("offs.json");

https.get('https://raw.githubusercontent.com/frk1/hazedumper/master/csgo.json', (res) => {
  console.log('Status Code:', res.statusCode);
  //console.log('headers:', res.headers);
  res.pipe(file);

}).on('error', (e) => {
  console.error(e);
});
