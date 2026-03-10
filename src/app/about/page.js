import { AppShell } from "@/components/app-shell";

export const metadata = {
  title: "About",
  description: "About this customized LightFeed instance.",
};

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/90 p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
      <h2 className="mb-6 text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-stone-700 dark:text-stone-300">
        {children}
      </div>
    </section>
  );
}

function Subsection({ title, children }) {
  return (
    <div className="border-t border-stone-200 pt-5 first:border-t-0 first:pt-0 dark:border-stone-700">
      <h3 className="mb-3 text-xl font-semibold text-stone-950 dark:text-stone-100">
        {title}
      </h3>
      <div className="space-y-3 text-[15px] leading-7 text-stone-700 dark:text-stone-300">
        {children}
      </div>
    </div>
  );
}

function DashList({ items }) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <p key={index} className="pl-4 -indent-4 leading-6">
          <span className="text-stone-900 dark:text-stone-100">- </span>
          {item}
        </p>
      ))}
    </div>
  );
}

function FeatureList({ items }) {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="pl-4 -indent-4 leading-6">
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            - {item.title}
          </span>
          : {item.text}
        </div>
      ))}
    </div>
  );
}

function LinkText({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-stone-900 underline underline-offset-4 hover:text-black dark:text-stone-100 dark:hover:text-white"
    >
      {children}
    </a>
  );
}

function InlineCode({ children }) {
  return (
    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-stone-800">
      {children}
    </code>
  );
}

export default function AboutPage() {
  return (
    <AppShell>
      <section className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600 dark:text-stone-300">
          About
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
          About this LightFeed customization
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700 dark:text-stone-300">
          Project background, changes from upstream, and credits.
        </p>
      </section>

      <div className="space-y-6">
        <Section title="About this project">
          <p>
            This RSS reader is based on the open-source project{" "}
            <LinkText href="https://github.com/Pixels4Cookies/lightfeed">
              LightFeed
            </LinkText>{" "}
            and customized for the <strong>i2b.ro</strong> setup.
          </p>

          <p>
            The goal of this project is simple: provide a{" "}
            <strong>clean, fast and easy-to-read source of news</strong>{" "}
            without relying on large news aggregators or individual media
            applications that are often heavy, filled with advertising, or
            difficult to navigate.
          </p>

          <p>
            This reader allows users to follow multiple news sources in one
            place while keeping the interface minimal and focused on
            readability.
          </p>

          <Subsection title="Motivation">
            <p>
              Many modern news applications and aggregators have become
              increasingly complex and advertisement-heavy. At the same time,
              most publishers already provide <strong>public RSS feeds</strong>,
              which allow readers to access headlines and article links
              directly.
            </p>

            <p>The motivation behind this project is therefore:</p>

            <DashList
              items={[
                <>
                  to provide a <strong>simple and fast reading interface</strong>
                </>,
                <>to avoid dependence on centralized news aggregators such as Google News</>,
                <>
                  to aggregate <strong>publicly available RSS feeds</strong>
                </>,
                <>to make news easier to browse without unnecessary clutter</>,
                <>
                  to keep the experience{" "}
                  <strong>lightweight, transparent, and easy to use</strong>
                </>,
              ]}
            />

            <p>
              The project is <strong>free to use</strong> and intended purely as
              a tool to help readers access publicly available news sources more
              conveniently.
            </p>
          </Subsection>

          <Subsection title="Scope of the customization">
            <p>
              This project extends the original <strong>LightFeed</strong>{" "}
              application with additional functionality aimed at improving
              usability, readability, and source handling.
            </p><br></br>

            <p>Key enhancements include:</p>

            <FeatureList
              items={[
                {
                  title: "Direct article reading with optional bypass tools",
                  text: "The interface provides multiple reading options such as direct article access and optional alternative reading paths.",
                },
                {
                  title: "Google News link resolution",
                  text: "Articles originating from Google News feeds are resolved to the original publisher URLs whenever possible.",
                },
                {
                  title: "Logo overrides for sources",
                  text: "Support is included for overriding source logos when RSS hostnames differ from the actual publisher domain, for example when using aggregated feeds such as Google News.",
                },
                {
                  title: "Source filtering",
                  text: "Articles can be filtered by source by clicking the source icon, allowing quick filtering of articles from specific publishers.",
                },
                {
                  title: "Feed ordering preferences",
                  text: "Users can reorder feeds according to their preference. Feed ordering is stored locally in the browser and applies only to the current user environment.",
                },
                {
                  title: "Independent saved articles",
                  text: "Saved articles are stored locally in the user's browser so each user or device maintains its own saved list.",
                },
                {
                  title: "Centralized configuration interface",
                  text: (
                    <>
                      Feed management and configuration tools are grouped under
                      the <InlineCode>/settings</InlineCode> section to reduce
                      clutter in the main navigation.
                    </>
                  ),
                },
                {
                  title: "Access protection through Cloudflare",
                  text: "Administrative functionality is protected through Cloudflare-based access controls.",
                },
              ]}
            />
          </Subsection>

          <Subsection title="How the content works">
            <p>
              This reader <strong>does not host or reproduce full news articles</strong>.
            </p>

            <p>Instead, the application:</p>

            <DashList
              items={[
                <>
                  retrieves <strong>public RSS feeds provided by publishers</strong>
                </>,
                <>
                  displays <strong>article titles, summaries, and links</strong>
                </>,
                <>
                  directs users to the <strong>original publisher website</strong>{" "}
                  to read the full article
                </>,
              ]}
            />

            <p>
              All article content remains hosted and controlled by the{" "}
              <strong>original publisher</strong>.
            </p>

            <p>
              This application functions purely as a{" "}
              <strong>news feed reader and aggregator</strong>, similar to
              traditional RSS readers.
            </p>
          </Subsection>

          <Subsection title="No manipulation of sources">
            <p>
              The application <strong>does not alter, edit, or manipulate the content</strong>{" "}
              of the news sources.
            </p>

            <p>
              Articles are presented exactly as provided through the publishers’
              RSS feeds, and all links point directly to the{" "}
              <strong>original source website</strong>.
            </p>
          </Subsection>

          <Subsection title="Copyright and fair use">
            <p>
              This system relies exclusively on{" "}
              <strong>publicly available RSS feeds</strong> intentionally
              provided by publishers for syndication and news distribution.
            </p>

            <p>The application:</p>

            <DashList
              items={[
                <><strong>does not republish full articles</strong></>,
                <><strong>does not copy protected editorial content</strong></>,
                <>only displays <strong>metadata available in RSS feeds</strong></>,
                <>always links directly to the <strong>publisher website</strong></>,
              ]}
            />

            <p>No copyright infringement is intended.</p>

            <p>
              If a publisher prefers not to have their feed listed, it can be
              removed upon request.
            </p>
          </Subsection>

          <Subsection title="Privacy and GDPR notice">
            <p>
              This application <strong>does not collect, process, or store personal data</strong>.
            </p>

            <p>Specifically:</p>

            <DashList
              items={[
                <>no user accounts are created</>,
                <>no personal information is collected</>,
                <>no analytics or tracking systems are used</>,
                <>no personal identifiers are stored</>,
              ]}
            />

            <p>
              The application does not handle{" "}
              <strong>personally identifiable information (PII)</strong>.
            </p>

            <p>Some local browser features may store non-personal preferences, such as:</p>

            <DashList
              items={[
                <>saved articles</>,
                <>feed ordering preferences</>,
                <>interface settings</>,
              ]}
            />

            <p>
              These values are stored <strong>locally in the user's browser</strong>{" "}
              and are <strong>never transmitted to a server</strong>.
            </p>

            <p>
              Because no personal data is processed, the system is designed to
              operate in a{" "}
              <strong>privacy-friendly manner consistent with GDPR principles</strong>.
            </p>
          </Subsection>

          <Subsection title="Publisher and takedown requests">
            <p>
              If you are a publisher, rights holder, or representative of a
              news organization and would like a feed or source removed, please
              contact us.
            </p>

            <p>We will review and process legitimate requests promptly.</p>

            <p>
              <strong>Contact email:</strong> contact [at] i2b [dot] ro
            </p>
          </Subsection>

          <Subsection title="Transparency">
            <p>
              This project aims to remain{" "}
              <strong>simple, transparent, and respectful of both readers and publishers</strong>.
            </p>

            <p>
              The software merely helps users organize and read publicly
              available news sources in a convenient way without altering the
              original content.
            </p>
          </Subsection>
        </Section>

        <Section title="Changelog">
          <Subsection title="0.2">
            <DashList
              items={[
                <>Added About page</>,
                <>Moved credits into About page</>,
                <>Added Markdown-rendered About + Changelog view on a single page</>,
                <>Updated customization version to 0.2</>,
              ]}
            />
          </Subsection>

          <Subsection title="0.1">
            <DashList
              items={[
                <>Added i2b.ro customization footer</>,
                <>Moved Create Feed action to Settings</>,
                <>Added theme quick toggle in navigation</>,
                <>Protected settings with Cloudflare-compatible header-based middleware</>,
                <>Added cookie-based feed ordering</>,
                <>Added source filtering by icon</>,
                <>Added saved articles improvements</>,
                <>Added Google News real URL decoding</>,
                <>Added PaywallSkip action</>,
                <>Added logo domain overrides</>,
              ]}
            />
          </Subsection>
        </Section>

        <Section title="Credits">
          <Subsection title="Original project">
            <DashList
              items={[
                <>LightFeed v1.4.1</>,
                <>
                  <LinkText href="https://github.com/Pixels4Cookies/lightfeed">
                    View source on GitHub
                  </LinkText>
                </>,
              ]}
            />
          </Subsection>

          <Subsection title="Services and components used in this customization">
            <DashList
              items={[
                <>
                  <LinkText href="https://logo.dev">logo.dev</LinkText> for
                  source and publisher logos
                </>,
                <>
                  <LinkText href="https://archive.is">archive.is</LinkText> for
                  archived article reading
                </>,
                <>
                  <LinkText href="https://paywallskip.com">PaywallSkip</LinkText>{" "}
                  for alternative article access
                </>,
              ]}
            />
          </Subsection>

          <Subsection title="URL decoding helper">
            <p>
              Google News URLs are converted to the real publisher URLs using:
            </p>

            <p>
              <InlineCode>src/tools/google_news_decode.py</InlineCode>
            </p>

            <p>
              This helper is used by the application flow that resolves Google
              News redirect-style links into direct article URLs.
            </p>
          </Subsection>
        </Section>
      </div>
    </AppShell>
  );
}