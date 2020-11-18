'use strict'

////// Session extraction

function setupExtractor () {
	browser.webRequest.onHeadersReceived.removeListener(extractSession)
	browser.storage.local.get('server').then(({server}) => {
		if (!server) {
			return
		}
		console.log('Session extractor setup for', server.base_url)
		browser.webRequest.onBeforeSendHeaders.addListener(
			extractSession, {urls: [server.base_url + '*']}, ['requestHeaders']
		)
	})
}

setupExtractor()

function extractSession (requestDetails) {
	const hdr = requestDetails.requestHeaders
		.filter(x => x.name.toLowerCase() === 'x-transmission-session-id')[0]
	if (!hdr) {
		return
	}
	browser.storage.local.get('server').then(({server}) => {
		server.session = hdr.value
		browser.storage.local.set({server})
	})
}

////// Adding

function blobToBase64 (blob) {
	return new Promise((resolve, reject) => {
		const rdr = new FileReader()
		rdr.onload = () => resolve(rdr.result.substr(rdr.result.indexOf(',') + 1))
		rdr.onerror = reject
		rdr.readAsDataURL(blob)
	})
}

function addUrl (torrentUrl, downloadDir) {
	let p
	let params = {}
	if (downloadDir) {
		params = { 'download-dir': downloadDir }
	}
	if (torrentUrl.startsWith('magnet:')) {
		console.log('Adding magnet', torrentUrl)
		params.filename = torrentUrl
		p = rpcCall('torrent-add', params)
	} else {
		// Download the torrent file *in the browser* to support private torrents
		console.log('Downloading torrent', torrentUrl)
		p = fetch(torrentUrl, {
			method: 'GET',
			credentials: 'include',
		}).then(resp => {
			if (resp.ok) {
				return resp.blob()
			}
			throw new Error('Could not download torrent')
		}).then(blobToBase64).then(b64 => {
			params.metainfo = b64
			return rpcCall('torrent-add', params)
		})
	}
	return p.then(x => {
		updateBadge()
		return x
	})
}

////// magnet: Handler

function handleUrl (requestDetails) {
	return addUrl(decodeURIComponent(requestDetails.url.replace('http://transmitter.web-extension/', '')))
		.then(x => {
			return browser.storage.local.get('server').then(({server}) => {
				return { redirectUrl: server.base_url + 'web/' }
			})
		})
}

browser.webRequest.onBeforeRequest.addListener(
	handleUrl, { urls: ['http://transmitter.web-extension/*'] }, ['blocking']
)

////// Context menu

function createContextMenu () {
	browser.storage.local.get('server').then(({server}) => {
		browser.contextMenus.removeAll()
		if (!server || !server.locations || !server.locations.length) {
			browser.contextMenus.create({
				id: 'transmitter-add',
				title: 'Download with Transmission remote',
				contexts: ['link']
			})
		} else {
			browser.contextMenus.create({
				id: 'transmitter-add',
				title: 'Download to Default location',
				contexts: ['link']
			})
			server.locations.forEach(location => {
				browser.contextMenus.create({
					id: 'transmitter-add-loc-' + location.index,
					title: 'Download to ' + location.name,
					contexts: ['link']
				})
			})
		}
	})
}

createContextMenu()

browser.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === 'transmitter-add') {
		return addUrl(info.linkUrl)
	} else if (info.menuItemId.startsWith('transmitter-add-loc-')) {
		let index = parseInt(info.menuItemId.substr('transmitter-add-loc-'.length))
		browser.storage.local.get('server').then(({server}) => {
			let path = server.locations[index].path
			addUrl(info.linkUrl, path)
		})
	}
})

////// Badge

function updateBadge () {
	browser.storage.local.get('server').then(({server}) => {
		if (!server || server.badge === 'off') {
			browser.browserAction.setBadgeBackgroundColor({color: 'gray'})
			browser.browserAction.setBadgeText({text: ''})
			return
		}
		return rpcCall('session-stats', {}).then(response => {
			const args = response.arguments // lol the name 'arguments' means destructuring in strict mode is impossible
			switch (server.badge) {
			case 'num':
				browser.browserAction.setBadgeBackgroundColor({color: 'gray'})
				browser.browserAction.setBadgeText({text: '' + args.activeTorrentCount})
				break
			case 'dl':
				browser.browserAction.setBadgeBackgroundColor({color: 'green'})
				browser.browserAction.setBadgeText({text: formatSpeed(args.downloadSpeed)})
				break
			case 'ul':
				browser.browserAction.setBadgeBackgroundColor({color: 'blue'})
				browser.browserAction.setBadgeText({text: formatSpeed(args.uploadSpeed)})
				break
			case 'auto':
				if (args.downloadSpeed > 0) {
					browser.browserAction.setBadgeBackgroundColor({color: 'green'})
					browser.browserAction.setBadgeText({text: formatSpeed(args.downloadSpeed)})
				} else if (args.uploadSpeed > 0) {
					browser.browserAction.setBadgeBackgroundColor({color: 'blue'})
					browser.browserAction.setBadgeText({text: formatSpeed(args.uploadSpeed)})
				} else {
					browser.browserAction.setBadgeBackgroundColor({color: 'gray'})
					browser.browserAction.setBadgeText({text: '' + args.activeTorrentCount})
				}
				break
			}
		})
	})
}

browser.alarms.onAlarm.addListener(alarm => {
	if (alarm.name === 'transmitter-badge-update') {
		return updateBadge()
	}
})

function setupBadge () {
	browser.alarms.clear('transmitter-badge-update').then(x => {
		browser.storage.local.get('server').then(({server}) => {
			if (server && server.badge !== 'off') {
				browser.alarms.create('transmitter-badge-update', {
					periodInMinutes: parseInt(server.badge_interval || '1')
				})
			}
			updateBadge()
		})
	})
}

setupBadge()

////// Storage updates

browser.storage.onChanged.addListener((changes, area) => {
	if (!Object.keys(changes).includes('server')) {
		return
	}
	const oldv = changes.server.oldValue
	const newv = changes.server.newValue
	if (!oldv || oldv.base_url !== newv.base_url || oldv.username !== newv.username ||
		oldv.password !== newv.password || oldv.badge_interval !== newv.badge_interval || oldv.badge !== newv.badge ||
		arraysEqualDeep(oldv.locations, newv.locations)) {
		setupExtractor()
		setupBadge()
		updateBadge()
		createContextMenu()
	}
})

function arraysEqualDeep (arr1, arr2) {
	return JSON.stringify(arr1) !== JSON.stringify(arr2)
}
