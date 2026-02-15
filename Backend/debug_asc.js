const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    console.log("Navigating to page...");
    await page.goto("https://www.agrarian.lk/ASCInformation.php", {
        waitUntil: "networkidle0", // Wait until network is idle
        timeout: 60000
    });

    console.log("Page loaded. Checking for frames...");

    // Dump main page HTML
    fs.writeFileSync("main_page.html", await page.content());
    console.log("Saved main_page.html");

    // Check frames
    const frames = page.frames();
    console.log(`Found ${frames.length} frames.`);

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        console.log(`Frame ${i}: ${frame.url()}`);

        try {
            const selects = await frame.$$("select");
            console.log(`  -> Found ${selects.length} <select> elements in this frame.`);

            if (selects.length > 0) {
                console.log("  !!! FOUND SELECTS HERE !!!");

                // Try to get options
                const options = await frame.$$eval("select option", opts => opts.map(o => o.textContent.trim()));
                console.log("  Sample options:", options.slice(0, 5));
            }
        } catch (e) {
            console.log("  -> Error accessing frame content:", e.message);
        }
    }

    // Keep browser open for a bit
    await new Promise(r => setTimeout(r, 10000));
    await browser.close();
})();
