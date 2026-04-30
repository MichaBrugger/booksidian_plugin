import { FRONTMATTER_LINES } from "const/frontmatter";
import { CurrentYAML } from "const/settings";
import { Book } from "src/Book";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const yaml = require("js-yaml");

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
				output[key] = this.book.shelves.sort().map((shelf) => {
					return `${prefix}${shelf}${postfix}`;
				});
			} else {
				// If this a simple link, and the value of the string is empty, don't insert [[]]

				if (
					value == `[[${key}]]` &&
					this.book[key as keyof Book] == ""
				) {
					output[key] = "";
				} else {
					output[key] =
						`${prefix}${this.book[key as keyof Book]}${postfix}`;
				}
			}
		});

		return yaml.dump(output);
	}
}

/**
 * Return `content` with its leading frontmatter block removed. If there is
 * no leading `---` fence, or the opening fence has no matching closing
 * fence (malformed), `content` is returned unchanged so body data is never
 * destroyed.
 */
export function stripFrontmatter(content: string): string {
	const opening = FRONTMATTER_LINES + "\n";
	if (!content.startsWith(opening)) return content;

	const lines = content.split("\n");
	for (let i = 1; i < lines.length; i++) {
		if (lines[i] === FRONTMATTER_LINES) {
			return lines.slice(i + 1).join("\n");
		}
	}
	return content;
}
