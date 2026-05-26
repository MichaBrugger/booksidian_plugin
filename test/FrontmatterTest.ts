import { stripFrontmatter } from "src/Frontmatter";

describe("stripFrontmatter", () => {
	test("file with frontmatter and body: returns body byte-identical", () => {
		const existing = "---\ntitle: old\n---\n# Heading\n\nMy notes.\n";
		expect(stripFrontmatter(existing)).toBe("# Heading\n\nMy notes.\n");
	});

	test("file with frontmatter only (no body): returns empty string", () => {
		expect(stripFrontmatter("---\ntitle: old\n---\n")).toBe("");
	});

	test("file with no frontmatter: returns content unchanged", () => {
		const existing = "Just some body text.\n";
		expect(stripFrontmatter(existing)).toBe(existing);
	});

	test("empty file: returns empty string", () => {
		expect(stripFrontmatter("")).toBe("");
	});

	test("body containing --- horizontal rules: only leading frontmatter block is stripped", () => {
		const existing =
			"---\ntitle: old\n---\nIntro\n\n---\n\nAfter rule\n";
		expect(stripFrontmatter(existing)).toBe(
			"Intro\n\n---\n\nAfter rule\n",
		);
	});

	test("malformed: opening --- with no closing --- returns content unchanged", () => {
		const existing = "---\ntitle: old\nno closing fence here\n";
		expect(stripFrontmatter(existing)).toBe(existing);
	});
});
