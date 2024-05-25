const { CheerioCrawler } = require('crawlee');
const { createObjectCsvWriter } = require('csv-writer');

// CSV writer setup
const csvWriter = createObjectCsvWriter({
    path: './output.csv',
    header: [
        {id: 'title', title: 'Title'},
        {id: 'location', title: 'Location'},
        {id: 'description', title: 'Description'},
        {id: 'qualifications', title: 'Qualifications'},
        {id: 'applyLink', title: 'Apply Link'}  // New field for Apply link
    ],
    append: false  // Set to true if you want to append to existing data
});

const crawler = new CheerioCrawler({
    requestHandler: async ({ request, response, body, contentType, $ }) => {
        if (request.userData.detail) {
            const title = $('div.banner_right > h2').text().trim();
            const location = $('div.banner_right > b').text().trim();
            const description = $('div.job_detailData.editor_text').text().trim();
            const qualifications = $('div.job_detailList > div.job_detailData.editor_text').text().trim();
            const applyLink = $('div.custom_btnOuter > a').attr('href');  // Extracting the Apply button link

            // Log to console for debugging
            console.log(`Title: ${title}`);
            console.log(`Location: ${location}`);
            console.log(`Apply Link: ${applyLink}`);

            // Write data to CSV
            await csvWriter.writeRecords([{
                title,
                location,
                description,
                qualifications,
                applyLink  // Including the Apply link in the data to be written
            }]);

            console.log(`Data saved for: ${title}`);
        } else {
            console.log(`Scraping page: ${request.url}`);
            $('a.position_click_btn').each((index, element) => {
                const detailLink = $(element).attr('href');
                crawler.addRequests([{
                    url: detailLink,
                    userData: { detail: true }
                }]);
            });
        }
    }
});

async function runCrawler() {
    await crawler.addRequests([
        { url: 'https://www.scholarshipscafe.com/positions', userData: { detail: false } }
    ]);

    await crawler.run();
}

runCrawler();
