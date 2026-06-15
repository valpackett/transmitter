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
	fields: ['id', 'name', 'percentDone', 'rateDownload', 'rateUpload', 'queuePosition', 'status']
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
		const progress = cont.querySelector('.torrent-progress')
		cont.querySelector('.torrent-name').textContent = torr.name
		cont.querySelector('.torrent-speeds').textContent = speeds
		cont.querySelector('.torrent-progress').value = torr.percentDone * 100

		const pauseResumeBtn = cont.querySelector('.pause-resume-btn')
		const isComplete = torr.percentDone === 1
		const isRunning = torr.status !== 0 && !isComplete
		
		if (isComplete) {
			pauseResumeBtn.textContent = '✓'
			pauseResumeBtn.title = 'Complete - Seeding'
			pauseResumeBtn.classList.remove('paused-state', 'running-state')
			pauseResumeBtn.classList.add('complete-state')
			pauseResumeBtn.disabled = true
			progress.classList.toggle('complete', true)
		} else if (isRunning) {
			pauseResumeBtn.textContent = '⏸'
			pauseResumeBtn.title = 'Pause'
			pauseResumeBtn.classList.remove('paused-state', 'complete-state')
			pauseResumeBtn.classList.add('running-state')
			pauseResumeBtn.disabled = false
			progress.classList.toggle('paused', false)
		} else {
			pauseResumeBtn.textContent = '▶'
			pauseResumeBtn.title = 'Resume'
			pauseResumeBtn.classList.remove('running-state', 'complete-state')
			pauseResumeBtn.classList.add('paused-state')
			pauseResumeBtn.disabled = false
			progress.classList.toggle('paused', true)
		}
		
		pauseResumeBtn.onclick = async (e) => {
			e.preventDefault()
			e.stopPropagation()
			
			if (isRunning) {
				await rpcCall('torrent-stop', { ids: [torr.id] })
			} else if (!isComplete) {
				await rpcCall('torrent-start', { ids: [torr.id] })
			}
			browser.storage.local.get('server').then(({server}) => {
				if (server && server.base_url) {
					refreshTorrentsLogErr(server)
				}
			})
		}

		const deleteBtn = cont.querySelector('.remove-torrent-btn')
		
		deleteBtn.onclick = async (e) => {
			e.preventDefault()
			e.stopPropagation()

			if (torr.percentDone < 1) {
				const confirmed = await showConfirm(`"${torr.name}" is incomplete.\nRemove it AND delete downloaded data?`);
				if (confirmed) {
					removeTorrents([torr.id], true);
				}
			} else {
				const confirmed = await showConfirm(`"${torr.name}" is complete and seeding.\nRemove from list? Downloaded data will be kept.`);
				if (confirmed) {
					removeTorrents([torr.id], false);
				}
			}
		}
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

async function removeTorrents(ids, deleteData = false) {
	if (!ids || ids.length === 0) return;
	try {
		const args = { ids: ids };
		
		if (deleteData === true) {
			args['delete-local-data'] = true;
		}

		await rpcCall('torrent-remove', args);
		
		browser.storage.local.get('server').then(({server}) => {
			if (server && server.base_url) {
				refreshTorrentsLogErr(server);
			}
		});
	} catch (err) {
		console.error("Transmitter: Failed to remove torrents", err);
	}
}

function showConfirm(message) {
	return new Promise((resolve) => {
		const dialog = document.getElementById('custom-modal');
		const text = document.getElementById('modal-text');
		const btnYes = document.getElementById('modal-yes');
		const btnCancel = document.getElementById('modal-cancel');

		text.textContent = message;
		dialog.showModal();

		const cleanup = () => {
			dialog.close();
			btnYes.onclick = null;
			btnCancel.onclick = null;
		};

		btnYes.onclick = () => { cleanup(); resolve(true); };
		btnCancel.onclick = () => { cleanup(); resolve(false); };
	});
}

document.getElementById('clear-completed').addEventListener('click', async (e) => {
	e.preventDefault();

	const completedIds = cachedTorrents
		.filter(t => t.percentDone === 1)
		.map(t => t.id);

	if (completedIds.length > 0) {
		const confirmed = await showConfirm(`Remove ${completedIds.length} completed torrent(s) from list? Downloaded data will be kept.`)
		if (confirmed) {
			removeTorrents(completedIds, false)
		}
	}
});
