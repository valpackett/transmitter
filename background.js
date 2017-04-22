'use strict'

//browser.storage.local.set({server: {base_url: 'https://andasreth.lan/transmission/'}}).then(setupExtractor)

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
browser.storage.onChanged.addListener((changes, area) => {
	if (Object.keys(changes).includes('server')
		&& changes.server.oldValue
		&& changes.server.newValue.base_url !== changes.server.oldValue.base_url) {
		setupExtractor()
	}
})

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

function addUrl (torrent_url) {
	console.log('Adding URL', torrent_url)
	return rpcCall('torrent-add', {
		filename: torrent_url
	}).then(x => {
		updateBadge()
		return x
	})
}

////// magnet: Handler

function handleUrl (requestDetails) {
	return addUrl(decodeURIComponent(requestDetails.url.replace('http://transmitter.-web-extension/', '')))
	.then(x => {
		return browser.storage.local.get('server').then(({server}) => {
			return { redirectUrl: server.base_url + 'web/' }
		})
	})
}

browser.webRequest.onBeforeRequest.addListener(
	handleUrl, { urls: ['http://transmitter.-web-extension/*'] }, ['blocking']
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

browser.storage.onChanged.addListener((changes, area) => {
	if (Object.keys(changes).includes('server')
		&& changes.server.oldValue
		&& (changes.server.newValue.badge_interval !== changes.server.oldValue.badge_interval
		 || changes.server.newValue.badge !== changes.server.oldValue.badge)) {
		setupBadge()
	}
})
setupBadge()
