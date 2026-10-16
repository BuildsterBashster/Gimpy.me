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
                theme: parsed && parsed.theme === "light" ? "light" : "dark"
            };
        } catch (e) {
            return { plays: {}, theme: "dark" };
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

    function openGame(id) {
        const game = GAMES.find((g) => String(g.id) === String(id));
        if (!game) return;
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
        const repo = $("repoBtn");
        if (/^https?:\/\//i.test(game.repo || "")) {
            repo.href = game.repo;
            repo.hidden = false;
        } else {
            repo.hidden = true;
            repo.removeAttribute("href");
        }
        setBadge(game);
        ratio = parseAspect(game.aspect) || parseAspect(SITE.defaultAspect) || 1120 / 1008;
        $("viewer").style.setProperty("--ar", String(ratio));
        $("viewer").hidden = false;
        layoutViewer();
        $("gameFrame").src = gameUrl(game);   // load only once the window has a real size
        document.body.style.overflow = "hidden";
        data.plays[game.id] = (data.plays[game.id] || 0) + 1;
        saveData();
        history.replaceState(null, "", "#" + game.id);
        $("closeBtn").focus();
    }

    function closeGame() {
        const closedId = currentGame ? currentGame.id : selId;
        $("viewer").hidden = true;
        $("gameFrame").src = "about:blank";
        document.body.style.overflow = "";
        currentGame = null;
        history.replaceState(null, "", location.pathname + location.search);
        selId = closedId;
        render(true);
    }

    $("closeBtn").addEventListener("click", closeGame);
    $("fsBtn").addEventListener("click", () => {
        const frame = $("gameFrame");
        if (frame.requestFullscreen) frame.requestFullscreen().catch(() => {});
    });
    $("tabBtn").addEventListener("click", () => {
        if (currentGame) window.open(gameUrl(currentGame), "_blank", "noopener");
    });

    /* ---------- settings popup ---------- */
    function openPopup() {
        $("settingsMsg").textContent = "";
        $("themeSelect").value = data.theme;
        $("overlay").hidden = false;
        $("themeSelect").focus();
    }
    function closePopup() { $("overlay").hidden = true; }

    $("settingsBtn").addEventListener("click", openPopup);
    $("popupClose").addEventListener("click", closePopup);
    $("overlay").addEventListener("click", (e) => { if (e.target === $("overlay")) closePopup(); });

    function applyTheme() { document.documentElement.dataset.theme = data.theme; }
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
    function menuOpen() { return document.body.classList.contains("menu-open"); }
    function menuItems() { return Array.from(document.querySelectorAll(".rail-btn")).filter((el) => !el.hidden); }
    function openMenu() {
        if (menuOpen()) return;
        void document.querySelector(".rail").offsetWidth;   // settle the collapsed layout first so the open animates
        document.body.classList.add("menu-open");
        const items = menuItems();
        const start = (view === "featured" && !$("navFeatured").hidden) ? $("navFeatured") : $("navAll");
        (items.includes(start) ? start : items[0]).focus({ preventScroll: true });
    }
    function closeMenu(refocus) {
        if (!menuOpen()) return;
        document.body.classList.remove("menu-open");
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
        const key = e.key;
        const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement;

        /* viewer open: only N (hide backdrop) and Escape */
        if (!$("viewer").hidden) {
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
    if (hash) openGame(hash);
    else setTimeout(openMenu, 150);   // menu opens (animated) when the site first loads
})();
