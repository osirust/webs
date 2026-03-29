const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const yearNode = document.getElementById("year");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
}

const closeMenu = () => {
    body.classList.remove("nav-open");
    menuToggle?.setAttribute("aria-expanded", "false");
};

if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = body.classList.toggle("nav-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (!body.classList.contains("nav-open")) {
            return;
        }

        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        if (!siteNav.contains(target) && !menuToggle.contains(target)) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    const desktopQuery = window.matchMedia("(min-width: 64rem)");
    desktopQuery.addEventListener("change", (event) => {
        if (event.matches) {
            closeMenu();
        }
    });
}

document.documentElement.classList.add("reveal-ready");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.18,
            rootMargin: "0px 0px -8% 0px",
        },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

const setupCarousel = (carousel) => {
    const scroller = carousel.querySelector("[data-scroller]");
    const slides = scroller ? [...scroller.querySelectorAll("[data-slide]")] : [];
    const prevButton = carousel.querySelector("[data-prev]");
    const nextButton = carousel.querySelector("[data-next]");
    const dotsWrap = carousel.querySelector("[data-dots]");

    if (!scroller || slides.length === 0) {
        return;
    }

    let activeIndex = 0;
    const slideRatios = new Map();

    const updateButtons = () => {
        if (prevButton) {
            prevButton.disabled = activeIndex === 0;
        }

        if (nextButton) {
            nextButton.disabled = activeIndex === slides.length - 1;
        }
    };

    const setActiveSlide = (index) => {
        activeIndex = index;

        slides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeIndex;
            slide.dataset.current = isActive ? "true" : "false";
            slide.setAttribute("aria-current", String(isActive));
        });

        if (dotsWrap) {
            [...dotsWrap.children].forEach((dot, dotIndex) => {
                const isActive = dotIndex === activeIndex;
                dot.setAttribute("aria-selected", String(isActive));
                dot.tabIndex = isActive ? 0 : -1;
            });
        }

        updateButtons();
    };

    const scrollToSlide = (index) => {
        const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
        slides[nextIndex].scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            inline: "center",
            block: "nearest",
        });
    };

    if (dotsWrap) {
        slides.forEach((slide, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", slide.querySelector("h3")?.textContent || `Слайд ${index + 1}`);
            dot.setAttribute("aria-selected", "false");
            dot.tabIndex = -1;
            dot.addEventListener("click", () => scrollToSlide(index));
            dotsWrap.appendChild(dot);
        });
    }

    prevButton?.addEventListener("click", () => scrollToSlide(activeIndex - 1));
    nextButton?.addEventListener("click", () => scrollToSlide(activeIndex + 1));

    if ("IntersectionObserver" in window) {
        const slideObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = slides.indexOf(entry.target);
                    if (index !== -1) {
                        slideRatios.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
                    }
                });

                const nextActive = [...slideRatios.entries()].sort((left, right) => right[1] - left[1])[0];
                if (nextActive && nextActive[1] > 0.24) {
                    setActiveSlide(nextActive[0]);
                }
            },
            {
                root: scroller,
                threshold: [0.2, 0.45, 0.65, 0.85],
                rootMargin: "0px -12% 0px -12%",
            },
        );

        slides.forEach((slide) => slideObserver.observe(slide));
    } else {
        let frameId = 0;

        const syncFromScroll = () => {
            frameId = 0;
            const scrollerLeft = scroller.scrollLeft;
            const scrollerCenter = scrollerLeft + scroller.clientWidth / 2;
            let nextActive = 0;
            let smallestDelta = Number.POSITIVE_INFINITY;

            slides.forEach((slide, index) => {
                const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
                const delta = Math.abs(slideCenter - scrollerCenter);
                if (delta < smallestDelta) {
                    smallestDelta = delta;
                    nextActive = index;
                }
            });

            setActiveSlide(nextActive);
        };

        scroller.addEventListener(
            "scroll",
            () => {
                if (frameId) {
                    return;
                }

                frameId = window.requestAnimationFrame(syncFromScroll);
            },
            { passive: true },
        );
    }

    setActiveSlide(0);
};

document.querySelectorAll("[data-carousel]").forEach(setupCarousel);

document.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
        if (!item.open) {
            return;
        }

        document.querySelectorAll(".faq-item").forEach((otherItem) => {
            if (otherItem !== item) {
                otherItem.open = false;
            }
        });
    });
});
