import {LitElement, html, css,} from "lit-element";

import Swiper from 'swiper';

let ART_LOCATIONS = ['showbackground', 'tvthumb'];
const license_key = "4ceeaf34fda30b433102357976b1ec3b";

class KodiInProgressShows extends LitElement {
    static get properties() {
        return {
            _hass: {},
            _tvShows: [],
            _config: {},
        };
    }

    shouldUpdate(changedProps) {
        if (changedProps.has("_config")) {
            return true;
        }
        if (changedProps.has("_tvShows")) {
            if (this.swiper) {
                this.swiper.update();
            }
            return true;
        }
        return false;
    }

    setConfig(config) {
        if (!config || !config.entity) {
            throw new Error("Card config incorrect");
        }
        if (!config.entity.startsWith("media_player")) {
            throw new Error("Only Kodi entities are allowed");
        }
        this._config = config;
        this._tvShows = [];
    }

    firstUpdated() {
        super.firstUpdated();

        if (this._config && this._hass) {
            this._loadSwiper();
        } else if (this.swiper) {
            this.swiper.update();
        }

        if (!this.connection && this._hass) {
            this.connection = this._hass.connection.subscribeEvents((event) => {
                this.handleEvent(event);
            }, "kodi_call_method_result");
            this.getData();
        }
    }

    handleEvent(event) {
        switch (event.data.input.method) {
            case "VideoLibrary.GetInProgressTVShows":
                if (this._tvShows.length < 1) {
                    event.data.result.tvshows.sort((a, b) => Date.parse(b.lastplayed) - Date.parse(a.lastplayed));
                    this._tvShows = event.data.result.tvshows;
                    this.getArt(this._tvShows);
                    this.getUpNextEpisode();
                }
                break;
            case "VideoLibrary.GetEpisodes":
                let episode = event.data.result.episodes[0];
                if (episode == undefined) break;
                let show = this._tvShows.find(show => show.tvshowid == episode.tvshowid);
                if (show && !show.episode) {
                    this.setEpisodeDetails(show, episode);
                    this.requestUpdate("_tvShows");
                }
                break;
        }
    }

    async getArt(shows) {
        shows.forEach((element) => {
            let url =
                "https://webservice.fanart.tv/v3/tv/" +
                element.imdbnumber +
                "?api_key=" + license_key;
            fetch(url)
                .then((data) => {
                    return data.json();
                })
                .then((json) => {
                    for (const artLocation of ART_LOCATIONS) {
                        if (json[artLocation] && json[artLocation].length > 0) {
                            element.fanart = json[artLocation][0].url.replace(" ", "%20");
                            return;
                        }
                    }
                    element.fanart = "";
                });
        });
    }

    setEpisodeDetails(show, episode) {
        show.season = episode.season;
        show.episode = episode.episode;
        show.runtime = this.getRuntimeString(episode.runtime);
        show.episodetitle = episode.title;
        show.rating = Number(episode.rating) > 0 ? Number(episode.rating).toFixed(1) : null;
        show.file = episode.file;
    }

    getRuntimeString(runtime) {
        let hrs = Math.floor(runtime / 3600);
        let mins = ((runtime % 3600) / 60).toFixed();
        let runtimeString = "";
        if (hrs > 0) {
            runtimeString += hrs + "h" + " ";
        }
        runtimeString += mins + "m";
        return runtimeString;
    }

    async getData() {
        await this._hass.callService("kodi", "call_method", {
            entity_id: this._config.entity,
            method: "VideoLibrary.GetInProgressTVShows",
            properties: [
                "lastplayed",
                "imdbnumber",
            ]
        });
    }

    async getUpNextEpisode() {
        if (!this._hass || !this._config) return;

        for (let i = 0; i < this._tvShows.length; i++) {
            await this._hass.callService("kodi", "call_method", {
                entity_id: this._config.entity,
                method: "VideoLibrary.GetEpisodes",
                tvshowid: this._tvShows[i].tvshowid,
                sort: {
                    method: "episode",
                },
                limits: {
                    start: 0,
                    end: 1,
                },
                properties: [
                    "title",
                    "rating",
                    "runtime",
                    "season",
                    "episode",
                    "file",
                    "tvshowid",
                ],
                filter: {
                    "and": [
                        {
                            field: "playcount",
                            operator: "is",
                            value: "0",
                        },
                        {
                            field: "episode",
                            operator: "isnot",
                            value: "-1",
                        },
                        {
                            field: "season",
                            operator: "isnot",
                            value: "0",
                        },
                    ]
                },
            });
        }
    }


    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.connection) {
            this.connection
                .then((data) => data())
                .catch((err) => {
                });
        }
        if (this._ripple) {
            this._ripple.remove();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (this._config && this._hass && !this._hasLoaded) {
            this._loadSwiper();
        } else if (this.swiper) {
            this.swiper.update();
        }
    }

    getCardSize() {
        return 5;
    }

    set hass(hass) {
        this._hass = hass;
    }

    render() {
        if (!this._config || !this._hass) {
            return html`
                <ha-card>
                    <div class="swiper-container"></div>
                </ha-card>`;
        }

        return html`
            <ha-card>
                <div class="swiper-container">
                    <div class="swiper-wrapper">
                        ${this._tvShows.map((item) => html`
                                    <div class="container2 swiper-slide" style="background-image: url('${item.fanart}')">
                                        <div class="info">
                                            <div>
                                                ${item.episode ? html`
                                                    <h3>${item.episodetitle ? item.episodetitle : ""}</h3>
                                                    <h5>
                                                        <span>S${item.season} E${item.episode} </span>
                                                        <span>${item.runtime}</span>
                                                        ${item.rating ? html`
                                                            <span>${item.rating}
                            <svg style="width:18px;height:18px margin-left:4px" viewBox="0 0 24 24">
                              <path fill="currentColor"
                                    d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
                            </svg>
                          </span>
                                                        ` : ""}
                                                    </h5>` : ""}
                                            </div>
                                            <div>
                                                <button class="playbutton ripple"
                                                        @click="${(e) => this._handleClick(e, item.file)}">
                                                    <svg class="svg-triangle" height="100%" width="100%">
                                                        <polygon
                                                                style="fill:#fefffe;"
                                                                points="25,20 25,40 40,30"
                                                        ></polygon>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `
                        )}
                    </div>
                </div>
            </ha-card>
        `;
    }

    _handleClick(event, epid) {
        if (epid == null) return;

        this._animateRipple(event);

        this._hass.callService("kodi", "call_method", {
            entity_id: this._config.entity,
            method: "Player.Open",
            item: {"file": epid},
        });
    }

    _animateRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
        circle.style.top = `${event.clientY - (button.offsetTop + button.getBoundingClientRect().top + radius)}px`;
        circle.classList.add("ripple");

        let ripple = button.getElementsByClassName("ripple")[0];

        if (ripple) {
            ripple.remove();
        }
        button.appendChild(circle);

        this._ripple = button.getElementsByClassName("ripple")[0];

    }

    async _loadSwiper() {
        this._hasLoaded = true;

        await this.updateComplete;

        this.swiper = new Swiper(
            this.shadowRoot.querySelector(".swiper-container"),
            {
                spaceBetween: 16,
                resizeObserver: true,
            }
        );
    }

    static get styles() {
        return css`
          :host {
            --swiper-theme-color: var(--primary-color);
          }

          .swiper-wrapper {
            display: inline-flex;
          }

          .swiper-container {
            border-radius: var(--ha-card-border-radius, 4px);
            height: 281px !important;
            overflow: hidden;
          }

          .container2 {
            background-size: cover;
            background-position: center;
            height: 281px !important;
            width: 100%;
          }

          .container,
          .container2 {
            display: inline-block;
            position: relative;
            border-radius: var(--ha-card-border-radius, 4px);
            overflow: hidden;
          }

          .info:before {
            width: 100%;
            position: absolute;
            bottom: 0;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            content: " ";
            z-index: -1;

            overflow: hidden;
          }

          img {
            display: block;
          }

          .info {
            display: flex;
            position: absolute;
            bottom: 0;
            justify-content: space-between;
            z-index: 1;
            color: #eaeaea;
            min-height: 80px;
            font-size: 22px;
            width: 100%;
          }

          .info:hover {
            cursor: default;
          }

          .info h3 {
            display: inline-block;
            grid-area: head;
            font-size: 20pt;
            font-weight: 300;
            margin: 8px 0 8px 8px;
            padding-top: 8px;
          }

          .info h5 {
            grid-area: sub;
            font-weight: normal;
            margin: 8px 8px 8px 8px;
            font-size: 14px;
            display: flex;
          }

          .info ul {
            display: inline-block;
            right: 0;
            text-align: right;
            margin: 20px 30px 20px 0;
            list-style: none;
          }

          .info span {
            margin-right: 16px;
            display: flex;
            align-items: center;
          }

          .info > div {
            margin: 0px 8px 8px 8px;
          }

          .playbutton {
            position: relative !important;
            overflow: hidden;
            grid-area: button;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19),
            0 6px 6px rgba(0, 0, 0, 0.23);
            right: 16px;
            top: 0px;
            transform: translateY(-50%);
            background-color: var(--accent-color);
            border: none;
            outline: none;
            padding: 0;
          }

          .playbutton:hover {
            cursor: pointer;
          }

          .svg-triangle {
            pointer-events: none;
            margin: 0px;
            padding: 0px;
            width: 60px;
            display: inline-block;
            height: 60px;
          }

          span.ripple {
            position: absolute;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 450ms linear;
            background-color: rgba(255, 255, 255, 0.7);
          }

          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `;
    }

}

customElements.define('kodi-in-progress-shows', KodiInProgressShows);
