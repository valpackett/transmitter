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

const torrentsSearch = document.getElementById('torrents-search')
const torrentsList = document.getElementById('torrents-list')
const torrentsTpl = document.getElementById('torrents-tpl')
const torrentsError = document.getElementById('torrents-error')
const getArgs = {
	fields: ['name', 'percentDone', 'rateDownload', 'rateUpload', 'queuePosition']
}
let cachedTorrents = []

function renderTorrents (newTorrents) {
	if (torrentsList.children.length < newTorrents.length) {
		const dif = newTorrents.length - torrentsList.children.length
		for (let i = 0; i < dif; i++) {
			const node = document.importNode(torrentsTpl.content, true)
			torrentsList.appendChild(node)
		}
	} else if (torrentsList.children.length > newTorrents.length) {
		const oldLen = torrentsList.children.length
		const dif = oldLen - newTorrents.length
		for (let i = 1; i <= dif; i++) {
			torrentsList.removeChild(torrentsList.children[oldLen - i])
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
}

function searchTorrents () {
	let newTorrents = cachedTorrents
	const val = torrentsSearch.value.toLowerCase().trim()
	if (val.length > 0) {
		newTorrents = newTorrents.filter(x => x.name.toLowerCase().includes(val))
	}
	renderTorrents(newTorrents)
}
torrentsSearch.addEventListener('change', searchTorrents)
torrentsSearch.addEventListener('keyup', searchTorrents)

function refreshTorrents (server) {
	return rpcCall('torrent-get', getArgs).then(response => {
		let newTorrents = response.arguments.torrents
		newTorrents.sort((x, y) => y.queuePosition - x.queuePosition)
		cachedTorrents = newTorrents
		torrentsSearch.hidden = newTorrents.length <= 8
		if (torrentsSearch.hidden) {
			torrentsSearch.value = ''
			renderTorrents(newTorrents)
		} else {
			searchTorrents()
		}
	})
}

function refreshTorrentsLogErr (server) {
	return refreshTorrents(server).catch(err => {
		console.error(err)
		torrentsError.textContent = 'Error: ' + err.toString()
	})
}

function showTorrents (server) {
	torrentsPane.hidden = false
	configPane.hidden = true
	for (const opener of document.querySelectorAll('.webui-opener')) {
		opener.href = server.base_url + 'web/'
	}
	refreshTorrents(server).catch(_ => refreshTorrentsLogErr(server))
	setInterval(() => refreshTorrentsLogErr(server), 2000)
}

browser.storage.local.get('server').then(({server}) => {
	if (server && server.base_url && server.base_url !== '') {
		showTorrents(server)
	} else {
		showConfig(server)
	}
})
