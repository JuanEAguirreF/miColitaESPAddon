if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}
const token = document.querySelector('meta[name="_token"]').content;
function toggleDisplay(elem) {
    const curDisplayStyle = elem.style.display;
    if (curDisplayStyle === "none" || curDisplayStyle === "") {
        elem.classList.add("no-active");
        elem.style.display = "block";
    } else {
        elem.classList.remove("no-active");
        elem.style.display = "none";
    }
}
function pad(d) {
    return d < 10 ? "0" + d.toString() : d.toString();
}
window.addEventListener("scroll", function (e) {
    const noActive = document.querySelector(".no-active");
    if (noActive == null) {
        var scrollY = window.pageYOffset || document.documentElement.scrollTop;
        var header = document.querySelector("header");
        scrollY <= this.lastScroll
            ? (header.style.visibility = "visible")
            : (header.style.visibility = "hidden");
        this.lastScroll = scrollY;
    }
});
const menu = document.getElementById("menu");
const overlay = document.getElementById("overlay");
const menuBar = document.getElementById("menu_bar");
const closeBar = document.getElementById("closeBar");
const menuContainer = document.querySelector(".menu__container");
const genresMenu = document.getElementById("genresMenu");
menu.addEventListener("click", function () {
    toggleDisplay(menuBar);
    toggleDisplay(overlay);
    document.getElementsByTagName("html")[0].classList.toggle("darkMode");
});
overlay.addEventListener("click", function () {
    toggleDisplay(menuBar);
    toggleDisplay(overlay);
});
closeBar.addEventListener("click", function () {
    toggleDisplay(menuBar);
    toggleDisplay(overlay);
});

const genresList = document.getElementById("genresList");
genresList.addEventListener("click", function () {
    toggleDisplay(genresMenu);
    toggleDisplay(menuContainer);
});
const closeGenreMenu = document.getElementById("closeGenreMenu");
closeGenreMenu.addEventListener("click", function () {
    toggleDisplay(genresMenu);
    toggleDisplay(menuContainer);
});

const seasonTitleChange = document.getElementById("seasonTitleChange");
if (seasonTitleChange) {
    const seasonTitle = document.getElementById("seasonTitle");
    const seasonAll = document.getElementById("seasonAll");
    seasonTitle.addEventListener("click", function () {
        toggleDisplay(seasonAll);
    });
    var seasonAllSelect = document.querySelectorAll("#seasonAll li");
    const episodeList = document.getElementById("episodeList");
    seasonAllSelect.forEach(function (e) {
        e.addEventListener("click", function (element) {
            var texto = element.target.outerText;
            seasonTitleChange.innerHTML = texto;
            var result = texto.replace("Temporada ", "");
            episodeList.innerHTML = seasonsJson[result]
                .map(function (episode) {
                    var imageNew = episode.image
                        ? "https://image.tmdb.org/t/p/w500" + episode.image
                        : "/images/placeholder.jpg";
                    return (
                        '<article class="item"><a class="itemA" href="' +
                        seasonUrl +
                        "/season/" +
                        episode.season +
                        "/episode/" +
                        episode.episode +
                        '"><div class="item__image"><img alt="S' +
                        pad(episode.season) +
                        "E" +
                        pad(episode.episode) +
                        ": " +
                        episode.title +
                        '" data-src="' +
                        imageNew +
                        '" src="/images/placeholder.jpg" width="100%" class="lazyload" height="auto"/></div><h2>S' +
                        pad(episode.season) +
                        "E" +
                        pad(episode.episode) +
                        ": " +
                        episode.title +
                        "</h2></a></article>"
                    );
                })
                .join("");

            seasonAllSelect.forEach(function (s) {
                s.classList.remove("active");
            });
            e.classList.add("active");
            toggleDisplay(seasonAll);
        });
    });
}

var suboptions = document.querySelectorAll(".subselect li");
if (suboptions.length > 0) {
    var options = null;
    options = document.querySelectorAll(".button");
    options.forEach(function (e) {
        e.addEventListener("click", function (element) {
            options.forEach(function (op) {
                op.classList.remove("active");
            });
            e.classList.toggle("active");
            e.classList.contains("toggle")
                ? e.classList.remove("toggle")
                : (document.querySelectorAll(".button").forEach(function (e) {
                      e.classList.remove("toggle");
                  }),
                  e.classList.add("toggle"));
        });
    });
    suboptions.forEach(function (element) {
        element.addEventListener("click", function (event) {
            var mv = event.currentTarget;
            var o = element.dataset.server;
            suboptions.forEach(function (element) {
                element.classList.remove("active");
            });
            mv.classList.add("active");
            options.forEach(function (op) {
                op.classList.remove("toggle");
            });
            const html =
                '<iframe id="video-embed" class="hide lazyload" data-src="/player/' +
                btoa(o) +
                '" frameborder="0" width="100%" height="500px" allowfullscreen></iframe>';
            document.querySelector("#player-tr").innerHTML = html;
        });
    });
}
const search = document.getElementById("search");

if (search) {
    var searchCollection = document.getElementById("search-collections-movies");
    var searchUrl = "/search/";
    var isSearching = false;
    var timeoutId;

    search.addEventListener("keyup", function (event) {
        if (
            event.key == "Alt" ||
            event.key == "Control" ||
            event.key == "CapsLock" ||
            event.key == "Shift" ||
            event.key == "Tab"
        ) {
            event.preventDefault();
            return;
        }
        if (!isAllowedKey(event.key)) {
            event.preventDefault();
            return;
        }
        event.stopImmediatePropagation();
        if (isSearching) {
            clearTimeout(timeoutId);
            isSearching = false;
        }

        history.pushState(
            null,
            null,
            "".concat(searchUrl).concat(search.value)
        );

        searchCollection.innerHTML =
            '<img class="searchimg" src="/images/loading.png" alt="Cargando...">';

        isSearching = true;

        timeoutId = setTimeout(function () {
            Search(search);
            isSearching = false;
        }, 5e2);

        document.getElementById("title").innerHTML =
            "Estas buscando:" + search.value;

        search.addEventListener("keydown", function (event) {
            // Cancelar la búsqueda si se presiona una tecla no permitida mientras se está escribiendo
            if (event.altKey || event.ctrlKey || !isAllowedKey(event.key)) {
                clearTimeout(timeoutId);
                isSearching = false;
            }
        });
    });
}

function isAllowedKey(key) {
    // Expresión regular para permitir letras con tildes, números, guiones y espacios
    return /^[a-zA-Z0-9áéíóúüÜÁÉÍÓÚñÑ\s\-]+$/.test(key);
}

function Search(e) {
    var request = new XMLHttpRequest();
    request.open("GET", "/api/search/" + search.value);
    request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            searchCollection.innerHTML = this.responseText;
        }
    };
    request.send();
}

function loadScript(url, callback) {
    var script = document.createElement("script");
    var firstScript = document.getElementsByTagName("script")[0];

    script.async = 1;
    script.onload = script.onreadystatechange = function (_, isAbort) {
        if (
            isAbort ||
            !script.readyState ||
            /loaded|complete/.test(script.readyState)
        ) {
            script.onload = script.onreadystatechange = null;
            script = undefined;
            !isAbort && callback && setTimeout(callback, 0);
        }
    };

    script.src = url;
    firstScript.parentNode.insertBefore(script, firstScript);
}

function removeComments() {
    var commentsElement = document.getElementById("comments");
    if (commentsElement) {
        commentsElement.remove();
    }
}

const commentsContainer = document.getElementById("comments");

if (commentsContainer) {
    commentsContainer.onclick = function () {
        commentsContainer.innerHTML =
            '<div class="comments_load">Cargando comentarios ...</div>';
        loadScript("https://plushd-tv.disqus.com/embed.js", removeComments);
    };
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

document.querySelectorAll(".playrn").forEach((item) => {
    item.addEventListener("click", (event) => {
        let ul = item.getAttribute("data-tr");
        let ol = b64_to_utf8(ul);
        let html =
            '<iframe width="100%" height="500px" class="hide lazyload" data-src="/player/' +
            btoa(btoa(ol)) +
            '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
        document.querySelector("#player-tr").innerHTML = html;
    });
});

var filterForm = document.getElementById("filterForm");

if (filterForm) {
    filterForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var route = document.getElementById("routeFilter").value;
        var categoria = document.getElementById("categoria").value;
        var year = document.getElementById("year").value;
        var redirectUrl = route + "/filter/" + year + "/" + categoria + "/1";
        window.location.href = redirectUrl;
    });
}
