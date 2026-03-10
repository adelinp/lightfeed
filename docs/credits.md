
## Original project

- [LightFeed](https://github.com/Pixels4Cookies/lightfeed) v1.4.1
- [View source on GitHub](https://github.com/Pixels4Cookies/lightfeed)

## Services and components used in this customization

- [logo.dev](https://logo.dev) for source and publisher logos
- [archive.is](https://archive.is) for archived article reading
- [PaywallSkip](https://paywallskip.com) for alternative article access

## URL decoding helper

Google News URLs are converted to the real publisher URLs using:

`src/tools/google_news_decode.py`

This helper is used by the application flow that resolves Google News redirect-style links into direct article URLs.