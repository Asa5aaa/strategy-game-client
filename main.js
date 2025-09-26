function log(msg) {
    console.log(msg);
    const logDiv = document.getElementById("log");
    logDiv.innerHTML += `<p>${msg}</p>`;
}

let config = {};
fetch("config.json")
    .then(r => r.json())
    .then(cfg => {
        config = cfg;
        log("✅ تنظیمات لود شد: " + JSON.stringify(config));
        startGame();
    })
    .catch(err => {
        log("🚨 خطا در لود config.json: " + err);
    });

async function startGame() {
    const url = `${config.api_base}/api/register`;
    log("📡 ارسال درخواست به: " + url);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@example.com", username: "asa" })
        });

        log("✅ وضعیت پاسخ: " + response.status);

        if (!response.ok) {
            const text = await response.text();
            log("❌ خطا از سرور: " + text);
            return;
        }

        const data = await response.json();
        log("🎉 ثبت‌نام موفق! Player ID: " + data.player_id);

        // ادامه بازی
        log("🎮 بازی شروع شد برای: " + data.player_id);
    } catch (err) {
        log("🚨 شکست در ارتباط: " + err);
    }
}
