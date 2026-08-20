# 💺 Man in the Chair – 3D Holographic Twitter / X Video Command Deck

An immersive, cyberpunk "Man in the Chair" command center that captures, streams, and projects multiple Twitter/X videos simultaneously in an interactive 3D holographic spatial matrix.

![Screenshot](https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=600&fit=crop)

---

## 🌟 Highlights & Features

- **Simultaneous Multi-Video 3D Array:** Plays multiple video feeds simultaneously arranged in 3D space with zero latency.
- **Dual-Engine Rendering:**
  - ⚡ **GPU Mode (Three.js / WebGL):** Full WebGL shaders, particle simulations, dynamic lighting, and orbital flight.
  - 💻 **CPU / Software Mode (Universal CSS 3D):** 100% GPU-independent. Runs on software rasterization inside virtual machines (Hyper-V, VMware, WSL) and lower-power hardware.
- **3 Dynamic Spatial Layouts:**
  - 🌐 **Curved Dome:** Panoramic amphitheater curving around the seated operator.
  - 📊 **Flat Matrix:** High-density command wall.
  - 🌀 **360° Cylinder:** Continuous cylindrical array enclosing the operator.
- **Screen Calibration & Layout Saving:**
  - Add more screens on the fly via the `[➕ ADD SCREEN]` modal.
  - Fine-tune individual screens with interactive sliders (Scale, Position X/Y/Z, Angle Y, or Remove).
  - Save custom configurations with `[💾 SAVE LAYOUT]` and restore them with `[↺ LOAD]`.
- **Intuitive Camera Navigation:**
  - Drag mouse to look / pan.
  - Mouse wheel to zoom.
  - WASD / Arrow keys for flight controls.
  - `[🎯 RESET CAM]` / Spacebar to instantly center your view in the cockpit seat.
- **Real-Time Topic Search & Extraction:** Search any topic, keyword, or hashtag, or paste a direct Twitter/X tweet URL with video.

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+
- `uv` (recommended) or `pip`
- `ffmpeg` (optional, for synthetic video generation)

### Run with one command:
```bash
git clone https://github.com/Flatterland/ManInTheChair.git
cd ManInTheChair
chmod +x start.sh
./start.sh
```

Or manually:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Open **[http://localhost:8080](http://localhost:8080)** in your browser.

---

## 🎮 Controls

| Action | Control |
|---|---|
| **Look / Pan** | Left Click + Drag or Mouse Move |
| **Zoom In / Out** | Mouse Wheel |
| **Pan / Fly** | `W` `A` `S` `D` or `Arrow Keys` |
| **Center View** | `Spacebar` or `[🎯 RESET CAM]` |
| **Focus Screen & Solo Audio** | Left Click on any floating screen |
| **Toggle GPU / CPU Mode** | Top HUD `[💻 CPU / ⚡ GPU]` toggle |

---

## 📄 License
MIT License. Built by Google DeepMind Antigravity Agentic Pair Programming.
