# Security Policy

## Supported Versions

| Version | Supported | Support Status |
| --- | --- | --- |
| 4.x | :white_check_mark: | Active |
| 3.x | :white_check_mark: | Security fixes only, until February 7, 2027 |
| 2.x | :white_check_mark: | Security fixes only, until February 7, 2027 |
| 1.x | :x: | Not supported (end of life) since April 18, 2024 |
| 0.x | :x: | Not supported (end of life) since January 7, 2024 |

## Past Security Incidents

| Affected | Description | Severity | Vulnerability Type | Fixed in |
| --- | --- | --- | --- | --- |
| ≤ 4.0.0, ≤ 3.4.2, ≤ 2.2.8 | SSRF & credentials leak through a path the fetch layer reads as absolute. [Read more](https://github.com/johannschopplich/nuxt-api-party/security/advisories/GHSA-mwv3-j49v-jfp2) | High (8.6) | [CWE-918](https://github.com/advisories?query=cwe%3A918) | [4.0.1](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v4.0.1), [3.4.3](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v3.4.3), [2.2.9](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v2.2.9) |
| ≤ 0.21.3 | SSRF & credentials leak. [Read more](https://github.com/johannschopplich/nuxt-api-party/security/advisories/GHSA-3wfp-253j-5jxv) | High (7.5) | [CWE-918](https://github.com/advisories?query=cwe%3A918) | [0.22.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.22.0) |
| ≤ 0.21.3 | DoS by abusing `fetchOptions.retry`. [Read more](https://github.com/johannschopplich/nuxt-api-party/security/advisories/GHSA-q6hx-3m4p-749h) | High (7.5) | [CWE-674](https://github.com/advisories?query=cwe%3A674) | [0.22.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.22.0) |
| ≤ 0.12.0 | Leak secret tokens by changing `baseURL`. [Read more](https://huntr.dev/bounties/4c57a3f6-0d0e-4431-9494-4a1e7b062fbf/) | High (7.5) | [CWE-840](https://cwe.mitre.org/data/definitions/840.html) | [0.13.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.13.0) |

## Reporting a Vulnerability

To report a vulnerability, [draft a new security advisory](https://github.com/johannschopplich/nuxt-api-party/security/advisories/new). Please include the affected version and a request that reproduces the issue against a local backend.
