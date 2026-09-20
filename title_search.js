(function () {
    let articles = [];

    function normalize(text) {
        return String(text || "")
            .toLocaleLowerCase("tr-TR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/ı/g, "i")
            .trim();
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function score(article, query) {
        const title = normalize(article.title);
        const q = normalize(query);

        if (title === q) return 400;
        if (title.startsWith(q)) return 300;

        const words = title.split(/\s+/);
        if (words.some(w => w === q)) return 250;
        if (words.some(w => w.startsWith(q))) return 200;

        return 100;
    }

    function search(query) {
        const results = document.getElementById("title-search-results");
        const count = document.getElementById("title-search-count");

        if (!results || !count) return;

        const q = normalize(query);

        if (!q) {
            results.innerHTML = "";
            count.textContent = "";
            return;
        }

        if (q.length < 2) {
            results.innerHTML = "";
            count.textContent = "Aramak için en az 2 karakter girin.";
            return;
        }

        const words = q.split(/\s+/).filter(Boolean);

        const matches = articles
            .filter(article => {
                const title = normalize(article.title);
                return words.every(word => title.includes(word));
            })
            .map(article => ({
                ...article,
                score: score(article, q)
            }))
            .sort((a, b) =>
                b.score - a.score ||
                Number(a.article_number) - Number(b.article_number)
            );

        count.textContent = `${matches.length} sonuç bulundu`;

        if (!matches.length) {
            results.innerHTML = `
                <p class="title-search-empty">
                    Aramanızla eşleşen bir makale bulunamadı.
                </p>`;
            return;
        }

        results.innerHTML = matches.map(article => `
            <a class="title-search-result" href="${escapeHtml(article.url)}">
                <span class="title-search-number">
                    ${escapeHtml(article.article_number)}
                </span>
                <span class="title-search-title">
                    ${escapeHtml(article.title)}
                </span>
                <span class="title-search-year">
                    (${escapeHtml(article.year)})
                </span>
            </a>
        `).join("");
    }

    async function load() {
        try {
            const response = await fetch("article_titles.json");
            if (!response.ok) throw new Error("article_titles.json could not be loaded");

            articles = await response.json();

            const input = document.getElementById("title-search-input");
            if (input) {
                input.addEventListener("input", () => {
                    search(input.value);

                    const clearButton = document.getElementById("title-search-clear");

                    if (clearButton) {
                        clearButton.style.display =
                            input.value.trim() ? "block" : "none";
                    }
                });
            }
        } catch (error) {
            console.error("Title search error:", error);
            const count = document.getElementById("title-search-count");
            if (count) count.textContent = "Başlık araması yüklenemedi.";
        }
    }

    window.clearTitleSearch = function () {
        const input = document.getElementById("title-search-input");
        const results = document.getElementById("title-search-results");
        const count = document.getElementById("title-search-count");
        const clearButton = document.getElementById("title-search-clear");

        if (input) input.value = "";
        if (results) results.innerHTML = "";
        if (count) count.textContent = "";

        if (clearButton) {
            clearButton.style.display = "none";
        }

        if (input) {
            input.focus();
        }
    };

    document.addEventListener("DOMContentLoaded", load);
})();
