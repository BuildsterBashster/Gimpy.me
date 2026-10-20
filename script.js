(() => {
    "use strict";

    const GAMES = Array.isArray(window.GAMES) ? window.GAMES : [];
    const SITE = window.SITE || {};
    const STORE_KEY = "arcade-data";
    const $ = (id) => document.getElementById(id);

    /* ---------- saved data (play counts, theme) ---------- */
    let data = loadData();

    function loadData() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
            return {
                plays: parsed && typeof parsed.plays === "object" && parsed.plays ? parsed.plays : {},
                theme: parsed && parsed.theme === "light" ? "light" : "dark",
                motion: parsed && parsed.motion === "always" ? "always" : "system"
            };
        } catch (e) {
            return { plays: {}, theme: "dark", motion: "system" };
        }
    }
    function saveData() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
    }

    function gameUrl(game) {
        return game.url || SITE.defaultUrl || "about:blank";
    }

    /* ---------- library state ---------- */
    const SORTS = [["name", "Name"], ["id", "Newest"], ["popular", "Most played"]];
    let sortIdx = 0;
    let view = "all";          // "all" | "featured"
    let selId = null;          // id of the tile that has focus / was last focused

    function hue(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
        return h;
    }

    /* ---------- tiles ---------- */
    function makeTile(game) {
        const tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tile";
        tile.dataset.id = game.id;
        tile.setAttribute("role", "listitem");
        tile.setAttribute("aria-label", game.name + (game.author ? " by " + game.author : ""));
        tile.title = game.name;

        const thumb = document.createElement("div");
        thumb.className = "thumb";
        const fallback = () => {
            thumb.replaceChildren();
            thumb.classList.add("plain");
            thumb.style.background = "hsl(" + hue(game.name || "") + ", 40%, 30%)";
            const num = document.createElement("div");
            num.className = "tile-num";
            num.textContent = game.tile || (game.name || "?").charAt(0).toUpperCase();
            const name = document.createElement("div");
            name.className = "tile-name";
            name.textContent = game.name;
            thumb.append(num, name);
        };
        if (game.thumb) {
            const img = new Image();
            img.alt = "";
            img.loading = "lazy";
            img.onerror = fallback;
            img.src = game.thumb;
            thumb.appendChild(img);
        } else {
            fallback();
        }
        tile.appendChild(thumb);

        tile.addEventListener("click", () => openGame(game.id));
        tile.addEventListener("focus", () => { selId = game.id; });
        tile.addEventListener("mouseenter", () => {
            if (busy || performance.now() < hoverLockUntil) return;   // a resting pointer must not steal the selection mid-transition
            if (!(document.activeElement instanceof HTMLInputElement)) tile.focus({ preventScroll: true });
        });
        return tile;
    }

    /* ---------- filter, sort, render ---------- */
    function visibleGames() {
        const q = $("searchBar").value.trim().toLowerCase();
        const list = GAMES.filter((g) =>
            (view === "all" || g.featured) &&
            (!q || g.name.toLowerCase().includes(q) || (g.author || "").toLowerCase().includes(q)));
        const mode = SORTS[sortIdx][0];
        if (mode === "id") list.sort((a, b) => b.id - a.id);
        else if (mode === "popular") list.sort((a, b) => (data.plays[b.id] || 0) - (data.plays[a.id] || 0) || a.name.localeCompare(b.name));
        else list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true }));
        return list;
    }

    function tiles() { return Array.from($("allGrid").querySelectorAll(".tile")); }

    function focusTile(id, opts) {
        const t = tiles().find((el) => String(el.dataset.id) === String(id)) || tiles()[0];
        if (t) t.focus(opts);
    }

    function render(keepFocus) {
        const grid = $("allGrid");
        const hadFocus = keepFocus || grid.contains(document.activeElement);
        const list = visibleGames();
        grid.replaceChildren();
        if (!list.length) {
            const p = document.createElement("p");
            p.className = "empty";
            p.textContent = !GAMES.length ? "No games yet. Add one in games.js."
                : view === "featured" && !$("searchBar").value.trim() ? "No featured games. Set featured: true in games.js."
                : "No games match that search.";
            grid.appendChild(p);
        } else {
            list.forEach((g) => grid.appendChild(makeTile(g)));
        }
        $("navFeatured").hidden = !GAMES.some((g) => g.featured);
        $("navAll").setAttribute("aria-pressed", String(view === "all"));
        $("navFeatured").setAttribute("aria-pressed", String(view === "featured"));
        if (hadFocus) focusTile(selId, { preventScroll: false });
    }

    let toastTimer = 0;
    function toast(text) {
        const el = $("toast");
        el.textContent = text;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
    }

    function cycleSort() {
        sortIdx = (sortIdx + 1) % SORTS.length;
        toast("Sorted by: " + SORTS[sortIdx][1]);
        render(true);
    }

    function setView(v) {
        view = v;
        render(false);
        toast(v === "featured" ? "Featured games" : "All games");
    }

    /* ---------- search ---------- */
    function searchOpen() { return !$("searchWrap").hidden; }
    function openSearch() {
        $("searchWrap").hidden = false;
        $("navSearch").setAttribute("aria-pressed", "true");
        $("searchBar").focus();
    }
    function closeSearch() {
        $("searchWrap").hidden = true;
        $("navSearch").setAttribute("aria-pressed", "false");
        if ($("searchBar").value) { $("searchBar").value = ""; render(false); }
        focusTile(selId);
    }

    /* ---------- details popup ---------- */
    let detailsGame = null;
    function openDetails(id) {
        const game = GAMES.find((g) => String(g.id) === String(id == null ? selId : id)) || visibleGames()[0];
        if (!game) return;
        detailsGame = game;
        $("detailsName").textContent = game.name;
        const plays = data.plays[game.id] || 0;
        $("detailsMeta").textContent = (game.author ? "by " + game.author + " \u00b7 " : "") +
            "played " + plays + (plays === 1 ? " time" : " times");
        const author = $("detailsAuthor");
        author.hidden = !/^https?:\/\//i.test(game.authorUrl || "");
        if (!author.hidden) { author.href = game.authorUrl; author.textContent = "About " + game.author; }
        const repo = $("detailsRepo");
        repo.hidden = !/^https?:\/\//i.test(game.repo || "");
        if (!repo.hidden) repo.href = game.repo;
        $("detailsOverlay").hidden = false;
        $("detailsStart").focus();
    }
    function closeDetails() {
        $("detailsOverlay").hidden = true;
        if (detailsGame) focusTile(detailsGame.id);
        detailsGame = null;
    }

    /* ---------- viewer ---------- */
    let currentGame = null;
    let ratio = 1120 / 1008;

    function parseAspect(text) {
        const m = /^\s*(\d+(?:\.\d+)?)\s*[\/:x]\s*(\d+(?:\.\d+)?)\s*$/i.exec(text || "");
        return m && +m[1] > 0 && +m[2] > 0 ? +m[1] / +m[2] : null;
    }

    /* Dotted backdrop: images/left.png and images/right.png (made by
       tools/make_backdrop.py) sit against the game window's edges, full height. */
    function placeBackdrop() {
        const stage = $("stage");
        const left = stage.offsetLeft, right = left + stage.offsetWidth;
        const W = $("viewer").clientWidth;
        $("bgLeft").style.right = (W - left) + "px";
        $("bgRight").style.left = right + "px";
    }

    /* Sizes and places the game window in whole pixels (no CSS transforms or
       fractional sizes), then draws the backdrop around it. */
    function layoutViewer() {
        const v = $("viewer");
        if (v.hidden) return;
        const W = v.clientWidth, H = v.clientHeight;
        const wideW = Math.min(0.96 * W, 0.9333 * H * ratio);
        const gutter = (W - wideW) / 2;
        const compact = gutter < 190;
        v.classList.toggle("compact", compact);
        v.style.setProperty("--gutter", Math.max(0, gutter) + "px");

        const availW = compact ? W : 0.96 * W;
        const availH = compact ? H - 62 : 0.9333 * H;
        const w = Math.max(1, Math.floor(Math.min(availW, availH * ratio)));
        const h = Math.max(1, Math.floor(w / ratio));
        const stage = $("stage");
        stage.style.width = w + "px";
        stage.style.height = h + "px";
        stage.style.left = Math.floor((W - w) / 2) + "px";
        stage.style.top = (compact ? 58 : Math.floor((H - h) / 2)) + "px";
        placeBackdrop();
    }
    window.addEventListener("resize", layoutViewer);

    function setBadge(game) {
        const badge = $("badge");
        badge.replaceChildren();
        badge.style.background = "";
        badge.title = game.name;
        badge.setAttribute("aria-label", game.name);
        const fallback = () => {
            badge.textContent = game.tile || (game.name || "?").charAt(0).toUpperCase();
            badge.style.background = "hsl(" + hue(game.name || "") + ", 40%, 30%)";
        };
        if (game.thumb) {
            const img = new Image();
            img.alt = "";
            img.onerror = () => { img.remove(); fallback(); };
            img.src = game.thumb;
            badge.appendChild(img);
        } else {
            fallback();
        }
    }

    function openGame(id, instant) {
        if (busy) return;
        const game = GAMES.find((g) => String(g.id) === String(id));
        if (!game) return;
        if (game.newTab) {
            /* Games that need cross-origin isolation (SharedArrayBuffer) can't run inside this page's iframe,
               so they open as their own top-level tab instead of in the viewer. */
            data.plays[game.id] = (data.plays[game.id] || 0) + 1;
            saveData();
            window.open(gameUrl(game), "_blank", "noopener");
            return;
        }
        currentGame = game;
        $("gameName").textContent = game.name;
        const author = $("gameAuthor");
        if (game.author) {
            author.textContent = "by " + game.author;
            author.href = game.authorUrl || "#";
            author.hidden = false;
            if (!game.authorUrl) author.removeAttribute("target");
            else author.target = "_blank";
        } else {
            author.hidden = true;
        }
        setBadge(game);
        ratio = parseAspect(game.aspect) || parseAspect(SITE.defaultAspect) || 1120 / 1008;
        $("viewer").style.setProperty("--ar", String(ratio));
        const tile = instant ? null : tiles().find((el) => String(el.dataset.id) === String(game.id));
        const animate = !!tile && !reduced() && tile.offsetParent !== null;
        if (animate) $("viewer").classList.add("pre", "launching");
        $("viewer").hidden = false;
        layoutViewer();
        $("gameFrame").src = gameUrl(game);   // load only once the window has a real size
        document.body.style.overflow = "hidden";
        data.plays[game.id] = (data.plays[game.id] || 0) + 1;
        saveData();
        history.replaceState(null, "", "#" + game.id);
        if (animate) launch(tile); else $("pauseBtn").focus();
    }

    /* ---------- launch / leave transitions ----------
       Timings measured frame by frame from a 30fps recording of the real app. Times are seconds from the button press. */
    const deviceWantsLessMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    const reduced = () => data.motion !== "always" && deviceWantsLessMotion();
    let busy = false;
    let hoverLockUntil = 0;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    /* Piecewise-linear animation through measured samples: keys = [[t, ...values]], fn(...values) -> css */
    function play(el, total, keys, fn) {
        if (!el || reduced()) return null;
        const frames = keys.map((k) => Object.assign({ offset: Math.min(1, k[0] / total) }, fn(...k.slice(1))));
        return el.animate(frames, { duration: total * 1000, fill: "both", easing: "linear" });
    }
    const TILE_ZOOM = 1.1;   // the selected tile's resting scale (see .tile:focus)
    const LAUNCH = {
        /* selected tile: squashes to 91% in a frame, eases back, then drifts as the screen goes dark: [t, scale, dx, dy] (dx/dy as tile fractions) */
        tile: [[0, 1, 0, 0], [.0125, .91, 0, 0], [.083, .91, 0, 0], [.117, .93, 0, 0], [.15, .94, 0, 0], [.183, .96, 0, 0], [.217, .97, 0, 0],
               [.25, .98, 0, 0], [.283, .98, .019, -.019], [.317, .97, .033, -.037], [.35, .96, .047, -.047], [.383, .96, .056, -.05],
               [.417, .95, .061, -.059], [.45, .95, .066, -.062], [.6, .95, .066, -.062]],
        /* the library, rail and hints fade to black (ease-in) */
        shade: [[0, 0], [.283, .023], [.317, .055], [.35, .096], [.383, .14], [.417, .188], [.45, .242], [.483, .31], [.517, .388],
                [.55, .477], [.583, .6], [.617, .791], [.65, .995], [.7, 1]],
        reveal: .483,   // the game window appears at 92% and grows to full size, out of the tile's corner
        pop: [[0, .916], [.034, .95], [.067, .974], [.1, .991], [.134, 1]],
        done: .65, btnFade: [.817, .2],
    };
    const LEAVE = {
        /* after the menu has closed: the window shrinks into the tile while the library fades back in */
        shade: [[0, 1], [.033, .73], [.067, .59], [.1, .47], [.133, .4], [.167, .31], [.2, .24], [.233, .18], [.267, .12], [.3, .07], [.333, .02], [.367, 0]],
        win: [[0, 1, 1], [.033, .628, .93], [.067, .486, .88], [.1, .387, .87], [.133, .312, .82], [.167, .26, .67], [.2, .2, 0]],
        /* the tile stays squashed for a moment, then pops back */
        tile: [[0, .91], [.4, .91], [.433, .93], [.467, .96], [.5, .98], [.533, .99], [.567, 1]],
        menuClose: .25,
    };
    const tileFor = (id) => tiles().find((el) => String(el.dataset.id) === String(id));

    async function launch(tile) {
        busy = true;
        const t0 = performance.now();
        const at = (s) => sleep(Math.max(0, t0 + s * 1000 - performance.now()));
        const shade = $("launchShade"), v = $("viewer");
        shade.style.display = "block";
        const anims = [
            play(tile, .6, LAUNCH.tile, (m, x, y) => ({ transform: `translate(${x * 100}%, ${y * 100}%) scale(${TILE_ZOOM * m})` })),
            play(shade, .7, LAUNCH.shade, (o) => ({ opacity: o })),
        ];
        await at(LAUNCH.reveal);
        v.classList.remove("pre");
        anims.push(play($("stage"), .134, LAUNCH.pop, (s) => ({ transform: `scale(${s})` })));
        await at(LAUNCH.done);
        v.classList.remove("launching");
        shade.style.display = "none";
        anims.forEach((a) => a && a.cancel());
        const btn = $("pauseBtn");
        if (!reduced()) btn.animate([{ opacity: 0 }, { opacity: .7 }], { duration: LAUNCH.btnFade[1] * 1000, delay: (LAUNCH.btnFade[0] - LAUNCH.done) * 1000, fill: "backwards" });
        busy = false;
        if (currentGame) btn.focus();
    }

    function closeGameNow() {
        const closedId = currentGame ? currentGame.id : selId;
        $("pauseMenu").classList.remove("on");
        $("viewer").classList.remove("menu-on", "pre", "launching", "leaving");
        $("viewer").hidden = true;
        $("gameFrame").src = "about:blank";
        document.body.style.overflow = "";
        currentGame = null;
        history.replaceState(null, "", location.pathname + location.search);
        selId = closedId;
        render(true);
    }

    /* Game -> library: the menu closes, then the window zooms back into the tile */
    async function leave() {
        if (busy || !currentGame) return;
        busy = true;
        const lead = pauseOpen() ? LEAVE.menuClose : 0;
        hoverLockUntil = performance.now() + lead * 1000 + 1000;
        if (lead) closePause(false);
        const t0 = performance.now();
        const at = (s) => sleep(Math.max(0, t0 + s * 1000 - performance.now()));
        await at(lead);
        const v = $("viewer"), shade = $("launchShade"), stage = $("stage");
        v.classList.add("leaving");
        shade.style.display = "block"; shade.style.opacity = "1";
        const closedId = currentGame.id;
        history.replaceState(null, "", location.pathname + location.search);
        selId = closedId;
        document.body.style.overflow = "";
        render(true);                                   // the library appears underneath, hidden by the shade
        const anims = [
            play(shade, .367, LEAVE.shade, (o) => ({ opacity: o })),
            play(stage, .2, LEAVE.win, (s, a) => ({ transform: `scale(${s})`, opacity: a })),
            play(tileFor(closedId), .567, LEAVE.tile, (m) => ({ transform: `scale(${TILE_ZOOM * m})` })),
        ];
        await at(lead + .2);
        v.hidden = true;
        v.classList.remove("leaving", "menu-on");
        $("gameFrame").src = "about:blank";
        currentGame = null;
        if (anims[1]) anims[1].cancel();
        busy = false;
        await at(lead + .367);
        shade.style.display = "none"; shade.style.opacity = "";
        if (anims[0]) anims[0].cancel();
        await at(lead + .567);
        if (anims[2]) anims[2].cancel();
    }

    function closeGame(instant) {
        if (instant === true || reduced() || !currentGame) return closeGameNow();
        leave();
    }

    /* ---------- in-game menu (opened by the small button at the bottom right) ---------- */
    const PAUSE_IDS = ["pmContinue", "pmFullscreen", "pmTab", "pmSource", "pmExit"];
    const pauseItems = () => PAUSE_IDS.map($).filter((el) => !el.hidden);
    const pauseOpen = () => $("pauseMenu").classList.contains("on");

    function openPause() {
        if (!currentGame || pauseOpen() || busy) return;
        const src = $("badge"), dst = $("pauseBadge");
        dst.replaceChildren(...Array.from(src.cloneNode(true).childNodes));
        dst.style.background = src.style.background;
        $("pauseName").textContent = currentGame.name;
        $("pmSource").hidden = !/^https?:\/\//i.test(currentGame.repo || "");
        $("pauseMenu").classList.add("on");
        $("viewer").classList.add("menu-on");
        $("pmContinue").focus();
    }

    /* Hides the menu and hands the keyboard back to the game */
    function closePause(resume = true) {
        $("pauseMenu").classList.remove("on");
        $("viewer").classList.remove("menu-on");
        if (resume) try { $("gameFrame").focus(); } catch (_) { /* ignore */ }
    }

    function movePause(step) {
        const items = pauseItems();
        const i = items.indexOf(document.activeElement);
        const next = i < 0 ? (step > 0 ? 0 : items.length - 1) : (i + step + items.length) % items.length;
        items[next].focus();
    }

    $("pauseBtn").addEventListener("click", openPause);
    $("pmContinue").addEventListener("click", () => closePause());
    $("pmFullscreen").addEventListener("click", () => {
        const frame = $("gameFrame");
        closePause();
        if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
    });
    $("pmTab").addEventListener("click", () => {
        if (currentGame) window.open(gameUrl(currentGame), "_blank", "noopener");
        closePause();
    });
    $("pmSource").addEventListener("click", () => {
        if (currentGame && /^https?:\/\//i.test(currentGame.repo || "")) window.open(currentGame.repo, "_blank", "noopener");
        closePause();
    });
    $("pmExit").addEventListener("click", () => closeGame());
    $("pmBack").addEventListener("click", () => closePause());
    $("pmOk").addEventListener("click", () => {
        const el = document.activeElement;
        if (el && el.classList.contains("pause-item")) el.click();
    });
    PAUSE_IDS.forEach((id) => {
        $(id).addEventListener("mouseenter", () => $(id).focus({ preventScroll: true }));
    });

    /* ---------- settings popup ---------- */
    function openPopup() {
        $("settingsMsg").textContent = "";
        $("themeSelect").value = data.theme;
        $("motionSelect").value = data.motion;
        $("motionNote").hidden = !(deviceWantsLessMotion() && data.motion !== "always");
        $("overlay").hidden = false;
        $("themeSelect").focus();
    }
    function closePopup() { $("overlay").hidden = true; }

    $("settingsBtn").addEventListener("click", openPopup);
    $("popupClose").addEventListener("click", closePopup);
    $("overlay").addEventListener("click", (e) => { if (e.target === $("overlay")) closePopup(); });

    function applyTheme() { document.documentElement.dataset.theme = data.theme; }
    function applyMotion() { document.documentElement.dataset.motion = data.motion; }
    applyMotion();
    $("motionSelect").addEventListener("change", (e) => {
        data.motion = e.target.value === "always" ? "always" : "system";
        saveData();
        applyMotion();
        $("motionNote").hidden = !(deviceWantsLessMotion() && data.motion !== "always");
    });
    $("themeSelect").addEventListener("change", (e) => {
        data.theme = e.target.value === "light" ? "light" : "dark";
        applyTheme();
        saveData();
    });

    $("exportBtn").addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "arcade-data.json";
        a.click();
        URL.revokeObjectURL(a.href);
    });
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                if (!parsed || typeof parsed.plays !== "object") throw new Error("bad file");
                data.plays = parsed.plays;
                if (parsed.theme === "light" || parsed.theme === "dark") data.theme = parsed.theme;
                if (parsed.motion === "always" || parsed.motion === "system") data.motion = parsed.motion;
                applyTheme();
                saveData();
                render();
                $("settingsMsg").textContent = "Imported.";
            } catch (err) {
                $("settingsMsg").textContent = "That file is not a valid export.";
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    });
    $("resetBtn").addEventListener("click", () => {
        data.plays = {};
        saveData();
        render();
        $("settingsMsg").textContent = "Play counts reset.";
    });

    /* ---------- buttons ---------- */
    $("navAll").addEventListener("click", () => setView("all"));
    $("navFeatured").addEventListener("click", () => setView(view === "featured" ? "all" : "featured"));
    $("navRandom").addEventListener("click", () => {
        const list = visibleGames();
        if (list.length) openGame(list[Math.floor(Math.random() * list.length)].id);
    });
    $("navSearch").addEventListener("click", () => (searchOpen() ? closeSearch() : openSearch()));
    $("hintSort").addEventListener("click", cycleSort);
    $("hintDetails").addEventListener("click", () => openDetails());
    $("hintStart").addEventListener("click", () => { if (selId != null) openGame(selId); });
    $("detailsClose").addEventListener("click", closeDetails);
    $("detailsOverlay").addEventListener("click", (e) => { if (e.target === $("detailsOverlay")) closeDetails(); });
    $("detailsStart").addEventListener("click", () => {
        const id = detailsGame && detailsGame.id;
        $("detailsOverlay").hidden = true;
        detailsGame = null;
        if (id != null) openGame(id);
    });


    /* ---------- expanded menu: the red rail grows in place ---------- */
    let openingTimer = 0;
    function menuOpen() { return document.body.classList.contains("menu-open"); }
    function menuItems() { return Array.from(document.querySelectorAll(".rail-btn")).filter((el) => !el.hidden); }
    function openMenu() {
        if (menuOpen()) return;
        void document.querySelector(".rail").offsetWidth;   // settle the collapsed layout first so the open animates
        document.body.classList.add("menu-open", "menu-opening");
        clearTimeout(openingTimer);
        openingTimer = setTimeout(() => document.body.classList.remove("menu-opening"), 233);   // label turns red once the bar has settled
        const items = menuItems();
        const start = (view === "featured" && !$("navFeatured").hidden) ? $("navFeatured") : $("navAll");
        (items.includes(start) ? start : items[0]).focus({ preventScroll: true });
    }
    function closeMenu(refocus) {
        if (!menuOpen()) return;
        clearTimeout(openingTimer);
        document.body.classList.remove("menu-open", "menu-opening");
        if (refocus !== false) focusTile(selId, { preventScroll: true });
    }
    document.querySelectorAll(".rail-btn").forEach((btn) => {
        btn.addEventListener("mouseenter", () => { if (menuOpen()) btn.focus({ preventScroll: true }); });
        btn.addEventListener("click", () => {      // runs after the button's own action
            if (!menuOpen()) return;
            closeMenu(false);
            if (btn.id === "navAll" || btn.id === "navFeatured") focusTile(selId, { preventScroll: true });
        });
    });
    $("menuScrim").addEventListener("click", () => closeMenu());
    $("menuBack").addEventListener("click", () => closeMenu());
    $("menuOk").addEventListener("click", () => { const el = document.activeElement; if (el && el.classList.contains("rail-btn")) el.click(); });
    $("railBadge").addEventListener("click", () => (menuOpen() ? closeMenu() : openMenu()));

    /* ---------- keyboard ---------- */
    function gridColumns() {
        return getComputedStyle($("allGrid")).gridTemplateColumns.split(" ").length || 1;
    }

    document.addEventListener("keydown", (e) => {
        if (busy) return;   // a launch / leave transition is running
        const key = e.key;
        const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;

        /* viewer open: game menu keys, otherwise only N (hide backdrop) and Escape */
        if (!$("viewer").hidden) {
            if (pauseOpen() && $("overlay").hidden) {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (key === "ArrowDown" || key === "Tab" && !e.shiftKey) { e.preventDefault(); movePause(1); }
                else if (key === "ArrowUp" || key === "Tab") { e.preventDefault(); movePause(-1); }
                else if (key === "Escape" || key === "b" || key === "B") { e.preventDefault(); closePause(); }
                else if (key === "a" || key === "A") {
                    e.preventDefault();
                    const el = document.activeElement;
                    (el && el.classList.contains("pause-item") ? el : $("pmContinue")).click();
                }
                return;   /* Enter / Space click the focused item natively */
            }
            if ((key === "n" || key === "N") && $("overlay").hidden && !e.ctrlKey && !e.metaKey && !e.altKey) {
                $("viewer").classList.toggle("no-bg");   // debug: hide the side backdrop
            } else if (key === "Escape") {
                if (!$("overlay").hidden) closePopup(); else closeGame();
            }
            return;
        }

        /* menu open: up/down move, right/B/Esc close, A/Enter choose */
        if (menuOpen() && $("overlay").hidden && $("detailsOverlay").hidden) {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const items = menuItems();
            const mi = items.indexOf(document.activeElement);
            if (key === "ArrowDown") { e.preventDefault(); items[(mi + 1) % items.length].focus(); }
            else if (key === "ArrowUp") { e.preventDefault(); items[(mi - 1 + items.length) % items.length].focus(); }
            else if (key === "ArrowRight" || key === "Escape" || key === "b" || key === "B") { e.preventDefault(); closeMenu(); }
            else if (key === "a" || key === "A") { e.preventDefault(); if (mi >= 0) items[mi].click(); }
            else if (key === "ArrowLeft") e.preventDefault();
            return;
        }

        if (key === "Escape") {
            if (!$("detailsOverlay").hidden) closeDetails();
            else if (!$("overlay").hidden) closePopup();
            else if (searchOpen()) closeSearch();
            return;
        }
        if (!$("overlay").hidden || !$("detailsOverlay").hidden) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        if (typing) {
            if (key === "ArrowDown") { e.preventDefault(); focusTile(selId); }
            return;
        }

        const list = tiles();
        const i = list.indexOf(document.activeElement);
        const cols = gridColumns();
        const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[key];
        if (key === "ArrowLeft" && (i < 0 || i % cols === 0)) {
            e.preventDefault();
            openMenu();
        } else if (move !== undefined && list.length) {
            e.preventDefault();
            const next = i < 0 ? 0 : Math.min(list.length - 1, Math.max(0, i + move));
            list[next].focus();
        } else if (key === "Home" && list.length) { e.preventDefault(); list[0].focus(); }
        else if (key === "End" && list.length) { e.preventDefault(); list[list.length - 1].focus(); }
        else if (key === "y" || key === "Y") cycleSort();
        else if (key === "x" || key === "X") openDetails();
        else if (key === "a" || key === "A") { if (selId != null) openGame(selId); }
        else if (key === "/") { e.preventDefault(); openSearch(); }
    });

    /* ---------- start ---------- */
    document.title = SITE.title || document.title;
    $("railBadge").textContent = (SITE.title || "A").trim().charAt(0) || "A";
    $("menuTitle").textContent = SITE.title || "Arcade";
    if (SITE.contact) {
        const link = $("contactLink");
        link.href = SITE.contact;
        link.hidden = false;
    }
    $("footerNote").textContent = SITE.footer || "";
    applyTheme();
    $("searchBar").addEventListener("input", () => render(false));
    render(false);
    focusTile(null, { preventScroll: true });

    const hash = location.hash.slice(1);
    if (hash) openGame(hash, true);
    else setTimeout(openMenu, 150);   // menu opens (animated) when the site first loads
})();
