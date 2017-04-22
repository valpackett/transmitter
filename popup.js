'use strict'

const torrentsPane = document.getElementById('torrents-pane')
const configPane = document.getElementById('config-pane')

for (const opener of document.querySelectorAll('.config-opener')) {
	opener.addEventListener('click', e => {
		browser.runtime.openOptionsPage()
	})
}

function showConfig (server) {
	torrentsPane.hidden = true
	configPane.hidden = false
}

const torrentsList = document.getElementById('torrents-list')
const torrentsTpl = document.getElementById('torrents-tpl')
const torrentsError = document.getElementById('torrents-error')
const getArgs = {
	fields: ['name', 'percentDone', 'rateDownload', 'rateUpload']
}

function refreshTorrents (server) {
	rpcCall('torrent-get', getArgs).then(response => {
		const args = response.arguments
		torrentsList.innerHTML = ''
		for (const torr of args.torrents) {
			const node = document.importNode(torrentsTpl.content, true)
			node.querySelector('.torrent-name').innerHTML = torr.name
			node.querySelector('.torrent-speeds').innerHTML =
				'↓ ' + formatSpeed(torr.rateDownload) + 'B/s ↑ ' + formatSpeed(torr.rateUpload) + 'B/s'
			node.querySelector('.torrent-progress').value = torr.percentDone * 100
			torrentsList.appendChild(node)
		}
	}).catch(err => {
		console.error(err)
		torrentsError.innerHTML = 'Error: ' + err.description
	})
}

function showTorrents (server) {
	torrentsPane.hidden = false
	configPane.hidden = true
	for (const opener of document.querySelectorAll('.webui-opener')) {
		opener.href = server.base_url + 'web/'
	}
	refreshTorrents(server)
	setInterval(() => refreshTorrents(server), 2000)
}

browser.storage.local.get('server').then(({server}) => {
	if (server && server.base_url && server.base_url !== '') {
		showTorrents(server)
	} else {
		showConfig(server)
	}
})