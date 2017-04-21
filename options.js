const form = document.getElementById('options-form')
const btn = form.querySelector('button')

form.addEventListener('submit', e => {
	e.preventDefault()
	const data = Array.prototype.reduce.call(form.elements, (obj, el) => {
		obj[el.name] = el.value
		return obj
	}, {})
	delete data['']
	if (browser.permissions) {
		browser.permissions.request({
			permissions: ['webRequest', 'webRequestBlocking'],
			origins: [data.base_url + '*']
		})
	}
	browser.storage.local.set({server: data}).then(() => {
		btn.innerHTML = 'Saved!'
		setTimeout(() => {
			btn.innerHTML = 'Save'
		}, 600)
	})
})

browser.storage.local.get('server').then(({server}) => {
	if (!server) {
		return
	}
	for (const x of Object.keys(server)) {
		const el = form.querySelector('[name="' + x + '"]')
		if (el) {
			el.value = server[x]
		}
	}
})