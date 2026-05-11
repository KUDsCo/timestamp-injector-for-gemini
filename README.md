# Timestamp Injector

Browser extension and UserScripts to inject timestamps into AI chat interfaces (Gemini, ChatGPT).

## Features

- Displays timestamps for each message in Gemini and ChatGPT.
- **Customizable (Extension version)**: Adjust text color, font size, and date format via the extension popup.
- **New message support**: Automatically attaches a timestamp to newly generated messages as they appear.

## Project Structure

- `extension/` - Source code for the Chrome/Edge Browser Extension (currently tailored for Gemini).
- `userscripts/` - Greasemonkey/Tampermonkey scripts for Gemini and ChatGPT.
- `docs/` - Documentation and descriptions.

## Installation

### Browser Extension (Chrome / Edge)
1. Clone or download this repository.
2. Open your browser and go to the extensions page (`chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `extension/` directory.

### UserScript
1. Install a user script manager like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Click on the `.user.js` files in the `userscripts/` directory and install them.
   - Alternatively, install from GreasyFork: [ChatGPT Timestamp Injector](https://update.greasyfork.org/scripts/543305/ChatGPT%20Timestamp%20Injector.user.js).

## Usage

Simply open Gemini or ChatGPT. Timestamps will automatically be injected under each message. If you are using the extension, click the extension icon to customize the appearance and format of the timestamps.

## Privacy & Data Usage

This extension and script operate entirely locally within your browser. They do not collect, store, or transmit any personal data, chat history, or usage statistics to external servers. See the [Privacy Policy](PRIVACY_POLICY.md) for more details.

## License

MIT License
