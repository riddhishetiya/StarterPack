(function () {
    var overlay = document.getElementById('galleryOverlay');
    var bar = overlay.querySelector('.cat-bar');
    var grid = overlay.querySelector('.gallery-grid');
    var sentinel = overlay.querySelector('.gallery-sentinel');
    var countEl = overlay.querySelector('.gallery-count');
    var scroller = overlay.querySelector('.gallery-scroll');
    var chatOverlay = document.getElementById('chatOverlay');

    /* Hand-drawn wobble for the lines */
    if (!document.getElementById('galWobble')) {
        var s = document.createElement('div');
        s.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
        s.innerHTML = '<svg width="0" height="0" aria-hidden="true"><filter id="galWobble" x="-4%" y="-4%" width="108%" height="108%">' +
            '<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/>' +
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
        document.body.appendChild(s);
    }

    /* Borrow sticker drawings if book is present */
    var bookEl = document.querySelector('.book-pages');
    if (bookEl) {
        var cs = getComputedStyle(bookEl);
        ['eye', 'bolt', 'cassette', 'checker', 'floppy', 'rec', 'xsmile', 'barcode'].forEach(function (n) {
            var v = cs.getPropertyValue('--st-' + n);
            if (v) overlay.style.setProperty('--st-' + n, v);
        });
    }

    /* FILTER button */
    var filterBtn = document.createElement('button');
    filterBtn.type = 'button';
    filterBtn.className = 'filter-btn';
    filterBtn.innerHTML = 'FILTER<span class="badge"></span><span class="arrow">\u25BC</span>';
    bar.parentNode.insertBefore(filterBtn, bar);
    var badge = filterBtn.querySelector('.badge');
    function setPanel(open) { bar.classList.toggle('open', open); filterBtn.classList.toggle('open', open); }
    filterBtn.addEventListener('click', function () { setPanel(!bar.classList.contains('open')); });
    function updateBadge() { badge.textContent = selected.size; badge.classList.toggle('show', selected.size > 0); }

    var BATCH = 36;
    var MODE = 'any';
    var COL_WIDTH = 230;
    var GAP = 26;
    var photos = [], filtered = [], shown = 0, selected = new Set(), loaded = false;
    var cols = [], heights = [];

    function open() { overlay.classList.add('show'); if (!loaded) { loaded = true; load(); } else relayout(); }
    function close() { overlay.classList.remove('show'); }
    document.getElementById('openGallery').addEventListener('click', open);
    overlay.querySelector('.gallery-close').addEventListener('click', close);
    
    document.addEventListener('keydown', function (e) {
        if (chatOverlay && chatOverlay.classList.contains('show')) {
            if (e.key === 'Escape') chatOverlay.classList.remove('show');
        } else if (e.key === 'Escape') close();
    });

    /* Load photo data */
    function load() {
        fetch(window.PHOTOS_URL || 'photos.json').then(function (r) { return r.json(); }).then(function (list) {
            photos = list; buildBar(); applyFilter();
        });
    }

    function buildBar() {
        var counts = {};
        photos.forEach(function (p) { p.cats.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); });
        bar.innerHTML = '';
        bar.appendChild(chip('All', photos.length, true));
        Object.keys(counts).sort().forEach(function (n) { bar.appendChild(chip(n, counts[n], false)); });
    }
    
    function chip(name, n, isAll) {
        var b = document.createElement('button');
        b.className = 'cat-chip' + (isAll ? ' on' : '');
        b.dataset.cat = isAll ? '' : name;
        b.innerHTML = name + '<b>' + n + '</b>';
        b.addEventListener('click', function () {
            if (isAll) selected.clear();
            else if (selected.has(name)) selected.delete(name);
            else selected.add(name);
            [].forEach.call(bar.children, function (c) {
                c.classList.toggle('on', c.dataset.cat ? selected.has(c.dataset.cat) : selected.size === 0);
            });
            updateBadge();
            applyFilter();
        });
        return b;
    }

    function applyFilter() {
        var sel = Array.from(selected);
        filtered = !sel.length ? photos : photos.filter(function (p) {
            return MODE === 'all'
                ? sel.every(function (c) { return p.cats.indexOf(c) > -1; })
                : sel.some(function (c) { return p.cats.indexOf(c) > -1; });
        });
        countEl.textContent = filtered.length + ' pics';
        scroller.scrollTop = 0;
        shown = 0;
        buildCols();
        if (!filtered.length) grid.innerHTML = '<div class="gallery-empty">nothing here yet\u2026</div>';
        else addBatch();
    }

    function buildCols() {
        var n = Math.max(2, Math.floor((grid.clientWidth + GAP) / (COL_WIDTH + GAP)));
        grid.innerHTML = ''; cols = []; heights = [];
        for (var i = 0; i < n; i++) { 
            var c = document.createElement('div'); 
            c.className = 'gal-col'; 
            grid.appendChild(c); 
            cols.push(c); 
            heights.push(0); 
        }
    }
    
    var FRAMES = ['f1', 'f2', 'f3', 'f1', 'f3', 'f2', 'f1'];
    
    function place(p, idx, animate) {
        var colW = grid.clientWidth / cols.length;
        var a = (p.w && p.h) ? p.w / p.h : 1;
        var k = 0; for (var i = 1; i < heights.length; i++) if (heights[i] < heights[k]) k = i;
        
        var fig = document.createElement('figure');
        fig.className = 'photo v' + (idx % 4) + ' ' + FRAMES[idx % FRAMES.length] + (idx % 4 === 1 ? ' tape' + (idx % 8 === 5 ? ' y' : '') : '');
        fig.style.setProperty('--a', a);
        fig.style.setProperty('--r', (((idx * 37) % 9) - 4) * 0.7 + 'deg');
        fig.style.setProperty('--tr', (((idx * 11) % 7) - 3) * 2 + 'deg');
        fig.style.setProperty('--dy', ((idx * 53) % 5) * 5 + 'px');
        if (!animate) fig.style.animation = 'none';
        
        var mat = document.createElement('span'); mat.className = 'mat';
        var img = new Image();
        img.src = p.thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
        mat.appendChild(img); fig.appendChild(mat);
        
        /* CLICKING PHOTO OPENS CHATROOM DIRECTLY */
        fig.addEventListener('click', function () {
            openChatRoom(p);
        });
        
        cols[k].appendChild(fig);
        heights[k] += colW / a + 40;
    }

    function addBatch() {
        filtered.slice(shown, shown + BATCH).forEach(function (p, i) { place(p, shown + i, true); });
        shown += BATCH;
    }

    function relayout() {
        if (!filtered.length) return;
        var n = Math.max(2, Math.floor((grid.clientWidth + GAP) / (COL_WIDTH + GAP)));
        if (n === cols.length) return;
        var upto = Math.min(shown, filtered.length);
        buildCols();
        for (var i = 0; i < upto; i++) place(filtered[i], i, false);
    }
    
    var rt; 
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 150); });

    new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && shown < filtered.length) addBatch();
    }, { root: scroller, rootMargin: '800px' }).observe(sentinel);
    
    scroller.addEventListener('click', function () { setPanel(false); });

   
    /* CHATROOM HANDLERS */
function openChatRoom(photo) {
    if (!chatOverlay) return;
    
    // Update description text dynamically from backend data or fallback to default
    var descEl = document.getElementById('chatImgDescription');
    if (descEl) {
        var defaultDesc = "A cool retro aesthetic piece capturing the raw energy of underground web culture and creative vision.";
        descEl.textContent = (photo && photo.desc) ? photo.desc : defaultDesc;
    }

    chatOverlay.classList.add('show');
}

    var closeChatBtn = document.getElementById('closeChat');
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', function () {
            if (chatOverlay) chatOverlay.classList.remove('show');
        });
    }
    
    if (chatOverlay) {
        chatOverlay.addEventListener('click', function (e) {
            if (e.target === chatOverlay) chatOverlay.classList.remove('show');
        });
    }

    var chatForm = document.getElementById('chatForm');
    var chatInput = document.getElementById('chatInput');
    var chatMessages = document.getElementById('chatMessages');

    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var text = chatInput.value.trim();
            if (!text) return;

            var timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var msgDiv = document.createElement('div');
            msgDiv.className = 'msg';
            msgDiv.innerHTML = '<span class="user">You [' + timeStr + ']:</span> ' + text;

            chatMessages.appendChild(msgDiv);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }
})();

function updateChatDates() {
    const now = new Date();
    
    // Formats as "November 9 Monday"
    const month = now.toLocaleString('en-US', { month: 'long' });
    const day = now.getDate();
    const weekday = now.toLocaleString('en-US', { weekday: 'long' });
    const fullDate = `${month} ${day} ${weekday}`;
    
    // Formats dial-up header as "11.09"
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const shortDate = `${mm}.${dd}`;

    const headerDateEl = document.getElementById('chatHeaderDate');
    const dialupDateEl = document.getElementById('dialupDate');

    if (headerDateEl) headerDateEl.textContent = fullDate;
    if (dialupDateEl) dialupDateEl.textContent = shortDate;
}

// Call it when the page loads
document.addEventListener('DOMContentLoaded', updateChatDates);

function startPerfClock() {
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const perfClockEl = document.getElementById('perfTime');
        if (perfClockEl) {
            perfClockEl.textContent = `${hours}.${minutes}`;
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

document.addEventListener('DOMContentLoaded', startPerfClock);