[
![Mozilla Add-on](https://img.shields.io/amo/v/transmitter-for-transmission.svg)
![Mozilla Stars](https://img.shields.io/amo/stars/transmitter-for-transmission.svg)
![Mozilla Downloads](https://img.shields.io/amo/d/transmitter-for-transmission.svg)
](https://addons.mozilla.org/firefox/addon/transmitter-for-transmission/)
[![unlicense](https://img.shields.io/badge/un-license-green.svg?style=flat)](https://unlicense.org)

# Transmitter

![Screenshot](https://addons.mozilla.org/user-media/previews/full/184/184029.png?modified=1622132727)

a WebExtension for the [Transmission](https://transmissionbt.com/) BitTorrent client.

- Adds a context menu item for downloading torrents (both `magnet`s and links to `.torrent` files) on your remote Transmission server.
- Adds a direct `magnet:` handler too. (Firefox only)
- Adds a browser action (popup toolbar icon thing) that lets you view existing torrents' status.
- You can even search in the popup if you have a lot of torrents.
- That button even has a badge (auto-updating torrent count / download speed / upload speed).
- The extension is very lightweight. Pure modern JavaScript, no library dependencies except for [a tiny polyfill for Chrome/Opera/etc. compatibility](https://github.com/mozilla/webextension-polyfill).
- Automatically picks up your session from the Transmission web UI, no need for separate authentication.
- Works fine if your Transmission instance is behind a reverse proxy that uses [TLS client certificates](https://github.com/valpackett/damnx509).

## Contributing

By participating in this project you agree to follow the [Contributor Code of Conduct](https://contributor-covenant.org/version/1/4/) and to release your contributions under the Unlicense.

[The list of contributors is available on GitHub](https://github.com/valpackett/transmitter/graphs/contributors).

## License

This is free and unencumbered software released into the public domain.  
For more information, please refer to the `UNLICENSE` file or [unlicense.org](https://unlicense.org).
