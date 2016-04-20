var mainfile = require.main ? require.main.filename : process.cwd();
var fs = require('fs');
var path = require('path');

try {
  var dir = mainfile.split('/').map(function (dir, index) {
    return mainfile.split('/').slice(0, index).join('/');
  }).filter(function (dir) {
    return !!dir;
  }).reverse().filter(function (dir) {
    return fs.existsSync(path.join(dir, 'package.json'));
  })[0] || process.cwd();

  var pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));

  module.exports = {
    "app":     pkg.name,
    "version": pkg.version,
    "node":    process.version
  };

} catch (er) {
  console.error('could not read the package.json', er.message);
}
