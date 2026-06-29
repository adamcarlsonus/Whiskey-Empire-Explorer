# Privacy Policy for Whiskey Empire West

Last updated: June 28, 2026

Whiskey Empire West is a Chrome extension that helps users browse the Whiskey Empire list on the
Westside BloNo drink menu. It adds local search, sorting, filtering, and product search links to the
restaurant's existing public whiskey list.

This extension is designed to be privacy-first. It does not use accounts, analytics, advertising,
tracking, telemetry, or a backend server.

## Information the extension handles

When a user opens the supported restaurant drink-menu page and clicks **Scan whiskey list**, the
extension reads visible whiskey-list content from the current page and its public pagination links.
This may include public menu information such as whiskey names, distilleries, proof/ABV, visible
notes, serving sizes, prices, and source pagination status.

The extension does not collect:

- Names, email addresses, phone numbers, or account identifiers
- Login credentials, authentication cookies, or payment information
- Health information
- Personal communications
- User-generated form data
- General browsing history
- Analytics or usage events

## How information is used

Whiskey-list content is used only to provide the extension's user-facing features:

- Scanning the full Whiskey Empire list across pagination
- Normalizing public menu entries for display
- Searching and filtering visible text
- Sorting by name or price
- Displaying partial-scan or unsupported-page messages
- Creating a user-clicked Google Search link for an individual whiskey

The extension processes this information locally in the user's browser.

## Data sharing and transmission

The developer does not receive, collect, sell, rent, or share user data.

The extension does not send scanned whiskey entries, search text, filter selections, sort selections,
or usage information to any developer-operated server. There is no developer-operated server for this
extension.

During scanning, the extension may request the public restaurant menu page and public Untappd
pagination URLs that are linked from the current restaurant page. These requests are used only to
complete the user-requested scan of the public whiskey list.

If the user clicks a **Google Search** link for a whiskey, Chrome opens a new tab to Google Search
with a query based on that whiskey's displayed name and type. This happens only after the user clicks
the link. Google's handling of that search is governed by Google's own privacy policy.

## Storage and retention

Whiskey Empire West does not use persistent extension storage for scanned menu data.

Scanned entries, search text, filter selections, and sort selections are kept in memory in the current
browser tab so the enhanced panel can work. This temporary information is discarded when the panel is
closed, the page is reloaded, the user navigates away, or the tab is closed.

## Permissions

The extension requests only these Chrome extension permissions:

- `activeTab`: allows temporary access to the current tab after the user clicks the extension.
- `scripting`: allows the extension to inject its local scanner and interface into the active tab.

The extension does not request persistent host permissions, broad browsing-history permissions,
cookies permissions, identity permissions, storage permissions, or background access.

## Remote code

The extension does not execute remote code. Its JavaScript, CSS, icons, and assets are packaged with
the extension.

## Security

The extension minimizes data exposure by processing menu information locally, avoiding persistent
storage, avoiding analytics, and requesting the narrowest permissions needed for its single purpose.
Any network requests made by the extension are limited to the user-requested scan of the public
restaurant menu and validated public pagination URLs exposed by that page.

## Children's privacy

Whiskey Empire West is not directed to children and does not knowingly collect personal information
from children.

## Changes to this policy

This policy may be updated if the extension's functionality changes. Any material change to data
handling should be reflected in this policy and in the Chrome Web Store privacy disclosures.

