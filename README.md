# Obsidian Workout Tracker Plugin

A comprehensive workout tracking plugin for Obsidian that helps you log exercises, track progress, and maintain your fitness routine within your notes.

## Features

- 🏋️ **Exercise Logging**: Track sets, reps, weights, duration, and distances
- 📝 **Workout Templates**: Create reusable workout templates for quick logging
- 📊 **Exercise Library**: Build your own exercise library with muscle group targeting
- 🎯 **Quick Actions**: Ribbon icon and command palette integration
- 📅 **Date Management**: Automatic date formatting and file organization
- 🔧 **Customizable**: Configurable folders, templates, and settings

## Installation

### Manual Installation (Development)

1. Clone or download this repository
2. Copy the plugin folder to your vault's `.obsidian/plugins/` directory
3. Install dependencies: `npm install`
4. Build the plugin: `npm run build`
5. Enable the plugin in Obsidian settings

### From Obsidian Community Plugins (Coming Soon)

This plugin will be available in the Obsidian Community Plugins directory once approved.

## Usage

### Creating a New Workout

1. Click the workout icon in the ribbon, or
2. Use the command palette: "Workout Tracker: Create New Workout"
3. Fill in workout details and add exercises
4. Save to create a new workout file

### Quick Workout Logging

Use "Workout Tracker: Quick Log Workout" to select from predefined workout templates for faster logging.

### Exercise Templates

Insert exercise templates directly into your notes using "Workout Tracker: Insert Exercise Template" command.

### Workout File Format

The plugin creates structured markdown files with tables for tracking:

```markdown
# Morning Run

**Date:** 2025-06-26
**Duration:** 30 minutes

## Exercises

### Running

| Set | Reps | Weight | Duration | Distance | Rest |
|-----|------|--------|----------|----------|------|
| 1   | -    | -      | 30       | 3        | -    |

**Notes:** Good pace, felt strong throughout
```

## Configuration

Access plugin settings through Settings → Community Plugins → Workout Tracker:

- **Default Workout Folder**: Where workout files are saved
- **Exercise Templates**: Pre-configured exercises with defaults
- **Workout Templates**: Complete workout routines
- **Date Format**: Customize how dates appear in files

## Development

### Setup

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Project Structure

- `main.ts` - Main plugin file with core functionality
- `manifest.json` - Plugin metadata
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `esbuild.config.mjs` - Build configuration

## Features in Detail

### Exercise Types Supported

- **Strength Training**: Sets, reps, weight tracking
- **Cardio**: Duration and distance tracking
- **Flexibility**: Duration and notes
- **Custom**: Flexible format for any exercise type

### Data Organization

- Workouts saved in configurable folder structure
- Automatic file naming with date and workout name
- Structured markdown format for easy reading and editing
- Compatible with other Obsidian plugins (dataview, calendar, etc.)

## Contributing



## License

MIT License - see LICENSE file for details

## Support

If you find this plugin helpful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs via GitHub issues
- 💡 Suggesting features

## Changelog

### 1.0.0
- Initial release
- Basic workout and exercise tracking
- Template system
- Settings configuration
- Ribbon and command palette integration
