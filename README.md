# Kodi In Progress Shows
A Lovelace card that shows the current in progress tv shows from Kodi. The card will fetch data from a Kodi media player in Home Assistant and display the first unplayed episode in TV shows where at least one episode has been watched. The card has a play button which will start playing the episode on Kodi.

This project uses [Swiper](https://swiperjs.com/) to display the cards, and [fanart.tv](https://fanart.tv/) for images. 

***

## Installation
To install this custom card, follow the instructions in <a href="#hacs-installation">HACS Installation</a> or <a href="#manual-installation">Manual Installation</a>

### HACS Installation
Add this repository as a custom repository in HACS ([guide](https://hacs.xyz/docs/faq/custom_repositories))

### Manual Installation
1. Download _kodi-in-progress.js_ from the latest release on the [releases page](https://github.com/Dengis-Kahn/kodi-in-progress-shows/releases) and put it in the `<config>/www` folder of your Home Assistant instance.
3. Add a new Lovelace resource with the URL `/local/kodi-in-progress.js` and Resource type `JavaScript Module` and reload your Lovelace.

***

## Configuration
Add a new custom card to your Lovelace dashboard:
```
type: 'custom:kodi-in-progress-shows'
entity: media_player.<kodi-name>
```
Replace _\<kodi-name\>_ with the name of your Kodi media player as configured in Home Assistant.

***

## Acknowledgements

Inspired by https://github.com/bramkragten/swipe-card.
