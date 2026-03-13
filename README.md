# Live TV Player Setup 📺

A web-based live TV streaming application that integrates with Channels DVR to create custom playlists and watch live television from your browser.

## ✨ Features

- **📡 Channels DVR Integration**: Automatically discovers and syncs with your Channels DVR server
- **🎯 Custom Playlists**: Create personalized channel playlists for easy access
- **📱 Web-Based Player**: Watch live TV directly in your browser with HLS streaming
- **🔍 Channel Search**: Find channels and programs quickly
- **📊 Program Guide**: Real-time program information and progress tracking
- **⚙️ Easy Setup**: Simple web interface for configuration

## �🚀 Quick Start

### Prerequisites

- **Python 3.7+** installed on your system
- **Channels DVR Server** running on your network
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Download the application**
   ```bash
   # If you received this as a zip file, extract it first
   cd player_setup
   ```

2. **Set up Python environment**
   ```bash
   # Make setup script executable (Linux/Mac)
   chmod +x setup_venv.sh
   
   # Run the setup script
   ./setup_venv.sh
   ```
   
   **For Windows users:**
   ```cmd
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Start the application**
   ```bash
   # Activate the environment (if not already active)
   source venv/bin/activate  # Linux/Mac
   # OR
   venv\Scripts\activate     # Windows
   
   # Start the server
   python run.py
   ```

4. **Open in browser**
   - Navigate to: `http://localhost:7734`
   - The application will automatically try to discover your Channels DVR server

## 📋 Setup Guide

### Step 1: Server Discovery
1. Open the application in your browser
2. Click **"Go to Setup"** 
3. The app will automatically scan your network for Channels DVR servers
4. If found, your server details will be displayed

### Step 2: Channel Sync
1. Go to **Setup → Channels**
2. Click **"Sync Channels"** to import from your DVR server
3. Use the toggle switches to enable/disable channels
4. Only enabled channels will be available for playlists

### Step 3: Create Playlists
1. Navigate to **"Playlist Builder"**
2. Click **"Create Playlist"** 
3. Name your playlist
4. Add channels by clicking the **+** button next to each channel
5. Drag and drop to reorder channels
6. Click **"Save"** to store your playlist

### Step 4: Watch Live TV
1. Go to **"Live TV Player"**
2. Select a playlist from the dropdown
3. Click on any channel to start watching
4. Use the controls to switch channels or manage playlists

## 🎮 How to Use

### Creating Playlists
- **Create**: Click the "Create Playlist" button
- **Edit**: Click the pencil icon next to any playlist
- **Delete**: Click the trash icon (with confirmation)
- **Add Channels**: Use the + button in the Available Channels section
- **Remove Channels**: Use the × button in the playlist editor
- **Reorder**: Drag and drop channels within a playlist

### Watching TV
- **Select Playlist**: Use the dropdown in the player
- **Choose Channel**: Click any channel in the sidebar
- **Video Controls**: Standard browser video controls
- **Program Info**: Current program displays below the video
- **Stop/Switch**: Use stop button or click another channel

### Search & Navigation
- **Search Channels**: Use search box in setup or playlist builder
- **Quick Access**: Home page shows recent channels and featured programs
- **Direct Links**: Bookmark `http://localhost:7734/player` for quick access

## 🔧 Troubleshooting

### Common Issues

**🚫 "DVR Server Not Found"**
- Ensure Channels DVR is running on your network
- Check that both devices are on the same network
- Try manually entering your DVR server IP in browser: `http://DVR_IP:8089`

**📺 "No Channels Available"**
- Go to Setup → Channels and click "Sync Channels"
- Make sure channels are enabled (toggle switches)
- Verify your DVR has channels configured

**🎬 "Video Won't Play"**
- Check that your browser supports HLS video
- Try refreshing the page
- Ensure DVR server is accessible
- Check browser console for errors (F12)

**🔄 "Playlist Not Saving"**
- Make sure you clicked "Save" after making changes
- Check browser console for any error messages
- Try refreshing and attempting again

### Browser Requirements
- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Works on mobile browsers

### Network Requirements
- DVR server and web browser must be on same network
- Port 7734 must be available for the web application
- Port 8089 must be accessible for DVR communication

## 📁 File Structure

```
player_setup/
├── run.py                 # Main application entry point
├── requirements.txt       # Python dependencies
├── setup_venv.sh         # Setup script for Linux/Mac
├── activate_venv.sh      # Activation script
├── app/                  # Application code
│   ├── main/            # Main blueprint
│   ├── models/          # Database models
│   ├── services/        # External services
│   ├── static/          # CSS, images, etc.
│   └── templates/       # HTML templates
└── config/              # Configuration and database
```

## 🆘 Getting Help

### Debug Information
If you encounter issues, collect this information:

1. **Browser Console**: Press F12 → Console tab → copy any error messages
2. **Network Tab**: F12 → Network tab → look for failed requests
3. **DVR Status**: Note if your Channels DVR web interface works
4. **Browser Version**: Help → About in your browser
5. **Python Version**: Run `python --version`

### Log Files
The application prints helpful information to the terminal where you started it. Keep that window open for debugging.

### Performance Tips
- **Close unused browser tabs** for better video performance
- **Use wired connection** for best streaming quality
- **Check DVR server resources** if experiencing stuttering

## 🔒 Security Notes

- This application is designed for **local network use only**
- Do not expose to the internet without proper security measures
- All data is stored locally in the `config/` directory
- No personal information is transmitted outside your network

## 📝 Notes for Testers

### What to Test
1. **Initial Setup**: Can you discover and connect to your DVR?
2. **Channel Management**: Can you sync and enable/disable channels?
3. **Playlist Creation**: Can you create, edit, and delete playlists?
4. **Video Playback**: Does live TV stream properly?
5. **UI/UX**: Is the interface intuitive and responsive?
6. **Error Handling**: How does it behave with network issues?

### Test Environment
Please note:
- Your operating system and version
- Browser type and version
- Network setup (WiFi/Ethernet)
- Channels DVR version
- Number of channels in your setup

---

## Screenshots

<img width="1344" height="1342" alt="0  Auto Discovery" src="https://github.com/user-attachments/assets/e3345bb7-ae45-4877-b511-5c20ca3096ad" />

<img width="1344" height="1342" alt="1  Home Screen" src="https://github.com/user-attachments/assets/b83e470c-d85e-4bc0-91ee-94f4bee7aff4" />


