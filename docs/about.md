# About this project

This RSS reader is based on the open-source project  
[LightFeed](https://github.com/Pixels4Cookies/lightfeed) and customized for the **i2b.ro** setup.

The goal of this project is simple: provide a **clean, fast and easy-to-read source of news** without relying on large news aggregators or individual media applications that are often heavy, filled with advertising, or difficult to navigate.

This reader allows users to follow multiple news sources in one place while keeping the interface minimal and focused on readability.

---

# Motivation

Many modern news applications and aggregators have become increasingly complex and advertisement-heavy. At the same time, most publishers already provide **public RSS feeds**, which allow readers to access headlines and article links directly.

The motivation behind this project is therefore:

- to provide a **simple and fast reading interface**
- to avoid dependence on centralized news aggregators such as Google News
- to aggregate **publicly available RSS feeds**
- to make news easier to browse without unnecessary clutter
- to keep the experience **lightweight, transparent, and easy to use**

The project is **free to use** and intended purely as a tool to help readers access publicly available news sources more conveniently.

---

# Scope of the customization

This project extends the original **LightFeed** application with additional functionality aimed at improving usability, readability, and source handling.

Key enhancements include:

- **Direct article reading with optional bypass tools**  
  The interface provides multiple reading options such as direct article access and optional alternative reading paths.

- **Google News link resolution**  
  Articles originating from Google News feeds are resolved to the **original publisher URLs** whenever possible.

- **Logo overrides for sources**  
  Support is included for overriding source logos when RSS hostnames differ from the actual publisher domain (for example when using aggregated feeds such as Google News).

- **Source filtering**  
  Articles can be filtered by source by clicking the source icon, allowing quick filtering of articles from specific publishers.

- **Feed ordering preferences**  
  Users can reorder feeds according to their preference.  
  Feed ordering is stored locally in the browser and applies only to the current user environment.

- **Independent saved articles**  
  Saved articles are stored locally in the user's browser so each user or device maintains its own saved list.

- **Centralized configuration interface**  
  Feed management and configuration tools are grouped under the `/settings` section to reduce clutter in the main navigation.

- **Access protection through Cloudflare**  
  Administrative functionality is protected through Cloudflare-based access controls.

---

# How the content works

This reader **does not host or reproduce full news articles**.

Instead, the application:

- retrieves **public RSS feeds provided by publishers**
- displays **article titles, summaries, and links**
- directs users to the **original publisher website** to read the full article

All article content remains hosted and controlled by the **original publisher**.

This application functions purely as a **news feed reader and aggregator**, similar to traditional RSS readers.

---

# No manipulation of sources

The application **does not alter, edit, or manipulate the content** of the news sources.

Articles are presented exactly as provided through the publishers’ RSS feeds, and all links point directly to the **original source website**.

---

# Copyright and fair use

This system relies exclusively on **publicly available RSS feeds** intentionally provided by publishers for syndication and news distribution.

The application:

- does **not republish full articles**
- does **not copy protected editorial content**
- only displays **metadata available in RSS feeds**
- always links directly to the **publisher website**

No copyright infringement is intended.

If a publisher prefers not to have their feed listed, it can be removed upon request.

---

# Privacy and GDPR notice

This application **does not collect, process, or store personal data**.

Specifically:

- no user accounts are created
- no personal information is collected
- no analytics or tracking systems are used
- no personal identifiers are stored

The application does not handle **personally identifiable information (PII)**.

Some local browser features may store **non-personal preferences**, such as:

- saved articles
- feed ordering preferences
- interface settings

These values are stored **locally in the user's browser** and are **never transmitted to a server**.

Because no personal data is processed, the system is designed to operate in a **privacy-friendly manner consistent with GDPR principles**.

---

# Publisher and takedown requests

If you are a publisher, rights holder, or representative of a news organization and would like a feed or source removed, please contact us.

We will review and process legitimate requests promptly.

Contact email:

**contact [at] i2b [dot] ro**

---

# Transparency

This project aims to remain **simple, transparent, and respectful of both readers and publishers**.

The software merely helps users organize and read publicly available news sources in a convenient way without altering the original content.