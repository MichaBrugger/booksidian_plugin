export interface GoodreadsBook {
	author: string;
	title: string;
	link: string;
	pubDate: string;
	isbn: string;
	user_review: string | undefined;
	book_description: string;
	user_rating: string;
	average_rating: string;
	user_read_at: string;
	user_date_added: string;
	book_published: string;
	identifiers: Identifiers;
	content: string;
	contentSnippet: string;
	guid: string;
	user_shelves: string;
	image_url: string;
}

export interface Identifiers {
	$: Book_id;
	num_pages: string[];
}

export interface Book_id {
	id: string;
}
