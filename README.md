# 🪰 FlyPiano 3D: Fruit Fly Brain Piano AI

[![Python 3.10-3.12](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![PyTorch 2.2+](https://img.shields.io/badge/PyTorch-2.2%2B-ee4c2c.svg)](https://pytorch.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL2-black.svg)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **FlyPiano 3D** is an embodied cybernetic simulation where a biologically modeled fruit fly (*Drosophila melanogaster*) listens to continuous musical audio and plays an **88-key concert grand piano** ($A_0 - C_8$) in real time using a recurrent biological brain connectome and articulated 6-legged biomechanics.

---

## 📸 What It Looks Like & Interface Layout

The web application runs locally at `http://localhost:8000` with a modern dark-mode glassmorphic interface:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🪰 BIO-AI FlyPiano 3D   [RTX 4060 · WebGL2 Active]  [🧠 Connectome 2.0]  [🎯 Live: 78.4%]│
├──────────────────────────────────────────────────────────┬─────────────────────────────┤
│                                                          │ 🎛️ CONTROL PANEL            │
│  [🎥 Camera: Perspective | Pianist | Fly POV | Top]      │                             │
│                                                          │ 🎼 Song Repertoire:         │
│  3D VIEWPORT:                                            │  🟢 Aria Math (Trained)     │
│   • 88-Key Concert Grand Piano (A0 – C8)                 │  🟢 GTA San Andreas (Trained│
│   • Articulated Drosophila Model                         │  🟢 C418 Sweden (Trained)   │
│     (Coxa, High-Knee Condyle, Tibia, Pulvilli Footpads)  │  🟡 Für Elise (Zero-Shot)   │
│   • Physical Downward Key Strikes & Shockwave Rings      │  🟡 Moonlight (Zero-Shot)   │
│   • Active Tonal Hammer & Damper Vibrations              │                             │
│                                                          │ 📂 Drag & Drop MIDI / Audio │
│  OVERLAY HUD:                                            ├─────────────────────────────┤
│  [Track: Aria Math] [🟢 TRAINED (21.4k Steps)]           │ 🧠 LIVE NEURAL MONITOR      │
│                                                          │ • Provenance: Trained 21.4k │
│                                                          │ • 88-Key Exact Match: 78.4% │
│                                                          │ • Pitch Accuracy: 84.1%     │
│                                                          │ • Latency: 1.8 ms           │
│                                                          │ • Target vs Fly Live Table  │
└──────────────────────────────────────────────────────────┴─────────────────────────────┘
```

- **3D Concert Stage**: Fully rendered Three.js scene with realistic grand piano materials (lacquered black wood, ivory keytops, brass pedal lyre, felt dampers).
- **Articulated Drosophila Kinematics**: 6 legs with 18 distinct joints, elevated body clearance, and true insect high-knee condyles. Legs physically strike downward onto keys using alternating tripod locomotion.
- **Live Intelligence & Generalization Monitor**: Note-by-note telemetry comparing ground-truth targets against the connectome's predictions in real time.
- **Biological Connectome Visualizer**: 13 pitch nodes and 8 octave bars glowing with live continuous softmax probabilities ($0.0 \to 1.0$).

---

## ⚙️ System Requirements & Hardware Compatibility

| Component | Minimum | Recommended |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS 12+, or Ubuntu 20.04+ | Windows 11 or Linux 64-bit |
| **Processor (CPU)** | Intel Core i5 (8th Gen) / AMD Ryzen 5 | Intel Core i7 / AMD Ryzen 7 |
| **Graphics (GPU)** | Integrated Graphics (Intel UHD 620+) | NVIDIA RTX 3060 / 4060 / 4070 or Apple Silicon M-Series |
| **RAM** | 8 GB | 16 GB+ |
| **Browser** | Chrome, Edge, Firefox, Safari (WebGL2 support) | Google Chrome / Microsoft Edge (Hardware Acceleration ON) |
| **Python** | Python 3.10 or 3.11 | Python 3.12 (required for FlyGym 2.0 / NVIDIA Warp) |

---

## 🚀 Step-by-Step Installation Guide

### 1. Clone or Open the Repository
```bash
cd e:/code/flypiano
```

---

### 2. Set Up a Python Virtual Environment (`venv`)

Creating an isolated virtual environment prevents dependency conflicts with your system packages:

#### On Windows (PowerShell):
```powershell
# Create the virtual environment
python -m venv venv

# If PowerShell script execution is restricted, temporarily permit it:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate the virtual environment
.\venv\Scripts\Activate.ps1
```

#### On Windows (Command Prompt):
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

#### On macOS / Linux (Bash / Zsh):
```bash
python3 -m venv venv
source venv/bin/activate
```

---

### 3. Install PyTorch (Tailored to Your Hardware)

> [!IMPORTANT]
> PyTorch installation commands differ based on your graphics hardware. Select the exact command below that matches your system:

#### A. NVIDIA GeForce / RTX GPUs (Windows & Linux)
For machines with dedicated NVIDIA GPUs (e.g. RTX 4060, RTX 3080, GTX 1660), install PyTorch with CUDA support:

- **CUDA 12.4 (Recommended for modern RTX 30xx / 40xx):**
  ```bash
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
  ```
- **CUDA 12.1:**
  ```bash
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
  ```
- **CUDA 11.8 (For older GTX or Pascal GPUs):**
  ```bash
  pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  ```

*Verify CUDA is working:*
```bash
python -c "import torch; print('CUDA Available:', torch.cuda.is_available(), '| Device:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
```

#### B. Apple Silicon (Mac M1, M2, M3, M4)
Apple Silicon utilizes Metal Performance Shaders (MPS) for hardware acceleration:
```bash
pip install torch torchvision torchaudio
```
*Verify MPS is working:*
```bash
python -c "import torch; print('MPS Available:', torch.backends.mps.is_available())"
```

#### C. CPU-Only (Machines Without a Dedicated GPU)
If you do not have an NVIDIA GPU, install the lightweight CPU wheel:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

---

### 4. Install Audio & Scientific Dependencies

Install the core mathematical, audio processing, and MIDI packages:
```bash
pip install numpy scipy mido librosa soundfile matplotlib
```
Or install directly from the manifest:
```bash
pip install -r requirements.txt
```

---

### 5. Optional: FlyGym & NVIDIA Warp (Embodied Physics)

FlyPiano includes an optional embodied insect physics module powered by **FlyGym 2.0** and **NVIDIA Warp**:
- **FlyGym**: Biomechanical simulation framework developed by the Neuroengineering Laboratory at EPFL, modeling *Drosophila* muscle actuation and joint constraints.
- **NVIDIA Warp**: High-performance GPU kernel framework for spatial computing and physics.

#### Prerequisites for FlyGym & Warp:
1. Requires **Python 3.12** or newer.
2. Windows requires **Visual Studio Build Tools (C++)** or Clang for Warp compilation.
3. Install via:
   ```bash
   pip install warp-lang mujoco flygym
   ```

> [!NOTE]
> FlyGym and Warp are **entirely optional**. If they are not installed on your system, `main.py` automatically falls back to the native mathematical simulation mode without crashing or losing functionality.

---

## 🏃 Quickstart: Running FlyPiano

### 1. Launch the Interactive Web Visualizer
Start the local server:
```bash
python main.py --serve
```
Open your browser and navigate to:
```
http://localhost:8000
```
- Click any preset song button (e.g. *Aria Math*, *GTA San Andreas*, *Für Elise*).
- Click **▶ Play** to start the simulation.
- Rotate the camera with left-click drag, pan with right-click drag, and zoom with scroll wheel.
- Switch camera angles using the top buttons: **Perspective**, **Pianist POV**, **Fly Close-up**, or **Top Down**.

---

### 2. Retraining the Connectome Adapter
To re-train the biological adapter on all 21,431 ticks and re-export the browser weights:
```bash
python train_and_export.py
```
This script will:
1. Re-run `build_dataset.py` to extract 14-D features with multi-window averaging.
2. Train the multi-head adapter (`pitch_head`, `octave_head`, `force_head`) with rest-masked octave loss.
3. Benchmark generalization on held-out J.S. Bach Cello Suite No. 1.
4. Export updated `fly_piano_multihead_adapter.pt` and `fly_connectome_weights.json`.

---

### 3. Diagnosing Model Health
To verify that the neural network has not suffered mode collapse and is responding dynamically to different pitch registers:
```bash
python diagnose_collapse.py
```
This tests synthetic Low ($A_0$), Mid ($C_4$), High ($C_8$), and Rest vectors and prints the resulting logits and softmax confidence.

---

## 🧠 Understanding Dataset Provenance & Generalization

FlyPiano explicitly distinguishes between **in-repertoire trained data** and **zero-shot generalization**:

| Badge | Type | Songs | What It Tests |
| :---: | :--- | :--- | :--- |
| 🟢 **TRAINED** | In-Repertoire (21.4k Steps) | *Aria Math*, *GTA San Andreas Theme*, *C418 - Sweden*, *88-Key Scale* | Model memorization and reproductive precision across known musical arrangements. |
| 🟡 **ZERO-SHOT** | Unseen Test Music | *Für Elise*, *Moonlight Sonata*, *Ode to Joy*, *Bach Prelude*, User Uploads | Genuine neural generalization. Tests whether the connectome can map novel auditory patterns to keys without prior exposure. |
| 🟣 **HELD-OUT** | Evaluation Benchmark | *Held-out Bach Test Suite* (677 samples) | Standardized held-out validation baseline (achieving 78.1% pitch accuracy and 0.0079 velocity error). |

---

## 🛠️ Ingesting Custom MIDI or Audio

You can drag and drop your own files directly into the FlyPiano browser window:
- **MIDI Files (`.mid`, `.midi`)**: Decoded via the built-in browser SMF parser (`StandardMidiParser`). Automatically filters out drum track channel 9 and extracts multi-track note events.
- **Audio Files (`.mp3`, `.wav`, `.ogg`)**: Ingested via Web Audio API, extracting real-time YIN pitch, 12-bin chromagrams, and RMS onset energy.

---

## 📁 Architectural Deep-Dive

For a complete mathematical and biological breakdown of the 512-neuron reservoir, 14-D AMMC auditory vector, kinematics, and loss functions, refer to:
👉 **[ARCHITECTURE.md](file:///e:/code/flypiano/ARCHITECTURE.md)**

---

## 📄 License
This project is open-source under the MIT License.
