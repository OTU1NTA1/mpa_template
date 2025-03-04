# mpa_template

ejs template

# install & run

yarn install
yarn dev

ejs ./src/pages。

# ejs template -> header.ejs

ejs template ./src/template
<%- include('./src/template/header.ejs') %>

# default index.html，

index.ejs ./src/pages
index.ts ./src/ts
index.scss ./src/scss

# out custom index.html

index.main.ejs ./src/pages
main.ts ./src/ts
main.scss ./src/scss

<!-- this will output development|production -->
<div><%= mode%></div>

console.log(PROCESS.MODE) // this will output development|production

# alias

<img src="~@img/logo.png">
