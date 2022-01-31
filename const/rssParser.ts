// eslint-disable-next-line @typescript-eslint/no-var-requires
const Parser = require("rss-parser");

// making small changes to the returned keys
export const rssParser = new Parser({
	customFields: {
		item: [
			["author_name", "author"],
			"isbn",
			"user_rating",
			"average_rating",
			"user_read_at",
			"user_date_added",
			"book_published",
			["book", "identifiers"],
			"user_shelves",
			["book_large_image_url", "image_url"],
		],
	},
});
