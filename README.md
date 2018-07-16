[
![Mozilla Add-on](https://img.shields.io/amo/v/transmitter-for-transmission.svg)
![Mozilla Stars](https://img.shields.io/amo/stars/transmitter-for-transmission.svg)
![Mozilla Downloads](https://img.shields.io/amo/d/transmitter-for-transmission.svg)
](https://addons.mozilla.org/en-US/firefox/addon/transmitter-for-transmission/)
[
![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cdmpmfcgepijfiaaojbahpmpjfkgdgja.svg)
![Chrome Stars](https://img.shields.io/chrome-web-store/stars/cdmpmfcgepijfiaaojbahpmpjfkgdgja.svg)
![Chrome Users](https://img.shields.io/chrome-web-store/users/cdmpmfcgepijfiaaojbahpmpjfkgdgja.svg)
](https://chrome.google.com/webstore/detail/transmitter-for-transmiss/cdmpmfcgepijfiaaojbahpmpjfkgdgja)
[![unlicense](https://img.shields.io/badge/un-license-green.svg?style=flat)](https://unlicense.org)

# Transmitter

![Screenshot](https://addons.cdn.mozilla.net/user-media/previews/full/184/184029.png?modified=1492874124)

a WebExtension for the [Transmission](https://transmissionbt.com/) BitTorrent client.

<a href="https://addons.mozilla.org/en-US/firefox/addon/transmitter-for-transmission/"><img alt="Get for Firefox" src="https://addons.cdn.mozilla.net/static/img/addons-buttons/AMO-button_1.png" width="172" height="60"></a>

<a href="https://addons.opera.com/en/extensions/details/transmitter-for-transmission/"><img alt="Get for Opera" src="https://dev.opera.com/extensions/branding-guidelines/addons_206x58_en@2x.png" width="206" height="58"></a>

<a href="https://chrome.google.com/webstore/detail/transmitter-for-transmiss/cdmpmfcgepijfiaaojbahpmpjfkgdgja"><img alt="Get for Chrome" src="https://developer.chrome.com/webstore/images/ChromeWebStore_BadgeWBorder_v2_496x150.png" width="206" height="58"></a>

- Adds a context menu item for downloading torrents (both `magnet`s and links to `.torrent` files) on your remote Transmission server.
- Adds a direct `magnet:` handler too. (Firefox only)
- Adds a browser action (popup toolbar icon thing) that lets you view existing torrents' status.
- You can even search in the popup if you have a lot of torrents.
- That button even has a badge (auto-updating torrent count / download speed / upload speed).
- The extension is very lightweight. Pure modern JavaScript, no library dependencies except for [a tiny polyfill for Chrome/Opera/etc. compatibility](https://github.com/mozilla/webextension-polyfill).
- Automatically picks up your session from the Transmission web UI, no need for separate authentication.
- Works fine if your Transmission instance is behind a reverse proxy that uses [TLS client certificates](https://github.com/myfreeweb/damnx509).

The extension requires access to all domains because requesting a dynamically configured domain (the domain of your Transmission server) with [the permissions API](https://developer.chrome.com/extensions/permissions) not yet widely supported.
(API not implemented yet in Firefox and Edge, requesting a specific domain that's unknown at manifest writing time just does not work in Opera.)

Edge isn't supported yet because [it is weird](https://github.com/mozilla/webextension-polyfill/issues/3).
(But shouldn't be hard to support.)

## Contributing

By participating in this project you agree to follow the [Contributor Code of Conduct](https://contributor-covenant.org/version/1/4/) and to release your contributions under the Unlicense.

[The list of contributors is available on GitHub](https://github.com/myfreeweb/transmitter/graphs/contributors).

## License

This is free and unencumbered software released into the public domain.  
For more information, please refer to the `UNLICENSE` file or [unlicense.org](https://unlicense.org).
