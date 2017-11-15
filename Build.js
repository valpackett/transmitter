'use strict'

const fs = require('fs')
const JSZip = require('jszip')

const CODE = [
	'browser-polyfill.min.js',
	'common.js',
	'background.js',
	'options.html', 'options.css', 'options.js',
	'popup.html', 'popup.css', 'popup.js',
	'icon.svg', 'icon48.png', 'gear.svg', 'info.svg'
]

function addCode (zip) {
	for (const name of CODE) {
		zip.file(name, fs.readFileSync(name))
	}
}

const fxzip = new JSZip()
addCode(fxzip)
fxzip.file('manifest.json', fs.readFileSync('manifest.json'))
fxzip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
	.pipe(fs.createWriteStream('transmitter-firefox.zip'))

const crzip = new JSZip()
addCode(crzip)
crzip.file('icon32.png', fs.readFileSync('icon32.png'))
crzip.file('icon128.png', fs.readFileSync('icon128.png'))
const crmanifest = require('./manifest.json')
delete crmanifest['applications']
delete crmanifest['protocol_handlers']
crmanifest.icons = crmanifest.browser_action.default_icon = {
	'128': 'icon128.png',
	'48': 'icon48.png',
	'32': 'icon32.png',
}
crzip.file('manifest.json', JSON.stringify(crmanifest))
crzip.generateNodeStream({type: 'nodebuffer', streamFiles: true})
	.pipe(fs.createWriteStream('transmitter-chropera.zip'))
