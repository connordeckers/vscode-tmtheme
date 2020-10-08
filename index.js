import fs from 'fs';
import path from 'path';
import xml from 'xml2js';
import { argv } from 'process';

const files = argv.slice(2);
if (files.length == 0) {
  console.log('You need to provide at least one file to process and insert.');
  process.exit(1);
}

let success = 0;
files.forEach((f) => {
  const file = fs.readFileSync(f, 'utf-8');
  xml.parseString(file, (err, data) => {
    if (err) {
      console.error(err.message);
      return;
    }

    const dataset = data.plist.dict[0];

    const name = dataset.string[dataset.key.indexOf('name')]
      .split(/[^a-z0-9 -_]+/i)[0]
      .trim();

    const author = (dataset.string[dataset.key.indexOf('author')] ?? '').trim();

    const safeName = name.toLowerCase().replace(/\W/g, '-');
    const themeBase = path.resolve(process.env.HOME, '.vscode/extensions');
    const themeDir = path.join(themeBase, `theme-${safeName}`);
    fs.mkdirSync(themeDir, { recursive: true });

    fs.writeFileSync(
      path.join(themeDir, 'package.json'),
      JSON.stringify({
        name: safeName,
        version: '1.0.0',
        engines: { vscode: '^1.22.0' },
        publisher: author,
        contributes: {
          themes: [
            {
              label: name,
              uiTheme: 'vs-dark', // use "vs" to select the light UI theme
              path: `./${safeName}.tmTheme`,
            },
          ],
        },
      })
    );

    fs.copyFileSync(f, path.join(themeDir, `${safeName}.tmTheme`));
    success++;
  });
});

console.log('%d themes installed successfully.', success);
process.exit(0);
