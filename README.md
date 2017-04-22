# Transmitter [![unlicense](https://img.shields.io/badge/un-license-green.svg?style=flat)](http://unlicense.org)

a WebExtension for the [Transmission](https://transmissionbt.com/) BitTorrent client.

- Adds a context menu item for downloading torrents (both `magnet`s and links to `.torrent` files) on your remote Transmission server.
- Adds a direct `magnet:` handler too. (Firefox only)
- Adds a browser action (popup toolbar icon thing) that lets you view existing torrents' status.
- That button even has a badge (auto-updating torrent count / download speed / upload speed).
- The extension is very lightweight. Pure modern JavaScript, no library dependencies except for [a tiny polyfill for Chrome/Opera/etc. compatibility](https://github.com/mozilla/webextension-polyfill). No build step.
- Automatically picks up your session from the Transmission web UI, no need for separate authentication.
- Works fine if your Transmission instance is behind a reverse proxy that uses [TLS client certificates](https://github.com/myfreeweb/damnx509).

The extension requires access to all domains because requesting a dynamically configured domain (the domain of your Transmission server) with [the permissions API](https://developer.chrome.com/extensions/permissions) not yet widely supported.
(API not implemented yet in Firefox and Edge, requesting a specific domain that's unknown at manifest writing time just does not work in Opera.)

Edge isn't supported yet because [it is weird](https://github.com/mozilla/webextension-polyfill/issues/3).
(But shouldn't be hard to support.)

## Contributing

By participating in this project you agree to follow the [Contributor Code of Conduct](http://contributor-covenant.org/version/1/4/) and to release your contributions under the Unlicense.

[The list of contributors is available on GitHub](https://github.com/myfreeweb/transmitter/graphs/contributors).

## License

This is free and unencumbered software released into the public domain.  
For more information, please refer to the `UNLICENSE` file or [unlicense.org](http://unlicense.org).