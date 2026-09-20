(function () {
    const MIN_LENGTH = 2;

    function normalize(text) {
        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLocaleLowerCase("tr-TR")
            .replace(/ı/g, "i")
            .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s'-]/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function terms(query) {
        return normalize(query).split(/\s+/).filter(Boolean);
    }

    function articleMode() {
        const el = document.getElementById("article-search-mode");
        return !!el && el.classList.contains("active");
    }

    function meaningful(query, data) {
        const searchTerms = terms(query);
        const text = normalize([
            data?.meta?.title,
            data?.content,
            data?.plain_excerpt,
            data?.excerpt,
            data?.meta?.year,
            data?.meta?.article_number
        ].join(" "));

        return searchTerms.length &&
            searchTerms.every(term => text.includes(term));
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function createArea() {
        let area = document.getElementById("strict-pagefind-results");
        if (area) return area;

        area = document.createElement("div");
        area.id = "strict-pagefind-results";

        const builtIn = document.querySelector("pagefind-results");
        if (builtIn) {
            builtIn.style.display = "none";
            builtIn.parentNode.insertBefore(area, builtIn.nextSibling);
        }

        return area;
    }

    function message(area, text) {
        area.innerHTML =
            '<p class="pagefind-search-summary">' +
            escapeHtml(text) +
            '</p>';
    }

    function render(area, query, results) {
        if (!results.length) {
            message(area, query + " için eşleşen makale bulunamadı.");
            return;
        }

        const cards = results.map(data => {
            const title = data?.meta?.title || "Makale";
            const year = data?.meta?.year || "";
            const number = data?.meta?.article_number || "";
            const excerpt = data?.excerpt || "";

            return `
                <li class="custom-pagefind-result">
                    <a class="custom-pagefind-title"
                       href="${escapeHtml(data.url || "#")}">
                        ${escapeHtml(title)}
                    </a>
                    ${year ? `
                    <p class="custom-pagefind-meta">
                        Yıl: ${escapeHtml(year)}
                        ${number ? `&nbsp;·&nbsp; Makale Numarası: ${escapeHtml(number)}` : ""}
                    </p>` : ""}
                    ${excerpt ? `
                    <p class="custom-pagefind-excerpt">
                        ${excerpt}
                    </p>` : ""}
                </li>`;
        }).join("");

        area.innerHTML = `
            <p class="pagefind-search-summary">
                ${escapeHtml(query)} için ${results.length} sonuç bulundu
            </p>
            <ul class="pagefind-search-results">
                ${cards}
            </ul>`;
    }

    async function init() {
        const input = document.querySelector("pagefind-input");
        if (!input || !window.PagefindComponents) return;

        const area = createArea();
        const summary = document.querySelector("pagefind-summary");
        if (summary) summary.style.display = "none";

        const manager = window.PagefindComponents.getInstanceManager();
        const instance = manager.getInstance("default");

        instance.on("search", term => {
            if (!articleMode()) {
                area.innerHTML = "";
                return;
            }

            const query = String(term || "").trim();

            if (!query) {
                area.innerHTML = "";
            } else if (query.length < MIN_LENGTH) {
                message(area, "Aramak için en az 2 karakter girin.");
            }
        });

        instance.on("results", async searchResult => {
            if (!articleMode()) {
                area.innerHTML = "";
                return;
            }

            const query = String(instance.searchTerm || "").trim();

            if (!query) {
                area.innerHTML = "";
                return;
            }

            if (query.length < MIN_LENGTH) {
                message(area, "Aramak için en az 2 karakter girin.");
                return;
            }

            const loaded = await Promise.all(
                (searchResult.results || []).map(result => result.data())
            );

            const filtered = loaded.filter(data => meaningful(query, data));

            render(area, query, filtered);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
