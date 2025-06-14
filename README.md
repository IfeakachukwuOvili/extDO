# Schedule Sidebar Extension

A minimal, persistent sidebar task manager that helps you organize your tasks while browsing. The extension features a clean interface with a soothing sky blue and crimson color scheme, designed for optimal visibility and reduced eye strain.

## Features

- 🗂️ Persistent sidebar that works across all websites
- 📝 Create, edit, and delete tasks
- 📅 Set due dates and times (with validation for future dates)
- 📊 Weekly progress tracking with visual progress bar
- 🌓 Automatic dark mode support
- 💾 Local storage for task persistence
- 🎨 Eye-friendly color scheme

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

- Click the 🗂️ icon to toggle the sidebar
- Add tasks using the "+" button
- Click on task titles to view full details
- Set due dates and times for your tasks
- Track your weekly progress with the visual progress bar
- Tasks automatically save to your browser's local storage

## Color Scheme

- Light Theme:
  - Primary: Sky Blue (#87ceeb)
  - Secondary: Steel Blue (#4682b4)
  - Background: Light Sky Blue (#f0f8ff)
  - Accent: Crimson (#dc143c)

- Dark Theme:
  - Primary: Sky Blue (#87ceeb)
  - Background: Dark Navy (#1a2633)
  - Secondary: Light Navy (#1e2837)
  - Text: White (#f0f8ff)

## Technical Details

- Built with vanilla JavaScript
- Uses Chrome Storage API for data persistence
- Implements CSS modules for style isolation
- Responsive design that adapts to browser window
- Cross-browser dark mode support

## Permissions

The extension requires:
- `storage`: For saving tasks locally
- Access to all URLs: For sidebar functionality

## Browser Support

- Chrome: v88 or later
- Chromium-based browsers (Edge, Brave, etc.)

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/schedule-sidebar-extension

# Navigate to the project directory
cd schedule-sidebar-extension

# Install dependencies (if any)
npm install

# Load the extension in Chrome
1. Open chrome://extensions
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the extension directory
```

## File Structure

```
schedule-sidebar-extension/
├── manifest.json
├── content.js
├── sidebar.js
├── content.css
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Add your chosen license here]

## Credits

Developed by [Your Name]