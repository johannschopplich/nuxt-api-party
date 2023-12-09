# Security Policy

## Supported Versions

| Version | Supported | Support Status |
| --- | --- | --- |
| ≥ 0.22.x   | :white_check_mark: | Active |
| ≤ 0.21.x | :x: | Not supported (end of life) since December 9, 2023 |
| ≤ 0.12.x | :x: | Not supported (end of life) since June 27, 2023 |

## Past Security Incidents

| Affected  | Description | Severity | Vulnerability Type | Fixed in |
| --- | --- | --- | --- | --- |
| ≤ 0.21.3 | SSRF & Credentials Leak. [Read more](https://github.com/johannschopplich/nuxt-api-party/security/advisories/GHSA-3wfp-253j-5jxv) | High (7.5) | [CWE-918](https://github.com/advisories?query=cwe%3A918) | [0.22.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.22.0) |
| ≤ 0.21.3 | DOS by abusing `fetchOptions.retry`. [Read more](https://github.com/johannschopplich/nuxt-api-party/security/advisories/GHSA-q6hx-3m4p-749h) | High (7.5) | [CWE-674](https://github.com/advisories?query=cwe%3A674) | [0.22.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.22.0) |
| ≤ 0.12.0 | Leak secret tokens by changing `baseURL`. [Read more](https://huntr.dev/bounties/4c57a3f6-0d0e-4431-9494-4a1e7b062fbf/) | High (7.5) | [CWE-840](https://cwe.mitre.org/data/definitions/840.html) | [0.13.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.13.0) |

## Reporting a Vulnerability

To report a vulnerability, please [draft a new security advisory](https://github.com/johannschopplich/nuxt-api-party/security/advisories/new).
Alternatively, you can send an email to [pkg@johannschopplich.com](mailto:pkg@johannschopplich.com) with the word "SECURITY" in the subject line.
