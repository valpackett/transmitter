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
		const newTorrents = response.arguments.torrents
		if (torrentsList.children.length < newTorrents.length) {
			const dif = newTorrents.length - torrentsList.children.length
			for (let i = 0; i < dif; i++) {
				const node = document.importNode(torrentsTpl.content, true)
				torrentsList.appendChild(node)
			}
		} else if (torrentsList.children.length > newTorrents.length) {
			const dif = torrentsList.children.length - newTorrents.length
			for (let i = 1; i <= dif; i++) {
				torrentsList.removeChild(torrentsList.children[torrentsList.children.length - i])
			}
		}
		for (let i = 0; i < newTorrents.length; i++) {
			const torr = newTorrents[i]
			const cont = torrentsList.children[i]
			const speeds = '↓ ' + formatSpeed(torr.rateDownload) + 'B/s ↑ ' + formatSpeed(torr.rateUpload) + 'B/s'
			cont.querySelector('.torrent-name').textContent = torr.name
			cont.querySelector('.torrent-speeds').textContent = speeds
			cont.querySelector('.torrent-progress').value = torr.percentDone * 100
		}
	}).catch(err => {
		console.error(err)
		torrentsError.textContent = 'Error: ' + err.description
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