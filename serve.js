//
// This script will run a local development server. This is useful when
// developing the theme.
//
// Usage:
// `node serve`
//

const _ = require('underscore');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

var theme = require('./index.js');
var resume;

function reloadResume() {
    resume = JSON.parse(fs.readFileSync('node_modules/resume-schema/resume.json', 'utf8'));
}
reloadResume();

fs.watch(
    'node_modules/resume-schema/resume.json',
    (_curr, _prev)  => {
        console.log('Reloading resume!');
        reloadResume();
    }
);
_(['index.js', 'tpl/index.js']).forEach(filename => fs.watch(
    filename,
    (_eventType, _filename) => {
        console.log('Reloading template!');
        delete require.cache[require.resolve('./tpl/index')];
        delete require.cache[require.resolve('./index.js')];
        theme = require('./index.js');
    }
));

http.createServer(function(req, res) {
    const picture = resume.basics.picture && resume.basics.picture.replace(/^\//, '');

    if (picture && req.url.replace(/^\//, '') === picture.replace(/^.\//, '')) {
        const format = path.extname(picture);
        try {
            const image = fs.readFileSync(picture);
            res.writeHead(200, {
                'Content-Type': `image/${format}`,
            });
            res.end(image, 'binary');
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('Picture not found !');
                res.end();
            } else {
                throw error;
            }
        }
    } else if (req.url == '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });
        res.end(render());
    } else {
        res.writeHead(404);
    }
}).listen(PORT);

console.log(`Preview: http://localhost:${PORT}/`);
console.log('Serving..');

function render() {
    try {
        return theme.render(JSON.parse(JSON.stringify(resume)));
    } catch (e) {
        console.log(e.message);
        return '';
    }
}
