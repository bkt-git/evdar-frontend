document.addEventListener("DOMContentLoaded", () => {
    const box = document.querySelector(".login-bg");
    const loginCard = document.querySelector(".login-box");
    const loginBtn = document.querySelector("button[type='submit']");

    if (box) {
        // 1. Create Aurora
        const aurora = document.createElement("div");
        aurora.classList.add("aurora");
        box.prepend(aurora);

        // 2. Generate Stars
        for (let i = 0; i < 150; i++) {
            const star = document.createElement("div");
            star.classList.add("star");

            // Random properties
            const xy = Math.random() * 100;
            const duration = Math.random() * 3 + 2; // 2-5s
            const delay = Math.random() * 5;
            const size = Math.random() * 2 + 1; // 1-3px

            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.setProperty('--duration', `${duration}s`);
            star.style.setProperty('--delay', `${delay}s`);

            box.prepend(star);
        }

        // 3. Shooting Stars Loop
        function spawnShootingStar() {
            const shoot = document.createElement("div");
            shoot.classList.add("shooting-star");

            // Random start position (mostly top/right)
            shoot.style.top = `${Math.random() * 50 - 20}%`; // -20% to 30%
            shoot.style.left = `${Math.random() * 50 + 50}%`; // 50% to 100%

            // Random delay for next one
            shoot.style.animationDuration = `${Math.random() * 1 + 1}s`; // Faster

            box.appendChild(shoot);

            // Cleanup
            setTimeout(() => {
                shoot.remove();
            }, 3000);
        }

        // Spawn one every 4-8 seconds
        setInterval(spawnShootingStar, 4000);
        spawnShootingStar(); // Immediate start

        // 5. Click Star Burst
        box.addEventListener("click", (e) => {
            // Spawn 12 stars
            for (let i = 0; i < 12; i++) {
                const burst = document.createElement("div");
                burst.classList.add("burst-star");

                // Position at click
                burst.style.left = `${e.clientX}px`;
                burst.style.top = `${e.clientY}px`;

                // Random angle and distance
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 100 + 50; // 50-150px range
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                burst.style.setProperty('--tx', `${tx}px`);
                burst.style.setProperty('--ty', `${ty}px`);

                // Random size
                const size = Math.random() * 2 + 1;
                burst.style.width = `${size}px`;
                burst.style.height = `${size}px`;

                box.appendChild(burst);

                // Cleanup
                setTimeout(() => burst.remove(), 1000);
            }
        });

        // 4. 3D Tilt (Preserved)
        if (loginCard) {
            box.addEventListener("mousemove", (e) => {
                const centerX = window.innerWidth / 2;
                const centerY = window.innerHeight / 2;
                const x = e.clientX - centerX;
                const y = e.clientY - centerY;

                // 3D Tilt Logic
                const rotateX = -1 * (y / centerY) * 10;
                const rotateY = (x / centerX) * 10;

                loginCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            box.addEventListener("mouseleave", () => {
                loginCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
            });
        }
    }

    // Magnetic Button (Preserved)
    if (loginBtn) {
        loginBtn.addEventListener("mousemove", (e) => {
            const rect = loginBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            loginBtn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        loginBtn.addEventListener("mouseleave", () => {
            loginBtn.style.transform = "translate(0, 0)";
        });
    }
});

async function login(event) {
    event.preventDefault();
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const btn = document.querySelector("button[type='submit']");
    const form = document.querySelector(".login-box");

    const username = usernameInput.value;
    const password = passwordInput.value;

    // Loading State
    const originalText = btn.innerText;
    btn.innerText = "Logging in...";
    btn.disabled = true;

    // Clear previous error shakes
    form.classList.remove("shake");

    try {
        const API_BASE = "https://untempting-untemperamentally-renata.ngrok-free.dev";

        // Minimal artificial delay to show off the animation if it's too fast locally
        // await new Promise(r => setTimeout(r, 600)); 

        const res = await fetch(API_BASE + "/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) {
            throw new Error("Invalid credentials");
        }

        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data));

        // Success animation?
        btn.innerText = "Success!";
        btn.style.background = "#3b82f6"; // blue

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);

    } catch (err) {
        // Error State
        btn.innerText = originalText;
        btn.disabled = false;

        // Shake animation
        form.classList.add("shake");
        // remove class after animation so it can run again
        setTimeout(() => form.classList.remove("shake"), 500);

        console.error(err);
        // Optional: clear password
        passwordInput.value = "";
    }
}