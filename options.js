const form = document.getElementById('options-form')
const warning = document.getElementById('warning')
const saveBtn = form.querySelector('#save')
const locations = form.querySelector('#locations')
const locationName = form.querySelector('#location_name')
const locationPath = form.querySelector('#location_path')
const locationNew = form.querySelector('#location_new')
const locationDelete = form.querySelector('#location_delete')

form.addEventListener('submit', e => {
	e.preventDefault()
	const data = Array.prototype.reduce.call(form.elements, (obj, el) => {
		obj[el.name] = el.value
		return obj
	}, {})
	delete data['']
	data.locations = saveLocations()
	/*
	When this works everywhere, replace <all_urls> with http://transmitter.web-extension/* in manifest.json.
	Unfortunately, right now this is unsupported in Firefox and Edge…
	and even worse, in Opera the API exists but requesting a user-specified host is not possible!

	if (browser.permissions) {
		browser.permissions.request({
			permissions: ['webRequest', 'webRequestBlocking'],
			origins: [data.base_url + '*']
		})
	}
	*/
	if (!data.base_url.endsWith('/transmission/')) {
		warning.innerHTML = 'WARNING: Server URL does not end with /transmission/ — make sure it is correct! (If you actually customized it on the server side, it will work fine.)'
		warning.hidden = false
	} else {
		warning.hidden = true
	}
	browser.storage.local.set({server: data}).then(() => {
		saveBtn.innerHTML = 'Saved!'
		setTimeout(() => {
			saveBtn.innerHTML = 'Save'
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
		} else if (x === 'locations') {
			renderLocations(server[x])
		}
	}
})

function renderLocations (locationsData) {
	locations.querySelectorAll('option:not(:first-child)').forEach(opt => opt.remove())
	locationsData.map(loc => createLocationOption(loc.name, loc.path))
		.forEach(opt => locations.appendChild(opt))
}

locations.addEventListener('change', refreshLocationEditor)

function refreshLocationEditor () {
	if (locations.selectedIndex === -1) {
		locationName.value = ''
		locationPath.value = ''
		locationName.disabled = true
		locationPath.disabled = true
		locationDelete.disabled = true
	} else {
		let option = locations.options[locations.selectedIndex]
		locationName.value = option.dataset.name
		locationPath.value = option.dataset.path
		locationName.disabled = false
		locationPath.disabled = false
		locationDelete.disabled = false
	}
}

locationName.addEventListener('input', () => {
	let option = locations.options[locations.selectedIndex]
	option.dataset.name = locationName.value
	refreshLocationOptionText(option)
})

locationPath.addEventListener('input', () => {
	let option = locations.options[locations.selectedIndex]
	option.dataset.path = locationPath.value
	refreshLocationOptionText(option)
})

locationDelete.addEventListener('click', () => {
	locations.options[locations.selectedIndex].remove()
	if (locations.options.length > 1) {
		locations.selectedIndex = locations.options.length - 1
	}
	refreshLocationEditor()
})

locationNew.addEventListener('click', () => {
	let option = createLocationOption('New location', '/path/to/location')
	locations.appendChild(option)
	locations.selectedIndex = locations.options.length - 1
	refreshLocationEditor()
	locationName.select()
})

function createLocationOption (name, path) {
	let option = document.createElement('option')
	option.dataset.name = name
	option.dataset.path = path
	refreshLocationOptionText(option)
	return option
}

function refreshLocationOptionText (option) {
	option.innerText = option.dataset.name + ' [' + option.dataset.path + ']'
}

function saveLocations () {
	return [...locations.querySelectorAll('option:not(:first-child)')]
		.map((opt, index) => ({ name: opt.dataset.name, path: opt.dataset.path, index: index }))
}
