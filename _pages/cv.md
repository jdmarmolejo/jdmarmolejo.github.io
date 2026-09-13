---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<!-- Shown only in the printed / PDF version: the theme's own name heading
     lives in the sidebar, which the print stylesheet hides, so the
     document needs its own title here -- the equivalent of moderncv's
     \makecvtitle. -->
<div class="cv-title">
  <h1 class="cv-title__name">{{ site.author.name }}</h1>
  <p class="cv-title__tagline">Mathematical &amp; Computational Biology</p>
</div>

<div class="cv-intro">
  <p>
    I am a physicist with a master's in Computational Biology, and currently a PhD student in
    Applied Mathematics. Most of my work is focused in mathematical, theoretical and systems 
    biology. My skills span mathematical modelling and simulation of complex systems together
    with a solid grounding in molecular biology. I am especially interested in
    genetic network dynamics, stochasticity in gene expression, mathematical models of cell biology,
    synthetic biology, physiology and pharmacodynamics/pharmacokinetics.
  </p>
  <p class="cv-intro__contact">
    <i class="fa fa-envelope" aria-hidden="true"></i> {{ site.author.email }}
  </p>
  <div class="cv-actions">
    <button type="button" class="cv-download-btn" onclick="window.print()">
      <i class="fa fa-download" aria-hidden="true"></i> Download as PDF
    </button>
  </div>
</div>

<div class="cv-section">
  <h2>Education</h2>

  <h3>Academic background</h3>

  <div class="cv-entry">
    <div class="cv-entry__date">2024–</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">PhD in Biological Sciences <span class="cv-entry__status">(in progress)</span></div>
      <div class="cv-entry__sub">University of Edinburgh — Edinburgh, Scotland</div>
    </div>
  </div>

  <div class="cv-entry">
    <div class="cv-entry__date">2022–2024</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">MSc in Computational Biology</div>
      <div class="cv-entry__sub">Universidad de los Andes — Bogotá, Colombia</div>
      <div class="cv-entry__detail"><em>Growth Rate Influence on Quorum Sensing: From Dynamics to Antibiotic Responses</em></div>
    </div>
  </div>

  <div class="cv-entry">
    <div class="cv-entry__date">2016–2022</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">BSc in Physics</div>
      <div class="cv-entry__sub">Universidad de los Andes — Bogotá, Colombia</div>
      <div class="cv-entry__detail"><em>Analysis of Noise Propagation in Feedback-regulated Genetic Networks</em></div>
    </div>
  </div>

  <h3>Supplementary education</h3>
  <ul class="cv-list cv-list--plain">
    <li>Minor in Biology — Universidad de los Andes</li>
    <li>Minor in German Culture and Language — Universidad de los Andes</li>
  </ul>
</div>

<div class="cv-section">
  <h2>Skills</h2>

  <h3>Programming</h3>
  <ul class="cv-list cv-list--skills">
    <li><span class="cv-skill__name">Python</span><span class="cv-skill__level" aria-label="5 out of 5">●●●●●</span></li>
    <li><span class="cv-skill__name">Julia</span><span class="cv-skill__level" aria-label="5 out of 5">●●●●●</span></li>
    <li><span class="cv-skill__name">Wolfram Mathematica</span><span class="cv-skill__level" aria-label="5 out of 5">●●●●●</span></li>
    <li><span class="cv-skill__name">MATLAB</span><span class="cv-skill__level" aria-label="4 out of 5">●●●●○</span></li>
    <li><span class="cv-skill__name">R</span><span class="cv-skill__level" aria-label="3 out of 5">●●●○○</span></li>
    <li><span class="cv-skill__name">Java</span><span class="cv-skill__level" aria-label="3 out of 5">●●●○○</span></li>
    <li><span class="cv-skill__name">C++</span><span class="cv-skill__level" aria-label="2 out of 5">●●○○○</span></li>
  </ul>

  <h3>Wetlab</h3>
  <ul class="cv-list cv-list--plain cv-list--columns">
    <li>Cell culture and maintenance of cell lines</li>
    <li>DNA extraction and purification</li>
    <li>Gel electrophoresis and gel analysis</li>
    <li>Flow cytometry and fluorescence microscopy</li>
    <li>Preparation of solutions and culture media</li>
  </ul>

  <h3>Soft skills</h3>
  <ul class="cv-list cv-list--plain cv-list--columns">
    <li>Scientific communication</li>
    <li>Teamwork</li>
    <li>Creativity</li>
    <li>Critical thinking</li>
    <li>Proactivity</li>
  </ul>

  <h3>Languages</h3>
  <ul class="cv-list cv-list--skills">
    <li><span class="cv-skill__name">Spanish (native)</span><span class="cv-skill__level" aria-label="5 out of 5">●●●●●</span></li>
    <li><span class="cv-skill__name">English (IELTS C1)</span><span class="cv-skill__level" aria-label="5 out of 5">●●●●●</span></li>
    <li><span class="cv-skill__name">German</span><span class="cv-skill__level" aria-label="4 out of 5">●●●●○</span></li>
  </ul>
</div>

<div class="cv-section">
  <h2>Publications</h2>
  <h3>Scientific articles</h3>
  {% for category in site.publication_category %}
    {% assign catpubs = site.publications | where: "category", category[0] | sort: "date" | reverse %}
    {% if catpubs.size > 0 %}
      <h4 class="cv-subheading">{{ category[1].title }}</h4>
      {% for post in catpubs %}
        <div class="cv-entry">
          <div class="cv-entry__date">{{ post.date | date: "%Y" }}</div>
          <div class="cv-entry__body">
            <div class="cv-entry__detail">
              {{ post.citation }}
              <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
            </div>
          </div>
        </div>
      {% endfor %}
    {% endif %}
  {% endfor %}
</div>

<div class="cv-section">
  <h2>Experience</h2>
  <h3>Work experience</h3>

  <div class="cv-entry">
    <div class="cv-entry__date">2025</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">Teaching Assistant</div>
      <div class="cv-entry__sub">Physics Department, University of Edinburgh — Edinburgh, Scotland</div>
      <div class="cv-entry__detail">Demonstrated Experimental Physics 2 to second-year physics students, grading laboratory reports and assisting with experiments.</div>
    </div>
  </div>

  <div class="cv-entry">
    <div class="cv-entry__date">2022–2024</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">Research Assistant</div>
      <div class="cv-entry__sub">Biological Sciences Department, Universidad de los Andes — Bogotá, Colombia</div>
      <div class="cv-entry__detail">Finalised research from my undergraduate studies on noise propagation in transcriptional genetic cascades, then moved on to studying how cell growth rate affects the stochastic dynamics of gene expression in bacteria.</div>
    </div>
  </div>

  <div class="cv-entry">
    <div class="cv-entry__date">2023</div>
    <div class="cv-entry__body">
      <div class="cv-entry__title">Teaching Assistant</div>
      <div class="cv-entry__sub">Physics Department, Universidad de los Andes — Bogotá, Colombia</div>
      <div class="cv-entry__detail">Taught Experimental Physics 1 to first-year science and engineering students: delivering the course, grading laboratory reports, designing assessments, and assisting with experiments.</div>
    </div>
  </div>
</div>

<div class="cv-section">
  <h2>Teaching</h2>
  {% assign courses = site.teaching | sort: "date" | reverse %}
  {% for post in courses %}
    <div class="cv-entry">
      <div class="cv-entry__date">{{ post.date | date: "%Y" }}</div>
      <div class="cv-entry__body">
        <div class="cv-entry__detail">
          {{ post.title }}{% if post.type %}, {{ post.type }}{% endif %}{% if post.venue %}, {{ post.venue }}{% endif %}.
          <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
        </div>
      </div>
    </div>
  {% endfor %}
</div>

<div class="cv-section">
  <h2>Scientific conferences and workshops</h2>
  {% assign talks = site.talks | sort: "date" | reverse %}
  {% for post in talks %}
    <div class="cv-entry">
      <div class="cv-entry__date">{{ post.date | date: "%b %Y" }}</div>
      <div class="cv-entry__body">
        <div class="cv-entry__detail">
          {{ post.title }}.
          {% if post.type %}{{ post.type }}{% endif %}{% if post.venue %}, {{ post.venue }}{% endif %}{% if post.location %}, {{ post.location }}{% endif %}.
          <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
        </div>
      </div>
    </div>
  {% endfor %}
</div>

<style>
  /* ---------- CV title (print-only) ---------- */
  .cv-title { display: none; }
  .cv-title__name { font-size: 2rem; font-weight: 800; margin: 0 0 0.15rem 0; letter-spacing: -0.01em; }
  .cv-title__tagline {
    margin: 0 0 1.4rem 0;
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--global-base-color);
    font-weight: 700;
  }

  .cv-intro { margin-bottom: 2.2rem; }
  .cv-intro p { line-height: 1.65; }
  .cv-intro__contact { font-size: 0.92rem; opacity: 0.85; }
  .cv-actions { display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap; margin-top: 1.1rem; }
  .cv-download-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--global-base-color);
    color: var(--global-bg-color);
    border: none; border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-size: 0.95rem; font-weight: 600;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .cv-download-btn:hover { transform: translateY(-1px); opacity: 0.92; }
  .cv-actions__hint { font-size: 0.82rem; opacity: 0.65; }

  .cv-section { margin-bottom: 2.3rem; }
  .cv-section h2 {
    font-size: 1.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 1rem 0;
    padding-bottom: 0.4rem;
    color: var(--global-base-color);
    border-bottom: 2px solid var(--global-base-color);
  }
  .cv-section h3 {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 1.3rem 0 0.8rem 0;
    opacity: 0.75;
  }
  .cv-subheading {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.6;
    margin: 0.9rem 0 0.5rem 0;
  }

  /* ---------- unified dated-entry component ----------
     The recognisable "banking"-style moderncv trait: a narrow date
     column on the left, content on the right. Used for every section
     that has a date -- Education, Work experience, Publications,
     Teaching, Talks -- so the whole document reads as one coherent
     design instead of a mix of bullets and numbered lists. */
  .cv-entry {
    display: grid;
    grid-template-columns: 92px 1fr;
    column-gap: 1.2rem;
    margin-bottom: 1.15rem;
  }
  .cv-entry__date {
    text-align: right;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--global-base-color);
    padding-top: 0.2rem;
    white-space: nowrap;
  }
  .cv-entry__title { font-weight: 700; font-size: 1rem; line-height: 1.35; }
  .cv-entry__status { font-weight: 400; opacity: 0.7; font-size: 0.9em; }
  .cv-entry__sub { font-style: italic; opacity: 0.82; font-size: 0.92rem; margin-top: 0.15rem; }
  .cv-entry__detail { margin-top: 0.35rem; font-size: 0.94rem; line-height: 1.55; }
  .cv-entry .cv-entry__detail:only-child { margin-top: 0; }

  @media (max-width: 560px) {
    .cv-entry { grid-template-columns: 1fr; row-gap: 0.15rem; }
    .cv-entry__date { text-align: left; }
  }

  .cv-list { margin: 0; padding-left: 0; list-style: none; }
  .cv-list--plain > li {
    position: relative;
    padding-left: 1.1rem;
    margin-bottom: 0.55rem;
    line-height: 1.5;
  }
  .cv-list--plain > li::before {
    content: "";
    position: absolute;
    left: 0; top: 0.62em;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--global-base-color);
  }
  .cv-list--columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    column-gap: 1.5rem;
  }

  .cv-list--skills > li {
    display: flex; align-items: center; justify-content: space-between;
    max-width: 320px;
    padding: 0.2rem 0;
    border-bottom: 1px dotted color-mix(in srgb, var(--global-text-color) 14%, transparent);
    margin-bottom: 0.4rem;
  }
  .cv-skill__name { font-size: 0.95rem; }
  .cv-skill__level { color: var(--global-base-color); letter-spacing: 0.15em; font-size: 0.85rem; }

  .cv-list__link { margin-left: 0.35rem; font-size: 0.85em; opacity: 0.7; white-space: nowrap; }
  .cv-list__link:hover { opacity: 1; }

  /* ---------- print / PDF export ----------
     window.print() is the only way a static Jekyll/GitHub Pages site can
     turn its own live content into a PDF without a server -- so this
     stylesheet does the actual design work; nothing here is "just hiding
     stuff", it rebuilds the page into a proper document. */
  @media print {
    body { background: #fff !important; color: #1a1a1a !important; }
    .masthead, .page__footer, .sidebar, .cv-actions, .bg-scene { display: none !important; }
    #main { max-width: 100% !important; padding: 0 !important; }
    .page__title { display: none !important; }

    .cv-title { display: block !important; }

    .cv-section h2 { color: var(--global-base-color) !important; border-bottom-color: var(--global-base-color) !important; }
    .cv-entry__date, .cv-skill__level, .cv-title__tagline { color: var(--global-base-color) !important; }
    a { color: #1a1a1a !important; text-decoration: underline; }
    .cv-list__link { display: none; } /* URLs don't help on a printed page */

    .cv-section, .cv-entry, .cv-list > li { break-inside: avoid; }
    .cv-section h2, .cv-section h3 { break-after: avoid; }
  }
</style>
