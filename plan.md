# Fruit Fly Brain Piano AI - Master Project Plan

## 1. Project Objective
To build a **bio-inspired Reinforcement Learning (RL) system** where a simulated fruit fly brain (connectome) learns to play a virtual piano. The system is designed to **generalize musical logic**, meaning the fly learns *how* to play the piano interface itself, allowing it to perform completely new songs without retraining.

## 2. Hardware & Software Stack
*   **Hardware:** Laptop with NVIDIA RTX 4060 (8GB VRAM).
    *   *Role:* Handles 16+ parallel physics simulations and tensor operations simultaneously.
*   **Core Software:**
    *   **FlyGym 2.0:** Physics simulation with NVIDIA Warp backend (GPU-accelerated).
    *   **PyTorch:** Neural network management for the brain adapters.
    *   **Librosa / Mido:** Audio and MIDI processing tools.

---

## 3. System Architecture

### Module A: The "Perfect Data" Logic (The Teacher)
**Goal:** Mathematically compress complex human music into a format the fly can biologically understand.
*   **Input:** Raw Audio (.wav/.mp3) or MIDI (.mid).
*   **The Math (Chroma Quantizer):**
    *   **Frequency Analysis:** Extracts pitch frequencies from the audio.
    *   **Octave Folding:** Collapses high/low notes into a single pitch class (e.g., C2, C4, C5 $\rightarrow$ "C").
    *   **Chromatic Mapping:** Categorizes every sound into one of **12 Tones** (7 Natural + 5 Accidentals).
*   **Output:** A clean, 12-channel sensory stream (integers 0-11).

### Module B: The Bio-Digital Brain (The Agent)
**Goal:** Connect the processed audio signals to the fly's body.
*   **Sensory Input:** The 12-channel stream is wired to the fly's **AMMC (Auditory)** neurons.
*   **The Core (Frozen):** The biological connectome matrix (from FlyWire).
    *   *Note:* This section is **kept frozen** (weights locked) to preserve biological realism and save VRAM.
*   **Motor Output:** The fly's **VNC (Ventral Nerve Cord)** neurons.
    *   Activity in specific leg muscles is mapped to specific piano keys.
    *   *Example:* Left Front Leg Kick $\rightarrow$ Plays "C".

### Module C: The Physics Engine (The World)
**Goal:** Simulate the physical interaction.
*   **Environment:** A virtual arena containing the fly and a "phantom" piano interface.
*   **Feedback:** When the fly moves a leg, the system registers a "Key Press" event.

---

## 4. The Training Strategy (Reinforcement Learning)

### Phase 1: Interface Learning (The "Gym")
**Objective:** Teach the fly the mapping between Sound and Action.
1.  **Data Generation:** Feed the "Perfect Data" stream of a simple Training Song (e.g., Scales).
2.  **The Loop:**
    *   **Stimulus:** Fly hears "Note X" (Input Channel X).
    *   **Action:** Fly moves legs randomly.
    *   **Reward Function:**
        *   **Positive (+1.0):** Fly presses the key corresponding to Note X.
        *   **Negative (-1.0):** Fly presses the wrong key or does nothing.
3.  **Optimization:** Update the *synaptic weights* of the **Auditory Adapter** and **Motor Adapter** layers only.
4.  **Parallelism:** Run **16 to 32 flies** simultaneously on the RTX 4060 to speed up learning.

### Phase 2: The "Freeze" (Stop Training)
**Objective:** Lock in the learned logic.
*   Once the fly achieves **>95% accuracy** on the Training Song, **STOP** the optimizer.
*   Save the model weights. The fly now "knows" how to play the piano interface.

### Phase 3: Generalization (The Concert)
**Objective:** Prove true AI learning.
1.  **New Input:** Feed a completely new, complex song (e.g., *Für Elise*) into the Compressor.
2.  **Execution:** The fly hears the new signals. Because it learned the *relationship* (Sound A = Action A), it should play the new song correctly on the first try.
3.  **No Updates:** No backpropagation or training occurs during this phase.

---

## 5. Execution Roadmap

### Step 1: Environment Setup
- [ ] Install `flygym[warp,rl]`, `torch`, `librosa`.
- [ ] Verify RTX 4060 CUDA detection.

### Step 2: Build the Compressor
- [ ] Write the `Chromatic12Compiler` class.
- [ ] Test it on a complex MP3 to ensure it outputs clean 0-11 integers.

### Step 3: Connectome Integration
- [ ] Build the PyTorch `ConnectomeAdapter` class.
- [ ] Implement the `requires_grad=False` lock on the core brain layers.

### Step 4: The Training Run
- [ ] Load `Training_Song.mid`.
- [ ] Run the GPU Simulation loop for ~500 Epochs.
- [ ] Monitor the "Accuracy Score" graph.

### Step 5: Validation
- [ ] Load `New_Song.mid`.
- [ ] Run the fly in `eval()` mode.
- [ ] Record the output and listen to the result!
