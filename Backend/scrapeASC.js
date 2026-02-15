const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // turn OFF headless for debugging
        defaultViewport: null,
    });

    const page = await browser.newPage();

    await page.goto("https://www.agrarian.lk/ASCInformation.php", {
        waitUntil: "domcontentloaded",
    });

    // Wait for ANY select dropdown
    await page.waitForSelector("select");

    // Get all dropdowns on page
    const selects = await page.$$eval("select", els =>
        els.map(el => ({
            name: el.name,
            id: el.id
        }))
    );

    console.log("Dropdowns found:", selects);

    // Now grab district dropdown dynamically
    const districtOptions = await page.$$eval(
        "select option",
        options =>
            options
                .map(o => o.textContent.trim())
                .filter(text =>
                    text &&
                    text !== "Select District" &&
                    text !== "Select ASC"
                )
    );

    console.log("Found possible district options:", districtOptions.length);

    let allASCs = [];

    for (let district of districtOptions) {
        console.log("Processing:", district);

        await page.select("select", district);
        await page.waitForTimeout(2000);

        const ascList = await page.$$eval(
            "select option",
            options =>
                options
                    .map(o => o.textContent.trim())
                    .filter(text =>
                        text &&
                        text !== "Select ASC" &&
                        text !== district
                    )
        );

        ascList.forEach(name => {
            allASCs.push({
                name,
                district,
                province: "",
                address: "",
                phone: "",
                email: ""
            });
        });
    }

    fs.writeFileSync("asc_centers.json", JSON.stringify(allASCs, null, 2));

    console.log("Done! Saved asc_centers.json");
})();
