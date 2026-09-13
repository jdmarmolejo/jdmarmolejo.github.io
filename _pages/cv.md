---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<div class="cv-intro">
  <p>
    I am a physicist with a master's in Computational Biology, and currently a PhD student in
    Mathematical Biology. I work in mathematical, theoretical and systems biology, centred on
    modelling gene expression. My skills span mathematical modelling and simulation of complex
    systems together with a solid grounding in molecular biology. I am especially interested in
    genetic network dynamics, stochasticity in gene expression, synthetic biology, and
    pharmacodynamics/pharmacokinetics.
  </p>
  <p class="cv-intro__contact">
    <i class="fa fa-envelope" aria-hidden="true"></i> {{ site.author.email }}
  </p>
  <div class="cv-actions">
    <button type="button" class="cv-download-btn" onclick="window.print()">
      <i class="fa fa-download" aria-hidden="true"></i> Download as PDF
    </button>
    <span class="cv-actions__hint">Opens your browser's print dialog — choose "Save as PDF" as the destination.</span>
  </div>
</div>

<div class="cv-section">
  <h2>Education</h2>

  <h3>Academic background</h3>
  <ul class="cv-list cv-list--plain">
    <li>
      <strong>PhD in Biological Sciences</strong> (in progress) — University of Edinburgh, Edinburgh, Scotland, 2024–
    </li>
    <li>
      <strong>MSc in Computational Biology</strong> — Universidad de los Andes, Bogotá, Colombia, 2022–2024
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li><em>Growth Rate Influence on Quorum Sensing: From Dynamics to Antibiotic Responses</em></li>
      </ul>
    </li>
    <li>
      <strong>BSc in Physics</strong> — Universidad de los Andes, Bogotá, Colombia, 2016–2022
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li><em>Analysis of Noise Propagation in Feedback-regulated Genetic Networks</em></li>
      </ul>
    </li>
  </ul>

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
      <ol class="cv-list cv-list--citations">
        {% for post in catpubs %}
          <li>
            {{ post.citation }}
            <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
          </li>
        {% endfor %}
      </ol>
    {% endif %}
  {% endfor %}

  <h3>Books</h3>
  <ol class="cv-list cv-list--citations">
    <li>
      Marmolejo Lozano, J.D. <i>Las Crónicas de Ederneit: La travesía de la perla</i>. Fantasy novel,
      published at age 14. Held in university libraries in Colombia and the United States; led to
      interviews on international television, including CNN.
      <a class="cv-list__link" href="https://uniandes.primo.exlibrisgroup.com/permalink/57U_UDLA/1g0omtq/alma991004108009707681">[library record]</a>
    </li>
  </ol>
</div>

<div class="cv-section">
  <h2>Experience</h2>

  <h3>Other research projects</h3>
  <ul class="cv-list cv-list--plain">
    <li>
      <strong>Growth Rate Influence on Quorum Sensing: From Dynamics to Antibiotic Responses</strong>
      — Advisor: Juan Manuel Pedraza Leal, PhD. January 2022 – July 2024
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Developed a phenomenological model of how periodic sub-MIC antibiotic concentrations affect
          bacterial growth and gene expression at the single-cell level. Using ODE modelling and
          stochastic simulations, I showed theoretically that inhibiting growth could suppress the
          quorum-sensing network, suggesting Quorum Quencher drugs may be unnecessary. This was my
          master's thesis in Computational Biology.
          <a class="cv-list__link" href="https://repositorio.uniandes.edu.co/server/api/core/bitstreams/d24da508-7b2f-46b4-911a-c1982675d4e5/content">[thesis]</a>
        </li>
      </ul>
    </li>
    <li>
      <strong>Analysis of Noise Propagation in Feedback-regulated Genetic Networks</strong>
      — Advisor: Juan Manuel Pedraza Leal, PhD. August–December 2021
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Studied local noise and its propagation in a transcriptional circuit of two mutually
          feedback-coupled genes, and explored how specific feedback configurations affect circuit
          output dynamics, combining analytical work with Gillespie-algorithm simulations. This was
          my undergraduate thesis in Physics.
          <a class="cv-list__link" href="https://repositorio.uniandes.edu.co/entities/publication/c2947936-0fec-48e8-9e6c-5a592e138300">[thesis, in Spanish]</a>
        </li>
      </ul>
    </li>
    <li>
      <strong>Exploratory study on <em>E. coli</em> viability in culture media with hydrocarbons</strong>
      — Advisor: Juan Manuel Pedraza Leal, PhD. August–December 2021
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Conducted a statistical assessment of <em>E. coli</em> survival in diesel-containing culture
          media, to determine whether directed-evolution experiments were needed for the laboratory
          production of hydrocarbons chemically identical to diesel through synthetic biology.
        </li>
      </ul>
    </li>
    <li>
      <strong>Molecular dynamics simulation of simplified <em>S. aureus</em> membrane models</strong>
      — Advisor: Chad Leidy, PhD. January–June 2021
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Used molecular dynamics to simulate biophysical properties — lipid area, membrane thickness,
          lateral diffusion — to assess how cardiolipin affects these properties in the <em>S. aureus</em>
          membrane, in relation to antibiotic mechanisms.
        </li>
      </ul>
    </li>
    <li>
      <strong>Simulating the Impact of Cell Division on Gene Expression</strong>
      — Advisor: Juan Manuel Pedraza Leal, PhD. January–June 2021
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Studied how noise from cell division propagates into fluctuations in the expression of a
          constitutive gene, simulating growth, division and gene expression with Gillespie's
          algorithm and the PyEcoLib library.
        </li>
      </ul>
    </li>
    <li>
      <strong>CRISPOXYLUM: Gene Silencing in the Cocaine Metabolic Pathway of <em>Erythroxylum coca</em> Using CRISPR-Cas9</strong>
      — Advisor: Juan Manuel Pedraza Leal, PhD. January–July 2020
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>
          Designed a biological system to silence genes in the cocaine metabolic pathway of
          <em>Erythroxylum coca</em>, developed a deterministic model of the system, and examined the
          stochastic behaviour of the transcriptional network using Gillespie's algorithm.
        </li>
      </ul>
    </li>
  </ul>

  <h3>Work experience</h3>
  <ul class="cv-list cv-list--plain">
    <li>
      <strong>Teaching Assistant</strong>, Physics Department — University of Edinburgh, Edinburgh, Scotland, January–April 2025
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>Demonstrated Experimental Physics 2 to second-year physics students, grading laboratory reports and assisting with experiments.</li>
      </ul>
    </li>
    <li>
      <strong>Research Assistant</strong>, Biological Sciences Department — Universidad de los Andes, Bogotá, Colombia, August 2022–June 2024
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>Finalised research from my undergraduate studies on noise propagation in transcriptional genetic cascades, then moved on to studying how cell growth rate affects the stochastic dynamics of gene expression in bacteria.</li>
      </ul>
    </li>
    <li>
      <strong>Teaching Assistant</strong>, Physics Department — Universidad de los Andes, Bogotá, Colombia, January–December 2023
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>Taught Experimental Physics 1 to first-year science and engineering students: delivering the course, grading laboratory reports, designing assessments, and assisting with experiments.</li>
      </ul>
    </li>
  </ul>
</div>

<div class="cv-section">
  <h2>Teaching</h2>
  <ol class="cv-list cv-list--citations">
    {% assign courses = site.teaching | sort: "date" | reverse %}
    {% for post in courses %}
      <li>
        {{ post.title }}{% if post.type %}, {{ post.type }}{% endif %}{% if post.venue %}, {{ post.venue }}{% endif %}{% if post.date %}, {{ post.date | date: "%Y" }}{% endif %}.
        <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
      </li>
    {% endfor %}
  </ol>
</div>

<div class="cv-section">
  <h2>Scientific conferences and workshops</h2>
  <ol class="cv-list cv-list--citations">
    {% assign talks = site.talks | sort: "date" | reverse %}
    {% for post in talks %}
      <li>
        {{ post.title }}.
        {% if post.type %}{{ post.type }}{% endif %}{% if post.venue %}, {{ post.venue }}{% endif %}{% if post.location %}, {{ post.location }}{% endif %}{% if post.date %}, {{ post.date | date: "%B %Y" }}{% endif %}.
        <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
      </li>
    {% endfor %}
  </ol>
</div>

<style>
  /* ---------- CV: condensed, print-friendly lists ----------
     Deliberately NOT using the site's .archive__item card treatment
     here: a CV is meant to be scanned quickly or exported to PDF, where
     hover states and heavy visual chrome don't help. */

  .cv-intro { margin-bottom: 2.2rem; }
  .cv-intro p { line-height: 1.65; }
  .cv-intro__contact { font-size: 0.92rem; opacity: 0.85; }
  .cv-actions {
    display: flex; align-items: center; gap: 0.9rem; flex-wrap: wrap;
    margin-top: 1.1rem;
  }
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

  .cv-section { margin-bottom: 2.4rem; }
  .cv-section h2 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 0.9rem 0;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid color-mix(in srgb, var(--global-text-color) 16%, transparent);
  }
  .cv-section h3 {
    font-size: 1.02rem;
    font-weight: 700;
    margin: 1.4rem 0 0.6rem 0;
    color: var(--global-base-color);
  }
  .cv-subheading {
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.7;
    margin: 1rem 0 0.5rem 0;
  }
  .cv-section__intro {
    font-size: 0.95rem;
    opacity: 0.85;
    margin: -0.3rem 0 1rem 0;
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
  .cv-list--nested { margin-top: 0.4rem; margin-bottom: 0.2rem; }
  .cv-list--nested > li::before { background: var(--global-link-color); }
  .cv-list--columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    column-gap: 1.5rem;
  }

  /* skill proficiency rows */
  .cv-list--skills > li {
    display: flex; align-items: center; justify-content: space-between;
    max-width: 320px;
    padding: 0.2rem 0;
    border-bottom: 1px dotted color-mix(in srgb, var(--global-text-color) 14%, transparent);
    margin-bottom: 0.4rem;
  }
  .cv-skill__name { font-size: 0.95rem; }
  .cv-skill__level { color: var(--global-base-color); letter-spacing: 0.15em; font-size: 0.85rem; }

  /* citations: numbered, hanging indent -- the standard academic-CV look */
  .cv-list--citations { counter-reset: cv-citation; }
  .cv-list--citations > li {
    counter-increment: cv-citation;
    position: relative;
    padding-left: 2.1rem;
    margin-bottom: 0.85rem;
    line-height: 1.55;
    font-size: 0.96rem;
  }
  .cv-list--citations > li::before {
    content: counter(cv-citation) ".";
    position: absolute;
    left: 0;
    width: 1.7rem;
    text-align: right;
    color: color-mix(in srgb, var(--global-text-color) 60%, transparent);
    font-variant-numeric: tabular-nums;
  }
  .cv-list__link {
    margin-left: 0.35rem;
    font-size: 0.85em;
    opacity: 0.7;
    white-space: nowrap;
  }
  .cv-list__link:hover { opacity: 1; }

  /* ---------- print / PDF export ----------
     The "Download as PDF" button just calls window.print(): a static
     Jekyll/GitHub Pages site has no server able to render a PDF on
     demand, so the browser's own print pipeline is what stays
     automatically in sync with the page's content -- no separate file
     to regenerate whenever a publication, talk or course is added. */
  @media print {
    body { background: #fff !important; color: #111 !important; }
    .masthead, .page__footer, .sidebar, .cv-actions, .bg-scene { display: none !important; }
    #main { max-width: 100% !important; padding: 0 !important; }
    .cv-section h2, .cv-section h3 { color: #111 !important; }
    .cv-section h2 { border-bottom-color: #111 !important; }
    .cv-list--plain > li::before, .cv-list--nested > li::before { background: #111 !important; }
    .cv-list--citations > li::before { color: #111 !important; }
    .cv-skill__level { color: #111 !important; }
    a { color: #111 !important; text-decoration: underline; }
    .cv-section, .cv-list > li { break-inside: avoid; }
  }

  @media (max-width: 600px) {
    .cv-list--skills > li { max-width: none; }
  }
</style>
