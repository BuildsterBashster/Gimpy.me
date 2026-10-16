/*
  Site settings and the game list.

  HOW SLOTS WORK
  Every slot below starts out empty and loads the Dot Catcher template
  (SITE.defaultUrl). To put your own game in a slot:

    1. Find the slot (Game Slot 1 to 20).
    2. Paste the link into its  url  field. That link is what loads in the iframe.
         - a folder in this project:  "games/my-game/index.html"
         - a hosted game:             "https://example.com/my-game/"
    3. Optionally change name, author and thumb.

  Fields:
    id        unique number. Higher = newer (used by the "Newest" sort)
    name      shown on the card
    tile      short text on the placeholder tile (used when thumb is empty)
    author    optional
    authorUrl optional link on the author name
    repo      optional GitHub (or any source) link. If set, the viewer shows a
              "View source" button for it. Leave "" to hide the button
    url       the iframe link. Leave "" to use the Dot Catcher template
    thumb     optional image path, e.g. "games/my-game/thumb.png"
              (also used for the round badge in the top-left of the viewer)
    aspect    optional shape of the game window, e.g. "16/9" or "4/3".
              Leave "" to use SITE.defaultAspect
    featured  true to also show the slot in the Featured section

  This is a .js file rather than .json so the site also works when
  index.html is opened straight from disk.
*/
window.SITE = {
    title: "My Arcade",
    contact: "",          // e.g. "mailto:you@example.com" or a URL. Empty hides the link.
    footer: "",           // optional short line in the footer
    defaultUrl: "games/dot-catcher/index.html",  // the template every empty slot loads
    defaultAspect: "1120/1008"                   // default game window shape (width/height)
};

window.GAMES = [
    {
        id: 1,
        name: "Super Mario Bros.",
        tile: "1",
        author: "Nintendo",
        authorUrl: "https://www.nintendo.com/en-gb/",
        repo: "https://github.com/alanjian85/marius",           // optional GitHub link (shows a button in the viewer)
        url: "https://alanjian85.github.io/marius/",            // <-- SLOT 1: paste the iframe link here
        thumb: "images/smb.png",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 2,
        name: "Super Mario 64",
        tile: "2",
        author: "Nintendo",
        authorUrl: "https://www.nintendo.com/en-gb/",
        repo: "https://github.com/blackforestboi?tab=repositories",           // optional GitHub link (shows a button in the viewer)
        url: "https://notan127.github.io/SM64-PC-Port-WebGL/",            // <-- SLOT 2: paste the iframe link here
        thumb: "images/sm64.png",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: true
    },
    {
        id: 3,
        name: "Super Mario Bros. 3",
        tile: "3",
        author: "Nintendo",
        authorUrl: "https://www.nintendo.com/en-gb/",
        repo: "https://github.com/BuildsterBashster/smb3web",           // optional GitHub link (shows a button in the viewer)
        url: "https://buildsterbashster.github.io/smb3web/",            // <-- SLOT 3: paste the iframe link here
        thumb: "images/smb3.png",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 4,
        name: "Geometry Dash Wasm",
        tile: "4",
        author: "RobTop Games",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "https://nottheethozshow-bit.github.io/geometry-dash/",            // <-- SLOT 4: paste the iframe link here
        thumb: "images/gd.png",
        aspect: "16/9",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 5,
        name: "Half-Life",
        tile: "5",
        author: "Valve",
        authorUrl: "https://www.half-life.com/en/halflife",
        repo: "https://github.com/Pixelsuft/hl",           // optional GitHub link (shows a button in the viewer)
        url: "https://pixelsuft.github.io/hl/",            // <-- SLOT 5: paste the iframe link here
        thumb: "images/hl.png",
        aspect: "4/3",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: true
    },
    {
        id: 6,
        name: "Sonic the Hedgehog",
        tile: "6",
        author: "SEGA",
        authorUrl: "https://www.sega.com/sonic-the-hedgehog",
        repo: "https://github.com/VinMannie/Sonic-1-WASM",           // optional GitHub link (shows a button in the viewer)
        url: "https://vinmannie.github.io/Sonic-1-WASM/",            // <-- SLOT 6: paste the iframe link here
        thumb: "images/sth.png",
        aspect: "4/3",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 7,
        name: "Slope Plus",
        tile: "7",
        author: "Y8 , oweggs",
        authorUrl: "https://www.y8.com/",
        repo: "https://github.com/lonfro/SlopePlusWeb",           // optional GitHub link (shows a button in the viewer)
        url: "https://lonfro.github.io/SlopePlusWeb/",            // <-- SLOT 7: paste the iframe link here
        thumb: "images/sp.png",
        aspect: "16/9",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: true
    },
    {
        id: 8,
        name: "DOOM",
        tile: "8",
        author: "idSoftware, unknown",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "https://silentspacemarine.com/",            // <-- SLOT 8: paste the iframe link here
        thumb: "images/dm.png",
        aspect: "4/3",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 9,
        name: "The Simpson, hit and run",
        tile: "9",
        author: "Vivendi Universal",
        authorUrl: "https://www.vivendi.com/en/",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "https://shar-wasm.cjoseph.workers.dev/?skipmovie",            // <-- SLOT 9: paste the iframe link here
        thumb: "images/sh&r",
        aspect: "16/9",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: true
    },
    {
        id: 10,
        name: "Game Slot 10",
        tile: "10",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 10: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 11,
        name: "Game Slot 11",
        tile: "11",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 11: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 12,
        name: "Game Slot 12",
        tile: "12",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 12: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 13,
        name: "Game Slot 13",
        tile: "13",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 13: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 14,
        name: "Game Slot 14",
        tile: "14",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 14: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 15,
        name: "Game Slot 15",
        tile: "15",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 15: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 16,
        name: "Game Slot 16",
        tile: "16",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 16: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 17,
        name: "Game Slot 17",
        tile: "17",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 17: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 18,
        name: "Game Slot 18",
        tile: "18",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 18: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 19,
        name: "Game Slot 19",
        tile: "19",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 19: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    },
    {
        id: 20,
        name: "Game Slot 20",
        tile: "20",
        author: "",
        authorUrl: "",
        repo: "",           // optional GitHub link (shows a button in the viewer)
        url: "",            // <-- SLOT 20: paste the iframe link here
        thumb: "",
        aspect: "",         // optional window shape, e.g. "16/9" or "4/3". "" = default
        featured: false
    }
];
