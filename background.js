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

function addUrl (torrentUrl) {
	let p
	if (torrentUrl.startsWith('magnet:')) {
		console.log('Adding magnet', torrentUrl)
		p = rpcCall('torrent-add', { filename: torrentUrl })
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
			return rpcCall('torrent-add', { metainfo: b64 })
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

browser.contextMenus.create({
	id: 'transmitter-add',
	title: 'Download with Transmission remote',
	contexts: ['link']
})

browser.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === 'transmitter-add') {
		return addUrl(info.linkUrl)
	}
})

////// Badge

function updateBadge () {
	browser.storage.local.get('server').then(({server}) => {
		if (server.badge !== 'num' && server.badge !== 'dl' && server.badge !== 'ul') {
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
			if (!server) {
				return
			}
			browser.alarms.create('transmitter-badge-update', {
				periodInMinutes: parseInt(server.badge_interval || '1')
			})
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
		oldv.password !== newv.password || oldv.badge_interval !== newv.badge_interval || oldv.badge !== newv.badge) {
		setupExtractor()
		setupBadge()
		updateBadge()
	}
})
