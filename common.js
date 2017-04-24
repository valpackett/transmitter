'use strict'

////// RPC

function rpcCall (meth, args) {
	return browser.storage.local.get('server').then(({server}) => {
		return fetch(server.base_url + 'rpc', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-transmission-session-id': server.session
			},
			body: JSON.stringify({method: meth, arguments: args}),
			credentials: 'include' // allows HTTPS client certs!
		}).then(response => {
			const session = response.headers.get('x-transmission-session-id')
			if (session) {
				browser.storage.local.get('server').then(({server}) => {
					server.session = session
					browser.storage.local.set({server})
				})
			}
			if (response.status === 409) {
				return rpcCall(meth, args)
			}
			if (response.status >= 200 && response.status < 300) {
				return response
			}
			const error = new Error(response.statusText)
			error.response = response
			throw error
		}).then(response => response.json())
	})
}

////// Util

function formatSpeed (s) {
	// Firefox shows 4 characters max
	if (s < 1000 * 1000) {
		return (s / 1000).toFixed() + 'K'
	}
	if (s < 1000 * 1000 * 1000) {
		return (s / 1000 / 1000).toFixed() + 'M'
	}
	// You probably don't have that download speed…
	return (s / 1000 / 1000 / 1000).toFixed() + 'T'
}