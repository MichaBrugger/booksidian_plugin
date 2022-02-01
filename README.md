# Booksidian

Booksidian brings your Goodreads data to Obsidian.

You can set both the body and the frontmatter for your book-note by choosing from the list of parameters available over the Goodreads RSS feed (+ some extra that can be deduced from them like subtitle or series).

![image](https://user-images.githubusercontent.com/46029522/152006018-bfab5d8a-e829-4dbd-b19e-84a9af19e258.png)

## Setup Instructions

Please note that the way Goodreads handles their RSS feed, only the first 100 items of a shelf are added to the respective RSS feed. So if you have more than 100 books you'd like to export from one shelf, you have to split them into multiple shelves.

#### Creating Shelves
You can create those in Goodreads und `My Books` and then `Add shelf` in the left-side menu:
![image](https://user-images.githubusercontent.com/46029522/152001408-87c88a68-b161-4dfd-9845-d6036a05992b.png)

#### Getting the Feed Base-URL
You get the RSS Base URL by setting the items loaded per page to `infinite scroll` and then click the orange `RSS` button in the bottom right.

![image](https://user-images.githubusercontent.com/46029522/152004240-2580c551-d603-4119-9dd5-95a3bf68b764.png)


This will open a new page. You can now copy that URL and remove everything after the last "=". This is your RSS Base URL. After setting this, you can add all the shelves you'd like to download by just adding their names (separated by comma) in the settings.

![image](https://user-images.githubusercontent.com/46029522/152002763-444c05e1-3a5f-426b-9493-beb99deb9aa3.png)


## Output

In the end it's completely up to you how you style your book-notes. One thing I personally love is combining it with the `dataview plugin` and the new cards system in the `minimal theme`, which enables you to create beautiful little libraries like this: 

![image](https://user-images.githubusercontent.com/46029522/151970426-377a5997-7c15-4670-b423-17bb04b3720a.png)

You can achieve this look here by adding `cssclass: cards` to the frontmatter of the file you'd like to have your library in and then pasting this code here:

```dataview
table without id ("![](" + cover +")") as Cover, author as Author
where cover != null
sort rating desc
```

Please check out the amazing work of these two [here](https://github.com/blacksmithgu/obsidian-dataview) and [here](https://github.com/kepano/obsidian-minimal).

