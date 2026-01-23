# Channels DVR Player 📺

A containerized, web-based live TV streaming application that integrates with Channels DVR. Create custom playlists, manage channels, and watch live television directly from your browser.

## ✨ Features

- **Docker Native**: Zero-dependency installation using Docker containers.
- **📡 Auto-Discovery**: Automatically finds your Channels DVR server using mDNS (requires host networking).
- **🎯 Custom Playlists**: Create personalized channel lineups for specific moods or family members.
- **📱 Web-Based Player**: HLS streaming directly in Chrome, Firefox, Safari, or Edge.
- **📊 Program Guide**: Real-time program information and progress tracking.
- **💾 Persistent Data**: Database and settings are saved to a dedicated volume, surviving container updates.

---

## 🚀 Quick Start

### Prerequisites
- **Docker** and **Docker Compose** installed on your machine.
- A running **Channels DVR Server** on your local network.

### Installation

1. **Clone or Download** this repository:
   ```bash
   git clone [https://github.com/your-username/channels-dvr-player.git](https://github.com/your-username/channels-dvr-player.git)
   cd channels-dvr-player

```

2. **Configure Environment (Optional)**:
You can edit `docker-compose.yml` directly or create a `.env` file to set your preferences (timezone, port, etc.).
```bash
cp .env.example .env

```


3. **Start the Container**:
```bash
docker compose up -d

```


4. **Open in Browser**:
Navigate to `http://localhost:7734`.
*Note: The application will automatically scan your network for the DVR server. If you are running this on Linux, ensure Avahi/Bonjour doesn't block mDNS.*

---

## ⚙️ Configuration

Configuration is managed via environment variables in `docker-compose.yml`.

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `7734` | The web port for the player interface. |
| `TZ` | `America/New_York` | Timezone for correct Program Guide (EPG) times. |
| `FLASK_DEBUG` | `false` | Set to `true` only for development/debugging. |
| `SECRET_KEY` | *(Random)* | Security key for session management. Change this! |

### Volumes

Data persistence is handled by the mapped volume in `docker-compose.yml`:

* `./config:/app/config`: Stores the SQLite database (`channels.db`) and settings.

---

## 🎮 How to Use

### 1. Initial Setup

On first launch, the app will try to auto-discover your DVR.

* If found, click **"Sync Channels"** to import your lineup.
* Use the toggle switches to enable/disable specific channels (disabled channels won't show in playlists).

### 2. Creating Playlists

1. Go to **Playlist Builder**.
2. Click **Create Playlist** and give it a name (e.g., "Sports", "Morning News").
3. Click the **+** button on channels to add them.
4. Drag and drop channels to reorder them.
5. **Save** your changes.

### 3. Watching TV

1. Go to **Live TV Player**.
2. Select your playlist from the dropdown menu.
3. Click a channel to start the stream.

---

## 🔧 Troubleshooting

### 🚫 "DVR Server Not Found"

Because this app runs in a container, it relies on the host's network stack to find your DVR via Bonjour/mDNS.

1. Ensure your `docker-compose.yml` has `network_mode: host`.
2. Check that the machine running Docker is on the same subnet as your Channels DVR.
3. If auto-discovery fails, you can manually enter your DVR's IP address in the Setup page.

### 📺 "Video Won't Play"

* Check the container logs for errors:
```bash
docker compose logs -f

```


* Ensure your browser supports HLS (modern Chrome, Edge, Safari, Firefox all work).

### 🔄 Resetting the App

If you need to wipe everything and start fresh:

1. Stop the container: `docker compose down`
2. Delete the local config database: `rm config/channels.db`
3. Restart: `docker compose up -d`

---

## 📁 Project Structure

```text
/app
├── blueprints/      # Route logic (UI and API separated)
├── models/          # Database models (SQLite)
├── services/        # Backend logic (mDNS, Playlist Parsing)
├── static/          # CSS, JS, Images
└── templates/       # HTML Frontend
config/              # Persistent storage (Database lives here)
Dockerfile           # Image build instructions
docker-compose.yml   # Container orchestration
requirements.txt     # Python dependencies

```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
