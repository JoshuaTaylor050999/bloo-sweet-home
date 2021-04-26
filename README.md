# Kodi In Progress Shows
A Lovelace card that shows the current in progress tv shows from Kodi. The card will fetch data from a Kodi media player in Home Assistant and display the first unplayed episode in TV shows where at least one episode has been watched. The card has a play button which will start playing the episode on Kodi.

This project uses [Swiper](https://swiperjs.com/) to display the cards, and [fanart.tv](https://fanart.tv/) for images. 

## Manual Installation
1. Download _kodi-in-progress.js_ from the latest release on the [releases page](https://github.com/Dengis-Kahn/kodi-in-progress-shows/releases).
2. Put the file in the `<config>/www` folder in your Home Assistant instance.
3. Add a new Lovelace resource with the URL `/local/kodi-in-progress.js` and Resource type `JavaScript Module` and reload your Lovelace.


## Configuration
Add a new custom card to your Lovelace dashboard:
```
type: 'custom:kodi-in-progress-shows'
entity: media_player.<kodi-name>
```
Replace _\<kodi-name\>_ with the name of your Kodi media player as configured in Home Assistant.

