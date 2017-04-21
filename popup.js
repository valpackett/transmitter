'use strict'

const torrentsPane = document.getElementById('torrents-pane')
const configPane = document.getElementById('config-pane')

document.getElementById('config-opener').addEventListener('click', e => {
	browser.runtime.openOptionsPage()
})

function showConfig (server) {
	torrentsPane.hidden = true
	configPane.hidden = false
}

const torrentsList = document.getElementById('torrents-list')
const torrentsTpl = document.getElementById('torrents-tpl')
const getArgs = {
	ids: 'recently-active',
	fields: ['name']
}

function showTorrents (server) {
	torrentsPane.hidden = false
	configPane.hidden = true
	rpcCall('torrent-get', getArgs).then(server => {
		console.log(server)
		const args = server.arguments
		torrentsList.innerHTML = ''
		for (const torr of args.torrents) {
			console.log(torr)
			const node = document.importNode(torrentsTpl.content, true)
			node.querySelector('.torrent-name').innerHTML = torr.name
			torrentsList.appendChild(node)
		}
	})
}

browser.storage.local.get('server').then(({server}) => {
	if (server && server.base_url && server.base_url !== '') {
		showTorrents(server)
	} else {
		showConfig(server)
	}
})