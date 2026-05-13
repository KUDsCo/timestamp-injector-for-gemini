# Timestamp Injector

Browser extension to inject timestamps into AI chat interfaces (currently tailored for Gemini).

## Features

- Displays timestamps for each message in Gemini.
- **Customizable**: Adjust text color, font size, and date format via the extension popup.
- **New message support**: Automatically attaches a timestamp to newly generated messages as they appear.

*Note for Firefox users: Due to a long-standing Firefox extension bug regarding native color pickers in popups, the custom color picker is disabled on Firefox. Only the preset colors are available.*

## Project Structure

- `extension/` - Source code for the Chrome/Edge/Firefox Browser Extension.

## Installation

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
