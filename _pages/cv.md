---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

<div class="cv-section">
  <h2>Education</h2>
  <ul class="cv-list cv-list--plain">
    <li><strong>[Grado, ej. Ph.D. in Mathematical Biology]</strong> — [Universidad], [Año o "en curso"]</li>
    <li><strong>[Grado]</strong> — [Universidad], [Año]</li>
  </ul>
</div>

<div class="cv-section">
  <h2>Work experience</h2>
  <ul class="cv-list cv-list--plain">
    <li>
      <strong>[Cargo]</strong> — [Institución], [Años]
      <ul class="cv-list cv-list--plain cv-list--nested">
        <li>[Una línea sobre tus responsabilidades principales]</li>
      </ul>
    </li>
  </ul>
</div>

<div class="cv-section">
  <h2>Research</h2>
  <p class="cv-section__intro">
    A summary of my research areas — see the
    <a href="{{ base_path }}/research/">Research page</a> for the full list of publications in each.
  </p>
  <ul class="cv-list cv-list--plain">
    {% for item in site.data.research_areas %}
      {% if item.children %}
        <li>
          <strong>{{ item.title }}</strong>{% if item.description %} — {{ item.description }}{% endif %}
          <ul class="cv-list cv-list--plain cv-list--nested">
            {% for child in item.children %}
              <li>
                <a href="{{ base_path }}/research/#{{ child.id }}">{{ child.title }}</a>{% if child.description %} — {{ child.description }}{% endif %}
              </li>
            {% endfor %}
          </ul>
        </li>
      {% else %}
        <li>
          <a href="{{ base_path }}/research/#{{ item.id }}">{{ item.title }}</a>{% if item.description %} — {{ item.description }}{% endif %}
        </li>
      {% endif %}
    {% endfor %}
  </ul>
</div>

<div class="cv-section">
  <h2>Publications</h2>
  <ol class="cv-list cv-list--citations">
    {% assign pubs = site.publications | sort: "date" | reverse %}
    {% for post in pubs %}
      <li>
        {{ post.citation }}
        <a class="cv-list__link" href="{{ base_path }}{{ post.url }}">[details]</a>
      </li>
    {% endfor %}
  </ol>
</div>

<div class="cv-section">
  <h2>Talks</h2>
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
  <h2>Skills</h2>
  <ul class="cv-list cv-list--plain">
    <li>[Habilidad 1, ej. lenguajes de programación]</li>
    <li>[Habilidad 2]</li>
  </ul>
</div>

<div class="cv-section">
  <h2>Service and leadership</h2>
  <ul class="cv-list cv-list--plain">
    <li>[Servicio o rol de liderazgo]</li>
  </ul>
</div>

<style>
  /* ---------- CV: condensed, print-friendly lists ----------
     Deliberately NOT using the site's .archive__item card treatment
     here: a CV is meant to be scanned quickly or exported to PDF, where
     hover states and heavy visual chrome don't help. */

  .cv-section { margin-bottom: 2.4rem; }
  .cv-section h2 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 0.9rem 0;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid color-mix(in srgb, var(--global-text-color) 16%, transparent);
  }
  .cv-section__intro {
    font-size: 0.95rem;
    opacity: 0.85;
    margin: -0.3rem 0 1rem 0;
  }

  .cv-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
  }
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
  .cv-list--nested {
    margin-top: 0.4rem;
    margin-bottom: 0.2rem;
  }
  .cv-list--nested > li::before { background: var(--global-link-color); }

  /* citations: numbered, hanging indent -- the standard academic-CV look */
  .cv-list--citations {
    counter-reset: cv-citation;
  }
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

  @media print {
    .masthead, .page__footer, .sidebar, .cv-list__link { display: none !important; }
    .cv-section h2 { border-bottom-color: #000; }
  }
</style>
