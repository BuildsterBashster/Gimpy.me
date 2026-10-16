# My Arcade

A static games portal. No build step, no server code. It works on GitHub Pages,
Netlify, Cloudflare Pages, or by opening index.html from disk.

## Game slots

`games.js` has 20 slots (Game Slot 1 to 20). Every slot with an empty `url`
loads the Dot Catcher template from `games/dot-catcher/`.

To use a slot for your own game, paste the iframe link into that slot's `url`:

```js
{
    id: 3,
    name: "My Game",
    tile: "3",
    author: "Your name",
    authorUrl: "",
    repo: "https://github.com/you/my-game",   // optional, shows a "View source" button
    url: "games/my-game/index.html",   // or "https://example.com/my-game/"
    thumb: "games/my-game/thumb.png",
    featured: false
}
```

Leave `repo` empty and no source button is shown for that game. Only
http:// and https:// links are accepted.

## Game viewer look

Opening a game shows it centered on a dotted dark backdrop: dark grey at the
edges, with black dots that grow until the area around the game is solid black.
The backdrop is drawn in the browser, so it scales to any screen. The round
badge in the top-left shows the slot's `thumb` (or its `tile` text). Set
`aspect` on a slot (for example `"16/9"`) to change the shape of the game window.

For a game in this project, put it in its own folder (`games/my-game/index.html`).
To change which game empty slots show, edit `defaultUrl` in `games.js`.

`url` can also be a full https:// address if the game is hosted elsewhere
(the other site must allow being embedded in an iframe).

## Change the name

Edit `title`, `contact` and `footer` at the top of `games.js`.

## Notes

- Only add games you made or have permission to host.
- Play counts and theme are stored in the visitor's own browser.
- Search, sort, the viewer, fullscreen and deep links (`index.html#2`) all work
  from the single game list.

## Library layout and keys

The home screen is a console-style library: a red side rail (all games,
featured, random game, search, settings), a dense grid of tiles and a hint bar.
A tile shows `thumb` as box art (portrait, cropped to fit); slots without a
thumb show their `tile` text and name. The Featured button only appears when at
least one slot has `featured: true`.

| Key | Action |
| --- | --- |
| Arrow keys, Home, End | move between tiles |
| Enter or A | start the selected game |
| Y | cycle sort (Name, Newest, Most played) |
| X | details for the selected game |
| / | search (Esc closes) |
| N (in a game) | hide the side backdrop images, for debugging |

The bottom hint buttons do the same with a mouse or touch. Contact link, footer
text and theme live in Settings (the sliders icon).
