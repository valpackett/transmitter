const form = document.getElementById('options-form')
const warning = document.getElementById('warning')
const saveBtn = form.querySelector('#save')
const locations = form.querySelector('#locations')
const location_name = form.querySelector('#location_name')
const location_path = form.querySelector('#location_path')
const location_new = form.querySelector('#location_new')
const location_delete = form.querySelector('#location_delete')

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

locations.addEventListener('change', refreshLocationEditor);

function refreshLocationEditor () {
	if (locations.selectedIndex == -1) {
		location_name.value = ''
		location_path.value = ''
		location_name.disabled = true
		location_path.disabled = true
		location_delete.disabled = true
	} else {
		let option = locations.options[locations.selectedIndex]
		location_name.value = option.dataset.name
		location_path.value = option.dataset.path
		location_name.disabled = false
		location_path.disabled = false
		location_delete.disabled = false
	}
}

location_name.addEventListener('input', () => {
	let option = locations.options[locations.selectedIndex]
	option.dataset.name = location_name.value
	refreshLocationOptionText(option)
});

location_path.addEventListener('input', () => {
	let option = locations.options[locations.selectedIndex]
	option.dataset.path = location_path.value
	refreshLocationOptionText(option)
});

location_delete.addEventListener('click', () => {
	locations.options[locations.selectedIndex].remove()
	if (locations.options.length > 1) {
		locations.selectedIndex = locations.options.length - 1
	}
	refreshLocationEditor();
});

location_new.addEventListener('click', () => {
	let option = createLocationOption('New location', '/path/to/location')
	locations.appendChild(option)
	locations.selectedIndex = locations.options.length - 1
	refreshLocationEditor()
	location_name.select()
});

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