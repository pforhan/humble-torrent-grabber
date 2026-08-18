# Humble Torrent Grabber

A Firefox extension to easily grab selected Humble Bundle torrent links and submit them directly to qBittorrent via its Web API.

## Features
- **Selective Grabbing**: Only grabs `.torrent` links that are toggled "on" in the Humble Bundle UI.
- **qBittorrent Integration**: Connects to qBittorrent's Web UI to automate torrent addition.
- **Customization**: Set specific download paths and tags per session.
- **Verification**: Displays a list of found torrents before submission.

## Installation

1. **Enable qBittorrent Web UI**:
   - Open qBittorrent.
   - Go to `Tools` $\rightarrow$ `Options` $\rightarrow$ `Web UI`.
   - Check **Web User Interface (Remote control)**.
   - Note the port (default `8080`) and set your preferred username and password.

2. **Load the Extension in Firefox**:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on...**.
   - Select the `manifest.json` file from the `humble-torrent-grabber` directory.

## Usage

1. **Configure Settings**:
   - Right-click the extension icon $\rightarrow$ **Manage Extension** $\rightarrow$ **Options**.
   - Enter the **Web UI URL** (e.g., `http://localhost:8080`), **Username**, and **Password**.
   - Click **Save Settings**.

2. **Grab and Download**:
   - Navigate to your Humble Bundle purchase page.
   - Use the site's toggles to select the torrents you want.
   - Click the extension icon in your toolbar.
   - Enter the absolute **Save Path** on your machine (e.g., `/home/user/Downloads/HumbleBundle`).
   - (Optional) Enter **Tags** separated by commas.
   - Click **Add Selected Torrents**.

## Troubleshooting
- **Connection Issues**: Ensure the Web UI is enabled and the URL matches exactly (including `http://` and the port).
- **401 Unauthorized / Connection Errors**: 
  - Verify your username and password in the extension options.
  - In qBittorrent, go to `Tools` $\rightarrow$ `Options` $\rightarrow$ `Web UI` and consider:
    - Checking **"Bypass authentication for clients on localhost"**.
    - Unchecking **"Enable Host header validation"** if you are accessing qBittorrent via a specific hostname or proxy.
- **Path Errors**: Ensure the save path is an absolute path that the qBittorrent process has permissions to write to.
