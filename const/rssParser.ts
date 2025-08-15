// there seems to be an issue with "import Parser from 'rss-parser';"
// I've decided to stick with the current way, even though it's not ideal

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Parser = require("rss-parser");

// making small changes to the returned keys
export const rssParser = new Parser({
	customFields: {
		item: [
			["author_name", "author"],
			"isbn",
			"user_rating",
			"user_review",
			"book_description",
			"average_rating",
			"user_read_at",
			"user_date_added",
			"user_date_created",
			"book_published",
			["book", "identifiers"],
			"user_shelves",
			["book_large_image_url", "image_url"],
		],
	},
});
