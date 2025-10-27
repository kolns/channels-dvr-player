# Live TV Player 📺

A web-based live TV streaming application that integrates with Channels DVR to create custom playlists and watch live television from your browser.

## ✨ Features

  - **🐳 Docker Support**: Easy to deploy and manage as a containerized application.
  - **📡 Channels DVR Integration**: Automatically discovers and syncs with your Channels DVR server.
  - **🎯 Custom Playlists**: Create personalized channel playlists for easy access.
  - **📱 Web-Based Player**: Watch live TV directly in your browser with HLS streaming.
  - **🔍 Channel Search**: Find channels and programs quickly.
  - **📊 Program Guide**: Real-time program information and progress tracking.
  - **⚙️ Easy Setup**: Simple web interface for configuration.

-----

## 🚀 Quick Start with Docker (Recommended)

This is the easiest and recommended way to get started.

### Prerequisites

  - **Docker** installed on your system.
  - **Channels DVR Server** running on your network.

### Installation & Setup

1.  **Download and Extract the Application**

      * Go to the GitHub repository for this project.
      * Click the green **"Code"** button and select **"Download ZIP"**.
      * Extract the contents of the ZIP file to a location on your computer.

2.  **Build the Docker Image**

      * Open a terminal (Command Prompt, PowerShell, or Terminal).
      * Navigate into the extracted folder (e.g., `cd channels-dvr-player-main`).
      * Run the following command to build the Docker image:
        ```bash
        docker build -t channels-dvr-player .
        ```

3.  **Create a Docker Volume for Persistent Storage**

      * This command creates a managed volume to safely store your database and configuration files. This ensures your data persists even if you update or remove the container.
        ```bash
        docker volume create channels-dvr-config
        ```

4.  **Run the Docker Container**

      * Execute the command below to start the application. It will run in the background and restart automatically if your system reboots.
        ```bash
        docker run -d --restart unless-stopped -p 7734:7734 -v channels-dvr-config:/app/config --name channels-dvr-player channels-dvr-player
        ```

5.  **Open in Browser**

      * Navigate to: `http://localhost:7734`
      * The application will automatically try to discover your Channels DVR server and guide you through the first-time setup.

### Managing the Docker Container

  - **To stop the container:**
    ```bash
    docker stop channels-dvr-player
    ```
  - **To start the container again:**
    ```bash
    docker start channels-dvr-player
    ```
  - **To view the application logs:**
    ```bash
    docker logs -f channels-dvr-player
    ```
  - **To remove the container** (your data will be safe in the volume):
    ```bash
    docker rm -f channels-dvr-player
    ```

-----

## 📋 Manual Installation (Alternate Method)

### Prerequisites

  - **Python 3.7+** installed on your system.
  - **Modern web browser** (Chrome, Firefox, Safari, Edge).

### Installation Steps

1.  **Download and Extract the application** as described in the Docker steps.

2.  **Set up Python environment**

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

3.  **Start the application**

    ```bash
    # Activate the environment (if not already active)
    source venv/bin/activate  # Linux/Mac
    # OR
    venv\Scripts\activate     # Windows

    # Start the server
    python app.py
    ```

-----

## 🔧 Troubleshooting

### Common Issues

**🚫 "DVR Server Not Found"**

  - Ensure Channels DVR is running on your network.
  - Check that both devices (or the Docker container's host) are on the same network.
  - Try manually entering your DVR server IP in your browser: `http://DVR_IP:8089`

**📺 "No Channels Available"**

  - Go to **Setup → Channel Sync** and click **"Update Channels"**.
  - Make sure channels are enabled in **Setup → Channel Management**.

**🎬 "Video Won't Play"**

  - Ensure your browser supports HLS video.
  - Check the application logs (`docker logs -f channels-dvr-player`) for errors.

### Network Requirements

  - Your DVR server and the computer running the Docker container must be on the same network.
  - Port `7734` must be available on the host machine.
  - Port `8089` must be accessible for DVR communication.

## 🔒 Security Notes

  - This application is designed for **local network use only**.
  - Do not expose the application port to the internet without proper security measures (like a reverse proxy with authentication).
  - All data is stored locally in the `config/` directory or the `channels-dvr-config` Docker volume.