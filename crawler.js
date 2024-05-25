const { CheerioCrawler } = require('crawlee');
const { createObjectCsvWriter } = require('csv-writer');
const axios = require('axios');
const cheerio = require('cheerio');

async function fetchDetailPage(url) {
    try {
        const response = await axios.get(url);
        const $detail = cheerio.load(response.data);
        const title = $detail('div.banner_right > h2').text().trim();
        const location = $detail('div.banner_right > b').text().trim();
        const fullDescription = $detail('div.job_detailData.editor_text').text().trim();
        const applyLink = $detail('div.custom_btnOuter > a').attr('href');
        const deadline = $detail('div.date_list li:last-of-type strong').text().trim().replace('Expires on: ', '');

        // Shorten description to the first 200 characters
        const shortDescription = fullDescription.length > 200 ? fullDescription.substring(0, 200) + "..." : fullDescription;

        return {
            title,
            location,
            shortDescription,
            applyLink,
            deadline
        };
    } catch (error) {
        console.error('Error fetching detail page:', error);
        return null;
    }
}

async function runCrawler() {
    const csvWriter = createObjectCsvWriter({
        path: './scholarships1.csv',
        header: [
            { id: 'title', title: 'Title' },
            { id: 'location', title: 'Location' },
            { id: 'shortDescription', title: 'Description' },
            { id: 'applyLink', title: 'Apply Link' },
            { id: 'deadline', title: 'Deadline' }
        ],
        append: true
    });

    const crawler = new CheerioCrawler({
        requestHandler: async ({ request, $ }) => {
            const page = request.userData.page;

            if (!request.userData.detail) {
                const details = $('a.position_click_btn').map((_, el) => $(el).attr('href')).get();
                const results = await Promise.all(details.map(fetchDetailPage));
                await csvWriter.writeRecords(results.filter(Boolean)); // Filter out any null results due to errors

                const nextPageLink = $('nav[aria-label="Pagination Navigation"] a[rel="next"]').attr('href');
                if (nextPageLink) {
                    await crawler.addRequests([{
                        url: nextPageLink,
                        userData: { detail: false, page: page + 1 }
                    }]);
                }
            }
        }
    });

    await crawler.addRequests([{
        url: 'https://www.scholarshipscafe.com/positions',
        userData: { detail: false, page: 1 }
    }]);

    await crawler.run();
}

runCrawler();
