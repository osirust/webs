const body = document.body;
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const revealItems = [...document.querySelectorAll("[data-reveal]")];
const yearNode = document.getElementById("year");
const motionField = document.getElementById("motion-field");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
}

const closeMenu = () => {
    body.classList.remove("nav-open");
    if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
    }
};

if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
        const isOpen = body.classList.toggle("nav-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
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

if (motionField && !prefersReducedMotion) {
    const context = motionField.getContext("2d");
    const pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        active: false,
    };
    let width = 0;
    let height = 0;
    let ratio = 1;
    let particles = [];
    let animationFrame = 0;

    const createParticle = () => {
        const speedX = (Math.random() - 0.5) * 0.28;
        const speedY = (Math.random() - 0.5) * 0.28;

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: speedX,
            vy: speedY,
            baseVx: speedX,
            baseVy: speedY,
            size: Math.random() * 1.7 + 0.45,
            alpha: Math.random() * 0.55 + 0.15,
            accent: Math.random() < 0.12,
        };
    };

    const resizeField = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        ratio = Math.min(window.devicePixelRatio || 1, 2);

        motionField.width = Math.floor(width * ratio);
        motionField.height = Math.floor(height * ratio);
        motionField.style.width = `${width}px`;
        motionField.style.height = `${height}px`;

        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        particles = Array.from(
            { length: Math.max(28, Math.min(120, Math.round((width * height) / 22000))) },
            createParticle,
        );
    };

    const drawField = () => {
        context.clearRect(0, 0, width, height);

        particles.forEach((particle) => {
            if (pointer.active) {
                const dx = particle.x - pointer.x;
                const dy = particle.y - pointer.y;
                const distance = Math.hypot(dx, dy) || 1;
                const influence = 150;

                if (distance < influence) {
                    const force = (influence - distance) / influence;
                    particle.vx += (dx / distance) * force * 0.045;
                    particle.vy += (dy / distance) * force * 0.045;
                }
            }

            particle.vx += (particle.baseVx - particle.vx) * 0.035;
            particle.vy += (particle.baseVy - particle.vy) * 0.035;
            particle.x += particle.vx;
            particle.y += particle.vy;

            if (particle.x < -12) particle.x = width + 12;
            if (particle.x > width + 12) particle.x = -12;
            if (particle.y < -12) particle.y = height + 12;
            if (particle.y > height + 12) particle.y = -12;

            context.beginPath();
            context.fillStyle = particle.accent
                ? `rgba(23, 228, 234, ${particle.alpha})`
                : `rgba(255, 255, 255, ${particle.alpha})`;
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
        });

        animationFrame = window.requestAnimationFrame(drawField);
    };

    window.addEventListener("resize", resizeField);
    window.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;
    });
    window.addEventListener("pointerleave", () => {
        pointer.active = false;
    });
    window.addEventListener("blur", () => {
        pointer.active = false;
    });

    resizeField();
    drawField();

    window.addEventListener("beforeunload", () => {
        window.cancelAnimationFrame(animationFrame);
    });
}

const carousel = document.querySelector("[data-carousel]");

if (carousel) {
    const track = carousel.querySelector("[data-track]");
    const viewport = carousel.querySelector("[data-viewport]");
    const prevButton = carousel.querySelector("[data-prev]");
    const nextButton = carousel.querySelector("[data-next]");
    const dotsWrap = carousel.querySelector("[data-dots]");
    const cards = track ? [...track.children] : [];
    let currentIndex = Number(carousel.dataset.startIndex || 0);
    let touchStartX = 0;
    let touchDeltaX = 0;

    const moveToIndex = (newIndex) => {
        if (!track || !viewport || cards.length === 0) {
            return;
        }

        currentIndex = (newIndex + cards.length) % cards.length;

        cards.forEach((card, index) => {
            const distance = Math.abs(index - currentIndex);
            const wrappedDistance = Math.min(distance, cards.length - distance);

            if (wrappedDistance === 0) {
                card.dataset.state = "active";
                card.setAttribute("aria-hidden", "false");
            } else if (wrappedDistance === 1) {
                card.dataset.state = "near";
                card.setAttribute("aria-hidden", "true");
            } else {
                card.dataset.state = "far";
                card.setAttribute("aria-hidden", "true");
            }
        });

        const activeCard = cards[currentIndex];
        const centeredOffset =
            activeCard.offsetLeft - (viewport.clientWidth - activeCard.offsetWidth) / 2;
        const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
        const translateX = Math.min(Math.max(centeredOffset, 0), maxOffset);

        track.style.transform = `translateX(${-translateX}px)`;

        if (dotsWrap) {
            [...dotsWrap.children].forEach((dot, index) => {
                const isActive = index === currentIndex;
                dot.setAttribute("aria-selected", String(isActive));
                dot.setAttribute("tabindex", isActive ? "0" : "-1");
            });
        }
    };

    if (dotsWrap) {
        cards.forEach((card, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Перейти к отделу ${card.querySelector("h3")?.textContent || index + 1}`);
            dot.addEventListener("click", () => moveToIndex(index));
            dotsWrap.appendChild(dot);
        });
    }

    prevButton?.addEventListener("click", () => moveToIndex(currentIndex - 1));
    nextButton?.addEventListener("click", () => moveToIndex(currentIndex + 1));

    viewport?.addEventListener(
        "touchstart",
        (event) => {
            touchStartX = event.changedTouches[0].clientX;
        },
        { passive: true },
    );

    viewport?.addEventListener(
        "touchmove",
        (event) => {
            touchDeltaX = event.changedTouches[0].clientX - touchStartX;
        },
        { passive: true },
    );

    viewport?.addEventListener("touchend", () => {
        if (Math.abs(touchDeltaX) > 44) {
            moveToIndex(touchDeltaX < 0 ? currentIndex + 1 : currentIndex - 1);
        }

        touchDeltaX = 0;
    });

    window.addEventListener("resize", () => moveToIndex(currentIndex));
    moveToIndex(currentIndex);
}

document.querySelectorAll(".department-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        card.style.setProperty("--spot-x", `${x}%`);
        card.style.setProperty("--spot-y", `${y}%`);
    });

    card.addEventListener("pointerleave", () => {
        card.style.setProperty("--spot-x", "50%");
        card.style.setProperty("--spot-y", "50%");
    });
});

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
