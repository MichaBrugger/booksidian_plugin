// If using TypeScript
import he from 'he';
// OR for JavaScript
// const he = require('he');

const testText = "The novel&#39;s themes include women&#39;s roles in society.";

console.log('Original:', testText);
console.log('Decoded:', he.decode(testText));


const test = "Some text with&#x2F;forward&#x2F;slashes and&#39;apostrophes";
console.log('Original:', test);
console.log('Decoded:', he.decode(test));