// 📌 خواندن config.json
let config = {};
fetch("config.json")
    .then(r => r.json())
    .then(cfg => {
        config = cfg;
        console.log("✅ Config loaded:", config);
    })
    .catch(err => {
        console.error("🚨 Cannot load config.json:", err);
        alert("config.json لود نشد!");
    });

// 📌 هندل دکمه تأیید
document.addEventListener("DOMContentLoaded", () => {
    const confirmBtn = document.getElementById("confirm");
    const cancelBtn = document.getElementById("cancel");

    if (confirmBtn) {
        confirmBtn.addEventListener("click", async () => {
            console.log("👉 Confirm clicked");

            // مقدار تستی (می‌تونی UI بذاری بعداً)
            const email = "test@example.com";
            const username = "asa";

            const url = `${config.api_base}/api/register`;
            console.log("📡 Sending request to:", url);

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, username })
                });

                console.log("✅ Raw response:", response);

                if (!response.ok) {
                    const text = await response.text();
                    console.error("❌ Server error:", text);
                    alert("خطا از سمت سرور: " + text);
                    return;
                }

                const data = await response.json();
                console.log("✅ Response JSON:", data);
                alert("ثبت‌نام موفق! Player ID: " + data.player_id);

                // اینجا می‌تونی بازی رو استارت بزنی
                startGame(data.player_id);

            } catch (err) {
                console.error("🚨 Fetch failed:", err);
                alert("ارتباط با سرور برقرار نشد: " + err);
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            console.log("👉 Cancel clicked");
            alert("لغو شد");
        });
    }
});

// 📌 تابع ساده شروع بازی (دیباگ)
function startGame(playerId) {
    console.log("🎮 Starting game for player:", playerId);
    alert("بازی شروع شد برای " + playerId);
}
