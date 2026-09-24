/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Authentic HTML fixtures representing realistic crawled pages from sources/websites/
 * Used for deterministic processing and testing of metadata extraction & classification.
 */
export const SAMPLE_WEBSITE_HTML: Record<string, string> = {
  // --- PROGRAMMING ---
  'https://developer.mozilla.org/en-US/docs/Web/JavaScript': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>JavaScript | MDN Web Docs</title>
  <meta name="description" content="JavaScript (JS) is a lightweight interpreted or just-in-time compiled programming language with first-class functions for web development.">
  <link rel="canonical" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript">
</head>
<body>
  <header><nav>MDN Navigation</nav></header>
  <main>
    <h1>JavaScript (JS) Overview</h1>
    <p>JavaScript is a scripting or programming language that allows you to implement complex features on web pages. Whenever a web page does more than just sit there and display static information, JavaScript is likely involved.</p>
    <h2>Core Language Features</h2>
    <p>Standardized via ECMAScript, JavaScript features modern asynchronous syntax (async/await), typed arrays, modular imports, closures, and object prototypes for scalable frontend and backend runtime development.</p>
    <h2>Ecosystem & Tooling</h2>
    <p>Modern developers write TypeScript and JavaScript using package bundlers, Vite, Node.js, and frameworks like React to build interactive client-side web applications.</p>
  </main>
  <footer>MDN Footer</footer>
</body>
</html>`,

  'https://react.dev/blog/2024/12/05/react-19': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>React 19 is now stable – React Official Blog</title>
  <meta name="description" content="React 19 is now available on npm! Featuring Actions, Server Components, Document Metadata hooks, and asset preloading for frontend developers.">
  <link rel="canonical" href="https://react.dev/blog/2024/12/05/react-19">
</head>
<body>
  <article>
    <h1>React 19 Release Notes</h1>
    <p>In our React 19 release announcement, we shared that React 19 brings Actions, useActionState, Server Functions, ref as a prop, and automatic hydration improvements.</p>
    <h2>What is new in React 19?</h2>
    <p>Actions handle pending states, optimistic updates, and form submissions natively. The new React compiler automates memoization for high performance user interfaces.</p>
    <h2>Upgrading to React 19</h2>
    <p>To upgrade your web package dependencies, run npm install react@latest react-dom@latest. Most React 18 patterns are backwards compatible.</p>
  </article>
</body>
</html>`,

  'https://www.rust-lang.org/learn': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Learn Rust – Rust Programming Language</title>
  <meta name="description" content="Empowering everyone to build reliable and efficient software. Learn Rust through interactive tutorials, the Rust Book, and compiler borrow checker guides.">
  <link rel="canonical" href="https://www.rust-lang.org/learn">
</head>
<body>
  <main>
    <h1>Learn the Rust Programming Language</h1>
    <p>Rust offers memory safety without garbage collection, concurrency without data races, and zero-cost abstractions for systems programming.</p>
    <h2>Read the Book</h2>
    <p>Affectionately nicknamed The Book, The Rust Programming Language gives you an overview of language syntax, ownership rules, lifetimes, and cargo package management.</p>
    <h2>Rustlings Course</h2>
    <p>Small exercises to get you used to reading and writing Rust code, fixing compiler errors, and understanding pattern matching.</p>
  </main>
</body>
</html>`,

  'https://bun.sh/docs': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bun Documentation – Fast JavaScript Runtime & Package Manager</title>
  <meta name="description" content="Bun is an all-in-one JavaScript runtime, bundler, test runner, and package manager written in Zig with native speed and Node.js compatibility.">
  <link rel="canonical" href="https://bun.sh/docs">
</head>
<body>
  <main>
    <h1>Bun All-in-One JavaScript Runtime</h1>
    <p>Bun was built from scratch using Zig and JavaScriptCore to focus on performance, developer ergonomics, and native TypeScript execution without transpilation steps.</p>
    <h2>Package Manager Speed</h2>
    <p>Bun installs npm packages orders of magnitude faster by utilizing system copy_file_range and hardlinks.</p>
    <h2>Bundling & Serving</h2>
    <p>Bun includes a blazing-fast native bundler and HTTP web server module capable of handling millions of requests per second.</p>
  </main>
</body>
</html>`,

  'https://vite.dev/guide/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Getting Started | Vite Next Generation Frontend Tooling</title>
  <meta name="description" content="Vite is a modern build tool that aims to provide a faster and leaner development experience for modern web projects using native ES modules.">
  <link rel="canonical" href="https://vite.dev/guide/">
</head>
<body>
  <main>
    <h1>Getting Started with Vite</h1>
    <p>Vite consists of two major parts: a dev server that provides rich feature enhancements over native ES modules, and a build command that bundles your code with Rollup.</p>
    <h2>Lightning Fast Cold Starts</h2>
    <p>By pre-bundling dependencies with esbuild and serving source code over native ESM, Vite eliminates server bundling delays during development.</p>
  </main>
</body>
</html>`,

  'https://tailwindcss.com/docs/v4-upgrade-guide': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Upgrade Guide to Tailwind CSS v4 – Tailwind Documentation</title>
  <meta name="description" content="Comprehensive guide for migrating your frontend styles to Tailwind CSS v4 featuring the new high-speed Rust-powered engine and CSS-first configuration.">
  <link rel="canonical" href="https://tailwindcss.com/docs/v4-upgrade-guide">
</head>
<body>
  <main>
    <h1>Upgrading to Tailwind CSS v4</h1>
    <p>Tailwind CSS v4 is a ground-up rewrite of the framework, designed for speed and built using a new unified CSS-first configuration model.</p>
    <h2>New Engine Architecture</h2>
    <p>Built with Lightning CSS, Tailwind v4 compiles stylesheets up to 10x faster with a fraction of memory usage.</p>
  </main>
</body>
</html>`,

  'https://docs.python.org/3/tutorial/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>The Python Tutorial — Python 3 Documentation</title>
  <meta name="description" content="Python is an easy to learn, powerful programming language with efficient high-level data structures and an elegant syntax ideal for scripting and rapid application development.">
  <link rel="canonical" href="https://docs.python.org/3/tutorial/">
</head>
<body>
  <header><nav>Python Documentation</nav></header>
  <main>
    <h1>The Python Tutorial</h1>
    <p>Python is an easy to learn, powerful programming language. It has efficient high-level data structures and a simple but effective approach to object-oriented programming. Python elegant syntax and dynamic typing, together with its interpreted nature, make it an ideal language for scripting and rapid application development in many areas on most platforms.</p>
    <h2>An Informal Introduction to Python</h2>
    <p>In the following examples, input and output are distinguished by the presence or absence of prompts. Python supports integers, floating point numbers, strings, lists, dictionaries, tuples, and sets.</p>
    <h2>Control Flow Tools</h2>
    <p>Besides the while statement, Python uses the usual flow control statements known from other languages, with some twists: if statements, for statements, the range function, break and continue statements, and match statements.</p>
    <h2>Data Structures</h2>
    <p>This chapter describes more about list methods, using lists as stacks and queues, list comprehensions, the del statement, tuples and sequences, sets, and dictionaries.</p>
  </main>
  <footer>Python Software Foundation</footer>
</body>
</html>`,

  // --- TECHNOLOGY ---
  'https://github.com/torvalds/linux': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>torvalds/linux: Linux kernel source tree – GitHub</title>
  <meta name="description" content="Linux kernel source tree maintained by Linus Torvalds. The open source monolithic operating system kernel powering cloud servers, supercomputers, and mobile devices.">
  <link rel="canonical" href="https://github.com/torvalds/linux">
</head>
<body>
  <main>
    <h1>Linux Kernel Source Repository</h1>
    <p>Linux is a free software, open-source Unix-like operating system kernel created by Linus Torvalds in 1991. The codebase is primarily written in C with portions in Rust and assembly.</p>
    <h2>Subsystems & Architecture</h2>
    <p>Includes memory management, process scheduling, virtual file system (VFS), networking stack, device drivers, and namespace isolation for Docker and Linux containers.</p>
  </main>
</body>
</html>`,

  'https://sqlite.org/arch.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Architecture of SQLite – In-Process SQL Database Engine</title>
  <meta name="description" content="Technical architecture and internal subsystems of SQLite: tokenizer, parser, code generator, virtual machine (VDBE), B-Tree, pager, and OS interface.">
  <link rel="canonical" href="https://sqlite.org/arch.html">
</head>
<body>
  <main>
    <h1>The Architecture of SQLite</h1>
    <p>SQLite is structured into three main subsystems: the compiler subsystem (SQL frontend), the execution engine (virtual database engine VDBE), and the storage backend (B-tree and pager).</p>
    <h2>Virtual Database Engine (VDBE)</h2>
    <p>The VDBE is a register-based virtual machine that executes bytecode instructions produced by the SQL parser and code generator to read or write database records.</p>
  </main>
</body>
</html>`,

  'https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>What is Kubernetes? | Kubernetes Cloud Infrastructure</title>
  <meta name="description" content="Kubernetes is an open-source container orchestration system for automating software deployment, scaling, and management of containerized applications.">
  <link rel="canonical" href="https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/">
</head>
<body>
  <main>
    <h1>Introduction to Kubernetes Container Orchestration</h1>
    <p>Kubernetes provides a framework to run distributed systems resiliently. It takes care of scaling and failover for your application, provides deployment patterns, and manages cluster hardware resources.</p>
  </main>
</body>
</html>`,

  'https://docs.docker.com/get-started/overview/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Docker Overview | Containerization Platform Architecture</title>
  <meta name="description" content="Docker is an open platform for developing, shipping, and running applications using OS-level containerization for predictable environments.">
  <link rel="canonical" href="https://docs.docker.com/get-started/overview/">
</head>
<body>
  <main>
    <h1>Docker Platform Overview</h1>
    <p>Docker provides the ability to package and run an application in a loosely isolated environment called a container. The isolation and security allow you to run many containers simultaneously on a given host.</p>
  </main>
</body>
</html>`,

  'https://signal.org/docs/specifications/doubleratchet/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>The Double Ratchet Algorithm – Signal Cryptographic Protocol</title>
  <meta name="description" content="Cryptographic specification of the Double Ratchet Algorithm: providing end-to-end encryption with forward secrecy and break-in recovery for messaging protocols.">
  <link rel="canonical" href="https://signal.org/docs/specifications/doubleratchet/">
</head>
<body>
  <main>
    <h1>The Double Ratchet Cryptographic Algorithm</h1>
    <p>The Double Ratchet algorithm is used by two parties to exchange encrypted messages based on a shared secret key. The parties derive new keys for every message so that earlier keys cannot be calculated from later ones (forward secrecy).</p>
  </main>
</body>
</html>`,

  // --- SCIENCE ---
  'https://webb.nasa.gov/content/science/overview.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Science Overview – James Webb Space Telescope – NASA</title>
  <meta name="description" content="Explore the scientific mission of NASA's James Webb Space Telescope: observing the early universe, galaxy evolution, stellar nurseries, and exoplanet atmospheres.">
  <link rel="canonical" href="https://webb.nasa.gov/content/science/overview.html">
</head>
<body>
  <main>
    <h1>NASA James Webb Space Telescope Science Mission</h1>
    <p>The James Webb Space Telescope (JWST) is the premier space observatory of the next decade, studying every phase in the history of our Universe from the first luminous glows after the Big Bang to the formation of solar systems capable of supporting life on planets like Earth.</p>
    <h2>Infrared Astronomy & Deep Fields</h2>
    <p>Because the universe is expanding, light from the most distant cosmic objects shifts into infrared wavelengths. Webb's gold-coated mirrors capture deep cosmic fields.</p>
  </main>
</body>
</html>`,

  'https://www.nature.com/articles/d41586-quantum-computing': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quantum Computing Milestones and Coherence Times – Nature Science</title>
  <meta name="description" content="Peer-reviewed research into superconducting qubits, quantum error correction, and quantum physics coherence times in cryogenic physics laboratories.">
  <link rel="canonical" href="https://www.nature.com/articles/d41586-quantum-computing">
</head>
<body>
  <main>
    <h1>Breakthroughs in Quantum Physics and Superconducting Qubits</h1>
    <p>Physicists and quantum researchers have demonstrated unprecedented coherence times in superconducting circuits, bringing fault-tolerant quantum algorithms closer to physical reality.</p>
    <h2>Cryogenic Physics Experiments</h2>
    <p>Operating dilution refrigerators at temperatures below 15 millikelvin shields delicate quantum superposition states from thermal noise and electromagnetic interference.</p>
  </main>
</body>
</html>`,

  // --- EDUCATION ---
  'https://www.khanacademy.org/math/calculus-1': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Calculus 1 Course & Practice Lessons | Khan Academy Education</title>
  <meta name="description" content="Learn Calculus 1 with free interactive video lectures, practice exercises, syllabus guides, and student quizzes covering limits, derivatives, and integrals.">
  <link rel="canonical" href="https://www.khanacademy.org/math/calculus-1">
</head>
<body>
  <main>
    <h1>Calculus 1 Curriculum and Student Coursework</h1>
    <p>Welcome to the Khan Academy Calculus 1 education course! Designed for high school and university undergraduate students preparing for AP exams and college STEM degrees.</p>
    <h2>Course Syllabus Modules</h2>
    <p>Module 1 covers limits and continuity, Module 2 introduces differentiation rules, and Module 3 applies derivatives to optimization and physics problems.</p>
    <h2>Interactive Student Practice</h2>
    <p>Each unit includes auto-graded quizzes and detailed step-by-step tutoring solutions to help students master fundamental mathematical concepts.</p>
  </main>
</body>
</html>`,

  'https://ocw.mit.edu/courses/intro-to-algorithms/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Introduction to Algorithms | MIT OpenCourseWare Free Education</title>
  <meta name="description" content="Undergraduate MIT computer science curriculum featuring professor lecture notes, exam problems, syllabus, and study materials for algorithm analysis.">
  <link rel="canonical" href="https://ocw.mit.edu/courses/intro-to-algorithms/">
</head>
<body>
  <main>
    <h1>MIT Course 6.006: Introduction to Algorithms</h1>
    <p>This undergraduate college course teaches algorithmic design, time complexity analysis (Big-O notation), dynamic programming, divide-and-conquer, and graph algorithms.</p>
    <h2>Professor Lecture Series</h2>
    <p>Taught by leading academic professors in the MIT Department of Electrical Engineering and Computer Science.</p>
  </main>
</body>
</html>`,

  // --- NEWS ---
  'https://www.reuters.com/world/global-climate-summit-accord/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Global Climate Summit Reaches Historic Clean Energy Accord – Reuters News</title>
  <meta name="description" content="Breaking international news: Diplomats and world leaders agree to accelerate renewable energy deployment and carbon reduction targets at global summit.">
  <link rel="canonical" href="https://www.reuters.com/world/global-climate-summit-accord/">
</head>
<body>
  <article>
    <h1>Delegates Reach Landmark Global Energy Accord</h1>
    <p>GENEVA (Reuters) — Diplomats and government delegations concluded round-the-clock negotiations on Tuesday, signing a comprehensive multilateral agreement to phase down fossil fuels and double international clean energy investments by 2035.</p>
    <h2>Summit Spokesperson Briefing</h2>
    <p>A spokesperson for the summit announced that 142 nations approved the binding communique following bilateral compromise between emerging and developed economies.</p>
  </article>
</body>
</html>`,

  // --- BUSINESS ---
  'https://www.bloomberg.com/news/articles/global-markets-rally': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Global Stock Markets Rally Following Quarterly Earnings and Rate Forecast – Bloomberg</title>
  <meta name="description" content="Financial markets surge as corporate enterprise earnings beat quarterly expectations and central bank inflation forecasts indicate monetary easing.">
  <link rel="canonical" href="https://www.bloomberg.com/news/articles/global-markets-rally">
</head>
<body>
  <main>
    <h1>Stock Indices Surge on Strong Corporate Earnings and Economic Data</h1>
    <p>Wall Street equities and European markets traded higher on Wednesday as quarterly corporate profit margins surpassed consensus analyst estimates, buoyed by enterprise software demand and cooling consumer price inflation.</p>
    <h2>Corporate Revenue and Valuation Multiples</h2>
    <p>Venture capital investments and initial public offerings rebounded sharply, while treasury yields stabilized across benchmark ten-year bonds.</p>
  </main>
</body>
</html>`,

  // --- SPORTS ---
  'https://www.espn.com/football/fifa-world-cup-qualifiers': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FIFA World Cup Qualifiers Scores and Match Highlights – ESPN Sports</title>
  <meta name="description" content="Get live match scores, standings, team results, and player statistics from the international FIFA World Cup championship qualification rounds.">
  <link rel="canonical" href="https://www.espn.com/football/fifa-world-cup-qualifiers">
</head>
<body>
  <main>
    <h1>International Football World Cup Qualifiers Matchday Report</h1>
    <p>National teams competed in decisive tournament matches across three continents on Tuesday evening, with stunning goals in stoppage time reshaping group standings.</p>
    <h2>Head Coach Post-Match Press Conference</h2>
    <p>The manager praised the squad's defensive discipline and athletic endurance after holding their rivals to a crucial away draw in front of 68,000 spectators in the stadium.</p>
  </main>
</body>
</html>`,

  // --- ENTERTAINMENT ---
  'https://variety.com/feature/cannes-film-festival-screenings': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cannes Film Festival Premiere Reviews and Box Office Preview – Variety Entertainment</title>
  <meta name="description" content="In-depth coverage of cinematic world premieres, director interviews, festival awards, and Hollywood box office projections from the Cannes Croisette.">
  <link rel="canonical" href="https://variety.com/feature/cannes-film-festival-screenings">
</head>
<body>
  <main>
    <h1>Cannes Film Festival Red Carpet and Premiere Highlights</h1>
    <p>Acclaimed directors and international actors gathered on the French Riviera as jury members previewed competing feature films and documentary cinema entries.</p>
    <h2>Palme d'Or Contenders and Director Spotlights</h2>
    <p>Critics gave standing ovations to breakthrough theatrical indie dramas and high-concept science fiction thrillers eyeing global streaming releases.</p>
  </main>
</body>
</html>`,

  // --- HEALTH ---
  'https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cardiovascular Diseases: Prevention and Clinical Guidelines – WHO Health</title>
  <meta name="description" content="World Health Organization fact sheet on cardiovascular health, hypertension symptoms, clinical diagnosis, lifestyle therapy, and preventive medicine.">
  <link rel="canonical" href="https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases">
</head>
<body>
  <main>
    <h1>Cardiovascular Health, Disease Prevention, and Clinical Care</h1>
    <p>Cardiovascular diseases are the leading cause of mortality globally. Most cardiovascular conditions can be prevented by addressing behavioral risk factors such as physical inactivity, tobacco use, and unhealthy diet.</p>
    <h2>Clinical Diagnosis & Medical Therapy</h2>
    <p>Early detection through blood pressure screening, cholesterol management, and evidence-based pharmacotherapy reduces hospitalizations and coronary complications.</p>
  </main>
</body>
</html>`,

  // --- TRAVEL ---
  'https://www.lonelyplanet.com/articles/best-sustainable-travel-destinations': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Best Sustainable Travel Destinations & Eco-Tourism Itineraries – Lonely Planet Travel</title>
  <meta name="description" content="Discover top eco-friendly travel destinations, boutique hotels, scenic train itineraries, and responsible tourism guides for world travelers.">
  <link rel="canonical" href="https://www.lonelyplanet.com/articles/best-sustainable-travel-destinations">
</head>
<body>
  <main>
    <h1>Sustainable Travel Guides and Top Vacation Itineraries</h1>
    <p>Planning your next holiday? From scenic Alpine rail adventures to pristine coastal eco-resorts, explore destination guides that combine unforgettable cultural sightseeing with low-impact exploration.</p>
    <h2>Booking Flights, Boutique Hotels, and Local Tours</h2>
    <p>Tips on packing light luggage, securing train passes, and immersing in local communities off the beaten tourist path.</p>
  </main>
</body>
</html>`,

  // --- GENERAL ---
  'https://en.wikipedia.org/wiki/Okapi_BM25': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Okapi BM25 – Wikipedia, the free encyclopedia</title>
  <meta name="description" content="In information retrieval, Okapi BM25 is a probabilistic ranking function used by search engines to estimate the relevance of documents to a given search query.">
  <link rel="canonical" href="https://en.wikipedia.org/wiki/Okapi_BM25">
</head>
<body>
  <main>
    <h1>Okapi BM25 Information Retrieval</h1>
    <p>Okapi BM25 (BM is an abbreviation of Best Matching) is a bag-of-words retrieval function that ranks a set of documents based on the query terms appearing in each document, regardless of their inter-relationship.</p>
    <h2>The Ranking Function Formula</h2>
    <p>Given a query Q containing keywords q1 through qn, the BM25 score of a document D is evaluated using inverse document frequency (IDF), term frequency saturation controlled by parameter k1, and document length normalization parameterized by b.</p>
    <h2>Search Engine Implementations</h2>
    <p>Widely adopted by modern search systems including Lucene, Elasticsearch, and NexVora for fast, mathematically sound keyword scoring without black-box auction bias.</p>
  </main>
</body>
</html>`,

  'https://en.wikipedia.org/wiki/Portal:Contents': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Portal: Contents – Wikipedia Reference Directory</title>
  <meta name="description" content="General reference portal, category indexes, subject overviews, and broad encyclopedic topic directories across all human knowledge.">
  <link rel="canonical" href="https://en.wikipedia.org/wiki/Portal:Contents">
</head>
<body>
  <main>
    <h1>Wikipedia Knowledge Portal and Reference Directories</h1>
    <p>This page serves as a master general index and navigation guide to articles, portals, outlines, and topical overviews across the free encyclopedia.</p>
    <h2>Subject Overviews and Indexes</h2>
    <p>Browse general topics categorized by humanities, natural sciences, geography, history, and culture.</p>
  </main>
</body>
</html>`
};
