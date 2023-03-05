## 🚀 The unexpected problem

The story starts a few weeks before the JEEMains Session 1, when I was looking for something to keep on my screen while I solved some practice questions. Instead of just solving the pyqs, I decided to build a basic static website with a countdown timer and a title. When I posted it on Reddit, it received about 70 upvotes. Over the next few months, the site had 10,000 pageviews and 40 daily users.

It was quite absurd, this was just a countdown timer, yet so many peeps used it.

Despite its simplicity, it seemed that many people found the countdown timer helpful. I received DMs on Discord and Reddit, asking me to add more examinations to the website. So, I decided to expand this project to help even more students.

<hr/>

## 🚀 Making it work

"I initially started the project using Svelte, but quickly realized my mistake and switched to Astro within a few hours of the hackathon starting. The development process with Astro was smooth, except for the usual CSS

The project is complete as its main feature is working, but adding smaller features would be the cherry on top.

Building the project amidst board examinations was a challenging task, but also a fun and insightful experience.

<hr/>

## 🚀 Project Structure

```
/
├── public/
├── src/
│   ├── components/
│   │   └──ugpagescomponents/
│   ├── layouts/
│   ├── pages/
│   │   └──ugpages/
│   └── styles/
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Installs dependencies                        |
| `npm run dev`     | Starts local dev server at `localhost:3000`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |
