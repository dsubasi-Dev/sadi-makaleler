(function () {

    function setupPagefindTranslations() {
        try {
            if (
                window.PagefindComponents &&
                typeof window.PagefindComponents.getInstanceManager === "function"
            ) {
                const manager =
                    window.PagefindComponents.getInstanceManager();

                const instance = manager.getInstance("default");

                if (instance && typeof instance.setTranslations === "function") {
                    instance.setTranslations({
                        clear_search: "Temizle"
                    });
                }
            }
        } catch (error) {
            console.warn("Pagefind translation setup failed:", error);
        }
    }

    function showSearchMode(mode) {
        const titleMode =
            document.getElementById("title-search-mode");

        const articleMode =
            document.getElementById("article-search-mode");

        const titleButton =
            document.getElementById("title-mode-button");

        const articleButton =
            document.getElementById("article-mode-button");

        if (!titleMode || !articleMode) return;

        const titleActive = mode === "title";

        titleMode.classList.toggle("active", titleActive);
        articleMode.classList.toggle("active", !titleActive);

        if (titleButton) {
            titleButton.classList.toggle("active", titleActive);
        }

        if (articleButton) {
            articleButton.classList.toggle("active", !titleActive);
        }

        if (titleActive && window.clearTitleSearch) {
            window.clearTitleSearch();
        }

        if (!titleActive) {
            const input =
                document.querySelector("pagefind-input input");

            if (input) {
                setTimeout(() => input.focus(), 50);
            }
        }
    }

    window.showSearchMode = showSearchMode;

    document.addEventListener("DOMContentLoaded", () => {

        showSearchMode("title");

        // Give Pagefind a moment to initialize
        setTimeout(setupPagefindTranslations, 100);
        setTimeout(setupPagefindTranslations, 500);
    });

})();