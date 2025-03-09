import $ from 'jquery'
import { marked } from 'marked';
import "github-markdown-css";

const markdownContent = '```js\nconst x = 10;\n```';
const htmlContent = marked(markdownContent);

(() => {
  $('document').ready(() => {
  })
})()
