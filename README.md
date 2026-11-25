# Timestamp Injector

Browser extension to inject timestamps into AI chat interfaces (currently tailored for Gemini).

## Features

- Gemini が記録した各ターンの日時を、質問と回答の下に表示します。両方に同じターンの日時を使います。
- **Customizable**: Adjust text color, font size, and date format via the extension popup.
- 12時間（AM/PM）と24時間を切り替えられます。日時が届いていないターンは空欄になり、履歴の読み込み後に表示されます。

## Project Structure

- `extension/` - Source code for the Chrome/Edge/Firefox Browser Extension.

## Installation

### From the store

- **Chrome**: [Chrome Web Store](https://chromewebstore.google.com/detail/timestamp-injector-for-ge/onanhdgcojiopbbokcfkjafpebbmapcn)
- **Firefox**: [Firefox Add-ons (AMO)](https://addons.mozilla.org/uk/firefox/addon/timestamp-injector-for-gemini/)
- **Edge**: [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/timestamp-injector-for-ge/leanejedojdajemfoacfpljdggeloobf?hl=en-US)

### From source (unpacked)

1. Clone or download this repository.
2. Open your browser and go to the extensions page (`chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` directory.

*(For release builds, please use `npm run build` to generate zip files for each browser in the `dist/` directory.)*

## Usage

Simply open Gemini. Timestamps will automatically be injected under each message. Click the extension icon to customize the appearance and format of the timestamps.

## Privacy & Data Usage

This extension operates entirely locally within your browser. It does not collect, store, or transmit any personal data, chat history, or usage statistics to external servers. See the [Privacy Policy](PRIVACY_POLICY.md) for more details.

## License

MIT License
