const fs = require('fs');
const path = require('path');
const archiver = require('archiver');


const output = fs.createWriteStream(path.join(process.cwd(), 'octopus-os-final-release.zip'));
const archive = archiver.create('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archiver has been finalized and the output file descriptor has closed.');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

console.log('Adding files...');
archive.glob('**/*', {
  cwd: process.cwd(),
  ignore: ['node_modules/**', '.git/**', 'artifacts/validation/**', '*.zip']
});

archive.finalize();
