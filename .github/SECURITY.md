# Security Policy

## Supported Versions

| Version  | Supported          | Support Status                                  |
| -------- | ------------------ | ----------------------------------------------- |
| 0.13.x   | :white_check_mark: | Active                                          |
| ≤ 0.12.x | :x:                | Not supported (end of life) since June 27, 2023 |

## Past Security Incidents

| Affected  | Description | Severity | Vulnerability Type | Fixed in |
| --- | --- | --- | --- | --- |
| ≤ 0.12.0 | Leak secret tokens by changing `baseURL`. [Read more](https://huntr.dev/bounties/4c57a3f6-0d0e-4431-9494-4a1e7b062fbf/) | High (7.5) | [CWE-840: Business Logic Errors](https://cwe.mitre.org/data/definitions/840.html) | [0.13.0](https://github.com/johannschopplich/nuxt-api-party/releases/tag/v0.13.0) |

## Reporting a Vulnerability

To report a vulnerability, please email [pkg@johannschopplich.com](mailto:pkg@johannschopplich.com) and include the word "SECURITY" in the subject line.
