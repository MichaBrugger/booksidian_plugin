import { CurrentYAML } from "const/settings";
import { Book } from "src/Book";
import * as yaml from "js-yaml";


const FRONTMATTER_LINES = "---";

export class Frontmatter {
	constructor(
		public currentYAML: CurrentYAML,
		public book: Book,
	) {}

	public getFrontmatter(): string {
		return (
			FRONTMATTER_LINES +
			"\n" +
			this.getFrontmatterLines() +
			FRONTMATTER_LINES +
			"\n"
		);
	}

	private getFrontmatterLines(): string {
		const output: { [key: string]: number | string | string[] } = {};

		Object.keys(this.currentYAML).forEach((key: string) => {
			const value = this.currentYAML[key];
			const [prefix, postfix] = value.split(key);

			if (key === "shelves") {
				output[key] = this.book.shelves
					.split(",")
					.sort()
					.map((shelf) => {
						return `${prefix}${shelf}${postfix}`;
					});
			} else {
				output[key] =
					`${prefix}${this.book[key as keyof Book]}${postfix}`;
			}
		});

		return yaml.dump(output);
	}
}
